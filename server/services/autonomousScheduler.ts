/**
 * Autonomous Scheduler Service
 * Runs scheduled jobs for AutoForce™ autonomous operations:
 * - Nightly invoice generation (BillOS™)
 * - Weekly schedule generation (ScheduleOS™)
 * - Automatic payroll processing (PayrollOS™)
 */

import cron from 'node-cron';
import { db } from '../db';
import { workspaces, employees } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateUsageBasedInvoices } from './billos';
import { PayrollAutomationEngine } from './payrollAutomation';
import { ScheduleOSAI } from '../ai/scheduleos';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCHEDULER_CONFIG = {
  invoicing: {
    enabled: true,
    schedule: '0 2 * * *', // Every day at 2 AM
    description: 'Nightly invoice generation from approved time entries'
  },
  scheduling: {
    enabled: true,
    schedule: '0 23 * * 0', // Every Sunday at 11 PM
    description: 'Weekly schedule generation for upcoming week'
  },
  payroll: {
    enabled: true,
    schedule: '0 3 * * 1', // Every Monday at 3 AM (after invoicing)
    description: 'Automatic payroll processing on pay period dates'
  }
};

// ============================================================================
// JOB HANDLERS
// ============================================================================

/**
 * Nightly Invoice Generation
 * Runs for all workspaces with auto-invoicing enabled
 */
