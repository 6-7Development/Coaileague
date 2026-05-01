// Stub — use-trinity-websocket removed; real-time handled by trinityChatService.
// The interface keeps the legacy `event` + `timestamp` shape so code that
// destructures TrinityStreamEvent from older callers still typechecks.
export interface TrinityStreamEvent {
  type: string;
  /** Legacy alias for `type` retained for backward compatibility. */
  event: string;
  data?: any;
  timestamp: number;
}

interface UseTrinityWebSocketOptions {
  conversationId?: string | null;
  enabled?: boolean;
  onEvent?: (event: TrinityStreamEvent) => void;
}

export function useTrinityWebSocket(_options?: UseTrinityWebSocketOptions | string) {
  return { events: [] as TrinityStreamEvent[], isConnected: false };
}
