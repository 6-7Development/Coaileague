import { gamificationService } from './gamificationService';
import { 
  gamificationEvents, 
  emitGamificationEvent,
  type ClockInEvent,
  type ShiftEvent,
  type ApprovalEvent,
  type FeatureEvent,
  type MilestoneEvent
} from './gamificationEvents';
import { db } from '../../db';
import { employees } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Event-driven gamification system
 * Hooks into platform events to award badges and points
 */
export class GamificationEventTracker {
  private static initialized = false;

  /**
   * Initialize event listeners for all gamification triggers
   */
  static initializeEventListeners(): void {
    if (this.initialized) {
      console.log('[GamificationEventTracker] Already initialized, skipping');
      return;
    }

    // Time tracking events
    gamificationEvents.on('clock_in', (data: ClockInEvent) => this.handleClockIn(data));
    gamificationEvents.on('clock_out', (data: ClockInEvent) => this.handleClockOut(data));
    gamificationEvents.on('shift_completed', (data: ShiftEvent) => this.handleShiftCompleted(data));
    gamificationEvents.on('timesheet_approved', (data: ApprovalEvent) => this.handleTimesheetApproved(data));

    // Scheduling events
    gamificationEvents.on('shift_accepted', (data: ShiftEvent) => this.handleShiftAccepted(data));
    gamificationEvents.on('shift_swapped', (data: ShiftEvent) => this.handleShiftSwapped(data));
    gamificationEvents.on('schedule_viewed', (data: ShiftEvent) => this.handleScheduleViewed(data));

    // Approval events
    gamificationEvents.on('expense_approved', (data: ApprovalEvent) => this.handleExpenseApproved(data));
    gamificationEvents.on('request_approved', (data: ApprovalEvent) => this.handleRequestApproved(data));

    // Platform events
    gamificationEvents.on('feature_used', (data: FeatureEvent) => this.handleFeatureUsed(data));
    gamificationEvents.on('profile_completed', (data: ApprovalEvent) => this.handleProfileCompleted(data));

    this.initialized = true;
    console.log('[GamificationEventTracker] Event listeners initialized');
  }

  private static async handleClockIn(data: ClockInEvent): Promise<void> {
    try {
      const { workspaceId, employeeId, isEarly } = data;
      
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 5,
        transactionType: 'clock_in',
        referenceId: data.clockId,
        referenceType: 'clock_entry',
        description: 'Clocked in for the day',
      });

      if (isEarly) {
        await gamificationService.awardPoints({
          workspaceId,
          employeeId,
          points: 10,
          transactionType: 'early_clock_in',
          referenceId: data.clockId,
          referenceType: 'clock_entry',
          description: 'Clocked in early',
        });

        // Notify AI brain of early arrival pattern
        emitGamificationEvent('gamification_milestone', {
          type: 'early_arrival',
          workspaceId,
          employeeId,
          points: 10,
        });
      }

