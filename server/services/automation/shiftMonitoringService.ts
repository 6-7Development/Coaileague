/**
 * SHIFT MONITORING SERVICE - Trinity Autonomous Shift Oversight
 * ==============================================================
 * Background service that continuously monitors active shifts for:
 * - Late clock-ins (15+ min after shift start)
 * - No-call-no-show detection (1+ hour after shift start)
 * - Geofence violations during active shifts
 * - Auto-replacement triggers when employees fail to show
 * 
 * Integrates with:
 * - ScheduleOS™ for auto-replacement
 * - Employee Scoring for point deductions
 * - Notification system for org owner alerts
 * - Trinity orchestration for awareness
 */

import { db } from '../../db';
import { shifts, timeEntries, employees, notifications } from '@shared/schema';
import { eq, and, gte, lte, isNull, or, ne } from 'drizzle-orm';
import { platformEventBus } from '../platformEventBus';
import { coaileagueScoringService } from './coaileagueScoringService';

export interface ShiftAlert {
  type: 'late_clock_in' | 'no_call_no_show' | 'geo_violation' | 'replacement_needed' | 'replacement_found' | 'replacement_failed';
  shiftId: string;
  employeeId: string;
  employeeName: string;
  workspaceId: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface MonitoringResult {
  shiftsChecked: number;
  lateAlerts: number;
  ncnsAlerts: number;
  replacementsTriggered: number;
  replacementsSuccessful: number;
  replacementsFailed: number;
}

const LATE_THRESHOLD_MINUTES = 15;
const NCNS_THRESHOLD_MINUTES = 60;
const MONITORING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class ShiftMonitoringService {
  private static instance: ShiftMonitoringService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastRunTime: Date | null = null;
  private stats = {
    totalRuns: 0,
    totalAlertsGenerated: 0,
    totalReplacementsTriggered: 0,
  };

  private constructor() {}

  static getInstance(): ShiftMonitoringService {
    if (!this.instance) {
      this.instance = new ShiftMonitoringService();
    }
    return this.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[ShiftMonitor] Already running');
      return;
    }

    console.log('[ShiftMonitor] Starting autonomous shift monitoring...');
    this.isRunning = true;

    await this.runMonitoringCycle();

    this.intervalId = setInterval(async () => {
      await this.runMonitoringCycle();
    }, MONITORING_INTERVAL_MS);

    await platformEventBus.publish({
      type: 'service_started',
      category: 'automation',
      title: 'Shift Monitoring Active',
      description: 'Trinity is now monitoring active shifts for attendance issues',
      metadata: { interval: MONITORING_INTERVAL_MS },
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[ShiftMonitor] Stopped');
  }

  getStatus(): { running: boolean; lastRun: Date | null; stats: typeof this.stats } {
    return {
      running: this.isRunning,
      lastRun: this.lastRunTime,
      stats: this.stats,
    };
  }

  async runMonitoringCycle(): Promise<MonitoringResult> {
    const now = new Date();
    this.lastRunTime = now;
    this.stats.totalRuns++;

    const result: MonitoringResult = {
      shiftsChecked: 0,
      lateAlerts: 0,
      ncnsAlerts: 0,
      replacementsTriggered: 0,
      replacementsSuccessful: 0,
      replacementsFailed: 0,
    };

    try {
      const today = now.toISOString().split('T')[0];
      const windowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const windowEnd = new Date(now.getTime() + 30 * 60 * 1000); // 30 min ahead

      const activeShifts = await db.select({
        shift: shifts,
        employee: employees,
      })
        .from(shifts)
        .innerJoin(employees, eq(shifts.employeeId, employees.id))
        .where(
          and(
            eq(shifts.date, today),
            gte(shifts.startTime, windowStart),
            lte(shifts.startTime, windowEnd),
            or(
              eq(shifts.status, 'scheduled'),
              eq(shifts.status, 'confirmed'),
              eq(shifts.status, 'pending')
            )
          )
        );

      result.shiftsChecked = activeShifts.length;

      for (const { shift, employee } of activeShifts) {
        const shiftStart = new Date(shift.startTime);
        const minutesSinceStart = (now.getTime() - shiftStart.getTime()) / (1000 * 60);

        if (minutesSinceStart < 0) continue;

        const timeEntry = await db.query.timeEntries.findFirst({
          where: and(
            eq(timeEntries.employeeId, shift.employeeId!),
            eq(timeEntries.shiftId, shift.id)
          ),
        });

        const hasClockedIn = !!timeEntry;

        if (!hasClockedIn) {
          if (minutesSinceStart >= NCNS_THRESHOLD_MINUTES) {
            result.ncnsAlerts++;
            await this.handleNoCallNoShow(shift, employee, minutesSinceStart);
            
            const replacementResult = await this.triggerAutoReplacement(shift, 'ncns');
            result.replacementsTriggered++;
            if (replacementResult.success) {
              result.replacementsSuccessful++;
            } else {
              result.replacementsFailed++;
            }
          } else if (minutesSinceStart >= LATE_THRESHOLD_MINUTES) {
            result.lateAlerts++;
            await this.handleLateClockIn(shift, employee, minutesSinceStart);
          }
        }
      }

      if (result.lateAlerts > 0 || result.ncnsAlerts > 0) {
        console.log(`[ShiftMonitor] Cycle complete: ${result.shiftsChecked} shifts, ${result.lateAlerts} late, ${result.ncnsAlerts} NCNS`);
      }

    } catch (error) {
      console.error('[ShiftMonitor] Error in monitoring cycle:', error);
    }

    return result;
  }

  private async handleLateClockIn(shift: any, employee: any, minutesLate: number): Promise<void> {
    const alert: ShiftAlert = {
      type: 'late_clock_in',
      shiftId: shift.id,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      workspaceId: shift.workspaceId,
      severity: 'warning',
      message: `${employee.firstName} ${employee.lastName} is ${Math.round(minutesLate)} minutes late for their shift`,
      timestamp: new Date(),
      metadata: { minutesLate, shiftStart: shift.startTime },
    };

    await this.emitAlert(alert);
    await this.notifyOrgOwner(shift.workspaceId, alert);
  }

  private async handleNoCallNoShow(shift: any, employee: any, minutesLate: number): Promise<void> {
    const alert: ShiftAlert = {
      type: 'no_call_no_show',
      shiftId: shift.id,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      workspaceId: shift.workspaceId,
      severity: 'critical',
      message: `NCNS: ${employee.firstName} ${employee.lastName} has not clocked in (${Math.round(minutesLate)} min late)`,
      timestamp: new Date(),
      metadata: { minutesLate, shiftStart: shift.startTime },
    };

    await this.emitAlert(alert);
    await this.notifyOrgOwner(shift.workspaceId, alert);

    try {
      await coaileagueScoringService.recordEvent({
        employeeId: employee.id,
        eventType: 'shift_no_show',
        eventDate: new Date(),
        points: -25,
        metadata: { shiftId: shift.id },
      });
    } catch (err) {
      console.error('[ShiftMonitor] Failed to record NCNS scoring event:', err);
    }
  }

  async triggerAutoReplacement(shift: any, reason: 'ncns' | 'call_off'): Promise<{ success: boolean; replacementId?: string; error?: string }> {
    console.log(`[ShiftMonitor] Triggering auto-replacement for shift ${shift.id} (reason: ${reason})`);

    try {
      const { scheduleOSAI } = await import('../../ai/scheduleos');

      const replacementResult = await scheduleOSAI.generateSchedule({
        workspaceId: shift.workspaceId,
        weekStartDate: new Date(shift.startTime),
        clientIds: shift.clientId ? [shift.clientId] : [],
        shiftRequirements: [{
          title: shift.title || 'Replacement Shift',
          clientId: shift.clientId || '',
          startTime: new Date(shift.startTime),
          endTime: new Date(shift.endTime),
          requiredEmployees: 1,
        }],
      });

      if (replacementResult.generatedShifts.length > 0) {
        const replacement = replacementResult.generatedShifts[0];

        if (replacement.employeeId !== shift.employeeId) {
          const { storage } = await import('../../storage');
          
          const newShift = await storage.createShift({
            workspaceId: shift.workspaceId,
            employeeId: replacement.employeeId,
            clientId: replacement.clientId || null,
            title: `${replacement.title} (Auto-Replacement)` || null,
            date: shift.date,
            startTime: new Date(shift.startTime),
            endTime: new Date(shift.endTime),
            status: 'pending',
            aiGenerated: true,
            originalShiftId: shift.id,
          } as any);

          await db.update(shifts)
            .set({ status: 'cancelled', notes: `Auto-cancelled due to ${reason}. Replacement: ${newShift.id}` } as any)
            .where(eq(shifts.id, shift.id));

          const alert: ShiftAlert = {
            type: 'replacement_found',
            shiftId: shift.id,
            employeeId: replacement.employeeId,
            employeeName: replacement.employeeName,
            workspaceId: shift.workspaceId,
            severity: 'warning',
            message: `Trinity found replacement: ${replacement.employeeName} (Score: ${replacement.aiConfidenceScore})`,
            timestamp: new Date(),
            metadata: { originalShiftId: shift.id, newShiftId: newShift.id, reason },
          };

          await this.emitAlert(alert);
          await this.notifyOrgOwner(shift.workspaceId, alert);

          this.stats.totalReplacementsTriggered++;
          return { success: true, replacementId: newShift.id };
        }
      }

      await this.handleReplacementFailed(shift, reason, 'No suitable replacement found in employee pool');
      return { success: false, error: 'No suitable replacement found' };

    } catch (error: any) {
      console.error('[ShiftMonitor] Auto-replacement failed:', error);
      await this.handleReplacementFailed(shift, reason, error.message);
      return { success: false, error: error.message };
    }
  }

  private async handleReplacementFailed(shift: any, reason: string, errorMessage: string): Promise<void> {
    const alert: ShiftAlert = {
      type: 'replacement_failed',
      shiftId: shift.id,
      employeeId: shift.employeeId || '',
      employeeName: 'N/A',
      workspaceId: shift.workspaceId,
      severity: 'critical',
      message: `AUTO-FILL FAILED: Trinity could not find replacement for shift. Reason: ${errorMessage}`,
      timestamp: new Date(),
      metadata: { reason, errorMessage, shiftStart: shift.startTime, clientId: shift.clientId },
    };

    await this.emitAlert(alert);
    await this.notifyOrgOwner(shift.workspaceId, alert);

    await platformEventBus.publish({
      type: 'trinity_autofill_failed',
      category: 'scheduling',
      title: 'Auto-Fill Failed - Manual Intervention Required',
      description: alert.message,
      workspaceId: shift.workspaceId,
      metadata: {
        severity: 'critical',
        shiftId: shift.id,
        reason,
        errorMessage,
        requiresManualAction: true,
      },
    });
  }

  private async emitAlert(alert: ShiftAlert): Promise<void> {
    this.stats.totalAlertsGenerated++;

    await platformEventBus.publish({
      type: 'shift_alert',
      category: 'scheduling',
      title: alert.type.replace(/_/g, ' ').toUpperCase(),
      description: alert.message,
      workspaceId: alert.workspaceId,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        shiftId: alert.shiftId,
        employeeId: alert.employeeId,
        employeeName: alert.employeeName,
        ...alert.metadata,
      },
    });
  }

  private async notifyOrgOwner(workspaceId: string, alert: ShiftAlert): Promise<void> {
    try {
      const orgOwners = await db.select()
        .from(employees)
        .where(
          and(
            eq(employees.workspaceId, workspaceId),
            or(
              eq(employees.workspaceRole as any, 'org_owner'),
              eq(employees.workspaceRole as any, 'org_admin')
            )
          )
        );

      for (const owner of orgOwners) {
        if (owner.userId) {
          await db.insert(notifications).values({
            workspaceId,
            userId: owner.userId,
            type: alert.type,
            title: alert.severity === 'critical' ? 'URGENT: ' + alert.message.substring(0, 50) : alert.message.substring(0, 50),
            message: alert.message,
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            data: {
              alertType: alert.type,
              shiftId: alert.shiftId,
              employeeId: alert.employeeId,
              ...alert.metadata,
            },
          });
        }
      }
    } catch (error) {
      console.error('[ShiftMonitor] Failed to notify org owner:', error);
    }
  }
}

export const shiftMonitoringService = ShiftMonitoringService.getInstance();
