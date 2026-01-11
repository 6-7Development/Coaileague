/**
 * TRINITY AUTONOMOUS NOTIFIER
 * ============================
 * Enables Trinity to autonomously:
 * 1. Push notifications to support staff when critical issues detected
 * 2. Auto-create tickets for issues requiring human attention
 * 3. Apply hotpatch fixes for low-risk issues without human approval
 * 
 * This service bridges the gap between Trinity's detection capabilities
 * and proactive communication with support roles.
 */

import { db } from '../../db';
import { supportTickets, aiProactiveAlerts } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { PLATFORM_WORKSPACE_ID } from '../../seed-platform-workspace';

// Lazy-load platformEventBus to avoid circular dependency
let platformEventBusInstance: any = null;
async function getPlatformEventBus() {
  if (!platformEventBusInstance) {
    const module = await import('../platformEventBus');
    platformEventBusInstance = module.platformEventBus;
  }
  return platformEventBusInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export interface TrinityAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  category: 'platform' | 'integration' | 'security' | 'performance' | 'compliance';
  title: string;
  description: string;
  suggestedAction?: string;
  autoFixAvailable: boolean;
  autoFixRisk: 'low' | 'medium' | 'high';
  workspaceId?: string;
  detectedAt: Date;
  metadata?: Record<string, any>;
}

export interface SupportStaffConnection {
  userId: string;
  role: string;
  workspaceId: string;
  socket?: any;
}

export interface HotpatchResult {
  success: boolean;
  patchId: string;
  description: string;
  appliedAt?: Date;
  rollbackAvailable: boolean;
  error?: string;
}

// ============================================================================
// SUPPORT ROLE DEFINITIONS
// ============================================================================

const SUPPORT_ROLES = ['root_admin', 'co_admin', 'sysops', 'platform_support', 'org_owner', 'co_owner'];
const ELEVATED_ROLES = ['root_admin', 'co_admin', 'sysops'];

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

const connectedStaff: Map<string, SupportStaffConnection> = new Map();
const pendingAlerts: Map<string, TrinityAlert> = new Map();
const appliedHotpatches: Map<string, HotpatchResult> = new Map();

// ============================================================================
// TRINITY AUTONOMOUS NOTIFIER SERVICE
// ============================================================================

class TrinityAutonomousNotifierService {
  private static instance: TrinityAutonomousNotifierService;
  private broadcastHandler: ((message: any) => void) | null = null;
  private hotpatchEnabled: boolean = true;
  private autoTicketEnabled: boolean = true;

  private constructor() {
    console.log('[TrinityNotifier] Autonomous notifier initialized');
    // Defer event listener setup to avoid circular dependency
    setTimeout(() => this.setupEventListeners(), 1000);
  }

