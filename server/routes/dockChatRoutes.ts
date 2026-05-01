/**
 * DockChat — Internal Communications routes (Phase 35C, schema-corrected)
 *
 * Mounted at /api/chat/dock/* by domains/comms.ts.  Persists into the canonical
 * chat_messages / chat_conversations tables — earlier revisions of this file
 * wrote to columns that did not exist (`content`, `metadata`, `client_message_id`,
 * `delivery_status`, `sequence_number`), which 500'd silently.  This rewrite
 * uses the actual Drizzle schema:
 *   chat_messages:      message, sender_id, sender_name, sender_type,
 *                       conversation_id, message_type
 *   chat_conversations: id, workspace_id, conversation_type, status, subject
 *
 * Each organization_chat_rooms row carries a conversation_id — created lazily
 * on first use so legacy rooms keep working.
 */
import { sanitizeError } from '../middleware/errorHandler';
import { Router } from "express";
import { pool } from "../db";
import { requireAuth, requireManager, type AuthenticatedRequest } from "../rbac";
import { createNotification } from "../services/notificationService";

const router = Router();

function getQueryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const BOT_COMMANDS = [
  { prefix: "/schedule", description: "Check your upcoming schedule", minRole: "staff" },
  { prefix: "/calloff", description: "Submit a call-off request", minRole: "staff" },
  { prefix: "/incident", description: "File a quick incident report", minRole: "staff" },
  { prefix: "/roster", description: "View today's roster", minRole: "staff" },
  { prefix: "/help", description: "List all available commands", minRole: "staff" },
  { prefix: "/trinity", description: "Ask Trinity anything", minRole: "staff" },
];

/**
 * Resolve the chat_conversations.id backing a DockChat room.  Creates the
 * conversation row on demand if the room was created before this rewrite
 * (legacy rooms had `conversation_id = NULL`).
 */
async function ensureRoomConversation(roomId: string, workspaceId: string): Promise<string | null> {
  const room = await pool.query(
    `SELECT id, conversation_id, room_name FROM organization_chat_rooms
     WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
    [roomId, workspaceId],
  );
  const r = room.rows[0];
  if (!r) return null;
  if (r.conversation_id) return r.conversation_id;

  const created = await pool.query(
    `INSERT INTO chat_conversations
       (workspace_id, subject, status, conversation_type, visibility)
     VALUES ($1, $2, 'active', 'open_chat', 'workspace')
     RETURNING id`,
    [workspaceId, r.room_name || 'DockChat Room'],
  );
  const conversationId = created.rows[0].id;
  await pool.query(
    `UPDATE organization_chat_rooms SET conversation_id = $1, updated_at = NOW() WHERE id = $2`,
    [conversationId, r.id],
  );
  return conversationId;
}

async function getDisplayName(userId: string): Promise<string> {
  const r = await pool.query(
    `SELECT first_name, last_name, email FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const u = r.rows[0];
  if (!u) return 'User';
  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return name || u.email || 'User';
}

// ── ROOMS ──────────────────────────────────────────────────────────────────

router.get("/rooms", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    const uid = req.user?.id;
    if (!wid) return res.status(400).json({ error: "Workspace required" });

    const { rows } = await pool.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM chat_messages m
         WHERE m.workspace_id = r.workspace_id
           AND m.conversation_id = r.conversation_id
           AND m.created_at > COALESCE(rm.last_active_at, '1970-01-01')) AS unread_count,
        (SELECT message FROM chat_messages m2
         WHERE m2.workspace_id = r.workspace_id
           AND m2.conversation_id = r.conversation_id
         ORDER BY m2.created_at DESC LIMIT 1) AS last_message
       FROM organization_chat_rooms r
       LEFT JOIN organization_room_members rm ON rm.room_id = r.id AND rm.user_id = $2
       WHERE r.workspace_id = $1 AND r.status = 'active'
         AND rm.user_id IS NOT NULL
       ORDER BY r.created_at DESC`,
      [wid, uid],
    );
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

router.post("/rooms", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    const uid = req.user?.id;
    if (!wid || !uid) return res.status(400).json({ error: "Workspace and auth required" });
    const { roomName, description, memberIds } = req.body;
    if (!roomName) return res.status(400).json({ error: "roomName required" });

    const slug = roomName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const userName = await getDisplayName(uid);

    // Conversation row first, room references it.
    const conv = await pool.query(
      `INSERT INTO chat_conversations
         (workspace_id, subject, status, conversation_type, visibility, customer_id, customer_name)
       VALUES ($1, $2, 'active', 'open_chat', 'workspace', $3, $4)
       RETURNING id`,
      [wid, roomName, uid, userName],
    );
    const conversationId = conv.rows[0].id;

    const { rows } = await pool.query(
      `INSERT INTO organization_chat_rooms
         (workspace_id, room_name, room_slug, description, created_by, conversation_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [wid, roomName, `${slug}-${Date.now()}`, description || null, uid, conversationId],
    );
    const room = rows[0];

    await pool.query(
      `INSERT INTO organization_room_members (room_id, user_id, workspace_id, role, is_approved)
       VALUES ($1, $2, $3, 'owner', true) ON CONFLICT DO NOTHING`,
      [room.id, uid, wid],
    );
    await pool.query(
      `INSERT INTO chat_participants
         (conversation_id, workspace_id, participant_id, participant_name, participant_role, is_active, joined_at)
       VALUES ($1, $2, $3, $4, 'owner', true, NOW())`,
      [conversationId, wid, uid, userName],
    );

    if (Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId === uid) continue;
        await pool.query(
          `INSERT INTO organization_room_members (room_id, user_id, workspace_id, role, is_approved)
           VALUES ($1, $2, $3, 'member', true) ON CONFLICT DO NOTHING`,
          [room.id, memberId, wid],
        );
        const memberName = await getDisplayName(memberId);
        await pool.query(
          `INSERT INTO chat_participants
             (conversation_id, workspace_id, participant_id, participant_name, participant_role, is_active, joined_at)
           VALUES ($1, $2, $3, $4, 'member', true, NOW())`,
          [conversationId, wid, memberId, memberName],
        );
      }
    }
    res.status(201).json(room);
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

