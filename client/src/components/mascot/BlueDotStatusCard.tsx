/**
 * Blue Dot Status Card - Empire Mode Precision Maintenance UI
 * 
 * Displays real-time maintenance status with:
 * - Cryptographic signature verification badge
 * - Live countdown timer to scheduled maintenance
 * - "God Mode" messaging when Trinity is performing surgery
 * - Maintenance history and scheduled windows
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Sparkles,
  Lock,
  Eye,
  Timer,
  Activity
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface MaintenanceWindow {
  id: string;
  taskType: string;
  scheduledFor: string;
  signature: string;
  estimatedDuration: number;
}

interface BlueDotStatus {
  active: boolean;
  startedAt: string | null;
  estimatedCompletion: string | null;
  currentTask: string | null;
  progress: number;
  maintenanceWindows: MaintenanceWindow[];
  lastMaintenance: {
    completedAt: string;
    duration: number;
    tasksCompleted: number;
  } | null;
}

interface BlueDotStatusCardProps {
  isGuru?: boolean;
  workspaceId?: string;
  className?: string;
}

function formatCountdown(targetDate: string): string {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  
  if (diff <= 0) return "Imminent";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m ${seconds}s`;
}

function truncateSignature(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

export function BlueDotStatusCard({ isGuru = false, workspaceId, className = "" }: BlueDotStatusCardProps) {
  const [countdown, setCountdown] = useState<string>("");
  const [nextWindow, setNextWindow] = useState<MaintenanceWindow | null>(null);

  const statusUrl = workspaceId 
    ? `/api/trinity/bluedot/status?workspaceId=${workspaceId}` 
    : '/api/trinity/bluedot/status';

  const statusQueryKey = ['/api/trinity/bluedot/status', workspaceId || 'global'];

  const { data: statusData, isLoading, error } = useQuery<{ success: boolean; status: BlueDotStatus; godModeMessage: string | null }>({
    queryKey: statusQueryKey,
    queryFn: async () => {
      const res = await fetch(statusUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch Blue Dot status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const simulateMutation = useMutation({
    mutationFn: async (repairs: string[]) => {
      return apiRequest('POST', '/api/trinity/bluedot/simulate', { repairs, workspaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/bluedot/status'] });
    },
  });

  const initiateMutation = useMutation({
    mutationFn: async (repairs: string[]) => {
      return apiRequest('POST', '/api/trinity/bluedot/initiate', { repairs, workspaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/bluedot/status'] });
    },
  });

  const status = statusData?.status;
  const godModeMessage = statusData?.godModeMessage;
  const isActive = status?.active || false;

  const handleSimulate = useCallback(() => {
    if (isActive) return;
    const defaultRepairs = ['db_optimization', 'cache_cleanup', 'index_rebuild'];
    simulateMutation.mutate(defaultRepairs);
  }, [simulateMutation, isActive]);

  const handleInitiate = useCallback(() => {
    if (isActive) return;
    const defaultRepairs = ['db_optimization', 'cache_cleanup'];
    initiateMutation.mutate(defaultRepairs);
  }, [initiateMutation, isActive]);

  useEffect(() => {
    if (!status?.maintenanceWindows?.length) {
      setNextWindow(null);
      setCountdown("");
      return;
    }

    const upcoming = status.maintenanceWindows
      .filter(w => new Date(w.scheduledFor) > new Date())
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())[0];

    setNextWindow(upcoming || null);

    if (upcoming) {
      const timer = setInterval(() => {
        setCountdown(formatCountdown(upcoming.scheduledFor));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status?.maintenanceWindows]);

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-500/30`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Blue Dot Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to fetch maintenance status. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isActive ? 'border-cyan-500/50 shadow-cyan-500/20 shadow-lg' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`relative ${isActive ? 'animate-pulse' : ''}`}>
              <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-slate-400'}`} />
              {isActive && (
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-cyan-400 animate-ping opacity-75" />
              )}
            </div>
            Blue Dot Protocol
          </CardTitle>
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : ""}
          >
            {isActive ? "Active" : "Standby"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {godModeMessage && isActive && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-cyan-300">Trinity Speaking</p>
                <p className="text-sm text-cyan-200/80 italic mt-1">"{godModeMessage}"</p>
              </div>
            </div>
          </div>
        )}

        {isActive && status?.currentTask && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Current Task
              </span>
              <span className="font-mono text-xs">{status.currentTask}</span>
            </div>
            <Progress value={status.progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{status.progress}% complete</p>
          </div>
        )}

        {nextWindow && !isActive && (
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                Next Maintenance
              </span>
              <span className="font-mono text-lg text-cyan-400">{countdown}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{nextWindow.taskType}</span>
              <span className="text-muted-foreground">~{nextWindow.estimatedDuration}min</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Shield className="h-3 w-3" />
              <span className="font-mono">{truncateSignature(nextWindow.signature)}</span>
              <CheckCircle2 className="h-3 w-3 ml-auto" />
            </div>
          </div>
        )}

        {!isActive && !nextWindow && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All systems optimal</p>
            <p className="text-xs text-muted-foreground mt-1">No maintenance scheduled</p>
          </div>
        )}

        {status?.lastMaintenance && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Last Maintenance</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {new Date(status.lastMaintenance.completedAt).toLocaleDateString()}
              </span>
              <span className="text-emerald-400">
                {status.lastMaintenance.tasksCompleted} tasks in {status.lastMaintenance.duration}s
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {isGuru && (
        <CardFooter className="pt-0 gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 min-w-[100px]" 
            data-testid="button-bluedot-simulate"
            onClick={handleSimulate}
            disabled={simulateMutation.isPending || isActive}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            {simulateMutation.isPending ? 'Simulating...' : 'Simulate'}
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className="flex-1 min-w-[100px] bg-cyan-600 hover:bg-cyan-700" 
            data-testid="button-bluedot-initiate"
            onClick={handleInitiate}
            disabled={initiateMutation.isPending || isActive}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {initiateMutation.isPending ? 'Initiating...' : 'Initiate'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default BlueDotStatusCard;
