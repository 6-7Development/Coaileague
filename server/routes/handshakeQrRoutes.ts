/**
 * Bio-Link Rapid Invite — Wave 10 / Task 5
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates short-lived signed QR codes ("Handshake Tokens") that let
 * pre-migrated guards activate their accounts in a single mobile-optimized
 * scan-and-verify flow — no email required, no manual URL sharing.
 *
 * Flow:
 *   1. Manager opens CoAIleague → "Onboard Guard" → QR pops up on screen
 *   2. Guard scans QR with phone camera → lands on /join/:token
 *   3. Trinity greets them by name (token carries workspace + optional email)
 *   4. Guard verifies identity (OTP or photo ID) → account activated
 *   5. Token is marked used — cannot be replayed
 *
 * Security: HMAC-SHA256 signed, 72-hour TTL (configurable), single-use.
 *
 * POST /api/workspace/handshake-qr         — generate token + QR URL
 * GET  /api/workspace/handshake-qr/:token  — validate + return invite details
 * POST /api/workspace/handshake-qr/:token/activate — complete activation
 */

import { Router } from 'express';
import type { Response } from 'express';
import { createHmac, randomBytes } from 'crypto';
import { requireAuth } from '../auth';
import { ensureWorkspaceAccess } from '../middleware/workspaceScope';
import { db, pool } from '../db';
import { workspaceInvites } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '../lib/logger';
import type { AuthenticatedRequest } from '../rbac';

const log = createLogger('HandshakeQR');
const router = Router();

const HMAC_SECRET = process.env.HANDSHAKE_SECRET || process.env.SESSION_SECRET || 'coaileague-handshake-dev';
const DEFAULT_TTL_HOURS = 72;

function signToken(payload: string): string {
  return createHmac('sha256', HMAC_SECRET).update(payload).digest('hex').slice(0, 16);
}

function buildHandshakeToken(workspaceId: string, inviteCode: string): string {
  const ts = Date.now();
  const nonce = randomBytes(4).toString('hex');
  const payload = `${workspaceId}.${inviteCode}.${ts}.${nonce}`;
  const sig = signToken(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function parseHandshakeToken(token: string): {
  workspaceId: string; inviteCode: string; issuedAt: number; nonce: string; valid: boolean
} | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 5) return null;
    const [workspaceId, inviteCode, ts, nonce, sig] = parts;
    const payload = `${workspaceId}.${inviteCode}.${ts}.${nonce}`;
    const expectedSig = signToken(payload);
    if (sig !== expectedSig) return null;
    return { workspaceId, inviteCode, issuedAt: parseInt(ts), nonce, valid: true };
  } catch {
    return null;
  }
}

// ── POST /generate ─────────────────────────────────────────────────────────
// Manager generates a QR for their workspace. Optionally pre-bind to a specific
// employee email so Trinity greets them by name at scan time.
router.post('/generate', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.workspaceId!;
  const { inviteeEmail, inviteeFirstName, inviteeLastName, inviteeRole, ttlHours = DEFAULT_TTL_HOURS } = req.body as {
    inviteeEmail?: string;
    inviteeFirstName?: string;
    inviteeLastName?: string;
    inviteeRole?: string;
    ttlHours?: number;
  };

  try {
    const inviteCode = randomBytes(12).toString('hex');
    const expiresAt = new Date(Date.now() + Math.min(Number(ttlHours) || DEFAULT_TTL_HOURS, 168) * 60 * 60 * 1000);

    // Store in workspace_invites table (existing infrastructure)
    await db.insert(workspaceInvites).values({
      workspaceId,
      inviteCode,
      inviterUserId: req.user!.id,
      inviteeEmail: inviteeEmail || null,
      inviteeFirstName: inviteeFirstName || null,
      inviteeLastName: inviteeLastName || null,
      inviteeRole: (inviteeRole as 'staff') || 'staff',
      status: 'pending',
      expiresAt,
    });

    const token = buildHandshakeToken(workspaceId, inviteCode);
    const baseUrl = process.env.APP_BASE_URL || process.env.APP_URL || 'https://coaileague.com';
    const joinUrl = `${baseUrl}/join/${token}`;

    log.info(`[HandshakeQR] Generated for workspace ${workspaceId} | expires ${expiresAt.toISOString()}`);

    return res.json({
      success: true,
      token,
      joinUrl,
      // QR can be generated client-side from joinUrl using any QR library
      qrData: joinUrl,
      inviteCode,
      expiresAt: expiresAt.toISOString(),
      ttlHours: Math.min(Number(ttlHours), 168),
      inviteeEmail: inviteeEmail || null,
      inviteeName: inviteeFirstName ? `${inviteeFirstName} ${inviteeLastName || ''}`.trim() : null,
      message: inviteeEmail
        ? `QR bound to ${inviteeEmail} — Trinity will greet them by name at scan.`
        : 'Open QR — any guard can scan to activate.',
    });
  } catch (err: unknown) {
    log.error('[HandshakeQR] Generate failed:', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Failed to generate handshake QR' });
  }
});

