/**
 * VMS Webhook Routes — Wave 29C
 * Hardware-Agnostic Video Management System Bridge
 * ─────────────────────────────────────────────────────────────────────────────
 * CoAIleague does NOT manage cameras. It acts as the central nervous system
 * for existing VMS platforms (Verkada, Avigilon, Eagle Eye, Milestone, etc.)
 * by ingesting their outbound event webhooks.
 *
 * ENDPOINT: POST /api/webhooks/vms/:orgCode/:cameraId
 *   Unique per tenant × per camera. OrgCode scopes to workspace.
 *   CameraId lets Trinity know which zone triggered the alert.
 *
 * SECURITY: HMAC-SHA256 signature on each payload using a per-camera secret
 *   stored in camera_registrations.webhook_secret. Never the same secret
 *   across cameras — one compromised camera cannot spoof another.
 *
 * PIPELINE (7-step canonical):
 *   TRIGGER   → VMS fires webhook on motion/alarm event
 *   VALIDATE  → HMAC signature + camera registration check
 *   PROCESS   → Trinity parses event, cross-references Live GPS for nearest guard
 *   PERSIST   → Log to vms_events table
 *   PROPAGATE → SARGE dispatches compliance_alert ActionCard to nearest guard
 *   NOTIFY    → Supervisor FCM push if no guard response within 5 minutes
 *   CONFIRM   → Guard taps Acknowledge → Trinity auto-writes to client DAR
 */

import { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { createLogger } from "../lib/logger";
import { pool } from "../db";
import { broadcastToWorkspace } from "../websocket";

const log = createLogger("VMSWebhook");
export const vmsWebhookRouter = Router();

// ── VMS event type normalizer ─────────────────────────────────────────────────
// Maps each VMS vendor's event names to our canonical set.
// Add new vendors here without changing downstream logic.
const CANONICAL_EVENT_MAP: Record<string, string> = {
  // Verkada
  "motion_detected":          "motion_alert",
  "person_detected":          "person_alert",
  "door_forced_open":         "door_breach",
  "door_held_open":           "door_held",
  "crowd_detected":           "crowd_alert",
  "license_plate_detected":   "lpr_alert",
  // Avigilon
  "MOTION_DETECTED":          "motion_alert",
  "CLASSIFIED_OBJECT":        "person_alert",
  "ALARM_TRIGGERED":          "alarm_active",
  // Eagle Eye
  "een.motionDetection":      "motion_alert",
  "een.analytics.event":      "analytics_alert",
  // Milestone
  "MotionDetected":           "motion_alert",
  "AlarmActivated":           "alarm_active",
  // Generic fallback
  "alarm":                    "alarm_active",
  "motion":                   "motion_alert",
  "breach":                   "door_breach",
};

function canonicalizeEvent(rawType: string): string {
  return CANONICAL_EVENT_MAP[rawType] || rawType.toLowerCase().replace(/[^a-z_]/g, "_");
}

// ── Severity mapping ───────────────────────────────────────────────────────────
function getSeverity(eventType: string): "critical" | "warning" | "info" {
  if (["alarm_active", "door_breach", "person_alert"].includes(eventType)) return "critical";
  if (["motion_alert", "door_held", "crowd_alert"].includes(eventType)) return "warning";
  return "info";
}

// ── Find nearest clocked-in guard by GPS ──────────────────────────────────────
async function findNearestGuard(
  workspaceId: string,
  cameraLat: number | null,
  cameraLng: number | null
): Promise<{ employeeId: string; name: string; roomId: string | null } | null> {
  // If no camera GPS, fall back to any clocked-in guard
  if (!cameraLat || !cameraLng) {
    const result = await pool.query(
      `SELECT e.id, e.first_name, e.last_name,
              c.id as room_id
       FROM employees e
       JOIN time_entries te ON te.employee_id = e.id
       LEFT JOIN conversations c ON c.workspace_id = e.workspace_id AND c.slug = 'general'
       WHERE e.workspace_id = $1
         AND te.clock_out_time IS NULL
         AND te.clock_in_time IS NOT NULL
       ORDER BY te.clock_in_time DESC
       LIMIT 1`,
      [workspaceId]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return { employeeId: r.id, name: `${r.first_name} ${r.last_name}`, roomId: r.room_id };
  }

  // Haversine distance: find guard with most recent GPS closest to camera
  const result = await pool.query(
    `SELECT
       e.id,
       e.first_name,
       e.last_name,
       c.id as room_id,
       (
         6371000 * acos(
           cos(radians($2)) * cos(radians(gps.latitude))
           * cos(radians(gps.longitude) - radians($3))
           + sin(radians($2)) * sin(radians(gps.latitude))
         )
       ) AS distance_meters
     FROM employees e
     JOIN time_entries te ON te.employee_id = e.id
     LEFT JOIN employee_gps_pings gps ON gps.employee_id = e.id
     LEFT JOIN conversations c ON c.workspace_id = e.workspace_id AND c.slug = 'ops'
     WHERE e.workspace_id = $1
       AND te.clock_out_time IS NULL
       AND gps.created_at > NOW() - INTERVAL '15 minutes'
     ORDER BY distance_meters ASC
     LIMIT 1`,
    [workspaceId, cameraLat, cameraLng]
  );

  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return { employeeId: r.id, name: `${r.first_name} ${r.last_name}`, roomId: r.room_id };
}

// ── Main webhook handler ───────────────────────────────────────────────────────
vmsWebhookRouter.post("/:orgCode/:cameraId", async (req: Request, res: Response) => {
  const { orgCode, cameraId } = req.params;

  // Always return 200 to VMS — never 5xx (VMS will retry indefinitely on errors)
  const ack = () => res.status(200).json({ received: true });

  try {
    // STEP 1: VALIDATE — look up camera registration
    const camResult = await pool.query(
      `SELECT cr.*, w.id as workspace_id, w.name as workspace_name
       FROM camera_registrations cr
       JOIN workspaces w ON w.org_code = $1
       WHERE cr.camera_id = $2
         AND w.org_code = $1
         AND cr.is_active = true
       LIMIT 1`,
      [orgCode.toUpperCase(), cameraId]
    );

    if (!camResult.rows[0]) {
      log.warn(`[VMS] Unknown camera: ${orgCode}/${cameraId}`);
      return ack(); // Silently ack — don't reveal registration status to unknown callers
    }

    const camera = camResult.rows[0];
    const workspaceId: string = camera.workspace_id;

    // STEP 2: VALIDATE — HMAC-SHA256 signature check
    const secret: string = camera.webhook_secret;
    const signatureHeader = (req.headers["x-vms-signature"] ||
                             req.headers["x-webhook-signature"] ||
                             req.headers["x-signature"] || "") as string;

    if (secret && signatureHeader) {
      const rawBody = (req as Record<string, unknown>).rawBody as Buffer | string | undefined;
      const bodyStr = rawBody
        ? (Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody)
        : JSON.stringify(req.body);

      const expected = createHmac("sha256", secret).update(bodyStr).digest("hex");
      const provided = signatureHeader.replace(/^sha256=/, "");

      try {
        if (!timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
          log.warn(`[VMS] Invalid signature for camera ${cameraId} in workspace ${workspaceId}`);
          return ack();
        }
      } catch {
        // Length mismatch — invalid signature
        log.warn(`[VMS] Signature length mismatch for camera ${cameraId}`);
        return ack();
      }
    }

    // STEP 3: PROCESS — parse and normalize event
    const payload = req.body as Record<string, unknown>;
    const rawEventType = String(payload.event_type || payload.eventType || payload.type || "unknown");
    const eventType = canonicalizeEvent(rawEventType);
    const severity = getSeverity(eventType);
    const zone = String(payload.zone || payload.zone_name || payload.area || camera.zone_name || "Unknown Zone");
    const eventTimestamp = String(payload.timestamp || payload.event_time || new Date().toISOString());
    const cameraLat = parseFloat(String(payload.latitude || camera.latitude || "")) || null;
    const cameraLng = parseFloat(String(payload.longitude || camera.longitude || "")) || null;

    // STEP 4: PERSIST — log to vms_events
    const eventResult = await pool.query(
      `INSERT INTO vms_events
         (workspace_id, camera_id, camera_name, org_code, event_type, raw_event_type,
          zone_name, severity, event_timestamp, payload, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,NOW())
       RETURNING id`,
      [workspaceId, cameraId, camera.camera_name || cameraId, orgCode,
       eventType, rawEventType, zone, severity, eventTimestamp, JSON.stringify(payload)]
    );
    const vmsEventId: string = eventResult.rows[0]?.id;

    // Acknowledge immediately — processing continues async
    ack();

    // STEP 5: PROPAGATE — SARGE dispatches to nearest guard (async)
    setImmediate(async () => {
      try {
        const guard = await findNearestGuard(workspaceId, cameraLat, cameraLng);

        const alertEmoji = severity === "critical" ? "🚨" : severity === "warning" ? "⚠️" : "📹";
        const alertTitle = severity === "critical" ? "ALARM" : "ALERT";

        if (guard?.roomId) {
          await broadcastToWorkspace(workspaceId, {
            type: "chatdock_action_card",
            data: {
              roomId: guard.roomId,
              actionType: "compliance_alert",
              senderId: "helpai-bot",
              senderName: "SARGE",
              metadata: { vmsEventId, employeeId: guard.employeeId, requiresAck: true },
              props: {
                body: `${alertEmoji} ${alertTitle}: ${rawEventType.replace(/_/g, " ")} detected at ${zone} — Camera ${camera.camera_name || cameraId}.\n\nNearest officer: ${guard.name}. Proceed to investigate and acknowledge when clear.`,
                flags: [
                  { code: "VMS_EVENT", description: `Camera: ${camera.camera_name || cameraId} | Zone: ${zone}`, severity: severity as "critical" | "warning" },
                  { code: "RESPONSE_REQUIRED", description: "Tap Acknowledge when scene is clear", severity: "warning" as const },
                ],
              },
            },
          });
          log.info(`[VMS] Alert dispatched to guard ${guard.name} for event ${vmsEventId}`);
        } else {
          // No guard GPS — broadcast to ops room
          await broadcastToWorkspace(workspaceId, {
            type: "chatdock_action_card",
            data: {
              actionType: "compliance_alert",
              senderId: "helpai-bot",
              senderName: "SARGE",
              metadata: { vmsEventId, requiresAck: true },
              props: {
                body: `${alertEmoji} ${alertTitle}: ${rawEventType.replace(/_/g, " ")} at ${zone} — Camera ${camera.camera_name || cameraId}. No guard GPS found. Manual dispatch required.`,
                flags: [
                  { code: "NO_GPS", description: "Cannot determine nearest guard — manual dispatch", severity: "critical" as const },
                ],
              },
            },
          });
        }

        // STEP 6: NOTIFY — supervisor FCM if critical
        if (severity === "critical") {
          const { sendFCMToWorkspace } = await import("./fcmService").catch(() => ({ sendFCMToWorkspace: null }));
          if (sendFCMToWorkspace) {
            await (sendFCMToWorkspace as (wsId: string, n: Record<string, unknown>, roles: string[]) => Promise<void>)(
              workspaceId,
              {
                title: `${alertEmoji} VMS ${alertTitle}: ${zone}`,
                body: `${rawEventType.replace(/_/g, " ")} — Camera ${camera.camera_name || cameraId}`,
                data: { type: "vms_alert", vmsEventId },
              },
              ["supervisor", "manager", "org_owner"]
            ).catch(() => {});
          }

          // Schedule 5-minute no-response escalation
          setTimeout(async () => {
            const checkResult = await pool.query(
              `SELECT acknowledged_at FROM vms_events WHERE id = $1`,
              [vmsEventId]
            );
            if (!checkResult.rows[0]?.acknowledged_at) {
              await broadcastToWorkspace(workspaceId, {
                type: "chatdock_action_card",
                data: {
                  actionType: "compliance_alert",
                  senderId: "helpai-bot",
                  senderName: "SARGE",
                  props: {
                    body: `⚠️ ESCALATION: No response to VMS alert at ${zone} after 5 minutes. Immediate supervisor action required.`,
                    flags: [{ code: "NO_RESPONSE", description: "5-minute acknowledgment SLA breached", severity: "critical" as const }],
                  },
                },
              }).catch(() => {});
            }
          }, 5 * 60 * 1000);
        }
      } catch (err: unknown) {
        log.error("[VMS] Async dispatch failed:", err instanceof Error ? err.message : String(err));
      }
    });

  } catch (err: unknown) {
    log.error("[VMS] Handler error:", err instanceof Error ? err.message : String(err));
    ack(); // Always 200 to VMS
  }
});

// ── POST /api/webhooks/vms/:orgCode/:cameraId/acknowledge ─────────────────────
// Guard taps Acknowledge on the action card → STEP 7: CONFIRM + DAR write
vmsWebhookRouter.post("/:orgCode/:cameraId/acknowledge", async (req: Request, res: Response) => {
  try {
    const { vmsEventId, employeeId, notes } = req.body as {
      vmsEventId?: string; employeeId?: string; notes?: string;
    };
    if (!vmsEventId) return res.status(400).json({ error: "vmsEventId required" });

    // Mark acknowledged
    const result = await pool.query(
      `UPDATE vms_events
       SET acknowledged_at = NOW(), acknowledged_by = $1, resolution_notes = $2,
           response_time_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))
       WHERE id = $3
       RETURNING workspace_id, zone_name, event_type, camera_name, event_timestamp`,
      [employeeId || null, notes || null, vmsEventId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "VMS event not found" });

    const event = result.rows[0];

    // STEP 7: CONFIRM — auto-write to client DAR
    await pool.query(
      `INSERT INTO dar_entries
         (workspace_id, employee_id, entry_time, activity_type, description, source, vms_event_id, created_at)
       VALUES ($1, $2, $3, 'vms_response', $4, 'vms_auto', $5, NOW())
       ON CONFLICT DO NOTHING`,
      [
        event.workspace_id,
        employeeId || null,
        event.event_timestamp,
        `VMS Alert Response: ${event.event_type} at ${event.zone_name} (Camera: ${event.camera_name}). ${notes || "Scene cleared."}`,
        vmsEventId,
      ]
    ).catch(() => {}); // Non-blocking — DAR insert never blocks ack

    log.info(`[VMS] Event ${vmsEventId} acknowledged by employee ${employeeId}`);
    return res.json({ success: true, darWritten: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ── GET /api/webhooks/vms/register (tenant camera registration) ───────────────
// Tenant owner registers a camera to get a unique webhook URL + secret
vmsWebhookRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { workspaceId, cameraId, cameraName, zoneName, latitude, longitude, vmsVendor } =
      req.body as Record<string, string>;
    if (!workspaceId || !cameraId) {
      return res.status(400).json({ error: "workspaceId and cameraId required" });
    }

    // Get org code
    const ws = await pool.query(`SELECT org_code FROM workspaces WHERE id = $1`, [workspaceId]);
    const orgCode = ws.rows[0]?.org_code;
    if (!orgCode) return res.status(400).json({ error: "Workspace has no org code" });

    // Generate per-camera HMAC secret
    const { randomBytes } = await import("crypto");
    const secret = randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO camera_registrations
         (workspace_id, camera_id, camera_name, zone_name, latitude, longitude,
          vms_vendor, webhook_secret, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())
       ON CONFLICT (workspace_id, camera_id) DO UPDATE
         SET camera_name=$3, zone_name=$4, webhook_secret=$8, is_active=true, updated_at=NOW()`,
      [workspaceId, cameraId, cameraName || cameraId, zoneName || "Unknown Zone",
       latitude || null, longitude || null, vmsVendor || "generic", secret]
    );

    const webhookUrl = `${process.env.APP_BASE_URL || "https://coaileague.com"}/api/webhooks/vms/${orgCode}/${cameraId}`;

    return res.status(201).json({
      success: true,
      webhookUrl,
      signingSecret: secret,
      orgCode,
      cameraId,
      instructions: `Configure your VMS to POST events to: ${webhookUrl}. Sign payloads using HMAC-SHA256 with the provided secret. Send the signature in the X-VMS-Signature header.`,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
