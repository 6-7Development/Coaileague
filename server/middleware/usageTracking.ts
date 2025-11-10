import { Request } from 'express';
import { partnerApiUsageService } from '../services/billing/partnerApiUsage';
import type { PartnerApiCallInput } from '../services/billing/partnerApiUsage';

export interface PartnerApiContext {
  workspaceId: string;
  userId?: string;
  partnerConnectionId: string;
  partnerType: 'quickbooks' | 'gusto' | 'stripe' | 'other';
  endpoint: string;
  httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  featureKey?: string; // e.g., 'billos_invoice_creation'
  activityType?: string; // e.g., 'invoice_creation'
  metadata?: {
    requestId?: string; // RECOMMENDED: Unique operation ID (e.g., invoice ID, payroll run ID)
    batchId?: string; // For batch operations
    webhookId?: string; // For webhook events
    [key: string]: any;
  };
  req?: Request; // Express request for IP/user agent
}

/**
 * Wrapper for partner API calls with automatic usage tracking
 * 
 * This ensures all partner API calls (QuickBooks, Gusto, etc.) are logged
 * for cost tracking and billing purposes. The wrapper is non-blocking and
 * will not fail the API call if usage tracking fails.
 * 
 * REQUIRED: You MUST provide a unique requestId in metadata for proper idempotency.
 * Use business entity IDs that are stable across retries of the same operation:
 * - Creating invoice: `invoice-${invoiceId}` or `invoice-client-${clientId}-period-${period}`
 * - Creating payroll: `payroll-run-${payrollRunId}` or `payroll-period-${period}`
 * - Syncing customer: `customer-sync-${customerId}` or `sync-customer-${customerId}-v${version}`
 * - Updating record: `update-${entityType}-${entityId}` or `${entityType}-${entityId}-update`
 * 
 * @throws Error if metadata.requestId is not provided
 * 
 * @example
 * const invoice = await withUsageTracking(
 *   {
 *     workspaceId: 'ws_123',
 *     userId: 'user_456',
 *     partnerConnectionId: 'conn_789',
 *     partnerType: 'quickbooks',
 *     endpoint: '/v3/invoice',
 *     httpMethod: 'POST',
 *     featureKey: 'billos_invoice_creation',
 *     metadata: {
 *       requestId: `invoice-${invoiceId}`, // REQUIRED: Stable across retries
 *     },
 *   },
 *   async () => qboClient.createInvoice(invoiceData)
 * );
 */
export async function withUsageTracking<T>(
  context: PartnerApiContext,
  fn: () => Promise<T>
): Promise<T> {
  // ENFORCE mandatory requestId for proper idempotency
  if (!context.metadata?.requestId) {
    throw new Error(
      `Missing required metadata.requestId for partner API usage tracking. ` +
      `Provide a deterministic identifier based on the business operation:\n` +
      `  - Creating invoice: Use invoice ID (e.g., "invoice-INV-12345")\n` +
      `  - Creating payroll: Use payroll run ID (e.g., "payroll-run-2025-01")\n` +
      `  - Syncing customer: Use customer ID (e.g., "customer-sync-CUST-456")\n` +
      `  - Batch operations: Use batch identifier (e.g., "batch-2025-01-invoices")\n` +
      `This ensures proper deduplication and prevents double-billing on retries.`
    );
  }
  
  const startTime = Date.now();
  const requestId = context.metadata.requestId; // Already validated above
  let requestPayloadSize: number | undefined;
  let responsePayloadSize: number | undefined;
  let responseStatusCode: number | undefined;
  let success = true;
  let errorMessage: string | undefined;
  let errorCode: string | undefined;
  
  try {
    // Execute the partner API call
    const result = await fn();
    
    // Calculate response metrics (if result is an object)
    if (result && typeof result === 'object') {
      try {
        const resultJson = JSON.stringify(result);
        responsePayloadSize = Buffer.byteLength(resultJson, 'utf8');
      } catch (err) {
        // Ignore serialization errors
      }
    }
    
    // Assume success if no error thrown
    responseStatusCode = 200;
    
    return result;
  } catch (error: any) {
    // Track error details
    success = false;
    errorMessage = error.message || String(error);
    errorCode = error.code || error.statusCode?.toString();
    responseStatusCode = error.statusCode || error.response?.status || 500;
    
    // Re-throw error to caller
    throw error;
  } finally {
    // Always track usage, even if API call failed
    const responseTimeMs = Date.now() - startTime;
    
    // Record usage asynchronously (don't block on failure)
    // Provide stable requestId for idempotency
    partnerApiUsageService.recordApiCall({
      workspaceId: context.workspaceId,
      userId: context.userId,
      partnerConnectionId: context.partnerConnectionId,
      partnerType: context.partnerType,
      endpoint: context.endpoint,
      httpMethod: context.httpMethod,
      usageType: 'api_call',
      usageAmount: 1,
      usageUnit: 'api_calls',
      requestPayloadSize,
      responsePayloadSize,
      responseStatusCode,
      responseTimeMs,
      success,
      errorMessage,
      errorCode,
      featureKey: context.featureKey,
      activityType: context.activityType,
      metadata: {
        ...context.metadata,
        requestId, // Stable ID for deduplication
      },
      ipAddress: context.req?.ip,
      userAgent: context.req?.get('user-agent'),
    }).catch(err => {
      // Log but don't throw - usage tracking should never break partner operations
      console.error('Failed to track partner API usage:', err);
    });
  }
}

