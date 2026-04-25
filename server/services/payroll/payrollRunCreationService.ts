import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from 'server/db';
import { storage } from 'server/storage';
import { billingAuditLog, employees, payrollRunLocks, payrollRuns, timeEntries } from '@shared/schema';
import { validatePayrollPeriod } from '../../lib/businessRules';
import { getWorkspaceTier, hasTierAccess } from '../../tierGuards';
import { detectPayPeriod, createAutomatedPayrollRun } from '../payrollAutomation';
import { platformEventBus } from '../platformEventBus';
import { broadcastNotificationToUser as broadcastNotification } from '../../websocket';
import * as notificationHelpers from '../../notifications';
import { createLogger } from '../../lib/logger';

const log = createLogger('PayrollRunCreationService');
const PAYROLL_RUN_LOCK_TTL_MS = 5 * 60 * 1000;

export interface CreatePayrollRunParams {
  workspaceId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  payPeriodStart?: string | null;
  payPeriodEnd?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PayrollComplianceWarning {
  employeeId: string;
  name: string;
  issue: string;
}

export interface CreatePayrollRunResult {
  payrollRun: any;
  complianceWarnings: PayrollComplianceWarning[];
}

function statusError(message: string, status: number, extra?: Record<string, unknown>) {
  return Object.assign(new Error(message), { status, extra });
}

async function acquirePayrollRunLock(workspaceId: string, userId: string): Promise<{ acquired: boolean; holder?: string }> {
  const now = new Date();
  const expiresAt = new Date(Date.now() + PAYROLL_RUN_LOCK_TTL_MS);

  try {
    await db.transaction(async (tx) => {
      await tx.delete(payrollRunLocks)
        .where(and(
          eq(payrollRunLocks.workspaceId, workspaceId),
          lte(payrollRunLocks.expiresAt, now),
        ));
      await tx.insert(payrollRunLocks).values({
        workspaceId,
        lockedBy: userId,
        lockedAt: now,
        expiresAt,
      });
    });
    return { acquired: true };
  } catch {
    const [existing] = await db.select()
      .from(payrollRunLocks)
      .where(eq(payrollRunLocks.workspaceId, workspaceId))
      .limit(1);
    return { acquired: false, holder: existing?.lockedBy };
  }
}

async function releasePayrollRunLock(workspaceId: string): Promise<void> {
  try {
    await db.delete(payrollRunLocks).where(eq(payrollRunLocks.workspaceId, workspaceId));
  } catch (err: any) {
    log.warn('[PayrollLock] Release failed (non-fatal):', err?.message);
  }
}

function parseRequestedPeriod(payPeriodStart?: string | null, payPeriodEnd?: string | null): { periodStart?: Date; periodEnd?: Date } {
  if (!payPeriodStart && !payPeriodEnd) return {};
  if (!payPeriodStart || !payPeriodEnd) {
    throw statusError('Both payPeriodStart and payPeriodEnd are required when specifying a custom period', 422, {
      code: 'INVALID_PAYROLL_PERIOD_INPUT',
    });
  }

  const periodStart = new Date(payPeriodStart);
  const periodEnd = new Date(payPeriodEnd);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    throw statusError('Invalid payroll period dates', 422, { code: 'INVALID_PAYROLL_PERIOD_INPUT' });
  }
  return { periodStart, periodEnd };
}

async function resolvePayrollPeriod(workspaceId: string, payPeriodStart?: string | null, payPeriodEnd?: string | null) {
  const requested = parseRequestedPeriod(payPeriodStart, payPeriodEnd);
  if (requested.periodStart && requested.periodEnd) return requested as { periodStart: Date; periodEnd: Date };

  const detected = await detectPayPeriod(workspaceId);
  return {
    periodStart: detected.periodStart,
    periodEnd: detected.periodEnd,
  };
}

