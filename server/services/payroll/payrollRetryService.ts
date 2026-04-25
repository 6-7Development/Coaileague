/**
 * PAYROLL ACH RETRY SERVICE
 * ==========================
 * Retries failed ACH direct deposit transfers for a payroll run.
 * Extracted from the 101-line POST /runs/:id/retry-failed-transfers handler.
 *
 * Eligibility: pay stubs with plaidTransferStatus IN ('failed', 'poll_failed', 'returned').
 * Each stub is retried individually with its own idempotency key (retry-{stubId}).
 * Results: retried | skipped (payment_held / no bank info) | failed (error)
 *
 * Professional+ tier required — ACH is a premium payroll feature.
 * Non-blocking event published for each initiated retry.
 */

import { db } from '../../db';
import { payStubs } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { storage } from '../../storage';
import { platformEventBus } from '../platformEventBus';
import { initiatePayrollAchTransfer } from './achTransferService';
import { createLogger } from '../../lib/logger';

const log = createLogger('payrollRetryService');

export interface RetryTransferResult {
  stubId: string;
  employeeId: string;
  status: 'retried' | 'skipped' | 'failed';
  transferId?: string;
  reason?: string;
}

export interface PayrollRetryResult {
  success: boolean;
  runId?: string;
  totalFailed?: number;
  retriedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  results?: RetryTransferResult[];
  error?: string;
  status?: number;
}

export async function retryFailedPayrollTransfers(
  workspaceId: string,
  runId: string,
  userId: string,
): Promise<PayrollRetryResult> {
  // Verify the run exists and belongs to this workspace
  const run = await storage.getPayrollRun(runId, workspaceId);
  if (!run) return { success: false, error: 'Payroll run not found', status: 404 };

  // Find all failed/poll_failed/returned pay stubs for this run
  const failedStubs = await db.select().from(payStubs)
    .where(and(
      eq(payStubs.payrollRunId, runId),
      eq(payStubs.workspaceId, workspaceId),
      sql`${payStubs.plaidTransferStatus} IN ('failed', 'poll_failed', 'returned')`,
    ));

  if (failedStubs.length === 0) {
    return { success: false, error: 'No failed transfers found for this payroll run', status: 400 };
  }

  const results: RetryTransferResult[] = [];

  for (const stub of failedStubs) {
    try {
      const empId = (stub as any).employeeId;
      const netPay = parseFloat(String((stub as any).netPay ?? 0));

      const transferResult = await initiatePayrollAchTransfer({
        workspaceId,
        employeeId: empId,
        payrollRunId: runId,
        payrollEntryId: (stub as any).payrollEntryId || null,
        payStubId: stub.id,
        amount: netPay,
        idempotencyKey: `retry-${stub.id}`,
        description: 'Payroll Retry',
        legalName: empId,
      });

      if (transferResult.status === 'initiated') {
        // Non-blocking event per successful retry
        platformEventBus.publish({
          type: 'payroll_transfer_initiated' as any,
          category: 'payroll',
          title: 'ACH Transfer Retry Initiated',
          description: `Retry transfer ${transferResult.transferId} initiated for employee ${empId}`,
          workspaceId,
          userId,
          metadata: {
            payrollRunId: runId,
            employeeId: empId,
            transferId: transferResult.transferId,
            amount: netPay,
            isRetry: true,
          },
          visibility: 'manager',
        }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

        results.push({ stubId: stub.id, employeeId: empId, status: 'retried', transferId: transferResult.transferId });
        continue;
      }

      if (transferResult.status === 'payment_held') {
        results.push({ stubId: stub.id, employeeId: empId, status: 'skipped', reason: transferResult.reason || 'PAYMENT_HELD' });
        continue;
      }

      if (transferResult.status === 'skipped') {
        results.push({ stubId: stub.id, employeeId: empId, status: 'skipped', reason: transferResult.reason || 'Transfer skipped' });
        continue;
      }

      results.push({ stubId: stub.id, employeeId: empId, status: 'failed', reason: transferResult.reason || 'Transfer failed' });
    } catch (err: unknown) {
      results.push({
        stubId: stub.id,
        employeeId: (stub as any).employeeId,
        status: 'failed',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const retriedCount = results.filter(r => r.status === 'retried').length;
  log.info(`[PayrollRetry] Run ${runId}: ${retriedCount}/${failedStubs.length} retried`);

  return {
    success: true,
    runId,
    totalFailed: failedStubs.length,
    retriedCount,
    skippedCount: results.filter(r => r.status === 'skipped').length,
    errorCount: results.filter(r => r.status === 'failed').length,
    results,
  };
}
