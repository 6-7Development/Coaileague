import type { TimeEntry } from "@shared/schema";

/**
 * Rate Resolution Helper
 * 
 * Resolves billing and pay rates following the precedence order:
 * 1. Per-entry overrides (entry.hourlyRate from shift.hourlyRateOverride)
 * 2. Employee-specific rates (employee.hourlyRate)
 * 3. Client rates (clientRates.billableRate)
 * 4. Workspace defaults
 * 
 * This helper is used by both billable hours and payroll aggregators
 * to ensure consistent rate calculation across the platform.
 */

export interface RateResolutionContext {
  timeEntry: TimeEntry;
  employeeHourlyRate?: string | null;
  clientBillableRate?: string | null;
  workspaceDefaultRate?: string | null;
}

export interface ResolvedRates {
  billingRate: number;
  payRate: number;
  rateSource: 'entry_override' | 'employee_rate' | 'client_rate' | 'workspace_default' | 'none';
  hasWarning: boolean;
  warningMessage?: string;
}

/**
 * Resolve billing and pay rates for a time entry
 */
export function resolveRates(context: RateResolutionContext): ResolvedRates {
  const { timeEntry, employeeHourlyRate, clientBillableRate, workspaceDefaultRate } = context;

  // Precedence 1: Per-entry override (from shift.hourlyRateOverride)
  if (timeEntry.hourlyRate) {
    const rate = parseFloat(timeEntry.hourlyRate);
    return {
      billingRate: rate,
      payRate: rate, // Entry rate applies to both billing and pay
      rateSource: 'entry_override',
      hasWarning: false,
    };
  }

  // Precedence 2: Employee-specific rate
  if (employeeHourlyRate) {
    const rate = parseFloat(employeeHourlyRate);
    return {
      billingRate: clientBillableRate ? parseFloat(clientBillableRate) : rate,
      payRate: rate,
      rateSource: 'employee_rate',
      hasWarning: false,
    };
  }

  // Precedence 3: Client billable rate (for billing only)
  if (clientBillableRate) {
    const rate = parseFloat(clientBillableRate);
    return {
      billingRate: rate,
      payRate: 0, // No pay rate available - will need manual review
      rateSource: 'client_rate',
      hasWarning: true,
      warningMessage: `Time entry ${timeEntry.id} has client rate but no pay rate - requires manual review`,
    };
  }

  // Precedence 4: Workspace default
  if (workspaceDefaultRate) {
    const rate = parseFloat(workspaceDefaultRate);
    return {
      billingRate: rate,
      payRate: rate,
      rateSource: 'workspace_default',
      hasWarning: false,
    };
  }

  // No rate found - flag for manual review
  return {
    billingRate: 0,
    payRate: 0,
    rateSource: 'none',
    hasWarning: true,
    warningMessage: `Time entry ${timeEntry.id} has no applicable rate - requires manual review`,
  };
}

/**
 * Calculate total amount for a time entry
 */
export function calculateAmount(hours: number, rate: number): number {
  return parseFloat((hours * rate).toFixed(2));
}

/**
 * Round hours to configured precision (default 2 decimal places)
 */
export function roundHours(hours: number, precision: number = 2): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(hours * multiplier) / multiplier;
}

/**
 * Group hours by category (regular, overtime, holiday)
 */
export interface HoursBucket {
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
}

/**
 * Bucket hours into regular, overtime, and holiday categories
 * Based on workspace overtime policy (40-hour weekly or 8-hour daily)
 */
export function bucketHours(params: {
  totalHours: number;
  weeklyHoursSoFar: number;
  enableDailyOvertime: boolean;
  dailyOvertimeThreshold?: number;
  weeklyOvertimeThreshold?: number;
  isHoliday?: boolean;
}): HoursBucket {
  const {
    totalHours,
    weeklyHoursSoFar,
    enableDailyOvertime,
    dailyOvertimeThreshold = 8,
    weeklyOvertimeThreshold = 40,
    isHoliday = false,
  } = params;

  // Holiday hours get special treatment
  if (isHoliday) {
    return {
      regularHours: 0,
      overtimeHours: 0,
      holidayHours: roundHours(totalHours),
    };
  }

  let regularHours = 0;
  let overtimeHours = 0;

  // Daily overtime check
  if (enableDailyOvertime && totalHours > dailyOvertimeThreshold) {
    regularHours = dailyOvertimeThreshold;
    overtimeHours = roundHours(totalHours - dailyOvertimeThreshold);
  }
  // Weekly overtime check
  else if (weeklyHoursSoFar + totalHours > weeklyOvertimeThreshold) {
    const hoursBeforeOT = Math.max(0, weeklyOvertimeThreshold - weeklyHoursSoFar);
    regularHours = roundHours(hoursBeforeOT);
    overtimeHours = roundHours(totalHours - hoursBeforeOT);
  }
  // All regular hours
  else {
    regularHours = roundHours(totalHours);
    overtimeHours = 0;
  }

  return {
    regularHours,
    overtimeHours,
    holidayHours: 0,
  };
}
