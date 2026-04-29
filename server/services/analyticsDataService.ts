/**
 * Analytics Data Service — queries real seeded data from shifts, invoices, employees
 */
import { pool } from './db';
import { createLogger } from './lib/logger';
const log = createLogger('AnalyticsDataService');

export const analyticsDataService = {
  async getWorkspaceSummary(workspaceId: string, days = 30) {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM shifts WHERE workspace_id=$1 AND status IN ('completed','in_progress')) as total_shifts,
        (SELECT COUNT(*) FROM employees WHERE workspace_id=$1 AND status='active') as active_employees,
        (SELECT COUNT(*) FROM clients WHERE workspace_id=$1 AND status='active') as active_clients,
        (SELECT COALESCE(SUM(amount_cents),0)/100.0 FROM invoices WHERE workspace_id=$1 AND status='paid' AND created_at > NOW()-($2||' days')::interval) as revenue,
        (SELECT COALESCE(SUM(amount_cents),0)/100.0 FROM invoices WHERE workspace_id=$1 AND status='overdue') as overdue_amount,
        (SELECT COUNT(*) FROM shifts WHERE workspace_id=$1 AND status='open' AND start_time > NOW()) as open_shifts
    `, [workspaceId, days]);
    return rows[0];
  },

  async getShiftCoverage(workspaceId: string) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='completed') as completed,
        COUNT(*) FILTER (WHERE status='open') as open,
        COUNT(*) FILTER (WHERE status='cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
        COUNT(*) as total
      FROM shifts WHERE workspace_id=$1 AND start_time > NOW() - INTERVAL '30 days'
    `, [workspaceId]);
    return rows[0];
  },

  async getRevenueByClient(workspaceId: string, limit = 5) {
    const { rows } = await pool.query(`
      SELECT c.name, COALESCE(SUM(i.amount_cents),0)/100.0 as revenue, COUNT(i.id) as invoice_count
      FROM clients c
      LEFT JOIN invoices i ON i.client_id=c.id AND i.status='paid'
      WHERE c.workspace_id=$1
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT $2
    `, [workspaceId, limit]);
    return rows;
  },

  async getPayrollSummary(workspaceId: string) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) as total_runs,
        COALESCE(SUM(total_gross_pay_cents),0)/100.0 as total_gross,
        COALESCE(SUM(total_net_pay_cents),0)/100.0 as total_net,
        COALESCE(SUM(total_employer_taxes_cents),0)/100.0 as total_employer_tax
      FROM payroll_runs WHERE workspace_id=$1 AND status='completed'
    `, [workspaceId]);
    return rows[0];
  },

  async getTimeEntrySummary(workspaceId: string, days = 30) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) as total_entries,
        COALESCE(SUM(total_minutes),0)/60.0 as total_hours,
        COUNT(*) FILTER (WHERE status='approved') as approved,
        COUNT(*) FILTER (WHERE status='pending') as pending
      FROM time_entries WHERE workspace_id=$1 AND clock_in > NOW()-($2||' days')::interval
    `, [workspaceId, days]);
    return rows[0];
  },
};
