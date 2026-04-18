/**
 * Auditor Access Service — Phase 18C
 * ===================================
 * Manages regulatory auditor lifecycle:
 *   1. Auditor emails Trinity from a recognized regulatory domain with the
 *      audit order attached (handled by auditorRoutes /intake).
 *   2. Trinity validates the request, creates an `auditor_accounts` row in
 *      'pending' state, mints a single-use invite token, and emails the
 *      auditor a magic link to claim the account.
 *   3. Auditor lands on a UI (TODO: client/src/pages/auditor-portal.tsx)
 *      that POSTs the token + a chosen password back; service marks the
 *      account 'active' and updates phone if provided.
 *   4. Each audit is a separate `auditor_audits` row scoped to a tenant
 *      workspace + license number with a 30-day window. Read/print only.
 *   5. Auditors must re-authenticate every 90 days (last_auth_at >
 *      NOW() - 90 days). Otherwise the account is suspended until the
 *      auditor re-verifies via the regulatory email channel.
 *   6. A nightly job (TODO) calls expireOldAudits() to close anything past
 *      its window unless an extension was approved.
 *
 * Security guardrails:
 *   - Email intake validates the From domain against REGULATORY_DOMAINS
 *     (configurable via AUDITOR_REGULATORY_DOMAINS env var).
 *   - Tokens are single-use, 32-byte random hex, 7-day expiry.
 *   - Sessions are 30-day workspace-scoped JWTs (delegated to existing auth).
 *   - All access is read+print only (enforced by the route layer; this
 *     service just records the access scope).
 *   - Every action is written to the audit log via Trinity's existing
 *     audit logger so we have a defensible record of who saw what.
 */

import crypto from 'crypto';
import { createLogger } from '../../lib/logger';
import { sendCanSpamCompliantEmail } from '../emailCore';

const log = createLogger('AuditorAccess');

const DEFAULT_REGULATORY_DOMAINS = [
  // Common state regulator patterns — admins can extend via env var.
  '.gov', '.state.', '.us',
  'tdlr.texas.gov', 'bsis.ca.gov', 'dpsst.oregon.gov', 'dol.wa.gov',
  'state.fl.us', 'opr.ny.gov', 'dls.virginia.gov',
];

function regulatoryDomains(): string[] {
  const env = process.env.AUDITOR_REGULATORY_DOMAINS || '';
  const extra = env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return [...DEFAULT_REGULATORY_DOMAINS, ...extra];
}

export function isRegulatoryEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return regulatoryDomains().some(d => domain === d.replace(/^\./, '') || domain.endsWith(d));
}

