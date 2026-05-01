/**
 * HELPAI OFFICER PERSONA SERVICE
 * ================================
 * HelpAI knows who she's talking to before the first word.
 *
 * When an officer opens their shift room, HelpAI pulls a rich profile:
 *   - Name, certification status, reliability score
 *   - Last 7 days of shifts (load, OT, calloffs)
 *   - Communication preferences learned from past interactions
 *   - Emotional baseline and distress history
 *   - Common requests and struggles
 *
 * This 200-token context packet makes every interaction personal.
 * She adapts to introverts, Spanish speakers, officers who prefer
 * short answers — not because she's pretending, but because she
 * actually built that model of the person over time.
 *
 * Biological analog: The way a good supervisor unconsciously adjusts
 * how they talk to each person on their team.
 */

import { db, pool } from '../../db';
import { helpaiOfficerProfiles } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';

const log = createLogger('HelpAIOfficerPersona');

export interface OfficerPersonaContext {
  displayName: string;
  preferredStyle: string;
  preferredLanguage: string;
  commonStruggles: string[];
  stressSignals: string[];
  distressHistory: number;
  lastEmotionalState: string;
  observationNotes: string;
  shiftLoad: string;          // e.g. "heavy week — 48hrs, 2 OT shifts"
  certStatus: string;         // e.g. "license expires in 14 days"
  reliabilityScore: string;   // e.g. "98% — excellent"
  // Field-manager memory additions: HelpAI must remember the operational
  // history of each officer the way a watch commander would — how reliable
  // their attendance has been, whether they've had recent incidents, and
  // whether they're a "good officer" we can lean on without worry.
  callOffSummary: string;     // e.g. "2 call-offs in last 30d"
  incidentSummary: string;    // e.g. "1 incident report in last 60d (resolved)"
  goodOfficerNotes: string;   // e.g. "always on time, detailed reports — A-tier"
  // Site scorecard + shift fingerprint: HelpAI uses these to make smarter
  // suggestions ("you've worked Hudson 14 times with 100% on-time — take it
  // again Thursday?") and to avoid suggesting graveyard shifts to officers
  // whose history shows they always decline them.
  bestSites: string;          // e.g. "Hudson Tower (14 shifts, 100% on-time)"
  preferredHours: string;     // e.g. "typical clock-in window 06:00–08:00"
  // Distress flag — true when call-off threshold is crossed; HelpAI surfaces
  // a supervisor check-in suggestion in its reply.
  distressActive: boolean;
}

// ── Profile retrieval ─────────────────────────────────────────────────────────

