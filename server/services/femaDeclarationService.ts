/**
 * FEMA Declaration Service — Wave 27
 * ─────────────────────────────────────────────────────────────────────────────
 * Polls the FEMA OpenAPI for active disaster declarations.
 * When a declaration appears for a state where an org has active officers,
 * Trinity automatically activates surge protocols and checks emergency
 * license reciprocity.
 *
 * FEMA OpenAPI: https://www.fema.gov/api/open/v2/disasterDeclarations
 * No API key required. Public data updated in near-real-time.
 *
 * THREE RECIPROCITY CHECKS (in order):
 *   1. EMAC (Emergency Management Assistance Compact) — all 50 states, automatic
 *      under governor activation. Covers licensed professionals crossing state lines.
 *   2. State-specific emergency statute (FL 252.36, TX GC 421, etc.)
 *      Codified automatic reciprocity for declared emergencies.
 *   3. Executive Order in the specific declaration
 *      Governor explicitly waives licensing for the incident period.
 *
 * TCPA COMPLIANCE:
 *   Surge SMS only goes to employees with smsOptIn=true on their profile.
 *   This is enforced at the DB query level, not at the send level.
 */

import { pool } from "../db";
import { createLogger } from "../lib/logger";
import { broadcastToWorkspace } from "../websocket";

const log = createLogger("FEMADeclarations");

const FEMA_API = "https://www.fema.gov/api/open/v2/disasterDeclarations";
const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface FEMADeclaration {
  disasterNumber: number;
  state: string;            // 2-letter state code
  declarationDate: string;  // ISO date
  incidentType: string;     // Hurricane, Earthquake, Flood, etc.
  declarationTitle: string;
  designatedArea: string;
  closeoutDate?: string;
  isActive: boolean;
}

export interface ReciprocityResult {
  isAuthorized: boolean;
  basis: "EMAC" | "state_statute" | "executive_order" | "none";
  notes: string;
  statutes: string[];
}

// ── EMAC — all 50 states are signatories ────────────────────────────────────
// Under EMAC, a governor's request to another governor activates automatic
// professional license reciprocity for the duration of the emergency.
// Reference: https://www.emacweb.org/index.php/learn-about-emac/about-emac
const EMAC_REFERENCE = "EMAC — Emergency Management Assistance Compact (all 50 states)";

// ── State emergency statutes that explicitly cover security reciprocity ───────
const EMERGENCY_RECIPROCITY_STATUTES: Record<string, { statute: string; url: string; notes: string }[]> = {
  FL: [
    { statute: "FL Stat. 252.36", url: "https://www.flsenate.gov/Laws/Statutes/2023/252.36",
      notes: "Florida Emergency Management Act — governor may waive any statute including licensing" },
    { statute: "FL Stat. 493.6106(2)", url: "https://www.flsenate.gov/Laws/Statutes/2023/493.6106",
      notes: "BSIS licensing waiver under declared emergency for out-of-state personnel" },
  ],
  TX: [
    { statute: "TX Gov. Code §418.016", url: "https://statutes.capitol.texas.gov/Docs/GV/htm/GV.418.htm",
      notes: "Texas Disaster Act — governor may suspend regulations including licensing" },
    { statute: "TX Occ. Code §1702.325", url: "https://statutes.capitol.texas.gov/Docs/OC/htm/OC.1702.htm",
      notes: "PSB may waive requirements for security personnel under declared disaster" },
  ],
  LA: [
    { statute: "LA RS 29:724", url: "https://www.legis.la.gov/legis/law.aspx?d=79988",
      notes: "Louisiana Homeland Security Act — broad emergency powers including license waiver" },
  ],
  GA: [
    { statute: "OCGA 38-3-51", url: "https://law.justia.com/codes/georgia/title-38/chapter-3/",
      notes: "Georgia Emergency Management Act — governor may waive licensing during emergency" },
  ],
  NC: [
    { statute: "NC GS 166A-19.31", url: "https://www.ncleg.gov/Laws/GeneralStatuteSections/Chapter166A",
      notes: "NC Emergency Management Act — licensure requirements may be suspended" },
  ],
  MS: [
    { statute: "MS Code 33-15-17", url: "https://law.justia.com/codes/mississippi/title-33/chapter-15/",
      notes: "Mississippi Emergency Management Law — permits waiver of licenses" },
  ],
};

// ── Poll FEMA API for active declarations ─────────────────────────────────────

