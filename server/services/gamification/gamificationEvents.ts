import { EventEmitter } from 'events';

/**
 * Internal event emitter for gamification system
 * Handles internal events between gamification components
 */
class GamificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

export const gamificationEvents = new GamificationEventEmitter();

// Event types for type safety
export type GamificationEventType = 
  | 'clock_in'
  | 'clock_out'
  | 'shift_completed'
  | 'shift_accepted'
  | 'shift_swapped'
  | 'timesheet_approved'
  | 'expense_approved'
  | 'request_approved'
  | 'schedule_viewed'
  | 'feature_used'
  | 'profile_completed'
  | 'gamification_milestone'
  | 'achievement_unlocked'
  // Onboarding & Tutorial Events
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'tutorial_step_completed'
  | 'tutorial_completed'
  // Migration Events
  | 'migration_started'
  | 'migration_document_uploaded'
  | 'migration_data_imported'
  | 'migration_completed'
  // Org Setup Events
  | 'org_setup_started'
  | 'org_setup_step_completed'
  | 'org_ready_to_work';

export interface ClockInEvent {
  workspaceId: string;
  employeeId: string;
  clockId?: string;
  isEarly?: boolean;
}

export interface ShiftEvent {
  workspaceId: string;
  employeeId: string;
  shiftId?: string;
  hoursWorked?: number;
  swappedWith?: string;
  swapId?: string;
}

export interface ApprovalEvent {
  workspaceId: string;
  employeeId?: string;
  approverId?: string;
  referenceId?: string;
}

export interface FeatureEvent {
  workspaceId: string;
  userId: string;
  featureName: string;
}

export interface MilestoneEvent {
  type: string;
  workspaceId: string;
  employeeId: string;
  points?: number;
  feature?: string;
}

export interface AchievementEvent {
  achievement: {
    id: string;
    name: string;
    description: string;
    category: string;
    rarity: string;
    pointsValue: number;
  };
  employeeId: string;
  workspaceId: string;
  points: number;
}

export interface OnboardingEvent {
  workspaceId: string;
  employeeId: string;
  userId?: string;
  stepId?: string;
  stepName?: string;
  stepNumber?: number;
  totalSteps?: number;
  isComplete?: boolean;
}

export interface TutorialEvent {
  workspaceId: string;
  userId: string;
  employeeId?: string;
  tutorialId: string;
  tutorialName: string;
  stepId?: string;
  stepNumber?: number;
  totalSteps?: number;
  isComplete?: boolean;
}

export interface MigrationEvent {
  workspaceId: string;
  userId?: string;
  employeeId?: string;
  documentType?: string;
  recordCount?: number;
  migrationJobId?: string;
  phase?: 'started' | 'upload' | 'import' | 'completed';
}

export interface OrgSetupEvent {
  workspaceId: string;
  userId?: string;
  employeeId?: string;
  setupPhase: string;
  progress?: number;
  isComplete?: boolean;
}

/**
 * Emit a gamification event
 */
export function emitGamificationEvent(
  event: GamificationEventType, 
  data: ClockInEvent | ShiftEvent | ApprovalEvent | FeatureEvent | MilestoneEvent | AchievementEvent | OnboardingEvent | TutorialEvent | MigrationEvent | OrgSetupEvent
): void {
  gamificationEvents.emit(event, data);
}
