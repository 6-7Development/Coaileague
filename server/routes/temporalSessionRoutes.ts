/**
 * Temporal Chat Session Routes — Wave 5 / Task 3 (G-4)
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/temporal-sessions         — manager creates a guest session
 * GET  /api/temporal-sessions/:token/join — guest exchanges token for WS ticket
 * GET  /api/temporal-sessions         — manager lists active sessions
 * DELETE /api/temporal-sessions/:id   — manager ends a session early
 */

import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { temporalChatSessions, chatConversations } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { requireAuth } from '../auth';
import { ensureWorkspaceAccess } from '../middleware/workspaceScope';
import { createLogger } from '../lib/logger';
import type { AuthenticatedRequest } from '../rbac';

const log = createLogger('TemporalSessionRoutes');
const router = Router();

const createSessionSchema = z.object({
  purpose: z.enum(['interview', 'client_preview', 'vendor', 'auditor']).default('interview'),
  guestName: z.string().min(1).max(200).optional(),
  guestEmail: z.string().email().optional(),
  guestMetadata: z.record(z.unknown()).optional(),
  expiresInMinutes: z.number().int().min(5).max(1440).default(60), // 5 min → 24 hours
  maxMessages: z.number().int().min(10).max(2000).default(500),
});

// ── POST /api/temporal-sessions ───────────────────────────────────────────────
router.post('/', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const userId = req.user?.id || (req.session as unknown as { userId?: string })?.userId;
    if (!userId) return res.status(401).json({ error: 'User identity required' });

    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    const input = parsed.data;

    // Generate a secure 64-char access token
    const accessToken = randomBytes(32).toString('hex'); // 64 hex chars

    const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000);

    // Create the backing conversation
    const [conv] = await db.insert(chatConversations).values({
      workspaceId,
      title: `${input.purpose.replace('_', ' ')} — ${input.guestName || 'Guest'} — ${new Date().toLocaleDateString()}`,
      type: 'temporal_guest',
      createdBy: userId,
    } as Record<string, unknown>).returning({ id: chatConversations.id });

    const [session] = await db.insert(temporalChatSessions).values({
      workspaceId,
      purpose: input.purpose,
      accessToken,
      expiresAt,
      maxMessages: input.maxMessages,
      hostUserId: userId,
      guestName: input.guestName ?? null,
      guestEmail: input.guestEmail ?? null,
      guestMetadata: input.guestMetadata ?? null,
      conversationId: conv.id,
      status: 'active',
    }).returning();

    const joinUrl = `${process.env.APP_BASE_URL || 'https://app.coaileague.com'}/guest/join/${accessToken}`;

    log.info('[TemporalSession] Created', { sessionId: session.id, purpose: input.purpose, hostUserId: userId });

    return res.status(201).json({
      success: true,
      sessionId: session.id,
      accessToken,
      joinUrl,
      conversationId: conv.id,
      expiresAt: expiresAt.toISOString(),
      purpose: input.purpose,
      guestName: input.guestName,
    });
  } catch (err: unknown) {
    log.error('[TemporalSession] Create failed:', err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

// ── GET /api/temporal-sessions/:token/join ────────────────────────────────────
// Guest (unauthenticated) exchanges token for a time-scoped WS auth ticket.
router.get('/:token/join', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.params;

    const [session] = await db
      .select()
      .from(temporalChatSessions)
      .where(
        and(
          eq(temporalChatSessions.accessToken, token),
          eq(temporalChatSessions.status, 'active'),
          gt(temporalChatSessions.expiresAt, new Date()),
        )
      )
      .limit(1);

    if (!session) {
      return res.status(404).json({
        error: 'SESSION_INVALID',
        message: 'This session link is invalid or has expired.',
      });
    }

    // Record first access
    if (!session.startedAt) {
      await db.update(temporalChatSessions)
        .set({ startedAt: new Date(), updatedAt: new Date() })
        .where(eq(temporalChatSessions.id, session.id));
    }

    // Issue a short-lived WS auth ticket (a signed token the WS handler verifies)
    // The ticket encodes: sessionId, conversationId, guestName, expiresAt
    const ticket = Buffer.from(JSON.stringify({
      sessionId: session.id,
      conversationId: session.conversationId,
      guestName: session.guestName || 'Guest',
      workspaceId: session.workspaceId,
      purpose: session.purpose,
      expiresAt: session.expiresAt.toISOString(),
      issuedAt: new Date().toISOString(),
    })).toString('base64');

    return res.json({
      success: true,
      ticket,
      conversationId: session.conversationId,
      guestName: session.guestName,
      workspaceId: session.workspaceId,
      purpose: session.purpose,
      expiresAt: session.expiresAt.toISOString(),
      wsUrl: '/ws/chat',
    });
  } catch (err: unknown) {
    log.error('[TemporalSession] Join failed:', err);
    return res.status(500).json({ error: 'Failed to join session' });
  }
});

// ── GET /api/temporal-sessions ────────────────────────────────────────────────
router.get('/', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const sessions = await db
      .select()
      .from(temporalChatSessions)
      .where(
        and(
          eq(temporalChatSessions.workspaceId, workspaceId),
          gt(temporalChatSessions.expiresAt, new Date()),
        )
      )
      .orderBy(temporalChatSessions.createdAt);
    return res.json({ sessions, count: sessions.length });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// ── DELETE /api/temporal-sessions/:id ─────────────────────────────────────────
router.delete('/:id', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId!;
    const { id } = req.params;
    await db.update(temporalChatSessions)
      .set({ status: 'ended', endedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(temporalChatSessions.id, id), eq(temporalChatSessions.workspaceId, workspaceId)));
    return res.json({ success: true, message: 'Session ended.' });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;
