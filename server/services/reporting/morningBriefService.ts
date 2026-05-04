/**
 * Trinity Morning Brief Service — Wave 13 / Task 2
 * ─────────────────────────────────────────────────────────────────────────────
 * At 6:00 AM daily, Trinity synthesizes the prior 24 hours of site activity
 * into a professional, human-readable brief for each workspace owner.
 *
 * DELIVERED VIA: Email (Resend) + ChatDock notification + Platform event
 *
 * BRIEF SECTIONS:
 *   1. Headline Metrics  — shifts covered, NFC taps, incidents, safety checks
 *   2. Hazards Mitigated — incidents flagged + outcome status
 *   3. Verification Rate — NFC integrity % (taps verified vs total)
 *   4. Callout Summary   — officers who called off, replacements arranged
 *   5. Action Required   — anything needing owner attention today
 *   6. Forward Look      — today's shift count + coverage status
 *
 * WHY CLIENTS PAY: The brief lands before their coffee. They see the work
 * happened, hazards were handled, and the team showed up — without
 * picking up a phone or logging into the dashboard.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { platformEventBus } from '../platformEventBus';
import { sendCanSpamCompliantEmail } from '../emailCore';
import { isProduction } from '../../lib/isProduction';

const log = createLogger('MorningBrief');

export interface BriefData {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  ownerFirstName: string;
  date: string; // Yesterday's date
  metrics: {
    shiftsScheduled: number;
    shiftsCovered: number;
    coverageRate: number;
    nfcTapsTotal: number;
    nfcTapsVerified: number;
    integrityRate: number;
    incidentsTotal: number;
    incidentsCritical: number;
    safetyChecks: number;
    callOffs: number;
  };
  hazardsMitigated: Array<{
    type: string;
    location: string;
    outcome: string;
    severity: string;
  }>;
  actionItems: string[];
  todayShifts: number;
  todayCoverage: number;
}

/** Gather 24h metrics for one workspace */
async function gatherBriefData(workspaceId: string): Promise<BriefData | null> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();
  const dateStr = yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  try {
    // Owner info
    const { rows: wsRows } = await pool.query(
      `SELECT w.name, w.company_name, u.email, u.first_name
       FROM workspaces w
       JOIN users u ON u.id = w.owner_id
       WHERE w.id = $1`,
      [workspaceId]
    );
    if (!wsRows[0]) return null;
    const ws = wsRows[0];

    // Shift coverage
    const { rows: shiftRows } = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('completed','finished') THEN 1 ELSE 0 END) AS covered,
         SUM(CASE WHEN status = 'calloff' THEN 1 ELSE 0 END) AS calloffs
       FROM shifts
       WHERE workspace_id = $1 AND start_time >= $2 AND start_time < $3`,
      [workspaceId, yesterday, today]
    ).catch(() => ({ rows: [{ total: 0, covered: 0, calloffs: 0 }] }));
    const shifts = shiftRows[0];

    // NFC integrity
    const { rows: nfcRows } = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN integrity_verified = true THEN 1 ELSE 0 END) AS verified
       FROM guard_tour_scans
       WHERE workspace_id = $1 AND scanned_at >= $2`,
      [workspaceId, yesterday]
    ).catch(() => ({ rows: [{ total: 0, verified: 0 }] }));
    const nfc = nfcRows[0];

    // Incidents
    const { rows: incRows } = await pool.query(
      `SELECT incident_type, severity, location_description, status
       FROM service_incident_reports
       WHERE workspace_id = $1 AND created_at >= $2
       ORDER BY severity DESC, created_at DESC LIMIT 5`,
      [workspaceId, yesterday]
    ).catch(() => ({ rows: [] }));

    // Safety checks
    const { rows: safetyRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM lone_worker_sessions
       WHERE workspace_id = $1 AND last_check_in >= $2`,
      [workspaceId, yesterday]
    ).catch(() => ({ rows: [{ cnt: 0 }] }));

    // Today's shifts
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const { rows: todayRows } = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN assigned_employee_id IS NOT NULL THEN 1 ELSE 0 END) AS covered
       FROM shifts WHERE workspace_id = $1 AND start_time >= $2 AND start_time < $3`,
      [workspaceId, today, tomorrow]
    ).catch(() => ({ rows: [{ total: 0, covered: 0 }] }));

    const total = parseInt(String(shifts.total || 0));
    const covered = parseInt(String(shifts.covered || 0));
    const nfcTotal = parseInt(String(nfc.total || 0));
    const nfcVerified = parseInt(String(nfc.verified || 0));
    const criticalInc = incRows.filter(r => r.severity === 'critical').length;

    // Build action items
    const actionItems: string[] = [];
    if (total > 0 && covered / total < 0.9) actionItems.push(`Coverage below 90% — ${total - covered} shifts uncovered`);
    if (criticalInc > 0) actionItems.push(`${criticalInc} critical incident(s) require your review`);
    if (parseInt(String(shifts.calloffs || 0)) > 0) actionItems.push(`${shifts.calloffs} calloff(s) recorded — verify replacement arrangements`);

    return {
      workspaceId,
      workspaceName: ws.company_name || ws.name,
      ownerEmail: ws.email,
      ownerFirstName: ws.first_name || 'Owner',
      date: dateStr,
      metrics: {
        shiftsScheduled: total,
        shiftsCovered: covered,
        coverageRate: total > 0 ? Math.round((covered / total) * 100) : 100,
        nfcTapsTotal: nfcTotal,
        nfcTapsVerified: nfcVerified,
        integrityRate: nfcTotal > 0 ? Math.round((nfcVerified / nfcTotal) * 100) : 100,
        incidentsTotal: incRows.length,
        incidentsCritical: criticalInc,
        safetyChecks: parseInt(String(safetyRows[0]?.cnt || 0)),
        callOffs: parseInt(String(shifts.calloffs || 0)),
      },
      hazardsMitigated: incRows.map(r => ({
        type: r.incident_type || 'Security event',
        location: r.location_description || 'On-site',
        outcome: r.status === 'resolved' ? 'Resolved' : 'Under review',
        severity: r.severity || 'low',
      })),
      actionItems,
      todayShifts: parseInt(String(todayRows[0]?.total || 0)),
      todayCoverage: parseInt(String(todayRows[0]?.covered || 0)),
    };
  } catch (err: unknown) {
    log.error(`[MorningBrief] Data gather failed for ${workspaceId}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

/** Render the brief as clean HTML email */
function renderBriefEmail(brief: BriefData): { subject: string; html: string } {
  const coverageColor = brief.metrics.coverageRate >= 90 ? '#10b981' : brief.metrics.coverageRate >= 75 ? '#f59e0b' : '#ef4444';
  const integrityColor = brief.metrics.integrityRate >= 95 ? '#10b981' : '#f59e0b';

  const hazardsHtml = brief.hazardsMitigated.length > 0
    ? brief.hazardsMitigated.map(h =>
        `<li style="margin:4px 0"><strong>${h.type}</strong> at ${h.location} — <span style="color:${h.outcome === 'Resolved' ? '#10b981' : '#f59e0b'}">${h.outcome}</span></li>`
      ).join('')
    : '<li style="color:#6b7280">No hazards reported — clean night.</li>';

  const actionsHtml = brief.actionItems.length > 0
    ? brief.actionItems.map(a => `<li style="margin:4px 0; color:#dc2626">⚠ ${a}</li>`).join('')
    : '<li style="color:#10b981">✓ No action required — all systems green.</li>';

  return {
    subject: `☀️ Trinity Morning Brief — ${brief.workspaceName} | ${brief.date}`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:24px 32px">
    <div style="color:#a78bfa;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase">TRINITY™ MORNING BRIEF</div>
    <div style="color:#fff;font-size:22px;font-weight:700;margin-top:4px">${brief.workspaceName}</div>
    <div style="color:#94a3b8;font-size:13px;margin-top:2px">${brief.date} • Prepared at 6:00 AM CT</div>
  </div>

  <!-- Greeting -->
  <div style="padding:24px 32px 0">
    <p style="color:#374151;font-size:15px;margin:0">Good morning, ${brief.ownerFirstName}. Here is what happened last night while you were off the clock.</p>
  </div>

  <!-- Metrics grid -->
  <div style="padding:20px 32px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:${coverageColor}">${brief.metrics.coverageRate}%</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">Coverage Rate</div>
      <div style="font-size:11px;color:#374151">${brief.metrics.shiftsCovered}/${brief.metrics.shiftsScheduled} shifts</div>
    </div>
    <div style="background:#eff6ff;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:${integrityColor}">${brief.metrics.integrityRate}%</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">NFC Integrity</div>
      <div style="font-size:11px;color:#374151">${brief.metrics.nfcTapsVerified}/${brief.metrics.nfcTapsTotal} taps</div>
    </div>
    <div style="background:#faf5ff;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:#8b5cf6">${brief.metrics.incidentsTotal}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">Incidents Filed</div>
      <div style="font-size:11px;color:#374151">${brief.metrics.incidentsCritical} critical</div>
    </div>
  </div>

  <!-- Hazards section -->
  <div style="padding:0 32px 20px">
    <div style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">⚡ Hazards Mitigated</div>
    <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px">${hazardsHtml}</ul>
  </div>

  <!-- Action items -->
  <div style="padding:0 32px 20px;background:#fef2f2;margin:0 32px;border-radius:8px">
    <div style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-top:12px">🎯 Action Required Today</div>
    <ul style="margin:0;padding-left:20px;font-size:13px">${actionsHtml}</ul>
    <div style="padding-bottom:12px"></div>
  </div>

  <!-- Today's outlook -->
  <div style="padding:20px 32px">
    <div style="font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📅 Today's Outlook</div>
    <p style="color:#374151;font-size:13px;margin:0">${brief.todayShifts} shifts scheduled today — ${brief.todayCoverage} currently covered. ${brief.todayCoverage < brief.todayShifts ? `⚠ ${brief.todayShifts - brief.todayCoverage} open shift(s) need assignment.` : '✓ Full coverage confirmed.'}</p>
  </div>

  <!-- Footer -->
  <div style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0">
      Prepared by <strong>Trinity™</strong> — CoAIleague® Autonomous Workforce Intelligence<br>
      <a href="https://coaileague.com/dashboard" style="color:#7c3aed">View Full Dashboard</a> · 
      <a href="https://coaileague.com/settings/notifications" style="color:#7c3aed">Manage Alerts</a>
    </p>
  </div>

</div></body></html>`,
  };
}

