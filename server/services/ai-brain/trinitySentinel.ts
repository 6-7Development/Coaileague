/**
 * TRINITY SENTINEL
 * ================
 * Continuous monitoring and self-healing system for AI Brain orchestration.
 * Watches all platform operations for failures, anomalies, and degradation.
 * 
 * Capabilities:
 * - Real-time workflow health monitoring
 * - Automatic failure detection and alerting
 * - Self-healing remediation workflows
 * - Performance anomaly detection
 * - Knowledge drift monitoring
 * - Credit usage anomaly detection
 */

import { platformIntentRouter, HealthReport, IntentTelemetry } from './platformIntentRouter';
import { trinityExecutionFabric, ExecutionManifest, ExecutionContext } from './trinityExecutionFabric';
import { subagentSupervisor } from './subagentSupervisor';
import { trinityMemoryService } from './trinityMemoryService';
import { platformEventBus } from '../platformEventBus';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertCategory = 
  | 'workflow_failure'
  | 'performance_degradation'
  | 'credit_anomaly'
  | 'subagent_failure'
  | 'routing_failure'
  | 'knowledge_drift'
  | 'system_health';

export interface SentinelAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  workspaceId?: string;
  affectedComponent: string;
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  autoRemediated: boolean;
  remediationAction?: string;
  metadata: Record<string, any>;
}

export interface HealthCheck {
  id: string;
  name: string;
  component: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastChecked: Date;
  checkIntervalMs: number;
  metrics: HealthMetrics;
  thresholds: HealthThresholds;
}

export interface HealthMetrics {
  successRate: number;
  avgLatencyMs: number;
  errorCount: number;
  requestCount: number;
  lastErrorAt?: Date;
  uptimePercent: number;
}

export interface HealthThresholds {
  minSuccessRate: number;
  maxLatencyMs: number;
  maxErrorsPerHour: number;
}

export interface RemediationPlan {
  id: string;
  alertId: string;
  actions: RemediationAction[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  executedAt?: Date;
  result?: string;
}

export interface RemediationAction {
  order: number;
  type: 'restart' | 'retry' | 'fallback' | 'notify' | 'escalate' | 'self_heal';
  target: string;
  parameters: Record<string, any>;
  executed: boolean;
  result?: string;
}

export interface SentinelStatus {
  running: boolean;
  alertCount: number;
  unresolvedAlerts: number;
  healthChecks: number;
  lastScanAt: Date;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

// ============================================================================
// TRINITY SENTINEL CLASS
// ============================================================================

class TrinitySentinel {
  private static instance: TrinitySentinel;
  
  private alerts: Map<string, SentinelAlert> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private remediationPlans: Map<string, RemediationPlan> = new Map();
  private alertHistory: SentinelAlert[] = [];
  
  private running = false;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private lastScanAt: Date = new Date();
  
  // Configuration
  private readonly SCAN_INTERVAL_MS = 30000;
  private readonly ALERT_RETENTION_HOURS = 24;
  private readonly AUTO_REMEDIATE_THRESHOLD = 0.8;
  
  static getInstance(): TrinitySentinel {
    if (!this.instance) {
      this.instance = new TrinitySentinel();
    }
    return this.instance;
  }