export async function getOfficerPersona(
  officerId: string,
  workspaceId: string
): Promise<OfficerPersonaContext | null> {
  try {
    const [profile] = await db.select()
      .from(helpaiOfficerProfiles)
      .where(and(
        eq(helpaiOfficerProfiles.officerId, officerId),
        eq(helpaiOfficerProfiles.workspaceId, workspaceId)
      ))
      .limit(1);

    // Pull live shift data
    const shiftLoad = await getShiftLoad(officerId, workspaceId);
    const certStatus = await getCertStatus(officerId, workspaceId);
    const reliabilityScore = await getReliabilityScore(officerId, workspaceId);
    const callOffSummary = await getCallOffSummary(officerId, workspaceId);
    const incidentSummary = await getIncidentSummary(officerId, workspaceId);
    const goodOfficerNotes = buildGoodOfficerNotes(profile);
    const bestSites = await getBestSites(officerId, workspaceId);
    const preferredHours = await getPreferredHours(officerId, workspaceId);
    const distressActive = await isDistressThresholdCrossed(officerId, workspaceId);

    // Get officer name
    const nameRow = await pool.query(
      `SELECT first_name, last_name FROM employees WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
      [officerId, workspaceId]
    );
    const employee = nameRow.rows[0];
    const displayName = employee
      ? `${employee.first_name} ${employee.last_name}`.trim()
      : 'Officer';

    return {
      displayName,
      preferredStyle: profile?.preferredStyle ?? 'balanced',
      preferredLanguage: profile?.preferredLanguage ?? 'en',
      commonStruggles: profile?.commonStruggles ? JSON.parse(profile.commonStruggles) : [],
      stressSignals: profile?.stressSignals ? JSON.parse(profile.stressSignals) : [],
      distressHistory: profile?.distressHistory ?? 0,
      lastEmotionalState: profile?.lastEmotionalState ?? 'neutral',
      observationNotes: profile?.observationNotes ?? '',
      shiftLoad,
      certStatus,
      reliabilityScore,
      callOffSummary,
      incidentSummary,
      goodOfficerNotes,
      bestSites,
      preferredHours,
      distressActive,
    };
  } catch (err: any) {
    log.warn('[OfficerPersona] Failed to load persona (non-fatal):', err?.message);
    return null;
  }
}

// ── Build the HelpAI system prompt injection from persona ─────────────────────

export function buildPersonaPrompt(persona: OfficerPersonaContext): string {
  const lines: string[] = [
    `OFFICER CONTEXT — You are talking to ${persona.displayName}.`,
  ];

  // Communication style
  if (persona.preferredStyle === 'brief') {
    lines.push('They prefer SHORT answers. Get to the point fast. Skip preamble.');
  } else if (persona.preferredStyle === 'detailed') {
    lines.push('They prefer detailed explanations. Walk them through things step by step.');
  } else {
    lines.push('Match their energy — friendly but professional.');
  }

  // Language
  if (persona.preferredLanguage === 'es') {
    lines.push('Respond in Spanish. They communicate more comfortably in Spanish.');
  }

  // Current operational state
  if (persona.shiftLoad) {
    lines.push(`Shift load: ${persona.shiftLoad}`);
  }
  if (persona.certStatus) {
    lines.push(`Certification: ${persona.certStatus}`);
  }
  if (persona.reliabilityScore) {
    lines.push(`Reliability: ${persona.reliabilityScore}`);
  }
  // Field-manager memory: attendance + safety history + good-officer notes
  if (persona.callOffSummary) {
    lines.push(`Attendance: ${persona.callOffSummary}`);
  }
  if (persona.incidentSummary) {
    lines.push(`Recent incidents: ${persona.incidentSummary}`);
  }
  if (persona.goodOfficerNotes) {
    lines.push(`Strengths on file: ${persona.goodOfficerNotes}`);
  }
  if (persona.bestSites) {
    lines.push(`Best at: ${persona.bestSites}`);
  }
  if (persona.preferredHours) {
    lines.push(`Shift fingerprint: ${persona.preferredHours}`);
  }
  if (persona.distressActive) {
    lines.push(
      `⚠️ DISTRESS THRESHOLD CROSSED — this officer has had multiple call-offs in the last 14 days. ` +
      `Lead with concern: "Hey, I noticed a couple of call-offs lately — everything OK?" ` +
      `If they signal anything heavy, suggest a supervisor check-in or use /helpai escalate.`,
    );
  }

  // Emotional baseline
  if (persona.lastEmotionalState !== 'neutral') {
    lines.push(`Recent emotional state: ${persona.lastEmotionalState} — adjust your tone accordingly.`);
  }
  if (persona.distressHistory > 2) {
    lines.push(`This officer has had ${persona.distressHistory} prior distress events. Be especially attentive to stress signals.`);
  }

  // Known patterns
  if (persona.commonStruggles.length > 0) {
    lines.push(`Common struggles: ${persona.commonStruggles.join(', ')}. Anticipate these before they ask.`);
  }

  // Observer notes
  if (persona.observationNotes) {
    lines.push(`Notes from past interactions: ${persona.observationNotes}`);
  }

  return lines.join('\n');
}

// ── Profile update — called after each shift room session ────────────────────

export async function updateOfficerProfile(opts: {
  officerId: string;
  workspaceId: string;
  detectedStyle?: string;
  detectedLanguage?: string;
  emotionalState?: string;
  requestTypes?: string[];
  wasDistress?: boolean;
  observationUpdate?: string;
}): Promise<void> {
  try {
    const [existing] = await db.select()
      .from(helpaiOfficerProfiles)
      .where(and(
        eq(helpaiOfficerProfiles.officerId, opts.officerId),
        eq(helpaiOfficerProfiles.workspaceId, opts.workspaceId)
      ))
      .limit(1);

    const now = new Date();

    if (existing) {
      const updates: Record<string, any> = {
        lastInteractionAt: now,
        totalInteractions: (existing.totalInteractions ?? 0) + 1,
        updatedAt: now,
      };
      if (opts.detectedStyle) updates.preferredStyle = opts.detectedStyle;
      if (opts.detectedLanguage) updates.preferredLanguage = opts.detectedLanguage;
      if (opts.emotionalState) updates.lastEmotionalState = opts.emotionalState;
      if (opts.wasDistress) updates.distressHistory = (existing.distressHistory ?? 0) + 1;
      if (opts.observationUpdate) {
        // Append to observation notes, keep last 150 tokens (~600 chars)
        const prev = existing.observationNotes ?? '';
        updates.observationNotes = (`${prev} ${opts.observationUpdate}`).slice(-600).trim();
      }
      if (opts.requestTypes?.length) {
        const prev: string[] = existing.commonRequests ? JSON.parse(existing.commonRequests) : [];
        const merged = [...new Set([...prev, ...opts.requestTypes])].slice(0, 10);
        updates.commonRequests = JSON.stringify(merged);
      }

      await db.update(helpaiOfficerProfiles)
        .set(updates)
        .where(and(
          eq(helpaiOfficerProfiles.officerId, opts.officerId),
          eq(helpaiOfficerProfiles.workspaceId, opts.workspaceId)
        ));
    } else {
      // Create new profile
      await db.insert(helpaiOfficerProfiles).values({
        officerId: opts.officerId,
        workspaceId: opts.workspaceId,
        preferredStyle: opts.detectedStyle ?? 'balanced',
        preferredLanguage: opts.detectedLanguage ?? 'en',
        lastEmotionalState: opts.emotionalState ?? 'neutral',
        distressHistory: opts.wasDistress ? 1 : 0,
        totalInteractions: 1,
        lastInteractionAt: now,
        observationNotes: opts.observationUpdate ?? '',
        commonRequests: opts.requestTypes ? JSON.stringify(opts.requestTypes) : null,
      });
    }
  } catch (err: any) {
    log.warn('[OfficerPersona] Profile update failed (non-fatal):', err?.message);
  }
}

// ── Live data helpers ─────────────────────────────────────────────────────────

async function getShiftLoad(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as shift_count,
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600
        ), 0) as total_hours,
        COUNT(*) FILTER (WHERE is_overtime = true) as ot_count
      FROM shifts
      WHERE employee_id = $1 AND workspace_id = $2
        AND date >= CURRENT_DATE - 7
    `, [officerId, workspaceId]);

    const row = result.rows[0];
    if (!row || Number(row.shift_count) === 0) return '';
    const hrs = Math.round(Number(row.total_hours));
    const otStr = Number(row.ot_count) > 0 ? `, ${row.ot_count} OT` : '';
    const load = hrs > 40 ? 'heavy week' : hrs > 24 ? 'normal week' : 'light week';
    return `${load} — ${hrs}hrs${otStr}`;
  } catch { return ''; }
}

