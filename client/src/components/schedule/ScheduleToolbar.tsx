/**
 * Schedule Toolbar - GetSling-style action bar with core workforce management actions
 * All actions connect to Trinity orchestration for automation
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, ClipboardList, Clock, MessageSquare, BarChart3, 
  Users, Send, Settings, ChevronDown, Bot, Calendar,
  FileText, Download, Mail, Smartphone, Bell
} from 'lucide-react';
import { TrinityIconStatic } from '@/components/trinity-button';

interface ScheduleToolbarProps {
  isManager: boolean;
  weekStart: Date;
  weekEnd: Date;
  weekDisplay: string;
  scheduleStats?: {
    totalShifts: number;
    publishedShifts: number;
    draftShifts: number;
    laborCost: number;
  };
  onCreateShift: () => void;
  onOpenTasks: () => void;
  onOpenTimeClock: () => void;
  onOpenMessages: () => void;
  onOpenReports: () => void;
  onOpenAvailability: () => void;
  onOpenSettings: () => void;
  onAutoSchedule: () => void;
}

export function ScheduleToolbar({
  isManager,
  weekStart,
  weekEnd,
  weekDisplay,
  scheduleStats,
  onCreateShift,
  onOpenTasks,
  onOpenTimeClock,
  onOpenMessages,
  onOpenReports,
  onOpenAvailability,
  onOpenSettings,
  onAutoSchedule,
}: ScheduleToolbarProps) {
  const { toast } = useToast();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishOptions, setPublishOptions] = useState({
    notifySms: true,
    notifyEmail: true,
    notifyPush: true,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/schedules/publish', {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        ...publishOptions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/week/stats'] });
      setShowPublishDialog(false);
      toast({
        title: 'Schedule Published',
        description: 'All employees have been notified of their shifts',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Publish Failed',
        description: error.message,
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/schedules/unpublish', {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Schedule Unpublished',
        description: 'Schedule is now in draft mode',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Unpublish Failed',
        description: error.message,
      });
    },
  });

  const isFullyPublished = scheduleStats && scheduleStats.totalShifts > 0 && 
    scheduleStats.publishedShifts === scheduleStats.totalShifts;
  const hasDrafts = scheduleStats && scheduleStats.draftShifts > 0;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap" data-testid="schedule-toolbar">
        {isManager && (
          <>
            <Button 
              size="sm" 
              onClick={onCreateShift}
              data-testid="button-create-shift"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Shift
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenTasks}
              data-testid="button-tasks"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Tasks
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenTimeClock}
              data-testid="button-time-clock"
            >
              <Clock className="w-4 h-4 mr-1" />
              Time Clock
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenMessages}
              data-testid="button-messages"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Messages
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-reports">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Reports
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenReports} data-testid="menu-labor-cost">
                  <FileText className="w-4 h-4 mr-2" />
                  Labor Cost Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenReports} data-testid="menu-hours-summary">
                  <Clock className="w-4 h-4 mr-2" />
                  Hours Worked Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenReports} data-testid="menu-adherence">
                  <Users className="w-4 h-4 mr-2" />
                  Schedule Adherence
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenReports} data-testid="menu-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel/PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenAvailability}
              data-testid="button-availability"
            >
              <Users className="w-4 h-4 mr-1" />
              Availability
            </Button>

            <Button
              variant={hasDrafts ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPublishDialog(true)}
              data-testid="button-publish"
            >
              <Send className="w-4 h-4 mr-1" />
              {isFullyPublished ? 'Published' : 'Publish'}
              {hasDrafts && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {scheduleStats?.draftShifts}
                </Badge>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAutoSchedule}
              className="text-primary"
              data-testid="button-auto-schedule"
            >
              <TrinityIconStatic className="w-4 h-4 mr-1" />
              Auto-Schedule
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onOpenSettings}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Publish Schedule</DialogTitle>
            <DialogDescription>
              Publish schedule for {weekDisplay}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Preview:</strong></p>
              <p>{scheduleStats?.totalShifts || 0} shifts</p>
              <p>${scheduleStats?.laborCost?.toLocaleString() || 0} estimated labor cost</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Notify employees via:</p>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-sms"
                  checked={publishOptions.notifySms}
                  onCheckedChange={(checked) => 
                    setPublishOptions(prev => ({ ...prev, notifySms: !!checked }))
                  }
                />
                <Label htmlFor="notify-sms" className="flex items-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  SMS
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-email"
                  checked={publishOptions.notifyEmail}
                  onCheckedChange={(checked) => 
                    setPublishOptions(prev => ({ ...prev, notifyEmail: !!checked }))
                  }
                />
                <Label htmlFor="notify-email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notify-push"
                  checked={publishOptions.notifyPush}
                  onCheckedChange={(checked) => 
                    setPublishOptions(prev => ({ ...prev, notifyPush: !!checked }))
                  }
                />
                <Label htmlFor="notify-push" className="flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  App Push Notification
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Confirm Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
