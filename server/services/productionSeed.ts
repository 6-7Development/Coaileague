/**
 * Production Database Seeding Service
 * 
 * Automatically migrates essential data from development to production
 * on first deployment. Uses idempotent INSERT ... ON CONFLICT DO NOTHING
 * to safely handle re-runs.
 * 
 * Trigger: Runs on server startup when REPLIT_DEPLOYMENT=1 (production)
 * Guard: Checks for sentinel user (root@getdc360.com) to avoid duplicate runs
 */

import { db } from "../db";
import { users, platformRoles, workspaces, employees } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const SENTINEL_USER_ID = 'root-user-00000000';
const SENTINEL_EMAIL = 'root@getdc360.com';

/**
 * Detect production across hosting providers:
 *   - NODE_ENV=production:        standard Node.js convention (Railway, generic hosts)
 *   - REPLIT_DEPLOYMENT=1:        legacy Replit-specific marker (kept for back-compat)
 *   - RAILWAY_ENVIRONMENT=production: Railway-injected env var
 */
function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.REPLIT_DEPLOYMENT === '1' ||
    process.env.RAILWAY_ENVIRONMENT === 'production'
  );
}

/**
 * One-time data corrections - runs on PRODUCTION startup only
 * Fixes existing records that were created with incorrect data
 * EXPORTED so it can be called independently in server/index.ts
 */
export async function runDataCorrections(): Promise<void> {
  const isProduction = isProductionEnvironment();
  if (!isProduction) return;
  
  console.log('🔧 Data Corrections Service: Starting...');
  
  // Fix TXPS org owner role - employee was created without workspace_role
  try {
    await db.execute(sql`
      UPDATE employees 
      SET workspace_role = 'org_owner', employee_number = 'EMP-TXPS-00001'
      WHERE id = '3fd50980-85f8-4f18-8b7a-5906ba8ccfe0'
        AND (workspace_role IS NULL OR workspace_role != 'org_owner')
    `);
    console.log('🔧 Data Correction: Fixed TXPS org owner workspace_role');
  } catch (err) {
    console.log('🔧 Data Correction: TXPS org owner fix skipped (may not exist)');
  }
  
  console.log('🔧 Data Corrections Service: Complete');
}

/**
 * One-time password migrations - runs EVERY startup (dev and prod)
 * Use this for urgent password updates that need to apply to existing users
 * EXPORTED so it can be called independently in server/index.ts
 */
