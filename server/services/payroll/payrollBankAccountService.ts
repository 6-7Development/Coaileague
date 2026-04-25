/**
 * PAYROLL BANK ACCOUNT SERVICE
 * ==============================
 * All 5 bank account CRUD handlers extracted from payrollRoutes.ts.
 * Handles manual ACH direct deposit management for employees.
 *
 * No Plaid integration — these are manual account entries with AES-256
 * encryption on routing/account numbers at rest. Decryption never happens
 * in this layer — last-4 digits are used for display only.
 *
 * SOC2 audit logged on every mutation (non-blocking).
 * Sensitive field changes (routing/account number) trigger a security alert
 * to org owners and payroll admins (non-blocking).
 *
 * Handlers extracted:
 *   listBankAccounts()        — GET /employees/:id/bank-accounts
 *   addBankAccount()          — POST /employees/:id/bank-accounts
 *   updateBankAccount()       — PATCH /employees/:id/bank-accounts/:accountId
 *   deactivateBankAccount()   — DELETE /employees/:id/bank-accounts/:accountId
 *   verifyBankAccount()       — POST /employees/:id/bank-accounts/verify (delegates to achTransferService)
 */

import { db } from '../../db';
import {
  employeeBankAccounts,
  employees,
  employeeOnboardingProgress,
} from '@shared/schema';
import {
  employeeBankAccountSchema,
  employeeBankAccountUpdateSchema,
} from '@shared/schemas/payroll';
import { eq, and, desc, sql } from 'drizzle-orm';
import { encryptToken } from '../../security/tokenEncryption';
import { storage } from '../../storage';
import { platformEventBus } from '../platformEventBus';
import { universalNotificationEngine } from '../universalNotificationEngine';
import { createLogger } from '../../lib/logger';

const log = createLogger('payrollBankAccountService');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BankAccountServiceParams {
  workspaceId: string;
  employeeId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
}

export interface BankAccountResult {
  success: boolean;
  bankAccount?: ReturnType<typeof maskBankAccount>;
  bankAccounts?: ReturnType<typeof maskBankAccount>[];
  message?: string;
  error?: string;
  status?: number;
}

// ─── Mask Helper ──────────────────────────────────────────────────────────────

/** Returns a safe view of a bank account — never exposes encrypted values. */
export function maskBankAccount(row: typeof employeeBankAccounts.$inferSelect) {
  const { routingNumberEncrypted, accountNumberEncrypted, ...rest } = row as any;
  return {
    ...rest,
    hasRoutingNumber: !!routingNumberEncrypted,
    hasAccountNumber: !!accountNumberEncrypted,
    // Last-4 digits already stored unencrypted for display
    routingLast4: rest.routingNumberLast4,
    accountLast4: rest.accountNumberLast4,
  };
}

// ─── List Bank Accounts ───────────────────────────────────────────────────────

export async function listBankAccounts(
  params: Pick<BankAccountServiceParams, 'workspaceId' | 'employeeId'>
): Promise<BankAccountResult> {
  const { workspaceId, employeeId } = params;

  const rows = await db.select().from(employeeBankAccounts)
    .where(and(
      eq(employeeBankAccounts.workspaceId, workspaceId),
      eq(employeeBankAccounts.employeeId, employeeId),
      eq(employeeBankAccounts.isActive, true),
    ))
    .orderBy(desc(employeeBankAccounts.isPrimary));

  return { success: true, bankAccounts: rows.map(maskBankAccount) };
}

// ─── Add Bank Account ─────────────────────────────────────────────────────────

export interface AddBankAccountParams extends BankAccountServiceParams {
  body: unknown;
}