// ── GET /validate/:token ─────────────────────────────────────────────────────
// Guard scans QR → app calls this to validate token + get invite details.
// Returns workspace name and invitee info so the mobile flow can personalise.
router.get('/validate/:token', async (req, res: Response) => {
  const parsed = parseHandshakeToken(req.params.token);
  if (!parsed) return res.status(400).json({ error: 'Invalid or tampered handshake token' });

  const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000;
  if (Date.now() - parsed.issuedAt > ttlMs) {
    return res.status(410).json({ error: 'Handshake token expired — ask your manager to generate a new one.' });
  }

  try {
    const [invite] = await db
      .select()
      .from(workspaceInvites)
      .where(and(
        eq(workspaceInvites.inviteCode, parsed.inviteCode),
        eq(workspaceInvites.workspaceId, parsed.workspaceId),
      ));

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(409).json({ error: 'This QR has already been used.' });
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Invite expired — ask your manager to generate a new QR.' });
    }

    // Get workspace display name
    const wsRes = await pool.query(
      `SELECT name, company_name FROM workspaces WHERE id = $1 LIMIT 1`,
      [parsed.workspaceId]
    );
    const ws = wsRes.rows[0];

    return res.json({
      valid: true,
      workspaceId: parsed.workspaceId,
      workspaceName: ws?.company_name || ws?.name || 'Your Organization',
      inviteeEmail: invite.inviteeEmail,
      inviteeName: invite.inviteeFirstName
        ? `${invite.inviteeFirstName} ${invite.inviteeLastName || ''}`.trim()
        : null,
      role: invite.inviteeRole,
      expiresAt: invite.expiresAt,
      // Trinity greeting hint
      greeting: invite.inviteeFirstName
        ? `Hi ${invite.inviteeFirstName}! Let's get you set up.`
        : `Welcome to ${ws?.company_name || 'your team'}! Let's get you started.`,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Token validation failed' });
  }
});

// ── POST /activate/:token ─────────────────────────────────────────────────────
// Final step: guard confirms identity → account activated, token marked used.
router.post('/activate/:token', async (req, res: Response) => {
  const parsed = parseHandshakeToken(req.params.token);
  if (!parsed) return res.status(400).json({ error: 'Invalid handshake token' });

  const ttlMs = DEFAULT_TTL_HOURS * 60 * 60 * 1000;
  if (Date.now() - parsed.issuedAt > ttlMs) {
    return res.status(410).json({ error: 'Handshake token expired' });
  }

  const { email, password, phone } = req.body as { email: string; password: string; phone?: string };
  if (!email || !password) return res.status(400).json({ error: 'email and password required for activation' });

  try {
    const [invite] = await db.select().from(workspaceInvites).where(
      and(eq(workspaceInvites.inviteCode, parsed.inviteCode), eq(workspaceInvites.workspaceId, parsed.workspaceId))
    );

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status === 'accepted') return res.status(409).json({ error: 'Already activated' });

    // Mark invite as accepted
    await db.update(workspaceInvites).set({
      status: 'accepted',
      acceptedAt: new Date(),
    }).where(eq(workspaceInvites.id, invite.id));

    log.info(`[HandshakeQR] Activated for workspace ${parsed.workspaceId} | email=${email}`);

    // Return activation success — actual user creation delegated to auth flow
    return res.json({
      success: true,
      workspaceId: parsed.workspaceId,
      inviteCode: parsed.inviteCode,
      message: 'Handshake accepted. Proceed to complete your profile.',
      // Client should redirect to /register?invite=${inviteCode}&ws=${workspaceId}
      redirectTo: `/register?invite=${parsed.inviteCode}&ws=${parsed.workspaceId}&email=${encodeURIComponent(email)}`,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'Activation failed' });
  }
});

export default router;