export async function runPasswordMigrations(): Promise<void> {
  console.log('🔑 Password Migration Service: Starting...');
  
  // Password migrations now empty - login working, password preserved
  const migrations: Array<{ email: string; newHash: string; note: string }> = [];
  
  if (migrations.length === 0) {
    console.log('🔑 Password Migration: No pending migrations');
    console.log('🔑 Password Migration Service: Complete');
    return;
  }
  
  for (const migration of migrations) {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET password_hash = ${migration.newHash}, login_attempts = 0
        WHERE email = ${migration.email}
      `);
      console.log(`🔑 Password Migration: SUCCESS - Updated ${migration.email}`);
    } catch (err) {
      console.log(`🔑 Password Migration: SKIPPED - ${migration.email} (user may not exist in this database)`);
    }
  }
  
  console.log('🔑 Password Migration Service: Complete');
}

/**
 * Enforce billing-exempt flags on strategic workspaces. Idempotent — runs on
 * every production startup. Safe to call before or after the main seed.
 *
 * Strategic workspaces (founder's company, internal support orgs):
 *   - subscriptionTier = enterprise (max)
 *   - subscriptionStatus = active
 *   - billingExempt = true (bypasses subscription invoicing + AI credit gates)
 *   - platformFeePercentage = 0.00 (no middleware fee on invoicing/payroll)
 *
 * If the workspace row doesn't exist yet (drizzle-kit push hasn't run, or
 * the workspace was deleted), this is a no-op for that row. If the
 * billing_exempt column doesn't exist yet, the UPDATE silently fails and
 * is logged but doesn't crash the boot.
 */
export async function enforceBillingExemptions(): Promise<void> {
  console.log('💰 Enforcing billing exemptions on strategic workspaces...');

  const STRATEGIC_WORKSPACES: Array<{ id: string; name: string; reason: string }> = [
    { id: '37a04d24-51bd-4856-9faa-d26a2fe82094', name: 'Statewide Protective Services', reason: 'Founder strategic account — enterprise tier, no billing, no middleware fees' },
    { id: 'ops-workspace-00000000',               name: 'CoAIleague Support',             reason: 'Internal platform support workspace' },
    { id: 'demo-workspace-00000000',              name: 'Demo Workspace',                 reason: 'Demo / internal sandbox workspace' },
    { id: 'autoforce-platform-workspace',         name: 'AutoForce Platform',             reason: 'Internal platform workspace' },
    { id: 'coaileague-platform-workspace',        name: 'CoAIleague Platform',            reason: 'Internal HelpAI host workspace' },
  ];

  for (const ws of STRATEGIC_WORKSPACES) {
    try {
      const result = await db.execute(sql`
        UPDATE workspaces
        SET
          subscription_tier = 'enterprise',
          subscription_status = 'active',
          billing_exempt = TRUE,
          billing_exempt_reason = ${ws.reason},
          billing_exempt_at = COALESCE(billing_exempt_at, NOW()),
          billing_exempt_by = COALESCE(billing_exempt_by, 'root-user-00000000'),
          platform_fee_percentage = '0.00',
          updated_at = NOW()
        WHERE id = ${ws.id}
      `);
      console.log(`💰 Billing exempt enforced: ${ws.name} (${ws.id})`);
    } catch (err: any) {
      // The column may not exist yet on first deploy after the schema change —
      // drizzle-kit push will add it on the next start. Log + continue.
      console.log(`💰 Billing exempt skipped for ${ws.name}: ${err?.message || err}`);
    }
  }

  console.log('💰 Billing exemption enforcement complete');
}

export async function runProductionSeed(): Promise<{ success: boolean; message: string }> {
  const isProduction = isProductionEnvironment();
  
  console.log(
    `🌱 Production Seed: Environment check - NODE_ENV=${process.env.NODE_ENV} ` +
    `REPLIT_DEPLOYMENT=${process.env.REPLIT_DEPLOYMENT} ` +
    `RAILWAY_ENVIRONMENT=${process.env.RAILWAY_ENVIRONMENT}`
  );

  if (!isProduction) {
    console.log('🌱 Production Seed: Skipping (not in production)');
    return { success: true, message: 'Skipped - not in production' };
  }

  // Always run password migrations first (for existing users)
  console.log('🔑 Running password migrations...');
  await runPasswordMigrations();

  // Always enforce billing-exempt flags on strategic workspaces, even if the
  // sentinel user already exists (i.e. seed has run before). This ensures the
  // flag gets applied to existing rows after the column is added by drizzle-kit
  // push, and protects against accidental UI/admin flips of the bit.
  await enforceBillingExemptions();
  
  try {
    // Check if sentinel user already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, SENTINEL_USER_ID))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log(`🌱 Production Seed: Sentinel user (${SENTINEL_EMAIL}) already exists. Skipping migration.`);
      return { success: true, message: 'Already seeded' };
    }
    
    console.log('🌱 Production Seed: Starting database migration...');
    
    // Run all inserts in a transaction
    await db.transaction(async (tx) => {
      // =========================================================================
      // 1. USERS TABLE - Core authentication data
      // =========================================================================
      console.log('🌱 Seeding users...');
      
      const usersData = [
        { id: 'GTa1Ag', email: 'Root@getdc360.com', firstName: 'Root', lastName: 'User', passwordHash: '$2b$12$x1ClcnPDnA8IFvYG9z7clu7xBlMXy3kokTEKRfGJxMapCQpuBU9wu', role: 'user', emailVerified: true },
        { id: 'ai-bot', email: 'ai-bot@workforceos.com', firstName: 'AI', lastName: 'Assistant', passwordHash: 'no-password-bot-account', role: 'user', emailVerified: false },
        { id: 'helpos-ai-bot', email: 'helpos@workforceos.com', firstName: 'HelpOS', lastName: 'AI Bot', passwordHash: null, role: 'user', emailVerified: true },
        { id: 'root-admin-workfos', email: 'root@workf-os.com', firstName: 'Brigido', lastName: 'Guillen', passwordHash: '$2b$10$XEUX3wL9wI2VEjEoUdCSw.O8xFVIfhUJAGahknql8PdWYj0DITrSe', role: 'user', emailVerified: true, currentWorkspaceId: 'ops-workspace-00000000' },
        { id: '48003611', email: 'txpsinvestigations@gmail.com', firstName: 'Brigido', lastName: 'Guillen', passwordHash: '$2b$10$Ys8kclEUPliSbv0HQVU5veqYeHxmu6Bd43/IIGNLO.dUp3VMvj/HC', role: 'user', emailVerified: false, currentWorkspaceId: '37a04d24-51bd-4856-9faa-d26a2fe82094' },
        { id: 'root-user-00000000', email: 'root@getdc360.com', firstName: 'Brigido', lastName: 'Guillen', passwordHash: '$2b$10$wN0UMmTiGuG0wEi/04xywOqwnLUILRxQmFTjuTfgovPv1kBS.T3ei', role: 'admin', emailVerified: false, currentWorkspaceId: 'ops-workspace-00000000' },
        { id: 'demo-user-00000000', email: 'demo@shiftsync.app', firstName: 'Demo', lastName: 'User', passwordHash: null, role: 'support_staff', emailVerified: false, currentWorkspaceId: 'demo-workspace-00000000' },
        { id: 'helpai-bot', email: 'helpai@coaileague.ai', firstName: 'HelpAI', lastName: 'Bot', passwordHash: null, role: 'user', emailVerified: false },
        { id: 'f356ebda-c5da-4f43-ba93-38d5725bac26', email: 'test@workforceos.demo', firstName: 'Test', lastName: 'Organization', passwordHash: '$2a$10$8Z5yZJ4bQ8pX9X9X9X9X9OqG7.yZJ4bQ8pX9X9X9X9X9OqG7.yZJ4b', role: 'user', emailVerified: true },
      ];
      
      for (const user of usersData) {
        await tx.execute(sql`
          INSERT INTO users (id, email, first_name, last_name, password_hash, role, email_verified, current_workspace_id, created_at, updated_at, login_attempts, mfa_enabled)
          VALUES (${user.id}, ${user.email}, ${user.firstName}, ${user.lastName}, ${user.passwordHash}, ${user.role}, ${user.emailVerified}, ${(user as any).currentWorkspaceId || null}, NOW(), NOW(), 0, FALSE)
          ON CONFLICT (id) DO NOTHING
        `);
      }
      
      // =========================================================================
      // 2. PLATFORM_ROLES TABLE - Admin and system roles
      // =========================================================================
      console.log('🌱 Seeding platform roles...');
      
      const rolesData = [
        { id: 'e2d402f8-fb44-4129-a0f2-703f0dc91aaa', userId: 'root-user-00000000', role: 'root_admin' },
        { id: 'b495135c-14bf-4579-8c04-23fd38994696', userId: 'root-admin-workfos', role: 'root_admin' },
        { id: '9543b698-9267-4197-a21e-e72cd31406f6', userId: 'f356ebda-c5da-4f43-ba93-38d5725bac26', role: 'root_admin' },
        { id: 'dc25aceb-26f6-4d0d-8ea2-d75552df94ac', userId: 'GTa1Ag', role: 'root_admin' },
      ];
      
      for (const pr of rolesData) {
        await tx.execute(sql`
          INSERT INTO platform_roles (id, user_id, role, granted_at)
          VALUES (${pr.id}, ${pr.userId}, ${pr.role}, NOW())
          ON CONFLICT (id) DO NOTHING
        `);
      }
      
      // =========================================================================
      // 3. WORKSPACES TABLE - Organization/tenant data
      // =========================================================================
      console.log('🌱 Seeding workspaces...');
      
      // Strategic / internal workspaces. Statewide Protective Services is the
      // founder's real company — provisioned at enterprise tier, billing exempt,
      // and 0% middleware fee on invoicing/payroll. The billingExempt flag ALSO
      // bypasses AI credit gating (see creditManager.isUnlimitedCreditUser).
      const workspacesData = [
        { id: 'ops-workspace-00000000',           name: 'CoAIleague Support',             ownerId: 'root-user-00000000', subscriptionTier: 'enterprise', subscriptionStatus: 'active',    billingExempt: true,  platformFeePercentage: '0.00', billingExemptReason: 'Internal platform support workspace' },
        { id: 'demo-workspace-00000000',          name: 'Demo Workspace',                 ownerId: 'root-user-00000000', subscriptionTier: 'enterprise', subscriptionStatus: 'active',    billingExempt: true,  platformFeePercentage: '0.00', billingExemptReason: 'Demo / internal sandbox workspace' },
        { id: 'autoforce-platform-workspace',     name: 'AutoForce Platform',             ownerId: 'root-user-00000000', subscriptionTier: 'enterprise', subscriptionStatus: 'cancelled', billingExempt: true,  platformFeePercentage: '0.00', billingExemptReason: 'Internal platform workspace' },
        { id: 'coaileague-platform-workspace',    name: 'CoAIleague Platform',            ownerId: 'root-user-00000000', subscriptionTier: 'enterprise', subscriptionStatus: 'cancelled', billingExempt: true,  platformFeePercentage: '0.00', billingExemptReason: 'Internal HelpAI host workspace' },
        { id: '37a04d24-51bd-4856-9faa-d26a2fe82094', name: 'Statewide Protective Services', ownerId: '48003611',           subscriptionTier: 'enterprise', subscriptionStatus: 'active',    billingExempt: true,  platformFeePercentage: '0.00', billingExemptReason: 'Founder strategic account — enterprise tier, no billing, no middleware fees' },
      ];

      for (const ws of workspacesData) {
        // INSERT for new rows; UPDATE the billing-exempt fields on existing rows
        // so re-runs after the column was added still flip the bit.
        await tx.execute(sql`
          INSERT INTO workspaces (
            id, name, owner_id, subscription_tier, subscription_status,
            billing_exempt, billing_exempt_reason, billing_exempt_at, billing_exempt_by,
            platform_fee_percentage, created_at, updated_at
          )
          VALUES (
            ${ws.id}, ${ws.name}, ${ws.ownerId}, ${ws.subscriptionTier}, ${ws.subscriptionStatus},
            ${ws.billingExempt}, ${ws.billingExemptReason}, NOW(), 'root-user-00000000',
            ${ws.platformFeePercentage}, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_status = EXCLUDED.subscription_status,
            billing_exempt = EXCLUDED.billing_exempt,
            billing_exempt_reason = EXCLUDED.billing_exempt_reason,
            billing_exempt_at = COALESCE(workspaces.billing_exempt_at, EXCLUDED.billing_exempt_at),
            billing_exempt_by = COALESCE(workspaces.billing_exempt_by, EXCLUDED.billing_exempt_by),
            platform_fee_percentage = EXCLUDED.platform_fee_percentage,
            updated_at = NOW()
        `);
      }
      
      // =========================================================================
      // 4. EMPLOYEES TABLE - Employee records
      // =========================================================================
      console.log('🌱 Seeding employees...');
      
      const employeesData = [
        { id: '8d31a497-e9fe-48d9-b819-9c6869948c39', userId: 'root-user-00000000', workspaceId: 'ops-workspace-00000000', firstName: 'Root', lastName: 'Administrator', email: 'root@getdc360.com', hourlyRate: '0.00', workspaceRole: 'org_owner', employeeNumber: 'EMP-ROOT-00001' },
        { id: 'helpai-employee', userId: null, workspaceId: 'ops-workspace-00000000', firstName: 'HelpAI', lastName: 'Bot', email: 'helpai@coaileague.support', hourlyRate: null, role: 'AI Support Assistant', workspaceRole: null, employeeNumber: 'EMP-HELP-00001' },
        { id: 'trinity-employee', userId: null, workspaceId: 'ops-workspace-00000000', firstName: 'Trinity', lastName: 'AI', email: 'trinity@coaileague.support', hourlyRate: null, role: 'AI Platform Guide', workspaceRole: null, employeeNumber: 'EMP-TRIN-00001' },
        { id: '3fd50980-85f8-4f18-8b7a-5906ba8ccfe0', userId: '48003611', workspaceId: '37a04d24-51bd-4856-9faa-d26a2fe82094', firstName: 'Brigido', lastName: 'Guillen', email: 'txpsinvestigations@gmail.com', hourlyRate: '25.00', workspaceRole: 'org_owner', employeeNumber: 'EMP-TXPS-00001' },
      ];
      
      for (const emp of employeesData) {
        await tx.execute(sql`
          INSERT INTO employees (id, user_id, workspace_id, first_name, last_name, email, hourly_rate, role, workspace_role, employee_number, created_at, updated_at)
          VALUES (${emp.id}, ${emp.userId}, ${emp.workspaceId}, ${emp.firstName}, ${emp.lastName}, ${emp.email}, ${emp.hourlyRate}, ${(emp as any).role || null}, ${emp.workspaceRole}, ${emp.employeeNumber}, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `);
      }
    });
    
    console.log('✅ Production Seed: Database migration completed successfully!');
    console.log('   - Users: 9 core accounts');
    console.log('   - Platform Roles: 4 admin roles');
    console.log('   - Workspaces: 5 organizations');
    console.log('   - Employees: 4 records');
    
    return { success: true, message: 'Production database seeded successfully' };
    
  } catch (error) {
    console.error('❌ Production Seed: Migration failed:', error);
    return { success: false, message: `Seed failed: ${error}` };
  }
}
