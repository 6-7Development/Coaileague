/**
 * Autonomous Scheduler Service
 * Runs scheduled jobs for CoAIleague autonomous operations:
 * - Nightly invoice generation (Smart Billing)
 * - Weekly schedule generation (AI Scheduling)
 * - Automatic payroll processing (Auto Payroll)
 * 
 * All automation activities are logged for compliance tracking.
 */

import { NotificationDeliveryService } from './notificationDeliveryService';
import cron from 'node-cron';
import { CRON } from '../config/platformConfig';
import { db } from '../db';
import { getAppBaseUrl } from '../utils/getAppBaseUrl';
import {
  workspaces,
  employees,
  users,
  platformRoles,
  customSchedulerIntervals,
  idempotencyKeys,
  chatConversations,
  roomEvents,
  clients,
  invoices,
  paymentReminders,
  timeEntries,
  shifts,
  clientBillingSettings
} from '@shared/schema';
import { eq, and, sql, lt, lte, gte, ne, isNotNull, inArray, isNull } from 'drizzle-orm';
import { generateUsageBasedInvoices, generateWeeklyInvoices, generateInvoiceForClient, sendInvoiceViaStripe } from './billingAutomation';
import { PayrollAutomationEngine } from './payrollAutomation';
import { SchedulingAI } from '../ai/scheduleos';
import { AIBrainService } from './ai-brain/aiBrainService';
import { gustoService } from './partners/gusto';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';
import { shouldRunBiweekly, seedAnchor, advanceAnchor, detectAnchorDrift } from './utils/scheduling';
import { storage } from '../storage';
import { executeIdempotencyCheck, updateIdempotencyResult } from './autonomy/helpers';
import { runWebSocketConnectionCleanup } from './wsConnectionCleanup';
import { runShiftCompletionBridge } from './automation/shiftCompletionBridge';
import { resetMonthlyCredits } from './billing/creditResetCron';
import { platformServicesMeter } from './billing/platformServicesMeter';
import crypto from 'crypto';
import { createNotification } from './notificationService';
import { withCredits } from './billing/creditWrapper';
import { sendMonitoringAlert } from './externalMonitoring';
import { syncInvoiceToQuickBooks, syncPayrollToQuickBooks } from './quickbooksClientBillingSync';
import { checkDatabase, checkChatWebSocket, checkStripe } from './healthCheck';
import { checkExpiringCertifications, scanShiftLicenseConflicts } from './complianceAlertService';
import { runCertificationExpiryCheck } from './automation/notificationEventCoverage';
import { platformChangeMonitor } from './ai-brain/platformChangeMonitor';
import { runAllMaintenanceJobs, maintenanceConfig } from './databaseMaintenance';
import { cronRunLog } from '@shared/schema';
import { runDailyAnalyticsSnapshot } from './analyticsSnapshotService';
import { runCleanupTasks } from './notificationCleanupService';
import { runTokenCleanup } from './tokenCleanupService';
import { runSundayWeeklyReports } from './weeklyReportCronService';
import { runScheduledClientInvoiceAutoGeneration } from './timesheetInvoiceService';
import { runPayrollAutoClose, detectOrphanedPayrollRuns } from './billing/payrollAutoCloseService';
import { platformEventBus, PlatformEvent, EventCategory, EventVisibility } from './platformEventBus';
import { trinityOrchestrationGovernance } from './ai-brain/trinityOrchestrationGovernance';
import { weeklyPlatformAudit } from './trinity/weeklyPlatformAudit';
import { gamificationService } from './gamification/gamificationService';
import { createLogger } from '../lib/logger';
import { PLATFORM_WORKSPACE_ID } from './billing/billingConstants';

const log = createLogger('AutonomousScheduler');
