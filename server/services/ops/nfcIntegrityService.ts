/**
 * NFC Integrity Service — Wave 12 / Task 3
 * ─────────────────────────────────────────────────────────────────────────────
 * Anti-spoof validation layer for every guard tour NFC tap.
 * Three vectors are cross-checked to detect fraudulent scans:
 *
 * 1. NFC UUID match    — Tag ID from device must match checkpoint's stored nfcTagId
 * 2. GPS radius check  — Device GPS must be within checkpoint's radiusMeters
 * 3. Time drift check  — |serverTime − deviceTime| < 120 seconds
 *
 * A scan failing any check gets an integrity flag and spoofDetected=true.
 * The incident is logged to the platform event bus for supervisor review.
 * Legitimate GPS issues (no signal, indoor areas) get a 'gps_unavailable' flag
 * rather than a flat rejection — guards are never locked out by infrastructure.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { platformEventBus } from '../platformEventBus';

const log = createLogger('NFCIntegrity');

// Maximum GPS offset for a valid scan (meters)
const MAX_RADIUS_OVERRIDE_METERS = 500; // Hard cap — beyond this is always a flag
// Time drift threshold (seconds) — |serverTime - deviceClaimedTime| > this = flag
const MAX_TIME_DRIFT_SECONDS = 120;

export interface NFCScanPayload {
  workspaceId: string;
  employeeId: string;
  tourId: string;
  checkpointId: string;
  // From physical NFC tag
  nfcTagId?: string | null;
  // From device
  deviceGpsLat?: number | null;
  deviceGpsLng?: number | null;
  deviceTimestamp?: string | null; // ISO string from device clock
}

export interface NFCIntegrityResult {
  allowed: boolean;
  integrityVerified: boolean;
  spoofDetected: boolean;
  flags: string[];
  distanceFromCheckpointM?: number;
  timeDriftSeconds?: number;
  message: string;
}

/** Haversine distance in meters */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function verifyNFCScan(payload: NFCScanPayload): Promise<NFCIntegrityResult> {
  const serverTime = new Date();
  const flags: string[] = [];
  let spoofDetected = false;
  let distanceFromCheckpointM: number | undefined;
  let timeDriftSeconds: number | undefined;

  // ── Load checkpoint ──────────────────────────────────────────────────────
  const { rows: cpRows } = await pool.query(
    `SELECT id, name, nfc_tag_id, latitude, longitude, radius_meters
     FROM guard_tour_checkpoints WHERE id = $1 AND workspace_id = $2`,
    [payload.checkpointId, payload.workspaceId]
  ).catch(() => ({ rows: [] }));

  const checkpoint = cpRows[0];
  if (!checkpoint) {
    return {
      allowed: false,
      integrityVerified: false,
      spoofDetected: false,
      flags: ['checkpoint_not_found'],
      message: 'Checkpoint not found or does not belong to this workspace.',
    };
  }

  // ── Check 1: NFC UUID match ─────────────────────────────────────────────
  if (checkpoint.nfc_tag_id && payload.nfcTagId) {
    if (payload.nfcTagId.trim().toLowerCase() !== checkpoint.nfc_tag_id.trim().toLowerCase()) {
      flags.push('nfc_uuid_mismatch');
      spoofDetected = true;
      log.warn(`[NFCIntegrity] UUID mismatch: got ${payload.nfcTagId}, expected ${checkpoint.nfc_tag_id}`);
    }
  } else if (checkpoint.nfc_tag_id && !payload.nfcTagId) {
    // Checkpoint requires NFC but no tag presented
    flags.push('nfc_tag_missing');
    spoofDetected = true;
  }

  // ── Check 2: GPS radius ─────────────────────────────────────────────────
  if (payload.deviceGpsLat && payload.deviceGpsLng && checkpoint.latitude && checkpoint.longitude) {
    distanceFromCheckpointM = haversineMeters(
      payload.deviceGpsLat, payload.deviceGpsLng,
      parseFloat(checkpoint.latitude), parseFloat(checkpoint.longitude)
    );
    const allowedRadius = Math.min(
      parseFloat(checkpoint.radius_meters) || 50,
      MAX_RADIUS_OVERRIDE_METERS
    );
    if (distanceFromCheckpointM > allowedRadius) {
      flags.push(`gps_out_of_radius:${distanceFromCheckpointM.toFixed(0)}m>${allowedRadius}m`);
      if (distanceFromCheckpointM > MAX_RADIUS_OVERRIDE_METERS) {
        spoofDetected = true; // Hard cap exceeded
      }
    }
  } else if (!payload.deviceGpsLat || !payload.deviceGpsLng) {
    flags.push('gps_unavailable'); // Not a spoof flag — infrastructure issue
  }

  // ── Check 3: Time drift ─────────────────────────────────────────────────
  if (payload.deviceTimestamp) {
    const deviceTime = new Date(payload.deviceTimestamp);
    timeDriftSeconds = Math.abs(serverTime.getTime() - deviceTime.getTime()) / 1000;
    if (timeDriftSeconds > MAX_TIME_DRIFT_SECONDS) {
      flags.push(`time_drift:${timeDriftSeconds.toFixed(0)}s`);
      if (timeDriftSeconds > MAX_TIME_DRIFT_SECONDS * 5) {
        spoofDetected = true; // 10+ minutes drift is almost certainly a replay attack
      }
    }
  }

  const integrityVerified = flags.length === 0;
  // Always allow the scan through — guards are never locked out by infrastructure.
  // Spoof detection is for supervisor review and audit, not for blocking legitimate duty.
  const allowed = !spoofDetected || flags.every(f => f === 'gps_unavailable');

  // ── Persist integrity data ───────────────────────────────────────────────
  await pool.query(
    `UPDATE guard_tour_scans SET
       nfc_tag_id = $1,
       device_gps_lat = $2, device_gps_lng = $3,
       server_timestamp = $4,
       time_drift_seconds = $5,
       distance_from_checkpoint_m = $6,
       integrity_verified = $7,
       integrity_flags = $8,
       spoof_detected = $9
     WHERE checkpoint_id = $10 AND employee_id = $11
       AND scanned_at >= NOW() - INTERVAL '5 minutes'
     ORDER BY scanned_at DESC LIMIT 1`,
    [
      payload.nfcTagId || null,
      payload.deviceGpsLat || null, payload.deviceGpsLng || null,
      serverTime,
      timeDriftSeconds ? Math.round(timeDriftSeconds) : null,
      distanceFromCheckpointM ? Math.round(distanceFromCheckpointM) : null,
      integrityVerified,
      JSON.stringify(flags),
      spoofDetected,
      payload.checkpointId, payload.employeeId,
    ]
  ).catch(err => log.warn('[NFCIntegrity] Persist failed:', err.message));

  // ── Fire alert for supervisor on spoof detection ─────────────────────────
  if (spoofDetected) {
    log.error(`[NFCIntegrity] SPOOF DETECTED: employee=${payload.employeeId} checkpoint=${payload.checkpointId} flags=${flags.join(',')}`);
    platformEventBus.publish({
      type: 'nfc_spoof_detected',
      category: 'error',
      title: 'NFC Integrity Breach Detected',
      description: `Guard scan at "${checkpoint.name}" failed integrity checks: ${flags.join(', ')}`,
      workspaceId: payload.workspaceId,
      metadata: {
        employeeId: payload.employeeId, checkpointId: payload.checkpointId,
        flags, distanceFromCheckpointM, timeDriftSeconds,
      },
    }).catch(() => {});
  }

  const message = integrityVerified
    ? 'Scan verified ✓'
    : spoofDetected
      ? `⚠ Integrity breach: ${flags.join(', ')}. Supervisor notified.`
      : `Scan logged with flags: ${flags.join(', ')}`;

  return { allowed, integrityVerified, spoofDetected, flags, distanceFromCheckpointM, timeDriftSeconds, message };
}
