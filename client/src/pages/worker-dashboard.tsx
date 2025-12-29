/**
 * Worker Dashboard - Mobile-first dashboard for security guards and field workers
 * 
 * Features:
 * - BIG clock-in/out button (80% of initial viewport)
 * - Today's schedule at a glance
 * - Quick site status
 * - Simplified, touch-optimized interface
 * 
 * This is the primary view for employees on mobile devices
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, differenceInMinutes, addDays } from "date-fns";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Wifi,
  WifiOff,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePageWrapper, MobilePageHeader } from "@/components/mobile-page-wrapper";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ClockStatus {
  isClockedIn: boolean;
  clockInTime?: string;
  currentSiteId?: number;
  currentSiteName?: string;
  totalHoursToday: number;
}

interface TodayShift {
  id: number;
  siteName: string;
  siteAddress: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface UpcomingShift {
  id: number;
  date: string;
  siteName: string;
  startTime: string;
  endTime: string;
}

export default function WorkerDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [clockingIn, setClockingIn] = useState(false);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get clock status
  const { data: clockStatus, isLoading: clockLoading } = useQuery<ClockStatus>({
    queryKey: ['/api/time-entries/status'],
    refetchInterval: 30000,
  });

  // Get today's shifts
  const { data: todayShifts } = useQuery<TodayShift[]>({
    queryKey: ['/api/shifts/today'],
  });

  // Get upcoming shifts (next 3 days)
  const { data: upcomingShifts } = useQuery<UpcomingShift[]>({
    queryKey: ['/api/shifts/upcoming'],
  });

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (action: 'in' | 'out') => {
      setClockingIn(true);
      
      // Get current location
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
        } catch (e) {
          console.log('Location not available');
        }
      }
      
      return apiRequest(
        'POST',
        `/api/time-entries/${action === 'in' ? 'clock-in' : 'clock-out'}`,
        {
          timestamp: new Date().toISOString(),
          location,
        }
      );
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/status'] });
      toast({
        title: action === 'in' ? 'Clocked In' : 'Clocked Out',
        description: `Successfully ${action === 'in' ? 'clocked in' : 'clocked out'} at ${format(new Date(), 'h:mm a')}`,
      });
      
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clock in/out',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setClockingIn(false);
    },
  });

  const handleClockAction = () => {
    const action = clockStatus?.isClockedIn ? 'out' : 'in';
    clockMutation.mutate(action);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const currentTime = format(new Date(), 'h:mm a');
  const currentDate = format(new Date(), 'EEEE, MMMM d');

  return (
    <MobilePageWrapper 
      enablePullToRefresh 
      onRefresh={() => queryClient.invalidateQueries()}
      withBottomNav
      showSeasonalBanner={false}
    >
      {/* Status Bar */}
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-slate-400">
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {currentDate}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        
        {/* BIG Clock In/Out Button */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-4xl font-bold text-white mb-2">
            {currentTime}
          </div>
          
          {clockStatus?.isClockedIn && clockStatus.currentSiteName && (
            <div className="flex items-center gap-2 text-cyan-400 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">{clockStatus.currentSiteName}</span>
            </div>
          )}
          
          <button
            onClick={handleClockAction}
            disabled={clockingIn || clockLoading}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all transform",
              "shadow-2xl active:scale-95",
              clockStatus?.isClockedIn
                ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30"
                : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30",
              clockingIn && "animate-pulse"
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            data-testid="button-clock-action"
          >
            <Clock className={cn(
              "w-16 h-16 mb-2",
              clockingIn ? "animate-spin" : ""
            )} />
            <span className="text-2xl font-bold">
              {clockingIn 
                ? 'Processing...' 
                : clockStatus?.isClockedIn 
                  ? 'CLOCK OUT' 
                  : 'CLOCK IN'}
            </span>
            {clockStatus?.isClockedIn && clockStatus.clockInTime && (
              <span className="text-sm mt-1 opacity-80">
                Since {format(new Date(clockStatus.clockInTime), 'h:mm a')}
              </span>
            )}
          </button>
          
          {clockStatus?.isClockedIn && (
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-white">
                {formatDuration(Math.floor((clockStatus.totalHoursToday || 0) * 60))}
              </div>
              <div className="text-sm text-slate-400">worked today</div>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <Card className="bg-slate-900/50 border-slate-800">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Today's Schedule
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/schedule')}
                className="text-cyan-400"
                data-testid="button-view-schedule"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {todayShifts && todayShifts.length > 0 ? (
              <div className="space-y-3">
                {todayShifts.map((shift) => (
                  <div 
                    key={shift.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      shift.status === 'active' 
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : shift.status === 'completed'
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-slate-800/50 border-slate-700"
                    )}
                    data-testid={`shift-card-${shift.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-white">{shift.siteName}</div>
                        <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(shift.startTime), 'h:mm a')} - {format(new Date(shift.endTime), 'h:mm a')}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {shift.siteAddress}
                        </div>
                      </div>
                      <Badge 
                        variant={shift.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          shift.status === 'completed' && "bg-green-500/20 text-green-400"
                        )}
                      >
                        {shift.status === 'active' ? 'Active' : shift.status === 'completed' ? 'Done' : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No shifts scheduled for today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Shifts */}
        {upcomingShifts && upcomingShifts.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-3">
                Upcoming
              </h2>
              <div className="space-y-2">
                {upcomingShifts.slice(0, 3).map((shift) => (
                  <div 
                    key={shift.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30"
                    data-testid={`upcoming-shift-${shift.id}`}
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{shift.siteName}</div>
                      <div className="text-xs text-slate-400">
                        {format(new Date(shift.date), 'EEE, MMM d')} • {format(new Date(shift.startTime), 'h:mm a')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center gap-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
            onClick={() => setLocation('/chatrooms')}
            data-testid="button-quick-chat"
          >
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="text-xs">Site Photo</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center gap-1 bg-slate-800/50 border-slate-700 hover:bg-slate-800"
            onClick={() => setLocation('/worker/incidents')}
            data-testid="button-quick-incident"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-xs">Report Issue</span>
          </Button>
        </div>
      </div>
    </MobilePageWrapper>
  );
}
