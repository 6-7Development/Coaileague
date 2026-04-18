/**
 * Auditor Routes — Phase 18C
 * ===========================
 * Public + auditor-authenticated endpoints for the regulatory auditor flow.
 *
 *   POST /api/auditor/intake               — Trinity-or-staff submits an
 *                                            intake (regulatory email + order
 *                                            attachment URL + license #).
 *   POST /api/auditor/claim                — Claim an invite token, set
 *                                            password + phone.
 *   POST /api/auditor/login                — Email + password login. Sets a
 *                                            short-lived auditor session.
 *   POST /api/auditor/logout               — Clear session.
 *   GET  /api/auditor/me                   — Current auditor identity.
 *   GET  /api/auditor/me/audits            — List audits for the auditor.
 *   POST /api/auditor/audits               — Request a new audit window.
 *   POST /api/auditor/audits/:id/close     — Close an audit.
 *   POST /api/auditor/audits/:id/extend    — Request extension (default 30d).
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createLogger } from '../lib/logger';
import {
  processAuditorIntake,
  claimInvite,
  authenticateAuditor,
  recordSuccessfulAuth,
  listAuditsForAuditor,
  requestNewAudit,
  closeAudit,
  extendAudit,
  isRegulatoryEmail,
} from '../services/auditor/auditorAccessService';

const log = createLogger('AuditorRoutes');
export const auditorRouter = Router();

function getBaseUrl(req: Request): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = ((req.headers['x-forwarded-proto'] as string | undefined) || req.protocol).split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.get('host') || 'www.coaileague.com';
  return `${proto}://${host}`;
}

// Lightweight auditor-session guard — mirrors the existing express-session
// pattern in the platform. We don't reuse the operator/employee session
// because auditors have a separate identity surface and a separate threat
// model (read-only, time-boxed, periodic re-auth).
function requireAuditor(req: any, res: Response, next: NextFunction): void {
  const auditorId = req.session?.auditorId;
  if (!auditorId) {
    res.status(401).json({ ok: false, error: 'Not signed in as auditor' });
    return;
  }
  next();
}

// ─── 1. INTAKE ────────────────────────────────────────────────────────────────
// Posts a regulator request to Trinity. Intentionally unauthenticated — the
// trust boundary is the regulatory email domain check inside the service.
// In production the typical caller is the inbound-email webhook handler that
// parses the auditor's email and forwards the structured fields here.

auditorRouter.post('/intake', async (req: Request, res: Response) => {
  try {
    const { email, fullName, agencyName, workspaceId, licenseNumber, orderDocUrl, notes } = req.body || {};
    if (!email || !workspaceId) {
      return res.status(400).json({ ok: false, error: 'email and workspaceId are required' });
    }
    const result = await processAuditorIntake({
      email, fullName, agencyName, workspaceId, licenseNumber, orderDocUrl,
      baseUrl: getBaseUrl(req), notes,
    });
    if (!result.success) return res.status(400).json({ ok: false, error: result.reason });
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    log.error('[AuditorRoutes] intake error:', err.message);
    res.status(500).json({ ok: false, error: 'Intake failed' });
  }
});

// ─── 2. CLAIM INVITE ──────────────────────────────────────────────────────────

auditorRouter.post('/claim', async (req: Request, res: Response) => {
  try {
    const { token, password, phone, fullName } = req.body || {};
    if (!token || !password || password.length < 10) {
      return res.status(400).json({ ok: false, error: 'token + password (≥10 chars) required' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await claimInvite({ token, passwordHash, phone, fullName });
    if (!result.success) return res.status(400).json({ ok: false, error: result.reason });
    (req as any).session.auditorId = result.auditorId;
    return res.json({ ok: true, auditorId: result.auditorId });
  } catch (err: any) {
    log.error('[AuditorRoutes] claim error:', err.message);
    res.status(500).json({ ok: false, error: 'Claim failed' });
  }
});

// ─── 3. LOGIN ─────────────────────────────────────────────────────────────────

auditorRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'email and password required' });
    }
    if (!isRegulatoryEmail(email)) {
      return res.status(403).json({ ok: false, error: 'Only regulatory emails may sign in to the auditor portal' });
    }
    const auth = await authenticateAuditor(email);
    if (!auth.ok || !auth.passwordHash) {
      return res.status(401).json({
        ok: false,
        error: auth.reason === 'reauth_required'
          ? 'Your auditor account requires re-authentication. Please email your regulatory office to request a new audit invitation.'
          : auth.reason === 'pending'
            ? 'Account not yet activated — please claim your invite via the email link.'
            : 'Invalid credentials',
      });
    }
    const ok = await bcrypt.compare(password, auth.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    await recordSuccessfulAuth(auth.auditorId!, req.ip, req.headers['user-agent'] as string);
    (req as any).session.auditorId = auth.auditorId;
    return res.json({ ok: true });
  } catch (err: any) {
    log.error('[AuditorRoutes] login error:', err.message);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

// ─── 4. LOGOUT ────────────────────────────────────────────────────────────────

auditorRouter.post('/logout', (req: any, res: Response) => {
  if (req.session?.auditorId) delete req.session.auditorId;
  res.json({ ok: true });
});

// ─── 5. ME ────────────────────────────────────────────────────────────────────

auditorRouter.get('/me', requireAuditor, (req: any, res: Response) => {
  res.json({ ok: true, auditorId: req.session.auditorId });
});

// ─── 6. LIST AUDITS ───────────────────────────────────────────────────────────

auditorRouter.get('/me/audits', requireAuditor, async (req: any, res: Response) => {
  try {
    const audits = await listAuditsForAuditor(req.session.auditorId);
    res.json({ ok: true, audits });
  } catch (err: any) {
    log.error('[AuditorRoutes] list audits error:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to list audits' });
  }
});

// ─── 7. REQUEST NEW AUDIT ─────────────────────────────────────────────────────

auditorRouter.post('/audits', requireAuditor, async (req: any, res: Response) => {
  try {
    const { workspaceId, licenseNumber, orderDocUrl, notes } = req.body || {};
    if (!workspaceId) return res.status(400).json({ ok: false, error: 'workspaceId required' });
    const result = await requestNewAudit({
      auditorId: req.session.auditorId, workspaceId, licenseNumber, orderDocUrl, notes,
    });
    if (!result.success) return res.status(400).json({ ok: false, error: result.reason });
    res.json({ ok: true, auditId: result.auditId });
  } catch (err: any) {
    log.error('[AuditorRoutes] request audit error:', err.message);
    res.status(500).json({ ok: false, error: 'Request failed' });
  }
});

// ─── 8. CLOSE AUDIT ───────────────────────────────────────────────────────────

auditorRouter.post('/audits/:id/close', requireAuditor, async (req: any, res: Response) => {
  try {
    const r = await closeAudit(req.params.id, req.session.auditorId);
    res.json({ ok: r.success });
  } catch (err: any) {
    log.error('[AuditorRoutes] close audit error:', err.message);
    res.status(500).json({ ok: false, error: 'Close failed' });
  }
});

// ─── 9. EXTEND AUDIT ──────────────────────────────────────────────────────────

auditorRouter.post('/audits/:id/extend', requireAuditor, async (req: any, res: Response) => {
  try {
    const days = Math.min(parseInt(req.body?.days || '30', 10) || 30, 90);
    const r = await extendAudit(req.params.id, days);
    res.json({ ok: r.success });
  } catch (err: any) {
    log.error('[AuditorRoutes] extend audit error:', err.message);
    res.status(500).json({ ok: false, error: 'Extend failed' });
  }
});
