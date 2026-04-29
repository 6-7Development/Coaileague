/**
 * Credit Management Routes — real endpoints using credit_balances table
 */
import { Router } from 'express';
import { requireAuth } from '../rbac';
import { ensureWorkspaceAccess } from '../middleware/workspaceScope';
import type { AuthenticatedRequest } from '../rbac';
import { creditBalanceService } from '../services/billing/creditBalanceService';
import { pool } from '../db';

const router = Router();

// GET /api/credits/balance — current workspace credit balance
router.get('/balance', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const balance = await creditBalanceService.getBalance(req.workspaceId!);
    res.json(balance);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/credits/usage — AI usage log for workspace
router.get('/usage', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT feature_key, COUNT(*) as calls,
             SUM(tokens_used) as total_tokens,
             SUM(cost_basis_usd) as total_cost_usd,
             MAX(created_at) as last_used
      FROM ai_usage_log
      WHERE workspace_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY feature_key
      ORDER BY total_tokens DESC
      LIMIT 20
    `, [req.workspaceId]);
    res.json({ usage: rows, period: '30d' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/credits/history — credit transaction history
router.get('/history', requireAuth, ensureWorkspaceAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT feature_key as feature, tokens_used as tokens,
             cost_basis_usd as cost, created_at
      FROM ai_usage_log
      WHERE workspace_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [req.workspaceId]);
    res.json({ history: rows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
