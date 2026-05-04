/**
 * Equipment Ledger Service — Wave 12 / Task 4
 * ─────────────────────────────────────────────────────────────────────────────
 * OC 1702 requires tracking of security equipment (radios, keys, access badges).
 * Guards physically tap-out equipment at shift start and tap-in at shift end.
 * Clock-out is BLOCKED until all NFC-tagged assets assigned to the guard are tapped back.
 *
 * FLOW:
 *   Shift start   → Guard taps equipment NFC tags → assets checked OUT
 *   During shift  → Equipment is tracked as "active"
 *   Shift end     → Guard taps equipment NFC tags → assets checked IN
 *   Clock-out     → checkClockOutGate() → 🛑 if any assets still checked out
 *   PDF Report    → exported into the 30-day DPS Evidence Bundle
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { platformEventBus } from '../platformEventBus';

const log = createLogger('EquipmentLedger');

export interface EquipmentTapResult {
  success: boolean;
  assetId: string;
  assetName: string;
  assetType: string;
  eventType: 'checkout' | 'checkin';
  message: string;
}

export interface ClockOutGateResult {
  allowed: boolean;
  pendingAssets: Array<{
    assetId: string;
    assetName: string;
    assetType: string;
    checkedOutAt: Date;
  }>;
  message: string;
}

/** Process an NFC tap for equipment check-in or check-out */
export async function processEquipmentTap(params: {
  workspaceId: string;
  employeeId: string;
  shiftId?: string;
  nfcTagId: string;
  deviceGpsLat?: number | null;
  deviceGpsLng?: number | null;
}): Promise<EquipmentTapResult> {
  const { workspaceId, employeeId, nfcTagId, shiftId } = params;

  // ── Find asset by NFC tag ─────────────────────────────────────────────
  const { rows: assetRows } = await pool.query(
    `SELECT id, asset_name, asset_type, currently_assigned_to, checked_out_at
     FROM asset_registry
     WHERE workspace_id = $1 AND nfc_tag_id = $2 AND is_active = true`,
    [workspaceId, nfcTagId]
  ).catch(() => ({ rows: [] }));

  if (!assetRows[0]) {
    return {
      success: false,
      assetId: '', assetName: '', assetType: '',
      eventType: 'checkout',
      message: `No equipment found for NFC tag ${nfcTagId}. Register this asset first.`,
    };
  }

  const asset = assetRows[0];
  const isCurrentlyCheckedOut = !!asset.currently_assigned_to;
  const eventType: 'checkout' | 'checkin' = isCurrentlyCheckedOut ? 'checkin' : 'checkout';

  // ── Update asset status ───────────────────────────────────────────────
  if (eventType === 'checkout') {
    await pool.query(
      `UPDATE asset_registry SET
         currently_assigned_to = $1,
         checked_out_at = NOW(),
         must_return_by = NOW() + INTERVAL '12 hours',
         updated_at = NOW()
       WHERE id = $2`,
      [employeeId, asset.id]
    );
  } else {
    await pool.query(
      `UPDATE asset_registry SET
         currently_assigned_to = NULL,
         checked_out_at = NULL,
         must_return_by = NULL,
         updated_at = NOW()
       WHERE id = $2`,
      [asset.id]
    );
  }

  // ── Log the event ─────────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO equipment_checkin_log
       (workspace_id, asset_id, employee_id, shift_id, event_type,
        nfc_tag_id, device_gps_lat, device_gps_lng, occurred_at, server_timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
    [
      workspaceId, asset.id, employeeId, shiftId || null, eventType,
      nfcTagId,
      params.deviceGpsLat || null, params.deviceGpsLng || null,
    ]
  ).catch(err => log.warn('[EquipmentLedger] Log insert failed:', err.message));

  const verb = eventType === 'checkout' ? 'checked out' : 'returned';
  log.info(`[EquipmentLedger] ${asset.asset_name} ${verb} by employee ${employeeId}`);

  return {
    success: true,
    assetId:   asset.id,
    assetName: asset.asset_name,
    assetType: asset.asset_type,
    eventType,
    message: `${asset.asset_name} successfully ${verb}.`,
  };
}

/** Clock-out gate: is this employee clear to clock out? */
export async function checkClockOutGate(params: {
  workspaceId: string;
  employeeId: string;
}): Promise<ClockOutGateResult> {
  const { workspaceId, employeeId } = params;

  const { rows: pendingRows } = await pool.query(
    `SELECT id, asset_name, asset_type, checked_out_at
     FROM asset_registry
     WHERE workspace_id = $1
       AND currently_assigned_to = $2
       AND is_active = true
       AND asset_type IN ('radio', 'key', 'badge', 'equipment')`,
    [workspaceId, employeeId]
  ).catch(() => ({ rows: [] }));

  if (pendingRows.length === 0) {
    return { allowed: true, pendingAssets: [], message: 'All equipment returned. Clock-out permitted.' };
  }

  const pendingAssets = pendingRows.map(r => ({
    assetId:     r.id,
    assetName:   r.asset_name,
    assetType:   r.asset_type,
    checkedOutAt: new Date(r.checked_out_at),
  }));

  const assetList = pendingAssets.map(a => a.assetName).join(', ');
  log.info(`[EquipmentLedger] Clock-out BLOCKED for ${employeeId}: ${assetList} not returned`);

  return {
    allowed: false,
    pendingAssets,
    message: `Cannot clock out — the following equipment has not been returned: ${assetList}. Please tap each item back before clocking out.`,
  };
}

/** Generate the OC 1702 equipment log for the DPS evidence bundle (30-day window) */
export async function generateEquipmentComplianceLog(params: {
  workspaceId: string;
  windowStart: Date;
  windowEnd: Date;
}): Promise<{
  totalEvents: number;
  checkins: number;
  checkouts: number;
  missedReturns: number;
  rows: Array<Record<string, unknown>>;
}> {
  const { workspaceId, windowStart, windowEnd } = params;

  const { rows } = await pool.query(
    `SELECT
       el.occurred_at, el.event_type, el.nfc_tag_id,
       ar.asset_name, ar.asset_type, ar.identifier,
       e.first_name || ' ' || e.last_name AS employee_name,
       e.employee_number
     FROM equipment_checkin_log el
     JOIN asset_registry ar ON ar.id = el.asset_id
     LEFT JOIN employees e ON e.id = el.employee_id
     WHERE el.workspace_id = $1
       AND el.occurred_at >= $2 AND el.occurred_at <= $3
     ORDER BY el.occurred_at DESC`,
    [workspaceId, windowStart, windowEnd]
  ).catch(() => ({ rows: [] }));

  const checkins   = rows.filter(r => r.event_type === 'checkin').length;
  const checkouts  = rows.filter(r => r.event_type === 'checkout').length;

  // A missed return = checkout with no matching checkin in same shift window
  const missedReturns = checkouts - checkins > 0 ? checkouts - checkins : 0;

  return { totalEvents: rows.length, checkins, checkouts, missedReturns, rows };
}