// ── MESSAGES ───────────────────────────────────────────────────────────────

router.get("/rooms/:roomId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    if (!wid) return res.status(400).json({ error: "Workspace required" });
    const { roomId } = req.params;
    const page = Number.parseInt(getQueryString(req.query.page) || "1", 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    const conversationId = await ensureRoomConversation(roomId, wid);
    if (!conversationId) return res.status(404).json({ error: "Room not found" });

    const { rows } = await pool.query(
      `SELECT m.*, u.first_name, u.last_name
       FROM chat_messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.workspace_id = $1 AND m.conversation_id = $2
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [wid, conversationId, limit, offset],
    );
    res.json({ messages: rows.reverse(), page, limit });
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

router.post("/rooms/:roomId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    const uid = req.user?.id;
    if (!wid || !uid) return res.status(400).json({ error: "Auth required" });
    const { roomId } = req.params;
    const { content, messageType } = req.body;
    if (!content || typeof content !== 'string') return res.status(400).json({ error: "content required" });

    const conversationId = await ensureRoomConversation(roomId, wid);
    if (!conversationId) return res.status(404).json({ error: "Room not found" });

    const roomCheck = await pool.query(
      `SELECT status FROM chat_conversations WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
      [conversationId, wid],
    );
    if (roomCheck.rows[0]?.status === 'closed') {
      return res.status(403).json({
        error: "This room has been archived. It is now read-only.",
        code: "ROOM_ARCHIVED",
      });
    }

    if (content.startsWith("/")) {
      return handleBotCommand(req, res, roomId, conversationId, content, wid, uid);
    }

    const senderName = await getDisplayName(uid);
    const isTrinityMention = /@trinity/i.test(content);

    const { rows } = await pool.query(
      `INSERT INTO chat_messages
         (workspace_id, conversation_id, sender_id, sender_name, sender_type, message, message_type)
       VALUES ($1, $2, $3, $4, 'customer', $5, $6)
       RETURNING *`,
      [wid, conversationId, uid, senderName, content, messageType || 'text'],
    );
    await pool.query(
      `UPDATE chat_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    if (isTrinityMention) {
      // Awaited fire-and-track: Trinity replies in the room within seconds.
      handleTrinityMention(wid, roomId, conversationId, uid, content)
        .catch(() => null);
    }

    // @mention notifications — properly awaited per Section B fire-and-forget law.
    const mentionMatches = content.match(/@(\w+)/g) || [];
    for (const mention of mentionMatches) {
      const handle = mention.slice(1);
      if (/trinity/i.test(handle)) continue;
      try {
        const userRes = await pool.query(
          `SELECT id FROM users WHERE workspace_id IS NULL OR id IN
             (SELECT user_id FROM organization_room_members WHERE room_id = $2)
           AND (lower(first_name) = lower($1) OR lower(email) = lower($1))
           LIMIT 1`,
          [handle, roomId],
        );
        const target = userRes.rows[0];
        if (target) {
          await createNotification({
            userId: target.id,
            workspaceId: wid,
            title: "You were mentioned",
            message: content.slice(0, 80),
            type: "mention",
            actionUrl: `/dock-chat?room=${roomId}`,
            idempotencyKey: `mention-${rows[0].id}-${target.id}`,
          });
        }
      } catch { /* non-fatal */ }
    }

    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

router.post("/rooms/:roomId/broadcast", requireManager, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    const uid = req.user?.id;
    if (!wid || !uid) return res.status(400).json({ error: "Auth required" });
    const { roomId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "content required" });

    const conversationId = await ensureRoomConversation(roomId, wid);
    if (!conversationId) return res.status(404).json({ error: "Room not found" });
    const senderName = await getDisplayName(uid);

    const { rows } = await pool.query(
      `INSERT INTO chat_messages
         (workspace_id, conversation_id, sender_id, sender_name, sender_type, message, message_type, is_system_message)
       VALUES ($1, $2, $3, $4, 'support', $5, 'announcement', true)
       RETURNING *`,
      [wid, conversationId, uid, senderName, content],
    );

    const members = await pool.query(
      `SELECT user_id FROM organization_room_members WHERE room_id = $1 AND workspace_id = $2 AND user_id != $3`,
      [roomId, wid, uid],
    );
    for (const m of members.rows) {
      await createNotification({
        userId: m.user_id,
        workspaceId: wid,
        title: "Broadcast Message",
        message: content.slice(0, 100),
        type: "broadcast",
        actionUrl: `/dock-chat?room=${roomId}`,
        idempotencyKey: `broadcast-${rows[0].id}-${m.user_id}`,
      }).catch(() => null);
    }
    res.status(201).json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

// ── DIRECT MESSAGES ─────────────────────────────────────────────────────────

router.get("/direct/:targetUserId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    const uid = req.user?.id;
    if (!wid || !uid) return res.status(400).json({ error: "Auth required" });
    const { targetUserId } = req.params;

    const slug = `dm-${[uid, targetUserId].sort().join("-")}`;
    const existing = await pool.query(
      `SELECT * FROM organization_chat_rooms
       WHERE workspace_id = $1 AND room_slug = $2 LIMIT 1`,
      [wid, slug],
    );
    if (existing.rows[0]) return res.json(existing.rows[0]);

    const userName = await getDisplayName(uid);
    const targetName = await getDisplayName(targetUserId);

    const conv = await pool.query(
      `INSERT INTO chat_conversations
         (workspace_id, subject, status, conversation_type, visibility, customer_id, customer_name, support_agent_id, support_agent_name)
       VALUES ($1, $2, 'active', 'dm_user', 'private', $3, $4, $5, $6)
       RETURNING id`,
      [wid, `DM: ${userName} & ${targetName}`, uid, userName, targetUserId, targetName],
    );
    const conversationId = conv.rows[0].id;

    const { rows } = await pool.query(
      `INSERT INTO organization_chat_rooms
         (workspace_id, room_name, room_slug, created_by, conversation_id)
       VALUES ($1, 'Direct Message', $2, $3, $4) RETURNING *`,
      [wid, slug, uid, conversationId],
    );
    const room = rows[0];
    for (const memberId of [uid, targetUserId]) {
      const memberName = memberId === uid ? userName : targetName;
      await pool.query(
        `INSERT INTO organization_room_members (room_id, user_id, workspace_id, role, is_approved)
         VALUES ($1, $2, $3, 'member', true) ON CONFLICT DO NOTHING`,
        [room.id, memberId, wid],
      );
      await pool.query(
        `INSERT INTO chat_participants
           (conversation_id, workspace_id, participant_id, participant_name, participant_role, is_active, joined_at)
         VALUES ($1, $2, $3, $4, 'member', true, NOW())`,
        [conversationId, wid, memberId, memberName],
      );
    }
    res.status(201).json(room);
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

// ── BOT COMMANDS ────────────────────────────────────────────────────────────

router.get("/commands", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const wid = req.workspaceId;
    if (!wid) return res.status(400).json({ error: "Workspace required" });
    const { rows: custom } = await pool.query(
      `SELECT * FROM chat_bot_commands WHERE workspace_id = $1 AND is_enabled = true ORDER BY command_prefix`,
      [wid],
    );
    res.json({ builtin: BOT_COMMANDS, custom });
  } catch (err: any) { res.status(500).json({ error: sanitizeError(err) }); }
});

// ── HELPERS ─────────────────────────────────────────────────────────────────

async function handleBotCommand(
  req: AuthenticatedRequest, res: any, roomId: string, conversationId: string,
  content: string, wid: string, uid: string,
) {
  const parts = content.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const senderName = await getDisplayName(uid);
  let botResponse = "";

  switch (cmd) {
    case "/help":
      botResponse = "**Available Commands:**\n" + BOT_COMMANDS.map(c => `• ${c.prefix} — ${c.description}`).join("\n");
      break;
    case "/schedule": {
      const { rows: shifts } = await pool.query(
        `SELECT s.start_time, s.end_time, s.site_name
         FROM shifts s
         JOIN employees e ON e.user_id = $2
         WHERE s.workspace_id = $1 AND s.employee_id = e.id AND s.start_time >= NOW()
         ORDER BY s.start_time LIMIT 5`,
        [wid, uid],
      );
      botResponse = shifts.length > 0
        ? "**Your upcoming shifts:**\n" + shifts.map(s =>
            `• ${new Date(s.start_time).toLocaleString()} — ${s.site_name || "Site TBD"}`,
          ).join("\n")
        : "No upcoming shifts found.";
      break;
    }
    case "/calloff":
      botResponse = "To submit a call-off, go to **My Shifts** in the shift trading section. A manager will be notified.";
      break;
    case "/incident":
      botResponse = "To file an incident report, go to **Field Ops → Incidents**. Need help? Type `/trinity how do I file an incident?`";
      break;
    case "/roster": {
      const { rows: roster } = await pool.query(
        `SELECT e.first_name, e.last_name, s.site_name
         FROM shifts s JOIN employees e ON e.id = s.employee_id
         WHERE s.workspace_id = $1 AND s.start_time::date = CURRENT_DATE`,
        [wid],
      );
      botResponse = roster.length > 0
        ? "**Today's roster:**\n" + roster.map(r => `• ${r.first_name} ${r.last_name} — ${r.site_name || "TBD"}`).join("\n")
        : "No shifts scheduled for today.";
      break;
    }
    case "/trinity": {
      const query = parts.slice(1).join(" ");
      if (!query) {
        botResponse = "Ask Trinity anything: `/trinity your question here`";
      } else {
        try {
          const { trinityChatService } = await import("../services/ai-brain/trinityChatService");
          const result = await trinityChatService.chat({
            userId: uid,
            workspaceId: wid,
            message: query,
            mode: "business",
            sessionId: `chatdock-${roomId}-${uid}`,
          });
          botResponse = (result?.response && typeof result.response === "string" && result.response.trim())
            ? result.response
            : "I was unable to process that request.";
        } catch {
          botResponse = "Trinity is temporarily unavailable. Please try again shortly.";
        }
      }
      break;
    }
    default:
      botResponse = `Unknown command: ${cmd}. Type /help for available commands.`;
  }

  await pool.query(
    `INSERT INTO chat_messages
       (workspace_id, conversation_id, sender_id, sender_name, sender_type, message, message_type)
     VALUES ($1, $2, $3, $4, 'customer', $5, 'command')`,
    [wid, conversationId, uid, senderName, content],
  );
  const { rows } = await pool.query(
    `INSERT INTO chat_messages
       (workspace_id, conversation_id, sender_id, sender_name, sender_type, message, message_type)
     VALUES ($1, $2, NULL, 'DockBot', 'bot', $3, 'text')
     RETURNING *`,
    [wid, conversationId, botResponse],
  );
  res.status(201).json({ userMessage: content, botResponse: rows[0] });
}

async function handleTrinityMention(
  wid: string, roomId: string, conversationId: string, uid: string, content: string,
) {
  let response = "I was unable to process that request.";
  try {
    const { trinityChatService } = await import("../services/ai-brain/trinityChatService");
    const cleaned = content.replace(/@[Tt]rinity/g, "").trim();
    const result = await trinityChatService.chat({
      userId: uid,
      workspaceId: wid,
      message: cleaned,
      mode: "business",
      sessionId: `chatdock-${roomId}-${uid}`,
    });
    if (result?.response && typeof result.response === "string" && result.response.trim()) {
      response = result.response;
    }
  } catch (err: any) {
    try {
      const { createLogger } = await import("../lib/logger");
      createLogger("DockChatTrinity").warn("Trinity mention failed (non-fatal):", err?.message);
    } catch { /* non-fatal */ }
  }

  try {
    await pool.query(
      `INSERT INTO chat_messages
         (workspace_id, conversation_id, sender_id, sender_name, sender_type, message, message_type)
       VALUES ($1, $2, NULL, 'Trinity', 'bot', $3, 'text')`,
      [wid, conversationId, response],
    );
  } catch { /* non-fatal */ }
}

export default router;
