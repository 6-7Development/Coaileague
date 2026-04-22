/**
 * Trinity Action Dispatcher — Phase 2 Biological Brain
 *
 * Routes chat / voice / email-detected commands into the platform action
 * pipeline. Low-risk actions execute immediately via helpaiOrchestrator.
 * Medium / high-risk actions are queued as governance_approvals with a
 * stable idempotency key so the same command cannot create duplicate
 * pending approvals.
 *
 * Used by:
 *   - trinity-talk voice route (Section D)
 *   - trinityInboundEmailProcessor command-email path (Section E)
 *   - trinityEventBrain (Section B) via queueApproval()
 *   - chat service action intent handling
 */

import { randomUUID, createHash } from 'crypto';
import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import { helpaiOrchestrator } from '../helpai/platformActionHub';
import type { ActionRequest, ActionResult } from '../helpai/platformActionHub';

const log = createLogger('TrinityActionDispatcher');

export type RiskLevel = 'low' | 'medium' | 'high';

export interface DispatchContext {
  workspaceId: string;
  userId: string;
  userRole: string;
  sessionId?: string;
  source?: string;
}

export interface DispatchResult {
  executed: boolean;
  queued: boolean;
  approvalId?: string;
  actionId?: string;
  appendToResponse?: string;
  error?: string;
}

interface IntentMatch {
  actionId: string;
  risk: RiskLevel;
  payload: Record<string, any>;
  reason: string;
}

const ACTION_INTENT_PATTERNS: Array<{
  pattern: RegExp;
  actionId: string;
  risk: RiskLevel;
  extract: (match: RegExpMatchArray, text: string) => Record<string, any>;
  reason: string;
}> = [
  {
    pattern: /\b(send|blast|text|sms)\b[^.]{0,40}\b(all|every)\b.{0,40}\b(officer|staff|guard|team)\b/i,
    actionId: 'notify.send',
    risk: 'medium',
    extract: (_m, text) => ({ targetGroup: 'available_officers', message: text.slice(0, 500), channels: ['sms'] }),
    reason: 'Broadcast SMS to officers requested',
  },
  {
    pattern: /\b(create|add|schedule)\s+shift\b/i,
    actionId: 'scheduling.create_shift',
    risk: 'medium',
    extract: () => ({}),
    reason: 'Create shift requested',
  },
  {
    pattern: /\b(fill|cover)\b.{0,30}\b(open|vacant|uncovered)\s+shift/i,
    actionId: 'scheduling.fill_open_shift',
    risk: 'low',
    extract: () => ({ urgency: 'normal' }),
    reason: 'Fill open shift requested',
  },
  {
    pattern: /\b(send|generate|issue)\s+invoice\b/i,
    actionId: 'billing.invoice_send',
    risk: 'medium',
    extract: () => ({}),
    reason: 'Send invoice requested',
  },
  {
    pattern: /\b(run|process|start)\s+payroll\b/i,
    actionId: 'payroll.run',
    risk: 'high',
    extract: () => ({}),
    reason: 'Run payroll requested',
  },
  {
    pattern: /\b(deactivate|suspend|terminate)\b.{0,40}\b(employee|officer|guard)\b/i,
    actionId: 'employee.deactivate',
    risk: 'high',
    extract: () => ({}),
    reason: 'Deactivate/terminate employee requested',
  },
];

function detectIntent(text: string): IntentMatch | null {
  if (!text) return null;
  for (const rule of ACTION_INTENT_PATTERNS) {
    const m = text.match(rule.pattern);
    if (m) {
      return {
        actionId: rule.actionId,
        risk: rule.risk,
        payload: rule.extract(m, text),
        reason: rule.reason,
      };
    }
  }
  return null;
}

function buildIdempotencyKey(
  workspaceId: string,
  actionId: string,
  payload: Record<string, any>,
): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(payload || {}))
    .digest('hex')
    .slice(0, 32);
  return `${workspaceId}:${actionId}:${digest}`;
}

/**
 * Queue a pending action for manager approval. Stable idempotency key
 * prevents duplicate pending approvals for the same workspace / action /
 * payload.
 */
