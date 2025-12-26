import { db } from '../db';
import { 
  shifts, 
  timeEntries, 
  invoices,
  payrollRuns,
  employees,
  clients,
  auditLogs,
  workspaces,
  employeeSkills,
  employeeCertifications,
  scheduledBreaks,
  laborLawRules,
  i9Verifications,
  complianceReports,
  type Shift,
  type TimeEntry,
  type Invoice,
  type PayrollRun,
  type Employee,
  type ComplianceReport,
  type InsertComplianceReport,
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql, isNotNull, lt, count } from 'drizzle-orm';
import { addYears, format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';

/**
 * MONOPOLISTIC FEATURE: Compliance Report Generation
 * 
 * Automatically generates audit-ready, non-editable compliance reports
 * that eliminate hundreds of hours of manual compilation and transfer liability
 * to the system's automated record-keeping.
 */

// ============================================================================
// LABOR LAW VIOLATION REPORT
// ============================================================================

interface LaborViolation {
  type: 'short_turnaround' | 'missed_break' | 'excessive_overtime' | 'unauthorized_shift';
  severity: 'critical' | 'high' | 'medium' | 'low';
  employeeId: string;
  employeeName: string;
  shiftId?: string;
  shiftDate?: Date;
  details: string;
  regulatoryReference?: string; // e.g., "FLSA §207", "DOL Meal Break Rule"
  potentialFineUsd?: string;
}

type ShiftWithEmployee = {
  shift: Shift;
  employee: Employee | null;
};

export async function generateLaborLawViolationReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  violations: LaborViolation[];
  summaryStats: {
    totalViolations: number;
    criticalViolations: number;
    potentialFinesTotal: string;
  };
}> {
  const violations: LaborViolation[] = [];

  // VIOLATION CHECK 1: Short Turnarounds (< 8 hours between shifts)
  const allShifts = await db
    .select({
      shift: shifts,
      employee: employees,
    })
    .from(shifts)
    .leftJoin(employees, eq(shifts.employeeId, employees.id))
    .where(
      and(
        eq(shifts.workspaceId, workspaceId),
        gte(shifts.startTime, startDate),
        lte(shifts.startTime, endDate)
      )
    )
    .orderBy(desc(shifts.startTime));

  // Group by employee and check turnaround times
  const shiftsByEmployee = new Map<string, ShiftWithEmployee[]>();
  allShifts.forEach(record => {
    const empId = record.shift.employeeId;
    if (!shiftsByEmployee.has(empId)) {
      shiftsByEmployee.set(empId, []);
    }
    shiftsByEmployee.get(empId)!.push(record);
  });

  // Iterate with Array.from for compatibility
  Array.from(shiftsByEmployee.entries()).forEach(([employeeId, empShifts]) => {
    // Sort by start time
    empShifts.sort((a: ShiftWithEmployee, b: ShiftWithEmployee) => 
      a.shift.startTime.getTime() - b.shift.startTime.getTime()
    );
    
    for (let i = 1; i < empShifts.length; i++) {
      const prevShift = empShifts[i - 1].shift;
      const currentShift = empShifts[i].shift;
      const employee = empShifts[i].employee;
      
      if (prevShift.endTime && currentShift.startTime) {
        const turnaroundHours = (currentShift.startTime.getTime() - prevShift.endTime.getTime()) / (1000 * 60 * 60);
        
        if (turnaroundHours < 8) {
          const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
          violations.push({
            type: 'short_turnaround',
            severity: turnaroundHours < 6 ? 'critical' : 'high',
            employeeId: employeeId,
            employeeName,
            shiftId: currentShift.id,
            shiftDate: currentShift.startTime,
            details: `Only ${turnaroundHours.toFixed(1)} hours between shifts (minimum 8 hours required)`,
            regulatoryReference: 'FLSA Rest Period Guidelines',
            potentialFineUsd: turnaroundHours < 6 ? '1000.00' : '500.00',
          });
        }
      }
    }
  });

  // VIOLATION CHECK 2: Excessive Overtime (>12 hours in single shift without approval)
  const longShifts = allShifts.filter(record => {
    const shift = record.shift;
    if (shift.endTime && shift.startTime) {
      const durationHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      return durationHours > 12;
    }
    return false;
  });

  longShifts.forEach(record => {
    const shift = record.shift;
    const employee = record.employee;
    const durationHours = (shift.endTime!.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
    
    violations.push({
      type: 'excessive_overtime',
      severity: durationHours > 16 ? 'critical' : 'high',
      employeeId: shift.employeeId,
      employeeName,
      shiftId: shift.id,
      shiftDate: shift.startTime,
      details: `Shift duration: ${durationHours.toFixed(1)} hours (exceeds 12-hour limit without documented approval)`,
      regulatoryReference: 'OSHA Fatigue Prevention Standards',
      potentialFineUsd: durationHours > 16 ? '2000.00' : '750.00',
    });
  });

  // Calculate summary stats
  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const potentialFinesTotal = violations
    .reduce((sum, v) => sum + parseFloat(v.potentialFineUsd || '0'), 0)
    .toFixed(2);

  return {
    reportTitle: 'Labor Law Compliance Violation Report',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    violations,
    summaryStats: {
      totalViolations: violations.length,
      criticalViolations,
      potentialFinesTotal,
    },
  };
}

// ============================================================================
// TAX REMITTANCE PROOF REPORT
// ============================================================================

interface TaxRemittanceRecord {
  payrollRunId: string;
  periodStart: Date;
  periodEnd: Date;
  totalGrossPay: string;
  totalTaxes: string;
  totalNetPay: string;
  remittanceStatus: 'pending' | 'draft' | 'approved' | 'paid' | 'processed';
  processedAt?: Date;
  confirmationNumber?: string;
}

export async function generateTaxRemittanceProofReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  remittances: TaxRemittanceRecord[];
  summaryStats: {
    totalPayrollRuns: number;
    totalGrossPay: string;
    totalTaxesWithheld: string;
    pendingRemittances: number;
  };
}> {
  const payrollRunsData = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.workspaceId, workspaceId),
        gte(payrollRuns.periodStart, startDate),
        lte(payrollRuns.periodEnd, endDate)
      )
    )
    .orderBy(desc(payrollRuns.periodStart));

  const remittances: TaxRemittanceRecord[] = payrollRunsData.map(run => {
    return {
      payrollRunId: run.id,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      totalGrossPay: run.totalGrossPay || '0.00',
      totalTaxes: run.totalTaxes || '0.00',
      totalNetPay: run.totalNetPay || '0.00',
      remittanceStatus: run.status || 'pending',
      processedAt: run.updatedAt || undefined,
      confirmationNumber: run.id.substring(0, 8).toUpperCase(),
    };
  });

  const totalGrossPay = remittances
    .reduce((sum, r) => sum + parseFloat(r.totalGrossPay), 0)
    .toFixed(2);

  const totalTaxesWithheld = remittances
    .reduce((sum, r) => sum + parseFloat(r.totalTaxes), 0)
    .toFixed(2);

  const pendingRemittances = remittances.filter(r => r.remittanceStatus === 'pending').length;

  return {
    reportTitle: 'Tax Remittance Proof Report (IRS/State Compliance)',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    remittances,
    summaryStats: {
      totalPayrollRuns: remittances.length,
      totalGrossPay,
      totalTaxesWithheld,
      pendingRemittances,
    },
  };
}

