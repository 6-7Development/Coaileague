/**
 * PHASE 4D: Payroll Deduction & Garnishment Service
 * Calculates and applies payroll deductions and garnishments
 */

import { db } from "../db";
import { payrollDeductions, payrollGarnishments, payrollEntries } from "@shared/schema";
import { eq } from "drizzle-orm";
import Decimal from "decimal.js";

/**
 * Calculate total deductions for a payroll entry
 */
export async function calculateTotalDeductions(payrollEntryId: string): Promise<Decimal> {
  const deductions = await db
    .select()
    .from(payrollDeductions)
    .where(eq(payrollDeductions.payrollEntryId, payrollEntryId));

  return deductions.reduce((sum, d) => {
    return sum.plus(new Decimal(d.amount));
  }, new Decimal(0));
}

/**
 * Calculate total garnishments (in order of priority)
 */
export async function calculateTotalGarnishments(payrollEntryId: string): Promise<Decimal> {
  const garnishments = await db
    .select()
    .from(payrollGarnishments)
    .where(eq(payrollGarnishments.payrollEntryId, payrollEntryId));

  // Sort by priority (lower numbers = higher priority)
  const sorted = garnishments.sort((a, b) => (a.priority || 0) - (b.priority || 0));

  return sorted.reduce((sum, g) => {
    return sum.plus(new Decimal(g.amount));
  }, new Decimal(0));
}

/**
 * Apply all deductions and garnishments to a payroll entry
 */
export async function applyDeductionsAndGarnishments(payrollEntryId: string): Promise<Decimal> {
  const entry = await db
    .select()
    .from(payrollEntries)
    .where(eq(payrollEntries.id, payrollEntryId));

  if (!entry[0]) throw new Error(`Payroll entry ${payrollEntryId} not found`);

  const totalDeductions = await calculateTotalDeductions(payrollEntryId);
  const totalGarnishments = await calculateTotalGarnishments(payrollEntryId);

  const netPay = new Decimal(entry[0].netPay || 0)
    .minus(totalDeductions)
    .minus(totalGarnishments);

  console.log(`[PAYROLL DEDUCTIONS] Entry ${payrollEntryId}: Deductions=$${totalDeductions}, Garnishments=$${totalGarnishments}, Net=$${netPay}`);

  return netPay;
}

/**
 * Add a deduction to a payroll entry
 */
export async function addDeduction(
  payrollEntryId: string,
  employeeId: string,
  workspaceId: string,
  deductionType: string,
  amount: string | number,
  isPreTax: boolean = true,
  description?: string
): Promise<any> {
  const result = await db
    .insert(payrollDeductions)
    .values({
      payrollEntryId,
      employeeId,
      workspaceId,
      deductionType,
      amount: new Decimal(amount).toString(),
      isPreTax,
      description,
    })
    .returning();

  console.log(`[PAYROLL DEDUCTION] Added ${deductionType} deduction of $${amount} to entry ${payrollEntryId}`);
  return result[0];
}

/**
 * Add a garnishment to a payroll entry
 */
export async function addGarnishment(
  payrollEntryId: string,
  employeeId: string,
  workspaceId: string,
  garnishmentType: string,
  amount: string | number,
  priority: number = 1,
  caseNumber?: string,
  description?: string
): Promise<any> {
  const result = await db
    .insert(payrollGarnishments)
    .values({
      payrollEntryId,
      employeeId,
      workspaceId,
      garnishmentType,
      amount: new Decimal(amount).toString(),
      priority,
      caseNumber,
      description,
    })
    .returning();

  console.log(`[PAYROLL GARNISHMENT] Added ${garnishmentType} garnishment of $${amount} (priority ${priority}) to entry ${payrollEntryId}`);
  return result[0];
}
