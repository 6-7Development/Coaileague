/**
 * Recycled Credits Pipeline — handles credit refunds and recycling for failed AI calls
 */
import { creditBalanceService } from './creditBalanceService';
import { createLogger } from '../../lib/logger';
const log = createLogger('RecycledCreditsPipeline');

export const recycledCreditsPipeline = {
  async refund(workspaceId: string, creditsToRefund: number, reason: string): Promise<void> {
    if (creditsToRefund <= 0) return;
    await creditBalanceService.addCredits(workspaceId, creditsToRefund, 'carryover');
    log.info(`[RecycledCredits] Refunded ${creditsToRefund} credits to ${workspaceId}: ${reason}`);
  },

  async run(workspaceId: string): Promise<{ refunded: number }> {
    // Scan ai_usage_log for failed calls in last 24h and refund
    const { pool } = await import('../../db');
    const { rows } = await pool.query(
      `SELECT SUM(cost_basis_usd * 1000)::int as total_to_refund
       FROM ai_usage_log
       WHERE workspace_id = $1
         AND created_at > NOW() - INTERVAL '24 hours'
         AND feature_key LIKE '%_failed'`,
      [workspaceId]
    );
    const toRefund = rows[0]?.total_to_refund ?? 0;
    if (toRefund > 0) await this.refund(workspaceId, toRefund, 'Failed AI call refund');
    return { refunded: toRefund };
  },
};