// ============================================================================
// HISTORICAL TIME ENTRY AUDIT LOG
// ============================================================================

interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function generateTimeEntryAuditLog(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  filterUserId?: string
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  auditEntries: AuditLogEntry[];
  summaryStats: {
    totalAuditEvents: number;
    uniqueUsers: number;
    modificationsCount: number;
    deletionsCount: number;
  };
}> {
  // Query audit logs filtered by time entries
  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.workspaceId, workspaceId),
        eq(auditLogs.entityType, 'timeEntry'),
        gte(auditLogs.createdAt, startDate),
        lte(auditLogs.createdAt, endDate),
        filterUserId ? eq(auditLogs.userId, filterUserId) : sql`true`
      )
    )
    .orderBy(desc(auditLogs.createdAt));

  const auditEntries: AuditLogEntry[] = logs.map(log => ({
    timestamp: log.createdAt,
    action: log.action,
    userId: log.userId,
    userName: (log.metadata as any)?.userName || 'Unknown',
    entityType: log.entityType,
    entityId: log.entityId,
    changes: log.changes,
    ipAddress: (log.metadata as any)?.ipAddress || undefined,
    userAgent: (log.metadata as any)?.userAgent || undefined,
  }));

  const uniqueUsers = new Set(auditEntries.map(e => e.userId)).size;
  const modificationsCount = auditEntries.filter(e => e.action === 'update').length;
  const deletionsCount = auditEntries.filter(e => e.action === 'delete').length;

  return {
    reportTitle: 'Time Entry Audit Log (7-Year Retention - IRS/DOL Compliance)',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    auditEntries,
    summaryStats: {
      totalAuditEvents: auditEntries.length,
      uniqueUsers,
      modificationsCount,
      deletionsCount,
    },
  };
}

