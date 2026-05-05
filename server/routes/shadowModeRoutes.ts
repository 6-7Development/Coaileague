/**
 * Shadow Mode Routes — Wave 23D
 * POST /api/support/shadow/start   → start impersonation session (Glass Break)
 * POST /api/support/shadow/action  → log an action within session
 * POST /api/support/shadow/end     → end impersonation session
 * GET  /api/support/shadow/active  → check for active session
 * GET  /api/support/shadow/history → view session history for a workspace
 *
 * Auth: platform role support_agent+ required for all routes
 * root_admin and sysop can access any workspace
 * support_agent requires explicit Glass Break justification
 */
import { Router, type Response } from "express";
import { requireAuth } from "../auth";
import { type AuthenticatedRequest } from "../rbac";
import {
  startShadowSession, endShadowSession, logShadowAction,
  getActiveShadowSession, requireGlassBreakJustification,
} from "../services/support/shadowModeService";
import { createLogger } from "../lib/logger";
import { pool } from "../db";

const log = createLogger("ShadowModeRoutes");
export const shadowModeRouter = Router();

// Require platform-level support role
function requirePlatformSupportRole(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
): void {
  const platformRole = (req.user as { platformRole?: string })?.platformRole;
  const allowed = ["root_admin", "deputy_admin", "sysop", "support_manager", "support_agent"];
  if (!platformRole || !allowed.includes(platformRole)) {
    res.status(403).json({ error: "Platform support role required" });
    return;
  }
  next();
}

// POST /start — begin Shadow Mode session
shadowModeRouter.post("/start",
  requireAuth, requirePlatformSupportRole, requireGlassBreakJustification,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { targetWorkspaceId, justification } = req.body;
      if (!targetWorkspaceId) return res.status(400).json({ error: "targetWorkspaceId required" });

      const result = await startShadowSession(
        req.user!.id,
        req.user!.email || "unknown@coaileague.ai",
        targetWorkspaceId,
        justification
      );

      return res.json({ success: true, ...result, shadowMode: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("JUSTIFICATION_REQUIRED")) return res.status(400).json({ error: msg });
      return res.status(500).json({ error: msg });
    }
  }
);

// POST /action — log a Glass Break action within session
shadowModeRouter.post("/action",
  requireAuth, requirePlatformSupportRole, requireGlassBreakJustification,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, action, entityType, entityId, justification, resultSummary } = req.body;
      if (!sessionId || !action) return res.status(400).json({ error: "sessionId and action required" });

      await logShadowAction(sessionId, {
        timestamp: new Date().toISOString(),
        action,
        entityType: entityType || "unknown",
        entityId: entityId || "unknown",
        justification,
        resultSummary: resultSummary || "",
      });

      return res.json({ success: true, logged: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(400).json({ error: msg });
    }
  }
);

// POST /end — end Shadow Mode session
shadowModeRouter.post("/end",
  requireAuth, requirePlatformSupportRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, targetWorkspaceId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });

      await endShadowSession(sessionId, req.user!.id, targetWorkspaceId || "");
      return res.json({ success: true, sessionEnded: true });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /active — check for active session in a workspace
shadowModeRouter.get("/active",
  requireAuth, requirePlatformSupportRole,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetWorkspaceId = String(req.query.workspaceId || "");
      const session = await getActiveShadowSession(req.user!.id, targetWorkspaceId);
      return res.json({ success: true, active: !!session, session });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /history — session history for a workspace (root/deputy only)
shadowModeRouter.get("/history",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const platformRole = (req.user as { platformRole?: string })?.platformRole;
      if (!["root_admin", "deputy_admin", "sysop"].includes(platformRole || "")) {
        return res.status(403).json({ error: "root_admin/deputy_admin/sysop required" });
      }
      const workspaceId = String(req.query.workspaceId || "");
      const result = await pool.query(
        `SELECT id, agent_id, agent_email, target_workspace_id, justification,
                started_at, ended_at, is_active,
                jsonb_array_length(actions) as action_count
         FROM support_sessions
         WHERE target_workspace_id = $1
         ORDER BY started_at DESC LIMIT 50`,
        [workspaceId]
      );
      return res.json({ success: true, sessions: result.rows });
    } catch (err: unknown) {
      return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);
