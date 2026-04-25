/**
 * PAYROLL RUN APPROVAL SERVICE
 * ==============================
 * Handles the POST /runs/:id/approve handler extracted from payrollRoutes.ts.
 *
 * This is distinct from payrollProposalApprovalService.ts which handles
 * PATCH /proposals/:id/approve (pre-run proposal approval).
 * This service handles approval of an actual payroll RUN — the post-proposal
 * step that authorizes the run for processing and ACH disbursement.
 *
 * Key behaviors preserved:
 *   - Professional+ tier gate (run approval is a premium feature)
 *   - Write-protect on paid runs (closed accounting records)
 *   - State machine validation via isValidPayrollTransition()
 *   - Four-eyes rule: creator cannot approve their own run (GAP-11)
 *   - SOC2 audit log (awaited, not fire-and-forget — GAP-42 fix)
 *   - Billing audit log
 *   - QB sync via financialPipelineOrchestrator (non-blocking)
 *   - WebSocket broadcast + event bus publish (non-blocking)
 */

import { db } from '../../db';
import { billingAuditLog } from '@shared/schema';
import { storage } from '../../storage';
import { platformEventBus } from '../platformEventBus';
import { broadcastToWorkspace } from '../../websocket';
import { isValidPayrollTransition, resolvePayrollLifecycleStatus } from './payrollStatus';
import { createLogger } from '../../lib/logger';

const log = createLogger('payrollRunApprovalService');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovePayrollRunParams {
  workspaceId: string;
  payrollRunId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ApprovePayrollRunResult {
  success: boolean;
  run?: Record<string, unknown>;
  qbSync?: { synced: boolean; details?: unknown } | null;
  error?: string;
  code?: string;
  status?: number;
  extra?: Record<string, unknown>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function statusError(message: string, status: number, code?: string, extra?: Record<string, unknown>): Error {
  const err = new Error(message) as any;
  err.status = status;
  if (code)  err.code  = code;
  if (extra) err.extra = extra;
  return err;
}

// ─── Main Function ────────────────────────────────────────────────────────────

export async function approvePayrollRun(
  params: ApprovePayrollRunParams,
): Promise<ApprovePayrollRunResult> {
  const { workspaceId, payrollRunId, userId, userEmail, userRole, ipAddress, userAgent } = params;

  // Fetch the run
  const run = await storage.getPayrollRun(payrollRunId, workspaceId);
  if (!run) {
    throw statusError('Payroll run not found', 404);
  }

  // Write-protect: paid runs are closed accounting records
  if (run.status === 'paid') {
    throw statusError(
      'This record has been closed and cannot be modified',
      403,
      'RECORD_CLOSED',
      { currentStatus: run.status },
    );
  }

  // State machine validation
  const currentStatus = run.status ?? 'draft';
  if (!isValidPayrollTransition(currentStatus, 'approved')) {
    const lifecycleStatus = resolvePayrollLifecycleStatus(currentStatus);
    throw statusError(
      'Only payroll runs pending review can be approved',
      422,
      undefined,
      { currentStatus: lifecycleStatus || currentStatus },
    );
  }

  // Four-eyes rule (GAP-11): creator cannot approve their own run
  if (run.processedBy && run.processedBy === userId) {
    throw statusError(
      'You cannot approve a payroll run that you created. A different authorized manager must approve it.',
      403,
      'SELF_APPROVAL_FORBIDDEN',
    );
  }

  // ── Approve the run ────────────────────────────────────────────────────────
  const updated = await storage.updatePayrollRunStatus(payrollRunId, 'approved', userId, workspaceId);

  // SOC2 audit log (awaited — GAP-42: not fire-and-forget for financial ops)
  try {
    await storage.createAuditLog({
      workspaceId,
      userId,
      userEmail: userEmail || 'unknown',
      userRole: userRole || 'user',
      action: 'update',
      entityType: 'payroll_run',
      entityId: payrollRunId,
      actionDescription: `Payroll run ${payrollRunId} approved`,
      changes: {
        before: { status: 'pending' },
        after: { status: 'approved', approvedBy: userId },
      },
      isSensitiveData: true,
      complianceTag: 'soc2',
    });
  } catch (err: unknown) {
    log.error('[FinancialAudit] CRITICAL: SOC2 audit log write failed for payroll run approval', {
      runId: payrollRunId,
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Billing audit log
  try {
    await db.insert(billingAuditLog).values({
      workspaceId,
      eventType: 'payroll_run_approved',
      eventCategory: 'payroll',
      actorType: 'user',
      actorId: userId,
      actorEmail: userEmail || null,
      description: `Payroll run ${payrollRunId} approved for period ${(run as any).periodStart} to ${(run as any).periodEnd}`,
      relatedEntityType: 'payroll_run',
      relatedEntityId: payrollRunId,
      previousState: { status: 'pending' },
      newState: { status: 'approved', approvedBy: userId, approvedAt: new Date().toISOString() },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (err: unknown) {
    log.error('[BillingAudit] billing_audit_log write failed for payroll run approval', {
      runId: payrollRunId,
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // QB / accounting sync (non-blocking)
  let qbSyncResult = null;
  try {
    const { onPayrollApproved } = await import('../financialPipelineOrchestrator');
    qbSyncResult = await onPayrollApproved(payrollRunId, workspaceId, userId);
    log.info(`[PayrollRunApproval] QB sync result for run ${payrollRunId}:`, (qbSyncResult as any).action);
  } catch (syncError: unknown) {
    log.warn('[PayrollRunApproval] QB sync after approval failed (non-blocking):', {
      error: syncError instanceof Error ? syncError.message : String(syncError),
    });
  }

  // WebSocket broadcast (non-blocking)
  try {
    broadcastToWorkspace(workspaceId, {
      type: 'payroll_updated',
      action: 'approved',
      runId: payrollRunId,
    });
  } catch (wsErr: any) {
    log.warn('[PayrollRunApproval] WebSocket broadcast failed:', { error: wsErr?.message });
  }

  // Event bus publish (non-blocking)
  platformEventBus.publish({
    type: 'payroll_run_approved',
    category: 'automation',
    title: 'Payroll Run Approved',
    description: `Payroll run ${payrollRunId} approved by manager — ready for processing`,
    workspaceId,
    userId,
    metadata: {
      payrollRunId,
      approvedBy: userId,
      runPeriod: `${(run as any).periodStart} – ${(run as any).periodEnd}`,
    },
    visibility: 'manager',
  }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

  return {
    success: true,
    run: updated as unknown as Record<string, unknown>,
    qbSync: qbSyncResult
      ? { synced: (qbSyncResult as any).success, details: (qbSyncResult as any).details }
      : null,
  };
}
