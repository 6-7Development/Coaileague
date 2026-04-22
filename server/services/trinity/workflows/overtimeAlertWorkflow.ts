import { db } from '../../../db';
import { timeEntries, employees } from '@shared/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { platformEventBus } from '../../platformEventBus';
import { createLogger } from '../../../lib/logger';

const log = createLogger('OvertimeAlertWorkflow');

function getStartOfCurrentWorkWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function runOvertimeApproachingAlert(): Promise<void> {
  const weekStart = getStartOfCurrentWorkWeek();
  const now = new Date();

  // Use Drizzle ORM with correct column names (clockIn / clockOut per schema).
  // Include shifts that overlap the week boundary (clock_out > weekStart).
  const rows = await db
    .select({
      employeeId: employees.id,
      workspaceId: employees.workspaceId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      hoursThisWeek: sql<number>`
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (
            COALESCE(${timeEntries.clockOut}, NOW()) - GREATEST(${timeEntries.clockIn}, ${weekStart})
          )) / 3600
        ), 0)
      `,
    })
    .from(employees)
    .leftJoin(
      timeEntries,
      and(
        eq(timeEntries.employeeId, employees.id),
        // Overlap filter: entry touches the current work week
        lt(timeEntries.clockIn, now),
        sql`COALESCE(${timeEntries.clockOut}, NOW()) > ${weekStart}`,
      ),
    )
    .where(
      and(
        eq(employees.status, 'active'),
        eq(employees.workerType, 'employee'),
      ),
    )
    .groupBy(employees.id, employees.workspaceId, employees.firstName, employees.lastName)
    .having(
      sql`COALESCE(SUM(
        EXTRACT(EPOCH FROM (
          COALESCE(${timeEntries.clockOut}, NOW()) - GREATEST(${timeEntries.clockIn}, ${weekStart})
        )) / 3600
      ), 0) BETWEEN 36 AND 40`,
    );

  const publishResults = await Promise.allSettled(
    rows.map((row) => {
      const hoursThisWeek = Number(row.hoursThisWeek);
      const hoursLeft = (40 - hoursThisWeek).toFixed(1);
      return platformEventBus.publish({
        type: 'officer_approaching_overtime',
        category: 'payroll',
        title: `Overtime Alert: ${row.firstName} ${row.lastName}`,
        description: `Officer has ${hoursThisWeek.toFixed(1)}h this week — ${hoursLeft}h until overtime threshold.`,
        workspaceId: row.workspaceId,
        metadata: {
          employeeId: row.employeeId,
          hoursThisWeek,
          hoursUntilOvertime: parseFloat(hoursLeft),
          weekStart: weekStart.toISOString(),
        },
      });
    }),
  );

  const failed = publishResults.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    log.warn(`[OvertimeAlert] ${failed} of ${rows.length} overtime alerts failed to publish`);
  }

  log.info(`[OvertimeAlert] Scanned ${rows.length} officers approaching overtime`);
}
