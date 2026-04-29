/**
 * State Verification Service — verifies Trinity action results
 * by checking the actual database state after actions complete
 */
import { pool } from '../../../db';
import { createLogger } from '../../../lib/logger';
const log = createLogger('StateVerificationService');

export const stateVerificationService = {
  async verifyShiftFilled(workspaceId: string, shiftId: string, expectedEmployeeId: string): Promise<boolean> {
    try {
      const { rows } = await pool.query(`
        SELECT assigned_employee_id, status FROM shifts
        WHERE id=$1 AND workspace_id=$2
      `, [shiftId, workspaceId]);
      const match = rows[0]?.assigned_employee_id === expectedEmployeeId && rows[0]?.status === 'assigned';
      log.debug(`[StateVerify] Shift ${shiftId} filled verification: ${match}`);
      return match;
    } catch { return false; }
  },

  async verifyWorkspaceHealth(workspaceId: string): Promise<{ healthy: boolean; issues: string[] }> {
    try {
      const { rows } = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM shifts WHERE workspace_id=$1 AND status='open' AND start_time < NOW()) as overdue_open,
          (SELECT COUNT(*) FROM employees WHERE workspace_id=$1 AND status='active') as active_employees,
          (SELECT COUNT(*) FROM invoices WHERE workspace_id=$1 AND status='overdue') as overdue_invoices
      `, [workspaceId]);
      const s = rows[0];
      const issues: string[] = [];
      if (s.overdue_open > 0) issues.push(`${s.overdue_open} shifts started without coverage`);
      if (s.active_employees === 0) issues.push('No active employees');
      if (s.overdue_invoices > 0) issues.push(`${s.overdue_invoices} overdue invoices`);
      return { healthy: issues.length === 0, issues };
    } catch { return { healthy: false, issues: ['State check failed'] }; }
  },
};
