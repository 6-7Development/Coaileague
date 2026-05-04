/**
 * FCM Push Notification Service — Wave 21B
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends push notifications via Firebase Cloud Messaging HTTP v1 API.
 * Uses JWT authentication with a service account — no firebase-admin SDK needed.
 *
 * Architecture:
 *   - Device tokens stored in user_device_tokens table
 *   - Called by notificationDeliveryService when WebSocket delivery fails/times out
 *   - Focus: PTT audio alerts, panic/Code Red, missed patrol, spend cap blocks
 *
 * Setup:
 *   FIREBASE_PROJECT_ID     — Firebase project ID
 *   FIREBASE_CLIENT_EMAIL   — Service account email
 *   FIREBASE_PRIVATE_KEY    — Service account private key (PEM)
 *
 * Falls back silently if Firebase is not configured (non-blocking).
 */

import { pool } from "../db";
import { createLogger } from "../lib/logger";

const log = createLogger("FCMService");

const FCM_SEND_URL = (projectId: string) =>
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

// ── JWT for FCM HTTP v1 ───────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getFCMAccessToken(): Promise<string | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  // Reuse cached token until 5 minutes before expiry
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  try {
    const { createSign } = await import("crypto");
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat: now,
    })).toString("base64url");

    const sign = createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(privateKey, "base64url");
    const jwt = `${header}.${payload}.${signature}`;

    // Exchange JWT for access token
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) {
      log.warn("[FCM] OAuth token exchange failed:", res.status);
      return null;
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.token;
  } catch (err: unknown) {
    log.warn("[FCM] JWT generation failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Send single notification ──────────────────────────────────────────────────

export interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "normal" | "high";
  imageUrl?: string;
}

export async function sendFCMToToken(
  fcmToken: string,
  notification: FCMNotification
): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  const accessToken = await getFCMAccessToken();
  if (!accessToken) return false;

  try {
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl ? { image: notification.imageUrl } : {}),
        },
        data: notification.data || {},
        android: {
          priority: notification.priority === "high" ? "high" : "normal",
          notification: { channel_id: "coaileague_alerts" },
        },
        apns: {
          headers: { "apns-priority": notification.priority === "high" ? "10" : "5" },
          payload: { aps: { sound: "default", badge: 1 } },
        },
        webpush: {
          headers: { Urgency: notification.priority === "high" ? "high" : "normal" },
        },
      },
    };

    const res = await fetch(FCM_SEND_URL(projectId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as Record<string, unknown>;
      const errCode = (errBody?.error as Record<string, unknown>)?.status as string;
      if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
        // Token is stale — mark inactive
        await pool.query(
          "UPDATE user_device_tokens SET is_active = FALSE WHERE fcm_token = $1",
          [fcmToken]
        );
      }
      return false;
    }

    return true;
  } catch (err: unknown) {
    log.warn("[FCM] Send failed:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

// ── Send to all devices for a user ────────────────────────────────────────────

export async function sendFCMToUser(
  userId: string,
  workspaceId: string,
  notification: FCMNotification
): Promise<number> {
  try {
    const { rows } = await pool.query(
      `SELECT fcm_token FROM user_device_tokens
       WHERE user_id = $1 AND workspace_id = $2 AND is_active = TRUE`,
      [userId, workspaceId]
    );

    if (!rows.length) return 0;

    const results = await Promise.all(
      rows.map((r: { fcm_token: string }) => sendFCMToToken(r.fcm_token, notification))
    );
    return results.filter(Boolean).length;
  } catch (err: unknown) {
    log.warn("[FCM] sendFCMToUser failed:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

// ── Send to all active users in a workspace ───────────────────────────────────
// Used for panic alerts, Code Red, spend cap block notifications

export async function sendFCMToWorkspace(
  workspaceId: string,
  notification: FCMNotification
): Promise<number> {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (user_id) fcm_token
       FROM user_device_tokens
       WHERE workspace_id = $1 AND is_active = TRUE
       ORDER BY user_id, last_seen_at DESC
       LIMIT 200`,
      [workspaceId]
    );

    if (!rows.length) return 0;

    // Batch in groups of 50 (FCM rate limits)
    const batch = rows.map((r: { fcm_token: string }) =>
      sendFCMToToken(r.fcm_token, notification)
    );
    const results = await Promise.allSettled(batch);
    return results.filter(r => r.status === "fulfilled" && r.value).length;
  } catch (err: unknown) {
    log.warn("[FCM] sendFCMToWorkspace failed:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────

export async function ensureDeviceTokenSchema(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_device_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL,
        workspace_id VARCHAR NOT NULL,
        fcm_token VARCHAR(512) NOT NULL,
        device_type VARCHAR(20) DEFAULT 'web',
        device_label VARCHAR(100),
        last_seen_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS udt_user_workspace_idx ON user_device_tokens(user_id, workspace_id);
      CREATE INDEX IF NOT EXISTS udt_token_idx ON user_device_tokens(fcm_token);
      CREATE UNIQUE INDEX IF NOT EXISTS udt_unique_token ON user_device_tokens(fcm_token);
    `);
    log.info("[FCM] Device token schema ensured");
  } catch (err: unknown) {
    log.warn("[FCM] Schema ensure non-fatal:", err instanceof Error ? err.message : String(err));
  }
}
