/**
 * Goal Metrics Service — tracks Trinity autonomous action outcomes
 * against defined KPIs using agent_task_logs and shift coverage data
 */
import { pool } from '../../../db';
import { createLogger } from '../../../lib/logger';
const log = createLogger('GoalMetricsService');

export const goalMetricsService = {
  async track(workspaceId: string, goalType: string, outcome: 'success' | 'failure' | 'partial', metadata?: Record<string, unknown>) {
    try {
      await pool.query(`
        INSERT INTO agent_task_logs (id, task_id, workspace_id, level, message, metadata, created_at)
        VALUES (gen_random_uuid(), gen_random_uuid(), $1, $2, $3, $4, NOW())
      `, [workspaceId, outcome === 'success' ? 'info' : 'warn',
          `Goal ${goalType}: ${outcome}`, JSON.stringify({ goalType, outcome, ...metadata })]);
    } catch { /* non-fatal */ }
  },

  async getMetrics(workspaceId: string) {
    try {
      const { rows } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM shifts WHERE workspace_id=$1 AND status='completed' AND start_time > NOW()-INTERVAL '7 days') as shifts_filled_7d,
          (SELECT COUNT(*) FROM shifts WHERE workspace_id=$1 AND status='open' AND start_time > NOW()) as open_shifts,
          (SELECT COUNT(*) FROM agent_tasks WHERE workspace_id=$1 AND status='completed' AND created_at > NOW()-INTERVAL '7 days') as tasks_completed_7d,
          (SELECT COUNT(*) FROM agent_tasks WHERE workspace_id=$1 AND status='failed' AND created_at > NOW()-INTERVAL '7 days') as tasks_failed_7d
      `, [workspaceId]);
      return rows[0];
    } catch { return {}; }
  },
};
