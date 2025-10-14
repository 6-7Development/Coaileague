import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ModernLayout from "@/components/ModernLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Shift, Employee, Client } from "@shared/schema";

export default function Schedule() {
  const { toast } = useToast();
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    employeeId: "",
    clientId: "",
    startDate: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/shifts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift created successfully",
      });
      setIsAddShiftOpen(false);
      setFormData({
        employeeId: "",
        clientId: "",
        startDate: "",
        startTime: "",
        endTime: "",
        description: "",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/shifts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData("shiftId", shift.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetEmployeeId: string, targetDate: Date) => {
    e.preventDefault();
    const shiftId = e.dataTransfer.getData("shiftId");
    const shift = shifts.find(s => s.id === shiftId);
    
    if (!shift) return;

    const oldStartTime = new Date(shift.startTime);
    const oldEndTime = new Date(shift.endTime);
    const duration = oldEndTime.getTime() - oldStartTime.getTime();

    // Calculate new start and end times on the target date
    const newStartTime = new Date(targetDate);
    newStartTime.setHours(oldStartTime.getHours(), oldStartTime.getMinutes());
    
    const newEndTime = new Date(newStartTime.getTime() + duration);

    updateShiftMutation.mutate({
      id: shiftId,
      data: {
        employeeId: targetEmployeeId,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
      },
    });
  };

  const getWeekDates = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(curr);
      date.setDate(first + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.startDate || !formData.startTime || !formData.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

    createShiftMutation.mutate({
      employeeId: formData.employeeId,
      clientId: formData.clientId || null,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      description: formData.description,
    });
  };

  const getShiftsForEmployeeAndDay = (employeeId: string, date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shift.employeeId === employeeId && shiftDate.toDateString() === date.toDateString();
    });
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : null;
  };

  // Color palette for shifts (matching Sling style)
  const shiftColors = [
    'bg-rose-500/90',
    'bg-amber-500/90',
    'bg-blue-500/90',
    'bg-purple-500/90',
    'bg-emerald-500/90',
    'bg-pink-500/90',
  ];

  const getShiftColor = (clientId: string | null) => {
    if (!clientId) return shiftColors[0];
    const hash = clientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return shiftColors[hash % shiftColors.length];
  };

  const formatDateHeader = (date: Date) => {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return {
      day: dayNames[date.getDay()],
      date: date.getDate()
    };
  };

  const formatWeekRange = () => {
    const startDate = weekDates[0].getDate();
    const endDate = weekDates[6].getDate();
    const month = weekDates[0].toLocaleDateString('en-US', { month: 'short' });
    return `${startDate} - ${endDate} ${month}`;
  };

  return (
    <ModernLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1" data-testid="text-schedule-title">
                Schedule
              </h2>
              <p className="text-sm sm:text-base text-[hsl(var(--cad-text-secondary))]" data-testid="text-schedule-subtitle">
                Week {formatWeekRange()}
              </p>
            </div>
          
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousWeek} data-testid="button-prev-week">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextWeek} data-testid="button-next-week">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-shift">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Shift
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Shift</DialogTitle>
                    <DialogDescription>
                      Schedule a shift and assign an employee
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employee">Employee *</Label>
                        <Select value={formData.employeeId} onValueChange={(value) => setFormData({ ...formData, employeeId: value })}>
                          <SelectTrigger id="employee" data-testid="select-shift-employee">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length === 0 ? (
                              <SelectItem value="none">No employees available</SelectItem>
                            ) : (
                              employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.firstName} {emp.lastName} - {emp.role || "Employee"}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client">Client (Optional)</Label>
                        <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                          <SelectTrigger id="client" data-testid="select-shift-client">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.firstName} {client.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        data-testid="input-shift-date" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input 
                          id="startTime" 
                          type="time" 
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          data-testid="input-shift-start" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time *</Label>
                        <Input 
                          id="endTime" 
                          type="time" 
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          data-testid="input-shift-end" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Shift notes or special instructions..." 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        data-testid="textarea-shift-description" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddShiftOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={createShiftMutation.isPending || employees.length === 0}
                      data-testid="button-save-shift"
                    >
                      {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Sling-style Schedule Grid */}
          <div className="border border-[hsl(var(--cad-border))] rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-8 bg-[hsl(var(--cad-chrome))] border-b border-[hsl(var(--cad-border))]">
              {/* Empty corner cell */}
              <div className="border-r border-[hsl(var(--cad-border))] p-3" />
              
              {/* Date headers */}
              {weekDates.map((date, index) => {
                const { day, date: dayNum } = formatDateHeader(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`p-3 text-center border-r border-[hsl(var(--cad-border))] last:border-r-0 ${
                      isToday ? 'bg-[hsl(var(--cad-blue))]/10' : ''
                    }`}
                  >
                    <div className="text-xs text-[hsl(var(--cad-text-secondary))] font-medium">
                      {day}
                    </div>
                    <div className={`text-lg font-semibold ${
                      isToday ? 'text-[hsl(var(--cad-blue))]' : 'text-[hsl(var(--cad-text-primary))]'
                    }`}>
                      {dayNum}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Employee Rows */}
            {shiftsLoading || employeesLoading ? (
              <div className="p-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[hsl(var(--cad-text-secondary))]">
                  No employees found. Add employees to start scheduling.
                </p>
              </div>
            ) : (
              employees.map((employee, empIndex) => (
                <div
                  key={employee.id}
                  className={`grid grid-cols-8 border-b border-[hsl(var(--cad-border))] last:border-b-0 ${
                    empIndex % 2 === 0 ? 'bg-[hsl(var(--cad-chrome))]/30' : ''
                  }`}
                >
                  {/* Employee name cell */}
                  <div className="border-r border-[hsl(var(--cad-border))] p-3 flex items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-[hsl(var(--cad-text-primary))] truncate">
                        {employee.firstName} {employee.lastName}
                      </div>
                      {employee.role && (
                        <div className="text-xs text-[hsl(var(--cad-text-secondary))] truncate">
                          {employee.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shift cells for each day */}
                  {weekDates.map((date, dateIndex) => {
                    const dayShifts = getShiftsForEmployeeAndDay(employee.id, date);
                    
                    return (
                      <div
                        key={dateIndex}
                        className="border-r border-[hsl(var(--cad-border))] last:border-r-0 p-2 min-h-[80px] relative"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, employee.id, date)}
                        data-testid={`cell-${employee.id}-${dateIndex}`}
                      >
                        <div className="space-y-1">
                          {dayShifts.map((shift) => {
                            const startTime = new Date(shift.startTime);
                            const endTime = new Date(shift.endTime);
                            const clientName = getClientName(shift.clientId);
                            const colorClass = getShiftColor(shift.clientId);
                            
                            return (
                              <div
                                key={shift.id}
                                className={`${colorClass} text-white rounded px-2 py-1.5 cursor-move hover:opacity-90 transition-opacity`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, shift)}
                                data-testid={`shift-${shift.id}`}
                              >
                                <div className="text-xs font-medium leading-tight">
                                  {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </div>
                                {clientName && (
                                  <div className="text-xs opacity-90 truncate">
                                    {clientName}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
