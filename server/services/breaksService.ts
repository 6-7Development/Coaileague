/**
 * Breaks Service - Manages employee break tracking and status
 * Supports break requests, approvals, and compliance monitoring
 */

import { db } from "../db";
import { timeEntries, employees } from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export interface BreakStatus {
  employeeId: string;
  employeeName: string;
  currentStatus: 'on-break' | 'not-on-break' | 'idle';
  breakStartedAt: Date | null;
  breakDuration: number; // minutes
  breakType: string; // 'lunch' | 'short' | 'personal'
  lastBreakEnd: Date | null;
  breaksTakenToday: number;
  totalBreakMinutesToday: number;
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
}

/**
 * Get break status for an employee
 */
export async function getBreakStatus(
  workspaceId: string,
  employeeId: string
): Promise<BreakStatus | null> {
  const [employee] = await db
    .select()
    .from(employees)
    .where(and(
      eq(employees.id, employeeId),
      eq(employees.workspaceId, workspaceId)
    ));

  if (!employee) return null;

  // Get today's time entries for this employee
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysEntries = await db
    .select()
    .from(timeEntries)
    .where(and(
      eq(timeEntries.employeeId, employeeId),
      eq(timeEntries.workspaceId, workspaceId),
      gte(timeEntries.clockIn, today)
    ))
    .orderBy(desc(timeEntries.clockIn));

  // Calculate break metrics
  let breaksTaken = 0;
  let totalBreakMinutes = 0;
  let lastBreakEnd: Date | null = null;

  // Parse break notes from metadata
  const breakEntries = todaysEntries.filter(te => 
    te.notes?.includes('break') || te.notes?.includes('Break')
  );

  for (const entry of breakEntries) {
    breaksTaken++;
    if (entry.clockOut && entry.clockIn) {
      const duration = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60);
      totalBreakMinutes += duration;
      lastBreakEnd = new Date(entry.clockOut);
    }
  }

  // Determine compliance: Most jurisdictions require 10-15 min breaks, lunch breaks required after 6 hours
  let complianceStatus: 'compliant' | 'at-risk' | 'non-compliant' = 'compliant';
  
  // 8-hour shift should have at least 1 lunch break (30+ min) and 2 short breaks (10+ min each)
  const totalWorkedMinutes = todaysEntries.reduce((sum, te) => {
    if (te.clockOut && te.clockIn) {
      return sum + (new Date(te.clockOut).getTime() - new Date(te.clockIn).getTime()) / (1000 * 60);
    }
    return sum;
  }, 0);

  if (totalWorkedMinutes > 480) { // 8+ hours worked
    if (totalBreakMinutes < 30) {
      complianceStatus = 'non-compliant'; // Missing required lunch break
    } else if (totalBreakMinutes < 40) {
      complianceStatus = 'at-risk'; // Breaks below recommended minimum
    }
  }

  // Determine current break status by checking most recent entry
  let currentStatus: 'on-break' | 'not-on-break' | 'idle' = 'not-on-break';
  let breakStartedAt: Date | null = null;
  let breakDuration = 0;
  let breakType = 'short';

  if (todaysEntries.length > 0) {
    const lastEntry = todaysEntries[0];
    if (!lastEntry.clockOut) {
      // Employee clocked in but hasn't clocked out - check if on break
      if (lastEntry.notes?.includes('Break') || lastEntry.notes?.includes('break')) {
        currentStatus = 'on-break';
        breakStartedAt = new Date(lastEntry.clockIn);
        breakDuration = Math.round((Date.now() - new Date(lastEntry.clockIn).getTime()) / (1000 * 60));
        breakType = lastEntry.notes?.includes('lunch') ? 'lunch' : 'short';
      }
    } else if (lastEntry.clockOut) {
      // Check time since last clock out
      const timeSinceLastEntry = Date.now() - new Date(lastEntry.clockOut).getTime();
      const minSinceLastEntry = timeSinceLastEntry / (1000 * 60);
      
      if (minSinceLastEntry > 30) {
        currentStatus = 'idle'; // Idle for 30+ minutes
      }
    }
  }

  return {
    employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    currentStatus,
    breakStartedAt,
    breakDuration,
    breakType,
    lastBreakEnd,
    breaksTakenToday: breaksTaken,
    totalBreakMinutesToday: totalBreakMinutes,
    complianceStatus,
  };
}

/**
 * Get break status for all employees in workspace
 */
export async function getWorkspaceBreakStatus(
  workspaceId: string
): Promise<BreakStatus[]> {
  const allEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.workspaceId, workspaceId));

  const statuses: BreakStatus[] = [];
  for (const emp of allEmployees) {
    const status = await getBreakStatus(workspaceId, emp.id);
    if (status) statuses.push(status);
  }

  return statuses;
}

/**
 * Get compliance report for workspace
 */
export async function getBreakComplianceReport(
  workspaceId: string
): Promise<{
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  totalEmployees: number;
}> {
  const statuses = await getWorkspaceBreakStatus(workspaceId);

  return {
    compliant: statuses.filter(s => s.complianceStatus === 'compliant').length,
    atRisk: statuses.filter(s => s.complianceStatus === 'at-risk').length,
    nonCompliant: statuses.filter(s => s.complianceStatus === 'non-compliant').length,
    totalEmployees: statuses.length,
  };
}

export const breaksService = {
  getBreakStatus,
  getWorkspaceBreakStatus,
  getBreakComplianceReport,
};