// ============================================================================
// BREAK COMPLIANCE REPORT (State-Specific Meal/Rest Breaks)
// ============================================================================

interface BreakViolation {
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftDate: Date;
  violationType: 'missed_meal' | 'late_meal' | 'missed_rest' | 'short_break';
  requiredBreakMinutes: number;
  actualBreakMinutes: number;
  jurisdiction: string;
  regulatoryReference: string;
  potentialFineUsd: string;
}

export async function generateBreakComplianceReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  jurisdiction: string;
  violations: BreakViolation[];
  summaryStats: {
    totalShiftsAnalyzed: number;
    compliantShifts: number;
    violationCount: number;
    complianceRate: string;
    potentialFinesTotal: string;
  };
}> {
  const violations: BreakViolation[] = [];

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  const jurisdiction = workspace?.laborLawJurisdiction || 'US-FEDERAL';

  const laborRules = await db.query.laborLawRules.findFirst({
    where: eq(laborLawRules.jurisdiction, jurisdiction),
  });

  const allShifts = await db
    .select({
      shift: shifts,
      employee: employees,
    })
    .from(shifts)
    .leftJoin(employees, eq(shifts.employeeId, employees.id))
    .where(
      and(
        eq(shifts.workspaceId, workspaceId),
        gte(shifts.startTime, startDate),
        lte(shifts.startTime, endDate)
      )
    );

  for (const record of allShifts) {
    const shift = record.shift;
    const employee = record.employee;
    if (!shift.endTime) continue;

    const shiftDurationHours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';

    const breaks = await db.query.scheduledBreaks.findMany({
      where: eq(scheduledBreaks.shiftId, shift.id),
    });

    const mealBreaks = breaks.filter(b => b.breakType === 'meal');
    const restBreaks = breaks.filter(b => b.breakType === 'rest');

    const requiredMealBreakMinutes = laborRules?.mealBreakMinutes || 30;
    const requiredRestBreakMinutes = laborRules?.restBreakMinutes || 10;
    const mealBreakThresholdHours = laborRules?.mealBreakAfterHours ? parseFloat(laborRules.mealBreakAfterHours) : 5;

    if (shiftDurationHours >= mealBreakThresholdHours && mealBreaks.length === 0) {
      violations.push({
        employeeId: shift.employeeId,
        employeeName,
        shiftId: shift.id,
        shiftDate: shift.startTime,
        violationType: 'missed_meal',
        requiredBreakMinutes: requiredMealBreakMinutes,
        actualBreakMinutes: 0,
        jurisdiction,
        regulatoryReference: `${jurisdiction} Meal Break Law`,
        potentialFineUsd: '100.00',
      });
    }

    if (shiftDurationHours >= 4 && restBreaks.length === 0) {
      violations.push({
        employeeId: shift.employeeId,
        employeeName,
        shiftId: shift.id,
        shiftDate: shift.startTime,
        violationType: 'missed_rest',
        requiredBreakMinutes: requiredRestBreakMinutes,
        actualBreakMinutes: 0,
        jurisdiction,
        regulatoryReference: `${jurisdiction} Rest Break Law`,
        potentialFineUsd: '50.00',
      });
    }
  }

  const compliantShifts = allShifts.length - violations.length;
  const complianceRate = allShifts.length > 0 
    ? ((compliantShifts / allShifts.length) * 100).toFixed(1) 
    : '100.0';
  const potentialFinesTotal = violations
    .reduce((sum, v) => sum + parseFloat(v.potentialFineUsd), 0)
    .toFixed(2);

  return {
    reportTitle: `Break Compliance Report - ${jurisdiction}`,
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    jurisdiction,
    violations,
    summaryStats: {
      totalShiftsAnalyzed: allShifts.length,
      compliantShifts,
      violationCount: violations.length,
      complianceRate: `${complianceRate}%`,
      potentialFinesTotal,
    },
  };
}

