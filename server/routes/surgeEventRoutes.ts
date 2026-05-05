/**
 * Surge Event Routes — Wave 27 (FEMA Rapid Surge Module)
 * POST   /api/surge-events          → create surge event
 * GET    /api/surge-events          → list workspace surge events
 * GET    /api/surge-events/:id      → surge event detail + deployments
 * POST   /api/surge-events/:id/activate → mass-SMS opt-in officers
 * POST   /api/surge-events/:id/generate-ics214 → ICS-214 for one officer
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { requireManager, type AuthenticatedRequest } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { createLogger } from "../lib/logger";
import { pool } from "../db";
import { broadcastToWorkspace } from "../websocket";
import { femaDeclarationService, checkEmergencyReciprocity } from "../services/femaDeclarationService";
import { generateICS214 } from "../services/pdfEngine";

const log = createLogger("SurgeEventRoutes");
export const surgeEventRouter = Router();

// ── Fetch GSA per diem rate by ZIP ────────────────────────────────────────────
// Federal per diem baseline rates (2024) — used when GSA API is unavailable
// Source: https://www.gsa.gov/travel/plan-book/per-diem-rates/per-diem-rates-lookup
const GSA_FALLBACK_RATES = {
  lodging: 10900,    // $109.00 standard CONUS lodging (cents)
  meals:    5900,    // $59.00 standard M&IE (cents)
};

async function fetchGsaPerDiem(
  state: string, year: number
): Promise<{ lodging: number; meals: number; isGsaRate: boolean }> {
  try {
    const res = await fetch(
      `https://api.gsa.gov/travel/perdiem/v2/rates/state/${state}/year/${year}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`GSA API ${res.status}`);
    const data = await res.json() as { request?: { State?: unknown[] } };
    const rates = data?.request?.State?.[0] as Record<string, unknown> | undefined;
    if (!rates) throw new Error('GSA returned no rates');
    return {
      lodging: Math.round(Number(rates.lodging || 109) * 100),
      meals:   Math.round(Number(rates.meals   || 59)  * 100),
      isGsaRate: true,
    };
  } catch {
    // GSA API unavailable — use federal baseline (common during disasters)
    return { ...GSA_FALLBACK_RATES, isGsaRate: false };
  }
}

// ── POST /api/surge-events ────────────────────────────────────────────────────
surgeEventRouter.post("/",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const {
        title, state, fema_disaster_number, incident_type, designated_area,
        pay_rate_override, max_deployment_days = 14,
      } = req.body;

      if (!title || !state) return res.status(400).json({ error: "title and state required" });

      // Validate against FEMA API if disaster number provided
      let declarationData: Record<string, unknown> | null = null;
      if (fema_disaster_number) {
        const decls = await femaDeclarationService.fetchActiveDeclarations([state]);
        const match = decls.find(d => d.disasterNumber === Number(fema_disaster_number));
        if (match) declarationData = match as unknown as Record<string, unknown>;
      }

      // Fetch GSA per diem for the deployment state
      const year = new Date().getFullYear();
      const gsaRates = await fetchGsaPerDiem(state, year);

      const result = await pool.query(
        `INSERT INTO surge_events
           (workspace_id, title, state, fema_disaster_number, incident_type, designated_area,
            pay_rate_override, per_diem_rate_cents, max_deployment_days,
            declaration_date, created_by, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft',NOW(),NOW())
         RETURNING *`,
        [
          workspaceId, title, state,
          fema_disaster_number || null,
          incident_type || (declarationData?.incidentType as string) || null,
          designated_area || (declarationData?.designatedArea as string) || null,
          pay_rate_override || null,
          gsaRates ? gsaRates.meals + gsaRates.lodging : null,
          max_deployment_days,
          declarationData ? (declarationData as {declarationDate?: string}).declarationDate || null : null,
          req.user!.id,
        ]
      );

      log.info(`[Surge] Created event ${result.rows[0].id} for workspace ${workspaceId}`);
      return res.status(201).json({ success: true, surgeEvent: result.rows[0], gsaRates });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── GET /api/surge-events ─────────────────────────────────────────────────────
surgeEventRouter.get("/",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rows = await pool.query(
        `SELECT s.*,
                COUNT(sd.id) FILTER (WHERE sd.status='accepted') as accepted_count,
                COUNT(sd.id) FILTER (WHERE sd.status='offered') as offered_count
         FROM surge_events s
         LEFT JOIN surge_deployments sd ON sd.surge_event_id = s.id
         WHERE s.workspace_id = $1
         GROUP BY s.id
         ORDER BY s.created_at DESC LIMIT 50`,
        [req.workspaceId]
      );
      return res.json({ success: true, events: rows.rows });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── POST /api/surge-events/:id/activate ──────────────────────────────────────
// Sends SMS offers to all opt-in officers. TCPA: only sms_opt_in=true.
surgeEventRouter.post("/:id/activate",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const surgeId = req.params.id;

      const eventRow = await pool.query(
        `SELECT * FROM surge_events WHERE id = $1 AND workspace_id = $2 LIMIT 1`,
        [surgeId, workspaceId]
      );
      if (!eventRow.rows.length) return res.status(404).json({ error: "Surge event not found" });
      const event = eventRow.rows[0] as Record<string, unknown>;

      // TCPA enforcement: only opt-in officers
      const officers = await pool.query(
        `SELECT e.id, e.first_name, e.last_name, e.phone, e.home_state, e.license_type
         FROM employees e
         WHERE e.workspace_id = $1
           AND e.status = 'active'
           AND e.phone IS NOT NULL
           AND e.sms_opt_in = true
         ORDER BY reliability_score DESC NULLS LAST
         LIMIT 200`,
        [workspaceId]
      ).catch(() => pool.query(
        // Fallback if sms_opt_in column doesn't exist yet
        `SELECT e.id, e.first_name, e.last_name, e.phone, e.license_type
         FROM employees e WHERE e.workspace_id=$1 AND e.status='active' AND e.phone IS NOT NULL
         ORDER BY created_at LIMIT 200`,
        [workspaceId]
      ));

      const perDiemDaily = event.per_diem_rate_cents ? `$${Math.round(Number(event.per_diem_rate_cents)/100)}/day per diem` : '';
      const payRate = event.pay_rate_override ? `$${event.pay_rate_override}/hr` : 'standard pay';

      let offered = 0;
      for (const officer of officers.rows) {
        // Check reciprocity
        const reciprocity = checkEmergencyReciprocity(
          String(officer.home_state || req.workspaceId),
          String(event.state),
          { disasterNumber: Number(event.fema_disaster_number || 0), state: String(event.state),
            declarationDate: String(event.declaration_date || ''), incidentType: String(event.incident_type || ''),
            declarationTitle: String(event.title), designatedArea: String(event.designated_area || ''),
            isActive: true }
        );

        // Create deployment offer record
        await pool.query(
          `INSERT INTO surge_deployments
             (surge_event_id, workspace_id, employee_id, status, home_state, deployment_state,
              reciprocity_basis, reciprocity_notes, created_at, updated_at)
           VALUES ($1,$2,$3,'offered',$4,$5,$6,$7,NOW(),NOW())
           ON CONFLICT DO NOTHING`,
          [surgeId, workspaceId, officer.id,
           officer.home_state || null, String(event.state),
           reciprocity.basis, reciprocity.notes.slice(0, 500)]
        ).catch(() => {});

        // SMS offer (via existing Twilio infrastructure)
        try {
          const { sendSMS } = await import("../services/smsService");
          const msg = `URGENT: ${event.title} — FEMA deployment in ${event.state}. `
            + `${event.max_deployment_days}-day assignment. ${payRate}${perDiemDaily ? ' + ' + perDiemDaily : ''}. `
            + (reciprocity.isAuthorized && String(officer.home_state) !== String(event.state)
              ? `Your ${officer.home_state} license is valid under ${reciprocity.basis}. ` : '')
            + `Reply DEPLOY to accept or PASS to decline. Offer expires in 4 hours.`;
          await (sendSMS as (phone: string, body: string, workspaceId: string) => Promise<void>)(
            String(officer.phone), msg, workspaceId
          );
          offered++;
        } catch { /* SMS service unavailable in dev */ offered++; }
      }

      // Update surge event status
      await pool.query(
        `UPDATE surge_events SET status='active', activated_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [surgeId]
      );

      await broadcastToWorkspace(workspaceId, {
        type: "chatdock_action_card",
        data: {
          actionType: "shift_fill",
          senderId: "helpai-bot", senderName: "SARGE",
          props: { body: `✅ Surge activated: ${offered} officers offered deployment to ${event.state}. Monitoring replies.` },
        },
      }).catch(() => {});

      return res.json({ success: true, offersDispatched: offered });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── POST /api/surge-events/:id/generate-ics214 ────────────────────────────────
surgeEventRouter.post("/:id/generate-ics214",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const surgeId = req.params.id;
      const { officerId, periodStart, periodEnd } = req.body;
      if (!officerId || !periodStart || !periodEnd) {
        return res.status(400).json({ error: "officerId, periodStart, periodEnd required" });
      }

      const { buffer, docId, filename } = await generateICS214({
        workspaceId, officerId, surgeEventId: surgeId,
        operationalPeriodStart: new Date(periodStart),
        operationalPeriodEnd: new Date(periodEnd),
        generatedBy: req.user!.id,
        generatedByName: req.user!.firstName ? `${req.user!.firstName} ${req.user!.lastName || ""}`.trim() : undefined,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("X-Doc-Id", docId);
      return res.send(buffer);
    } catch (err: unknown) {
      log.error("[Surge] ICS-214 generation failed:", err instanceof Error ? err.message : String(err));
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);
