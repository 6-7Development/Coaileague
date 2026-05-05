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


    // ── FEMA Surge Module (Wave 27) ───────────────────────────────────────────
    console.log('\nCreating FEMA Surge Module tables...');

    await run('surge_events table', `
      CREATE TABLE IF NOT EXISTS surge_events (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id            TEXT NOT NULL,
        title                   TEXT NOT NULL,
        incident_name           TEXT,
        fema_disaster_number    INTEGER,
        state                   VARCHAR(2) NOT NULL,
        designated_area         TEXT,
        incident_type           TEXT,
        declaration_date        DATE,
        status                  TEXT NOT NULL DEFAULT 'draft',
        pay_rate_override       NUMERIC(10,2),
        per_diem_rate_cents     INTEGER,
        travel_reimbursement    BOOLEAN DEFAULT TRUE,
        max_deployment_days     INTEGER DEFAULT 14,
        created_by              TEXT,
        activated_at            TIMESTAMPTZ,
        closed_at               TIMESTAMPTZ,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await run('surge_deployments table', `
      CREATE TABLE IF NOT EXISTS surge_deployments (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        surge_event_id          UUID NOT NULL REFERENCES surge_events(id),
        workspace_id            TEXT NOT NULL,
        employee_id             TEXT NOT NULL,
        status                  TEXT NOT NULL DEFAULT 'offered',
        accepted_at             TIMESTAMPTZ,
        declined_at             TIMESTAMPTZ,
        deployed_at             TIMESTAMPTZ,
        returned_at             TIMESTAMPTZ,
        hotel_assignment        TEXT,
        hotel_address           TEXT,
        travel_mode             TEXT,
        per_diem_claimed_cents  INTEGER DEFAULT 0,
        home_state              VARCHAR(2),
        deployment_state        VARCHAR(2),
        reciprocity_basis       TEXT,
        reciprocity_notes       TEXT,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await run('fema_declaration_alerts table', `
      CREATE TABLE IF NOT EXISTS fema_declaration_alerts (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id      TEXT NOT NULL,
        disaster_number   INTEGER NOT NULL,
        state             VARCHAR(2),
        declaration_data  JSONB,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (workspace_id, disaster_number)
      )
    `);

    await run('per_diem_records table', `
      CREATE TABLE IF NOT EXISTS per_diem_records (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        surge_deployment_id   UUID REFERENCES surge_deployments(id),
        workspace_id          TEXT NOT NULL,
        employee_id           TEXT NOT NULL,
        date                  DATE NOT NULL,
        gsa_locality_code     TEXT,
        lodging_rate_cents    INTEGER,
        meals_rate_cents      INTEGER,
        incidentals_cents     INTEGER,
        total_cents           INTEGER,
        receipts_uploaded     BOOLEAN DEFAULT FALSE,
        approved_by           TEXT,
        approved_at           TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await run('idx_surge_events_workspace', `
      CREATE INDEX IF NOT EXISTS idx_surge_events_workspace ON surge_events(workspace_id, status)
    `);
    await run('idx_surge_deployments_event', `
      CREATE INDEX IF NOT EXISTS idx_surge_deployments_event ON surge_deployments(surge_event_id, status)
    `);
    await run('idx_surge_deployments_employee', `
      CREATE INDEX IF NOT EXISTS idx_surge_deployments_employee ON surge_deployments(employee_id)
    `);

    
    // ── ptt_seats (PTT per-seat billing) ──────────────────────────────────────
    console.log('\nCreating ptt_seats table...');
    await run('ptt_seats table', `
      CREATE TABLE IF NOT EXISTS ptt_seats (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id          TEXT NOT NULL,
        employee_id           TEXT NOT NULL,
        is_active             BOOLEAN NOT NULL DEFAULT true,
        activated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        activated_by          TEXT,
        deactivated_at        TIMESTAMPTZ,
        stripe_item_id        TEXT,
        minutes_used_period   INTEGER NOT NULL DEFAULT 0,
        UNIQUE (workspace_id, employee_id)
      )
    `);
    await run('ptt_seats: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_ptt_seats_workspace
      ON ptt_seats (workspace_id, is_active)
    `);

    
    // ── billing_action_log (per-action charge recording) ──────────────────────
    console.log('\nCreating billing_action_log table...');
    await run('billing_action_log table', `
      CREATE TABLE IF NOT EXISTS billing_action_log (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id  TEXT NOT NULL,
        action_type   TEXT NOT NULL,
        amount_cents  INTEGER NOT NULL DEFAULT 0,
        entity_id     TEXT,
        entity_type   TEXT,
        metadata      JSONB DEFAULT '{}'::jsonb,
        stripe_item   TEXT,
        billed_at     TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await run('billing_action_log: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_billing_action_log_workspace
      ON billing_action_log (workspace_id, action_type, created_at DESC)
    `);

    
    // ── VMS tables (Wave 29C — Hardware-Agnostic VMS Bridge) ──────────────────
    console.log('\nCreating VMS tables...');
    await run('camera_registrations table', `
      CREATE TABLE IF NOT EXISTS camera_registrations (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id      TEXT NOT NULL,
        camera_id         TEXT NOT NULL,
        camera_name       TEXT,
        zone_name         TEXT,
        latitude          NUMERIC(10,6),
        longitude         NUMERIC(10,6),
        vms_vendor        TEXT DEFAULT 'generic',
        webhook_secret    TEXT NOT NULL,
        is_active         BOOLEAN NOT NULL DEFAULT true,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ,
        UNIQUE (workspace_id, camera_id)
      )
    `);
    await run('vms_events table', `
      CREATE TABLE IF NOT EXISTS vms_events (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id            TEXT NOT NULL,
        camera_id               TEXT NOT NULL,
        camera_name             TEXT,
        org_code                TEXT NOT NULL,
        event_type              TEXT NOT NULL,
        raw_event_type          TEXT,
        zone_name               TEXT,
        severity                TEXT NOT NULL DEFAULT 'info',
        event_timestamp         TEXT,
        payload                 JSONB DEFAULT '{}'::jsonb,
        acknowledged_at         TIMESTAMPTZ,
        acknowledged_by         TEXT,
        resolution_notes        TEXT,
        response_time_seconds   NUMERIC(10,2),
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await run('vms_events: idx_workspace', `
      CREATE INDEX IF NOT EXISTS idx_vms_events_workspace
      ON vms_events (workspace_id, severity, created_at DESC)
    `);
    await run('dar_entries: vms_event_id column', `
      ALTER TABLE dar_entries ADD COLUMN IF NOT EXISTS vms_event_id UUID
    `);

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