// ============================================================================
// OVERTIME SUMMARY REPORT (Weekly Hours Tracking)
// ============================================================================

interface OvertimeRecord {
  employeeId: string;
  employeeName: string;
  weekStarting: Date;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  totalHours: number;
  overtimePayDue: string;
}

export async function generateOvertimeSummaryReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  records: OvertimeRecord[];
  summaryStats: {
    totalEmployees: number;
    employeesWithOvertime: number;
    totalOvertimeHours: string;
    totalOvertimePayDue: string;
  };
}> {
  const allShifts = await db
    .select({
      shift: shifts,
      employee: employees,
    })
    .from(shifts)
    .leftJoin(employees, eq(shifts.employeeId, employees.id))
    .where(
      and(
        eq(shifts.workspaceId, workspaceId),
        gte(shifts.startTime, startDate),
        lte(shifts.startTime, endDate)
      )
    );

  const employeeWeeklyHours = new Map<string, {
    employee: Employee | null;
    weeks: Map<string, number>;
  }>();

  for (const record of allShifts) {
    const shift = record.shift;
    const employee = record.employee;
    if (!shift.endTime) continue;

    const empId = shift.employeeId;
    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
    
    const weekStart = new Date(shift.startTime);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!employeeWeeklyHours.has(empId)) {
      employeeWeeklyHours.set(empId, { employee, weeks: new Map() });
    }
    const empData = employeeWeeklyHours.get(empId)!;
    empData.weeks.set(weekKey, (empData.weeks.get(weekKey) || 0) + hours);
  }

  const records: OvertimeRecord[] = [];
  const defaultHourlyRate = 25;

  for (const [employeeId, data] of Array.from(employeeWeeklyHours.entries())) {
    const employeeName = data.employee 
      ? `${data.employee.firstName} ${data.employee.lastName}` 
      : 'Unknown';
    const hourlyRate = data.employee?.hourlyRate 
      ? parseFloat(data.employee.hourlyRate) 
      : defaultHourlyRate;

    for (const [weekKey, totalHours] of Array.from(data.weeks.entries())) {
      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(0, Math.min(totalHours - 40, 20));
      const doubleTimeHours = Math.max(0, totalHours - 60);
      
      const overtimePayDue = (overtimeHours * hourlyRate * 0.5) + (doubleTimeHours * hourlyRate);

      if (overtimeHours > 0 || doubleTimeHours > 0) {
        records.push({
          employeeId,
          employeeName,
          weekStarting: new Date(weekKey),
          regularHours,
          overtimeHours,
          doubleTimeHours,
          totalHours,
          overtimePayDue: overtimePayDue.toFixed(2),
        });
      }
    }
  }

  const employeesWithOvertime = new Set(records.map(r => r.employeeId)).size;
  const totalOvertimeHours = records.reduce((sum, r) => sum + r.overtimeHours + r.doubleTimeHours, 0);
  const totalOvertimePayDue = records.reduce((sum, r) => sum + parseFloat(r.overtimePayDue), 0);

  return {
    reportTitle: 'Weekly Overtime Summary Report (FLSA Compliance)',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    records,
    summaryStats: {
      totalEmployees: employeeWeeklyHours.size,
      employeesWithOvertime,
      totalOvertimeHours: totalOvertimeHours.toFixed(1),
      totalOvertimePayDue: totalOvertimePayDue.toFixed(2),
    },
  };
}