/**
 * Track a batch of API calls (for bulk operations)
 * 
 * REQUIRED: You MUST provide a unique batchId in metadata for proper idempotency.
 * Use identifiers that represent the entire batch operation:
 * - Batch invoice creation: `invoice-batch-${period}` or `batch-invoice-run-${runId}`
 * - Batch employee sync: `employee-sync-batch-${syncId}` or `sync-employees-${version}`
 * - Bulk payroll creation: `payroll-batch-${payrollPeriod}` or `batch-payroll-${periodId}`
 * 
 * @throws Error if metadata.batchId is not provided
 * 
 * @example
 * const results = await withBatchUsageTracking(
 *   {
 *     workspaceId: 'ws_123',
 *     partnerConnectionId: 'conn_789',
 *     partnerType: 'quickbooks',
 *     endpoint: '/v3/invoice/batch',
 *     httpMethod: 'POST',
 *     featureKey: 'billos_batch_invoice_creation',
 *     metadata: {
 *       batchId: `invoice-batch-${billingPeriod}`, // REQUIRED: Stable across retries
 *     },
 *   },
 *   async () => qboClient.createInvoicesBatch(invoicesData),
 *   invoicesData.length // Number of items in batch
 * );
 */
export async function withBatchUsageTracking<T>(
  context: PartnerApiContext,
  fn: () => Promise<T>,
  batchSize: number
): Promise<T> {
  // ENFORCE mandatory batchId for proper idempotency
  if (!context.metadata?.batchId) {
    throw new Error(
      `Missing required metadata.batchId for batch API usage tracking. ` +
      `Provide a deterministic identifier for the entire batch operation:\n` +
      `  - Batch invoice creation: Use batch run ID (e.g., "invoice-batch-2025-01")\n` +
      `  - Batch employee sync: Use sync ID (e.g., "employee-sync-run-456")\n` +
      `  - Bulk payroll creation: Use payroll period ID (e.g., "payroll-batch-2025-W01")\n` +
      `This ensures proper deduplication and prevents double-billing on retries.`
    );
  }
  
  const startTime = Date.now();
  const batchId = context.metadata.batchId; // Already validated above
  let success = true;
  let errorMessage: string | undefined;
  let errorCode: string | undefined;
  let responseStatusCode: number | undefined;
  
  try {
    const result = await fn();
    responseStatusCode = 200;
    return result;
  } catch (error: any) {
    success = false;
    errorMessage = error.message || String(error);
    errorCode = error.code || error.statusCode?.toString();
    responseStatusCode = error.statusCode || error.response?.status || 500;
    throw error;
  } finally {
    const responseTimeMs = Date.now() - startTime;
    
    // Track batch operation with stable batchId for deduplication
    partnerApiUsageService.recordApiCall({
      workspaceId: context.workspaceId,
      userId: context.userId,
      partnerConnectionId: context.partnerConnectionId,
      partnerType: context.partnerType,
      endpoint: context.endpoint,
      httpMethod: context.httpMethod,
      usageType: 'batch_operation',
      usageAmount: batchSize,
      usageUnit: 'items',
      responseStatusCode,
      responseTimeMs,
      success,
      errorMessage,
      errorCode,
      featureKey: context.featureKey,
      activityType: context.activityType,
      metadata: {
        ...context.metadata,
        batchSize,
        batchId, // Stable ID for deduplication
      },
      ipAddress: context.req?.ip,
      userAgent: context.req?.get('user-agent'),
    }).catch(err => {
      console.error('Failed to track batch partner API usage:', err);
    });
  }
}

/**
 * Track webhook events from partners (QuickBooks, Gusto)
 * 
 * This is different from outbound API calls - it tracks inbound
 * webhook events that we receive from partners.
 * 
 * @example
 * await trackWebhookEvent({
 *   workspaceId: 'ws_123',
 *   partnerConnectionId: 'conn_789',
 *   partnerType: 'quickbooks',
 *   endpoint: '/webhooks/quickbooks',
 *   eventType: 'invoice.created',
 *   payloadSize: 1024,
 *   req,
 * });
 */
export async function trackWebhookEvent(params: {
  workspaceId: string;
  partnerConnectionId: string;
  partnerType: 'quickbooks' | 'gusto' | 'stripe' | 'other';
  endpoint: string;
  eventType: string;
  webhookId: string; // REQUIRED: Unique webhook event ID from partner (e.g., QuickBooks eventId)
  payloadSize?: number;
  req?: Request;
}): Promise<void> {
  try {
    await partnerApiUsageService.recordApiCall({
      workspaceId: params.workspaceId,
      partnerConnectionId: params.partnerConnectionId,
      partnerType: params.partnerType,
      endpoint: params.endpoint,
      httpMethod: 'POST', // Webhooks are always POST
      usageType: 'webhook_event',
      usageAmount: 1,
      usageUnit: 'events',
      requestPayloadSize: params.payloadSize,
      responseStatusCode: 200,
      success: true,
      activityType: params.eventType,
      metadata: {
        eventType: params.eventType,
        webhookId: params.webhookId, // CRITICAL: Use partner's webhook ID for idempotency
      },
      ipAddress: params.req?.ip,
      userAgent: params.req?.get('user-agent'),
    });
  } catch (err) {
    console.error('Failed to track webhook event:', err);
  }
}
