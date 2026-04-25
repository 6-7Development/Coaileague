import { and, eq } from 'drizzle-orm';
import { db } from 'server/db';
import { storage } from 'server/storage';
import { platformEventBus } from '../platformEventBus';
import { createLogger } from '../../lib/logger';

const log = createLogger('PayrollProposalRejectionService');

export interface RejectPayrollProposalParams {
  proposalId: string;
  reason?: string | null;
  userId: string;
  workspaceId: string;
  userEmail?: string | null;
  userRole?: string | null;
}

export interface RejectPayrollProposalResult {
  success: true;
  proposalId: string;
  message: string;
}

/**
 * Reject a pending payroll proposal for a workspace.
 *
 * Extracted from payrollRoutes.ts so the route can become a thin auth/HTTP
 * wrapper while proposal mutation, workspace scoping, audit logging, websocket,
 * and event publishing live in the payroll domain layer.
 */
export async function rejectPayrollProposal({
  proposalId,
  reason,
  userId,
  workspaceId,
  userEmail = 'unknown',
  userRole = 'user',
}: RejectPayrollProposalParams): Promise<RejectPayrollProposalResult> {
  if (!proposalId) throw Object.assign(new Error('proposalId is required'), { status: 400 });
  if (!userId) throw Object.assign(new Error('userId is required'), { status: 401 });
  if (!workspaceId) throw Object.assign(new Error('workspaceId is required'), { status: 400 });

  const { payrollProposals } = await import('@shared/schema');
  const [proposal] = await db.select().from(payrollProposals).where(
    and(
      eq(payrollProposals.id, proposalId),
      eq(payrollProposals.workspaceId, workspaceId),
      eq(payrollProposals.status, 'pending'),
    )
  ).limit(1);

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found or already processed'), { status: 404 });
  }

  await db.update(payrollProposals).set({
    status: 'rejected',
    rejectedBy: userId,
    rejectedAt: new Date(),
    rejectionReason: reason || 'No reason provided',
    updatedAt: new Date(),
  }).where(and(
    eq(payrollProposals.id, proposalId),
    eq(payrollProposals.workspaceId, workspaceId),
  ));

  storage.createAuditLog({
    workspaceId,
    userId,
    userEmail: userEmail || 'unknown',
    userRole: userRole || 'user',
    action: 'update',
    entityType: 'payroll_proposal',
    entityId: proposalId,
    actionDescription: `Payroll proposal ${proposalId} rejected`,
    changes: {
      before: { status: 'pending' },
      after: { status: 'rejected', rejectedBy: userId, reason: reason || 'No reason provided' },
    },
    isSensitiveData: true,
    complianceTag: 'soc2',
  }).catch(err => log.error('[FinancialAudit] CRITICAL: SOC2 audit log write failed for payroll proposal rejection', { error: err?.message }));

  try {
    const { broadcastToWorkspace } = await import('../websocketService');
    broadcastToWorkspace(workspaceId, { type: 'payroll_updated', action: 'proposal_rejected', proposalId });
  } catch (broadcastErr: any) {
    log.warn('[PayrollProposalRejectionService] Failed to broadcast proposal rejection (non-blocking):', broadcastErr?.message);
  }

  platformEventBus.publish({
    type: 'payroll_proposal_rejected',
    category: 'automation',
    title: 'Payroll Proposal Rejected',
    description: `Payroll proposal ${proposalId} rejected by ${userId}`,
    workspaceId,
    userId,
    metadata: {
      proposalId,
      rejectedBy: userId,
      reason: reason || 'No reason provided',
      source: 'proposal_reject',
    },
  }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

  return {
    success: true,
    proposalId,
    message: 'Payroll proposal rejected.',
  };
}
