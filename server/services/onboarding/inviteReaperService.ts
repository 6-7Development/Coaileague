/**
 * Invite Reaper Service — Synapse-Standard Onboarding
 * 
 * THE REAPER RULE: Every 24h sweep all pending/invited tokens.
 * IF status IN ('pending','invited') AND age > 7 days → status = 'expired'
 * 
 * Visual State Machine:
 *   pending  → ORANGE border (invite in-flight, not yet confirmed)
 *   invited  → ORANGE border (email delivered, awaiting action)
 *   accepted → GREEN  border (handshake complete)
 *   expired  → RED    border (> 7 days or manually revoked)
 */
import { db, pool } from '../../db';
import { clientPortalInviteTokens, orgInvitations } from '@shared/schema';
import { sql, lt, inArray, and } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';

const log = createLogger('InviteReaper');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function runInviteReaper(): Promise<void> {
  const cutoff = new Date(Date.now() - INVITE_TTL_MS);
  let reaped = 0;

  try {
    // Reap client portal invites — flip invite_status to 'expired'
    // Layer 3 Rule: UI reads status from DB — Reaper must have ALREADY flipped it
    const clientResult = await pool.query(`
      UPDATE client_portal_invite_tokens
      SET invite_status = 'expired',
          updated_at = NOW()
      WHERE
        created_at < $1
        AND is_used = false
        AND COALESCE(invite_status, 'invited') NOT IN ('active', 'expired', 'locked')
    `, [cutoff]);
    reaped += (clientResult as any).rowCount || 0;
  } catch (err) {
    log.warn('[Reaper] client_portal_invite_tokens sweep failed (non-fatal):', err);
  }

  try {
    // Reap org invitations (orgInvitations — tenant/client onboarding)
    const orgResult = await db.execute(sql`
      UPDATE org_invitations
      SET status = 'expired', updated_at = NOW()
      WHERE
        status IN ('pending', 'invited')
        AND sent_at < ${cutoff}
    `);
    reaped += (orgResult as any).rowCount || 0;
  } catch (err) {
    log.warn('[Reaper] org_invitations sweep failed (non-fatal):', err);
  }

  try {
    // Reap employee invitations
    const empResult = await db.execute(sql`
      UPDATE employee_invitations
      SET invite_status = 'expired', updated_at = NOW()
      WHERE
        invite_status IN ('pending', 'invited')
        AND created_at < ${cutoff}
    `);
    reaped += (empResult as any).rowCount || 0;
  } catch (err) {
    log.warn('[Reaper] employee_invitations sweep failed (non-fatal):', err);
  }

  log.info(`[Reaper] Daily sweep complete — ${reaped} invites expired`);
}

export function registerInviteReaperCron(scheduler: { register: Function }): void {
  scheduler.register('Invite Reaper — 24h sweep', {
    interval: '0 2 * * *', // 2 AM daily
    handler: runInviteReaper,
  });
  log.info('[Reaper] Invite Reaper registered — daily 2 AM sweep active');
}
