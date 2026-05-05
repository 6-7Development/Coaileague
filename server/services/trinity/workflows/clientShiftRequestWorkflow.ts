/**
 * Client Shift Request Workflow — Wave 23
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridges the gap between:
 *   workRequestParser.ts (parses inbound email)  ← already exists
 *   trinityShiftOfferService (backfill SMS)       ← already exists
 *
 * What was missing: the stitching between parse → create shift → offer → confirm.
 *
 * Pipeline:
 *   1. Parsed email arrives (ParsedWorkRequest from workRequestParser)
 *   2. Match email sender to workspace.clients record
 *   3. Create draft shift with parsed details
 *   4. Send shift offers to qualified officers (backfill SMS)
 *   5. Flag owner for billing confirmation
 *   6. On first YES → confirm client via email
 */

import { pool } from "../../db";
import { createLogger } from "../../lib/logger";
import { broadcastToWorkspace } from "../../websocket";
import type { ParsedWorkRequest } from "../trinityStaffing/workRequestParser";

const log = createLogger("ClientShiftRequestWorkflow");

export interface ClientShiftWorkflowResult {
  success: boolean;
  shiftId: string | null;
  clientId: string | null;
  offersSent: number;
  message: string;
}

export async function executeClientShiftRequestWorkflow(
  workspaceId: string,
  parsed: ParsedWorkRequest
): Promise<ClientShiftWorkflowResult> {
  log.info(`[ClientShiftRequest] Processing request from ${parsed.clientInfo.email}`);

  // STEP 1: Match email → client record
  const clientRow = await pool.query(
    `SELECT id, name, billing_rate FROM clients
     WHERE workspace_id = $1 AND (
       contact_email ILIKE $2 OR billing_email ILIKE $2 OR name ILIKE $3
     ) LIMIT 1`,
    [workspaceId, parsed.clientInfo.email, `%${parsed.clientInfo.companyName || ""}%`]
  );
  const clientId: string | null = clientRow.rows[0]?.id || null;
  const clientName = clientRow.rows[0]?.name || parsed.clientInfo.companyName || "Unknown Client";
  const billRate = clientRow.rows[0]?.billing_rate || null;

  // STEP 2: Create draft shift
  const shiftResult = await pool.query(
    `INSERT INTO shifts
       (workspace_id, client_id, title, start_time, end_time,
        status, ai_generated, bill_rate, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'draft', true, $6, $7, NOW(), NOW())
     RETURNING id`,
    [
      workspaceId,
      clientId,
      `${parsed.positionType === "armed" ? "Armed" : "Unarmed"} Security — ${clientName}`,
      new Date(`${parsed.requestedDate.toISOString().split("T")[0]}T${parsed.startTime}:00`),
      new Date(`${parsed.requestedDate.toISOString().split("T")[0]}T${parsed.endTime}:00`),
      billRate,
      parsed.notes || parsed.specialRequirements.join(", ") || null,
    ]
  );
  const shiftId: string = shiftResult.rows[0]?.id;
  if (!shiftId) return { success: false, shiftId: null, clientId, offersSent: 0, message: "Failed to create shift" };

  // STEP 3: Send shift offers to qualified officers
  let offersSent = 0;
  try {
    const { sendShiftOffers } = await import("../trinityVoice/trinityShiftOfferService");
    const offerResult = await sendShiftOffers(workspaceId, shiftId, parsed.guardsNeeded);
    offersSent = offerResult?.offersSent || 0;
  } catch (offerErr: unknown) {
    log.warn("[ClientShiftRequest] Offer send non-fatal:", offerErr instanceof Error ? offerErr.message : String(offerErr));
  }

  // STEP 4: Flag owner for billing
  await broadcastToWorkspace(workspaceId, {
    type: "client_shift_request_received",
    data: {
      shiftId,
      clientName,
      clientEmail: parsed.clientInfo.email,
      requestedDate: parsed.requestedDate.toISOString(),
      guardsNeeded: parsed.guardsNeeded,
      positionType: parsed.positionType,
      urgency: parsed.urgency,
      offersSent,
      message: `📋 New client request: ${clientName} needs ${parsed.guardsNeeded} ${parsed.positionType} officer(s) on ${parsed.requestedDate.toLocaleDateString()}. ${offersSent} officers notified.`,
    },
  }).catch(() => {});

  // STEP 5: Owner notification
  await pool.query(
    `INSERT INTO notifications
       (workspace_id, title, message, notification_type, priority, metadata, created_at)
     SELECT $1,
       'New Client Shift Request',
       $2, 'system', $3, $4::jsonb, NOW()
     FROM users WHERE workspace_id = $1 AND role IN ('owner', 'super_admin') LIMIT 1
     ON CONFLICT DO NOTHING`,
    [
      workspaceId,
      `${clientName} needs ${parsed.guardsNeeded} officer(s) on ${parsed.requestedDate.toLocaleDateString()}. Review and confirm billing rate.`,
      parsed.urgency === "critical" ? "urgent" : "high",
      JSON.stringify({ shiftId, clientId, billRate }),
    ]
  ).catch(() => {});

  log.info(`[ClientShiftRequest] Shift ${shiftId} created, ${offersSent} offers sent`);

  return {
    success: true,
    shiftId,
    clientId,
    offersSent,
    message: `Shift created for ${clientName}. ${offersSent} officers notified for ${parsed.requestedDate.toLocaleDateString()}.`,
  };
}
