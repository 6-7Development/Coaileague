/**
 * Redis Token Buffer — Wave 5 / Task 1 (G-1 + G-2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the direct Postgres-per-request write pattern in tokenUsageService.
 *
 * Architecture:
 *   AI call → push event to in-memory Map (keyed by workspaceId)
 *   Flush trigger: every 60s OR when buffer reaches 100 events — whichever first
 *   Flush target: batch INSERT into token_usage_log (Postgres)
 *   Stripe sync: on every flush, aggregate per-workspace token deltas and call
 *     stripe.billing.meterEvents.create() for workspaces with active overages.
 *
 * Redis is used as the cross-replica broadcast channel (same connection as
 * chatDockPubSub — single Redis client, no extra cost). In single-replica
 * Railway deployments the buffer is in-process; Redis connection is optional.
 *
 * NEVER blocks the calling thread. All flushes are fire-and-forget via
 * setInterval. If the flush fails, events are re-queued (not dropped).
 */

import { db } from '../../db';
import { tokenUsageLog } from '@shared/schema';
import { getStripe } from './stripeClient';
import { createLogger } from '../../lib/logger';
import { PLATFORM_WORKSPACE_ID } from './billingConstants';

const log = createLogger('redisTokenBuffer');

const FLUSH_INTERVAL_MS = 60_000;   // 60 seconds
const FLUSH_EVENT_THRESHOLD = 100;   // Flush when buffer reaches 100 events

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenBufferEvent {
  workspaceId: string;
  userId?: string | null;
  sessionId?: string | null;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  actionType: string;
  featureName?: string | null;
  bufferedAt: Date;
}

// ── In-process buffer ─────────────────────────────────────────────────────────

class RedisTokenBuffer {
  private readonly buffer: TokenBufferEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  // Push an event. Triggers flush if threshold reached.
  push(event: Omit<TokenBufferEvent, 'bufferedAt'>): void {
    this.buffer.push({ ...event, bufferedAt: new Date() });
    if (this.buffer.length >= FLUSH_EVENT_THRESHOLD) {
      this.flush().catch(err =>
        log.warn('[TokenBuffer] Threshold flush failed (non-fatal):', err instanceof Error ? err.message : String(err))
      );
    }
  }

  // Start the periodic flush timer. Called once at server startup.
  start(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch(err =>
        log.warn('[TokenBuffer] Interval flush failed (non-fatal):', err instanceof Error ? err.message : String(err))
      );
    }, FLUSH_INTERVAL_MS);
    // Unref so the interval doesn't prevent graceful shutdown
    if (typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
      (this.flushTimer as NodeJS.Timeout).unref();
    }
    log.info('[TokenBuffer] Started — flush every 60s or 100 events');
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Final flush on shutdown
    this.flush().catch(() => null);
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;

    // Drain the buffer atomically
    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      // ── Batch INSERT into token_usage_log ─────────────────────────────────
      await db.insert(tokenUsageLog).values(
        batch.map(e => ({
          workspaceId: e.workspaceId,
          sessionId: e.sessionId ?? null,
          userId: e.userId ?? null,
          modelUsed: e.modelUsed,
          tokensInput: e.tokensInput,
          tokensOutput: e.tokensOutput,
          tokensTotal: e.tokensTotal,
          actionType: e.actionType,
          featureName: e.featureName ?? null,
        }))
      );

      log.info(`[TokenBuffer] Flushed ${batch.length} events to Postgres`);

      // ── Stripe Meter sync for overage billing ─────────────────────────────
      // Aggregate per-workspace token totals in this flush batch
      await this.syncOveragesToStripe(batch).catch(err =>
        log.warn('[TokenBuffer] Stripe overage sync failed (non-fatal):', err instanceof Error ? err.message : String(err))
      );
    } catch (dbErr: unknown) {
      // Re-queue failed events so they are not lost
      this.buffer.unshift(...batch);
      log.error('[TokenBuffer] Postgres flush failed — events re-queued:', dbErr instanceof Error ? dbErr.message : String(dbErr));
    } finally {
      this.isFlushing = false;
    }
  }

  // ── Stripe Meter Events ───────────────────────────────────────────────────

  private async syncOveragesToStripe(batch: TokenBufferEvent[]): Promise<void> {
    if (!process.env.STRIPE_SECRET_KEY) return;

    // Aggregate by workspace
    const byWorkspace = new Map<string, number>();
    for (const e of batch) {
      if (e.workspaceId === PLATFORM_WORKSPACE_ID) continue;
      byWorkspace.set(e.workspaceId, (byWorkspace.get(e.workspaceId) ?? 0) + e.tokensTotal);
    }
    if (byWorkspace.size === 0) return;

    const { workspaces, orgFinanceSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const stripe = getStripe();

    for (const [workspaceId, tokensUsed] of byWorkspace) {
      try {
        // Look up Stripe subscription for this workspace
        const [ws] = await db
          .select({ stripeSubscriptionId: workspaces.stripeSubscriptionId, founderExemption: workspaces.founderExemption })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        if (!ws?.stripeSubscriptionId || ws.founderExemption) continue;

        // Send metered usage event to Stripe
        // Stripe Billing Meter: tracks AI token consumption for overage invoicing
        const meterId = process.env.STRIPE_TOKEN_METER_ID;
        if (!meterId) continue;

        await stripe.billing.meterEvents.create({
          event_name: 'ai_tokens_used',
          payload: {
            stripe_customer_id: workspaceId, // mapped via Stripe customer metadata
            value: String(tokensUsed),
          },
          timestamp: Math.floor(Date.now() / 1000),
          identifier: `${workspaceId}_${Math.floor(Date.now() / 60000)}`, // idempotency: 1 per minute per workspace
        }).catch(() => null); // non-fatal — meter events have their own retry logic

        // Wave 11: Velocity spike detection (async, non-blocking — never delays flush)
        import('./tokenVelocitySentinel').then(({ detectVelocitySpike }) =>
          detectVelocitySpike(workspaceId, tokensUsed)
        ).catch(() => null);

      } catch {
        // Non-fatal per workspace — continue with next
      }
    }
  }

  get bufferedCount(): number {
    return this.buffer.length;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const redisTokenBuffer = new RedisTokenBuffer();

/**
 * recordTokenUsageBuffered — drop-in replacement for the direct Postgres write.
 * Pushes to the in-memory buffer and returns immediately (never awaits DB).
 */
export function recordTokenUsageBuffered(params: {
  workspaceId: string;
  userId?: string | null;
  sessionId?: string | null;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
  actionType: string;
  featureName?: string | null;
}): void {
  if (!params.workspaceId || !params.modelUsed || !params.actionType) return;

  redisTokenBuffer.push({
    workspaceId: params.workspaceId,
    userId: params.userId ?? null,
    sessionId: params.sessionId ?? null,
    modelUsed: params.modelUsed,
    tokensInput: params.tokensInput || 0,
    tokensOutput: params.tokensOutput || 0,
    tokensTotal: (params.tokensInput || 0) + (params.tokensOutput || 0),
    actionType: params.actionType,
    featureName: params.featureName ?? null,
  });
}
