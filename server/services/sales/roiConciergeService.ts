/**
 * ROI Concierge Service — Wave 13 / Task 4
 * ─────────────────────────────────────────────────────────────────────────────
 * Trinity's autonomous sales assistant for sandbox/trial workspaces.
 * When a prospect visits certain pages, Trinity calculates personalized ROI
 * and delivers an interactive popup — the "live ROI demonstration."
 *
 * TRIGGER MAP (page → popup):
 *   /dashboard or /financial/*  → P&L insight + overtime leak calculation
 *   /schedule/*                 → Coverage efficiency + calloff cost
 *   /employees/*                → License renewal cost avoidance
 *   /payroll/*                  → Tax reserve savings + compliance risk
 *   /compliance/*               → DPS audit cost avoidance
 *
 * The popup fires ONCE per page per session (no spam).
 * All calculations use the prospect's entered team size — stored in sandbox metadata.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';

const log = createLogger('ROIConcierge');

export interface ROIPopup {
  id: string;
  triggerPage: string;
  headline: string;
  insight: string;
  calculation: {
    metric: string;
    value: string;
    basis: string;
  };
  ctaText: string;
  ctaUrl: string;
  dismissable: boolean;
}

// Annualized industry benchmarks for security companies
const BENCHMARKS = {
  overtimeLeakPerGuard:     2_400, // $/yr avg unbilled overtime per guard
  calloffCostPerIncident:   180,   // $ avg cost to replace a calloff
  licenseExpiryCost:        500,   // $ avg fine/lost revenue per expired license
  dpsAuditPrep:             1_500, // $ avg cost of manual DPS audit prep
  taxUnderpaymentFine:      800,   // $ avg IRS late deposit penalty
  saasSeatWaste:            5,     // $/mo per over-provisioned seat
};

/** Generate a context-aware ROI popup for the given page + team size */
export function generateROIPopup(params: {
  triggerPage: string;
  teamSize: number;
  workspaceName?: string;
}): ROIPopup | null {
  const { triggerPage, teamSize, workspaceName = 'Your Company' } = params;
  const t = teamSize > 0 ? teamSize : 10; // default 10 officers

  if (triggerPage.includes('financial') || triggerPage.includes('dashboard') || triggerPage === '/') {
    const annualSavings = Math.round(t * BENCHMARKS.overtimeLeakPerGuard);
    return {
      id: 'roi-pl-overtime',
      triggerPage,
      headline: `Trinity found $${annualSavings.toLocaleString()} in potential savings for ${workspaceName}`,
      insight: `Based on a ${t}-guard team, the average security company leaks $${BENCHMARKS.overtimeLeakPerGuard.toLocaleString()} per guard per year in unbilled overtime and untracked schedule overruns. Trinity's real-time P&L engine flags this the moment it happens.`,
      calculation: {
        metric: 'Projected Annual Overtime Recovery',
        value: `$${annualSavings.toLocaleString()}`,
        basis: `${t} officers × $${BENCHMARKS.overtimeLeakPerGuard}/yr industry average`,
      },
      ctaText: 'Show me the P&L engine →',
      ctaUrl: '/financial/pl-dashboard',
      dismissable: true,
    };
  }

  if (triggerPage.includes('schedule')) {
    const monthlyCalloffCost = Math.round((t * 0.15) * BENCHMARKS.calloffCostPerIncident); // 15% calloff rate
    return {
      id: 'roi-schedule-calloff',
      triggerPage,
      headline: `Calloffs are costing ${workspaceName} ~$${monthlyCalloffCost.toLocaleString()}/month`,
      insight: `With ${t} officers, expect 1–2 calloffs per week at $${BENCHMARKS.calloffCostPerIncident} average replacement cost. Trinity's automated calloff response fills gaps in under 15 minutes — often eliminating the overtime premium entirely.`,
      calculation: {
        metric: 'Monthly Calloff Management Cost',
        value: `$${monthlyCalloffCost.toLocaleString()}`,
        basis: `${t} officers × 15% calloff rate × $${BENCHMARKS.calloffCostPerIncident}/incident`,
      },
      ctaText: 'See the scheduling engine →',
      ctaUrl: '/schedule',
      dismissable: true,
    };
  }

  if (triggerPage.includes('compliance') || triggerPage.includes('employee')) {
    const annualRiskAvoidance = Math.round(t * BENCHMARKS.licenseExpiryCost * 0.3 + BENCHMARKS.dpsAuditPrep);
    return {
      id: 'roi-compliance-license',
      triggerPage,
      headline: `Trinity auto-tracks ${t} officer licenses — saving you ~$${annualRiskAvoidance.toLocaleString()}/yr`,
      insight: `An expired officer license = immediate removal from duty + potential DPS fine. With ${t} officers, manual tracking is a liability. Trinity sends 90/60/30-day renewal alerts and blocks expired officers from clocking in — automatically.`,
      calculation: {
        metric: 'Annual Compliance Risk Avoidance',
        value: `$${annualRiskAvoidance.toLocaleString()}`,
        basis: `License renewal risk + $${BENCHMARKS.dpsAuditPrep} DPS audit prep savings`,
      },
      ctaText: 'View compliance engine →',
      ctaUrl: '/security-compliance/auditor-portal',
      dismissable: true,
    };
  }

  if (triggerPage.includes('payroll')) {
    const annualTaxRisk = Math.round(t * 4200 * 0.153 * 0.1); // 15.3% payroll tax, 10% under-deposit risk
    return {
      id: 'roi-payroll-tax',
      triggerPage,
      headline: `Is ${workspaceName} at risk for a $${annualTaxRisk.toLocaleString()} IRS late deposit penalty?`,
      insight: `The IRS charges up to 10% for late 941 payroll tax deposits. Trinity's Safe-to-Spend calculator automatically reserves your 941/940 obligations from every deposit so you never touch IRS money — and never face a penalty.`,
      calculation: {
        metric: 'IRS Penalty Risk Avoidance',
        value: `$${annualTaxRisk.toLocaleString()}`,
        basis: `${t} officers × avg payroll × 15.3% FICA × 10% penalty exposure`,
      },
      ctaText: 'See the CFO dashboard →',
      ctaUrl: '/financial/safe-to-spend',
      dismissable: true,
    };
  }

  return null; // No popup for this page
}

/** Record that a popup was shown (prevent re-triggering in same session) */
export async function recordPopupShown(params: {
  workspaceId: string;
  sessionId: string;
  popupId: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO sandbox_popup_log (workspace_id, session_id, popup_id, shown_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (workspace_id, session_id, popup_id) DO NOTHING`,
    [params.workspaceId, params.sessionId, params.popupId]
  ).catch(() => {}); // Table may not exist yet — non-fatal
}

/** Check if popup was already shown this session */
export async function wasPopupShown(params: {
  workspaceId: string;
  sessionId: string;
  popupId: string;
}): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM sandbox_popup_log
     WHERE workspace_id = $1 AND session_id = $2 AND popup_id = $3`,
    [params.workspaceId, params.sessionId, params.popupId]
  ).catch(() => ({ rows: [] }));
  return rows.length > 0;
}
