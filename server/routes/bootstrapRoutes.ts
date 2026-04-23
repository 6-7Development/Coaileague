/**
 * BOOTSTRAP ROUTES — /api/bootstrap/*
 *
 * No authentication required. Protected by DEV_BOOTSTRAP_KEY env var.
 * Purpose: create initial seed accounts when dev DB is empty (no users exist yet).
 *
 * This solves the chicken-and-egg problem:
 *   - Seeds are guarded by isProduction() — won't run in Railway prod
 *   - All other endpoints require auth — can't log in if no accounts exist
 *   - This endpoint creates the accounts using a shared secret key
 *
 * SECURITY: Only works if isProduction() returns false AND correct key provided.
 */

import { Router, type Request, type Response } from 'express';
import { pool } from '../db';
import { createLogger } from '../lib/logger';
import { isProduction } from '../lib/isProduction';
import { sanitizeError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

const log = createLogger('Bootstrap');
const router = Router();

// ─── POST /api/bootstrap/dev-seed ─────────────────────────────────────────────
// Creates dev test accounts. Requires X-Bootstrap-Key header matching DEV_BOOTSTRAP_KEY env var.
router.post('/dev-seed', async (req: Request, res: Response) => {
  // Double-guard: never in production
  if (isProduction()) {
    return res.status(403).json({ error: 'Bootstrap refused — production environment' });
  }

  // Key check
  const key = req.headers['x-bootstrap-key'] || req.body?.bootstrapKey;
  const expectedKey = process.env.DEV_BOOTSTRAP_KEY;

  if (!expectedKey) {
    return res.status(503).json({
      error: 'DEV_BOOTSTRAP_KEY not set in environment',
      hint: 'Add DEV_BOOTSTRAP_KEY=any-random-string to your Railway development variables, then retry',
    });
  }

  if (key !== expectedKey) {
    return res.status(401).json({ error: 'Invalid bootstrap key' });
  }

  try {
    log.info('[Bootstrap] Starting dev account creation...');
    const PASS_HASH = await bcrypt.hash('admin123', 10);
    const created: string[] = [];
    const skipped: string[] = [];

    const accounts = [
      // Platform root
      { id: 'root-user-00000000', email: 'root@coaileague.com', first: 'Root', last: 'Administrator', role: 'root_admin', wsId: 'platform-workspace-00000' },
      // ACME Security
      { id: 'dev-owner-001', email: 'owner@acme-security.test', first: 'Marcus', last: 'Rivera', role: 'user', wsId: 'dev-acme-security-ws' },
      { id: 'dev-manager-001', email: 'manager@acme-security.test', first: 'Sarah', last: 'Chen', role: 'user', wsId: 'dev-acme-security-ws' },
      { id: 'dev-manager-002', email: 'ops@acme-security.test', first: 'James', last: 'Washington', role: 'user', wsId: 'dev-acme-security-ws' },
      { id: 'dev-emp-001', email: 'garcia@acme-security.test', first: 'Carlos', last: 'Garcia', role: 'user', wsId: 'dev-acme-security-ws' },
      { id: 'dev-emp-002', email: 'johnson@acme-security.test', first: 'Diana', last: 'Johnson', role: 'user', wsId: 'dev-acme-security-ws' },
      // Anvil Security
      { id: 'dev-anvil-owner', email: 'owner@anvil-security.test', first: 'Brandon', last: 'Steel', role: 'user', wsId: 'dev-anvil-security-ws' },
      // Lone Star Security
      { id: 'dev-lonestar-owner', email: 'owner@lonestar-security.test', first: 'Raymond', last: 'Castillo', role: 'user', wsId: 'dev-lonestar-security-ws' },
    ];

    // Create workspaces first
    const workspaces = [
      { id: 'platform-workspace-00000', name: 'CoAIleague Platform', owner: 'root-user-00000000', tier: 'enterprise' },
      { id: 'dev-acme-security-ws', name: 'ACME Security Services', owner: 'dev-owner-001', tier: 'enterprise' },
      { id: 'dev-anvil-security-ws', name: 'Anvil Security Group', owner: 'dev-anvil-owner', tier: 'pro' },
      { id: 'dev-lonestar-security-ws', name: 'Lone Star Security Group', owner: 'dev-lonestar-owner', tier: 'pro' },
    ];

    for (const ws of workspaces) {
      await pool.query(
        `INSERT INTO workspaces (id, name, owner_id, subscription_tier, subscription_status,
         business_category, max_employees, max_clients, created_at)
         VALUES ($1, $2, $3, $4, 'active', 'security', 100, 50, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [ws.id, ws.name, ws.owner, ws.tier]
      );
    }

    // Create users
    for (const acc of accounts) {
      const existing = await pool.query(`SELECT id FROM users WHERE id = $1 OR email = $2`, [acc.id, acc.email]);
      if (existing.rows.length > 0) {
        skipped.push(acc.email);
        continue;
      }
      await pool.query(
        `INSERT INTO users (id, email, first_name, last_name, password_hash, role,
         email_verified, current_workspace_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW())`,
        [acc.id, acc.email, acc.first, acc.last, PASS_HASH, acc.role, acc.wsId]
      );

      // Create employee record for non-root accounts
      if (acc.role !== 'root_admin') {
        await pool.query(
          `INSERT INTO employees (id, user_id, workspace_id, first_name, last_name, email,
           hourly_rate, workspace_role, employment_type, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, '35.00',
           $7, 'full_time', 'active', NOW())
           ON CONFLICT DO NOTHING`,
          [`${acc.id}-emp`, acc.id, acc.wsId, acc.first, acc.last, acc.email,
           acc.id === 'dev-owner-001' || acc.id === 'dev-anvil-owner' || acc.id === 'dev-lonestar-owner'
             ? 'org_owner' : acc.id.includes('manager') ? 'manager' : 'employee']
        );
      }

      // Grant platform role to root
      if (acc.role === 'root_admin') {
        await pool.query(
          `INSERT INTO platform_roles (id, user_id, role, granted_at, created_at)
           VALUES (gen_random_uuid(), $1, 'root_admin', NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [acc.id]
        ).catch(() => null);
      }

      created.push(acc.email);
    }

    log.info(`[Bootstrap] Created ${created.length} accounts, skipped ${skipped.length} existing`);

    return res.json({
      success: true,
      message: `Bootstrap complete — ${created.length} accounts created`,
      created,
      skipped,
      loginCredentials: {
        password: 'admin123',
        accounts: [
          { role: 'Platform Root Admin', email: 'root@coaileague.com' },
          { role: 'ACME Owner (Marcus Rivera)', email: 'owner@acme-security.test' },
          { role: 'ACME Manager (Sarah Chen)', email: 'manager@acme-security.test' },
          { role: 'Anvil Owner (Brandon Steel)', email: 'owner@anvil-security.test' },
          { role: 'Lone Star Owner (Raymond Castillo)', email: 'owner@lonestar-security.test' },
        ],
      },
      nextStep: 'Log in with any account above using password: admin123. Then POST /api/dev/seed/full to seed all data.',
    });
  } catch (error: unknown) {
    log.error('[Bootstrap] Failed:', error);
    return res.status(500).json({ error: 'Bootstrap failed', message: sanitizeError(error) });
  }
});

// GET /api/bootstrap/status — check DB state without auth
router.get('/status', async (_req: Request, res: Response) => {
  if (isProduction()) {
    return res.status(403).json({ error: 'Refused — production environment' });
  }
  try {
    const [users, workspaces, employees] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS n FROM users`),
      pool.query(`SELECT COUNT(*) AS n FROM workspaces`),
      pool.query(`SELECT COUNT(*) AS n FROM employees`),
    ]);
    const acmeOwner = await pool.query(`SELECT id, email FROM users WHERE email = 'owner@acme-security.test' LIMIT 1`);
    return res.json({
      total_users: parseInt(users.rows[0].n),
      total_workspaces: parseInt(workspaces.rows[0].n),
      total_employees: parseInt(employees.rows[0].n),
      acme_owner_exists: acmeOwner.rows.length > 0,
      is_production: isProduction(),
      railway_environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'not set',
      node_env: process.env.NODE_ENV,
      seeded: acmeOwner.rows.length > 0,
      action_needed: acmeOwner.rows.length === 0
        ? 'Run POST /api/bootstrap/dev-seed with X-Bootstrap-Key header to create accounts'
        : 'Accounts exist — login with owner@acme-security.test / admin123',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message });
  }
});

export default router;
