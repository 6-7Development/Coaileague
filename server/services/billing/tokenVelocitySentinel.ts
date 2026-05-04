/**
 * Token Velocity Sentinel — Wave 11
 * ─────────────────────────────────────────────────────────────────────────────
 * Two-layer AI spend protection:
 *
 * Layer 1 — Hard Gate (per-request):
 *   checkTokenGate(workspaceId) → enforced on every AI route.
 *   Non-bypass tenants over their Stripe limit get a 402 block.
 *   Founder exemption (Statewide/CoAIleague) always passes.
 *
 * Layer 2 — Velocity Alert (async, non-blocking):
 *   detectVelocitySpike(workspaceId, tokensJustUsed) runs after every AI call.
 *   If any workspace (including root) is burning tokens at 500%+ of its
 *   rolling hourly average, an emergency SMS + email fires immediately.
 *   Prevents runaway loops from costing thousands overnight.
 *
 * Both layers are non-fatal on infra errors — AI never goes down because
 * the sentinel itself is having a bad day. Errors are logged, not thrown.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { isProduction } from '../../lib/isProduction';

const log = createLogger('TokenVelocitySentinel');

// ── Constants ─────────────────────────────────────────────────────────────────
const VELOCITY_MULTIPLIER_THRESHOLD = 5.0;  // 500% of rolling average = spike
const VELOCITY_WINDOW_MINUTES = 60;          // Rolling window for average
const VELOCITY_MIN_TOKENS_TO_FIRE = 10_000; // Don't alert on tiny workspaces
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;  // Don't re-alert same workspace within 30 min

// In-memory cooldown tracker (resets on redeploy — acceptable for alerts)
const alertCooldowns = new Map<string, number>();

export interface TokenGateResult {
  allowed: boolean;
  reason?: string;
  /** HTTP status to return when blocked */
  statusCode?: 402 | 429;
  /** ChatDock-compatible block for the UI */
  chatBlock?: {
    type: 'usage_limit_exceeded';
    message: string;
    actionUrl: string;
  };
}

// ── Layer 1: Hard Gate ────────────────────────────────────────────────────────

