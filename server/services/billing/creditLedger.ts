/**
 * Credit Ledger — records credit transactions to ai_usage_log
 */
import { createLogger } from '../../lib/logger';
const log = createLogger('CreditLedger');

export const creditLedger = {
  async record(workspaceId: string, userId: string | null, feature: string, tokens: number, costCredits: number) {
    try {
      const { pool } = await import('../../db');
      await pool.query(
        `INSERT INTO ai_usage_log (id, workspace_id, user_id, feature_key, tokens_used, cost_basis_usd, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
        [workspaceId, userId, feature, tokens, costCredits / 1000]
      );
    } catch { /* non-fatal */ }
  },
};