export async function addBankAccount(params: AddBankAccountParams): Promise<BankAccountResult> {
  const { workspaceId, employeeId, userId, userEmail, userRole, body } = params;

  const parsed = employeeBankAccountSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: 'Invalid bank account data', status: 400 };
  }

  const {
    bankName, routingNumber, accountNumber, accountType,
    depositType, depositAmount, depositPercent, isPrimary, notes,
  } = parsed.data;

  // AES-256 encrypt at rest — never store raw routing/account numbers
  const encryptedRouting = encryptToken(String(routingNumber).trim());
  const encryptedAccount = encryptToken(String(accountNumber).trim());
  const routingLast4 = String(routingNumber).trim().slice(-4);
  const accountLast4  = String(accountNumber).trim().slice(-4);

  // If this account is being set as primary, clear existing primary first
  if (isPrimary) {
    await db.update(employeeBankAccounts)
      .set({ isPrimary: false })
      .where(and(
        eq(employeeBankAccounts.workspaceId, workspaceId),
        eq(employeeBankAccounts.employeeId, employeeId),
      ));
  }

  const [created] = await db.insert(employeeBankAccounts).values({
    workspaceId,
    employeeId,
    bankName: bankName || null,
    routingNumberEncrypted: encryptedRouting,
    accountNumberEncrypted: encryptedAccount,
    accountType: accountType || 'checking',
    routingNumberLast4: routingLast4,
    accountNumberLast4: accountLast4,
    depositType: depositType || 'full',
    depositAmount: depositAmount ? String(depositAmount) : null,
    depositPercent: depositPercent ? String(depositPercent) : null,
    isPrimary: isPrimary ?? true,
    isActive: true,
    addedBy: userId,
    notes: notes || null,
  }).returning();

  // SOC2 audit (non-blocking)
  storage.createAuditLog({
    workspaceId, userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'create',
    entityType: 'employee_bank_account',
    entityId: created.id,
    actionDescription: `Bank account (****${accountLast4}) added for employee ${employeeId}`,
    changes: { routing_last4: routingLast4, account_last4: accountLast4, accountType },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch((err: any) => log.warn('[BankAccountService] Audit log failed (non-blocking):', err?.message));

  // Mark direct deposit step complete in onboarding progress (non-blocking)
  void (async () => {
    try {
      await db.update(employeeOnboardingProgress)
        .set({
          stepsCompleted: sql`CASE
            WHEN NOT (${employeeOnboardingProgress.stepsCompleted} @> '["direct_deposit"]'::jsonb)
            THEN ${employeeOnboardingProgress.stepsCompleted} || '["direct_deposit"]'::jsonb
            ELSE ${employeeOnboardingProgress.stepsCompleted}
          END`,
          directDepositComplete: true,
          status: sql`CASE
            WHEN ${employeeOnboardingProgress.overallProgressPct} >= 100 THEN 'complete'
            ELSE ${employeeOnboardingProgress.status}
          END`,
          lastUpdatedAt: new Date(),
        } as any)
        .where(and(
          eq(employeeOnboardingProgress.workspaceId, workspaceId),
          eq(employeeOnboardingProgress.employeeId, employeeId),
        ));

      // If onboarding is now 100% complete → emit event
      const [progress] = await db.select()
        .from(employeeOnboardingProgress)
        .where(and(
          eq(employeeOnboardingProgress.workspaceId, workspaceId),
          eq(employeeOnboardingProgress.employeeId, employeeId),
        ))
        .limit(1);

      if (progress && ((progress.overallProgressPct || 0) >= 100 || progress.status === 'complete')) {
        const [employee] = await db.select({ firstName: employees.firstName, lastName: employees.lastName })
          .from(employees)
          .where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId)))
          .limit(1);

        platformEventBus.publish({
          type: 'employee_onboarding_completed',
          workspaceId,
          title: `${employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Employee'} completed onboarding`,
          payload: { employeeId, completedAt: new Date().toISOString() },
        });
      }
    } catch (err: any) {
      log.warn('[BankAccountService] Onboarding progress update failed (non-blocking):', err?.message);
    }
  })();

  return { success: true, bankAccount: maskBankAccount(created) };
}

// ─── Update Bank Account ──────────────────────────────────────────────────────

export interface UpdateBankAccountParams extends BankAccountServiceParams {
  accountId: string;
  body: unknown;
}

