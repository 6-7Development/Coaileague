/**
 * USE TRINITY WEBSOCKET HOOK
 * ==========================
 * Uses the existing global WebSocket connection for Trinity Agent updates.
 * Subscribes to Trinity agent events via message type filtering.
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface TrinityStreamEvent {
  event: string;
  data: any;
  timestamp: number;
}

interface UseTrinityWebSocketOptions {
  conversationId: string;
  enabled?: boolean;
  onEvent?: (event: TrinityStreamEvent) => void;
}

interface UseTrinityWebSocketReturn {
  isConnected: boolean;
  lastEvent: TrinityStreamEvent | null;
  send: (message: any) => void;
  disconnect: () => void;
}

export function useTrinityWebSocket(options: UseTrinityWebSocketOptions): UseTrinityWebSocketReturn {
  const { conversationId, enabled = true, onEvent } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<TrinityStreamEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !conversationId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log('[TrinityWebSocket] Connected to main WebSocket');
        
        ws.send(JSON.stringify({
          type: 'trinity_agent_subscribe',
          conversationId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.type?.startsWith('trinity_agent_') || 
              parsed.type === 'trinity_stream' ||
              parsed.event?.toLowerCase().includes('thinking') ||
              parsed.event?.toLowerCase().includes('progress') ||
              parsed.event?.toLowerCase().includes('business_impact') ||
              parsed.event?.toLowerCase().includes('cost') ||
              parsed.event?.toLowerCase().includes('undo') ||
              parsed.event?.toLowerCase().includes('confidence') ||
              parsed.event?.toLowerCase().includes('error')) {
            
            const streamEvent: TrinityStreamEvent = {
              event: parsed.event || parsed.type,
              data: parsed.data || parsed,
              timestamp: parsed.timestamp || Date.now()
            };
            setLastEvent(streamEvent);
            onEvent?.(streamEvent);
          }
        } catch (error) {
          console.error('[TrinityWebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[TrinityWebSocket] Error:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        
        if (enabled && reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[TrinityWebSocket] Failed to connect:', error);
    }
  }, [conversationId, enabled, onEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    send,
    disconnect
  };
}

/**
 * Hook to subscribe to specific Trinity events
 */
export function useTrinityEvent<T = any>(
  eventType: string,
  callback?: (data: T) => void
): T | null {
  const [data, setData] = useState<T | null>(null);

  // This hook is designed to work with TrinityAgentProvider context
  // For now, return null - will be enhanced when integrated with context
  useEffect(() => {
    if (callback && data) {
      callback(data);
    }
  }, [data, callback]);

  return data;
}
