/**
 * PAYROLL SUPPLEMENTAL PAY SERVICE
 * ===================================
 * Handles bonus pay and commission pay — the two pay types that were
 * identified as missing from the platform in the QB/Gusto feature parity audit.
 *
 * QuickBooks and Gusto both support:
 *   - Bonus pay: flat dollar or percentage of regular pay, supplemental tax rate
 *   - Commission pay: percentage-based or flat, tracked against sales/performance
 *
 * These are created as standalone payroll entries (not tied to a time-period payroll
 * run) OR added as line items to an existing draft payroll run.
 *
 * Tax treatment (IRS supplemental wage rules):
 *   - Bonus/commission: 22% federal supplemental flat rate (or aggregate method)
 *   - State: varies — we apply the same state rate as the employee's regular pay
 *   - FICA: same rates as regular pay (SS 6.2% / Medicare 1.45%)
 *
 * Security company specific:
 *   - Commissions may be paid to officers who bring in new contracts (sales commission)
 *   - Referral bonuses for recruiting new officers
 *   - Performance bonuses based on incident-free shifts, perfect attendance
 */

import { db } from '../../db';
import {
  payrollEntries,
  payrollRuns,
  employees,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { applyTax, addFinancialValues, subtractFinancialValues, multiplyFinancialValues } from '../financialCalculator';
import { storage } from '../../storage';
import { platformEventBus } from '../platformEventBus';
import { createLogger } from '../../lib/logger';
import { z } from 'zod';

const log = createLogger('payrollSupplementalPayService');

// ─── Constants ────────────────────────────────────────────────────────────────

/** IRS supplemental flat rate for bonuses and commissions (2024–2025) */
const SUPPLEMENTAL_FEDERAL_RATE = 0.22;
/** Social Security rate (employee share) */
const SS_RATE = 0.062;
/** Medicare rate (employee share) */
const MEDICARE_RATE = 0.0145;

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const bonusPaySchema = z.object({
  employeeId: z.string().min(1),
  /** Dollar amount of the bonus */
  bonusAmount: z.number().positive(),
  /** Optional: tie to an existing draft payroll run */
  payrollRunId: z.string().optional().nullable(),
  /** Why this bonus is being issued */
  description: z.string().min(1).max(500),
  /** Category of bonus — affects reporting */
  bonusCategory: z.enum([
    'performance',       // Perfect attendance, incident-free shifts
    'retention',         // Longevity / stay bonus
    'referral',          // Recruiting referral
    'sign_on',           // Sign-on bonus for new hire
    'holiday',           // Holiday bonus
    'discretionary',     // Manager discretion
    'other',
  ]).default('discretionary'),
  /** Override the 22% supplemental federal rate (rare — manager must justify) */
  overrideFederalRate: z.number().min(0).max(1).optional(),
  /** Effective pay date for the bonus */
  payDate: z.string().optional(),
});

export const commissionPaySchema = z.object({
  employeeId: z.string().min(1),
  /** Dollar amount of the commission */
  commissionAmount: z.number().positive(),
  /** Sales or performance amount that generated this commission */
  baseAmount: z.number().optional().nullable(),
  /** Commission rate used (e.g. 0.05 = 5%) — for reporting only */
  commissionRate: z.number().min(0).max(1).optional().nullable(),
  /** What the commission was earned on */
  source: z.enum([
    'contract_sale',     // Signing a new client contract
    'contract_renewal',  // Renewing an existing client
    'referral_client',   // Referring a new client
    'performance',       // Performance-based commission
    'overtime_incentive',// Incentive for covering OT shifts
    'other',
  ]).default('other'),
  description: z.string().min(1).max(500),
  payrollRunId: z.string().optional().nullable(),
  payDate: z.string().optional(),
});

export type BonusPayInput = z.infer<typeof bonusPaySchema>;
export type CommissionPayInput = z.infer<typeof commissionPaySchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupplementalPayResult {
  success: boolean;
  payrollEntryId?: string;
  employeeId?: string;
  payType?: 'bonus' | 'commission';
  grossAmount?: number;
  federalTax?: number;
  ficaTax?: number;
  netAmount?: number;
  effectiveRate?: number;
  error?: string;
  status?: number;
}

// ─── Tax Calculation ──────────────────────────────────────────────────────────

interface SupplementalTaxes {
  federalTax: number;
  socialSecurity: number;
  medicare: number;
  totalTax: number;
  netPay: number;
}

function calculateSupplementalTaxes(
  grossAmount: number,
  stateTaxRate: number,
  federalRateOverride?: number,
): SupplementalTaxes {
  const federalRate = federalRateOverride ?? SUPPLEMENTAL_FEDERAL_RATE;

  const federalTax    = multiplyFinancialValues(grossAmount, federalRate);
  const stateTax      = multiplyFinancialValues(grossAmount, stateTaxRate);
  const socialSecurity = multiplyFinancialValues(grossAmount, SS_RATE);
  const medicare      = multiplyFinancialValues(grossAmount, MEDICARE_RATE);

  const totalTax = addFinancialValues(addFinancialValues(addFinancialValues(federalTax, stateTax), socialSecurity), medicare);
  const netPay   = subtractFinancialValues(grossAmount, totalTax);

  return {
    federalTax: parseFloat(federalTax),
    socialSecurity: parseFloat(socialSecurity),
    medicare: parseFloat(medicare),
    totalTax: parseFloat(totalTax),
    netPay: parseFloat(netPay),
  };
}

// ─── Employee State Tax Rate Lookup ───────────────────────────────────────────

async function getEmployeeStateTaxRate(
  employeeId: string,
  workspaceId: string,
): Promise<number> {
  // Fetch the employee's most recent payroll entry to derive their effective state rate
  const [recentEntry] = await db.select({
    grossPay: payrollEntries.grossPay,
    stateTax: payrollEntries.stateTax,
  }).from(payrollEntries)
    .where(and(
      eq(payrollEntries.employeeId, employeeId),
      eq(payrollEntries.workspaceId, workspaceId),
    ))
    .orderBy(payrollEntries.createdAt)
    .limit(1);

  if (recentEntry && recentEntry.grossPay && recentEntry.stateTax) {
    const gross = parseFloat(recentEntry.grossPay);
    const state = parseFloat(recentEntry.stateTax);
    if (gross > 0) return state / gross;
  }

  // Default to Texas rate (no state income tax) — 0%
  // Override if employee is in a state with income tax
  return 0;
}

// ─── Create Bonus Pay Entry ───────────────────────────────────────────────────

export async function createBonusPayEntry(
  workspaceId: string,
  userId: string,
  input: BonusPayInput,
): Promise<SupplementalPayResult> {
  const parsed = bonusPaySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Invalid bonus pay data', status: 400 };
  }

  const { employeeId, bonusAmount, payrollRunId, description, bonusCategory, overrideFederalRate, payDate } = parsed.data;

  // Verify employee belongs to this workspace
  const [employee] = await db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
    workerType: employees.workerType,
    isActive: employees.isActive,
  }).from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId)))
    .limit(1);

  if (!employee) return { success: false, error: 'Employee not found', status: 404 };
  if (!(employee as any).isActive) return { success: false, error: 'Cannot issue bonus to inactive employee', status: 422 };

  // Calculate taxes
  const stateTaxRate = await getEmployeeStateTaxRate(employeeId, workspaceId);
  const taxes = calculateSupplementalTaxes(bonusAmount, stateTaxRate, overrideFederalRate);

  const effectivePayDate = payDate ? new Date(payDate) : new Date();

  await db.transaction(async (tx) => {
    // If tied to a payroll run, verify it's still a draft
    if (payrollRunId) {
      const [run] = await tx.select({ status: payrollRuns.status })
        .from(payrollRuns)
        .where(and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.workspaceId, workspaceId)))
        .limit(1);
      if (!run) throw Object.assign(new Error('Payroll run not found'), { status: 404 });
      if ((run as any).status !== 'draft' && (run as any).status !== 'pending') {
        throw Object.assign(new Error('Can only add bonus to draft or pending payroll runs'), { status: 422 });
      }
    }

    const [entry] = await tx.insert(payrollEntries).values({
      workspaceId,
      employeeId,
      payrollRunId: payrollRunId || null,
      payType: 'bonus',
      grossPay: String(bonusAmount),
      federalTax: String(taxes.federalTax),
      stateTax: '0',  // stored separately — supplemental state varies
      socialSecurity: String(taxes.socialSecurity),
      medicare: String(taxes.medicare),
      netPay: String(taxes.netPay),
      regularHours: '0',
      overtimeHours: '0',
      hourlyRate: '0',
      workerType: (employee as any).workerType || 'employee',
      status: payrollRunId ? 'draft' : 'approved',
      payPeriodStart: effectivePayDate,
      payPeriodEnd: effectivePayDate,
      notes: `BONUS (${bonusCategory}): ${description}. Federal rate: ${overrideFederalRate ? (overrideFederalRate * 100).toFixed(1) + '% (override)' : '22% (supplemental flat rate)'}`,
    }).returning({ id: payrollEntries.id });

    return entry;
  });

  // Audit log (non-blocking)
  storage.createAuditLog({
    workspaceId,
    userId,
    action: 'create',
    entityType: 'payroll_entry',
    actionDescription: `Bonus pay of $${bonusAmount.toFixed(2)} created for employee ${employeeId} (${bonusCategory})`,
    changes: { grossPay: bonusAmount, federalTax: taxes.federalTax, netPay: taxes.netPay, category: bonusCategory },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch(err => log.warn('[BonusPay] Audit log failed:', err?.message));

  // Event (non-blocking)
  platformEventBus.publish({
    type: 'payroll_bonus_created' as any,
    category: 'payroll',
    title: 'Bonus Pay Created',
    description: `$${bonusAmount.toFixed(2)} ${bonusCategory} bonus created for ${(employee as any).firstName} ${(employee as any).lastName}`,
    workspaceId,
    userId,
    metadata: { employeeId, bonusAmount, bonusCategory, netPay: taxes.netPay },
    visibility: 'manager',
  }).catch(() => {});

  log.info(`[BonusPay] $${bonusAmount} ${bonusCategory} bonus for employee ${employeeId}`);

  return {
    success: true,
    payType: 'bonus',
    employeeId,
    grossAmount: bonusAmount,
    federalTax: taxes.federalTax,
    ficaTax: parseFloat(addFinancialValues(String(String(taxes.socialSecurity)), String(String(taxes.medicare)))),
    netAmount: taxes.netPay,
    effectiveRate: overrideFederalRate ?? SUPPLEMENTAL_FEDERAL_RATE,
  };
}

// ─── Create Commission Pay Entry ──────────────────────────────────────────────

export async function createCommissionPayEntry(
  workspaceId: string,
  userId: string,
  input: CommissionPayInput,
): Promise<SupplementalPayResult> {
  const parsed = commissionPaySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Invalid commission pay data', status: 400 };
  }

  const { employeeId, commissionAmount, baseAmount, commissionRate, source, description, payrollRunId, payDate } = parsed.data;

  const [employee] = await db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
    workerType: employees.workerType,
    isActive: employees.isActive,
  }).from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.workspaceId, workspaceId)))
    .limit(1);

  if (!employee) return { success: false, error: 'Employee not found', status: 404 };
  if (!(employee as any).isActive) return { success: false, error: 'Cannot issue commission to inactive employee', status: 422 };

  const stateTaxRate = await getEmployeeStateTaxRate(employeeId, workspaceId);
  const taxes = calculateSupplementalTaxes(commissionAmount, stateTaxRate);
  const effectivePayDate = payDate ? new Date(payDate) : new Date();

  await db.transaction(async (tx) => {
    if (payrollRunId) {
      const [run] = await tx.select({ status: payrollRuns.status })
        .from(payrollRuns)
        .where(and(eq(payrollRuns.id, payrollRunId), eq(payrollRuns.workspaceId, workspaceId)))
        .limit(1);
      if (!run) throw Object.assign(new Error('Payroll run not found'), { status: 404 });
      if ((run as any).status !== 'draft' && (run as any).status !== 'pending') {
        throw Object.assign(new Error('Can only add commission to draft or pending payroll runs'), { status: 422 });
      }
    }

    await tx.insert(payrollEntries).values({
      workspaceId,
      employeeId,
      payrollRunId: payrollRunId || null,
      payType: 'commission',
      grossPay: String(commissionAmount),
      federalTax: String(taxes.federalTax),
      stateTax: '0',
      socialSecurity: String(taxes.socialSecurity),
      medicare: String(taxes.medicare),
      netPay: String(taxes.netPay),
      regularHours: '0',
      overtimeHours: '0',
      hourlyRate: '0',
      workerType: (employee as any).workerType || 'employee',
      status: payrollRunId ? 'draft' : 'approved',
      payPeriodStart: effectivePayDate,
      payPeriodEnd: effectivePayDate,
      notes: `COMMISSION (${source}): ${description}.${baseAmount ? ` Base: $${baseAmount.toFixed(2)}` : ''}${commissionRate ? ` @ ${(commissionRate * 100).toFixed(1)}%` : ''}`,
    });
  });

  storage.createAuditLog({
    workspaceId, userId,
    action: 'create',
    entityType: 'payroll_entry',
    actionDescription: `Commission pay of $${commissionAmount.toFixed(2)} created for employee ${employeeId} (${source})`,
    changes: { grossPay: commissionAmount, federalTax: taxes.federalTax, netPay: taxes.netPay, source, baseAmount, commissionRate },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch(err => log.warn('[CommissionPay] Audit log failed:', err?.message));

  platformEventBus.publish({
    type: 'payroll_commission_created' as any,
    category: 'payroll',
    title: 'Commission Pay Created',
    description: `$${commissionAmount.toFixed(2)} ${source} commission created for ${(employee as any).firstName} ${(employee as any).lastName}`,
    workspaceId, userId,
    metadata: { employeeId, commissionAmount, source, netPay: taxes.netPay },
    visibility: 'manager',
  }).catch(() => {});

  log.info(`[CommissionPay] $${commissionAmount} ${source} commission for employee ${employeeId}`);

  return {
    success: true,
    payType: 'commission',
    employeeId,
    grossAmount: commissionAmount,
    federalTax: taxes.federalTax,
    ficaTax: parseFloat(addFinancialValues(String(String(taxes.socialSecurity)), String(String(taxes.medicare)))),
    netAmount: taxes.netPay,
    effectiveRate: SUPPLEMENTAL_FEDERAL_RATE,
  };
}
