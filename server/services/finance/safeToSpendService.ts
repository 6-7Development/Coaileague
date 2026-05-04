/**
 * Safe-to-Spend Service — Wave 11 / Task 3
 * ─────────────────────────────────────────────────────────────────────────────
 * The CFO insight owners actually need: not "what's in the bank" but
 * "what can I actually spend without a surprise tax bill."
 *
 * Trinity tells the owner: "You have $20k in the bank, but $4k belongs to
 * the IRS. Your Safe-to-Spend balance is $16k."
 *
 * RESERVES CALCULATED:
 *   941 Tax Reserve    — 15.3% of gross payroll (employer + employee FICA + federal)
 *   940 FUTA Reserve   — 0.6% of first $7,000 per employee per year
 *   Workers' Comp      — per-state rate × payroll (TX: ~2.5% for security guards)
 *   State UI (SUTA)    — per-state new employer rate × payroll (TX: 2.7%)
 *   Operating Buffer   — configurable % the owner wants to hold back (default 10%)
 *
 * DATA SOURCES:
 *   Payroll → payroll_runs (actual gross pay processed this month)
 *   Bank    → Plaid bank_accounts balance (or manual entry if Plaid pending)
 *   Rates   → taxRulesRegistry.ts (authoritative 2025 rates)
 */

import { pool } from '../../db';
import { getTaxRules } from '../tax/taxRulesRegistry';
import { createLogger } from '../../lib/logger';

const log = createLogger('SafeToSpend');

export interface SafeToSpendSnapshot {
  workspaceId: string;
  asOf: Date;

  // Bank
  bankBalanceRaw: number;
  bankBalanceSource: 'plaid' | 'manual' | 'unavailable';

  // Payroll this period
  grossPayrollMtd: number;         // Month-to-date gross pay
  employeeCount: number;

  // Reserves
  reserves: {
    federal941: number;            // Employer + employee FICA + federal income tax withheld
    futa940: number;               // Employer FUTA obligation (0.6% × first $7k)
    stateSuta: number;             // State UI tax (new employer rate)
    workersComp: number;           // Workers' comp estimate
    operatingBuffer: number;       // Configurable % owner holds back
    total: number;
  };

  // The number that matters
  safeToSpend: number;
  safeToSpendPct: number;          // What % of bank balance is spendable

  // Breakdown for ChatDock
  explanation: string[];
}

const WORKERS_COMP_RATES: Record<string, number> = {
  TX: 0.025, CA: 0.040, FL: 0.035, NY: 0.045, IL: 0.030,
  GA: 0.028, NC: 0.026, AZ: 0.032, OH: 0.029, PA: 0.033,
};

