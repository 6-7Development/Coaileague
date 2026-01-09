/**
 * TRINITY WEBSOCKET SERVICE
 * =========================
 * Real-time streaming service for Trinity Agent updates.
 * Enables live streaming of thinking steps, progress, and business impact
 * to the frontend UI components.
 */

import type { StreamEvent } from '../agent/goalExecutionService';
import { platformEventBus } from '../../platformEventBus';

interface Connection {
  id: string;
  conversationId: string;
  userId: string;
  workspaceId: string;
  lastActivity: Date;
  messageQueue: StreamEvent[];
  send: (data: string) => void;
  close: () => void;
}

class TrinityWebSocketService {
  private static instance: TrinityWebSocketService;
  private connections: Map<string, Connection> = new Map();
  private conversationConnections: Map<string, Set<string>> = new Map();
  
  private readonly heartbeatInterval = 30000;
  private readonly connectionTimeout = 300000; // 5 minutes

  private constructor() {
    console.log('[TrinityWebSocket] Initializing real-time streaming service...');
    this.setupPlatformEventListener();
    this.startHeartbeat();
  }

  static getInstance(): TrinityWebSocketService {
    if (!TrinityWebSocketService.instance) {
      TrinityWebSocketService.instance = new TrinityWebSocketService();
    }
    return TrinityWebSocketService.instance;
  }

  /**
   * Listen for platform events to stream to connected clients
   */
  private setupPlatformEventListener(): void {
    platformEventBus.on('trinity:stream', (payload: { conversationId: string; event: StreamEvent }) => {
      this.broadcast(payload.conversationId, payload.event);
    });
  }

  /**
   * Start heartbeat to clean up stale connections
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, connection] of this.connections.entries()) {
        if (now - connection.lastActivity.getTime() > this.connectionTimeout) {
          this.disconnect(id);
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Register a new WebSocket connection
   */
  connect(
    connectionId: string,
    conversationId: string,
    userId: string,
    workspaceId: string,
    sendFn: (data: string) => void,
    closeFn: () => void
  ): void {
    const connection: Connection = {
      id: connectionId,
      conversationId,
      userId,
      workspaceId,
      lastActivity: new Date(),
      messageQueue: [],
      send: sendFn,
      close: closeFn
    };

    this.connections.set(connectionId, connection);
    
    // Track by conversation
    const convConnections = this.conversationConnections.get(conversationId) || new Set();
    convConnections.add(connectionId);
    this.conversationConnections.set(conversationId, convConnections);

    console.log(`[TrinityWebSocket] Connection registered: ${connectionId} for conversation ${conversationId}`);
    
    // Send welcome message
    this.send(connectionId, {
      type: 'THINKING_STEP',
      data: { status: 'active', message: 'Connected to Trinity Agent' },
      timestamp: Date.now()
    });
  }

  /**
   * Disconnect a WebSocket connection
   */
  disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from conversation tracking
    const convConnections = this.conversationConnections.get(connection.conversationId);
    if (convConnections) {
      convConnections.delete(connectionId);
      if (convConnections.size === 0) {
        this.conversationConnections.delete(connection.conversationId);
      }
    }

    // Close and remove
    try {
      connection.close();
    } catch (error) {
      // Ignore close errors
    }
    
    this.connections.delete(connectionId);
    console.log(`[TrinityWebSocket] Connection disconnected: ${connectionId}`);
  }

  /**
   * Send a message to a specific connection
   */
  send(connectionId: string, event: StreamEvent): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      connection.send(JSON.stringify({
        event: event.type.toLowerCase(),
        data: event.data,
        timestamp: event.timestamp
      }));
      connection.lastActivity = new Date();
    } catch (error) {
      console.error(`[TrinityWebSocket] Failed to send to ${connectionId}:`, error);
      this.disconnect(connectionId);
    }
  }

  /**
   * Broadcast to all connections for a conversation
   */
  broadcast(conversationId: string, event: StreamEvent): void {
    const connectionIds = this.conversationConnections.get(conversationId);
    if (!connectionIds) return;

    for (const connectionId of connectionIds) {
      this.send(connectionId, event);
    }
  }

  /**
   * Emit an event to a specific conversation
   */
  emit(conversationId: string, eventType: string, data: any): void {
    this.broadcast(conversationId, {
      type: eventType as StreamEvent['type'],
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get connection count for a conversation
   */
  getConnectionCount(conversationId: string): number {
    return this.conversationConnections.get(conversationId)?.size || 0;
  }

  /**
   * Handle incoming message from client
   */
  handleMessage(connectionId: string, message: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = new Date();

    try {
      const parsed = JSON.parse(message);
      
      switch (parsed.type) {
        case 'ping':
          this.send(connectionId, {
            type: 'THINKING_STEP',
            data: { type: 'pong' },
            timestamp: Date.now()
          });
          break;
          
        case 'subscribe':
          // Already subscribed on connect
          break;
          
        default:
          console.log(`[TrinityWebSocket] Unknown message type: ${parsed.type}`);
      }
    } catch (error) {
      console.error('[TrinityWebSocket] Failed to parse message:', error);
    }
  }
}

export const trinityWebSocketService = TrinityWebSocketService.getInstance();
