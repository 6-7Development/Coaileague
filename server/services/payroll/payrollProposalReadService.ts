import { and, desc, eq } from 'drizzle-orm';
import { db } from 'server/db';
import { payrollProposals } from '@shared/schema';

export interface PayrollProposalListParams {
  workspaceId: string;
  status?: string | null;
}

export interface PayrollProposalDetailParams {
  workspaceId: string;
  proposalId: string;
}

export type PayrollProposalRow = typeof payrollProposals.$inferSelect;

function requireWorkspaceId(workspaceId: string): void {
  if (!workspaceId) {
    throw Object.assign(new Error('workspaceId is required'), { status: 400 });
  }
}

/**
 * List payroll proposals for a workspace.
 *
 * This keeps manager-facing proposal reads in the payroll domain layer instead
 * of the giant payroll route file. Mutations remain in dedicated approve/reject
 * services.
 */
export async function listPayrollProposals({
  workspaceId,
  status,
}: PayrollProposalListParams): Promise<PayrollProposalRow[]> {
  requireWorkspaceId(workspaceId);

  return db.select()
    .from(payrollProposals)
    .where(and(
      eq(payrollProposals.workspaceId, workspaceId),
      ...(status ? [eq(payrollProposals.status, status)] : []),
    ))
    .orderBy(desc(payrollProposals.createdAt));
}

/**
 * Fetch one payroll proposal by ID with workspace scoping.
 */
export async function getPayrollProposal({
  workspaceId,
  proposalId,
}: PayrollProposalDetailParams): Promise<PayrollProposalRow> {
  requireWorkspaceId(workspaceId);
  if (!proposalId) {
    throw Object.assign(new Error('proposalId is required'), { status: 400 });
  }

  const [proposal] = await db.select()
    .from(payrollProposals)
    .where(and(
      eq(payrollProposals.workspaceId, workspaceId),
      eq(payrollProposals.id, proposalId),
    ))
    .limit(1);

  if (!proposal) {
    throw Object.assign(new Error('Payroll proposal not found'), { status: 404 });
  }

  return proposal;
}
