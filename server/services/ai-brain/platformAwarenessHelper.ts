/**
 * Platform Awareness Helper
 * =========================
 * Fire-and-forget pattern for routing database operations through Trinity AI Brain
 * 
 * Usage:
 * ```ts
 * import { postDatabaseEventToAIBrain } from './services/ai-brain/platformAwarenessHelper';
 * 
 * // After any CRUD operation:
 * postDatabaseEventToAIBrain('employees', 'create', newEmployee.id, 'api');
 * ```
 * 
 * This helper ensures Trinity has complete platform awareness by:
 * 1. Never blocking the main request flow
 * 2. Silently handling any errors
 * 3. Emitting events to the internal event bus
 * 4. Logging to the Control Console for real-time streaming
 */

import { aiBrainEvents } from './internalEventEmitter';

export type DatabaseOperation = 'create' | 'update' | 'delete' | 'read';
export type EventSource = 'api' | 'scheduler' | 'automation' | 'user_action' | 'webhook' | 'migration';

/**
 * Post a database event to the AI Brain for platform awareness
 * Fire-and-forget pattern - never awaits, never blocks
 * 
 * @param table - The database table/resource type (e.g., 'employees', 'shifts')
 * @param operation - The operation performed (create, update, delete, read)
 * @param recordId - The ID of the affected record
 * @param source - Where the operation originated from
 * @param metadata - Optional additional context
 */
export function postDatabaseEventToAIBrain(
  table: string,
  operation: DatabaseOperation,
  recordId: string,
  source: EventSource = 'api',
  metadata?: Record<string, any>
): void {
  // Use setImmediate for true non-blocking behavior
  setImmediate(() => {
    try {
      aiBrainEvents.emit('database_event', {
        table,
        operation,
        recordId,
        source,
        metadata,
        timestamp: new Date().toISOString(),
        routedThroughTrinity: true,
      });
    } catch (error) {
      // Silent failure - never disrupt the main flow
      console.error('[PlatformAwareness] Failed to post event:', error);
    }
  });
}

/**
 * Post a batch of database events
 * Useful for bulk operations
 */
export function postBatchDatabaseEvents(
  events: Array<{
    table: string;
    operation: DatabaseOperation;
    recordId: string;
    source?: EventSource;
    metadata?: Record<string, any>;
  }>
): void {
  setImmediate(() => {
    try {
      events.forEach(event => {
        aiBrainEvents.emit('database_event', {
          ...event,
          source: event.source || 'api',
          timestamp: new Date().toISOString(),
          routedThroughTrinity: true,
        });
      });
    } catch (error) {
      console.error('[PlatformAwareness] Failed to post batch events:', error);
    }
  });
}

/**
 * Post a custom platform event
 * For non-database events that Trinity should be aware of
 */
export function postPlatformEvent(
  eventType: string,
  resourceType: string,
  operation: DatabaseOperation,
  metadata?: Record<string, any>
): void {
  setImmediate(() => {
    try {
      aiBrainEvents.emit('platform_event', {
        eventType,
        resourceType,
        operation,
        metadata,
        timestamp: new Date().toISOString(),
        routedThroughTrinity: true,
      });
    } catch (error) {
      console.error('[PlatformAwareness] Failed to post platform event:', error);
    }
  });
}

/**
 * Register a feature with Trinity's platform registry
 * Call this when adding new features/endpoints
 */
export function registerFeatureWithTrinity(
  featureId: string,
  featureName: string,
  category: string,
  endpoints: string[]
): void {
  setImmediate(() => {
    try {
      aiBrainEvents.emit('feature_registered', {
        featureId,
        featureName,
        category,
        endpoints,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[PlatformAwareness] Failed to register feature:', error);
    }
  });
}

// Common table mappings for easy reference
export const TABLES = {
  EMPLOYEES: 'employees',
  SHIFTS: 'shifts',
  TIME_ENTRIES: 'time_entries',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
  WORKSPACES: 'workspaces',
  CLIENTS: 'clients',
  PAYROLL_RUNS: 'payroll_runs',
  CERTIFICATIONS: 'employee_certifications',
  AVAILABILITY: 'employee_availability',
  BREAKS: 'scheduled_breaks',
  DISPUTES: 'employee_disputes',
} as const;

// Re-export for convenience
export { aiBrainEvents };
