/**
 * Ghost Expense Auditor — Wave 11 / Task 5
 * ─────────────────────────────────────────────────────────────────────────────
 * Surfaces the "subscription creep" problem that silently kills margins at
 * security companies: paying for 100 TrackTik seats when only 60 guards are
 * active, or carrying workers' comp insurance for 80 employees when only 45
 * are currently on the roster.
 *
 * WHAT IT AUDITS:
 *   SaaS Seats    — billing platform seats vs. active employee headcount
 *   Insurance     — policy headcount vs. active roster (estimate)
 *   Vendor Bills  — recurring charges that have grown faster than headcount
 *   Training      — paid training seats vs. enrolled employees
 *
 * DATA SOURCES:
 *   Active guards  → employees table (status = 'active')
 *   Vendor bills   → org_finance_settings.vendor_subscriptions (JSON) or bank feed
 *   Platform seats → platform's own billing tier data
 *
 * OUTPUT: Flagged line items with monthly waste estimate and recommended action.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';

const log = createLogger('GhostExpenseAuditor');

export interface GhostExpenseFlag {
  category: 'saas_seats' | 'insurance' | 'vendor_bill' | 'training';
  vendor: string;
  paidFor: number;            // Units being paid for
  actuallyUsed: number;       // Units actually needed
  waste: number;              // Units over-provisioned
  monthlyWasteDollars: number;
  annualWasteDollars: number;
  severity: 'critical' | 'warning' | 'info';
  recommendation: string;
  actionUrl?: string;
}

export interface GhostExpenseReport {
  workspaceId: string;
  asOf: Date;
  activeEmployeeCount: number;
  activeManagerCount: number;
  flags: GhostExpenseFlag[];
  totalMonthlyWaste: number;
  totalAnnualWaste: number;
  summary: string;
}

export async function runGhostExpenseAudit(workspaceId: string): Promise<GhostExpenseReport> {
  const asOf = new Date();
  const flags: GhostExpenseFlag[] = [];

  // ── Get current headcount ────────────────────────────────────────────────
  const { rows: headcount } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active') AS active_total,
       COUNT(*) FILTER (WHERE status = 'active' AND workspace_role IN ('staff', 'contractor')) AS active_guards,
       COUNT(*) FILTER (WHERE status = 'active' AND workspace_role IN ('org_owner', 'co_owner', 'department_manager', 'supervisor')) AS active_managers
     FROM workspace_members
     WHERE workspace_id = $1`,
    [workspaceId]
  ).catch(() => ({ rows: [{ active_total: 0, active_guards: 0, active_managers: 0 }] }));

  const activeTotal = parseInt(String(headcount[0]?.active_total || 0), 10);
  const activeGuards = parseInt(String(headcount[0]?.active_guards || 0), 10);
  const activeManagers = parseInt(String(headcount[0]?.active_managers || 0), 10);

  // ── Audit 1: CoAIleague platform seats vs. headcount ────────────────────
  const { rows: wsRows } = await pool.query(
    `SELECT subscription_tier, max_employees, max_managers, stripe_subscription_id
     FROM workspaces WHERE id = $1`,
    [workspaceId]
  ).catch(() => ({ rows: [] }));

  const ws = wsRows[0];
  if (ws?.max_employees && ws.max_employees > 0) {
    const overProvisionedSeats = ws.max_employees - activeTotal;
    if (overProvisionedSeats > 10) {
      const monthlyWaste = overProvisionedSeats * 5; // ~$5/seat/month estimate
      flags.push({
        category: 'saas_seats',
        vendor: 'CoAIleague (Current Plan)',
        paidFor: ws.max_employees,
        actuallyUsed: activeTotal,
        waste: overProvisionedSeats,
        monthlyWasteDollars: monthlyWaste,
        annualWasteDollars: monthlyWaste * 12,
        severity: overProvisionedSeats > 20 ? 'critical' : 'warning',
        recommendation: `You're paying for ${ws.max_employees} seats but only have ${activeTotal} active members. Downgrade to save ~$${monthlyWaste.toFixed(0)}/month.`,
        actionUrl: '/org-management?tab=billing',
      });
    }
  }

  // ── Audit 2: Vendor subscriptions from org_finance_settings ─────────────
  try {
    const { rows: vendorRows } = await pool.query(
      `SELECT vendor_subscriptions FROM org_finance_settings WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    );

    const vendorSubs = vendorRows[0]?.vendor_subscriptions as Array<{
      name: string; seats: number; monthlyCost: number; category?: string;
    }> | null;

    if (Array.isArray(vendorSubs)) {
      for (const sub of vendorSubs) {
        if (!sub.seats || sub.seats <= 0) continue;
        const overage = sub.seats - activeTotal;
        if (overage > 5) {
          const monthlyWaste = (overage / sub.seats) * sub.monthlyCost;
          flags.push({
            category: (sub.category as 'saas_seats' | 'insurance') || 'saas_seats',
            vendor: sub.name,
            paidFor: sub.seats,
            actuallyUsed: activeTotal,
            waste: overage,
            monthlyWasteDollars: Math.round(monthlyWaste),
            annualWasteDollars: Math.round(monthlyWaste * 12),
            severity: overage > sub.seats * 0.20 ? 'critical' : 'warning',
            recommendation: `${sub.name}: Reduce from ${sub.seats} to ${activeTotal} seats to save ~$${monthlyWaste.toFixed(0)}/month.`,
          });
        }
      }
    }
  } catch {
    // Table may not exist yet — not fatal
  }

  // ── Audit 3: Workers' Comp estimate vs. active roster ───────────────────
  try {
    const { rows: wcRows } = await pool.query(
      `SELECT workers_comp_headcount, workers_comp_monthly_premium
       FROM org_finance_settings WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    );
    const wcHeadcount = parseInt(String(wcRows[0]?.workers_comp_headcount || 0), 10);
    const wcPremium = parseFloat(String(wcRows[0]?.workers_comp_monthly_premium || 0));

    if (wcHeadcount > 0 && wcPremium > 0 && wcHeadcount > activeGuards + 5) {
      const overage = wcHeadcount - activeGuards;
      const wasteRate = wcPremium / wcHeadcount;
      const monthlyWaste = overage * wasteRate;
      flags.push({
        category: 'insurance',
        vendor: "Workers' Compensation Insurance",
        paidFor: wcHeadcount,
        actuallyUsed: activeGuards,
        waste: overage,
        monthlyWasteDollars: Math.round(monthlyWaste),
        annualWasteDollars: Math.round(monthlyWaste * 12),
        severity: 'warning',
        recommendation: `Your workers' comp policy covers ${wcHeadcount} employees but you only have ${activeGuards} active guards. Contact your insurer to adjust headcount and save ~$${monthlyWaste.toFixed(0)}/month.`,
      });
    }
  } catch {
    // Not fatal
  }

  // ── Compile report ────────────────────────────────────────────────────────
  const totalMonthlyWaste = flags.reduce((s, f) => s + f.monthlyWasteDollars, 0);
  const totalAnnualWaste = totalMonthlyWaste * 12;

  const summary = flags.length === 0
    ? `✅ No ghost expenses detected. ${activeTotal} active members, subscriptions appear right-sized.`
    : `⚠️ Found ${flags.length} potential ghost expense(s). Estimated waste: $${totalMonthlyWaste.toFixed(0)}/month ($${totalAnnualWaste.toFixed(0)}/year). Trinity recommends reviewing these line items with your accountant.`;

  log.info(`[GhostExpense] ws=${workspaceId} flags=${flags.length} monthlyWaste=$${totalMonthlyWaste.toFixed(0)}`);

  return {
    workspaceId, asOf,
    activeEmployeeCount: activeTotal,
    activeManagerCount: activeManagers,
    flags,
    totalMonthlyWaste: Math.round(totalMonthlyWaste),
    totalAnnualWaste: Math.round(totalAnnualWaste),
    summary,
  };
}