let bootstrapped = false;
async function ensureTables(): Promise<void> {
  if (bootstrapped) return;
  try {
    const { pool } = await import('../../db');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auditor_accounts (
        id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email         VARCHAR NOT NULL UNIQUE,
        phone         VARCHAR,
        full_name     VARCHAR,
        agency_name   VARCHAR,
        regulatory_domain VARCHAR,
        status        VARCHAR NOT NULL DEFAULT 'pending',
        invite_token  VARCHAR UNIQUE,
        invite_expires_at TIMESTAMP,
        password_hash VARCHAR,
        last_auth_at  TIMESTAMP,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS auditor_accounts_status_idx ON auditor_accounts(status);
      CREATE INDEX IF NOT EXISTS auditor_accounts_invite_idx ON auditor_accounts(invite_token);

      CREATE TABLE IF NOT EXISTS auditor_audits (
        id              VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        auditor_id      VARCHAR NOT NULL,
        workspace_id    VARCHAR NOT NULL,
        license_number  VARCHAR,
        order_doc_url   TEXT,
        scope           VARCHAR NOT NULL DEFAULT 'read_print',
        status          VARCHAR NOT NULL DEFAULT 'pending_review',
        opened_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        closes_at       TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        closed_at       TIMESTAMP,
        closed_by       VARCHAR,
        extension_count INTEGER NOT NULL DEFAULT 0,
        notes           TEXT,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS auditor_audits_auditor_idx ON auditor_audits(auditor_id);
      CREATE INDEX IF NOT EXISTS auditor_audits_workspace_idx ON auditor_audits(workspace_id);
      CREATE INDEX IF NOT EXISTS auditor_audits_status_idx ON auditor_audits(status);

      CREATE TABLE IF NOT EXISTS auditor_session_log (
        id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        auditor_id    VARCHAR NOT NULL,
        audit_id      VARCHAR,
        action        VARCHAR NOT NULL,
        ip_address    VARCHAR,
        user_agent    TEXT,
        metadata      JSONB,
        occurred_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS auditor_session_log_auditor_idx ON auditor_session_log(auditor_id);
      CREATE INDEX IF NOT EXISTS auditor_session_log_audit_idx ON auditor_session_log(audit_id);
    `);
    bootstrapped = true;
    log.info('[AuditorAccess] Bootstrap complete');
  } catch (err: any) {
    log.warn('[AuditorAccess] Bootstrap failed (non-fatal):', err?.message);
  }
}

function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface IntakeParams {
  email: string;
  fullName?: string;
  agencyName?: string;
  workspaceId: string;
  licenseNumber?: string;
  orderDocUrl?: string;
  baseUrl: string;
  notes?: string;
}

/**
 * Process an inbound auditor request. Validates the email is from a
 * recognized regulatory domain, finds-or-creates the auditor_accounts row,
 * creates a pending auditor_audits row tied to the requested workspace +
 * license, and emails the auditor a magic-link invite (or login link if
 * the account already exists).
 */
export async function processAuditorIntake(params: IntakeParams): Promise<{
  success: boolean;
  auditorId?: string;
  auditId?: string;
  inviteSent?: boolean;
  reason?: string;
}> {
  await ensureTables();
  const { email, fullName, agencyName, workspaceId, licenseNumber, orderDocUrl, baseUrl, notes } = params;
  if (!isRegulatoryEmail(email)) {
    log.warn(`[AuditorAccess] Intake rejected — non-regulatory domain: ${email}`);
    return { success: false, reason: 'Email is not from a recognized regulatory domain' };
  }

  try {
    const { pool } = await import('../../db');
    const domain = email.split('@')[1].toLowerCase();

    // Find or create the auditor account.
    let auditorId: string;
    let inviteToken: string | null = null;
    const existing = await pool.query(
      `SELECT id, status FROM auditor_accounts WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (existing.rows.length) {
      auditorId = existing.rows[0].id;
      // If they're suspended (>90 days since last auth) or pending, mint a fresh invite.
      if (existing.rows[0].status === 'pending' || existing.rows[0].status === 'suspended') {
        inviteToken = newToken();
        await pool.query(
          `UPDATE auditor_accounts
              SET invite_token = $1,
                  invite_expires_at = NOW() + INTERVAL '7 days',
                  status = 'pending',
                  updated_at = NOW()
            WHERE id = $2`,
          [inviteToken, auditorId]
        );
      }
    } else {
      inviteToken = newToken();
      const insert = await pool.query(
        `INSERT INTO auditor_accounts
            (email, full_name, agency_name, regulatory_domain, status, invite_token, invite_expires_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, NOW() + INTERVAL '7 days')
         RETURNING id`,
        [email, fullName || null, agencyName || null, domain, inviteToken]
      );
      auditorId = insert.rows[0].id;
    }

    // Create the audit record (workspace-scoped, 30-day window).
    const auditInsert = await pool.query(
      `INSERT INTO auditor_audits
          (auditor_id, workspace_id, license_number, order_doc_url, status, notes)
       VALUES ($1, $2, $3, $4, 'pending_review', $5)
       RETURNING id`,
      [auditorId, workspaceId, licenseNumber || null, orderDocUrl || null, notes || null]
    );
    const auditId = auditInsert.rows[0].id;

    // Email the auditor with a magic link (or login link if already active).
    const link = inviteToken
      ? `${baseUrl}/auditor/claim?token=${inviteToken}`
      : `${baseUrl}/auditor/login`;
    const subject = inviteToken
      ? 'Co-League: Auditor account invitation'
      : 'Co-League: New audit assignment available';
    const html = `
      <p>Hello${fullName ? ' ' + fullName : ''},</p>
      <p>This message confirms receipt of your audit request${licenseNumber ? ` for license number <strong>${licenseNumber}</strong>` : ''}.
      Trinity has logged this request and reserved a read-and-print-only audit window of 30 days from the date of activation.</p>
      ${inviteToken
        ? `<p>To activate your auditor portal account, please click the secure link below within 7 days:</p>
           <p><a href="${link}">${link}</a></p>
           <p>You will be asked to set a password and confirm a callback phone number.</p>`
        : `<p>Your existing auditor account has been linked to this audit. <a href="${link}">Sign in to view it.</a></p>`}
      <p>For your protection, all auditor accounts must re-authenticate every 90 days. We will email you a reminder before your account is suspended.</p>
      <p>— Trinity, Co-League Compliance Concierge</p>
    `;

    let inviteSent = false;
    try {
      const sendResult = await sendCanSpamCompliantEmail({
        to: email,
        subject,
        html,
        emailType: 'transactional',
        workspaceId,
      });
      inviteSent = !!sendResult.success;
    } catch (e: any) {
      log.warn('[AuditorAccess] Invite email failed (non-fatal):', e?.message);
    }

    await pool.query(
      `INSERT INTO auditor_session_log (auditor_id, audit_id, action, metadata)
       VALUES ($1, $2, 'intake_processed', $3)`,
      [auditorId, auditId, JSON.stringify({ regulatoryDomain: domain, inviteSent })]
    );

    return { success: true, auditorId, auditId, inviteSent };
  } catch (err: any) {
    log.error('[AuditorAccess] Intake failed:', err?.message);
    return { success: false, reason: err?.message };
  }
}

export async function claimInvite(params: {
  token: string;
  passwordHash: string;
  phone?: string;
  fullName?: string;
}): Promise<{ success: boolean; auditorId?: string; reason?: string }> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    const r = await pool.query(
      `SELECT id, status, invite_expires_at FROM auditor_accounts
        WHERE invite_token = $1 LIMIT 1`,
      [params.token]
    );
    if (!r.rows.length) return { success: false, reason: 'Invalid or already-used invite token' };
    const row = r.rows[0];
    if (row.invite_expires_at && new Date(row.invite_expires_at) < new Date()) {
      return { success: false, reason: 'Invite token expired — please request a new audit' };
    }

    await pool.query(
      `UPDATE auditor_accounts
          SET password_hash = $1,
              phone = COALESCE($2, phone),
              full_name = COALESCE($3, full_name),
              status = 'active',
              last_auth_at = NOW(),
              invite_token = NULL,
              invite_expires_at = NULL,
              updated_at = NOW()
        WHERE id = $4`,
      [params.passwordHash, params.phone || null, params.fullName || null, row.id]
    );

    await pool.query(
      `INSERT INTO auditor_session_log (auditor_id, action) VALUES ($1, 'invite_claimed')`,
      [row.id]
    );

    return { success: true, auditorId: row.id };
  } catch (err: any) {
    log.error('[AuditorAccess] Claim invite failed:', err?.message);
    return { success: false, reason: err?.message };
  }
}

/**
 * Verify an active auditor login. Enforces the 90-day re-auth rule by
 * suspending accounts that have not authenticated in that window. The
 * caller is responsible for password comparison; we just check status.
 */
export async function authenticateAuditor(email: string): Promise<{
  ok: boolean;
  auditorId?: string;
  passwordHash?: string;
  reason?: 'not_found' | 'suspended' | 'pending' | 'reauth_required';
}> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    const r = await pool.query(
      `SELECT id, status, password_hash, last_auth_at
         FROM auditor_accounts
        WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (!r.rows.length) return { ok: false, reason: 'not_found' };

    const row = r.rows[0];
    if (row.status === 'pending') return { ok: false, reason: 'pending' };
    if (row.status === 'suspended') return { ok: false, reason: 'suspended' };

    // 90-day re-auth rule.
    if (row.last_auth_at && (Date.now() - new Date(row.last_auth_at).getTime() > 90 * 24 * 60 * 60 * 1000)) {
      await pool.query(`UPDATE auditor_accounts SET status = 'suspended' WHERE id = $1`, [row.id]);
      return { ok: false, reason: 'reauth_required' };
    }

    return { ok: true, auditorId: row.id, passwordHash: row.password_hash };
  } catch (err: any) {
    log.error('[AuditorAccess] Authenticate failed:', err?.message);
    return { ok: false, reason: 'not_found' };
  }
}

export async function recordSuccessfulAuth(auditorId: string, ip?: string, ua?: string): Promise<void> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    await pool.query(`UPDATE auditor_accounts SET last_auth_at = NOW(), updated_at = NOW() WHERE id = $1`, [auditorId]);
    await pool.query(
      `INSERT INTO auditor_session_log (auditor_id, action, ip_address, user_agent) VALUES ($1, 'login', $2, $3)`,
      [auditorId, ip || null, ua || null]
    );
  } catch (err: any) {
    log.warn('[AuditorAccess] recordSuccessfulAuth failed (non-fatal):', err?.message);
  }
}

export async function listAuditsForAuditor(auditorId: string): Promise<any[]> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    const r = await pool.query(
      `SELECT id, workspace_id, license_number, status, opened_at, closes_at, closed_at, scope
         FROM auditor_audits
        WHERE auditor_id = $1
        ORDER BY opened_at DESC`,
      [auditorId]
    );
    return r.rows;
  } catch (err: any) {
    log.warn('[AuditorAccess] listAuditsForAuditor failed:', err?.message);
    return [];
  }
}

export async function requestNewAudit(params: {
  auditorId: string;
  workspaceId: string;
  licenseNumber?: string;
  orderDocUrl?: string;
  notes?: string;
}): Promise<{ success: boolean; auditId?: string; reason?: string }> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    const r = await pool.query(
      `INSERT INTO auditor_audits (auditor_id, workspace_id, license_number, order_doc_url, status, notes)
       VALUES ($1, $2, $3, $4, 'pending_review', $5)
       RETURNING id`,
      [params.auditorId, params.workspaceId, params.licenseNumber || null, params.orderDocUrl || null, params.notes || null]
    );
    return { success: true, auditId: r.rows[0].id };
  } catch (err: any) {
    log.error('[AuditorAccess] requestNewAudit failed:', err?.message);
    return { success: false, reason: err?.message };
  }
}

export async function closeAudit(auditId: string, closedBy?: string): Promise<{ success: boolean }> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    await pool.query(
      `UPDATE auditor_audits
          SET status = 'closed', closed_at = NOW(), closed_by = $1, updated_at = NOW()
        WHERE id = $2`,
      [closedBy || 'auditor', auditId]
    );
    return { success: true };
  } catch (err: any) {
    log.warn('[AuditorAccess] closeAudit failed:', err?.message);
    return { success: false };
  }
}

export async function extendAudit(auditId: string, days = 30): Promise<{ success: boolean }> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    await pool.query(
      `UPDATE auditor_audits
          SET closes_at = closes_at + ($1::int * INTERVAL '1 day'),
              extension_count = extension_count + 1,
              updated_at = NOW()
        WHERE id = $2 AND status IN ('open', 'active', 'pending_review')`,
      [days, auditId]
    );
    return { success: true };
  } catch (err: any) {
    log.warn('[AuditorAccess] extendAudit failed:', err?.message);
    return { success: false };
  }
}

/**
 * Idempotent close-out for any audit past its window. Safe to run on a cron.
 */
export async function expireOldAudits(): Promise<{ closed: number }> {
  await ensureTables();
  try {
    const { pool } = await import('../../db');
    const r = await pool.query(
      `UPDATE auditor_audits
          SET status = 'closed', closed_at = NOW(), closed_by = 'system_expiry', updated_at = NOW()
        WHERE status IN ('open', 'active', 'pending_review')
          AND closes_at < NOW()
        RETURNING id`
    );
    return { closed: r.rowCount ?? 0 };
  } catch (err: any) {
    log.warn('[AuditorAccess] expireOldAudits failed:', err?.message);
    return { closed: 0 };
  }
}
