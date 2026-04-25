import { and, eq } from 'drizzle-orm';
import { db } from 'server/db';
import { payrollEntries, payrollRuns, timeEntries } from '@shared/schema';
import { isTerminalPayrollStatus } from './payrollStatus';
import { platformEventBus } from '../platformEventBus';
import { createLogger } from '../../lib/logger';

const log = createLogger('PayrollRunDeleteService');

export interface DeletePayrollRunParams {
  workspaceId: string;
  payrollRunId: string;
  userId?: string | null;
  reason?: string | null;
}

export interface DeletePayrollRunResult {
  success: true;
  payrollRunId: string;
  deletedEntries: number;
  releasedTimeEntries: number;
  previousStatus: string | null;
}

/**
 * Delete a non-terminal payroll run and release its claimed time entries.
 *
 * Terminal payroll runs are intentionally protected. Once a run is approved,
 * processed, paid, or completed, the platform should use void/reversal/correction
 * workflows rather than destructive delete.
 */
export async function deletePayrollRun({
  workspaceId,
  payrollRunId,
  userId,
  reason,
}: DeletePayrollRunParams): Promise<DeletePayrollRunResult> {
  if (!workspaceId) throw Object.assign(new Error('workspaceId is required'), { status: 400 });
  if (!payrollRunId) throw Object.assign(new Error('payrollRunId is required'), { status: 400 });

  const result = await db.transaction(async (tx) => {
    const [run] = await tx.select()
      .from(payrollRuns)
      .where(and(
        eq(payrollRuns.workspaceId, workspaceId),
        eq(payrollRuns.id, payrollRunId),
      ))
      .limit(1);

    if (!run) {
      throw Object.assign(new Error('Payroll run not found'), { status: 404 });
    }

    if (isTerminalPayrollStatus(run.status)) {
      throw Object.assign(
        new Error(`Payroll run ${payrollRunId} is ${run.status}; use a void/reversal workflow instead of delete.`),
        { status: 409 },
      );
    }

    const released = await tx.update(timeEntries)
      .set({
        payrolledAt: null,
        payrollRunId: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.payrollRunId, payrollRunId),
      ))
      .returning({ id: timeEntries.id });

    const deletedEntries = await tx.delete(payrollEntries)
      .where(and(
        eq(payrollEntries.workspaceId, workspaceId),
        eq(payrollEntries.payrollRunId, payrollRunId),
      ))
      .returning({ id: payrollEntries.id });

    const deletedRuns = await tx.delete(payrollRuns)
      .where(and(
        eq(payrollRuns.workspaceId, workspaceId),
        eq(payrollRuns.id, payrollRunId),
      ))
      .returning({ id: payrollRuns.id });

    if (deletedRuns.length !== 1) {
      throw Object.assign(new Error('Payroll run delete failed'), { status: 500 });
    }

    return {
      success: true as const,
      payrollRunId,
      deletedEntries: deletedEntries.length,
      releasedTimeEntries: released.length,
      previousStatus: run.status ?? null,
    };
  });

  platformEventBus.publish({
    type: 'payroll_run_deleted',
    category: 'payroll',
    title: 'Payroll Run Deleted',
    description: `Payroll run ${payrollRunId} was deleted and linked time entries were released.`,
    workspaceId,
    userId: userId || undefined,
    metadata: {
      payrollRunId,
      deletedEntries: result.deletedEntries,
      releasedTimeEntries: result.releasedTimeEntries,
      previousStatus: result.previousStatus,
      reason: reason || null,
      source: 'payrollRunDeleteService',
    },
  }).catch((err: any) => log.warn('[PayrollRunDeleteService] Event publish failed (non-blocking):', err?.message));

  return result;
}
