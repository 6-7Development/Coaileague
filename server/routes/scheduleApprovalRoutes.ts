/**
 * Schedule Approval Routes — Wave 23
 * GET  /api/schedule-approval/pending  → count of draft AI shifts awaiting owner
 * POST /api/schedule-approval/approve  → owner publishes all/specific draft shifts
 * POST /api/schedule-approval/reject   → reject specific draft shifts
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { type AuthenticatedRequest, requireManager } from "../rbac";
import { ensureWorkspaceAccess } from "../middleware/workspaceScope";
import { pool } from "../db";
import { broadcastToWorkspace } from "../websocket";
import { createLogger } from "../lib/logger";

const log = createLogger("ScheduleApproval");
export const scheduleApprovalRouter = Router();

// GET /api/schedule-approval/pending
scheduleApprovalRouter.get("/pending",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const result = await pool.query(
        `SELECT
           COUNT(*)::int AS pending_count,
           MIN(start_time) AS earliest_shift,
           MAX(start_time) AS latest_shift,
           ROUND(AVG(COALESCE(ai_confidence_score::float, 0))::numeric, 2) AS avg_confidence,
           COUNT(*) FILTER (WHERE COALESCE(ai_confidence_score::float, 0) < 0.7)::int AS low_confidence_count
         FROM shifts
         WHERE workspace_id = $1 AND status = 'draft' AND ai_generated = true`,
        [workspaceId]
      );
      return res.json({ success: true, ...result.rows[0] });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// POST /api/schedule-approval/approve
scheduleApprovalRouter.post("/approve",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { scheduleId, shiftIds } = req.body;

      let query: string;
      let params: unknown[];

      if (shiftIds?.length) {
        // Approve specific shifts
        query = `UPDATE shifts SET status = 'published', updated_at = NOW()
                 WHERE workspace_id = $1 AND id = ANY($2::text[]) AND status = 'draft'
                 RETURNING id`;
        params = [workspaceId, shiftIds];
      } else if (scheduleId) {
        query = `UPDATE shifts SET status = 'published', updated_at = NOW()
                 WHERE workspace_id = $1 AND schedule_id = $2 AND status = 'draft'
                 RETURNING id`;
        params = [workspaceId, scheduleId];
      } else {
        // Approve all pending AI drafts
        query = `UPDATE shifts SET status = 'published', updated_at = NOW()
                 WHERE workspace_id = $1 AND status = 'draft' AND ai_generated = true
                 RETURNING id`;
        params = [workspaceId];
      }

      const result = await pool.query(query, params);
      const publishedCount = result.rowCount || 0;

      // Broadcast to workspace - ChatDock, dashboard widgets, officer apps
      await broadcastToWorkspace(workspaceId, {
        type: "schedule_published",
        data: {
          publishedCount,
          approvedBy: req.user?.id,
          message: `${publishedCount} shifts published. Officers will be notified.`,
        },
      }).catch(() => {});

      log.info(`[ScheduleApproval] ${publishedCount} shifts published for ${workspaceId}`);
      return res.json({ success: true, publishedCount });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// POST /api/schedule-approval/reject
scheduleApprovalRouter.post("/reject",
  requireAuth, ensureWorkspaceAccess, requireManager,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId!;
      const { shiftIds, reason } = req.body;
      if (!shiftIds?.length) return res.status(400).json({ error: "shiftIds required" });

      const result = await pool.query(
        `UPDATE shifts SET status = 'cancelled', denial_reason = $3, updated_at = NOW()
         WHERE workspace_id = $1 AND id = ANY($2::text[]) AND status = 'draft'
         RETURNING id`,
        [workspaceId, shiftIds, reason || "Rejected by owner during review"]
      );

      return res.json({ success: true, rejectedCount: result.rowCount || 0 });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
);
