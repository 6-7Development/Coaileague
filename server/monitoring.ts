/**
 * Production Monitoring & Observability
 * Tracks errors, performance metrics, and system health
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  workspaceId?: string;
  requestId?: string;
}

interface PerformanceMetric {
  timestamp: Date;
  endpoint: string;
  method: string;
  duration: number; // milliseconds
  statusCode: number;
  userId?: string;
  workspaceId?: string;
}

class MonitoringService {
  private errorBuffer: ErrorLog[] = [];
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Flush buffers every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  /**
   * Log an error for monitoring
   */
  logError(error: Error | string, context?: {
    userId?: string;
    workspaceId?: string;
    requestId?: string;
    additionalData?: Record<string, any>;
  }): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: context?.additionalData,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
      requestId: context?.requestId,
    };

    this.errorBuffer.push(errorLog);
    
    // Also log to console for development
    console.error(`[ERROR] ${errorLog.message}`, {
      ...context,
      stack: errorLog.stack,
    });

    // Flush immediately for critical errors
    if (this.errorBuffer.length >= 10) {
      this.flush();
    }
  }

  /**
   * Log a performance metric
   */
  logMetric(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);

    // Log slow requests to console
    if (metric.duration > 1000) {
      console.warn(`[SLOW] ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }

    // Flush if buffer is large
    if (this.metricsBuffer.length >= 50) {
      this.flush();
    }
  }

  /**
   * Track request performance
   */
  trackRequest(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    context?: { userId?: string; workspaceId?: string }
  ): void {
    this.logMetric({
      timestamp: new Date(),
      endpoint,
      method,
      duration,
      statusCode,
      userId: context?.userId,
      workspaceId: context?.workspaceId,
    });
  }

  /**
   * Flush buffers to storage (currently console, can be extended to database/external service)
   */
  private async flush(): Promise<void> {
    if (this.errorBuffer.length === 0 && this.metricsBuffer.length === 0) {
      return;
    }

    const errors = [...this.errorBuffer];
    const metrics = [...this.metricsBuffer];
    
    this.errorBuffer = [];
    this.metricsBuffer = [];

    // In production, send to external monitoring service (Datadog, Sentry, CloudWatch, etc.)
    // For now, just log statistics
    if (errors.length > 0) {
      console.log(`[MONITORING] Flushed ${errors.length} errors`);
    }

    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const slowRequests = metrics.filter(m => m.duration > 1000).length;
      console.log(`[MONITORING] Flushed ${metrics.length} metrics (avg: ${avgDuration.toFixed(0)}ms, slow: ${slowRequests})`);
    }

    // TODO: Send to external monitoring service
    // await this.sendToMonitoringService(errors, metrics);
  }

  /**
   * Get health check status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    checks: Record<string, boolean>;
    timestamp: Date;
  }> {
    const checks: Record<string, boolean> = {};

    // Database health
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = true;
    } catch (error) {
      checks.database = false;
      this.logError(error as Error, { additionalData: { check: 'database' } });
    }

    // Determine overall status
    const allHealthy = Object.values(checks).every(v => v);
    const anyHealthy = Object.values(checks).some(v => v);

    return {
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'down',
      checks,
      timestamp: new Date(),
    };
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Global singleton instance
export const monitoringService = new MonitoringService();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MONITORING] Shutting down...');
  monitoringService.shutdown();
});

process.on('SIGINT', () => {
  console.log('[MONITORING] Shutting down...');
  monitoringService.shutdown();
});
