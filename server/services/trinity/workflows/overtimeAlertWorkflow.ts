import { pool } from '../../../db';
import { platformEventBus } from '../../platformEventBus';
import { createLogger } from '../../../lib/logger';

const log = createLogger('OvertimeAlertWorkflow');

function getStartOfCurrentWorkWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function runOvertimeApproachingAlert(): Promise<void> {
  const weekStart = getStartOfCurrentWorkWeek();
  const now = new Date();

  const { rows } = await pool.query(`
    SELECT
      e.id          AS employee_id,
      e.workspace_id,
      e.first_name,
      e.last_name,
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (
          COALESCE(te.clock_out_time, NOW()) - te.clock_in_time
        )) / 3600
      ), 0) AS hours_this_week
    FROM employees e
    LEFT JOIN time_entries te
           ON te.employee_id = e.id
          AND te.clock_in_time >= $1
          AND te.clock_in_time <= $2
    WHERE e.is_active = TRUE
      AND e.worker_type = 'employee'
    GROUP BY e.id, e.workspace_id, e.first_name, e.last_name
    HAVING COALESCE(SUM(
      EXTRACT(EPOCH FROM (
        COALESCE(te.clock_out_time, NOW()) - te.clock_in_time
      )) / 3600
    ), 0) BETWEEN 36 AND 40
  `, [weekStart, now]);

  for (const row of rows) {
    const hoursLeft = (40 - parseFloat(row.hours_this_week)).toFixed(1);
    platformEventBus.publish({
      type: 'officer_approaching_overtime',
      category: 'payroll',
      title: `Overtime Alert: ${row.first_name} ${row.last_name}`,
      description: `Officer has ${parseFloat(row.hours_this_week).toFixed(1)}h this week — ${hoursLeft}h until overtime threshold.`,
      workspaceId: row.workspace_id,
      metadata: {
        employeeId: row.employee_id,
        hoursThisWeek: parseFloat(row.hours_this_week),
        hoursUntilOvertime: parseFloat(hoursLeft),
      },
    }).catch(() => {});
  }

  log.info(`[OvertimeAlert] Scanned ${rows.length} officers approaching overtime`);
}