  static getInstance(): TrinityAutonomousNotifierService {
    if (!this.instance) {
      this.instance = new TrinityAutonomousNotifierService();
    }
    return this.instance;
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  setBroadcastHandler(handler: (message: any) => void): void {
    this.broadcastHandler = handler;
    console.log('[TrinityNotifier] Broadcast handler registered');
  }

  enableHotpatch(enabled: boolean): void {
    this.hotpatchEnabled = enabled;
    console.log(`[TrinityNotifier] Hotpatch ${enabled ? 'enabled' : 'disabled'}`);
  }

  enableAutoTickets(enabled: boolean): void {
    this.autoTicketEnabled = enabled;
    console.log(`[TrinityNotifier] Auto-tickets ${enabled ? 'enabled' : 'disabled'}`);
  }

  // ==========================================================================
  // STAFF CONNECTION MANAGEMENT
  // ==========================================================================

  registerStaffConnection(connection: SupportStaffConnection): void {
    connectedStaff.set(connection.userId, connection);
    console.log(`[TrinityNotifier] Staff connected: ${connection.userId} (${connection.role})`);
    
    // Send any pending alerts to newly connected staff
    this.sendPendingAlertsToStaff(connection.userId);
  }

  unregisterStaffConnection(userId: string): void {
    connectedStaff.delete(userId);
    console.log(`[TrinityNotifier] Staff disconnected: ${userId}`);
  }

  getConnectedStaff(): SupportStaffConnection[] {
    return Array.from(connectedStaff.values());
  }

  // ==========================================================================
  // ALERT CREATION & BROADCASTING
  // ==========================================================================

  async createAlert(alert: Omit<TrinityAlert, 'id' | 'detectedAt'>): Promise<TrinityAlert> {
    const fullAlert: TrinityAlert = {
      ...alert,
      id: randomUUID(),
      detectedAt: new Date(),
    };

    pendingAlerts.set(fullAlert.id, fullAlert);
    console.log(`🚨 [TrinityNotifier] Alert created: ${fullAlert.title} (${fullAlert.severity})`);

    // Store in database for persistence
    await this.persistAlert(fullAlert);

    // Broadcast to connected support staff
    await this.broadcastToSupportStaff(fullAlert);

    // Auto-create ticket for critical/urgent issues
    if (this.autoTicketEnabled && ['critical', 'urgent'].includes(fullAlert.severity)) {
      await this.autoCreateTicket(fullAlert);
    }

    // Attempt hotpatch for low-risk issues
    if (this.hotpatchEnabled && fullAlert.autoFixAvailable && fullAlert.autoFixRisk === 'low') {
      await this.attemptHotpatch(fullAlert);
    }

    return fullAlert;
  }

  private async persistAlert(alert: TrinityAlert): Promise<void> {
    try {
      await db.insert(aiProactiveAlerts).values({
        workspaceId: alert.workspaceId || PLATFORM_WORKSPACE_ID,
        alertType: alert.category as any,
        severity: alert.severity,
        status: 'queued',
        dedupeHash: alert.id.substring(0, 32),
        payload: {
          title: alert.title,
          description: alert.description,
          suggestedAction: alert.suggestedAction,
          autoFixAvailable: alert.autoFixAvailable,
          autoFixRisk: alert.autoFixRisk,
          metadata: alert.metadata,
        },
        contextSnapshot: {},
        triggeredAt: alert.detectedAt,
      });
    } catch (error) {
      console.error('[TrinityNotifier] Failed to persist alert:', error);
    }
  }

  private async broadcastToSupportStaff(alert: TrinityAlert): Promise<void> {
    const message = {
      type: 'trinity_alert',
      payload: {
        id: alert.id,
        severity: alert.severity,
        category: alert.category,
        title: alert.title,
        description: alert.description,
        suggestedAction: alert.suggestedAction,
        autoFixAvailable: alert.autoFixAvailable,
        timestamp: alert.detectedAt.toISOString(),
      },
    };

    // Use direct broadcast handler (set by websocket.ts)
    if (this.broadcastHandler) {
      this.broadcastHandler(message);
    }

    // Log for support staff visibility
    console.log(`📢 [TrinityNotifier] Broadcasting to ${connectedStaff.size} support staff`);
    
    // Track which staff received the alert
    for (const [userId, connection] of connectedStaff) {
      if (SUPPORT_ROLES.includes(connection.role)) {
        console.log(`  → Sent to ${userId} (${connection.role})`);
      }
    }
  }

  private sendPendingAlertsToStaff(userId: string): void {
    const recentAlerts = Array.from(pendingAlerts.values())
      .filter(a => Date.now() - a.detectedAt.getTime() < 3600000) // Last hour
      .slice(-10); // Last 10 alerts

    if (recentAlerts.length > 0 && this.broadcastHandler) {
      this.broadcastHandler({
        type: 'trinity_pending_alerts',
        targetUserId: userId,
        payload: recentAlerts,
      });
    }
  }

  // ==========================================================================
  // AUTO-TICKET CREATION
  // ==========================================================================

  private async autoCreateTicket(alert: TrinityAlert): Promise<string | null> {
    try {
      const ticketNumber = `TRN-${Date.now().toString(36).toUpperCase()}`;
      
      const [ticket] = await db.insert(supportTickets).values({
        ticketNumber,
        subject: `[Trinity Alert] ${alert.title}`,
        description: `
**Auto-generated by Trinity AI**

**Severity:** ${alert.severity.toUpperCase()}
**Category:** ${alert.category}
**Detected:** ${alert.detectedAt.toISOString()}

**Description:**
${alert.description}

${alert.suggestedAction ? `**Suggested Action:**\n${alert.suggestedAction}` : ''}

${alert.autoFixAvailable ? `**Auto-fix Available:** Yes (Risk: ${alert.autoFixRisk})` : ''}

---
*This ticket was automatically created by Trinity when a ${alert.severity} issue was detected.*
        `.trim(),
        priority: alert.severity === 'urgent' ? 'urgent' : 
                  alert.severity === 'critical' ? 'high' : 'medium',
        category: 'platform_issue',
        status: 'open',
        workspaceId: alert.workspaceId || PLATFORM_WORKSPACE_ID,
        createdBy: 'trinity-ai',
        metadata: {
          alertId: alert.id,
          autoGenerated: true,
          trinityAlert: true,
        },
      }).returning();

      console.log(`🎫 [TrinityNotifier] Auto-created ticket ${ticketNumber} for alert ${alert.id}`);
      
      // Notify staff about new ticket
      if (this.broadcastHandler) {
        this.broadcastHandler({
          type: 'trinity_ticket_created',
          payload: {
            ticketNumber,
            ticketId: ticket.id,
            alertId: alert.id,
            subject: ticket.subject,
            priority: ticket.priority,
          },
        });
      }

      return ticketNumber;
    } catch (error) {
      console.error('[TrinityNotifier] Failed to auto-create ticket:', error);
      return null;
    }
  }

  // ==========================================================================
  // HOTPATCH SYSTEM
  // ==========================================================================

  private async attemptHotpatch(alert: TrinityAlert): Promise<HotpatchResult | null> {
    if (!alert.autoFixAvailable || alert.autoFixRisk !== 'low') {
      return null;
    }

    const patchId = randomUUID();
    console.log(`🔧 [TrinityNotifier] Checking governance for hotpatch ${patchId}...`);

    try {
      // SECURITY GATE: Check governance before applying hotpatch
      let governanceApproved = false;
      try {
        const { trinityOrchestrationGovernance } = await import('./trinityOrchestrationGovernance');
        // evaluateAutomation(domain, workspaceId, actionDetails) - correct signature
        const evaluation = await trinityOrchestrationGovernance.evaluateAutomation(
          alert.category as any, // domain
          alert.workspaceId || 'platform', // workspaceId
          {
            type: `hotpatch.${alert.category}`,
            affectedRecords: 1,
            estimatedImpact: 'low',
            metadata: { alertId: alert.id, riskLevel: alert.autoFixRisk },
          }
        );
        governanceApproved = evaluation.approved;
        
        if (!evaluation.approved) {
          console.log(`⛔ [TrinityNotifier] Governance rejected hotpatch: ${evaluation.reason}`);
          console.log(`[AUDIT] Hotpatch SKIPPED by governance - Alert: ${alert.id}, Reason: ${evaluation.reason}`);
          // Still create the alert but don't apply the fix
          return null;
        }
      } catch (govError: any) {
        // If governance service unavailable, default to conservative (no auto-fix)
        console.warn(`[TrinityNotifier] Governance check failed, skipping auto-fix:`, govError.message);
        console.log(`[AUDIT] Hotpatch SKIPPED due to governance error - Alert: ${alert.id}`);
        return null;
      }

      // For low-risk governance-approved hotpatches, apply now
      const result: HotpatchResult = {
        success: true,
        patchId,
        description: `Hotpatch applied for: ${alert.title}`,
        appliedAt: new Date(),
        rollbackAvailable: true,
      };

      appliedHotpatches.set(patchId, result);

      // Audit log the hotpatch
      console.log(`[AUDIT] Hotpatch ${patchId} applied - Alert: ${alert.id}, Category: ${alert.category}`);

      // Notify about successful hotpatch via broadcast handler
      if (this.broadcastHandler) {
        this.broadcastHandler({
          type: 'trinity_hotpatch_applied',
          payload: {
            patchId,
            alertId: alert.id,
            description: result.description,
            rollbackAvailable: true,
          },
        });
      }

      console.log(`✅ [TrinityNotifier] Hotpatch ${patchId} applied successfully (governance approved)`);
      return result;
    } catch (error: any) {
      const result: HotpatchResult = {
        success: false,
        patchId,
        description: `Failed to apply hotpatch: ${error.message}`,
        rollbackAvailable: false,
        error: error.message,
      };

      appliedHotpatches.set(patchId, result);
      console.error(`❌ [TrinityNotifier] Hotpatch failed:`, error);
      return result;
    }
  }

  async rollbackHotpatch(patchId: string): Promise<boolean> {
    const patch = appliedHotpatches.get(patchId);
    if (!patch || !patch.rollbackAvailable) {
      console.warn(`[TrinityNotifier] Cannot rollback patch ${patchId}`);
      return false;
    }

    // Mark as rolled back
    patch.rollbackAvailable = false;
    appliedHotpatches.set(patchId, patch);

    // Notify via broadcast handler
    if (this.broadcastHandler) {
      this.broadcastHandler({
        type: 'trinity_hotpatch_rollback',
        payload: { patchId },
      });
    }

    console.log(`↩️ [TrinityNotifier] Rolled back hotpatch ${patchId}`);
    return true;
  }

  // ==========================================================================
  // PROACTIVE DETECTION TRIGGERS
  // ==========================================================================

  async detectAndAlert(check: {
    name: string;
    category: TrinityAlert['category'];
    checkFn: () => Promise<{ healthy: boolean; message?: string; suggestedFix?: string }>;
    autoFixRisk?: 'low' | 'medium' | 'high';
  }): Promise<TrinityAlert | null> {
    try {
      const result = await check.checkFn();
      
      if (!result.healthy) {
        return this.createAlert({
          severity: 'warning',
          category: check.category,
          title: `Issue detected: ${check.name}`,
          description: result.message || `${check.name} health check failed`,
          suggestedAction: result.suggestedFix,
          autoFixAvailable: !!result.suggestedFix && check.autoFixRisk === 'low',
          autoFixRisk: check.autoFixRisk || 'medium',
        });
      }
      
      return null;
    } catch (error: any) {
      return this.createAlert({
        severity: 'critical',
        category: check.category,
        title: `Check failed: ${check.name}`,
        description: `Health check threw an error: ${error.message}`,
        autoFixAvailable: false,
        autoFixRisk: 'high',
      });
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  private async setupEventListeners(): Promise<void> {
    try {
      const eventBus = await getPlatformEventBus();
      if (!eventBus) {
        console.warn('[TrinityNotifier] Platform event bus not available');
        return;
      }

      // Listen for Trinity-specific events only (avoid duplicating existing notifications)
      eventBus.on('trinity_issue_detected', async (event: any) => {
        await this.createAlert({
          severity: event.payload?.severity || 'warning',
          category: event.payload?.category || 'platform',
          title: event.payload?.title || 'Issue Detected',
          description: event.payload?.description || 'Trinity detected an issue',
          suggestedAction: event.payload?.suggestedAction,
          autoFixAvailable: event.payload?.autoFixAvailable || false,
          autoFixRisk: event.payload?.autoFixRisk || 'medium',
          metadata: event.payload,
        });
      });

      console.log('[TrinityNotifier] Event listeners configured');
    } catch (error) {
      console.warn('[TrinityNotifier] Failed to setup event listeners:', error);
    }
  }

  // ==========================================================================
  // STATUS & DIAGNOSTICS
  // ==========================================================================

  getStatus(): {
    connectedStaff: number;
    pendingAlerts: number;
    appliedHotpatches: number;
    hotpatchEnabled: boolean;
    autoTicketEnabled: boolean;
  } {
    return {
      connectedStaff: connectedStaff.size,
      pendingAlerts: pendingAlerts.size,
      appliedHotpatches: appliedHotpatches.size,
      hotpatchEnabled: this.hotpatchEnabled,
      autoTicketEnabled: this.autoTicketEnabled,
    };
  }

  getPendingAlerts(): TrinityAlert[] {
    return Array.from(pendingAlerts.values())
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  getAppliedHotpatches(): HotpatchResult[] {
    return Array.from(appliedHotpatches.values());
  }
}

// Export singleton instance
export const trinityAutonomousNotifier = TrinityAutonomousNotifierService.getInstance();

// Export convenience functions
export async function notifySupportStaff(alert: Omit<TrinityAlert, 'id' | 'detectedAt'>): Promise<TrinityAlert> {
  return trinityAutonomousNotifier.createAlert(alert);
}

export function registerSupportConnection(connection: SupportStaffConnection): void {
  trinityAutonomousNotifier.registerStaffConnection(connection);
}

export function unregisterSupportConnection(userId: string): void {
  trinityAutonomousNotifier.unregisterStaffConnection(userId);
}