export async function updateBankAccount(params: UpdateBankAccountParams): Promise<BankAccountResult> {
  const { workspaceId, employeeId, accountId, userId, userEmail, userRole, body } = params;

  const [current] = await db.select().from(employeeBankAccounts)
    .where(and(
      eq(employeeBankAccounts.id, accountId),
      eq(employeeBankAccounts.workspaceId, workspaceId),
      eq(employeeBankAccounts.employeeId, employeeId),
    ))
    .limit(1);

  if (!current) return { success: false, error: 'Bank account not found', status: 404 };

  const parsed = employeeBankAccountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return { success: false, error: 'Invalid bank account update data', status: 400 };
  }

  const {
    bankName, routingNumber, accountNumber, accountType,
    depositType, depositAmount, depositPercent, isPrimary, notes,
  } = parsed.data;

  const updateFields: Record<string, any> = { updatedAt: new Date() };
  if (bankName !== undefined)        updateFields.bankName = bankName;
  if (accountType !== undefined)     updateFields.accountType = accountType;
  if (depositType !== undefined)     updateFields.depositType = depositType;
  if (depositAmount !== undefined)   updateFields.depositAmount = String(depositAmount);
  if (depositPercent !== undefined)  updateFields.depositPercent = String(depositPercent);
  if (notes !== undefined)           updateFields.notes = notes;
  if (isPrimary !== undefined)       updateFields.isPrimary = isPrimary;

  // Re-encrypt if new routing/account provided
  const changedSensitive = !!(routingNumber || accountNumber);
  if (routingNumber) {
    updateFields.routingNumberEncrypted = encryptToken(String(routingNumber).trim());
    updateFields.routingNumberLast4 = String(routingNumber).trim().slice(-4);
  }
  if (accountNumber) {
    updateFields.accountNumberEncrypted = encryptToken(String(accountNumber).trim());
    updateFields.accountNumberLast4 = String(accountNumber).trim().slice(-4);
  }

  let updated: typeof employeeBankAccounts.$inferSelect | undefined;

  await db.transaction(async (tx) => {
    // Atomically clear existing primary before setting new one
    if (isPrimary) {
      await tx.update(employeeBankAccounts)
        .set({ isPrimary: false })
        .where(and(
          eq(employeeBankAccounts.workspaceId, workspaceId),
          eq(employeeBankAccounts.employeeId, employeeId),
        ));
    }
    [updated] = await tx.update(employeeBankAccounts)
      .set(updateFields)
      .where(and(
        eq(employeeBankAccounts.id, accountId),
        eq(employeeBankAccounts.workspaceId, workspaceId),
        eq(employeeBankAccounts.employeeId, employeeId),
      ))
      .returning();
  });

  if (!updated) return { success: false, error: 'Bank account not found', status: 404 };

  // SOC2 audit (non-blocking)
  storage.createAuditLog({
    workspaceId, userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'update',
    entityType: 'employee_bank_account',
    entityId: accountId,
    actionDescription: `Bank account (****${updated.accountNumberLast4}) updated for employee ${employeeId}`,
    changes: { updatedFields: Object.keys(updateFields) },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch((err: any) => log.warn('[BankAccountService] Audit log failed (non-blocking):', err?.message));

  // Security alert when routing or account number changes (non-blocking)
  if (changedSensitive) {
    void (async () => {
      try {
        await universalNotificationEngine.sendNotification({
          workspaceId,
          type: 'security_alert',
          title: 'Employee Bank Account Updated',
          message: `Direct deposit bank account (****${updated!.accountNumberLast4}) was updated for employee ${employeeId}. Changed by: ${userEmail || userId}. Please verify this change is authorized.`,
          priority: 'high',
          severity: 'warning',
          targetRoles: ['org_owner', 'co_owner', 'payroll_admin'],
        });
      } catch (alertErr: any) {
        log.warn('[BankAccountService] Security alert failed (non-blocking):', alertErr?.message);
      }
    })();
  }

  return { success: true, bankAccount: maskBankAccount(updated) };
}

// ─── Deactivate Bank Account ──────────────────────────────────────────────────

export interface DeactivateBankAccountParams extends BankAccountServiceParams {
  accountId: string;
}

export async function deactivateBankAccount(params: DeactivateBankAccountParams): Promise<BankAccountResult> {
  const { workspaceId, employeeId, accountId, userId, userEmail, userRole } = params;

  const [deactivated] = await db.update(employeeBankAccounts)
    .set({ isActive: false, deactivatedAt: new Date(), deactivatedBy: userId })
    .where(and(
      eq(employeeBankAccounts.id, accountId),
      eq(employeeBankAccounts.workspaceId, workspaceId),
      eq(employeeBankAccounts.employeeId, employeeId),
    ))
    .returning();

  if (!deactivated) return { success: false, error: 'Bank account not found', status: 404 };

  storage.createAuditLog({
    workspaceId, userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'delete',
    entityType: 'employee_bank_account',
    entityId: accountId,
    actionDescription: `Bank account (****${deactivated.accountNumberLast4}) deactivated for employee ${employeeId}`,
    changes: { before: { isActive: true }, after: { isActive: false } },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch((err: any) => log.warn('[BankAccountService] Audit log failed (non-blocking):', err?.message));

  return { success: true, message: 'Bank account deactivated' };
}

// ─── Verify Bank Account ──────────────────────────────────────────────────────

export interface VerifyBankAccountParams extends BankAccountServiceParams {}

export async function verifyBankAccount(params: VerifyBankAccountParams): Promise<{
  success: boolean;
  valid?: boolean;
  status?: string;
  error?: string;
  httpStatus?: number;
}> {
  const { workspaceId, employeeId, userId } = params;

  const [employee] = await db.select({ userId: employees.userId })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId)))
    .limit(1);

  if (!employee) return { success: false, error: 'Employee not found', httpStatus: 404 };

  // ACH verification — delegates to achTransferService (kept dynamic — heavy dependency)
  const { verifyEmployeeBankAccount } = await import('./achTransferService');
  const verification = await verifyEmployeeBankAccount({ workspaceId, employeeId, verifiedBy: userId });

  return { success: true, valid: verification.valid, status: verification.status };
}