async function getCertStatus(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT license_expiration_date FROM employees
      WHERE id = $1 AND workspace_id = $2 LIMIT 1
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    if (!row?.license_expiration_date) return '';
    const daysLeft = Math.ceil(
      (new Date(row.license_expiration_date).getTime() - Date.now()) / 86400000
    );
    if (daysLeft < 0) return '⚠️ License EXPIRED';
    if (daysLeft <= 30) return `⚠️ License expires in ${daysLeft} days`;
    return 'License current';
  } catch { return ''; }
}

async function getReliabilityScore(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('completed','clocked_out')) as completed
      FROM shifts
      WHERE employee_id = $1 AND workspace_id = $2
        AND date >= CURRENT_DATE - 90
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    if (!row || Number(row.total) === 0) return '';
    const pct = Math.round((Number(row.completed) / Number(row.total)) * 100);
    const grade = pct >= 97 ? 'excellent' : pct >= 90 ? 'good' : pct >= 80 ? 'fair' : 'needs attention';
    return `${pct}% — ${grade}`;
  } catch { return ''; }
}

// Call-off / no-show summary so HelpAI can talk to officers with the same
// awareness a real watch commander would have ("hey, this is your second
// late shift this month — everything OK?").  Counts shifts in the last 30
// days marked as no-show, called-off, late, or cancelled by the officer.
async function getCallOffSummary(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('no_show','called_off','cancelled_by_employee')) as call_offs,
        COUNT(*) FILTER (WHERE status = 'late' OR (clock_in_time IS NOT NULL AND clock_in_time > start_time)) as late_arrivals
      FROM shifts
      WHERE employee_id = $1 AND workspace_id = $2
        AND date >= CURRENT_DATE - 30
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    const off = Number(row?.call_offs ?? 0);
    const late = Number(row?.late_arrivals ?? 0);
    if (off === 0 && late === 0) return 'clean — no call-offs or late arrivals in last 30d';
    const parts: string[] = [];
    if (off > 0) parts.push(`${off} call-off${off === 1 ? '' : 's'}`);
    if (late > 0) parts.push(`${late} late arrival${late === 1 ? '' : 's'}`);
    return `${parts.join(', ')} in last 30d`;
  } catch { return ''; }
}

