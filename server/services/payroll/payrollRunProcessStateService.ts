import { and, eq } from 'drizzle-orm';
import { db } from 'server/db';
import { billingAuditLog, payrollEntries, payrollRuns } from '@shared/schema';
import { storage } from 'server/storage';
import { platformEventBus } from '../platformEventBus';
import { createLogger } from '../../lib/logger';

const log = createLogger('PayrollRunProcessStateService');

export interface ProcessPayrollRunStateParams {
  workspaceId: string;
  payrollRunId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  processedAt?: Date;
  disbursementMethod?: string | null;
  providerBatchId?: string | null;
  reason?: string | null;
}

export interface ProcessPayrollRunStateResult {
  success: true;
  payrollRunId: string;
  previousStatus: string | null;
  status: 'processed';
  processedAt: string;
  updatedEntries: number;
  alreadyProcessed: boolean;
}

function statusError(message: string, status: number, extra?: Record<string, unknown>) {
  return Object.assign(new Error(message), { status, extra });
}

function canProcessStatus(status: string | null | undefined): boolean {
  return ['approved', 'processing', 'processed', 'disbursing'].includes(String(status || ''));
}

function isAlreadyProcessed(status: string | null | undefined): boolean {
  return ['processed', 'disbursing'].includes(String(status || ''));
}

/**
 * Canonical payroll run process-state transition.
 *
 * This does NOT initiate ACH/NACHA/Plaid transfers. Payment initiation belongs
 * to provider-specific orchestration. This service records that a run has moved
 * into the processed state after the payment-initiation workflow has been
 * accepted or is ready for disbursement.
 */
export async function processPayrollRunState({
  workspaceId,
  payrollRunId,
  userId,
  userEmail = 'unknown',
  userRole = 'user',
  ipAddress = null,
  userAgent = null,
  processedAt = new Date(),
  disbursementMethod = null,
  providerBatchId = null,
  reason = null,
}: ProcessPayrollRunStateParams): Promise<ProcessPayrollRunStateResult> {
  if (!workspaceId) throw statusError('workspaceId is required', 400);
  if (!payrollRunId) throw statusError('payrollRunId is required', 400);
  if (!userId) throw statusError('userId is required', 401);

  const result = await db.transaction(async (tx) => {
    const [run] = await tx.select()
      .from(payrollRuns)
      .where(and(
        eq(payrollRuns.workspaceId, workspaceId),
        eq(payrollRuns.id, payrollRunId),
      ))
      .for('update')
      .limit(1);

    if (!run) throw statusError('Payroll run not found', 404);

    const previousStatus = run.status ?? null;

    if (!canProcessStatus(previousStatus)) {
      throw statusError(`Payroll run ${payrollRunId} is ${previousStatus || 'unknown'} and cannot be processed yet. Approve the run before processing.`, 409, {
        code: 'PAYROLL_RUN_NOT_READY_FOR_PROCESSING',
        previousStatus,
      });
    }

    if (isAlreadyProcessed(previousStatus)) {
      return {
        success: true as const,
        payrollRunId,
        previousStatus,
        status: 'processed' as const,
        processedAt: (run.processedAt || processedAt).toISOString(),
        updatedEntries: 0,
        alreadyProcessed: true,
      };
    }

    const providerData = {
      ...((run.providerData as Record<string, unknown> | null) || {}),
      ...(providerBatchId ? { providerBatchId } : {}),
      ...(disbursementMethod ? { disbursementMethod } : {}),
      processedBy: userId,
      processedAt: processedAt.toISOString(),
      processStateSource: 'payrollRunProcessStateService',
    };

    const [updatedRun] = await tx.update(payrollRuns)
      .set({
        status: 'processed',
        processedBy: userId,
        processedAt,
        disbursementStatus: 'pending',
        disbursementDate: run.disbursementDate || processedAt,
        providerData,
        updatedAt: processedAt,
      })
      .where(and(
        eq(payrollRuns.workspaceId, workspaceId),
        eq(payrollRuns.id, payrollRunId),
      ))
      .returning({ id: payrollRuns.id });

    if (!updatedRun) throw statusError('Payroll run process update failed', 500);

    const entryPatch: Record<string, unknown> = {
      payoutStatus: 'pending',
      payoutInitiatedAt: processedAt,
      updatedAt: processedAt,
    };
    if (disbursementMethod) entryPatch.disbursementMethod = disbursementMethod;

    const updatedEntries = await tx.update(payrollEntries)
      .set(entryPatch as any)
      .where(and(
        eq(payrollEntries.workspaceId, workspaceId),
        eq(payrollEntries.payrollRunId, payrollRunId),
      ))
      .returning({ id: payrollEntries.id });

    return {
      success: true as const,
      payrollRunId,
      previousStatus,
      status: 'processed' as const,
      processedAt: processedAt.toISOString(),
      updatedEntries: updatedEntries.length,
      alreadyProcessed: false,
    };
  });

  storage.createAuditLog({
    workspaceId,
    userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'update',
    entityType: 'payroll_run',
    entityId: payrollRunId,
    actionDescription: `Payroll run ${payrollRunId} processed`,
    changes: {
      before: { status: result.previousStatus },
      after: { status: 'processed', processedAt: result.processedAt, disbursementMethod, providerBatchId, reason },
    },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch(err => log.error('[FinancialAudit] CRITICAL: SOC2 audit log write failed for payroll process', { error: err?.message }));

  db.insert(billingAuditLog).values({
    workspaceId,
    eventType: 'payroll_run_processed',
    eventCategory: 'payroll',
    actorType: 'user',
    actorId: userId,
    actorEmail: userEmail || null,
    description: 'Payroll run processed',
    relatedEntityType: 'payroll_run',
    relatedEntityId: payrollRunId,
    oldState: { status: result.previousStatus },
    newState: {
      status: 'processed',
      processedAt: result.processedAt,
      updatedEntries: result.updatedEntries,
      alreadyProcessed: result.alreadyProcessed,
      disbursementMethod,
      providerBatchId,
    },
    ipAddress,
    userAgent,
  }).catch(err => log.error('[BillingAudit] billing_audit_log write failed for payroll process', { error: err?.message }));

  try {
    const { broadcastToWorkspace } = await import('../websocket');
    broadcastToWorkspace(workspaceId, {
      type: 'payroll_updated',
      action: 'processed',
      runId: payrollRunId,
      payrollRunId,
      disbursementMethod,
    });
  } catch (broadcastErr: any) {
    log.warn('[PayrollRunProcessStateService] Failed to broadcast process update (non-blocking):', broadcastErr?.message);
  }

  platformEventBus.publish({
    type: 'payroll_run_processed',
    category: 'payroll',
    title: 'Payroll Run Processed',
    description: `Payroll run ${payrollRunId} processed`,
    workspaceId,
    userId,
    metadata: {
      payrollRunId,
      previousStatus: result.previousStatus,
      processedAt: result.processedAt,
      updatedEntries: result.updatedEntries,
      alreadyProcessed: result.alreadyProcessed,
      disbursementMethod,
      providerBatchId,
      reason,
      source: 'payrollRunProcessStateService',
    },
  }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

  return result;
}