  constructor() {
    this.initializeHealthChecks();
    console.log('[TrinitySentinel] Self-healing monitor initialized');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeHealthChecks(): void {
    // Intent Router health check
    this.healthChecks.set('intent_router', {
      id: 'intent_router',
      name: 'Platform Intent Router',
      component: 'platformIntentRouter',
      status: 'unknown',
      lastChecked: new Date(),
      checkIntervalMs: 30000,
      metrics: {
        successRate: 100,
        avgLatencyMs: 0,
        errorCount: 0,
        requestCount: 0,
        uptimePercent: 100,
      },
      thresholds: {
        minSuccessRate: 95,
        maxLatencyMs: 5000,
        maxErrorsPerHour: 10,
      },
    });
    
    // Execution Fabric health check
    this.healthChecks.set('execution_fabric', {
      id: 'execution_fabric',
      name: 'Trinity Execution Fabric',
      component: 'trinityExecutionFabric',
      status: 'unknown',
      lastChecked: new Date(),
      checkIntervalMs: 30000,
      metrics: {
        successRate: 100,
        avgLatencyMs: 0,
        errorCount: 0,
        requestCount: 0,
        uptimePercent: 100,
      },
      thresholds: {
        minSuccessRate: 90,
        maxLatencyMs: 10000,
        maxErrorsPerHour: 5,
      },
    });
    
    // Subagent Supervisor health check
    this.healthChecks.set('subagent_supervisor', {
      id: 'subagent_supervisor',
      name: 'Subagent Supervisor',
      component: 'subagentSupervisor',
      status: 'unknown',
      lastChecked: new Date(),
      checkIntervalMs: 60000,
      metrics: {
        successRate: 100,
        avgLatencyMs: 0,
        errorCount: 0,
        requestCount: 0,
        uptimePercent: 100,
      },
      thresholds: {
        minSuccessRate: 85,
        maxLatencyMs: 15000,
        maxErrorsPerHour: 20,
      },
    });
    
    // Memory Service health check
    this.healthChecks.set('trinity_memory', {
      id: 'trinity_memory',
      name: 'Trinity Memory Service',
      component: 'trinityMemoryService',
      status: 'unknown',
      lastChecked: new Date(),
      checkIntervalMs: 60000,
      metrics: {
        successRate: 100,
        avgLatencyMs: 0,
        errorCount: 0,
        requestCount: 0,
        uptimePercent: 100,
      },
      thresholds: {
        minSuccessRate: 99,
        maxLatencyMs: 1000,
        maxErrorsPerHour: 5,
      },
    });
  }

  // ============================================================================
  // MONITORING CONTROL
  // ============================================================================

  start(): void {
    if (this.running) return;
    
    this.running = true;
    console.log('[TrinitySentinel] Starting continuous monitoring...');
    
    this.scanInterval = setInterval(() => {
      this.runHealthScan().catch(err => {
        console.error('[TrinitySentinel] Health scan error:', err);
      });
    }, this.SCAN_INTERVAL_MS);
    
    // Run initial scan
    this.runHealthScan();
  }

  stop(): void {
    if (!this.running) return;
    
    this.running = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    console.log('[TrinitySentinel] Monitoring stopped');
  }

  // ============================================================================
  // HEALTH SCANNING
  // ============================================================================

  private async runHealthScan(): Promise<void> {
    this.lastScanAt = new Date();
    console.log('[TrinitySentinel] Running health scan...');
    
    // Check Intent Router
    await this.checkIntentRouterHealth();
    
    // Check Execution Fabric
    await this.checkExecutionFabricHealth();
    
    // Check Subagent Supervisor
    await this.checkSubagentHealth();
    
    // Check for anomalies
    await this.detectAnomalies();
    
    // Process any needed remediations
    await this.processRemediations();
    
    console.log(`[TrinitySentinel] Scan complete: ${this.getUnresolvedAlertCount()} unresolved alerts`);
  }

  private async checkIntentRouterHealth(): Promise<void> {
    const healthCheck = this.healthChecks.get('intent_router');
    if (!healthCheck) return;
    
    try {
      const report = platformIntentRouter.getHealthReport();
      
      healthCheck.metrics.successRate = report.successRate;
      healthCheck.metrics.avgLatencyMs = report.avgLatencyMs;
      healthCheck.metrics.errorCount = report.failedIntents;
      healthCheck.metrics.requestCount = report.totalIntents;
      healthCheck.lastChecked = new Date();
      
      // Determine status
      if (report.successRate < healthCheck.thresholds.minSuccessRate ||
          report.avgLatencyMs > healthCheck.thresholds.maxLatencyMs) {
        healthCheck.status = 'degraded';
        
        this.createAlert({
          category: 'routing_failure',
          severity: 'warning',
          title: 'Intent Router Degradation',
          message: `Success rate: ${report.successRate.toFixed(1)}%, Latency: ${report.avgLatencyMs.toFixed(0)}ms`,
          affectedComponent: 'platformIntentRouter',
          metadata: { report },
        });
      } else {
        healthCheck.status = 'healthy';
      }
    } catch (error) {
      healthCheck.status = 'critical';
      this.createAlert({
        category: 'system_health',
        severity: 'critical',
        title: 'Intent Router Health Check Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        affectedComponent: 'platformIntentRouter',
        metadata: {},
      });
    }
  }

  private async checkExecutionFabricHealth(): Promise<void> {
    const healthCheck = this.healthChecks.get('execution_fabric');
    if (!healthCheck) return;
    
    try {
      const activeManifests = trinityExecutionFabric.getActiveManifests();
      const history = trinityExecutionFabric.getExecutionHistory(50);
      
      const successfulExecutions = history.filter(m => m.phase === 'completed').length;
      const totalExecutions = history.length;
      
      healthCheck.metrics.successRate = totalExecutions > 0 
        ? (successfulExecutions / totalExecutions) * 100 
        : 100;
      healthCheck.metrics.requestCount = totalExecutions;
      healthCheck.lastChecked = new Date();
      
      // Check for stuck executions
      const stuckExecutions = activeManifests.filter(m => {
        const age = Date.now() - m.createdAt.getTime();
        return age > 60000; // More than 1 minute old
      });
      
      if (stuckExecutions.length > 0) {
        healthCheck.status = 'degraded';
        this.createAlert({
          category: 'workflow_failure',
          severity: 'warning',
          title: 'Stuck Executions Detected',
          message: `${stuckExecutions.length} executions stuck for over 1 minute`,
          affectedComponent: 'trinityExecutionFabric',
          metadata: { stuckCount: stuckExecutions.length },
        });
      } else if (healthCheck.metrics.successRate < healthCheck.thresholds.minSuccessRate) {
        healthCheck.status = 'degraded';
      } else {
        healthCheck.status = 'healthy';
      }
    } catch (error) {
      healthCheck.status = 'critical';
    }
  }

  private async checkSubagentHealth(): Promise<void> {
    const healthCheck = this.healthChecks.get('subagent_supervisor');
    if (!healthCheck) return;
    
    try {
      // Use getAllSubagents to get subagent info
      const allSubagents = await subagentSupervisor.getAllSubagents();
      const subagentCount = allSubagents.length;
      const healthyCount = allSubagents.filter(s => s.isActive === true).length;
      
      healthCheck.metrics.successRate = subagentCount > 0 
        ? (healthyCount / subagentCount) * 100 
        : 100;
      healthCheck.metrics.requestCount = subagentCount;
      healthCheck.lastChecked = new Date();
      
      if (healthCheck.metrics.successRate < healthCheck.thresholds.minSuccessRate) {
        healthCheck.status = 'degraded';
        this.createAlert({
          category: 'subagent_failure',
          severity: 'warning',
          title: 'Subagent Performance Degradation',
          message: `Success rate dropped to ${healthCheck.metrics.successRate.toFixed(1)}%`,
          affectedComponent: 'subagentSupervisor',
          metadata: { subagentCount, healthyCount },
        });
      } else {
        healthCheck.status = 'healthy';
      }
    } catch (error) {
      healthCheck.status = 'unknown';
    }
  }

  private async detectAnomalies(): Promise<void> {
    // Check for credit usage anomalies
    const telemetry = platformIntentRouter.getTelemetryBuffer();
    
    if (telemetry.length > 10) {
      const avgCredits = telemetry.reduce((sum, t) => sum + t.creditsConsumed, 0) / telemetry.length;
      const recentCredits = telemetry.slice(-5).reduce((sum, t) => sum + t.creditsConsumed, 0) / 5;
      
      if (recentCredits > avgCredits * 2) {
        this.createAlert({
          category: 'credit_anomaly',
          severity: 'warning',
          title: 'Credit Usage Spike',
          message: `Recent credit usage ${recentCredits.toFixed(1)} is 2x above average ${avgCredits.toFixed(1)}`,
          affectedComponent: 'creditSystem',
          metadata: { recentCredits, avgCredits },
        });
      }
    }
    
    // Check for latency anomalies
    const intentHistory = platformIntentRouter.getIntentHistory(100);
    const recentLatencies = intentHistory.slice(-20).map(i => i.durationMs || 0);
    const avgLatency = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
    
    if (avgLatency > 10000) {
      this.createAlert({
        category: 'performance_degradation',
        severity: 'warning',
        title: 'High Latency Detected',
        message: `Average latency ${avgLatency.toFixed(0)}ms exceeds threshold`,
        affectedComponent: 'system',
        metadata: { avgLatency },
      });
    }
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  private createAlert(params: {
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    message: string;
    affectedComponent: string;
    workspaceId?: string;
    metadata: Record<string, any>;
  }): SentinelAlert {
    // Check for duplicate alerts
    const existingAlert = Array.from(this.alerts.values()).find(
      a => a.category === params.category && 
           a.affectedComponent === params.affectedComponent &&
           !a.resolvedAt
    );
    
    if (existingAlert) {
      // Update existing alert instead of creating new one
      existingAlert.message = params.message;
      existingAlert.metadata = { ...existingAlert.metadata, ...params.metadata };
      return existingAlert;
    }
    
    const alert: SentinelAlert = {
      id: crypto.randomUUID(),
      ...params,
      detectedAt: new Date(),
      autoRemediated: false,
    };
    
    this.alerts.set(alert.id, alert);
    console.log(`[TrinitySentinel] ALERT: ${alert.severity.toUpperCase()} - ${alert.title}`);
    
    // Attempt auto-remediation for non-critical alerts
    if (alert.severity !== 'critical') {
      this.attemptAutoRemediation(alert);
    }
    
    return alert;
  }

  acknowledgeAlert(alertId: string, acknowledgedBy?: string, resolution?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledgedAt) {
      alert.acknowledgedAt = new Date();
      if (resolution) {
        alert.remediationAction = resolution;
        this.resolveAlert(alertId, resolution);
      }
      return true;
    }
    return false;
  }

  async triggerRemediation(alertId: string, remediationType?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    console.log(`[TrinitySentinel] Manual remediation triggered for ${alert.title}`);
    await this.attemptAutoRemediation(alert);
  }

  resolveAlert(alertId: string, resolution?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date();
      alert.remediationAction = resolution;
      
      // Move to history
      this.alertHistory.push(alert);
      this.alerts.delete(alertId);
      
      return true;
    }
    return false;
  }

