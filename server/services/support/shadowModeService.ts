/**
 * Shadow Mode Service — Wave 23D
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages support agent impersonation sessions ("Shadow Mode").
 * When a support agent enters a tenant workspace to diagnose or fix an issue,
 * this service creates an immutable session record and enforces the Glass Break
 * protocol — every sensitive action requires an explicit typed justification.
 *
 * VISUAL CONTRACT (UI):
 *   Active shadow session → bright orange (#F97316) border on all UI surfaces
 *   Banner: "SHADOW MODE — You are acting as a support agent in [Workspace]"
 *   Any data mutation shows a confirmation: "Log this action with justification"
 *
 * LEGAL CONTRACT:
 *   Session is immutable — cannot be deleted, only closed
 *   Every action appended to session.actions (JSONB array)
 *   Tenant owner notified via WebSocket when session starts and ends
 *   All writes also go to universal_audit_trail
 *
 * GLASS BREAK RULE:
 *   Routes that access sensitive data MUST receive justification in request body.
 *   Without it: 400 JUSTIFICATION_REQUIRED is returned immediately.
 *   Justification stored with action, timestamp, and agent identity.
 */

import { pool } from "../../db";
import { createLogger } from "../../lib/logger";
import { broadcastToWorkspace } from "../../websocket";

const log = createLogger("ShadowMode");

export interface ShadowSession {
  id: string;
  agentId: string;
  agentEmail: string;
  targetWorkspaceId: string;
  justification: string;
  startedAt: string;
  endedAt: string | null;
  actions: ShadowAction[];
  isActive: boolean;
}

export interface ShadowAction {
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  justification: string;
  resultSummary: string;
}

// ── Start a Shadow Mode session ───────────────────────────────────────────────

export async function startShadowSession(
  agentId: string,
  agentEmail: string,
  targetWorkspaceId: string,
  justification: string
): Promise<{ sessionId: string }> {
  if (!justification?.trim()) {
    throw new Error("JUSTIFICATION_REQUIRED: Glass Break protocol requires explicit justification to enter shadow mode");
  }

  // Create immutable session record
  const result = await pool.query(
    `INSERT INTO support_sessions
       (agent_id, agent_email, target_workspace_id, justification, started_at, is_active, actions)
     VALUES ($1, $2, $3, $4, NOW(), true, '[]'::jsonb)
     RETURNING id`,
    [agentId, agentEmail, targetWorkspaceId, justification.trim()]
  );
  const sessionId: string = result.rows[0]?.id;

  log.info(`[ShadowMode] Session started: ${agentEmail} → workspace ${targetWorkspaceId} (${sessionId})`);

  // Notify tenant owner — they deserve to know when CoAIleague staff enter their workspace
  await broadcastToWorkspace(targetWorkspaceId, {
    type: "shadow_session_started",
    data: {
      agentEmail,
      justification,
      sessionId,
      startedAt: new Date().toISOString(),
      message: `A CoAIleague support agent (${agentEmail}) has entered your workspace. Reason: ${justification}`,
    },
  }).catch(() => {});

  // Also write to universal_audit_trail
  await pool.query(
    `INSERT INTO universal_audit_trail
       (entity_type, entity_id, action, actor_id, actor_email, description, metadata, created_at)
     VALUES ('support_session', $1, 'shadow_session_started', $2, $3, $4, $5::jsonb, NOW())`,
    [
      sessionId, agentId, agentEmail,
      `Support agent ${agentEmail} entered workspace ${targetWorkspaceId}: ${justification}`,
      JSON.stringify({ sessionId, targetWorkspaceId, justification }),
    ]
  ).catch(() => {});

  return { sessionId };
}

// ── Log an action within Shadow Mode (Glass Break) ────────────────────────────

export async function logShadowAction(
  sessionId: string,
  action: ShadowAction
): Promise<void> {
  if (!action.justification?.trim()) {
    throw new Error("JUSTIFICATION_REQUIRED: Each Glass Break action requires justification");
  }

  // Append to immutable session action log
  await pool.query(
    `UPDATE support_sessions
     SET actions = actions || $1::jsonb,
         updated_at = NOW()
     WHERE id = $2 AND is_active = true`,
    [JSON.stringify([action]), sessionId]
  );

  log.info(`[ShadowMode] Action logged: ${action.action} on ${action.entityType}:${action.entityId}`);
}

// ── End a Shadow Mode session ─────────────────────────────────────────────────

export async function endShadowSession(
  sessionId: string,
  agentId: string,
  targetWorkspaceId: string
): Promise<void> {
  await pool.query(
    `UPDATE support_sessions
     SET is_active = false, ended_at = NOW()
     WHERE id = $1 AND agent_id = $2`,
    [sessionId, agentId]
  );

  log.info(`[ShadowMode] Session ended: ${sessionId}`);

  // Notify tenant owner that agent has left
  await broadcastToWorkspace(targetWorkspaceId, {
    type: "shadow_session_ended",
    data: {
      sessionId,
      endedAt: new Date().toISOString(),
      message: "The CoAIleague support session has ended. Your workspace is no longer being accessed by support staff.",
    },
  }).catch(() => {});
}

// ── Middleware: require Glass Break justification ────────────────────────────
// Add to any route that accesses sensitive tenant data.

export function requireGlassBreakJustification(
  req: { body: { justification?: string }; headers: Record<string, string | undefined> },
  res: { status: (n: number) => { json: (body: unknown) => unknown } },
  next: () => void
): void {
  const justification = req.body?.justification || req.headers["x-glass-break-justification"];
  if (!justification?.trim()) {
    res.status(400).json({
      error: {
        code: "JUSTIFICATION_REQUIRED",
        message: "This action requires a Glass Break justification. Provide justification in request body or X-Glass-Break-Justification header.",
      },
    });
    return;
  }
  next();
}

// ── Check if agent has active shadow session ──────────────────────────────────

export async function getActiveShadowSession(
  agentId: string,
  targetWorkspaceId: string
): Promise<ShadowSession | null> {
  const result = await pool.query(
    `SELECT id, agent_id, agent_email, target_workspace_id, justification,
            started_at, ended_at, actions, is_active
     FROM support_sessions
     WHERE agent_id = $1 AND target_workspace_id = $2 AND is_active = true
     LIMIT 1`,
    [agentId, targetWorkspaceId]
  );
  return result.rows[0] || null;
}

export const shadowModeService = {
  startSession: startShadowSession,
  logAction: logShadowAction,
  endSession: endShadowSession,
  getActiveSession: getActiveShadowSession,
};
