import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export interface ThinkingStep {
  id: string;
  message: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  timestamp: number;
  type: 'analysis' | 'decision' | 'action' | 'review';
}

export interface SchedulingProgressStep {
  shiftId: string;
  step: 'analyzing' | 'matching' | 'assigning' | 'complete' | 'no_match' | 'error';
  message: string;
  progress: number;
  assignedEmployee?: {
    id: string;
    name: string;
    score: number;
  };
  shift?: any;
  businessMetrics?: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgProfitMargin: number;
  };
  thinkingSteps?: ThinkingStep[];
  executionMode?: string;
  creditsCharged?: number;
}

export function useTrinitySchedulingProgress(workspaceId?: string) {
  const [activeProgress, setActiveProgress] = useState<Map<string, SchedulingProgressStep>>(new Map());
  const [completedShifts, setCompletedShifts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!workspaceId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host || 
      (window.location.port 
        ? `${window.location.hostname}:${window.location.port}` 
        : window.location.hostname);
    const wsUrl = `${protocol}://${wsHost}/ws/chat`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('[TrinitySchedulingProgress] WebSocket connected');
        setIsConnected(true);
        
        // Subscribe to scheduling progress for this workspace
        wsRef.current?.send(JSON.stringify({
          type: 'join_scheduling_progress',
          workspaceId,
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'trinity_scheduling_progress') {
            // WebSocket broadcasts wrap payload as { type, data }
            const progress = message.data as SchedulingProgressStep;
            
            console.log('[TrinitySchedulingProgress] Received progress:', progress);
            
            setActiveProgress(prev => {
              const newMap = new Map(prev);
              newMap.set(progress.shiftId, progress);
              return newMap;
            });
            
            if (progress.step === 'complete') {
              toast({
                title: 'Shift Assigned',
                description: progress.message,
              });
              
              // Invalidate shifts query to refetch schedule data
              queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
              
              setTimeout(() => {
                setActiveProgress(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(progress.shiftId);
                  return newMap;
                });
                setCompletedShifts(prev => [...prev, progress.shiftId]);
              }, 3000);
            } else if (progress.step === 'no_match') {
              toast({
                title: 'No Match Found',
                description: progress.message,
                variant: 'destructive',
              });
              
              setTimeout(() => {
                setActiveProgress(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(progress.shiftId);
                  return newMap;
                });
              }, 3000);
            }
          }
          
          if (message.type === 'scheduling_progress_subscribed') {
            console.log('[TrinitySchedulingProgress] Subscribed to workspace:', message.workspaceId);
          }
          
          if (message.type === 'shift_created' || message.type === 'shift_updated' || message.type === 'shift_deleted') {
            console.log('[TrinitySchedulingProgress] Shift update received:', message.type);
            // Invalidate shifts query to sync cross-device
            queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
          }
        } catch (err) {
          console.error('[TrinitySchedulingProgress] Failed to parse message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('[TrinitySchedulingProgress] WebSocket closed, reconnecting...');
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('[TrinitySchedulingProgress] WebSocket error:', error);
      };
    } catch (err) {
      console.error('[TrinitySchedulingProgress] Failed to connect:', err);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const clearProgress = useCallback((shiftId: string) => {
    setActiveProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(shiftId);
      return newMap;
    });
  }, []);

  return {
    activeProgress: Array.from(activeProgress.values()),
    completedShifts,
    clearProgress,
    hasActiveProgress: activeProgress.size > 0,
    isConnected,
  };
}