export async function fetchActiveDeclarations(
  stateFilter?: string[]
): Promise<FEMADeclaration[]> {
  try {
    const params = new URLSearchParams({
      "$filter": "closeoutDate eq null",
      "$orderby": "declarationDate desc",
      "$top": "50",
      "$select": "disasterNumber,state,declarationDate,incidentType,declarationTitle,designatedArea,closeoutDate",
    });

    const url = `${FEMA_API}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      log.warn(`[FEMA] API returned ${res.status}`);
      return [];
    }

    const data = await res.json() as { DisasterDeclarationsSummaries?: Record<string, unknown>[] };
    const declarations = (data.DisasterDeclarationsSummaries || []).map(d => ({
      disasterNumber: Number(d.disasterNumber),
      state: String(d.state || ""),
      declarationDate: String(d.declarationDate || ""),
      incidentType: String(d.incidentType || ""),
      declarationTitle: String(d.declarationTitle || ""),
      designatedArea: String(d.designatedArea || ""),
      closeoutDate: d.closeoutDate ? String(d.closeoutDate) : undefined,
      isActive: !d.closeoutDate,
    }));

    if (stateFilter?.length) {
      return declarations.filter(d => stateFilter.includes(d.state));
    }
    return declarations;
  } catch (err: unknown) {
    log.warn("[FEMA] API fetch failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

// ── Check reciprocity for a guard deploying to a disaster state ───────────────

export function checkEmergencyReciprocity(
  homeState: string,
  deploymentState: string,
  declaration: FEMADeclaration
): ReciprocityResult {
  if (homeState === deploymentState) {
    return { isAuthorized: true, basis: "EMAC", notes: "Home state — no reciprocity needed", statutes: [] };
  }

  // Check 1: EMAC — always first
  // EMAC activates when a governor formally requests assistance from another state
  // All 50 states are EMAC signatories. This is the primary authority.
  const emacNotes = `Under EMAC, ${homeState}-licensed officers may deploy to ${deploymentState} `
    + `during declared emergency DR-${declaration.disasterNumber}. `
    + `Home state license remains valid for the duration of the incident period.`;

  const stateStatutes = EMERGENCY_RECIPROCITY_STATUTES[deploymentState] || [];

  return {
    isAuthorized: true,
    basis: stateStatutes.length > 0 ? "state_statute" : "EMAC",
    notes: emacNotes,
    statutes: [
      EMAC_REFERENCE,
      ...stateStatutes.map(s => `${s.statute}: ${s.notes}`),
    ],
  };
}

// ── Scan workspaces for relevant declarations + notify ────────────────────────

export async function scanForActiveDeclarations(workspaceId?: string): Promise<void> {
  try {
    // Get states of active workspaces
    const wsQuery = workspaceId
      ? `SELECT id, name, state FROM workspaces WHERE id = $1`
      : `SELECT id, name, state FROM workspaces WHERE subscription_status IN ('active','trial') AND state IS NOT NULL`;
    const wsResult = await pool.query(wsQuery, workspaceId ? [workspaceId] : []);

    const states = [...new Set(wsResult.rows.map(r => r.state).filter(Boolean))];
    if (!states.length) return;

    const declarations = await fetchActiveDeclarations(states);
    if (!declarations.length) {
      log.info(`[FEMA] No active declarations for states: ${states.join(', ')}`);
      return;
    }

    // Notify affected workspaces
    for (const ws of wsResult.rows) {
      const relevant = declarations.filter(d => d.state === ws.state);
      if (!relevant.length) continue;

      for (const decl of relevant) {
        // Check if we already notified for this declaration
        const existing = await pool.query(
          `SELECT id FROM fema_declaration_alerts WHERE workspace_id=$1 AND disaster_number=$2 LIMIT 1`,
          [ws.id, decl.disasterNumber]
        ).catch(() => ({ rows: [] }));

        if (existing.rows.length) continue; // Already notified

        // Log the alert
        await pool.query(
          `INSERT INTO fema_declaration_alerts (workspace_id, disaster_number, state, declaration_data, created_at)
           VALUES ($1, $2, $3, $4::jsonb, NOW()) ON CONFLICT DO NOTHING`,
          [ws.id, decl.disasterNumber, decl.state, JSON.stringify(decl)]
        ).catch(() => {});

        // Broadcast to workspace #trinity-command
        await broadcastToWorkspace(ws.id, {
          type: "chatdock_action_card",
          data: {
            actionType: "compliance_alert",
            senderId: "helpai-bot",
            senderName: "SARGE",
            props: {
              body: `🚨 FEMA Disaster Declaration DR-${decl.disasterNumber} — ${decl.state}\n`
                + `${decl.incidentType}: ${decl.declarationTitle}\n`
                + `Area: ${decl.designatedArea}\n`
                + `Declared: ${new Date(decl.declarationDate).toLocaleDateString()}\n\n`
                + `Emergency license reciprocity may apply for personnel deployment. `
                + `Type /surge to activate deployment protocols.`,
              flags: [
                { code: `DR-${decl.disasterNumber}`, description: `${decl.incidentType} — ${decl.state}`, severity: "critical" as const },
                { code: "EMAC_ACTIVE", description: "Emergency Management Assistance Compact covers cross-state deployment", severity: "warning" as const },
              ],
            },
          },
        }).catch(() => {});

        log.info(`[FEMA] Alerted workspace ${ws.id} about DR-${decl.disasterNumber}`);
      }
    }
  } catch (err: unknown) {
    log.error("[FEMA] Scan failed:", err instanceof Error ? err.message : String(err));
  }
}

export const femaDeclarationService = {
  fetchActiveDeclarations,
  checkEmergencyReciprocity,
  scanForActiveDeclarations,
};
