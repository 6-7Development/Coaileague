import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEmployee } from "@/hooks/useEmployee";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  Play, 
  Square, 
  Coffee, 
  CheckCircle, 
  XCircle,
  Timer,
  Users,
  CalendarDays,
  Filter,
  ChevronRight,
  MapPin,
  AlertCircle
} from "lucide-react";
import { format, formatDistance } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

interface ClockStatus {
  isClockedIn: boolean;
  activeTimeEntry: any;
  activeBreak: any;
  employeeId: string;
  employeeName: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: string;
  totalAmount?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

interface ActiveEmployee {
  entryId: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  hoursSoFar: number;
  isOnBreak: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TimeOSPage() {
  const { toast } = useToast();
  const { employee, workspaceRole } = useEmployee();
  const isMobile = useMobile();
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [gpsPermission, setGpsPermission] = useState<string>("prompt");

  // Check GPS permission on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
        setGpsPermission(result.state);
      });
    }
  }, []);

  // Fetch clock status
  const { data: clockStatus, isLoading: statusLoading } = useQuery<ClockStatus>({
    queryKey: ['/api/timeos/status'],
  });

  // Fetch active employees (for managers)
  const { data: activeData, isLoading: activeLoading } = useQuery<{ activeEntries: ActiveEmployee[] }>({
    queryKey: ['/api/timeos/active'],
    enabled: workspaceRole !== 'staff',
  });

  // Fetch time entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/timeos/entries', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      const response = await fetch(`/api/timeos/entries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      return response.json();
    },
  });

  // Get user location helper
  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  // Clock In mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: { latitude?: number; longitude?: number; accuracy?: number; notes?: string }) => {
      const response = await fetch('/api/timeos/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/active'] });
      toast({
        title: "Clocked In",
        description: "Your time entry has been started.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Clock In Failed",
        description: error.message || "Failed to clock in",
      });
    },
  });

  // Clock Out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (data: { latitude?: number; longitude?: number; accuracy?: number; notes?: string }) => {
      const response = await fetch('/api/timeos/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/entries'] });
      toast({
        title: "Clocked Out",
        description: "Your time entry has been completed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Clock Out Failed",
        description: error.message || "Failed to clock out",
      });
    },
  });

  // Start Break mutation
  const startBreakMutation = useMutation({
    mutationFn: async (data: { breakType: string; isPaid: boolean; notes?: string }) => {
      const response = await fetch('/api/timeos/break/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/active'] });
      toast({
        title: "Break Started",
        description: "Your break has been started.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Start Break Failed",
        description: error.message || "Failed to start break",
      });
    },
  });

  // End Break mutation
  const endBreakMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/timeos/break/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/active'] });
      toast({
        title: "Break Ended",
        description: "You're back on the clock.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "End Break Failed",
        description: error.message || "Failed to end break",
      });
    },
  });

  // Approve Entry mutation
  const approveMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/timeos/entries/${entryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/entries'] });
      toast({
        title: "Entry Approved",
        description: "Time entry has been approved.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve entry",
      });
    },
  });

  // Reject Entry mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ entryId, reason }: { entryId: string; reason: string }) => {
      const response = await fetch(`/api/timeos/entries/${entryId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeos/entries'] });
      toast({
        title: "Entry Rejected",
        description: "Time entry has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Failed to reject entry",
      });
    },
  });

  // Handle Clock In
  const handleClockIn = async () => {
    try {
      const position = await getUserLocation();
      await clockInMutation.mutateAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch (error: any) {
      if (error.code === 1) {
        toast({
          variant: "destructive",
          title: "Location Permission Denied",
          description: "Please enable location access to clock in with GPS tracking.",
        });
      } else {
        await clockInMutation.mutateAsync({});
      }
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    try {
      const position = await getUserLocation();
      await clockOutMutation.mutateAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch (error) {
      await clockOutMutation.mutateAsync({});
    }
  };

  // Handle Start Break
  const handleStartBreak = async (breakType: string) => {
    await startBreakMutation.mutateAsync({
      breakType,
      isPaid: breakType === 'rest' ? true : false,
    });
  };

  // Handle End Break
  const handleEndBreak = async () => {
    await endBreakMutation.mutateAsync();
  };

  const canApprove = workspaceRole && ['manager', 'org_admin', 'org_owner'].includes(workspaceRole);

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (statusLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN CONTENT
  // ============================================================================

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">TimeOS™</h1>
        <p className="text-muted-foreground">
          Universal Time Tracking & Clock System
        </p>
      </div>

      {/* Clock Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clock Controls
          </CardTitle>
          <CardDescription>
            {clockStatus?.isClockedIn
              ? `You clocked in at ${clockStatus.activeTimeEntry ? format(new Date(clockStatus.activeTimeEntry.clockIn), 'h:mm a') : 'N/A'}`
              : 'Start your time entry to begin tracking hours'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {!clockStatus?.isClockedIn ? (
              <Button
                onClick={handleClockIn}
                disabled={clockInMutation.isPending}
                size="default"
                data-testid="button-clock-in"
                className="min-w-32"
              >
                <Play className="mr-2 h-4 w-4" />
                Clock In
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                  variant="destructive"
                  size="default"
                  data-testid="button-clock-out"
                  className="min-w-32"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Clock Out
                </Button>

                {!clockStatus.activeBreak ? (
                  <>
                    <Button
                      onClick={() => handleStartBreak('meal')}
                      disabled={startBreakMutation.isPending}
                      variant="outline"
                      size="default"
                      data-testid="button-start-meal-break"
                    >
                      <Coffee className="mr-2 h-4 w-4" />
                      Meal Break
                    </Button>
                    <Button
                      onClick={() => handleStartBreak('rest')}
                      disabled={startBreakMutation.isPending}
                      variant="outline"
                      size="default"
                      data-testid="button-start-rest-break"
                    >
                      <Timer className="mr-2 h-4 w-4" />
                      Rest Break
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEndBreak}
                    disabled={endBreakMutation.isPending}
                    variant="secondary"
                    size="default"
                    data-testid="button-end-break"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    End Break
                  </Button>
                )}
              </>
            )}
          </div>

          {clockStatus?.isClockedIn && clockStatus.activeBreak && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                On {clockStatus.activeBreak.breakType} break
              </p>
              <p className="text-xs text-muted-foreground">
                Started {formatDistance(new Date(clockStatus.activeBreak.startTime), new Date(), { addSuffix: true })}
              </p>
            </div>
          )}

          {gpsPermission === 'denied' && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-amber-500">Location Access Disabled</p>
                <p className="text-muted-foreground">
                  GPS tracking enhances time entry accuracy. Enable location in your browser settings.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Employees - Only for managers */}
      {canApprove && !activeLoading && activeData?.activeEntries && activeData.activeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Currently Clocked In
            </CardTitle>
            <CardDescription>
              {activeData.activeEntries.length} employee(s) on the clock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeData.activeEntries.map((emp: ActiveEmployee) => (
                <div
                  key={emp.entryId}
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                  data-testid={`active-employee-${emp.employeeId}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{emp.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {emp.hoursSoFar.toFixed(2)}h so far • Clocked in {formatDistance(new Date(emp.clockIn), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                  {emp.isOnBreak && (
                    <Badge variant="secondary" className="ml-2">
                      <Coffee className="mr-1 h-3 w-3" />
                      On Break
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timesheet Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Timesheet
              </CardTitle>
              <CardDescription>
                View and manage time entries
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40" data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !entriesData?.entries || entriesData.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No time entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesData.entries.map((entry: TimeEntry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setDetailsDialogOpen(true);
                      }}
                      data-testid={`timesheet-row-${entry.id}`}
                    >
                      <TableCell className="font-medium">
                        {entry.employeeName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.clockIn), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        {entry.clockOut ? format(new Date(entry.clockOut), 'MMM d, h:mm a') : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.totalHours ? `${entry.totalHours}h` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === 'approved' ? 'default' :
                            entry.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                          data-testid={`status-badge-${entry.id}`}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      {canApprove && (
                        <TableCell className="text-right">
                          {entry.status === 'pending' && entry.clockOut && (
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveMutation.mutate(entry.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${entry.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const reason = prompt("Enter rejection reason:");
                                  if (reason) {
                                    rejectMutation.mutate({ entryId: entry.id, reason });
                                  }
                                }}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${entry.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Time Entry Details</DialogTitle>
            <DialogDescription>
              View complete information for this time entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Employee</Label>
                  <p className="text-sm font-medium">{selectedEntry.employeeName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={selectedEntry.status === 'approved' ? 'default' : selectedEntry.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {selectedEntry.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Clock In</Label>
                  <p className="text-sm">{format(new Date(selectedEntry.clockIn), 'PPp')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Clock Out</Label>
                  <p className="text-sm">
                    {selectedEntry.clockOut ? format(new Date(selectedEntry.clockOut), 'PPp') : 'Still active'}
                  </p>
                </div>
              </div>

              {selectedEntry.totalHours && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Total Hours</Label>
                  <p className="text-2xl font-bold">{selectedEntry.totalHours}h</p>
                </div>
              )}

              {selectedEntry.notes && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedEntry.notes}</p>
                </div>
              )}

              {selectedEntry.approvedAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Approved At</Label>
                  <p className="text-sm">{format(new Date(selectedEntry.approvedAt), 'PPp')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