export async function calculateSafeToSpend(
  workspaceId: string,
  options: { operatingBufferPct?: number; stateCode?: string } = {}
): Promise<SafeToSpendSnapshot> {
  const operatingBufferPct = options.operatingBufferPct ?? 0.10;
  const stateCode = (options.stateCode || 'TX').toUpperCase();
  const rules = getTaxRules();
  const asOf = new Date();

  // ── Bank balance ──────────────────────────────────────────────────────────
  let bankBalance = 0;
  let bankSource: 'plaid' | 'manual' | 'unavailable' = 'unavailable';

  try {
    const { rows: plaidRows } = await pool.query(
      `SELECT COALESCE(SUM(available_balance), 0) AS total
       FROM bank_accounts
       WHERE workspace_id = $1 AND is_active = true AND account_type = 'checking'`,
      [workspaceId]
    );
    bankBalance = parseFloat(String(plaidRows[0]?.total || 0));
    if (bankBalance > 0) bankSource = 'plaid';
  } catch {
    // Plaid not connected — try org_finance_settings manual balance
    try {
      const { rows: manualRows } = await pool.query(
        `SELECT manual_bank_balance FROM org_finance_settings WHERE workspace_id = $1 LIMIT 1`,
        [workspaceId]
      );
      bankBalance = parseFloat(String(manualRows[0]?.manual_bank_balance || 0));
      if (bankBalance > 0) bankSource = 'manual';
    } catch {
      log.warn(`[SafeToSpend] No bank balance available for workspace ${workspaceId}`);
    }
  }

  // ── Month-to-date payroll ────────────────────────────────────────────────
  const { rows: payrollRows } = await pool.query(
    `SELECT
       COALESCE(SUM(CAST(total_gross_pay AS NUMERIC)), 0) AS gross_pay,
       COUNT(DISTINCT pe.employee_id) AS employee_count,
       COALESCE(SUM(CAST(total_taxes AS NUMERIC)), 0) AS total_taxes
     FROM payroll_runs pr
     LEFT JOIN payroll_entries pe ON pe.payroll_run_id = pr.id
     WHERE pr.workspace_id = $1
       AND pr.period_end >= date_trunc('month', NOW())
       AND pr.status IN ('approved', 'processed', 'paid', 'completed')`,
    [workspaceId]
  ).catch(() => ({ rows: [{ gross_pay: 0, employee_count: 0, total_taxes: 0 }] }));

  const grossPayMtd = parseFloat(String(payrollRows[0]?.gross_pay || 0));
  const employeeCount = parseInt(String(payrollRows[0]?.employee_count || 0), 10);
  const taxesAlreadyWithheld = parseFloat(String(payrollRows[0]?.total_taxes || 0));

  // ── Reserve calculations ──────────────────────────────────────────────────

  // 941 reserve: what you owe the IRS for payroll taxes
  // = employer SS (6.2%) + employer Medicare (1.45%) + withheld employee taxes
  const employerSS = grossPayMtd * rules.fica.ssRate;
  const employerMedicare = grossPayMtd * rules.fica.medicareRate;
  const federal941 = employerSS + employerMedicare + taxesAlreadyWithheld;

  // 940 FUTA: 0.6% on first $7,000 per employee (approximated MTD)
  const futaWageBase = rules.futa.wageBase;
  const futaRate = rules.futa.netRate;
  const taxableFutaWagesMtd = Math.min(grossPayMtd, employeeCount * futaWageBase / 12);
  const futa940 = taxableFutaWagesMtd * futaRate;

  // State SUTA
  const sutaConfig = rules.sutaDefaults.find(s => s.state === stateCode);
  const sutaRate = sutaConfig?.newEmployerRate || 0.027;
  const sutaWageBase = sutaConfig?.wageBase || 9000;
  const taxableSutaWagesMtd = Math.min(grossPayMtd, employeeCount * sutaWageBase / 12);
  const stateSuta = taxableSutaWagesMtd * sutaRate;

  // Workers' comp estimate
  const wcRate = WORKERS_COMP_RATES[stateCode] || 0.030;
  const workersComp = grossPayMtd * wcRate;

  // Operating buffer
  const operatingBuffer = bankBalance * operatingBufferPct;

  const totalReserves = federal941 + futa940 + stateSuta + workersComp + operatingBuffer;
  const safeToSpend = Math.max(0, bankBalance - totalReserves);
  const safeToSpendPct = bankBalance > 0 ? (safeToSpend / bankBalance) * 100 : 0;

  // ── Plain-English explanation for ChatDock ────────────────────────────────
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const explanation = [
    `Bank balance: ${fmt(bankBalance)} (source: ${bankSource})`,
    `Gross payroll this month: ${fmt(grossPayMtd)} across ${employeeCount} employees`,
    ``,
    `Reserves being held:`,
    `  IRS 941 (payroll taxes): ${fmt(federal941)}`,
    `  IRS 940 FUTA: ${fmt(futa940)}`,
    `  ${stateCode} SUTA: ${fmt(stateSuta)}`,
    `  Workers' Comp (~${(wcRate * 100).toFixed(1)}% ${stateCode}): ${fmt(workersComp)}`,
    `  Operating buffer (${(operatingBufferPct * 100).toFixed(0)}%): ${fmt(operatingBuffer)}`,
    `  Total reserved: ${fmt(totalReserves)}`,
    ``,
    `✅ Safe-to-Spend: ${fmt(safeToSpend)} (${safeToSpendPct.toFixed(1)}% of bank balance)`,
  ];

  log.info(`[SafeToSpend] ws=${workspaceId} bank=${bankBalance} reserves=${totalReserves.toFixed(2)} safe=${safeToSpend.toFixed(2)}`);

  return {
    workspaceId, asOf,
    bankBalanceRaw: bankBalance,
    bankBalanceSource: bankSource,
    grossPayrollMtd: grossPayMtd,
    employeeCount,
    reserves: {
      federal941: Math.round(federal941 * 100) / 100,
      futa940: Math.round(futa940 * 100) / 100,
      stateSuta: Math.round(stateSuta * 100) / 100,
      workersComp: Math.round(workersComp * 100) / 100,
      operatingBuffer: Math.round(operatingBuffer * 100) / 100,
      total: Math.round(totalReserves * 100) / 100,
    },
    safeToSpend: Math.round(safeToSpend * 100) / 100,
    safeToSpendPct: Math.round(safeToSpendPct * 10) / 10,
    explanation,
  };
}