export async function checkTokenGate(workspaceId: string): Promise<TokenGateResult> {
  try {
    // Founder / bypass accounts always pass
    const { rows: ws } = await pool.query(
      `SELECT founder_exemption, billing_exempt, subscription_tier, stripe_subscription_id
       FROM workspaces WHERE id = $1 LIMIT 1`,
      [workspaceId]
    );

    if (!ws[0]) return { allowed: true }; // Unknown workspace — let it through, log separately
    if (ws[0].founder_exemption || ws[0].billing_exempt) return { allowed: true };

    // Check if this workspace has exceeded its Stripe-authorized token limit
    // We read from token_usage_log — the same table the Stripe meter writes from
    const billingMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const { rows: usage } = await pool.query(
      `SELECT COALESCE(SUM(tokens_total), 0) AS total_tokens
       FROM token_usage_log
       WHERE workspace_id = $1
         AND timestamp >= date_trunc('month', NOW())`,
      [workspaceId]
    ).catch(() => ({ rows: [{ total_tokens: 0 }] }));

    const tokensThisMonth = parseInt(String(usage[0]?.total_tokens || 0), 10);

    // Read cap from workspace_ai_usage or usage_caps table
    const { rows: cap } = await pool.query(
      `SELECT token_cap_monthly FROM usage_caps WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    ).catch(() => ({ rows: [] }));

    const monthlyCapTokens = cap[0]?.token_cap_monthly
      ? parseInt(String(cap[0].token_cap_monthly), 10)
      : null;

    // No cap configured → allowed (unlimited by default until explicitly capped)
    if (!monthlyCapTokens) return { allowed: true };

    if (tokensThisMonth >= monthlyCapTokens) {
      log.warn(`[Sentinel/Gate] BLOCKED workspace=${workspaceId} used=${tokensThisMonth} cap=${monthlyCapTokens}`);
      return {
        allowed: false,
        statusCode: 402,
        reason: `Monthly AI token limit reached (${tokensThisMonth.toLocaleString()} / ${monthlyCapTokens.toLocaleString()})`,
        chatBlock: {
          type: 'usage_limit_exceeded',
          message: `⚠️ Your workspace has reached its monthly AI token limit (${(tokensThisMonth / 1000).toFixed(1)}k / ${(monthlyCapTokens / 1000).toFixed(1)}k tokens). Upgrade your plan to continue using Trinity.`,
          actionUrl: '/org-management?tab=billing',
        },
      };
    }

    return { allowed: true };
  } catch (err: unknown) {
    // Non-fatal — sentinel failure never blocks the AI
    log.warn('[Sentinel/Gate] Check failed (allowing through):', err instanceof Error ? err.message : String(err));
    return { allowed: true };
  }
}

// ── Layer 2: Velocity Spike Detector ─────────────────────────────────────────

export async function detectVelocitySpike(workspaceId: string, tokensJustUsed: number): Promise<void> {
  if (!isProduction()) return; // No velocity alerts in dev

  try {
    // Rolling hourly average for this workspace (last 7 days, same hour-of-day)
    const { rows: avgRows } = await pool.query(
      `SELECT COALESCE(AVG(hourly_tokens), 0) AS avg_hourly
       FROM (
         SELECT date_trunc('hour', timestamp) AS hr,
                SUM(tokens_total) AS hourly_tokens
         FROM token_usage_log
         WHERE workspace_id = $1
           AND timestamp >= NOW() - INTERVAL '7 days'
         GROUP BY hr
       ) sub`,
      [workspaceId]
    ).catch(() => ({ rows: [{ avg_hourly: 0 }] }));

    const avgHourly = parseFloat(String(avgRows[0]?.avg_hourly || 0));
    if (avgHourly < VELOCITY_MIN_TOKENS_TO_FIRE) return; // Too small to matter

    // Current hour's usage
    const { rows: currentRows } = await pool.query(
      `SELECT COALESCE(SUM(tokens_total), 0) AS current_hour_tokens
       FROM token_usage_log
       WHERE workspace_id = $1
         AND timestamp >= date_trunc('hour', NOW())`,
      [workspaceId]
    ).catch(() => ({ rows: [{ current_hour_tokens: 0 }] }));

    const currentHour = parseFloat(String(currentRows[0]?.current_hour_tokens || 0)) + tokensJustUsed;
    const ratio = avgHourly > 0 ? currentHour / avgHourly : 0;

    if (ratio < VELOCITY_MULTIPLIER_THRESHOLD) return;

    // Check cooldown
    const lastAlert = alertCooldowns.get(workspaceId) || 0;
    if (Date.now() - lastAlert < ALERT_COOLDOWN_MS) return;
    alertCooldowns.set(workspaceId, Date.now());

    // Get workspace name for the alert
    const { rows: wsRows } = await pool.query(
      `SELECT name, company_name FROM workspaces WHERE id = $1`,
      [workspaceId]
    ).catch(() => ({ rows: [] }));
    const wsName = wsRows[0]?.company_name || wsRows[0]?.name || workspaceId;

    const alertMessage = [
      `🚨 TOKEN VELOCITY SPIKE DETECTED`,
      `Workspace: ${wsName} (${workspaceId})`,
      `Current hour: ${currentHour.toLocaleString()} tokens`,
      `7-day average: ${avgHourly.toFixed(0)} tokens/hr`,
      `Multiplier: ${ratio.toFixed(1)}x (threshold: ${VELOCITY_MULTIPLIER_THRESHOLD}x)`,
      `Time: ${new Date().toISOString()}`,
      `Action: Check for runaway loops or unauthorized usage.`,
    ].join('\n');

    log.error(`[Sentinel/Velocity] SPIKE DETECTED: ${wsName} ${ratio.toFixed(1)}x average`);

    // Fire SMS + email alerts (non-blocking)
    fireVelocityAlert(workspaceId, wsName, ratio, currentHour, avgHourly, alertMessage).catch(err =>
      log.warn('[Sentinel/Velocity] Alert delivery failed:', err instanceof Error ? err.message : String(err))
    );

  } catch (err: unknown) {
    log.warn('[Sentinel/Velocity] Detection failed (non-fatal):', err instanceof Error ? err.message : String(err));
  }
}

async function fireVelocityAlert(
  workspaceId: string,
  wsName: string,
  ratio: number,
  currentTokens: number,
  avgTokens: number,
  fullMessage: string
): Promise<void> {
  const rootEmail = process.env.ROOT_ADMIN_EMAIL;
  const rootPhone = process.env.ROOT_ADMIN_PHONE || process.env.TWILIO_PHONE_NUMBER;

  // SMS via Twilio
  if (isProduction() && process.env.TWILIO_ACCOUNT_SID && rootPhone) {
    const { twilioService } = await import('../twilioService').catch(() => ({ twilioService: null }));
    if (twilioService) {
      await twilioService.sendSms(
        rootPhone,
        `🚨 CoAIleague Alert: Token spike on "${wsName}" — ${ratio.toFixed(1)}x avg (${(currentTokens / 1000).toFixed(1)}k tokens this hour). Check for runaway loops.`
      ).catch(() => {});
    }
  }

  // Email via Resend
  if (rootEmail) {
    const { sendCanSpamCompliantEmail } = await import('../emailCore').catch(() => ({ sendCanSpamCompliantEmail: null }));
    if (sendCanSpamCompliantEmail) {
      await sendCanSpamCompliantEmail({
        to: rootEmail,
        subject: `🚨 [CoAIleague] Token Velocity Alert — ${wsName} (${ratio.toFixed(1)}x)`,
        html: `<pre style="font-family:monospace;white-space:pre-wrap;">${fullMessage}</pre>`,
        emailType: 'admin_velocity_alert',
        skipUnsubscribeCheck: true,
      }).catch(() => {});
    }
  }

  // Write to platform event bus for dashboard banner
  const { platformEventBus } = await import('../platformEventBus').catch(() => ({ platformEventBus: null }));
  if (platformEventBus) {
    await platformEventBus.publish({
      type: 'ai_velocity_spike',
      category: 'error',
      title: `Token Velocity Spike — ${wsName}`,
      description: `${ratio.toFixed(1)}x above average. ${(currentTokens / 1000).toFixed(1)}k tokens this hour.`,
      metadata: { workspaceId, ratio, currentTokens, avgTokens },
    }).catch(() => {});
  }
}