async function runNightlyInvoiceGeneration() {
  console.log('=================================================');
  console.log('🤖 BILLΟΣ™ AUTONOMOUS INVOICING - START');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================');

  try {
    // Get all active workspaces (not suspended, frozen, or locked)
    const activeWorkspaces = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isSuspended, false),
          eq(workspaces.isFrozen, false),
          eq(workspaces.isLocked, false)
        )
      );

    console.log(`Found ${activeWorkspaces.length} active workspace(s)`);

    let totalInvoicesGenerated = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const workspace of activeWorkspaces) {
      try {
        console.log(`\n📊 Processing workspace: ${workspace.name} (${workspace.id})`);
        
        // Generate invoices for yesterday's approved time entries
        const invoices = await generateUsageBasedInvoices(workspace.id);
        
        if (invoices.length > 0) {
          console.log(`✅ Generated ${invoices.length} invoice(s) for ${workspace.name}`);
          totalInvoicesGenerated += invoices.length;
          successCount++;
        } else {
          console.log(`ℹ️  No unbilled time entries for ${workspace.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate invoices for ${workspace.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n=================================================');
    console.log('📈 BILLΟΣ™ AUTONOMOUS INVOICING - SUMMARY');
    console.log(`Total Workspaces: ${activeWorkspaces.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total Invoices Generated: ${totalInvoicesGenerated}`);
    console.log('=================================================\n');

  } catch (error) {
    console.error('💥 Critical error in nightly invoice generation:', error);
  }
}

/**
 * Weekly Schedule Generation
 * Runs Sunday nights to create schedules for upcoming week
 */
async function runWeeklyScheduleGeneration() {
  console.log('=================================================');
  console.log('🤖 SCHEDULEΟΣ™ AUTONOMOUS SCHEDULING - START');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================');

  try {
    // Get all active workspaces with auto-scheduling enabled
    const activeWorkspaces = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isSuspended, false),
          eq(workspaces.isFrozen, false),
          eq(workspaces.isLocked, false)
          // TODO: Add workspace.autoSchedulingEnabled field when ready
        )
      );

    console.log(`Found ${activeWorkspaces.length} active workspace(s)`);

    // Calculate next week's date range
    const nextWeekStart = startOfWeek(addDays(new Date(), 7)); // Next Monday
    const nextWeekEnd = endOfWeek(nextWeekStart); // Following Sunday

    console.log(`\n📅 Generating schedules for week:`);
    console.log(`   Start: ${format(nextWeekStart, 'MMM dd, yyyy')}`);
    console.log(`   End:   ${format(nextWeekEnd, 'MMM dd, yyyy')}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const workspace of activeWorkspaces) {
      try {
        console.log(`\n📊 Processing workspace: ${workspace.name} (${workspace.id})`);
        
        // TODO: Get shift requirements from workspace configuration
        // For now, skip auto-scheduling until shift requirements are configured
        console.log(`ℹ️  Auto-scheduling not yet configured for ${workspace.name}`);
        console.log(`   (Requires shift requirement templates in workspace settings)`);
        
        // Example of how it would work:
        /*
        const scheduleOSAI = new ScheduleOSAI();
        const result = await scheduleOSAI.generateSchedule({
          workspaceId: workspace.id,
          weekStartDate: nextWeekStart,
          shiftRequirements: workspace.shiftTemplates // Would come from settings
        });
        
        if (result.success) {
          console.log(`✅ Generated ${result.shiftsGenerated} shifts for ${workspace.name}`);
          successCount++;
        }
        */
        
      } catch (error) {
        console.error(`❌ Failed to generate schedule for ${workspace.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n=================================================');
    console.log('📈 SCHEDULEΟΣ™ AUTONOMOUS SCHEDULING - SUMMARY');
    console.log(`Total Workspaces: ${activeWorkspaces.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('=================================================\n');

  } catch (error) {
    console.error('💥 Critical error in weekly schedule generation:', error);
  }
}

/**
 * Automatic Payroll Processing
 * Runs on configured pay period dates
 */
async function runAutomaticPayrollProcessing() {
  console.log('=================================================');
  console.log('🤖 PAYROLLOS™ AUTONOMOUS PAYROLL - START');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=================================================');

  try {
    // Get all active workspaces (not suspended, frozen, or locked)
    const activeWorkspaces = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.isSuspended, false),
          eq(workspaces.isFrozen, false),
          eq(workspaces.isLocked, false)
        )
      );

    console.log(`Found ${activeWorkspaces.length} active workspace(s)`);

    const today = new Date();
    const dayOfMonth = today.getDate();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday

    let totalPayrollRuns = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const workspace of activeWorkspaces) {
      try {
        // Default to bi-weekly if no schedule configured
        // TODO: Add payrollSchedule field to workspaces table
        const paySchedule = 'bi-weekly';
        let shouldProcessPayroll = false;

        // Check if today is a pay period date based on schedule
        if (paySchedule === 'weekly' && dayOfWeek === 1) {
          shouldProcessPayroll = true; // Every Monday
        } else if (paySchedule === 'bi-weekly' && dayOfWeek === 1) {
          // Every other Monday (simplified - would need pay period tracking)
          const weekNumber = Math.floor(dayOfMonth / 7);
          shouldProcessPayroll = weekNumber % 2 === 0;
        } else if (paySchedule === 'monthly' && (dayOfMonth === 1 || dayOfMonth === 15)) {
          shouldProcessPayroll = true; // 1st and 15th of month
        }

        if (shouldProcessPayroll) {
          console.log(`\n📊 Processing payroll for: ${workspace.name} (${paySchedule})`);
          
          // Get workspace owner to attribute payroll run
          const [owner] = await db
            .select()
            .from(employees)
            .where(
              and(
                eq(employees.workspaceId, workspace.id),
                eq(employees.workspaceRole, 'org_owner')
              )
            )
            .limit(1);

          if (!owner || !owner.userId) {
            console.log(`⚠️  No owner found for ${workspace.name}, skipping`);
            continue;
          }

          // Process automated payroll
          const result = await PayrollAutomationEngine.processAutomatedPayroll(
            workspace.id,
            owner.userId
          );

          console.log(`✅ Payroll processed for ${workspace.name}:`);
          console.log(`   Employees: ${result.totalEmployees}`);
          console.log(`   Gross Pay: $${result.totalGrossPay.toFixed(2)}`);
          console.log(`   Net Pay: $${result.totalNetPay.toFixed(2)}`);
          
          totalPayrollRuns++;
          successCount++;
        } else {
          console.log(`ℹ️  Not a pay period date for ${workspace.name} (${paySchedule})`);
        }

      } catch (error) {
        console.error(`❌ Failed to process payroll for ${workspace.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n=================================================');
    console.log('📈 PAYROLLOS™ AUTONOMOUS PAYROLL - SUMMARY');
    console.log(`Total Workspaces Checked: ${activeWorkspaces.length}`);
    console.log(`Payroll Runs Processed: ${totalPayrollRuns}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('=================================================\n');

  } catch (error) {
    console.error('💥 Critical error in automatic payroll processing:', error);
  }
}

// ============================================================================
// SCHEDULER INITIALIZATION
// ============================================================================

let isSchedulerRunning = false;

/**
 * Start all autonomous job schedulers
 */
export function startAutonomousScheduler() {
  if (isSchedulerRunning) {
    console.log('⚠️  Autonomous scheduler is already running');
    return;
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🤖 AUTOFORCE™ AUTONOMOUS SCHEDULER STARTING  ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // 1. Nightly Invoice Generation (2 AM daily)
  if (SCHEDULER_CONFIG.invoicing.enabled) {
    cron.schedule(SCHEDULER_CONFIG.invoicing.schedule, () => {
      runNightlyInvoiceGeneration();
    });
    console.log('✅ BillOS™ Nightly Invoicing:');
    console.log(`   Schedule: ${SCHEDULER_CONFIG.invoicing.schedule} (2 AM daily)`);
    console.log(`   ${SCHEDULER_CONFIG.invoicing.description}\n`);
  }

  // 2. Weekly Schedule Generation (Sunday 11 PM)
  if (SCHEDULER_CONFIG.scheduling.enabled) {
    cron.schedule(SCHEDULER_CONFIG.scheduling.schedule, () => {
      runWeeklyScheduleGeneration();
    });
    console.log('✅ ScheduleOS™ Weekly Scheduling:');
    console.log(`   Schedule: ${SCHEDULER_CONFIG.scheduling.schedule} (Sunday 11 PM)`);
    console.log(`   ${SCHEDULER_CONFIG.scheduling.description}\n`);
  }

  // 3. Automatic Payroll Processing (Monday 3 AM)
  if (SCHEDULER_CONFIG.payroll.enabled) {
    cron.schedule(SCHEDULER_CONFIG.payroll.schedule, () => {
      runAutomaticPayrollProcessing();
    });
    console.log('✅ PayrollOS™ Automatic Payroll:');
    console.log(`   Schedule: ${SCHEDULER_CONFIG.payroll.schedule} (Monday 3 AM)`);
    console.log(`   ${SCHEDULER_CONFIG.payroll.description}\n`);
  }

  isSchedulerRunning = true;

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  ✅ AUTONOMOUS SCHEDULER RUNNING SUCCESSFULLY  ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

/**
 * Manually trigger jobs for testing
 */
export const manualTriggers = {
  invoicing: runNightlyInvoiceGeneration,
  scheduling: runWeeklyScheduleGeneration,
  payroll: runAutomaticPayrollProcessing,
};