async function collectComplianceWarnings(workspaceId: string): Promise<PayrollComplianceWarning[]> {
  const warnings: PayrollComplianceWarning[] = [];
  try {
    const allWorkspaceEmployees = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        onboardingStatus: employees.onboardingStatus,
        guardCardNumber: employees.guardCardNumber,
        guardCardExpiryDate: employees.guardCardExpiryDate,
        compliancePayType: employees.compliancePayType,
        status: employees.status,
      })
      .from(employees)
      .where(and(
        eq(employees.workspaceId, workspaceId),
        sql`${employees.status} NOT IN ('terminated', 'inactive')`,
      ));

    const today = new Date();
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const emp of allWorkspaceEmployees) {
      const name = `${emp.firstName} ${emp.lastName}`.trim() || emp.id;
      if (emp.onboardingStatus !== 'completed') {
        warnings.push({ employeeId: emp.id, name, issue: 'Onboarding packet not completed — I-9/W-4 may be missing' });
      }
      if (!emp.guardCardNumber) {
        warnings.push({ employeeId: emp.id, name, issue: 'Guard card number not on file — required for licensed security work' });
      } else if (emp.guardCardExpiryDate) {
        const expiry = new Date(emp.guardCardExpiryDate);
        if (expiry < today) {
          warnings.push({ employeeId: emp.id, name, issue: `Guard card expired on ${expiry.toLocaleDateString()} — officer cannot legally work` });
        } else if (expiry < thirtyDaysOut) {
          warnings.push({ employeeId: emp.id, name, issue: `Guard card expires soon — ${expiry.toLocaleDateString()} (within 30 days)` });
        }
      }
      if (!emp.compliancePayType) {
        warnings.push({ employeeId: emp.id, name, issue: 'Pay classification (W-2/1099) not set — required for tax reporting' });
      }
    }
  } catch (error: any) {
    log.warn('[Payroll] Compliance pre-check failed (non-blocking):', error?.message);
  }
  return warnings;
}

async function assertWorkspaceCanCreatePayroll(workspaceId: string) {
  const workspaceTier = await getWorkspaceTier(workspaceId);
  if (!hasTierAccess(workspaceTier, 'professional')) {
    throw statusError('This feature requires professional plan or higher', 402, {
      error: 'This feature requires professional plan or higher',
      currentTier: workspaceTier,
      minimumTier: 'professional',
      requiresTierUpgrade: true,
    });
  }

  const ws = await storage.getWorkspace(workspaceId);
  if (!ws || ws.subscriptionStatus === 'suspended' || ws.subscriptionStatus === 'cancelled') {
    throw statusError('Organization subscription is not active — payroll cannot be run until the subscription is restored', 403, {
      error: 'SUBSCRIPTION_INACTIVE',
    });
  }
}

async function assertPeriodIsValidAndAvailable(workspaceId: string, periodStart: Date, periodEnd: Date, complianceWarnings: PayrollComplianceWarning[]) {
  const periodViolation = validatePayrollPeriod(periodStart, periodEnd);
  if (periodViolation) {
    throw statusError(periodViolation.message || 'Invalid payroll period', 422, {
      code: 'INVALID_PAYROLL_PERIOD',
      violations: [periodViolation],
    });
  }

  const overlappingRun = await db.select().from(payrollRuns)
    .where(and(
      eq(payrollRuns.workspaceId, workspaceId),
      sql`(${payrollRuns.periodStart}, ${payrollRuns.periodEnd}) OVERLAPS (${periodStart.toISOString()}, ${periodEnd.toISOString()})`,
    ))
    .limit(1);

  if (overlappingRun.length > 0) {
    throw statusError('Payroll period overlaps with an existing run', 409, {
      existingRunId: overlappingRun[0].id,
    });
  }

  const [approvedHoursCheck] = await db
    .select({ approvedCount: count(timeEntries.id) })
    .from(timeEntries)
    .where(and(
      eq(timeEntries.workspaceId, workspaceId),
      eq(timeEntries.status, 'approved'),
      gte(timeEntries.clockIn, periodStart),
      lte(timeEntries.clockIn, periodEnd),
    ));

  if (!approvedHoursCheck || approvedHoursCheck.approvedCount === 0) {
    throw statusError(`No approved timesheets found for ${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}. Approve timesheets before running payroll.`, 422, {
      error: 'ZERO_APPROVED_HOURS',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      complianceWarnings,
    });
  }
}

async function createPayrollRunAtomically(workspaceId: string, userId: string, periodStart: Date, periodEnd: Date) {
  return db.transaction(async (tx) => {
    const existingRun = await tx
      .select()
      .from(payrollRuns)
      .where(and(
        eq(payrollRuns.workspaceId, workspaceId),
        eq(payrollRuns.periodStart, periodStart),
        eq(payrollRuns.periodEnd, periodEnd),
      ))
      .for('update')
      .limit(1);

    if (existingRun.length > 0) {
      throw statusError(`A payroll run for this pay period (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}) already exists.`, 409, {
        code: 'DUPLICATE_PAYROLL_RUN',
        existingRunId: existingRun[0].id,
        existingRunStatus: existingRun[0].status,
      });
    }

    return createAutomatedPayrollRun({
      workspaceId,
      periodStart,
      periodEnd,
      createdBy: userId,
    });
  });
}

