/**
 * Shift Reminders Service - Send shift reminders to assigned employees
 */

import { db } from "../db";
import { shifts, employees, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendShiftAssignmentEmail } from "../email";

export interface ReminderResult {
  shiftId: string;
  employeeId: string;
  employeeName: string;
  email: string;
  status: 'sent' | 'failed';
  message: string;
}

/**
 * Send reminder for a specific shift
 */
export async function sendShiftReminder(
  shiftId: string,
  workspaceId: string
): Promise<ReminderResult | null> {
  const [shift] = await db
    .select()
    .from(shifts)
    .where(and(
      eq(shifts.id, shiftId),
      eq(shifts.workspaceId, workspaceId)
    ));

  if (!shift || !shift.employeeId) {
    return null;
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, shift.employeeId));

  if (!employee || !employee.email) {
    return {
      shiftId,
      employeeId: shift.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      email: employee?.email || 'unknown',
      status: 'failed',
      message: 'Employee email not found',
    };
  }

  try {
    await sendShiftAssignmentEmail({
      employeeEmail: employee.email,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      shiftTitle: shift.title,
      shiftDate: shift.startTime.toISOString().split('T')[0],
      startTime: shift.startTime.toLocaleTimeString(),
      endTime: shift.endTime?.toLocaleTimeString() || 'TBD',
      location: shift.description || 'TBD',
    });

    return {
      shiftId,
      employeeId: shift.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      status: 'sent',
      message: 'Reminder sent successfully',
    };
  } catch (error: any) {
    return {
      shiftId,
      employeeId: shift.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      status: 'failed',
      message: error.message,
    };
  }
}

/**
 * Send reminders for all shifts in a date range
 */
export async function sendBulkShiftReminders(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<ReminderResult[]> {
  const shiftsToRemind = await db
    .select()
    .from(shifts)
    .where(and(
      eq(shifts.workspaceId, workspaceId),
      (db) => db.sql`${shifts.startTime} >= ${startDate} AND ${shifts.startTime} <= ${endDate}`,
      eq(shifts.status, 'published')
    ));

  const results: ReminderResult[] = [];
  for (const shift of shiftsToRemind) {
    const result = await sendShiftReminder(shift.id, workspaceId);
    if (result) results.push(result);
  }

  return results;
}

/**
 * Send reminder for upcoming shifts (next 24-48 hours)
 */
export async function sendUpcomingShiftReminders(workspaceId: string): Promise<ReminderResult[]> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Send reminders for shifts in the next 24-48 hours
  const shiftsToRemind = await db
    .select()
    .from(shifts)
    .where(and(
      eq(shifts.workspaceId, workspaceId),
      (db) => db.sql`${shifts.startTime} > ${tomorrow} AND ${shifts.startTime} <= ${inTwoDays}`,
      eq(shifts.status, 'published')
    ));

  const results: ReminderResult[] = [];
  for (const shift of shiftsToRemind) {
    const result = await sendShiftReminder(shift.id, workspaceId);
    if (result) results.push(result);
  }

  return results;
}

export const shiftRemindersService = {
  sendShiftReminder,
  sendBulkShiftReminders,
  sendUpcomingShiftReminders,
};
