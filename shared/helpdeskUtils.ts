import type { SupportTicket } from './schema';

export type UITicketStatus = 'new' | 'assigned' | 'investigating' | 'waiting_user' | 'resolved' | 'escalated';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketLifecyclePhase = 'intake' | 'triage' | 'diagnosing' | 'validating' | 'completed';

/**
 * TECH DEBT: Awaiting Customer Phase
 * 
 * The lifecycle system is designed for 6 phases but currently supports 5 due to database schema limitations.
 * 
 * MISSING PHASE: 'awaiting_customer'
 * - Represents tickets waiting for customer response
 * - Would show amber warning to customers: "We need additional information from you"
 * - Progressive bar would use amber gradient: from-amber-500 to-orange-500
 * 
 * TO IMPLEMENT:
 * 1. Add database field to support_tickets table:
 *    ALTER TABLE support_tickets ADD COLUMN awaiting_customer_response BOOLEAN DEFAULT false;
 * 
 * 2. Update mapTicketStatusToHeaderStatus to return 'waiting_user' when field is true
 * 
 * 3. Add 'awaiting_customer' back to TicketLifecyclePhase union type
 * 
 * 4. Update LIFECYCLE_PHASE_CONFIG with awaiting_customer configuration (order: 3)
 * 
 * 5. Update LIFECYCLE_STEPS array in HelpDeskProgressHeader component
 * 
 * ACCEPTANCE CRITERIA:
 * - Support agents can mark ticket as "waiting for customer"
 * - Customers see prominent amber notification when input needed
 * - Progressive bar shows amber phase between diagnosing and validating
 * - WebSocket events notify customers in real-time when status changes to awaiting_customer
 * 
 * PRIORITY: Medium (defer until HelpDesk features are validated by users)
 */

export const SLA_THRESHOLDS: Record<TicketPriority, number> = {
  low: 72 * 60 * 60,
  normal: 48 * 60 * 60,
  high: 12 * 60 * 60,
  urgent: 4 * 60 * 60,
};

export const LIFECYCLE_PHASE_CONFIG: Record<TicketLifecyclePhase, {
  label: string;
  color: string;
  gradient: string;
  customerLabel: string;
  order: number;
}> = {
  intake: {
    label: 'Intake',
    color: 'text-slate-600 dark:text-slate-400',
    gradient: 'from-slate-400 to-slate-500',
    customerLabel: 'Received',
    order: 0
  },
  triage: {
    label: 'Triage',
    color: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-emerald-600',
    customerLabel: 'Reviewing',
    order: 1
  },
  diagnosing: {
    label: 'Diagnosing',
    color: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-emerald-500 to-cyan-500',
    customerLabel: 'Investigating',
    order: 2
  },
  validating: {
    label: 'Validating Fix',
    color: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-500 to-teal-500',
    customerLabel: 'Testing Solution',
    order: 3
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-green-600',
    customerLabel: 'Resolved',
    order: 4
  }
};

export function mapTicketStatusToHeaderStatus(ticket: Pick<SupportTicket, 'status' | 'assignedTo' | 'isEscalated'>): UITicketStatus {
  if (ticket.isEscalated) return 'escalated';
  
  if (ticket.status === 'closed') return 'resolved';
  if (ticket.status === 'resolved') return 'resolved';
  
  if (!ticket.assignedTo) return 'new';
  
  if (ticket.status === 'open') return 'assigned';
  
  if (ticket.status === 'in_progress') return 'investigating';
  
  return 'investigating';
}

export function mapUIStatusToLifecyclePhase(
  uiStatus: UITicketStatus
): TicketLifecyclePhase {
  switch (uiStatus) {
    case 'new':
      return 'intake';
    case 'assigned':
      return 'triage';
    case 'investigating':
      return 'diagnosing';
    case 'waiting_user':
      return 'diagnosing';
    case 'resolved':
      return 'validating';
    case 'escalated':
      return 'diagnosing';
    default:
      return 'diagnosing';
  }
}

export function mapStatusToLifecyclePhase(
  status: string,
  assignedTo: string | null
): TicketLifecyclePhase {
  if (status === 'closed') return 'completed';
  if (status === 'resolved') return 'validating';
  if (!assignedTo) return 'intake';
  if (status === 'open') return 'triage';
  if (status === 'in_progress') return 'diagnosing';
  return 'diagnosing';
}

export function calculateSLARemaining(
  createdAt: Date,
  priority: TicketPriority = 'normal',
  now: Date = new Date()
): number {
  const threshold = SLA_THRESHOLDS[priority];
  const elapsed = (now.getTime() - new Date(createdAt).getTime()) / 1000;
  return Math.max(0, threshold - elapsed);
}

export interface TicketViewModel {
  id: string;
  ticketNumber: string;
  status: UITicketStatus;
  priority: TicketPriority;
  assignedAgent?: string;
  slaRemaining: number;
  subject: string;
  description: string;
  workspaceId: string;
  createdAt: Date;
}

export interface TicketLifecycleView {
  id: string;
  ticketNumber: string;
  lifecyclePhase: TicketLifecyclePhase;
  priority: TicketPriority;
  assignedAgent?: string;
  assignedTeamName?: string;
  slaRemaining: number;
  slaBreached: boolean;
  subject: string;
  latestPublicComment?: string;
  estimatedResolutionTime?: string;
  internalNotes?: string;
  conversationId?: string;
  lastTransitionAt: Date;
  createdAt: Date;
}

export interface AgentTicketView extends TicketLifecycleView {
  fullHistory: boolean;
  internalNotes: string;
  slaBreachDetails?: {
    breachedAt: Date;
    targetResolutionTime: Date;
  };
}

export interface CustomerTicketView {
  ticketNumber: string;
  lifecyclePhase: TicketLifecyclePhase;
  statusLabel: string;
  estimatedResolutionTime?: string;
  latestPublicComment?: string;
  assignedTeamName: string;
  lastUpdateAt: Date;
}
