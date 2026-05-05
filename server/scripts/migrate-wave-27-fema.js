/**
 * Wave 27 Database Migration — FEMA Surge Module Tables
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent — safe to run multiple times.
 * Run: node server/scripts/migrate-wave-27-fema.js
 *
 * Creates:
 *   surge_events           — Disaster relief deployment events
 *   surge_deployments      — Individual officer deployments per surge event
 *   fema_declaration_alerts — FEMA API declaration notifications per workspace
 *   per_diem_records       — Daily per diem tracking (lodging + meals)
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
  console.log('  CoAIleague — Wave 27 FEMA Surge Module Migration');
  console.log('═══════════════════════════════════════════════════════\n');

  await pool.query('BEGIN');

  try {
    // ── surge_events ──────────────────────────────────────────────────────────
    console.log('Creating surge_events table...');
    await run('surge_events table', `
      CREATE TABLE IF NOT EXISTS surge_events (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id          TEXT NOT NULL,
        title                 TEXT NOT NULL,
        state                 CHAR(2) NOT NULL,
        incident_name         TEXT,
        fema_disaster_number  TEXT,
        incident_type         TEXT,
        designated_area       TEXT,
        declaration_date      DATE,
        pay_rate_override     NUMERIC(8,2),
        per_diem_rate_cents   INTEGER DEFAULT 15900,  -- $159/day GSA default
        max_deployment_days   INTEGER DEFAULT 14,
        status                TEXT NOT NULL DEFAULT 'draft',  -- draft | active | closed
        created_by            TEXT,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await run('surge_events: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_surge_events_workspace
      ON surge_events (workspace_id, status, created_at DESC)
    `);
    await run('surge_events: idx_state_status', `
      CREATE INDEX IF NOT EXISTS idx_surge_events_state_status
      ON surge_events (state, status)
    `);

    // ── surge_deployments ─────────────────────────────────────────────────────
    console.log('\nCreating surge_deployments table...');
    await run('surge_deployments table', `
      CREATE TABLE IF NOT EXISTS surge_deployments (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        surge_event_id        UUID NOT NULL REFERENCES surge_events(id) ON DELETE CASCADE,
        workspace_id          TEXT NOT NULL,
        employee_id           TEXT NOT NULL,
        status                TEXT NOT NULL DEFAULT 'offered',  -- offered | accepted | deployed | completed | declined
        home_state            CHAR(2),
        deployment_state      CHAR(2),
        reciprocity_basis     TEXT,  -- EMAC | state_statute | executive_order | none
        reciprocity_notes     TEXT,
        hotel_name            TEXT,
        hotel_address         TEXT,
        hotel_checkin         DATE,
        hotel_checkout        DATE,
        travel_manifest_url   TEXT,
        per_diem_daily_cents  INTEGER,
        offer_sent_at         TIMESTAMPTZ,
        accepted_at           TIMESTAMPTZ,
        declined_at           TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (surge_event_id, employee_id)
      )
    `);
    await run('surge_deployments: idx_event', `
      CREATE INDEX IF NOT EXISTS idx_surge_deployments_event
      ON surge_deployments (surge_event_id, status)
    `);
    await run('surge_deployments: idx_employee', `
      CREATE INDEX IF NOT EXISTS idx_surge_deployments_employee
      ON surge_deployments (workspace_id, employee_id)
    `);

    // ── fema_declaration_alerts ───────────────────────────────────────────────
    console.log('\nCreating fema_declaration_alerts table...');
    await run('fema_declaration_alerts table', `
      CREATE TABLE IF NOT EXISTS fema_declaration_alerts (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id      TEXT NOT NULL,
        disaster_number   TEXT NOT NULL,
        state             CHAR(2) NOT NULL,
        declaration_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
        surge_event_id    UUID REFERENCES surge_events(id),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (workspace_id, disaster_number)
      )
    `);
    await run('fema_declaration_alerts: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_fema_alerts_workspace
      ON fema_declaration_alerts (workspace_id, created_at DESC)
    `);

    // ── per_diem_records ──────────────────────────────────────────────────────
    console.log('\nCreating per_diem_records table...');
    await run('per_diem_records table', `
      CREATE TABLE IF NOT EXISTS per_diem_records (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        surge_deployment_id   UUID NOT NULL REFERENCES surge_deployments(id) ON DELETE CASCADE,
        workspace_id          TEXT NOT NULL,
        employee_id           TEXT NOT NULL,
        record_date           DATE NOT NULL,
        lodging_cents         INTEGER NOT NULL DEFAULT 10900,   -- $109 federal baseline
        meals_cents           INTEGER NOT NULL DEFAULT 5900,    -- $59 federal baseline
        incidentals_cents     INTEGER NOT NULL DEFAULT 500,     -- $5 incidentals
        total_cents           INTEGER GENERATED ALWAYS AS (lodging_cents + meals_cents + incidentals_cents) STORED,
        is_gsa_rate           BOOLEAN NOT NULL DEFAULT TRUE,    -- FALSE = fallback used
        notes                 TEXT,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (surge_deployment_id, record_date)
      )
    `);
    await run('per_diem_records: idx_deployment', `
      CREATE INDEX IF NOT EXISTS idx_per_diem_deployment
      ON per_diem_records (surge_deployment_id, record_date)
    `);
    await run('per_diem_records: idx_employee', `
      CREATE INDEX IF NOT EXISTS idx_per_diem_employee
      ON per_diem_records (workspace_id, employee_id, record_date)
    `);

    await pool.query('COMMIT');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  FEMA Migration complete ✅');
    console.log('  Run /drill-all after this to verify War Room still passes.');
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