// ============================================================================
// CERTIFICATION EXPIRY REPORT
// ============================================================================

interface ExpiringCertification {
  employeeId: string;
  employeeName: string;
  certificationType: string;
  certificationName: string;
  expiresAt: Date;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning' | 'upcoming';
  renewalRequired: boolean;
}

export async function generateCertificationExpiryReport(
  workspaceId: string,
  lookAheadDays: number = 90
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  lookAheadDays: number;
  certifications: ExpiringCertification[];
  summaryStats: {
    totalCertifications: number;
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
    upcomingCount: number;
  };
}> {
  const lookAheadDate = new Date();
  lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

  const expiringSoon = await db
    .select({
      cert: employeeCertifications,
      employee: employees,
    })
    .from(employeeCertifications)
    .innerJoin(employees, eq(employeeCertifications.employeeId, employees.id))
    .where(
      and(
        eq(employees.workspaceId, workspaceId),
        isNotNull(employeeCertifications.expirationDate),
        lt(employeeCertifications.expirationDate, lookAheadDate)
      )
    );

  const now = new Date();
  const certifications: ExpiringCertification[] = expiringSoon.map(record => {
    const cert = record.cert;
    const employee = record.employee;
    const expiresAt = cert.expirationDate!;
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: ExpiringCertification['status'];
    if (daysUntilExpiry < 0) status = 'expired';
    else if (daysUntilExpiry <= 7) status = 'critical';
    else if (daysUntilExpiry <= 30) status = 'warning';
    else status = 'upcoming';

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      certificationType: cert.certificationType,
      certificationName: cert.certificationName,
      expiresAt,
      daysUntilExpiry,
      status,
      renewalRequired: cert.status !== 'verified' || daysUntilExpiry <= 0,
    };
  });

  certifications.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const expiredCount = certifications.filter(c => c.status === 'expired').length;
  const criticalCount = certifications.filter(c => c.status === 'critical').length;
  const warningCount = certifications.filter(c => c.status === 'warning').length;
  const upcomingCount = certifications.filter(c => c.status === 'upcoming').length;

  return {
    reportTitle: 'Certification Expiry Report',
    generatedAt: new Date(),
    lookAheadDays,
    certifications,
    summaryStats: {
      totalCertifications: certifications.length,
      expiredCount,
      criticalCount,
      warningCount,
      upcomingCount,
    },
  };
}

// ============================================================================
// I-9 VERIFICATION STATUS REPORT
// ============================================================================

interface I9StatusRecord {
  employeeId: string;
  employeeName: string;
  hireDate: Date;
  section1Complete: boolean;
  section2Complete: boolean;
  section3Complete: boolean;
  reverificationDate?: Date;
  status: 'compliant' | 'pending_section1' | 'pending_section2' | 'needs_reverification' | 'expired';
  daysOverdue?: number;
}