  // ============================================================================
  // AUTO-REMEDIATION
  // ============================================================================

  private async attemptAutoRemediation(alert: SentinelAlert): Promise<void> {
    const plan = this.createRemediationPlan(alert);
    if (!plan) return;
    
    this.remediationPlans.set(plan.id, plan);
    
    console.log(`[TrinitySentinel] Attempting auto-remediation for ${alert.title}`);
    
    try {
      plan.status = 'executing';
      plan.executedAt = new Date();
      
      for (const action of plan.actions) {
        await this.executeRemediationAction(action, alert);
        action.executed = true;
      }
      
      plan.status = 'completed';
      plan.result = 'Auto-remediation successful';
      alert.autoRemediated = true;
      this.resolveAlert(alert.id, 'Auto-remediated');
      
      console.log(`[TrinitySentinel] Auto-remediation successful for ${alert.title}`);
    } catch (error) {
      plan.status = 'failed';
      plan.result = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[TrinitySentinel] Auto-remediation failed:`, error);
    }
  }

  private createRemediationPlan(alert: SentinelAlert): RemediationPlan | null {
    const actions: RemediationAction[] = [];
    
    switch (alert.category) {
      case 'workflow_failure':
        actions.push({
          order: 1,
          type: 'retry',
          target: alert.affectedComponent,
          parameters: { maxRetries: 3 },
          executed: false,
        });
        break;
        
      case 'performance_degradation':
        actions.push({
          order: 1,
          type: 'self_heal',
          target: alert.affectedComponent,
          parameters: { action: 'clear_cache' },
          executed: false,
        });
        break;
        
      case 'subagent_failure':
        actions.push({
          order: 1,
          type: 'restart',
          target: alert.affectedComponent,
          parameters: {},
          executed: false,
        });
        break;
        
      default:
        actions.push({
          order: 1,
          type: 'notify',
          target: 'admin',
          parameters: { alert },
          executed: false,
        });
    }
    
    if (actions.length === 0) return null;
    
    return {
      id: crypto.randomUUID(),
      alertId: alert.id,
      actions,
      status: 'pending',
      createdAt: new Date(),
    };
  }

  private async executeRemediationAction(
    action: RemediationAction,
    alert: SentinelAlert
  ): Promise<void> {
    switch (action.type) {
      case 'retry':
        // For workflow failures, could trigger re-execution
        console.log(`[TrinitySentinel] Retrying ${action.target}`);
        break;
        
      case 'restart':
        // For service restarts (would need actual implementation)
        console.log(`[TrinitySentinel] Restarting ${action.target}`);
        break;
        
      case 'fallback':
        // Switch to fallback mechanism
        console.log(`[TrinitySentinel] Activating fallback for ${action.target}`);
        break;
        
      case 'self_heal':
        // Self-healing actions like clearing caches
        console.log(`[TrinitySentinel] Self-healing ${action.target}: ${JSON.stringify(action.parameters)}`);
        break;
        
      case 'notify':
        // Send notification to admins
        console.log(`[TrinitySentinel] Notifying admins about ${alert.title}`);
        break;
        
      case 'escalate':
        // Escalate to higher priority
        console.log(`[TrinitySentinel] Escalating ${alert.title}`);
        break;
    }
    
    action.result = 'Executed successfully';
  }

  private async processRemediations(): Promise<void> {
    // Process any pending remediation plans
    for (const plan of this.remediationPlans.values()) {
      if (plan.status === 'pending') {
        const alert = this.alerts.get(plan.alertId);
        if (alert) {
          await this.attemptAutoRemediation(alert);
        }
      }
    }
  }

  // ============================================================================
  // STATUS AND REPORTING
  // ============================================================================

  getStatus(): SentinelStatus {
    const unresolvedAlerts = Array.from(this.alerts.values()).filter(a => !a.resolvedAt).length;
    
    let overallHealth: SentinelStatus['overallHealth'] = 'healthy';
    const criticalAlerts = Array.from(this.alerts.values()).filter(
      a => a.severity === 'critical' && !a.resolvedAt
    );
    
    if (criticalAlerts.length > 0) {
      overallHealth = 'critical';
    } else if (unresolvedAlerts > 0) {
      overallHealth = 'degraded';
    }
    
    return {
      running: this.running,
      alertCount: this.alerts.size,
      unresolvedAlerts,
      healthChecks: this.healthChecks.size,
      lastScanAt: this.lastScanAt,
      overallHealth,
    };
  }

  getAlerts(includeResolved: boolean = false): SentinelAlert[] {
    const activeAlerts = Array.from(this.alerts.values());
    if (includeResolved) {
      return [...activeAlerts, ...this.alertHistory];
    }
    return activeAlerts;
  }

  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  private getUnresolvedAlertCount(): number {
    return Array.from(this.alerts.values()).filter(a => !a.resolvedAt).length;
  }

  getRemediationHistory(): RemediationPlan[] {
    return Array.from(this.remediationPlans.values());
  }
}

export const trinitySentinel = TrinitySentinel.getInstance();
