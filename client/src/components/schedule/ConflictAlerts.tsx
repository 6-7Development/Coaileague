/**
 * Conflict Alerts - Visual indicators for scheduling issues
 * Detects overtime, double-booking, insufficient rest, missing certifications
 */

import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, Clock, Calendar, Users, Shield, 
  ChevronDown, X, CheckCircle 
} from 'lucide-react';
import { format, differenceInHours, differenceInDays, parseISO } from 'date-fns';
import type { Shift, Employee } from '@shared/schema';

export interface ScheduleConflict {
  id: string;
  type: 'overtime' | 'double_booked' | 'insufficient_rest' | 'consecutive_days' | 'missing_cert';
  severity: 'warning' | 'error';
  employeeId: string;
  employeeName: string;
  message: string;
  details: string;
  shiftIds: string[];
}

interface ConflictAlertsProps {
  shifts: Shift[];
  employees: Employee[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onDismissConflict?: (conflictId: string) => void;
  onResolve?: (shiftId: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export function ConflictAlerts({
  shifts,
  employees,
  isCollapsed = false,
  onToggleCollapse,
  onDismissConflict,
  onResolve,
  onDismiss,
  className = '',
}: ConflictAlertsProps) {
  const conflicts = useMemo(() => {
    return detectConflicts(shifts, employees);
  }, [shifts, employees]);

  const errorCount = conflicts.filter(c => c.severity === 'error').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;

  if (conflicts.length === 0) {
    return null;
  }

  const getIcon = (type: ScheduleConflict['type']) => {
    switch (type) {
      case 'overtime':
        return <Clock className="w-4 h-4" />;
      case 'double_booked':
        return <Calendar className="w-4 h-4" />;
      case 'insufficient_rest':
        return <AlertTriangle className="w-4 h-4" />;
      case 'consecutive_days':
        return <Users className="w-4 h-4" />;
      case 'missing_cert':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapse}>
      <Card className={`border-amber-500/50 ${className}`} data-testid="conflict-alerts">
        <CardHeader className="py-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Schedule Conflicts
              <div className="flex gap-1 ml-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} Critical
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500">
                    {warningCount} Warnings
                  </Badge>
                )}
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              {onDismiss && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
                  <X className="w-3 h-3" />
                </Button>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {conflicts.map(conflict => (
                  <Alert 
                    key={conflict.id}
                    variant={conflict.severity === 'error' ? 'destructive' : 'default'}
                    className="py-2"
                    data-testid={`conflict-${conflict.id}`}
                  >
                    <div className="flex items-start gap-2">
                      {getIcon(conflict.type)}
                      <div className="flex-1 min-w-0">
                        <AlertTitle className="text-sm mb-1">
                          {conflict.employeeName}: {conflict.message}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {conflict.details}
                        </AlertDescription>
                      </div>
                      <div className="flex gap-1">
                        {onResolve && conflict.shiftIds.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onResolve(conflict.shiftIds[0])}
                          >
                            Resolve
                          </Button>
                        )}
                        {onDismissConflict && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onDismissConflict(conflict.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function detectConflicts(shifts: Shift[], employees: Employee[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const employeeMap = new Map(employees.map(e => [e.id, e]));

  const shiftsByEmployee = new Map<string, Shift[]>();
  shifts.forEach(shift => {
    if (shift.employeeId) {
      const empShifts = shiftsByEmployee.get(shift.employeeId) || [];
      empShifts.push(shift);
      shiftsByEmployee.set(shift.employeeId, empShifts);
    }
  });

  shiftsByEmployee.forEach((empShifts, employeeId) => {
    const employee = employeeMap.get(employeeId);
    if (!employee) return;

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const sortedShifts = empShifts.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let totalHours = 0;
    sortedShifts.forEach(shift => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });

    if (totalHours > 40) {
      conflicts.push({
        id: `overtime-${employeeId}`,
        type: 'overtime',
        severity: totalHours > 50 ? 'error' : 'warning',
        employeeId,
        employeeName,
        message: 'Overtime Warning',
        details: `${totalHours.toFixed(1)} hours scheduled (${(totalHours - 40).toFixed(1)}h overtime)`,
        shiftIds: sortedShifts.map(s => s.id),
      });
    }

    for (let i = 0; i < sortedShifts.length; i++) {
      for (let j = i + 1; j < sortedShifts.length; j++) {
        const shiftA = sortedShifts[i];
        const shiftB = sortedShifts[j];
        
        const aStart = new Date(shiftA.startTime).getTime();
        const aEnd = new Date(shiftA.endTime).getTime();
        const bStart = new Date(shiftB.startTime).getTime();
        const bEnd = new Date(shiftB.endTime).getTime();

        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push({
            id: `double-${shiftA.id}-${shiftB.id}`,
            type: 'double_booked',
            severity: 'error',
            employeeId,
            employeeName,
            message: 'Double Booked',
            details: `Overlapping shifts on ${format(new Date(shiftA.startTime), 'EEE, MMM d')}`,
            shiftIds: [shiftA.id, shiftB.id],
          });
        }
      }
    }

    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentEnd = new Date(sortedShifts[i].endTime);
      const nextStart = new Date(sortedShifts[i + 1].startTime);
      const restHours = differenceInHours(nextStart, currentEnd);

      if (restHours < 8 && restHours >= 0) {
        conflicts.push({
          id: `rest-${sortedShifts[i].id}-${sortedShifts[i + 1].id}`,
          type: 'insufficient_rest',
          severity: 'warning',
          employeeId,
          employeeName,
          message: 'Insufficient Rest',
          details: `Only ${restHours}h between shifts (minimum 8h recommended)`,
          shiftIds: [sortedShifts[i].id, sortedShifts[i + 1].id],
        });
      }
    }

    if (sortedShifts.length >= 7) {
      const shiftDates = new Set(
        sortedShifts.map(s => format(new Date(s.startTime), 'yyyy-MM-dd'))
      );
      if (shiftDates.size >= 7) {
        conflicts.push({
          id: `consecutive-${employeeId}`,
          type: 'consecutive_days',
          severity: 'warning',
          employeeId,
          employeeName,
          message: 'Consecutive Days',
          details: `Scheduled ${shiftDates.size} consecutive days without break`,
          shiftIds: sortedShifts.map(s => s.id),
        });
      }
    }
  });

  return conflicts;
}

export function getShiftConflictBadge(
  shift: Shift, 
  allShifts: Shift[], 
  employees: Employee[]
): { type: string; severity: 'warning' | 'error' } | null {
  if (!shift.employeeId) return null;
  
  const employee = employees.find(e => e.id === shift.employeeId);
  if (!employee) return null;

  const empShifts = allShifts.filter(s => s.employeeId === shift.employeeId);
  
  for (const other of empShifts) {
    if (other.id === shift.id) continue;
    
    const aStart = new Date(shift.startTime).getTime();
    const aEnd = new Date(shift.endTime).getTime();
    const bStart = new Date(other.startTime).getTime();
    const bEnd = new Date(other.endTime).getTime();

    if (aStart < bEnd && bStart < aEnd) {
      return { type: 'Double Booked', severity: 'error' };
    }
  }

  let totalHours = 0;
  empShifts.forEach(s => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  });

  if (totalHours > 40) {
    return { type: 'Overtime', severity: totalHours > 50 ? 'error' : 'warning' };
  }

  return null;
}

/**
 * Time Clock Status - GetSling-style shift status indicators
 * Returns visual status based on current time vs shift times and clock in/out status
 */
export type TimeClockStatus = 
  | 'scheduled'    // Future shift, not started
  | 'clocked_in'   // Currently working
  | 'on_break'     // On break during shift
  | 'late'         // Should have started, not clocked in
  | 'early_clock'  // Clocked in before shift start
  | 'completed'    // Shift finished and clocked out
  | 'missed'       // Past shift, never clocked in
  | 'overtime';    // Still clocked in past end time

export interface TimeClockInfo {
  status: TimeClockStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: 'clock' | 'check' | 'alert' | 'play' | 'pause' | 'x';
}

export function getShiftTimeClockStatus(
  shift: Shift,
  now: Date = new Date()
): TimeClockInfo {
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const currentTime = now.getTime();
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  
  // Check if shift has actual clock in/out times
  const hasClockIn = !!shift.actualClockIn;
  const hasClockOut = !!shift.actualClockOut;
  const actualClockIn = shift.actualClockIn ? new Date(shift.actualClockIn).getTime() : null;
  const actualClockOut = shift.actualClockOut ? new Date(shift.actualClockOut).getTime() : null;
  
  // Completed: has both clock in and out
  if (hasClockIn && hasClockOut) {
    return {
      status: 'completed',
      label: 'Completed',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: 'check',
    };
  }
  
  // Currently clocked in
  if (hasClockIn && !hasClockOut) {
    // Check if past end time (overtime)
    if (currentTime > endMs) {
      return {
        status: 'overtime',
        label: 'Overtime',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        icon: 'alert',
      };
    }
    // Normal working
    return {
      status: 'clocked_in',
      label: 'Working',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'play',
    };
  }
  
  // Not clocked in yet
  if (!hasClockIn) {
    // Future shift
    if (currentTime < startMs) {
      // Check for early clock allowance (15 min before)
      if (currentTime > startMs - 15 * 60 * 1000) {
        return {
          status: 'scheduled',
          label: 'Ready',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          icon: 'clock',
        };
      }
      return {
        status: 'scheduled',
        label: 'Scheduled',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: 'clock',
      };
    }
    
    // Should have started - late
    if (currentTime >= startMs && currentTime < endMs) {
      // Grace period: 5 minutes
      if (currentTime < startMs + 5 * 60 * 1000) {
        return {
          status: 'scheduled',
          label: 'Starting',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: 'clock',
        };
      }
      return {
        status: 'late',
        label: 'Late',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: 'alert',
      };
    }
    
    // Past shift, never clocked in
    if (currentTime > endMs) {
      return {
        status: 'missed',
        label: 'No Show',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: 'x',
      };
    }
  }
  
  // Default: scheduled
  return {
    status: 'scheduled',
    label: 'Scheduled',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: 'clock',
  };
}