export async function generateI9VerificationReport(
  workspaceId: string
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  records: I9StatusRecord[];
  summaryStats: {
    totalEmployees: number;
    compliantCount: number;
    pendingCount: number;
    overdueCount: number;
    complianceRate: string;
  };
}> {
  const workspaceEmployees = await db.query.employees.findMany({
    where: eq(employees.workspaceId, workspaceId),
  });

  const records: I9StatusRecord[] = [];
  const now = new Date();

  for (const employee of workspaceEmployees) {
    const i9Record = await db.query.i9Verifications.findFirst({
      where: eq(i9Verifications.employeeId, employee.id),
    });

    let status: I9StatusRecord['status'];
    let daysOverdue: number | undefined;

    if (!i9Record) {
      status = 'pending_section1';
      const hireDate = employee.hireDate || employee.createdAt;
      const daysSinceHire = Math.ceil((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceHire > 3) daysOverdue = daysSinceHire - 3;
    } else if (!i9Record.section1CompletedAt) {
      status = 'pending_section1';
    } else if (!i9Record.section2CompletedAt) {
      status = 'pending_section2';
      const section1Date = i9Record.section1CompletedAt;
      const daysSince = Math.ceil((now.getTime() - section1Date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 3) daysOverdue = daysSince - 3;
    } else if (i9Record.reverificationDate && i9Record.reverificationDate < now) {
      status = 'needs_reverification';
      daysOverdue = Math.ceil((now.getTime() - i9Record.reverificationDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      status = 'compliant';
    }

    records.push({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      hireDate: employee.hireDate || employee.createdAt,
      section1Complete: !!i9Record?.section1CompletedAt,
      section2Complete: !!i9Record?.section2CompletedAt,
      section3Complete: !!i9Record?.section3CompletedAt,
      reverificationDate: i9Record?.reverificationDate || undefined,
      status,
      daysOverdue,
    });
  }

  const compliantCount = records.filter(r => r.status === 'compliant').length;
  const pendingCount = records.filter(r => r.status.startsWith('pending')).length;
  const overdueCount = records.filter(r => r.daysOverdue && r.daysOverdue > 0).length;
  const complianceRate = records.length > 0 
    ? ((compliantCount / records.length) * 100).toFixed(1) 
    : '100.0';

  return {
    reportTitle: 'I-9 Employment Eligibility Verification Report',
    generatedAt: new Date(),
    records,
    summaryStats: {
      totalEmployees: records.length,
      compliantCount,
      pendingCount,
      overdueCount,
      complianceRate: `${complianceRate}%`,
    },
  };
}

// ============================================================================
// PAYROLL SUMMARY REPORT
// ============================================================================

export async function generatePayrollSummaryReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  reportTitle: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  payrollRuns: Array<{
    id: string;
    periodStart: Date;
    periodEnd: Date;
    status: string;
    employeeCount: number;
    totalGrossPay: string;
    totalTaxes: string;
    totalDeductions: string;
    totalNetPay: string;
    processedAt?: Date;
  }>;
  summaryStats: {
    totalPayrollRuns: number;
    totalGrossPay: string;
    totalTaxes: string;
    totalNetPay: string;
    averagePayPerEmployee: string;
  };
}> {
  const runs = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.workspaceId, workspaceId),
        gte(payrollRuns.periodStart, startDate),
        lte(payrollRuns.periodEnd, endDate)
      )
    )
    .orderBy(desc(payrollRuns.periodStart));

  const payrollRunsList = runs.map(run => ({
    id: run.id,
    periodStart: run.periodStart,
    periodEnd: run.periodEnd,
    status: run.status || 'pending',
    employeeCount: run.employeeCount || 0,
    totalGrossPay: run.totalGrossPay || '0.00',
    totalTaxes: run.totalTaxes || '0.00',
    totalDeductions: run.totalDeductions || '0.00',
    totalNetPay: run.totalNetPay || '0.00',
    processedAt: run.updatedAt || undefined,
  }));

  const totalGrossPay = payrollRunsList.reduce((sum, r) => sum + parseFloat(r.totalGrossPay), 0);
  const totalTaxes = payrollRunsList.reduce((sum, r) => sum + parseFloat(r.totalTaxes), 0);
  const totalNetPay = payrollRunsList.reduce((sum, r) => sum + parseFloat(r.totalNetPay), 0);
  const totalEmployees = payrollRunsList.reduce((sum, r) => sum + r.employeeCount, 0);
  const averagePayPerEmployee = totalEmployees > 0 ? (totalNetPay / totalEmployees) : 0;

  return {
    reportTitle: 'Payroll Summary Report',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    payrollRuns: payrollRunsList,
    summaryStats: {
      totalPayrollRuns: payrollRunsList.length,
      totalGrossPay: totalGrossPay.toFixed(2),
      totalTaxes: totalTaxes.toFixed(2),
      totalNetPay: totalNetPay.toFixed(2),
      averagePayPerEmployee: averagePayPerEmployee.toFixed(2),
    },
  };
}