// Incident-report awareness so HelpAI knows the officer's recent safety
// history before responding.  Pulls counts from the canonical incident_reports
// table; safe-falls to '' if the table is unavailable.
async function getIncidentSummary(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity IN ('high','critical')) as serious,
        COUNT(*) FILTER (WHERE status IN ('open','investigating')) as open_count
      FROM incident_reports
      WHERE reporter_id = $1 AND workspace_id = $2
        AND created_at >= NOW() - INTERVAL '60 days'
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    const total = Number(row?.total ?? 0);
    if (total === 0) return 'none in last 60d';
    const serious = Number(row?.serious ?? 0);
    const open = Number(row?.open_count ?? 0);
    const tags: string[] = [];
    if (serious > 0) tags.push(`${serious} serious`);
    if (open > 0) tags.push(`${open} still open`);
    const tagStr = tags.length ? ` (${tags.join(', ')})` : '';
    return `${total} report${total === 1 ? '' : 's'} in last 60d${tagStr}`;
  } catch { return ''; }
}

// Pull the strengths array off the officer profile (set by managers /
// auto-detected after consistently good performance) so HelpAI greets known
// reliable officers with the trust they've earned.
function buildGoodOfficerNotes(profile: any): string {
  if (!profile?.strengths) return '';
  try {
    const arr: string[] = JSON.parse(profile.strengths);
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr.slice(0, 3).join(', ');
  } catch {
    return '';
  }
}

// Per-site officer scorecard — best site by completion rate over last 90d.
// HelpAI uses this to make smart suggestions like "You've worked Hudson 14
// times with 100% on-time — comfortable taking it again Thursday?"
async function getBestSites(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(s.site_name, 'Site') as site_name,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE s.status IN ('completed','clocked_out')) as completed,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE s.status IN ('completed','clocked_out'))
          / NULLIF(COUNT(*), 0)
        ) as on_time_pct
      FROM shifts s
      WHERE s.employee_id = $1
        AND s.workspace_id = $2
        AND s.date >= CURRENT_DATE - 90
      GROUP BY s.site_name
      HAVING COUNT(*) >= 3
      ORDER BY on_time_pct DESC NULLS LAST, total DESC
      LIMIT 1
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    if (!row) return '';
    const total = Number(row.total ?? 0);
    const pct = Number(row.on_time_pct ?? 0);
    return `${row.site_name} (${total} shifts, ${pct}% on-time)`;
  } catch { return ''; }
}

// Shift-pattern fingerprint — typical clock-in window over last 60 days,
// rounded to the nearest 2-hour bucket. HelpAI stops suggesting 04:00 shifts
// to officers who have always declined them.
async function getPreferredHours(officerId: string, workspaceId: string): Promise<string> {
  try {
    const result = await pool.query(`
      SELECT
        ROUND(AVG(EXTRACT(HOUR FROM clock_in_time))) as avg_clock_in,
        STDDEV(EXTRACT(HOUR FROM clock_in_time)) as spread,
        COUNT(*) as samples
      FROM time_entries
      WHERE employee_id = $1
        AND workspace_id = $2
        AND clock_in_time IS NOT NULL
        AND clock_in_time >= NOW() - INTERVAL '60 days'
    `, [officerId, workspaceId]);
    const row = result.rows[0];
    const samples = Number(row?.samples ?? 0);
    if (samples < 4) return '';
    const avg = Number(row?.avg_clock_in ?? 0);
    const spread = Math.round(Number(row?.spread ?? 0));
    const lo = String(Math.max(0, avg - Math.max(1, spread))).padStart(2, '0');
    const hi = String(Math.min(23, avg + Math.max(1, spread))).padStart(2, '0');
    return `typical clock-in window ${lo}:00–${hi}:00 (n=${samples})`;
  } catch { return ''; }
}

// Distress threshold — 3+ call-offs in last 14 days. When crossed, HelpAI
// receives a flag in the persona prompt asking it to lead with concern and
// suggest a supervisor check-in.
async function isDistressThresholdCrossed(officerId: string, workspaceId: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as c FROM shifts
      WHERE employee_id = $1 AND workspace_id = $2
        AND status IN ('no_show','called_off','cancelled_by_employee')
        AND date >= CURRENT_DATE - 14
    `, [officerId, workspaceId]);
    return Number(result.rows[0]?.c ?? 0) >= 3;
  } catch { return false; }
}
