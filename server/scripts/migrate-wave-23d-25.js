/**
 * Wave 23D + 25 Database Migration
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent — safe to run multiple times (IF NOT EXISTS / DO NOTHING).
 * Run: node server/scripts/migrate-wave-23d-25.js
 *
 * Creates:
 *   support_sessions       — Shadow Mode immutable session log (Wave 23D)
 *   simulation_runs        — War Room drill tracking (Wave 25)
 *
 * Adds columns (idempotent ALTER TABLE):
 *   shifts.is_simulation + shifts.simulation_expires_at
 *   employees.is_simulation + employees.simulation_expires_at
 *   support_tickets.is_simulation + support_tickets.simulation_expires_at
 *   support_tickets.category + support_tickets.trinity_summary
 *   support_tickets.copilot_diagnostic + support_tickets.triage_confidence
 *   support_tickets.triage_completed_at + support_tickets.rbac_group
 *   error_logs.is_simulation + error_logs.simulation_expires_at
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run(label, sql) {
  try {
    await pool.query(sql);
    console.log(`  ✅ ${label}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
      console.log(`  ⏭️  ${label} (already exists — skipped)`);
    } else {
      console.error(`  ❌ ${label}: ${err.message}`);
      throw err;
    }
  }
}

async function migrate() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  CoAIleague — Wave 23D + 25 Migration');
  console.log('═══════════════════════════════════════════════════════\n');

  await pool.query('BEGIN');

  try {
    // ── support_sessions (Wave 23D — Shadow Mode) ─────────────────────────
    console.log('Creating support_sessions table...');
    await run('support_sessions table', `
      CREATE TABLE IF NOT EXISTS support_sessions (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id             TEXT NOT NULL,
        agent_email          TEXT NOT NULL,
        target_workspace_id  TEXT NOT NULL,
        justification        TEXT NOT NULL,
        started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at             TIMESTAMPTZ,
        is_active            BOOLEAN NOT NULL DEFAULT TRUE,
        actions              JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at           TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await run('support_sessions: idx_agent', `
      CREATE INDEX IF NOT EXISTS idx_support_sessions_agent_workspace
      ON support_sessions (agent_id, target_workspace_id, is_active)
    `);
    await run('support_sessions: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_support_sessions_workspace
      ON support_sessions (target_workspace_id, started_at DESC)
    `);

    // ── simulation_runs (Wave 25 — War Room) ──────────────────────────────
    console.log('\nCreating simulation_runs table...');
    await run('simulation_runs table', `
      CREATE TABLE IF NOT EXISTS simulation_runs (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id            TEXT NOT NULL,
        drill_name              TEXT NOT NULL,
        status                  TEXT NOT NULL DEFAULT 'running',
        started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at            TIMESTAMPTZ,
        result                  JSONB,
        simulation_expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
      )
    `);
    await run('simulation_runs: idx_workspace_drill', `
      CREATE INDEX IF NOT EXISTS idx_simulation_runs_workspace_drill
      ON simulation_runs (workspace_id, drill_name, status)
    `);

    // ── is_simulation columns ──────────────────────────────────────────────
    console.log('\nAdding is_simulation columns...');
    const simTables = ['shifts', 'employees', 'support_tickets', 'error_logs'];
    for (const table of simTables) {
      await run(`${table}.is_simulation`, `
        ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT FALSE
      `);
      await run(`${table}.simulation_expires_at`, `
        ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS simulation_expires_at TIMESTAMPTZ
      `);
      await run(`idx_${table}_simulation`, `
        CREATE INDEX IF NOT EXISTS idx_${table}_simulation
        ON ${table} (is_simulation, simulation_expires_at)
        WHERE is_simulation = TRUE
      `);
    }

    // ── Trinity triage columns on support_tickets ──────────────────────────
    console.log('\nAdding Trinity triage columns to support_tickets...');
    const triageCols = [
      ['category',              'TEXT'],
      ['trinity_summary',       'TEXT'],
      ['copilot_diagnostic',    'TEXT'],
      ['triage_confidence',     'NUMERIC(4,2)'],
      ['triage_completed_at',   'TIMESTAMPTZ'],
      ['rbac_group',            "TEXT DEFAULT 'general_agents'"],
    ];
    for (const [col, type] of triageCols) {
      await run(`support_tickets.${col}`, `
        ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ${col} ${type}
      `);
    }

    await pool.query('COMMIT');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Migration complete ✅');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Migration failed — rolled back:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
