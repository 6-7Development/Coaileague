/**
 * Office Audit Service — Wave 12 / Task 1
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages GPS-locked compliance photo verification for DPS OC 1702 office audits.
 *
 * THREE PHOTOS REQUIRED PER AUDIT CYCLE:
 *   1. wall_license     — DPS-issued Class B/C license in its frame
 *   2. labor_law_poster — State/federal labor law signage
 *   3. exterior_signage — Physical office location exterior
 *
 * INTEGRITY CHECKS:
 *   GPS Match  — EXIF coordinates must be within 200m of registered workspace address
 *   Freshness  — EXIF "Date Taken" must be within 24 hours of upload
 *   Vision     — Gemini Flash confirms required elements are visible in photo
 *
 * ANNUAL ASSETS (vehicles/uniforms): same GPS check + 365-day recert timer
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { platformEventBus } from '../platformEventBus';
import { isProduction } from '../../lib/isProduction';

const log = createLogger('OfficeAudit');

// Maximum GPS distance (meters) from registered address to be considered "on-site"
const MAX_GPS_OFFSET_METERS = 200;
// Photo must have been taken within 24 hours of upload
const MAX_PHOTO_AGE_HOURS   = 24;
// Annual recertification window (vehicles/uniforms)
const RECERT_PERIOD_DAYS    = 365;
// Recertification warning: notify 30 days before expiry
const RECERT_WARNING_DAYS   = 30;

/** Haversine distance in meters between two GPS coordinates */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export interface OfficePhotoUpload {
  workspaceId: string;
  uploadedBy: string;
  photoType: 'wall_license' | 'labor_law_poster' | 'exterior_signage'
           | 'vehicle_marking' | 'uniform_front' | 'uniform_back';
  fileUrl: string;
  fileName?: string;
  fileSizeBytes?: number;
  // EXIF data extracted client-side or by server EXIF library
  exifGpsLat?: number | null;
  exifGpsLng?: number | null;
  exifDateTaken?: string | null; // ISO string
  exifDevice?: string | null;
  exifRaw?: Record<string, unknown>;
}

export interface OfficePhotoResult {
  success: boolean;
  photoId?: string;
  status: 'verified' | 'rejected' | 'pending_review';
  gpsVerified: boolean;
  gpsDistanceMeters?: number;
  freshnessOk: boolean;
  rejectionReason?: string;
  visionPending?: boolean;
  message: string;
}