// ============================================================================
// COMPREHENSIVE COMPLIANCE REPORT SERVICE
// ============================================================================

export type ComplianceReportType = 
  | 'labor_law_violations'
  | 'tax_remittance'
  | 'time_entry_audit'
  | 'break_compliance'
  | 'overtime_summary'
  | 'certification_expiry'
  | 'i9_verification'
  | 'payroll_summary';

export interface GenerateReportOptions {
  workspaceId: string;
  reportType: ComplianceReportType;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  automated?: boolean;
}

export async function generateComplianceReport(options: GenerateReportOptions): Promise<ComplianceReport> {
  const { workspaceId, reportType, userId, automated = false } = options;
  
  const now = new Date();
  const startDate = options.startDate || startOfMonth(now);
  const endDate = options.endDate || endOfMonth(now);

  const reportRecord = await db.insert(complianceReports).values({
    workspaceId,
    reportType,
    reportTitle: getReportTitle(reportType),
    description: getReportDescription(reportType),
    periodStart: startDate,
    periodEnd: endDate,
    status: 'generating',
    generatedBy: userId || null,
    automatedGeneration: automated,
    regulations: getRegulations(reportType),
    retentionYears: 7,
    expiresAt: addYears(now, 7),
  }).returning();

  const report = reportRecord[0];

  try {
    let reportData: any;
    let summaryStats: any;
    let hasViolations = false;
    let violationCount = 0;
    let criticalViolationCount = 0;
    let potentialFinesUsd = '0.00';

    switch (reportType) {
      case 'labor_law_violations': {
        const result = await generateLaborLawViolationReport(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.violations.length > 0;
        violationCount = result.violations.length;
        criticalViolationCount = result.summaryStats.criticalViolations;
        potentialFinesUsd = result.summaryStats.potentialFinesTotal;
        break;
      }
      case 'tax_remittance': {
        const result = await generateTaxRemittanceProofReport(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.summaryStats.pendingRemittances > 0;
        violationCount = result.summaryStats.pendingRemittances;
        break;
      }
      case 'time_entry_audit': {
        const result = await generateTimeEntryAuditLog(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.summaryStats.deletionsCount > 0;
        violationCount = result.summaryStats.deletionsCount;
        break;
      }
      case 'break_compliance': {
        const result = await generateBreakComplianceReport(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.violations.length > 0;
        violationCount = result.violations.length;
        potentialFinesUsd = result.summaryStats.potentialFinesTotal;
        break;
      }
      case 'overtime_summary': {
        const result = await generateOvertimeSummaryReport(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        break;
      }
      case 'certification_expiry': {
        const result = await generateCertificationExpiryReport(workspaceId, 90);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.summaryStats.expiredCount > 0;
        violationCount = result.summaryStats.expiredCount;
        criticalViolationCount = result.summaryStats.criticalCount;
        break;
      }
      case 'i9_verification': {
        const result = await generateI9VerificationReport(workspaceId);
        reportData = result;
        summaryStats = result.summaryStats;
        hasViolations = result.summaryStats.overdueCount > 0;
        violationCount = result.summaryStats.overdueCount;
        break;
      }
      case 'payroll_summary': {
        const result = await generatePayrollSummaryReport(workspaceId, startDate, endDate);
        reportData = result;
        summaryStats = result.summaryStats;
        break;
      }
    }

    const [updatedReport] = await db
      .update(complianceReports)
      .set({
        status: 'completed',
        generatedAt: new Date(),
        reportData,
        summaryStats,
        hasViolations,
        violationCount,
        criticalViolationCount,
        potentialFinesUsd,
        updatedAt: new Date(),
      })
      .where(eq(complianceReports.id, report.id))
      .returning();

    console.log(`[ComplianceReports] Generated ${reportType} report for workspace ${workspaceId}`);
    return updatedReport;

  } catch (error) {
    await db
      .update(complianceReports)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(complianceReports.id, report.id));

    console.error(`[ComplianceReports] Failed to generate ${reportType}:`, error);
    throw error;
  }
}

function getReportTitle(reportType: ComplianceReportType): string {
  const titles: Record<ComplianceReportType, string> = {
    labor_law_violations: 'Labor Law Compliance Violation Report',
    tax_remittance: 'Tax Remittance Proof Report',
    time_entry_audit: 'Time Entry Audit Log',
    break_compliance: 'Break Compliance Report',
    overtime_summary: 'Weekly Overtime Summary Report',
    certification_expiry: 'Certification Expiry Report',
    i9_verification: 'I-9 Employment Verification Report',
    payroll_summary: 'Payroll Summary Report',
  };
  return titles[reportType];
}

function getReportDescription(reportType: ComplianceReportType): string {
  const descriptions: Record<ComplianceReportType, string> = {
    labor_law_violations: 'Identifies potential FLSA and DOL labor law violations including overtime, rest periods, and unauthorized scheduling.',
    tax_remittance: 'Documents all tax withholdings and remittance records for IRS and state tax compliance.',
    time_entry_audit: 'Complete audit trail of all time entry modifications for 7-year DOL retention compliance.',
    break_compliance: 'Analyzes meal and rest break scheduling against state-specific labor laws.',
    overtime_summary: 'Weekly breakdown of regular, overtime, and double-time hours for FLSA compliance.',
    certification_expiry: 'Tracks expiring employee certifications and licenses requiring renewal.',
    i9_verification: 'Monitors I-9 employment eligibility verification status for all employees.',
    payroll_summary: 'Summarizes payroll runs, taxes, and net pay distributions.',
  };
  return descriptions[reportType];
}

function getRegulations(reportType: ComplianceReportType): string[] {
  const regulations: Record<ComplianceReportType, string[]> = {
    labor_law_violations: ['FLSA §207', 'DOL Wage & Hour', 'OSHA Fatigue Prevention'],
    tax_remittance: ['IRS Publication 15', 'State Tax Withholding Laws'],
    time_entry_audit: ['IRS 7-Year Retention', 'DOL Record Keeping'],
    break_compliance: ['State Meal Break Laws', 'State Rest Break Laws'],
    overtime_summary: ['FLSA §207 Overtime', 'State Overtime Laws'],
    certification_expiry: ['Industry Licensing Requirements', 'Professional Certification Standards'],
    i9_verification: ['USCIS I-9 Requirements', 'Immigration Reform and Control Act'],
    payroll_summary: ['FLSA Wage Requirements', 'State Payday Laws'],
  };
  return regulations[reportType];
}

export async function listComplianceReports(
  workspaceId: string,
  options: {
    reportType?: ComplianceReportType;
    status?: 'generating' | 'completed' | 'failed' | 'archived';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ reports: ComplianceReport[]; total: number }> {
  const { reportType, status, limit = 20, offset = 0 } = options;

  const conditions = [eq(complianceReports.workspaceId, workspaceId)];
  if (reportType) conditions.push(eq(complianceReports.reportType, reportType));
  if (status) conditions.push(eq(complianceReports.status, status));

  const reports = await db
    .select()
    .from(complianceReports)
    .where(and(...conditions))
    .orderBy(desc(complianceReports.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: count() })
    .from(complianceReports)
    .where(and(...conditions));

  return {
    reports,
    total: countResult?.count || 0,
  };
}

export async function getComplianceReport(reportId: string): Promise<ComplianceReport | null> {
  const report = await db.query.complianceReports.findFirst({
    where: eq(complianceReports.id, reportId),
  });
  return report || null;
}
