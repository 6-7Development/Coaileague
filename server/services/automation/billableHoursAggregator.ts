import { db } from "server/db";
import { timeEntries, clients, employees, clientRates, workspaces } from "@shared/schema";
import { and, eq, gte, lte, isNull } from "drizzle-orm";
import { resolveRates, bucketHours, calculateAmount, roundHours } from "./rateResolver";

/**
 * Billable Hours Aggregation Service
 * 
 * Automatically collects approved, unbilled time entries for a billing period
 * and prepares them for invoice generation. This is the "data collection" 
 * automation that feeds into BillOS™.
 * 
 * Key Features:
 * - Finds approved time entries in date range
 * - Groups by client for invoice line items
 * - Calculates billable hours (regular, overtime, holiday)
 * - Applies billing rates using rate resolution precedence
 * - Filters out already-billed entries
 * - Validates data completeness
 */

export interface BillableHoursSummary {
  workspaceId: string;
  periodStart: Date;
  periodEnd: Date;
  clientSummaries: ClientBillableSummary[];
  totalBillableAmount: number;
  warnings: string[];
  entriesProcessed: number;
}

export interface ClientBillableSummary {
  clientId: string;
  clientName: string;
  entries: TimeEntryBillable[];
  totalHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHolidayHours: number;
  totalAmount: number;
  warnings: string[];
}

export interface TimeEntryBillable {
  timeEntryId: string;
  employeeId: string;
  employeeName: string;
  clockIn: Date;
  clockOut: Date | null;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  billingRate: number;
  amount: number;
  rateSource: string;
}

/**
 * Aggregate billable hours for a workspace in a given period
 */