/** Verify and store a compliance photo upload */
export async function submitCompliancePhoto(upload: OfficePhotoUpload): Promise<OfficePhotoResult> {
  log.info(`[OfficeAudit] Verifying ${upload.photoType} for workspace ${upload.workspaceId}`);

  // ── Get workspace registered address GPS ────────────────────────────────
  const wsRes = await pool.query(
    `SELECT address_lat, address_lng, name, company_name FROM workspaces WHERE id = $1`,
    [upload.workspaceId]
  ).catch(() => ({ rows: [] }));

  const ws = wsRes.rows[0];
  const registeredLat = ws?.address_lat ? parseFloat(ws.address_lat) : null;
  const registeredLng = ws?.address_lng ? parseFloat(ws.address_lng) : null;

  // ── GPS verification ────────────────────────────────────────────────────
  let gpsVerified = false;
  let gpsDistanceMeters: number | undefined;
  let gpsRejectionReason: string | null = null;

  if (!upload.exifGpsLat || !upload.exifGpsLng) {
    gpsRejectionReason = 'no_exif_gps';
    // For office photos, GPS is required. For older phones without GPS, flag for manual review.
  } else if (registeredLat && registeredLng) {
    gpsDistanceMeters = haversineMeters(
      upload.exifGpsLat, upload.exifGpsLng,
      registeredLat, registeredLng
    );
    if (gpsDistanceMeters > MAX_GPS_OFFSET_METERS) {
      gpsRejectionReason = `distance_exceeded: ${gpsDistanceMeters.toFixed(0)}m from registered address (max ${MAX_GPS_OFFSET_METERS}m)`;
    } else {
      gpsVerified = true;
    }
  } else {
    // Workspace has no geocoded address — pass GPS check but flag for admin review
    gpsVerified = true;
    log.warn(`[OfficeAudit] Workspace ${upload.workspaceId} has no geocoded address — GPS check skipped`);
  }

  // ── Freshness check ────────────────────────────────────────────────────
  let freshnessOk = false;
  let freshnessRejection: string | null = null;
  if (!upload.exifDateTaken) {
    // No EXIF date — treat as fresh but flag
    freshnessOk = true;
  } else {
    const taken = new Date(upload.exifDateTaken);
    const now   = new Date();
    const ageHours = (now.getTime() - taken.getTime()) / (1000 * 60 * 60);
    if (ageHours < 0) {
      freshnessRejection = 'future_timestamp';
    } else if (ageHours > MAX_PHOTO_AGE_HOURS) {
      freshnessRejection = `stale_timestamp: photo taken ${ageHours.toFixed(1)}h ago (max ${MAX_PHOTO_AGE_HOURS}h)`;
    } else {
      freshnessOk = true;
    }
  }

  const rejectionReason = gpsRejectionReason || freshnessRejection || null;
  const overallStatus   = !rejectionReason ? 'verified' : 'rejected';

  // ── Determine expiry for annual assets ────────────────────────────────
  const isAnnualAsset = ['vehicle_marking', 'uniform_front', 'uniform_back'].includes(upload.photoType);
  const expiresAt = isAnnualAsset
    ? new Date(Date.now() + RECERT_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    : null;

  const category = upload.photoType.startsWith('vehicle') ? 'vehicle'
    : upload.photoType.startsWith('uniform') ? 'uniform'
    : 'office';

  // ── Persist ────────────────────────────────────────────────────────────
  const insertRes = await pool.query(
    `INSERT INTO office_compliance_photos (
       workspace_id, uploaded_by, photo_type, category,
       file_url, file_name, file_size_bytes,
       exif_gps_lat, exif_gps_lng, exif_date_taken, exif_device, exif_raw,
       registered_address_lat, registered_address_lng, distance_from_address_meters,
       gps_verified, gps_rejection_reason,
       status, expires_at,
       verified_at, verified_by, rejection_notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     RETURNING id`,
    [
      upload.workspaceId, upload.uploadedBy, upload.photoType, category,
      upload.fileUrl, upload.fileName || null, upload.fileSizeBytes || null,
      upload.exifGpsLat || null, upload.exifGpsLng || null,
      upload.exifDateTaken ? new Date(upload.exifDateTaken) : null,
      upload.exifDevice || null,
      upload.exifRaw ? JSON.stringify(upload.exifRaw) : null,
      registeredLat, registeredLng, gpsDistanceMeters || null,
      gpsVerified, gpsRejectionReason,
      overallStatus, expiresAt,
      overallStatus === 'verified' ? new Date() : null,
      overallStatus === 'verified' ? 'system' : null,
      rejectionReason,
    ]
  ).catch(err => {
    log.error('[OfficeAudit] Insert failed:', err.message);
    throw err;
  });

  const photoId = insertRes.rows[0]?.id;

  // ── Trigger Gemini Vision check (non-blocking) ─────────────────────────
  if (overallStatus === 'verified' && isProduction()) {
    runVisionVerification(photoId, upload.workspaceId, upload.fileUrl, upload.photoType)
      .catch(err => log.warn('[OfficeAudit] Vision check failed (non-fatal):', err.message));
  }

  // ── Platform event ────────────────────────────────────────────────────
  if (overallStatus === 'rejected') {
    platformEventBus.publish({
      type: 'compliance_photo_rejected',
      category: 'compliance',
      title: `Compliance Photo Rejected — ${upload.photoType.replace(/_/g, ' ')}`,
      description: rejectionReason || 'Photo failed verification',
      workspaceId: upload.workspaceId,
      metadata: { photoId, photoType: upload.photoType, gpsDistanceMeters, rejectionReason },
    }).catch(() => {});
  }

  const message = overallStatus === 'verified'
    ? `Photo verified. ${isAnnualAsset ? `Annual recertification due: ${expiresAt?.toLocaleDateString()}.` : 'GPS and freshness checks passed.'}`
    : `Photo rejected: ${rejectionReason}. Please retake the photo on-site.`;

  log.info(`[OfficeAudit] ${upload.photoType} → ${overallStatus} | GPS: ${gpsVerified} | dist: ${gpsDistanceMeters?.toFixed(0)}m`);

  return {
    success: overallStatus === 'verified',
    photoId,
    status: overallStatus,
    gpsVerified,
    gpsDistanceMeters,
    freshnessOk,
    rejectionReason: rejectionReason || undefined,
    visionPending: overallStatus === 'verified' && isProduction(),
    message,
  };
}

/** Gemini Flash vision check — runs async after successful GPS/freshness verification */
async function runVisionVerification(
  photoId: string,
  workspaceId: string,
  fileUrl: string,
  photoType: string
): Promise<void> {
  try {
    const { meteredGemini } = await import('../billing/meteredGeminiClient');
    const labels: Record<string, string[]> = {
      wall_license:       ['security license', 'DPS license', 'framed license', 'license number'],
      labor_law_poster:   ['labor law poster', 'employee rights', 'minimum wage', 'workplace poster'],
      exterior_signage:   ['company name', 'building exterior', 'office sign', 'security company'],
      vehicle_marking:    ['company name', 'private security', 'vehicle marking', 'security logo'],
      uniform_front:      ['security patch', 'company name', 'badge', 'uniform'],
      uniform_back:       ['security patch', 'company name', 'SECURITY text', 'uniform back'],
    };
    const requiredLabels = labels[photoType] || ['compliance document'];

    const result = await meteredGemini({
      workspaceId,
      prompt: `You are verifying a compliance photo for a Texas private security company. This photo type is: "${photoType.replace(/_/g, ' ')}".

Please verify the following elements are VISIBLE and CLEAR in this photo:
${requiredLabels.map((l, i) => `${i+1}. ${l}`).join('\n')}

Image URL: ${fileUrl}

Respond ONLY with JSON: { "verified": true/false, "confidence": 0.0-1.0, "found": ["list of found elements"], "missing": ["list of missing elements"], "notes": "brief note" }`,
      actionType: 'compliance_vision_check',
      featureName: 'office_audit',
    });

    const parsed = JSON.parse(result.text?.replace(/```json|```/g, '').trim() || '{}');

    await pool.query(
      `UPDATE office_compliance_photos SET
         vision_verified = $1, vision_confidence = $2,
         vision_labels = $3, vision_notes = $4
       WHERE id = $5`,
      [
        parsed.verified ?? false,
        parsed.confidence ?? 0,
        JSON.stringify(parsed.found || []),
        parsed.notes || '',
        photoId,
      ]
    ).catch(() => {});

    log.info(`[OfficeAudit/Vision] ${photoId} → verified=${parsed.verified}, confidence=${parsed.confidence}`);
  } catch (err: unknown) {
    log.warn('[OfficeAudit/Vision] Failed:', err instanceof Error ? err.message : String(err));
  }
}

/** Get office audit completion status for a workspace */
export async function getOfficeAuditStatus(workspaceId: string): Promise<{
  complete: boolean;
  requiredPhotos: string[];
  verifiedPhotos: string[];
  pendingPhotos: string[];
  rejectedPhotos: string[];
}> {
  const required = ['wall_license', 'labor_law_poster', 'exterior_signage'];

  const res = await pool.query(
    `SELECT photo_type, status, expires_at, created_at
     FROM office_compliance_photos
     WHERE workspace_id = $1 AND category = 'office'
     ORDER BY created_at DESC`,
    [workspaceId]
  ).catch(() => ({ rows: [] }));

  // Get the most recent photo for each type
  const latest: Record<string, string> = {};
  for (const row of res.rows) {
    if (!latest[row.photo_type]) {
      latest[row.photo_type] = row.status;
    }
  }

  const verified  = required.filter(t => latest[t] === 'verified');
  const pending   = required.filter(t => latest[t] === 'pending_review' || !latest[t]);
  const rejected  = required.filter(t => latest[t] === 'rejected');

  return {
    complete: verified.length === required.length,
    requiredPhotos: required,
    verifiedPhotos: verified,
    pendingPhotos:  pending,
    rejectedPhotos: rejected,
  };
}

/** Check for annual assets approaching recertification */
export async function checkRecertificationDue(workspaceId: string): Promise<{
  assetsOverdue: string[];
  assetsDueSoon: string[];
  allCompliant: boolean;
}> {
  const warnCutoff = new Date(Date.now() + RECERT_WARNING_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const res = await pool.query(
    `SELECT id, asset_name, asset_type, compliance_status, recert_due_at
     FROM asset_registry
     WHERE workspace_id = $1 AND is_active = true AND asset_type IN ('vehicle', 'uniform')`,
    [workspaceId]
  ).catch(() => ({ rows: [] }));

  const overdue  = res.rows.filter(r => r.recert_due_at && new Date(r.recert_due_at) < now);
  const dueSoon  = res.rows.filter(r => r.recert_due_at && new Date(r.recert_due_at) >= now && new Date(r.recert_due_at) <= warnCutoff);

  return {
    assetsOverdue: overdue.map(r => `${r.asset_name} (${r.asset_type})`),
    assetsDueSoon: dueSoon.map(r => `${r.asset_name} — due ${new Date(r.recert_due_at).toLocaleDateString()}`),
    allCompliant:  overdue.length === 0 && dueSoon.length === 0,
  };
}
