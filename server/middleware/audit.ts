// Audit Logging Middleware for SOC2/GDPR Compliance
// Automatically captures request context and provides audit trail helpers

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { InsertAuditLog } from '@shared/schema';

// Extend Express Request to include audit context
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        workspaceId: string;
        userId: string;
        userEmail: string;
        userRole: string;
        ipAddress: string;
        userAgent: string;
        requestId: string;
      };
    }
  }
}

// Extract IP address from request (handles proxies)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Generate unique request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Middleware to capture audit context from authenticated requests
 * Must be used AFTER authentication middleware
 */
export async function auditContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only capture context for authenticated requests
  if ((req as any).user?.claims) {
    const claims = (req as any).user.claims;
    const userId = claims.sub;
    
    // Get workspace ID from request (set by workspace resolution middleware)
    // or load user's current workspace
    let workspaceId = (req as any).workspaceId;
    
    if (!workspaceId) {
      try {
        // Load user to get their current workspace
        const user = await storage.getUser(userId);
        workspaceId = user?.currentWorkspaceId;
      } catch (error) {
        console.warn('Failed to load user workspace for audit context:', error);
      }
    }
    
    if (workspaceId) {
      req.auditContext = {
        workspaceId,
        userId,
        userEmail: claims.email || 'unknown',
        userRole: (req as any).userRole || 'employee', // From RBAC middleware if present
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        requestId: generateRequestId(),
      };
    }
  }
  
  next();
}

/**
 * Helper to create audit log entry with request context
 * Use this in route handlers after mutations
 */
export async function createAuditLog(
  req: Request,
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'clock_in' | 'clock_out' | 'generate_invoice' | 'payment_received' | 'assign_manager' | 'remove_manager',
  entityType: string,
  entityId: string,
  changes?: Record<string, any>,
  options?: {
    isSensitiveData?: boolean;
    complianceTag?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  // Require audit context from middleware
  if (!req.auditContext) {
    console.warn('Audit context not available - ensure auditContextMiddleware is enabled');
    return;
  }

  const { workspaceId, userId, userEmail, userRole, ipAddress, userAgent, requestId } = req.auditContext;

  try {
    await storage.createAuditLog({
      workspaceId,
      userId,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      changes: changes || null,
      metadata: {
        endpoint: `${req.method} ${req.path}`,
        ...(options?.metadata || {}),
      },
      ipAddress,
      userAgent,
      requestId,
      isSensitiveData: options?.isSensitiveData || false,
      complianceTag: options?.complianceTag || null,
    });
  } catch (error) {
    // Log to console but don't fail the request
    // In production, this should go to error monitoring service
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Helper for service/webhook paths that don't have Express request context
 * Use this for background jobs, Stripe webhooks, etc.
 */
export async function createAuditLogFromContext(
  context: {
    workspaceId: string;
    userId: string;
    userEmail: string;
    userRole: string;
    ipAddress?: string;
    userAgent?: string;
  },
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'clock_in' | 'clock_out' | 'generate_invoice' | 'payment_received' | 'assign_manager' | 'remove_manager',
  entityType: string,
  entityId: string,
  changes?: Record<string, any>,
  options?: {
    isSensitiveData?: boolean;
    complianceTag?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await storage.createAuditLog({
      workspaceId: context.workspaceId,
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      action,
      entityType,
      entityId,
      changes: changes || null,
      metadata: options?.metadata || null,
      ipAddress: context.ipAddress || 'system',
      userAgent: context.userAgent || 'system-service',
      requestId: `svc_${Date.now()}`,
      isSensitiveData: options?.isSensitiveData || false,
      complianceTag: options?.complianceTag || null,
    });
  } catch (error) {
    console.error('Failed to create audit log from context:', error);
  }
}

/**
 * Convenience wrapper for common CRUD audit patterns
 */
export const auditHelpers = {
  /**
   * Log employee creation with PII flag
   */
  async employeeCreated(req: Request, employee: { id: string; email?: string }) {
    await createAuditLog(req, 'create', 'employee', employee.id, undefined, {
      isSensitiveData: true,
      complianceTag: 'gdpr',
    });
  },

  /**
   * Log employee update with before/after values
   */
  async employeeUpdated(req: Request, employeeId: string, before: any, after: any) {
    await createAuditLog(req, 'update', 'employee', employeeId, { before, after }, {
      isSensitiveData: true,
      complianceTag: 'gdpr',
    });
  },

  /**
   * Log employee deletion
   */
  async employeeDeleted(req: Request, employeeId: string, employeeData: any) {
    await createAuditLog(req, 'delete', 'employee', employeeId, { deleted: employeeData }, {
      isSensitiveData: true,
      complianceTag: 'gdpr',
    });
  },

  /**
   * Log invoice generation
   */
  async invoiceGenerated(req: Request, invoice: { id: string; total: string }) {
    await createAuditLog(req, 'generate_invoice', 'invoice', invoice.id, {
      total: invoice.total,
    }, {
      isSensitiveData: true,
      complianceTag: 'soc2',
    });
  },

  /**
   * Log payment received
   */
  async paymentReceived(req: Request, invoiceId: string, amount: string) {
    await createAuditLog(req, 'payment_received', 'invoice', invoiceId, {
      amount,
      timestamp: new Date().toISOString(),
    }, {
      isSensitiveData: true,
      complianceTag: 'soc2',
    });
  },

  /**
   * Log time clock-in
   */
  async clockIn(req: Request, timeEntryId: string) {
    await createAuditLog(req, 'clock_in', 'time_entry', timeEntryId, {
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log time clock-out
   */
  async clockOut(req: Request, timeEntryId: string, hours: number) {
    await createAuditLog(req, 'clock_out', 'time_entry', timeEntryId, {
      timestamp: new Date().toISOString(),
      totalHours: hours,
    });
  },
};
