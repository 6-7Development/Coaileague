import { db } from "server/db";
import { timeEntries, employees, workspaces, clients } from "@shared/schema";
import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { resolveRates, bucketHours, calculateAmount, roundHours } from "./rateResolver";

/**
 * Payroll Hours Aggregation Service
 * 
 * Automatically collects approved, unpayrolled time entries for a pay period
 * and prepares them for payroll processing. This is the "data collection" 
 * automation that feeds into PayrollOS™.
 * 
 * Key Features:
 * - Finds approved time entries in date range
 * - Groups by employee for payroll calculation
 * - Calculates pay hours (regular, overtime, holiday)
 * - Applies pay rates using rate resolution precedence
 * - Filters out already-payrolled entries
 * - Validates data completeness
 */

export interface PayrollHoursSummary {
  workspaceId: string;
  periodStart: Date;
  periodEnd: Date;
  employeeSummaries: EmployeePayrollSummary[];
  totalPayrollAmount: number;
  warnings: string[];
  entriesProcessed: number;
}

export interface EmployeePayrollSummary {
  employeeId: string;
  employeeName: string;
  employeeNumber: string | null;
  entries: TimeEntryPayroll[];
  totalHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHolidayHours: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  grossPay: number;
  warnings: string[];
}

export interface TimeEntryPayroll {
  timeEntryId: string;
  clientId: string | null;
  clientName: string | null;
  clockIn: Date;
  clockOut: Date | null;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  payRate: number;
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  totalPay: number;
  rateSource: string;
}

/**
 * Aggregate payroll hours for a workspace in a given period
 */
