/**
 * Billing Action Service — Per-action charge recording
 * ─────────────────────────────────────────────────────────────────────────────
 * Records every billable action that isn't covered by the base subscription:
 *   - Invoice processing (perInvoiceProcessedCents)
 *   - Payroll employee runs (perPayrollEmployeeCents)
 *   - ACH direct deposits (perDirectDepositCents)
 *   - Premium AI events (RFP, contract, compliance audit — $500–$1,500)
 *   - Addon credit consumption
 *
 * All writes are fire-and-forget (setImmediate). Trinity is never delayed.
 * Billing failures are logged, never surface as user errors.
 *
 * GAP FIX: These functions were defined in PLATFORM_TIERS but never called.
 * Wire them at the point of action in payroll, invoice, and Plaid routes.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { isBillingExcluded } from './billingConstants';
import { PLATFORM_TIERS, PREMIUM_EVENTS } from '../../../shared/billingConfig';
import type { SubscriptionTier } from '../../../shared/billingConfig';

const log = createLogger('BillingActionService');

// ── Core action recorder ─────────────────────────────────────────────────────

async function recordBillingAction(params: {
  workspaceId: string;
  actionType: string;
  amountCents: number;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (isBillingExcluded(params.workspaceId) || params.amountCents === 0) return;

  await pool.query(
    `INSERT INTO billing_action_log
       (workspace_id, action_type, amount_cents, entity_id, entity_type, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
    [
      params.workspaceId,
      params.actionType,
      params.amountCents,
      params.entityId || null,
      params.entityType || null,
      JSON.stringify(params.metadata || {}),
    ]
  ).catch(err => log.warn('[BillingAction] Log write failed (non-fatal):', err.message));
}

async function getWorkspaceTierConfig(workspaceId: string) {
  const result = await pool.query(
    `SELECT subscription_tier FROM workspaces WHERE id = $1 LIMIT 1`,
    [workspaceId]
  );
  const tier = (result.rows[0]?.subscription_tier || 'starter') as SubscriptionTier;
  return { tier, config: PLATFORM_TIERS[tier] || PLATFORM_TIERS.starter };
}

// ── Invoice processed ─────────────────────────────────────────────────────────

export function recordInvoiceProcessed(workspaceId: string, invoiceId: string): void {
  if (isBillingExcluded(workspaceId)) return;
  setImmediate(async () => {
    try {
      const { config } = await getWorkspaceTierConfig(workspaceId);
      const cents = (config as { perInvoiceProcessedCents?: number }).perInvoiceProcessedCents || 0;
      if (!cents) return;
      await recordBillingAction({
        workspaceId, actionType: 'invoice_processed',
        amountCents: cents, entityId: invoiceId, entityType: 'invoice',
      });
      log.debug(`[BillingAction] Invoice processed: ${cents / 100} charged for ws ${workspaceId}`);
    } catch (err: unknown) {
      log.warn('[BillingAction] recordInvoiceProcessed error:', err instanceof Error ? err.message : String(err));
    }
  });
}

// ── Payroll employee run ──────────────────────────────────────────────────────

export function recordPayrollRun(workspaceId: string, employeeCount: number, payrollPeriodId: string): void {
  if (isBillingExcluded(workspaceId)) return;
  setImmediate(async () => {
    try {
      const { config } = await getWorkspaceTierConfig(workspaceId);
      const perEmployee = (config as { perPayrollEmployeeCents?: number }).perPayrollEmployeeCents || 0;
      if (!perEmployee) return;
      const totalCents = perEmployee * employeeCount;
      await recordBillingAction({
        workspaceId, actionType: 'payroll_run',
        amountCents: totalCents, entityId: payrollPeriodId, entityType: 'payroll_period',
        metadata: { employeeCount, perEmployeeCents: perEmployee },
      });
      log.debug(`[BillingAction] Payroll run: ${employeeCount} employees, $${totalCents / 100} charged`);
    } catch (err: unknown) {
      log.warn('[BillingAction] recordPayrollRun error:', err instanceof Error ? err.message : String(err));
    }
  });
}

// ── ACH / Direct deposit ──────────────────────────────────────────────────────

export function recordDirectDeposit(workspaceId: string, payStubId: string, amountCents: number): void {
  if (isBillingExcluded(workspaceId)) return;
  setImmediate(async () => {
    try {
      const { config } = await getWorkspaceTierConfig(workspaceId);
      const fee = (config as { perDirectDepositCents?: number }).perDirectDepositCents || 0;
      if (!fee) return;
      await recordBillingAction({
        workspaceId, actionType: 'direct_deposit',
        amountCents: fee, entityId: payStubId, entityType: 'pay_stub',
        metadata: { transferAmountCents: amountCents },
      });
    } catch (err: unknown) {
      log.warn('[BillingAction] recordDirectDeposit error:', err instanceof Error ? err.message : String(err));
    }
  });
}

// ── Premium AI events ($500–$1,500) ──────────────────────────────────────────

export function recordPremiumEvent(
  workspaceId: string,
  eventKey: keyof typeof PREMIUM_EVENTS,
  entityId: string,
  metadata?: Record<string, unknown>
): void {
  if (isBillingExcluded(workspaceId)) return;
  setImmediate(async () => {
    try {
      const event = PREMIUM_EVENTS[eventKey];
      if (!event) return;
      await recordBillingAction({
        workspaceId, actionType: `premium_${eventKey}`,
        amountCents: event.priceCents, entityId, entityType: event.category,
        metadata: { eventName: event.name, ...metadata },
      });

      // Create Stripe invoice item for immediate billing
      const priceId = process.env[event.stripePriceEnvVar];
      if (priceId) {
        const { subscriptionManager } = await import('./subscriptionManager');
        await (subscriptionManager as {
          createInvoiceItem?: (workspaceId: string, priceId: string, qty: number) => Promise<void>
        }).createInvoiceItem?.(workspaceId, priceId, 1).catch(err =>
          log.warn('[BillingAction] Stripe invoice item failed:', err.message)
        );
      } else {
        log.warn(`[BillingAction] No Stripe price for ${event.stripePriceEnvVar} — logged only`);
      }

      log.info(`[BillingAction] Premium event ${eventKey}: $${event.priceCents / 100} for ws ${workspaceId}`);
    } catch (err: unknown) {
      log.warn('[BillingAction] recordPremiumEvent error:', err instanceof Error ? err.message : String(err));
    }
  });
}

// ── Soft cap threshold notifications ─────────────────────────────────────────

export async function checkAndNotifySoftCap(
  workspaceId: string,
  currentPct: number
): Promise<void> {
  if (isBillingExcluded(workspaceId)) return;

  const thresholds = [
    { pct: 80, col: 'soft_cap_80pct_sent_at', msg: '80%' },
    { pct: 90, col: 'soft_cap_90pct_sent_at', msg: '90%' },
    { pct: 100, col: 'soft_cap_100pct_sent_at', msg: '100% (overages now billing)' },
  ];

  for (const t of thresholds) {
    if (currentPct < t.pct) continue;

    // Check if already sent
    const check = await pool.query(
      `SELECT ${t.col} FROM workspace_ai_periods
       WHERE workspace_id = $1 AND billing_period_start = DATE_TRUNC('month', NOW())`,
      [workspaceId]
    ).catch(() => ({ rows: [] }));

    if (check.rows[0]?.[t.col]) continue; // Already sent

    // Mark as sent
    await pool.query(
      `UPDATE workspace_ai_periods SET ${t.col} = NOW()
       WHERE workspace_id = $1 AND billing_period_start = DATE_TRUNC('month', NOW())`,
      [workspaceId]
    ).catch(() => {});

    // Notify owner via notification system
    try {
      const { broadcastToWorkspace } = await import('../../websocket');
      await broadcastToWorkspace(workspaceId, {
        type: 'ai_cap_threshold',
        data: {
          threshold: t.pct,
          message: `Trinity AI usage has reached ${t.msg} of your monthly budget.${currentPct >= 100 ? ' Overage charges are now accumulating.' : ' Consider upgrading your plan.'}`,
        },
      });

      // Also write to notifications table
      await pool.query(
        `INSERT INTO notifications (workspace_id, title, message, priority, type, created_at)
         SELECT w.id, $2, $3, 'high', 'billing_alert', NOW()
         FROM users u JOIN workspaces w ON w.id = u.workspace_id
         WHERE u.workspace_id = $1 AND u.role IN ('org_owner','super_admin')
         LIMIT 1`,
        [workspaceId,
         `AI Usage at ${t.msg}`,
         `Trinity AI has used ${t.msg} of your monthly token budget.${currentPct >= 100 ? ' Overages are now billing.' : ''}`]
      ).catch(() => {});
    } catch (err: unknown) {
      log.warn('[BillingAction] Cap notification failed:', err instanceof Error ? err.message : String(err));
    }
  }
}

export const billingActionService = {
  recordInvoiceProcessed,
  recordPayrollRun,
  recordDirectDeposit,
  recordPremiumEvent,
  checkAndNotifySoftCap,
};