/** Send morning brief for one workspace */
export async function sendMorningBrief(workspaceId: string): Promise<boolean> {
  try {
    const brief = await gatherBriefData(workspaceId);
    if (!brief) return false;
    if (!brief.ownerEmail) {
      log.warn(`[MorningBrief] No owner email for workspace ${workspaceId}`);
      return false;
    }

    const { subject, html } = renderBriefEmail(brief);

    await sendCanSpamCompliantEmail({
      to: brief.ownerEmail,
      subject,
      html,
      emailType: 'morning_brief',
      workspaceId,
    });

    // Also fire as platform notification
    await platformEventBus.publish({
      type: 'morning_brief_sent',
      category: 'automation',
      title: 'Morning Brief Delivered',
      description: `Coverage: ${brief.metrics.coverageRate}% | NFC Integrity: ${brief.metrics.integrityRate}% | Incidents: ${brief.metrics.incidentsTotal}`,
      workspaceId,
      metadata: { metrics: brief.metrics },
    }).catch(() => {});

    log.info(`[MorningBrief] Sent for ${workspaceId} (${brief.workspaceName})`);
    return true;
  } catch (err: unknown) {
    log.error(`[MorningBrief] Failed for ${workspaceId}:`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

/** Run morning briefs for ALL active workspaces (called by 6AM cron) */
export async function runMorningBriefCron(): Promise<{ sent: number; failed: number }> {
  log.info('[MorningBrief] 6AM cron starting...');
  let sent = 0, failed = 0;

  const { rows: workspaces } = await pool.query(
    `SELECT id FROM workspaces WHERE subscription_tier != 'free' AND is_active = true`
  ).catch(() => ({ rows: [] }));

  for (const ws of workspaces) {
    const ok = await sendMorningBrief(ws.id);
    ok ? sent++ : failed++;
    // Small delay between sends to respect Resend rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  log.info(`[MorningBrief] Cron complete — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}
