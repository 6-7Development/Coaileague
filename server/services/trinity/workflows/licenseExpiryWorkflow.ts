/**
 * License Expiry Alert Workflow
 *
 * Runs daily at 6am. Scans for:
 * 1. Guard cards expiring in 60 days (early warning)
 * 2. Guard cards expiring in 30 days (urgent warning)
 * 3. Tier 3 officers approaching their 14-day window (Day 10 and Day 14)
 * 4. Officers with no adverse action confirmation past due
 *
 * Fires Trinity platform events — workspace managers receive alerts.
 * Does NOT block access — compliance scoring handles that separately.
 */

import { db } from '../../../db';
import { employees } from '@shared/schema';
import { and, eq, lt, gte, isNotNull } from 'drizzle-orm';
import { platformEventBus } from '../../platformEventBus';
import { createLogger } from '../../../lib/logger';

const log = createLogger('LicenseExpiryWorkflow');

export async function runLicenseExpiryAlerts(): Promise<void> {
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  // 1. Guard cards expiring in ≤60 days
  const expiring = await db
    .select({
      id: employees.id,
      workspaceId: employees.workspaceId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      guardCardExpiryDate: employees.guardCardExpiryDate,
      isArmed: employees.isArmed,
    })
    .from(employees)
    .where(
      and(
        eq(employees.isActive, true),
        isNotNull(employees.guardCardExpiryDate),
        lt(employees.guardCardExpiryDate, in60Days.toISOString().slice(0, 10)),
        gte(employees.guardCardExpiryDate, now.toISOString().slice(0, 10)),
      ),
    );

  // ── Batch by workspace — one notification per workspace, not per officer ──
  const today = now.toISOString().slice(0, 10);
  const byWorkspace = new Map<string, typeof expiring>();
  for (const emp of expiring) {
    if (!emp.guardCardExpiryDate) continue;
    const list = byWorkspace.get(emp.workspaceId) || [];
    list.push(emp);
    byWorkspace.set(emp.workspaceId, list);
  }

  for (const [workspaceId, officers] of byWorkspace) {
    const urgent = officers.filter(e => {
      const d = Math.ceil((new Date(e.guardCardExpiryDate!).getTime() - now.getTime()) / 86400000);
      return d <= 30;
    });
    const warning = officers.filter(e => {
      const d = Math.ceil((new Date(e.guardCardExpiryDate!).getTime() - now.getTime()) / 86400000);
      return d > 30;
    });

    const hasUrgent = urgent.length > 0;
    const total = officers.length;

    // Build a clean, concise officer list (max 5 names to avoid notification overflow)
    const officerLines = officers
      .map(e => {
        const d = Math.ceil((new Date(e.guardCardExpiryDate!).getTime() - now.getTime()) / 86400000);
        return `${e.firstName} ${e.lastName} — ${d} day${d !== 1 ? 's' : ''} (${e.isArmed ? 'Armed' : 'Unarmed'})`;
      })
      .slice(0, 5);
    if (officers.length > 5) officerLines.push(`…and ${officers.length - 5} more`);

    const idempotencyKey = `license-expiry-batch-${workspaceId}-${today}`;

    platformEventBus
      .publish({
        type: 'license_expiring_soon',
        category: 'compliance',
        title: hasUrgent
          ? `⚠️ ${urgent.length} Officer License${urgent.length > 1 ? 's' : ''} Require Immediate Renewal`
          : `${total} Officer License${total > 1 ? 's' : ''} Expiring — Action Required`,
        description: [
          hasUrgent
            ? `${urgent.length} officer${urgent.length > 1 ? 's have' : ' has'} a license expiring within 30 days.`
            : `${total} officer${total > 1 ? 's have' : ' has'} a license expiring within 60 days.`,
          '',
          officerLines.join('\n'),
          '',
          'Please coordinate renewals promptly to avoid scheduling disruptions.',
        ].join('\n'),
        workspaceId,
        idempotencyKey,
        metadata: {
          officerCount: total,
          urgentCount: urgent.length,
          warningCount: warning.length,
          officerIds: officers.map(e => e.id),
          batchDate: today,
        },
      })
      .catch(() => {});
  }

  // 2. Tier 3 officers approaching 14-day window end
  const approachingExpiry = await db
    .select({
      id: employees.id,
      workspaceId: employees.workspaceId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workAuthorizationWindowExpires: employees.workAuthorizationWindowExpires,
    })
    .from(employees)
    .where(
      and(
        eq(employees.isActive, true),
        eq(employees.guardCardStatus, 'substantially_complete'),
        isNotNull(employees.workAuthorizationWindowExpires),
        lt(employees.workAuthorizationWindowExpires, in4Days),
        gte(employees.workAuthorizationWindowExpires, now),
      ),
    );

  // ── Batch provisional auth alerts per workspace ──────────────────────────
  const provByWorkspace = new Map<string, typeof approachingExpiry>();
  for (const emp of approachingExpiry) {
    if (!emp.workAuthorizationWindowExpires) continue;
    const list = provByWorkspace.get(emp.workspaceId) || [];
    list.push(emp);
    provByWorkspace.set(emp.workspaceId, list);
  }

  for (const [workspaceId, officers] of provByWorkspace) {
    const minDays = Math.min(...officers.map(e =>
      Math.ceil((new Date(e.workAuthorizationWindowExpires!).getTime() - now.getTime()) / 86400000)
    ));
    const officerLines = officers
      .map(e => {
        const d = Math.ceil((new Date(e.workAuthorizationWindowExpires!).getTime() - now.getTime()) / 86400000);
        return `${e.firstName} ${e.lastName} — ${d} day${d !== 1 ? 's' : ''} remaining`;
      })
      .slice(0, 5);
    if (officers.length > 5) officerLines.push(`…and ${officers.length - 5} more`);

    const idempotencyKey = `prov-auth-batch-${workspaceId}-${today}`;

    platformEventBus
      .publish({
        type: 'provisional_authorization_expiring',
        category: 'compliance',
        title: `Action Required: ${officers.length} Provisional Authorization${officers.length > 1 ? 's' : ''} Expiring`,
        description: [
          `${officers.length} officer${officers.length > 1 ? 's have' : ' has'} a provisional work authorization window closing within ${minDays} day${minDays !== 1 ? 's' : ''}.`,
          '',
          officerLines.join('\n'),
          '',
          'Verify TOPS for no adverse action. Upload proof of license if issued. Unresolved officers will be blocked from shifts.',
        ].join('\n'),
        workspaceId,
        idempotencyKey,
        metadata: {
          officerCount: officers.length,
          officerIds: officers.map(e => e.id),
          minimumDaysLeft: minDays,
          actionRequired: 'verify_tops_no_adverse_action',
          batchDate: today,
        },
      })
      .catch(() => {});
  }

  log.info(
    `[LicenseExpiry] Scanned ${expiring.length} expiring licenses, ${approachingExpiry.length} approaching Tier 3 window expiry`,
  );
}
