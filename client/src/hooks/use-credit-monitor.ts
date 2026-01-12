/**
 * Credit Monitoring Hook
 * ======================
 * Real-time credit balance sync via WebSocket
 * - Cross-device sync on credit changes
 * - Low-balance alerts with thresholds
 * - Automatic refetch on credit updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CreditBalance {
  id: string;
  workspaceId: string;
  currentBalance: number;
  monthlyAllocation: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  totalCreditsPurchased: number;
  lastResetAt: string | null;
  nextResetAt: string | null;
  isActive: boolean;
  isSuspended: boolean;
  tier: string;
  subscriptionTier: string;
  unlimitedCredits?: boolean;
}

export interface CreditAlert {
  type: 'low' | 'critical' | 'purchase' | 'deduction';
  message: string;
  balance: number;
  timestamp: number;
}

const LOW_BALANCE_THRESHOLD = 0.2; // 20% of monthly allocation
const CRITICAL_BALANCE_THRESHOLD = 0.05; // 5% of monthly allocation

export function useCreditMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<CreditAlert[]>([]);
  const lastBalanceRef = useRef<number | null>(null);
  const alertShownRef = useRef<{ low: boolean; critical: boolean }>({ low: false, critical: false });

  const { data: balance, isLoading, refetch } = useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
    refetchInterval: 60000,
    staleTime: 15000,
  });

  const isUnlimited = balance?.unlimitedCredits === true || 
    balance?.monthlyAllocation === -1 || 
    (balance?.monthlyAllocation && balance.monthlyAllocation > 999999);

  const isLow = !isUnlimited && balance ? 
    balance.currentBalance < (balance.monthlyAllocation * LOW_BALANCE_THRESHOLD) : false;
  
  const isCritical = !isUnlimited && balance ? 
    balance.currentBalance < (balance.monthlyAllocation * CRITICAL_BALANCE_THRESHOLD) : false;

  const percentRemaining = balance && !isUnlimited ? 
    Math.max(0, (balance.currentBalance / balance.monthlyAllocation) * 100) : 100;

  const addAlert = useCallback((alert: Omit<CreditAlert, 'timestamp'>) => {
    setAlerts(prev => [{
      ...alert,
      timestamp: Date.now(),
    }, ...prev.slice(0, 9)]);
  }, []);

  const connect = useCallback(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host;
    const wsUrl = `${protocol}://${wsHost}/ws/chat`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[CreditMonitor] WebSocket connected');
        setIsConnected(true);
        wsRef.current?.send(JSON.stringify({
          type: 'join_credit_updates',
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'credit_balance_updated' || message.type === 'credits_deducted' || message.type === 'credits_added') {
            console.log('[CreditMonitor] Credit update received:', message.type);
            
            queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
            queryClient.invalidateQueries({ queryKey: ['/api/credits/usage-breakdown'] });
            
            if (message.data?.newBalance !== undefined) {
              const oldBalance = lastBalanceRef.current;
              const newBalance = message.data.newBalance;
              
              if (oldBalance !== null) {
                if (newBalance < oldBalance) {
                  addAlert({
                    type: 'deduction',
                    message: `${oldBalance - newBalance} credits used`,
                    balance: newBalance,
                  });
                } else if (newBalance > oldBalance) {
                  addAlert({
                    type: 'purchase',
                    message: `${newBalance - oldBalance} credits added`,
                    balance: newBalance,
                  });
                  
                  toast({
                    title: 'Credits Added',
                    description: `${newBalance - oldBalance} credits have been added to your account`,
                  });
                }
              }
            }
          }

          if (message.type === 'credit_update_subscribed') {
            console.log('[CreditMonitor] Subscribed to credit updates');
          }
        } catch (err) {
          console.error('[CreditMonitor] Failed to parse message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('[CreditMonitor] WebSocket closed, reconnecting...');
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[CreditMonitor] WebSocket error:', error);
      };
    } catch (err) {
      console.error('[CreditMonitor] Failed to connect:', err);
    }
  }, [user, queryClient, toast, addAlert]);

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

  useEffect(() => {
    if (!balance || isUnlimited) return;

    lastBalanceRef.current = balance.currentBalance;

    if (isCritical && !alertShownRef.current.critical) {
      alertShownRef.current.critical = true;
      toast({
        title: 'Credits Critically Low',
        description: `Only ${balance.currentBalance} credits remaining. AI automations may pause.`,
        variant: 'destructive',
      });
      addAlert({
        type: 'critical',
        message: 'Credits critically low - automations at risk',
        balance: balance.currentBalance,
      });
    } else if (isLow && !isCritical && !alertShownRef.current.low) {
      alertShownRef.current.low = true;
      toast({
        title: 'Credits Running Low',
        description: `${balance.currentBalance} credits remaining (${percentRemaining.toFixed(0)}%)`,
      });
      addAlert({
        type: 'low',
        message: 'Credit balance is running low',
        balance: balance.currentBalance,
      });
    }

    if (!isLow && !isCritical) {
      alertShownRef.current = { low: false, critical: false };
    }
  }, [balance, isLow, isCritical, isUnlimited, toast, addAlert, percentRemaining]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    balance,
    isLoading,
    isConnected,
    isUnlimited,
    isLow,
    isCritical,
    percentRemaining,
    alerts,
    clearAlerts,
    refetch,
    daysUntilReset: balance?.nextResetAt
      ? Math.ceil((new Date(balance.nextResetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0,
  };
}
