/**
 * Railway Deploy Webhook — Wave 24
 * POST /api/webhooks/railway-deploy
 * Railway calls this after successful deployment to production.
 * Trinity announces the deployment in every #trinity-command room.
 *
 * Configure in Railway: Settings → Webhooks → Add Webhook
 * URL: https://coaileague.com/api/webhooks/railway-deploy
 * Secret: RAILWAY_WEBHOOK_SECRET env var
 */
import { Router, type Request, type Response } from "express";
import { createLogger } from "../lib/logger";
import { broadcastToWorkspace } from "../websocket";
import { pool } from "../db";

const log = createLogger("RailwayDeployWebhook");
export const railwayWebhookRouter = Router();

railwayWebhookRouter.post("/railway-deploy", async (req: Request, res: Response) => {
  try {
    // Verify webhook secret
    const secret = req.headers["x-railway-signature"] || req.headers["authorization"];
    const expectedSecret = process.env.RAILWAY_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret && secret !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const payload = req.body as {
      status?: string;
      deploymentId?: string;
      environmentName?: string;
      commitMessage?: string;
      commitSha?: string;
    };

    const isSuccess = !payload.status || payload.status === "SUCCESS" || payload.status === "COMPLETE";
    const env = payload.environmentName || "production";
    const commitMsg = payload.commitMessage || "deployment";
    const sha = payload.commitSha?.slice(0, 7) || "unknown";

    log.info(`[RailwayWebhook] Deploy ${isSuccess ? "SUCCESS" : "FAILED"} — ${env} — ${sha}`);

    // Find all trinity-command rooms across active workspaces
    const rooms = await pool.query(
      `SELECT c.workspace_id, c.id as room_id
       FROM conversations c
       JOIN workspaces w ON w.id = c.workspace_id
       WHERE c.slug = 'trinity-command'
       AND w.subscription_status IN ('active', 'trial')
       LIMIT 50`
    );

    const message = isSuccess
      ? `✅ **Deployed to ${env}** — ${new Date().toLocaleTimeString()} UTC\n` +
        `Commit: ${sha} — ${String(commitMsg).slice(0, 80)}\n` +
        `All systems operational. /dream-status to see what Trinity reflected on overnight.`
      : `❌ **Deployment FAILED** — ${env}\n` +
        `Commit: ${sha} — ${String(commitMsg).slice(0, 80)}\n` +
        `Trinity is investigating. 3-Strike Rule is active.`;

    // Broadcast to all trinity-command rooms
    const broadcasts = rooms.rows.map(row =>
      broadcastToWorkspace(String(row.workspace_id), {
        type: "chatdock_action_card",
        data: {
          roomId: String(row.room_id),
          actionType: isSuccess ? "shift_fill" : "compliance_alert",
          senderId: "helpai-bot",
          senderName: "SARGE",
          props: {
            body: message,
            ...(isSuccess ? {} : {
              flags: [{ code: "deploy_failed", description: "Check Railway logs", severity: "critical" }],
            }),
          },
        },
      }).catch(() => {})
    );

    await Promise.allSettled(broadcasts);
    return res.json({ success: true, workspacesNotified: rooms.rows.length });
  } catch (err: unknown) {
    log.error("[RailwayWebhook]", err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