      console.log(`[Gamification] Clock-in points awarded to ${employeeId}`);
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling clock_in:', error);
    }
  }

  private static async handleClockOut(data: ClockInEvent): Promise<void> {
    try {
      const { workspaceId, employeeId } = data;
      
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 3,
        transactionType: 'clock_out',
        referenceId: data.clockId,
        referenceType: 'clock_entry',
        description: 'Clocked out for the day',
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling clock_out:', error);
    }
  }

  private static async handleShiftCompleted(data: ShiftEvent): Promise<void> {
    try {
      const { workspaceId, employeeId, hoursWorked } = data;
      
      // Award points based on hours
      const points = Math.min(Math.floor((hoursWorked || 0) * 2), 50);
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points,
        transactionType: 'shift_completed',
        referenceId: data.shiftId,
        referenceType: 'shift',
        description: `Completed shift (${hoursWorked} hours)`,
      });

      // Check for milestone achievements
      if (hoursWorked && hoursWorked >= 8) {
        emitGamificationEvent('gamification_milestone', {
          type: 'full_day_worked',
          workspaceId,
          employeeId,
          points,
        });
      }
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling shift_completed:', error);
    }
  }

  private static async handleTimesheetApproved(data: ApprovalEvent): Promise<void> {
    try {
      const { workspaceId, employeeId } = data;
      
      if (!employeeId) return;

      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 15,
        transactionType: 'timesheet_approved',
        referenceId: data.referenceId,
        referenceType: 'timesheet',
        description: 'Timesheet approved',
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling timesheet_approved:', error);
    }
  }

  private static async handleShiftAccepted(data: ShiftEvent): Promise<void> {
    try {
      const { workspaceId, employeeId } = data;
      
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 5,
        transactionType: 'shift_accepted',
        referenceId: data.shiftId,
        referenceType: 'shift',
        description: 'Accepted a shift',
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling shift_accepted:', error);
    }
  }

  private static async handleShiftSwapped(data: ShiftEvent): Promise<void> {
    try {
      const { workspaceId, employeeId, swappedWith } = data;
      
      // Points for the person doing the swap
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 20,
        transactionType: 'shift_swapped',
        referenceId: data.swapId,
        referenceType: 'shift_swap',
        description: 'Swapped a shift with team member',
      });

      // Points for the person receiving the swap
      if (swappedWith) {
        await gamificationService.awardPoints({
          workspaceId,
          employeeId: swappedWith,
          points: 20,
          transactionType: 'shift_swapped',
          referenceId: data.swapId,
          referenceType: 'shift_swap',
          description: 'Received a shift swap',
        });
      }

      emitGamificationEvent('gamification_milestone', {
        type: 'shift_swap',
        workspaceId,
        employeeId,
        points: 20,
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling shift_swapped:', error);
    }
  }

  private static async handleScheduleViewed(data: ShiftEvent): Promise<void> {
    try {
      const { workspaceId, employeeId } = data;
      
      // Small reward for engagement
      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 2,
        transactionType: 'schedule_viewed',
        referenceType: 'schedule_view',
        description: 'Viewed schedule',
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling schedule_viewed:', error);
    }
  }

  private static async handleExpenseApproved(data: ApprovalEvent): Promise<void> {
    try {
      const { workspaceId, approverId } = data;
      
      if (approverId) {
        await gamificationService.awardPoints({
          workspaceId,
          employeeId: approverId,
          points: 5,
          transactionType: 'expense_approved',
          referenceId: data.referenceId,
          referenceType: 'expense',
          description: 'Approved an expense',
        });
      }
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling expense_approved:', error);
    }
  }

  private static async handleRequestApproved(data: ApprovalEvent): Promise<void> {
    try {
      const { workspaceId, approverId } = data;
      
      if (approverId) {
        await gamificationService.awardPoints({
          workspaceId,
          employeeId: approverId,
          points: 10,
          transactionType: 'request_approved',
          referenceId: data.referenceId,
          referenceType: 'request',
          description: 'Processed a request',
        });
      }
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling request_approved:', error);
    }
  }

  private static async handleFeatureUsed(data: FeatureEvent): Promise<void> {
    try {
      const { workspaceId, userId, featureName } = data;
      
      // Get employee record
      const [employee] = await db.select()
        .from(employees)
        .where(and(
          eq(employees.userId, userId),
          eq(employees.workspaceId, workspaceId)
        ))
        .limit(1);

      if (!employee) return;

      const pointMap: Record<string, number> = {
        'analytics': 15,
        'reporting': 10,
        'ai_scheduling': 20,
        'mobile_app': 5,
        'helpai_chat': 10,
        'gamification': 5,
        'calendar_sync': 10,
        'time_tracking': 5,
      };

      const points = pointMap[featureName] || 5;

      await gamificationService.awardPoints({
        workspaceId,
        employeeId: employee.id,
        points,
        transactionType: 'feature_used',
        referenceId: featureName,
        referenceType: 'feature',
        description: `Used ${featureName} feature`,
      });

      emitGamificationEvent('gamification_milestone', {
        type: 'feature_adoption',
        workspaceId,
        employeeId: employee.id,
        feature: featureName,
        points,
      });

      console.log(`[Gamification] Feature use points (${points}) awarded for ${featureName}`);
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling feature_used:', error);
    }
  }

  private static async handleProfileCompleted(data: ApprovalEvent): Promise<void> {
    try {
      const { workspaceId, employeeId } = data;
      
      if (!employeeId) return;

      await gamificationService.awardPoints({
        workspaceId,
        employeeId,
        points: 50,
        transactionType: 'profile_completed',
        referenceId: employeeId,
        referenceType: 'employee',
        description: 'Completed profile setup',
      });

      emitGamificationEvent('gamification_milestone', {
        type: 'profile_complete',
        workspaceId,
        employeeId,
        points: 50,
      });
    } catch (error) {
      console.error('[GamificationEventTracker] Error handling profile_completed:', error);
    }
  }
}

// Export function to trigger gamification events from endpoints
export { emitGamificationEvent } from './gamificationEvents';