export async function queueForApproval(
  context: DispatchContext,
  actionId: string,
  payload: Record<string, any>,
  reason: string,
  risk: RiskLevel,
): Promise<{ approvalId: string; wasExisting: boolean }> {
  const approvalId = randomUUID();
  const idempotencyKey = buildIdempotencyKey(context.workspaceId, actionId, payload);
  const expiresAt = new Date(
    Date.now() + (risk === 'high' ? 4 * 3600_000 : 24 * 3600_000),
  );

  const { rows } = await pool.query(
    `INSERT INTO governance_approvals
       (id, workspace_id, action_type, requester_id, requester_role,
        parameters, reason, status, expires_at, idempotency_key,
        created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, NOW(), NOW())
     ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
     DO UPDATE SET updated_at = NOW()
     RETURNING id, (xmax = 0) AS inserted`,
    [
      approvalId,
      context.workspaceId,
      actionId,
      context.userId,
      context.userRole,
      JSON.stringify(payload),
      reason,
      expiresAt,
      idempotencyKey,
    ],
  );

  const row = rows[0];
  const resolvedId = row?.id || approvalId;
  const wasExisting = row ? row.inserted === false : false;

  try {
    const { platformEventBus } = await import('../platformEventBus');
    await platformEventBus.publish({
      type: 'trinity_action_pending_approval',
      category: 'system',
      title: `Trinity Action Needs Approval${risk === 'high' ? ' 🚨' : ''}`,
      description: reason,
      workspaceId: context.workspaceId,
      metadata: { actionType: actionId, risk, approvalId: resolvedId },
    });
  } catch (err: any) {
    log.warn('[Dispatcher] pending_approval event publish failed (non-fatal):', err?.message);
  }

  return { approvalId: resolvedId, wasExisting };
}

async function executeImmediate(
  context: DispatchContext,
  actionId: string,
  payload: Record<string, any>,
): Promise<ActionResult> {
  const request: ActionRequest = {
    actionId,
    category: (actionId.split('.')[0] || 'system') as any,
    name: actionId,
    payload: { ...payload, workspaceId: context.workspaceId },
    workspaceId: context.workspaceId,
    userId: context.userId,
    userRole: context.userRole,
    metadata: {
      source: context.source || 'trinity-dispatcher',
      sessionId: context.sessionId,
    },
  };
  return helpaiOrchestrator.executeAction(request);
}

/**
 * Primary entrypoint for chat / voice / email intent dispatch.
 *
 * Scans the user message for an action intent. If none, returns
 * { executed: false, queued: false } and the caller continues normally.
 * For low-risk intents, executes immediately. For medium/high, queues an
 * approval. The appendToResponse field is safe to concatenate onto
 * Trinity's chat reply so the user sees what happened.
 */
export async function dispatchFromChat(
  message: string,
  _priorResponse: string,
  context: DispatchContext,
): Promise<DispatchResult> {
  const intent = detectIntent(message);
  if (!intent) {
    return { executed: false, queued: false };
  }

  try {
    if (intent.risk === 'low') {
      const result = await executeImmediate(context, intent.actionId, intent.payload);
      return {
        executed: result.success,
        queued: false,
        actionId: intent.actionId,
        appendToResponse: result.success
          ? `✅ I executed \`${intent.actionId}\` for you. ${result.message}`
          : `⚠️ I tried \`${intent.actionId}\` but it failed: ${result.message}`,
        error: result.success ? undefined : result.error || result.message,
      };
    }

    const { approvalId, wasExisting } = await queueForApproval(
      context,
      intent.actionId,
      intent.payload,
      intent.reason,
      intent.risk,
    );

    return {
      executed: false,
      queued: true,
      approvalId,
      actionId: intent.actionId,
      appendToResponse: wasExisting
        ? `⏳ An identical request for \`${intent.actionId}\` is already pending approval.`
        : `⏳ I queued \`${intent.actionId}\` for manager approval (${intent.risk} risk). Reason: ${intent.reason}`,
    };
  } catch (err: any) {
    log.warn('[Dispatcher] Dispatch failed:', err?.message);
    return {
      executed: false,
      queued: false,
      actionId: intent.actionId,
      error: err?.message,
    };
  }
}

export const trinityActionDispatcher = {
  detectIntent,
  dispatchFromChat,
  queueForApproval,
  buildIdempotencyKey,
};
