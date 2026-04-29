/**
 * Credit Reset Cron — resets subscription credits monthly, rolls over unused balance
 */
import { db } from '../../db';
import { creditBalances } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';
const log = createLogger('CreditResetCron');

const MONTHLY_SUBSCRIPTION_CREDITS_BY_TIER: Record<string, number> = {
  free: 1000, trial: 5000, starter: 10000, professional: 25000, business: 50000, enterprise: 200000, strategic: 500000,
};

export function initCreditResetCron() {
  log.info('[CreditResetCron] Monthly credit reset cron initialized (runs on 1st of month at 02:00 UTC)');
  // Scheduled externally by WeeklyBillingRunService — this exports the reset logic
}

export async function runMonthlyReset(workspaceId: string, subscriptionTier: string): Promise<void> {
  const monthlyAllotment = MONTHLY_SUBSCRIPTION_CREDITS_BY_TIER[subscriptionTier] ?? 1000;
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0);

  await db.update(creditBalances)
    .set({
      carryoverCredits: sql`LEAST(subscription_credits, ${monthlyAllotment / 2})`, // carry over up to 50%
      subscriptionCredits: monthlyAllotment,
      lastResetAt: now,
      nextResetAt: nextReset,
      updatedAt: now,
    })
    .where(sql`workspace_id = ${workspaceId}`);

  log.info(`[CreditResetCron] Reset credits for ${workspaceId} → ${monthlyAllotment} subscription credits`);
}
