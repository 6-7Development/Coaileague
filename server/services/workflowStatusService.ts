/**
 * Workflow Status Service - Display active automation workflows
 */

import { db } from "../db";
import { automationExecutions } from "@shared/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export interface ActiveWorkflow {
  id: string;
  type: string; // 'schedule', 'onboarding', 'payroll', 'performance_review'
  name: string;
  status: 'running' | 'scheduled' | 'paused' | 'completed';
  targetCount: number; // affected employees/shifts
  progressPercent: number;
  startedAt: Date;
  estimatedCompletionAt?: Date;
  lastUpdatedAt: Date;
}

const ACTIVE_EXECUTION_STATUSES = ['queued', 'in_progress', 'pending_verification'] as const;

function toWorkflowStatus(status: string): ActiveWorkflow['status'] {
  if (status === 'queued') return 'scheduled';
  return 'running';
}

function getWorkBreakdownTotal(workBreakdown: unknown): number {
  if (!workBreakdown || typeof workBreakdown !== 'object') return 0;
  const totalCount = (workBreakdown as { totalCount?: unknown }).totalCount;
  return typeof totalCount === 'number' && Number.isFinite(totalCount) ? totalCount : 0;
}

function deriveProgressPercent(execution: typeof automationExecutions.$inferSelect): number {
  if (execution.status === 'pending_verification') return 100;
  if (execution.status === 'queued') return 0;

  const targetCount = getWorkBreakdownTotal(execution.workBreakdown);
  if (targetCount <= 0) return 0;

  const completedItems = (execution.itemsProcessed ?? 0) + (execution.itemsFailed ?? 0);
  return Math.min(99, Math.max(0, Math.round((completedItems / targetCount) * 100)));
}

function executionTypeToWorkflowType(actionType: string): string {
  if (actionType.includes('schedule')) return 'schedule';
  if (actionType.includes('payroll')) return 'payroll';
  if (actionType.includes('invoice') || actionType.includes('billing')) return 'billing';
  if (actionType.includes('employee') || actionType.includes('onboarding')) return 'onboarding';
  if (actionType.includes('compliance')) return 'compliance';
  return actionType || 'automation';
}

/**
 * Get all active workflows for workspace
 */
export async function getActiveWorkflows(
  workspaceId: string
): Promise<ActiveWorkflow[]> {
  const activeExecutions = await db
    .select()
    .from(automationExecutions)
    .where(and(
      eq(automationExecutions.workspaceId, workspaceId),
      inArray(automationExecutions.status, [...ACTIVE_EXECUTION_STATUSES])
    ))
    .orderBy(desc(automationExecutions.updatedAt), desc(automationExecutions.queuedAt))
    .limit(50);

  return activeExecutions.map((execution): ActiveWorkflow => {
    const workBreakdownTotal = getWorkBreakdownTotal(execution.workBreakdown);
    const observedItems = (execution.itemsProcessed ?? 0) + (execution.itemsFailed ?? 0);

    return {
      id: execution.id,
      type: executionTypeToWorkflowType(execution.actionType),
      name: execution.actionName,
      status: toWorkflowStatus(execution.status),
      targetCount: workBreakdownTotal || observedItems,
      progressPercent: deriveProgressPercent(execution),
      startedAt: execution.startedAt ?? execution.queuedAt,
      lastUpdatedAt: execution.updatedAt ?? execution.startedAt ?? execution.queuedAt,
    };
  });
}

/**
 * Get workflow status summary
 */
export async function getWorkflowStatusSummary(workspaceId: string): Promise<{
  activeCount: number;
  scheduledCount: number;
  completedCount: number;
  totalAffected: number;
  estimatedNextRun: Date | null;
}> {
  const workflows = await getActiveWorkflows(workspaceId);

  const activeCount = workflows.filter(w => w.status === 'running').length;
  const scheduledCount = workflows.filter(w => w.status === 'scheduled').length;
  const completedCount = workflows.filter(w => w.status === 'completed').length;
  const totalAffected = workflows.reduce((sum, w) => sum + w.targetCount, 0);

  const nextEstimate = workflows
    .filter(w => w.estimatedCompletionAt)
    .sort((a, b) => (a.estimatedCompletionAt?.getTime() || 0) - (b.estimatedCompletionAt?.getTime() || 0))[0];

  return {
    activeCount,
    scheduledCount,
    completedCount,
    totalAffected,
    estimatedNextRun: nextEstimate?.estimatedCompletionAt || null,
  };
}

/**
 * Get details for a specific workflow
 */
export async function getWorkflowDetails(
  workspaceId: string,
  workflowId: string
): Promise<ActiveWorkflow | null> {
  const workflows = await getActiveWorkflows(workspaceId);
  return workflows.find(w => w.id === workflowId) || null;
}

export const workflowStatusService = {
  getActiveWorkflows,
  getWorkflowStatusSummary,
  getWorkflowDetails,
};
