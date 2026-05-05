/**
 * PTT Seat Management Routes — per-seat billing for Push-to-Talk
 * Mounted at: /api/billing/ptt-seats
 *
 * PTT seats work identically to email seats:
 *   - Tenant owner activates a seat for an officer → Stripe sync fires immediately
 *   - Seat includes 300 min/month; overage at $0.02/min
 *   - Deactivation removes from billing immediately (Stripe sync)
 *   - WebSocket broadcast on every change so UI updates without refresh
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { requireManager, type AuthenticatedRequest } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { createLogger } from "../lib/logger";
import { pool } from "../db";
import { broadcastToWorkspace } from "../websocket";
import { PTT_PRICING } from "@shared/billingConfig";

const log = createLogger("PttSeatRoutes");
export const pttSeatRouter = Router();

// ── GET /api/billing/ptt-seats — list all PTT seats for workspace ─────────────
pttSeatRouter.get("/",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req;
      const seats = await pool.query(
        `SELECT ps.*, e.first_name, e.last_name, e.email as employee_email,
                e.guard_card_number, e.role_title
         FROM ptt_seats ps
         JOIN employees e ON e.id = ps.employee_id
         WHERE ps.workspace_id = $1
         ORDER BY ps.is_active DESC, e.last_name`,
        [workspaceId]
      );

      const activeCount = seats.rows.filter(s => s.is_active).length;
      return res.json({
        seats: seats.rows,
        summary: {
          totalSeats: seats.rows.length,
          activeSeats: activeCount,
          monthlyCostCents: activeCount * PTT_PRICING.perSeatMonthlyCents,
          perSeatMonthlyCents: PTT_PRICING.perSeatMonthlyCents,
          minutesIncludedPerSeat: PTT_PRICING.minutesIncludedPerSeat,
        },
      });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── POST /api/billing/ptt-seats/activate/:employeeId ─────────────────────────
pttSeatRouter.post("/activate/:employeeId",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req;
      const { employeeId } = req.params;

      // Verify employee belongs to workspace
      const emp = await pool.query(
        `SELECT id, first_name, last_name FROM employees WHERE id = $1 AND workspace_id = $2`,
        [employeeId, workspaceId]
      );
      if (!emp.rows[0]) return res.status(404).json({ error: "Employee not found" });

      const employee = emp.rows[0];

      // Upsert PTT seat
      const result = await pool.query(
        `INSERT INTO ptt_seats (workspace_id, employee_id, is_active, activated_at, activated_by)
         VALUES ($1, $2, true, NOW(), $3)
         ON CONFLICT (workspace_id, employee_id) DO UPDATE
           SET is_active = true, activated_at = NOW(), activated_by = $3, deactivated_at = NULL
         RETURNING id`,
        [workspaceId, employeeId, req.user!.id]
      );

      // Sync Stripe immediately
      await syncPttStripe(workspaceId).catch(err =>
        log.warn("[PttSeats] Stripe sync failed (non-fatal):", err.message)
      );

      // Broadcast immediately — UI updates without refresh
      await broadcastToWorkspace(workspaceId, {
        type: "ptt_seat_changed",
        data: {
          action: "activated",
          employeeId,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          seatId: result.rows[0]?.id,
          monthlyCostCents: PTT_PRICING.perSeatMonthlyCents,
        },
      }).catch(() => {});

      log.info(`[PttSeats] Activated PTT seat for employee ${employeeId} in workspace ${workspaceId}`);
      return res.json({
        success: true,
        employeeId,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        monthlyCostCents: PTT_PRICING.perSeatMonthlyCents,
      });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── POST /api/billing/ptt-seats/deactivate/:employeeId ───────────────────────
pttSeatRouter.post("/deactivate/:employeeId",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { workspaceId } = req;
      const { employeeId } = req.params;

      await pool.query(
        `UPDATE ptt_seats SET is_active = false, deactivated_at = NOW()
         WHERE workspace_id = $1 AND employee_id = $2`,
        [workspaceId, employeeId]
      );

      // Sync Stripe immediately
      await syncPttStripe(workspaceId).catch(err =>
        log.warn("[PttSeats] Stripe sync failed (non-fatal):", err.message)
      );

      // Broadcast immediately
      await broadcastToWorkspace(workspaceId, {
        type: "ptt_seat_changed",
        data: { action: "deactivated", employeeId },
      }).catch(() => {});

      log.info(`[PttSeats] Deactivated PTT seat for ${employeeId}`);
      return res.json({ success: true, employeeId });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ── Stripe sync helper ────────────────────────────────────────────────────────
async function syncPttStripe(workspaceId: string): Promise<void> {
  const count = await pool.query(
    `SELECT COUNT(*) FROM ptt_seats WHERE workspace_id = $1 AND is_active = true`,
    [workspaceId]
  );
  const activeSeats = parseInt(String(count.rows[0]?.count || "0"));
  const { subscriptionManager } = await import("../services/billing/subscriptionManager");
  await subscriptionManager.updateMeteredSeats(
    workspaceId,
    activeSeats,
    process.env.STRIPE_PTT_SEAT_PRICE_ID
  );
}