export async function aggregateBillableHours(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
}): Promise<BillableHoursSummary> {
  const { workspaceId, startDate, endDate } = params;
  
  console.log(`[BillableHours] Aggregating for workspace ${workspaceId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Get workspace settings for overtime rules
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  // Find all approved, unbilled time entries in period
  const approvedEntries = await db
    .select({
      timeEntry: timeEntries,
      employee: employees,
      client: clients,
    })
    .from(timeEntries)
    .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
    .leftJoin(clients, eq(timeEntries.clientId, clients.id))
    .where(
      and(
        eq(timeEntries.workspaceId, workspaceId),
        eq(timeEntries.status, 'approved'),
        isNull(timeEntries.billedAt), // Not already billed
        gte(timeEntries.clockIn, startDate),
        lte(timeEntries.clockIn, endDate),
        eq(timeEntries.billableToClient, true)
      )
    );

  console.log(`[BillableHours] Found ${approvedEntries.length} approved, unbilled entries`);

  if (approvedEntries.length === 0) {
    return {
      workspaceId,
      periodStart: startDate,
      periodEnd: endDate,
      clientSummaries: [],
      totalBillableAmount: 0,
      warnings: ['No approved, unbilled time entries found in this period'],
      entriesProcessed: 0,
    };
  }

  // Group entries by client
  const clientGroups = new Map<string, typeof approvedEntries>();
  for (const entry of approvedEntries) {
    const clientId = entry.timeEntry.clientId || 'unassigned';
    if (!clientGroups.has(clientId)) {
      clientGroups.set(clientId, []);
    }
    clientGroups.get(clientId)!.push(entry);
  }

  const warnings: string[] = [];
  const clientSummaries: ClientBillableSummary[] = [];
  let totalBillableAmount = 0;

  // Process each client group
  for (const [clientId, entries] of Array.from(clientGroups)) {
    const firstEntry = entries[0];
    const clientName = firstEntry.client?.companyName || 'Unassigned Client';

    // Get client billing rate (if configured)
    const clientRateConfig = await db.query.clientRates.findFirst({
      where: and(
        eq(clientRates.clientId, clientId),
        eq(clientRates.isActive, true)
      ),
    });

    const clientBillable: TimeEntryBillable[] = [];
    let clientTotalHours = 0;
    let clientTotalRegularHours = 0;
    let clientTotalOvertimeHours = 0;
    let clientTotalHolidayHours = 0;
    let clientTotalAmount = 0;
    const clientWarnings: string[] = [];

    // Process each time entry for this client
    for (const entry of entries) {
      const { timeEntry, employee } = entry;

      // Validate entry has required data
      if (!timeEntry.clockOut) {
        clientWarnings.push(`Time entry ${timeEntry.id} missing clock-out - skipping`);
        continue;
      }

      if (!timeEntry.totalHours) {
        clientWarnings.push(`Time entry ${timeEntry.id} missing total hours - skipping`);
        continue;
      }

      // Resolve billing rate
      const resolved = resolveRates({
        timeEntry,
        employeeHourlyRate: employee?.hourlyRate,
        clientBillableRate: clientRateConfig?.billableRate,
        workspaceDefaultRate: null, // Could add workspace default rate here
      });

      if (resolved.hasWarning) {
        clientWarnings.push(resolved.warningMessage!);
      }

      // Calculate hours bucketing (regular, OT, holiday)
      const totalHours = parseFloat(timeEntry.totalHours);
      const hoursBucket = bucketHours({
        totalHours,
        weeklyHoursSoFar: 0, // TODO: Calculate weekly hours so far for this employee
        enableDailyOvertime: false, // TODO: Get from workspace settings
        isHoliday: false, // TODO: Check if shift is marked as holiday
      });

      // Calculate billable amount
      const regularAmount = calculateAmount(hoursBucket.regularHours, resolved.billingRate);
      const overtimeAmount = calculateAmount(hoursBucket.overtimeHours, resolved.billingRate * 1.5);
      const holidayAmount = calculateAmount(hoursBucket.holidayHours, resolved.billingRate * 2.0);
      const totalAmount = regularAmount + overtimeAmount + holidayAmount;

      clientBillable.push({
        timeEntryId: timeEntry.id,
        employeeId: timeEntry.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        clockIn: timeEntry.clockIn,
        clockOut: timeEntry.clockOut,
        totalHours,
        regularHours: hoursBucket.regularHours,
        overtimeHours: hoursBucket.overtimeHours,
        holidayHours: hoursBucket.holidayHours,
        billingRate: resolved.billingRate,
        amount: totalAmount,
        rateSource: resolved.rateSource,
      });

      clientTotalHours += totalHours;
      clientTotalRegularHours += hoursBucket.regularHours;
      clientTotalOvertimeHours += hoursBucket.overtimeHours;
      clientTotalHolidayHours += hoursBucket.holidayHours;
      clientTotalAmount += totalAmount;
    }

    if (clientBillable.length > 0) {
      clientSummaries.push({
        clientId,
        clientName,
        entries: clientBillable,
        totalHours: roundHours(clientTotalHours),
        totalRegularHours: roundHours(clientTotalRegularHours),
        totalOvertimeHours: roundHours(clientTotalOvertimeHours),
        totalHolidayHours: roundHours(clientTotalHolidayHours),
        totalAmount: clientTotalAmount,
        warnings: clientWarnings,
      });

      totalBillableAmount += clientTotalAmount;
    }

    warnings.push(...clientWarnings);
  }

  console.log(`[BillableHours] Processed ${approvedEntries.length} entries, $${totalBillableAmount.toFixed(2)} total billable`);

  return {
    workspaceId,
    periodStart: startDate,
    periodEnd: endDate,
    clientSummaries,
    totalBillableAmount,
    warnings,
    entriesProcessed: approvedEntries.length,
  };
}

/**
 * Mark time entries as billed after invoice creation
 */
export async function markEntriesAsBilled(params: {
  timeEntryIds: string[];
  invoiceId: string;
}): Promise<void> {
  const { timeEntryIds, invoiceId } = params;

  // Update each entry to mark as billed
  for (const entryId of timeEntryIds) {
    await db
      .update(timeEntries)
      .set({
        billedAt: new Date(),
        invoiceId,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, entryId));
  }

  console.log(`[BillableHours] Marked ${timeEntryIds.length} entries as billed (invoice ${invoiceId})`);
}