export async function aggregatePayrollHours(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
}): Promise<PayrollHoursSummary> {
  const { workspaceId, startDate, endDate } = params;
  
  console.log(`[PayrollHours] Aggregating for workspace ${workspaceId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Get workspace settings for overtime rules
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  // Find all approved, unpayrolled time entries in period
  const approvedEntries = await db
    .select({
      timeEntry: timeEntries,
      employee: employees,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .where(
      and(
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.status, 'approved'),
        isNull(timeEntries.payrolledAt), // Not already payrolled
        gte(timeEntries.clockIn, startDate),
        lte(timeEntries.clockIn, endDate)
      )
    );

  console.log(`[PayrollHours] Found ${approvedEntries.length} approved, unpayrolled entries`);

  if (approvedEntries.length === 0) {
    return {
      workspaceId,
      periodStart: startDate,
      periodEnd: endDate,
      employeeSummaries: [],
      totalPayrollAmount: 0,
      warnings: ['No approved, unpayrolled time entries found in this period'],
      entriesProcessed: 0,
    };
  }

  // Group entries by employee
  const employeeGroups = new Map<string, typeof approvedEntries>();
  for (const entry of approvedEntries) {
    const employeeId = entry.timeEntry.employeeId;
    if (!employeeGroups.has(employeeId)) {
      employeeGroups.set(employeeId, []);
    }
    employeeGroups.get(employeeId)!.push(entry);
  }

  const warnings: string[] = [];
  const employeeSummaries: EmployeePayrollSummary[] = [];
  let totalPayrollAmount = 0;

  // Process each employee group
  for (const [employeeId, entries] of Array.from(employeeGroups)) {
    const firstEntry = entries[0];
    const employee = firstEntry.employee;

    if (!employee) {
      warnings.push(`Employee ${employeeId} not found - skipping entries`);
      continue;
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const employeePayroll: TimeEntryPayroll[] = [];
    let employeeTotalHours = 0;
    let employeeTotalRegularHours = 0;
    let employeeTotalOvertimeHours = 0;
    let employeeTotalHolidayHours = 0;
    let employeeRegularPay = 0;
    let employeeOvertimePay = 0;
    let employeeHolidayPay = 0;
    const employeeWarnings: string[] = [];

    // Calculate cumulative hours for overtime calculation
    let weeklyHoursSoFar = 0;

    // Process each time entry for this employee
    for (const entry of entries) {
      const { timeEntry } = entry;

      // Validate entry has required data
      if (!timeEntry.clockOut) {
        employeeWarnings.push(`Time entry ${timeEntry.id} missing clock-out - skipping`);
        continue;
      }

      if (!timeEntry.totalHours) {
        employeeWarnings.push(`Time entry ${timeEntry.id} missing total hours - skipping`);
        continue;
      }

      // Resolve pay rate
      const resolved = resolveRates({
        timeEntry,
        employeeHourlyRate: employee.hourlyRate,
        clientBillableRate: null, // Not used for payroll
        workspaceDefaultRate: null,
      });

      if (resolved.hasWarning) {
        employeeWarnings.push(resolved.warningMessage!);
      }

      // Calculate hours bucketing (regular, OT, holiday)
      const totalHours = parseFloat(timeEntry.totalHours);
      const hoursBucket = bucketHours({
        totalHours,
        weeklyHoursSoFar,
        enableDailyOvertime: false, // TODO: Get from workspace settings
        weeklyOvertimeThreshold: 40, // FLSA standard
        isHoliday: false, // TODO: Check if shift is marked as holiday
      });

      // Update weekly hours accumulator for next entry
      weeklyHoursSoFar += totalHours;

      // Calculate pay amounts
      const regularPay = calculateAmount(hoursBucket.regularHours, resolved.payRate);
      const overtimePay = calculateAmount(hoursBucket.overtimeHours, resolved.payRate * 1.5);
      const holidayPay = calculateAmount(hoursBucket.holidayHours, resolved.payRate * 2.0);
      const totalPay = regularPay + overtimePay + holidayPay;

      // Get client info from time entry if available
      let clientName: string | null = null;
      if (timeEntry.clientId) {
        const client = await db.query.clients.findFirst({
          where: eq(clients.id, timeEntry.clientId),
          columns: { companyName: true },
        });
        clientName = client?.companyName || null;
      }

      employeePayroll.push({
        timeEntryId: timeEntry.id,
        clientId: timeEntry.clientId,
        clientName,
        clockIn: timeEntry.clockIn,
        clockOut: timeEntry.clockOut,
        totalHours,
        regularHours: hoursBucket.regularHours,
        overtimeHours: hoursBucket.overtimeHours,
        holidayHours: hoursBucket.holidayHours,
        payRate: resolved.payRate,
        regularPay,
        overtimePay,
        holidayPay,
        totalPay,
        rateSource: resolved.rateSource,
      });

      employeeTotalHours += totalHours;
      employeeTotalRegularHours += hoursBucket.regularHours;
      employeeTotalOvertimeHours += hoursBucket.overtimeHours;
      employeeTotalHolidayHours += hoursBucket.holidayHours;
      employeeRegularPay += regularPay;
      employeeOvertimePay += overtimePay;
      employeeHolidayPay += holidayPay;
    }

    const grossPay = employeeRegularPay + employeeOvertimePay + employeeHolidayPay;

    if (employeePayroll.length > 0) {
      employeeSummaries.push({
        employeeId,
        employeeName,
        employeeNumber: employee.employeeNumber,
        entries: employeePayroll,
        totalHours: roundHours(employeeTotalHours),
        totalRegularHours: roundHours(employeeTotalRegularHours),
        totalOvertimeHours: roundHours(employeeTotalOvertimeHours),
        totalHolidayHours: roundHours(employeeTotalHolidayHours),
        regularPay: employeeRegularPay,
        overtimePay: employeeOvertimePay,
        holidayPay: employeeHolidayPay,
        grossPay,
        warnings: employeeWarnings,
      });

      totalPayrollAmount += grossPay;
    }

    warnings.push(...employeeWarnings);
  }

  console.log(`[PayrollHours] Processed ${approvedEntries.length} entries, $${totalPayrollAmount.toFixed(2)} total payroll`);

  return {
    workspaceId,
    periodStart: startDate,
    periodEnd: endDate,
    employeeSummaries,
    totalPayrollAmount,
    warnings,
    entriesProcessed: approvedEntries.length,
  };
}

/**
 * Mark time entries as payrolled after payroll processing
 */
export async function markEntriesAsPayrolled(params: {
  timeEntryIds: string[];
  payrollRunId?: string;
}): Promise<void> {
  const { timeEntryIds, payrollRunId } = params;

  // Update each entry to mark as payrolled
  for (const entryId of timeEntryIds) {
    await db
      .update(timeEntries)
      .set({
        payrolledAt: new Date(),
        payrollRunId: payrollRunId || null,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, entryId));
  }

  console.log(`[PayrollHours] Marked ${timeEntryIds.length} entries as payrolled${payrollRunId ? ` (run ${payrollRunId})` : ''}`);
}