async function emitPayrollRunCreatedSideEffects(params: {
  workspaceId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  payrollRun: any;
  periodStart: Date;
  periodEnd: Date;
}) {
  const { workspaceId, userId, userEmail, userRole, ipAddress, userAgent, payrollRun, periodStart, periodEnd } = params;
  const runId = payrollRun.id;
  const periodStartStr = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const periodEndStr = periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  storage.createAuditLog({
    workspaceId,
    userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'create',
    entityType: 'payroll_run',
    entityId: runId,
    actionDescription: `Payroll run created for period ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
    changes: { after: { payrollRunId: runId, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString(), status: 'pending' } },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch(err => log.error('[FinancialAudit] CRITICAL: SOC2 audit log write failed for payroll run creation', { error: err?.message }));

  notificationHelpers.createPayrollRunCreatedNotification(
    { storage, broadcastNotification },
    { workspaceId, userId, payrollRunId: runId, periodStart: periodStartStr, periodEnd: periodEndStr, createdBy: userId },
  ).catch(err => log.error('Failed to create payroll notification:', err));

  try {
    const { broadcastToWorkspace } = await import('../websocket');
    broadcastToWorkspace(workspaceId, { type: 'payroll_updated', action: 'run_created', runId });
  } catch (error: any) {
    log.warn('[PayrollRunCreationService] Failed to broadcast run_created (non-blocking):', error?.message);
  }

  platformEventBus.publish({
    type: 'payroll_run_created',
    category: 'payroll',
    title: 'Payroll Run Created',
    description: `Payroll run created for ${periodStartStr} – ${periodEndStr}`,
    workspaceId,
    userId,
    metadata: {
      payrollRunId: runId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      createdBy: userId,
      source: 'payrollRunCreationService',
    },
  }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

  db.insert(billingAuditLog).values({
    workspaceId,
    eventType: 'payroll_run_created',
    eventCategory: 'payroll',
    actorType: 'user',
    actorId: userId,
    actorEmail: userEmail || null,
    description: `Payroll run created for period ${periodStartStr} to ${periodEndStr}`,
    relatedEntityType: 'payroll_run',
    relatedEntityId: runId,
    newState: { status: payrollRun.status, periodStart, periodEnd, totalGross: payrollRun.totalGrossPay },
    ipAddress,
    userAgent,
  }).catch(err => log.error('[BillingAudit] billing_audit_log write failed for payroll create', { error: err?.message }));
}

/**
 * Canonical service for POST /create-run.
 *
 * Keeps payroll creation checks, locking, duplicate prevention, and side effects
 * together so the route can become a thin auth/body wrapper.
 */
export async function createPayrollRunForPeriod({
  workspaceId,
  userId,
  userEmail = 'unknown',
  userRole = 'user',
  payPeriodStart,
  payPeriodEnd,
  ipAddress = null,
  userAgent = null,
}: CreatePayrollRunParams): Promise<CreatePayrollRunResult> {
  if (!workspaceId) throw statusError('workspaceId is required', 400);
  if (!userId) throw statusError('userId is required', 401);

  await assertWorkspaceCanCreatePayroll(workspaceId);

  const lockResult = await acquirePayrollRunLock(workspaceId, userId);
  if (!lockResult.acquired) {
    throw statusError('A payroll run is already being created for this workspace', 409, {
      error: 'PAYROLL_RUN_LOCKED',
      lockedBy: lockResult.holder,
    });
  }

  try {
    const { periodStart, periodEnd } = await resolvePayrollPeriod(workspaceId, payPeriodStart, payPeriodEnd);
    const complianceWarnings = await collectComplianceWarnings(workspaceId);
    await assertPeriodIsValidAndAvailable(workspaceId, periodStart, periodEnd, complianceWarnings);
    const payrollRun = await createPayrollRunAtomically(workspaceId, userId, periodStart, periodEnd);

    emitPayrollRunCreatedSideEffects({
      workspaceId,
      userId,
      userEmail,
      userRole,
      ipAddress,
      userAgent,
      payrollRun,
      periodStart,
      periodEnd,
    }).catch(err => log.error('[PayrollRunCreationService] Side effects failed after payroll run creation:', err?.message));

    return { payrollRun, complianceWarnings };
  } finally {
    await releasePayrollRunLock(workspaceId);
  }
}
