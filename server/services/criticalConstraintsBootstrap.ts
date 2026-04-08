/**
 * Critical Database Constraints Bootstrap
 *
 * Some database invariants the application relies on (race-condition
 * exclusion constraints, btree_gist extension, etc.) are not expressible
 * in Drizzle's TypeScript schema DSL. They live as raw SQL that must be
 * applied idempotently every time the server boots, after ensureRequiredTables()
 * has settled the canonical schema.
 *
 * This module is the registry of those critical constraints. Each entry
 * has a `name`, an `idempotentCheck` SQL fragment, and an `applySql`
 * statement. The runner queries the check, and if the constraint is
 * missing, applies the statement.
 *
 * 🔴 Why this exists:
 * Drizzle migrations (`drizzle-kit push`) syncs schema from the TypeScript
 * definition. Exclusion constraints (EXCLUDE USING gist with tstzrange)
 * are not part of the Drizzle DSL, so push will never create them. The
 * SQL migration files in ./migrations/ are leftovers from drizzle-kit
 * generate and are not executed by the deploy pipeline.
 *
 * Without this bootstrap, the shift-overlap exclusion constraint
 * referenced as the "sole enforcement" in shiftRoutes.ts (RC5 Phase 2)
 * silently disappears whenever the database is rebuilt — a critical
 * race condition vulnerability.
 *
 * Add new entries here when you introduce a new raw-SQL invariant the
 * Drizzle schema cannot express. Each entry must be idempotent.
 */

import { pool } from '../db';
import { createLogger } from '../lib/logger';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';

const log = createLogger('criticalConstraintsBootstrap');

interface CriticalConstraint {
  name: string;
  /** Reason this constraint cannot live in the Drizzle schema */
  rationale: string;
  /** Returns true if the constraint is already present in the live DB */
  isPresent: () => Promise<boolean>;
  /** Apply the constraint (must be idempotent — safe to re-run) */
  apply: () => Promise<void>;
}

const constraints: CriticalConstraint[] = [
  {
    name: 'btree_gist_extension',
    rationale: 'Required by no_overlapping_employee_shifts gist exclusion constraint',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    },
  },
  // ── Phase T enum-value backfills (production log forensics 2026-04-07) ──
  // The live PostgreSQL enums for `shift_status` and `audit_action` were
  // missing values the application code references at runtime, producing
  // "invalid input value for enum" errors every cycle and cascading
  // "Audit log failed" spam in Railway production logs. ALTER TYPE ADD
  // VALUE IF NOT EXISTS is idempotent and safe to run on every boot.
  {
    name: 'shift_status_value_confirmed',
    rationale: 'shift-monitoring-cycle uses status="confirmed" but the live enum was missing it (production log error)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'shift_status' AND e.enumlabel = 'confirmed'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'confirmed'`);
    },
  },
  {
    name: 'shift_status_value_pending',
    rationale: 'shift_status enum was missing "pending" — application code references it (production log forensics 2026-04-08)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'shift_status' AND e.enumlabel = 'pending'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'pending'`);
    },
  },
  {
    name: 'shift_status_value_denied',
    rationale: 'shift_status enum was missing "denied" — referenced by criticalConstraintsBootstrap exclusion constraint and shift trading flows',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'shift_status' AND e.enumlabel = 'denied'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'denied'`);
    },
  },
  {
    name: 'shift_status_value_approved',
    rationale: 'shift_status enum was missing "approved" — application code references it for approval flows',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'shift_status' AND e.enumlabel = 'approved'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE shift_status ADD VALUE IF NOT EXISTS 'approved'`);
    },
  },
  {
    name: 'audit_action_value_service_unhealthy',
    rationale: 'healthCheckAggregation writes service_unhealthy audit rows but the live enum was missing it',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'audit_action' AND e.enumlabel = 'service_unhealthy'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'service_unhealthy'`);
    },
  },
  {
    name: 'audit_action_value_alert_triggered',
    rationale: 'metricsDashboard writes alert_triggered audit rows but the live enum was missing it',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'audit_action' AND e.enumlabel = 'alert_triggered'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'alert_triggered'`);
    },
  },
  {
    name: 'audit_action_value_test_audit_schema_insert',
    rationale: 'auditSchemaRegression test writes this value; missing from live enum',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'audit_action' AND e.enumlabel = 'test_audit_schema_insert'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'test_audit_schema_insert'`);
    },
  },
  // ── Phase X: Optimistic locking column (CLAUDE.md §15) ─────────────────
  // Section 15 mandates optimistic locking for concurrent shift edits:
  //   UPDATE shifts SET ..., version = version + 1
  //   WHERE id = $1 AND version = $2 RETURNING *
  //   → 0 rows → another edit won the race, return 409 Conflict
  // This column is infrastructure — the route-level version-check pattern
  // is a separate follow-up. Adding the column first is idempotent and
  // non-breaking: unused columns default to 1 on existing rows.
  // ── Phase Y: id-column gen_random_uuid() defaults ──────────────────────
  // The Drizzle schema declares `varchar("id").primaryKey().default(sql`gen_random_uuid()`)`
  // for these tables, but drizzle-kit push does not reliably propagate the
  // default to the live PostgreSQL column when the column is varchar (only
  // for Drizzle's native uuid type). The result was INSERTs that omit `id`
  // failing with "null value in column \"id\" violates not-null constraint".
  // ALTER COLUMN ... SET DEFAULT is idempotent and safe to re-run.
  {
    name: 'audit_logs_id_default',
    rationale: 'audit_logs.id default missing in live DB (Drizzle declares it but drizzle-kit push skips varchar SQL defaults)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'audit_logs' AND column_name = 'id'
           AND column_default LIKE '%gen_random_uuid%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  {
    name: 'token_usage_log_id_default',
    rationale: 'token_usage_log.id default missing in live DB (Drizzle declares it but drizzle-kit push skips varchar SQL defaults)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'token_usage_log' AND column_name = 'id'
           AND column_default LIKE '%gen_random_uuid%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE token_usage_log ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  {
    name: 'token_usage_log_timestamp_default',
    rationale: 'token_usage_log.timestamp NOT NULL violation — TokenUsageService omits timestamp on every write because Drizzle declares defaultNow().notNull() but drizzle-kit push did not propagate the default. Fires constantly in production logs.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'token_usage_log' AND column_name = 'timestamp'
           AND column_default LIKE '%now%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE token_usage_log ALTER COLUMN timestamp SET DEFAULT NOW()`
      );
    },
  },
  {
    name: 'audit_logs_user_id_nullable',
    rationale: 'audit_logs.user_id is NOT NULL in live DB but Drizzle declares it nullable. System-actor writes (payrollDeadlineNudgeService, healthCheckAggregation, metricsDashboard) omit user_id and fail constantly with "null value in column user_id violates not-null constraint" — every audit log write from a non-user actor errors out.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'audit_logs' AND column_name = 'user_id'
           AND is_nullable = 'YES'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL`
      );
    },
  },
  {
    name: 'audit_logs_user_email_nullable',
    rationale: 'audit_logs.user_email is NOT NULL in live DB but Drizzle declares it nullable. System-actor writes omit user_email and fail with "null value in column user_email violates not-null constraint" — testCorrectSchemaInsert regression test fails because of this. Drop the constraint.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'audit_logs' AND column_name = 'user_email'
           AND is_nullable = 'YES'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE audit_logs ALTER COLUMN user_email DROP NOT NULL`
      );
    },
  },
  {
    name: 'audit_logs_user_role_nullable',
    rationale: 'audit_logs.user_role is NOT NULL in live DB but Drizzle declares it nullable. System-actor writes (cron jobs, healthchecks, watchdogs) omit user_role and fail with "null value in column user_role violates not-null constraint". Covered by the generic audit_logs_drop_stale_not_nulls scanner below, but kept as an explicit entry per user directive so the intent is unambiguous.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'audit_logs' AND column_name = 'user_role'
           AND is_nullable = 'YES'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE audit_logs ALTER COLUMN user_role DROP NOT NULL`
      );
    },
  },
  {
    name: 'audit_logs_drop_stale_not_nulls',
    rationale: 'The Drizzle audit_logs schema only declares id and created_at as NOT NULL. The live DB has many additional NOT NULL columns (user_role, user_name, action, entity_type, entity_id, etc.) inherited from previous schema migrations that drizzle-kit push never reverted. System-actor writes omit most of these and fail with "null value in column ... violates not-null constraint". This generic scan finds every NOT NULL column on audit_logs except id and created_at and drops the constraint to match the schema.',
    isPresent: async () => {
      // Present (i.e. needs no work) when audit_logs has zero NOT NULL
      // columns other than id + created_at
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'audit_logs'
           AND is_nullable = 'NO'
           AND column_name NOT IN ('id', 'created_at')
         LIMIT 1`
      );
      return rows.length === 0;
    },
    apply: async () => {
      const { rows } = await pool.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'audit_logs'
           AND is_nullable = 'NO'
           AND column_name NOT IN ('id', 'created_at')`
      );
      for (const r of rows) {
        try {
          await pool.query(
            `ALTER TABLE audit_logs ALTER COLUMN "${r.column_name}" DROP NOT NULL`
          );
          log.info(`[criticalConstraints] dropped NOT NULL on audit_logs.${r.column_name}`);
        } catch (err: any) {
          log.warn(`[criticalConstraints] failed to drop NOT NULL on audit_logs.${r.column_name}: ${err?.message?.slice(0, 120)}`);
        }
      }
    },
  },
  {
    name: 'token_usage_monthly_ws_month_unique',
    rationale: 'tokenUsageMonthly.upsertMonthlyUsage() uses ON CONFLICT (workspace_id, month_year) DO UPDATE which requires a unique constraint or index on exactly those columns. The Drizzle schema declares unique("uq_token_usage_monthly_ws_month") but drizzle-kit push did not propagate it to the live DB, so monthly token rollups error every time TokenUsageService.recordUsage() runs.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_indexes
         WHERE tablename = 'token_usage_monthly'
           AND indexname = 'token_usage_monthly_ws_month_unique'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      // Dedupe any existing rows that would violate the new unique
      // constraint before installing it. Without this, CREATE on a
      // dirty table errors.
      await pool.query(`
        DELETE FROM token_usage_monthly a
        USING token_usage_monthly b
        WHERE a.ctid < b.ctid
          AND a.workspace_id = b.workspace_id
          AND a.month_year = b.month_year
      `);
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS token_usage_monthly_ws_month_unique
           ON token_usage_monthly (workspace_id, month_year)`
      );
    },
  },
  {
    name: 'cron_run_log_id_default',
    rationale: 'cron_run_log.id missing default — autonomousScheduler.trackJobExecution INSERT fails with "Failed to insert initial cron_run_log" because the id column lacks gen_random_uuid() default in the live DB.',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'cron_run_log' AND column_name = 'id'
           AND (column_default LIKE '%gen_random_uuid%' OR column_default LIKE '%nextval%')`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE cron_run_log ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  {
    name: 'interview_questions_bank_id_default',
    rationale: 'interview_questions_bank.id default missing in live DB (Drizzle declares it but drizzle-kit push skips varchar SQL defaults)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'interview_questions_bank' AND column_name = 'id'
           AND column_default LIKE '%gen_random_uuid%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE interview_questions_bank ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  {
    name: 'trinity_requests_id_default',
    rationale: 'trinity_requests.id default missing in live DB — TrinityOrchestrationGateway.flushRequestBuffer logs "Flush error" every 30s because INSERTs omit id and the column lacks gen_random_uuid() default',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'trinity_requests' AND column_name = 'id'
           AND column_default LIKE '%gen_random_uuid%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE trinity_requests ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  // ── Phase Z: trinity_self_awareness unique index ────────────────────────
  // trinitySelfAwarenessService.upsertFact uses ON CONFLICT (category, fact_key)
  // which requires a unique constraint or unique index on exactly those two
  // columns. The Drizzle schema declares it as uniqueIndex("tsa_category_key_unique")
  // but drizzle-kit push did not propagate it to the live DB, so 17 boot-time
  // upsertFact calls failed with "no unique or exclusion constraint matching
  // the ON CONFLICT specification". This bootstrap installs the index
  // idempotently. Also installs the trinity_self_awareness id default for the
  // same varchar(id) drizzle-kit-push limitation.
  {
    name: 'trinity_self_awareness_id_default',
    rationale: 'trinity_self_awareness.id default missing — upsertFact INSERTs omit id and rely on gen_random_uuid()',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'trinity_self_awareness' AND column_name = 'id'
           AND column_default LIKE '%gen_random_uuid%'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE trinity_self_awareness ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
      );
    },
  },
  {
    name: 'trinity_self_awareness_category_key_unique',
    rationale: 'ON CONFLICT (category, fact_key) target in trinitySelfAwarenessService.upsertFact requires this unique index — 17 upsert errors at boot when missing',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_indexes
         WHERE tablename = 'trinity_self_awareness'
           AND indexname = 'tsa_category_key_unique'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      // Drop any partial duplicates that would violate the new unique
      // constraint before installing it. Without this, ON a re-deploy where
      // the bootstrap failed previously and duplicates accumulated, the
      // CREATE would error.
      await pool.query(`
        DELETE FROM trinity_self_awareness a
        USING trinity_self_awareness b
        WHERE a.ctid < b.ctid
          AND a.category = b.category
          AND a.fact_key = b.fact_key
      `);
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS tsa_category_key_unique
           ON trinity_self_awareness (category, fact_key)`
      );
    },
  },
  {
    name: 'shifts_version_column',
    rationale: 'Optimistic locking for concurrent shift edits (CLAUDE.md §15)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'shifts' AND column_name = 'version'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      await pool.query(
        `ALTER TABLE shifts ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1`
      );
    },
  },
  {
    name: 'no_overlapping_employee_shifts',
    rationale: 'Sole atomic enforcement of shift overlap prevention (RC5 Phase 2 — see shiftRoutes.ts)',
    isPresent: async () => {
      const { rows } = await pool.query(
        `SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_employee_shifts'`
      );
      return rows.length > 0;
    },
    apply: async () => {
      // Scoped by (workspace_id, employee_id), ranged by (start_time, end_time).
      // Cancelled and denied shifts are excluded so a replacement shift can
      // occupy the same window as a previously-rejected one.
      await pool.query(`
        ALTER TABLE shifts
          ADD CONSTRAINT no_overlapping_employee_shifts
          EXCLUDE USING gist (
            workspace_id WITH =,
            employee_id  WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
          )
          WHERE (
            employee_id IS NOT NULL
            AND status NOT IN ('cancelled', 'denied')
          )
      `);
    },
  },
];

/**
 * GENERIC ID-DEFAULT BACKFILL
 *
 * Drizzle declares varchar("id").primaryKey().default(sql`gen_random_uuid()`)
 * for ~650 tables across the schema, but drizzle-kit push does NOT propagate
 * the SQL default to varchar columns (only to its native uuid type). The
 * result is a NOT NULL violation on every INSERT that omits id — the root
 * cause of the spam in production logs:
 *   - "Failed to log to database" (UniversalStepLogger)
 *   - "Failed to persist alert" (TrinityNotifier)
 *   - "Failed to record thought" (TrinityThoughtEngine)
 *   - "Failed to create execution" (AutomationExecutionTracker)
 *   - "[TrinityOrchestrationGateway] Flush error" (every 30s)
 *   - "Audit log failed" (every cron tick)
 *
 * Adding 650 individual bootstrap entries is impractical. This generic
 * backfill scans pg_attribute for every text/varchar `id` column on a
 * non-system schema table that lacks a default and applies
 * `gen_random_uuid()::text` to it in one pass. Idempotent — once a column
 * has the default, subsequent runs skip it via the WHERE clause.
 */
async function backfillGenRandomUuidDefaults(): Promise<{ scanned: number; patched: number; failed: number }> {
  let scanned = 0;
  let patched = 0;
  let failed = 0;
  try {
    const { rows } = await pool.query(`
      SELECT c.table_schema, c.table_name, c.column_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.column_name = 'id'
        AND c.data_type IN ('character varying', 'text')
        AND (c.column_default IS NULL OR c.column_default = '')
    `);
    scanned = rows.length;
    for (const r of rows) {
      try {
        await pool.query(
          `ALTER TABLE "${r.table_name}" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`
        );
        patched++;
      } catch (err: any) {
        failed++;
        log.warn(`[idDefaultBackfill] Failed on ${r.table_name}.id: ${err?.message?.slice(0, 120)}`);
      }
    }
  } catch (err: any) {
    log.error(`[idDefaultBackfill] Scan failed: ${err?.message}`);
  }
  return { scanned, patched, failed };
}

/**
 * GENERIC NOT NULL DRIFT SCANNER
 *
 * Root cause (same class as the varchar id-default issue): drizzle-kit
 * push did not reliably propagate nullability changes from the Drizzle
 * schema to the live database. Many tables have columns marked
 * `notNull: false` in the Drizzle schema but NOT NULL in the live DB,
 * left over from previous schema migrations. Every write that omits
 * such a column fails with "null value in column ... violates not-null
 * constraint". Individual symptoms we've seen include:
 *   - audit_logs.user_id / user_email / user_role
 *   - Trinity flush errors on trinity_requests (and related)
 *   - UniversalStepLogger write failures
 *   - Gap finding persistence failures
 *
 * This scanner uses Drizzle's getTableConfig() to introspect the
 * schema at runtime, enumerate every column each imported table
 * declares as nullable, and drop the NOT NULL constraint on any
 * matching column in the live DB. Idempotent — subsequent runs skip
 * columns that already match.
 *
 * We explicitly DO NOT touch:
 *   - Columns that have `notNull: true` in Drizzle (legitimately required)
 *   - Columns whose live DB is_nullable is already 'YES' (no drift)
 *   - Columns named 'id' (primary keys are correctly NOT NULL)
 *   - Columns named 'created_at' / 'updated_at' when they have a default
 *     (typically NOT NULL with defaultNow(), which Drizzle also declares
 *     NOT NULL so they won't be in our scan set anyway)
 */
/**
 * GENERIC TIMESTAMP defaultNow() BACKFILL
 *
 * Same root cause class as the varchar id-default and NOT NULL drift
 * issues: drizzle-kit push didn't reliably propagate default expressions
 * to the live DB on some columns. Many tables have timestamp columns
 * declared `defaultNow().notNull()` in Drizzle but no DEFAULT in the
 * live DB. INSERTs that omit the timestamp then fail with
 * "null value in column ... violates not-null constraint".
 *
 * Concrete example: token_usage_log.timestamp errored every time
 * TokenUsageService.recordUsage() ran (every Trinity action, every
 * email classification, every metered API call).
 *
 * This scanner finds every NOT NULL timestamp column on any
 * Drizzle-mapped table that lacks a DEFAULT in the live DB and adds
 * DEFAULT NOW(). Idempotent — subsequent runs skip columns that
 * already have a default.
 */
async function scanTimestampDefaultDrift(schemaTables: Record<string, unknown>): Promise<{
  tablesScanned: number;
  columnsChecked: number;
  columnsPatched: number;
  columnsFailed: number;
}> {
  const result = { tablesScanned: 0, columnsChecked: 0, columnsPatched: 0, columnsFailed: 0 };

  for (const [, value] of Object.entries(schemaTables)) {
    if (!value || typeof value !== 'object') continue;
    if (!(value instanceof PgTable)) continue;

    let tableCfg;
    try {
      tableCfg = getTableConfig(value as PgTable);
    } catch {
      continue;
    }
    if (tableCfg.schema && tableCfg.schema !== 'public') continue;
    result.tablesScanned++;

    // Find columns that:
    //   - Drizzle marks as NOT NULL
    //   - Drizzle says hasDefault: true (so the schema author expected
    //     a default value to be applied automatically)
    //   - Are timestamp / timestamptz / date type
    const candidateColumnNames: string[] = [];
    for (const col of tableCfg.columns) {
      if (!col.notNull) continue;
      if (!(col as any).hasDefault) continue;
      const colType = (col as any).columnType?.toLowerCase?.() ?? '';
      const dataType = (col as any).dataType?.toLowerCase?.() ?? '';
      const isTimeType =
        colType.includes('timestamp') ||
        dataType.includes('timestamp') ||
        colType === 'pgdate' ||
        dataType === 'date';
      if (!isTimeType) continue;
      candidateColumnNames.push(col.name);
    }
    if (candidateColumnNames.length === 0) continue;
    result.columnsChecked += candidateColumnNames.length;

    let driftRows;
    try {
      const { rows } = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
           AND column_name = ANY($2::text[])
           AND (column_default IS NULL OR column_default = '')`,
        [tableCfg.name, candidateColumnNames]
      );
      driftRows = rows;
    } catch (err: any) {
      log.warn(`[timestampDefaultDrift] Failed to scan ${tableCfg.name}: ${err?.message?.slice(0, 120)}`);
      continue;
    }

    for (const r of driftRows) {
      try {
        await pool.query(
          `ALTER TABLE "${tableCfg.name}" ALTER COLUMN "${r.column_name}" SET DEFAULT NOW()`
        );
        result.columnsPatched++;
        log.info(`[timestampDefaultDrift] set DEFAULT NOW() on ${tableCfg.name}.${r.column_name}`);
      } catch (err: any) {
        result.columnsFailed++;
        log.warn(`[timestampDefaultDrift] Failed on ${tableCfg.name}.${r.column_name}: ${err?.message?.slice(0, 120)}`);
      }
    }
  }
  return result;
}

async function scanNotNullDrift(schemaTables: Record<string, unknown>): Promise<{
  tablesScanned: number;
  columnsChecked: number;
  columnsPatched: number;
  columnsFailed: number;
}> {
  const result = { tablesScanned: 0, columnsChecked: 0, columnsPatched: 0, columnsFailed: 0 };

  for (const [exportName, value] of Object.entries(schemaTables)) {
    // Filter out non-table exports (enums, schemas, insertSchemas, types, etc)
    if (!value || typeof value !== 'object') continue;
    if (!(value instanceof PgTable)) continue;

    let tableCfg;
    try {
      tableCfg = getTableConfig(value as PgTable);
    } catch {
      continue;
    }
    // Only scan public-schema base tables
    if (tableCfg.schema && tableCfg.schema !== 'public') continue;

    result.tablesScanned++;
    const nullableColumnNames: string[] = [];
    for (const col of tableCfg.columns) {
      // Only scan columns the Drizzle schema declares as NULLABLE
      if (col.notNull) continue;
      nullableColumnNames.push(col.name);
    }
    if (nullableColumnNames.length === 0) continue;

    // Single query per table: find columns that are NOT NULL in live DB
    // AND appear in the Drizzle-nullable list
    let driftRows;
    try {
      const { rows } = await pool.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
           AND is_nullable = 'NO'
           AND column_name = ANY($2::text[])`,
        [tableCfg.name, nullableColumnNames]
      );
      driftRows = rows;
    } catch (err: any) {
      log.warn(`[notNullDrift] Failed to scan ${tableCfg.name}: ${err?.message?.slice(0, 120)}`);
      continue;
    }

    result.columnsChecked += nullableColumnNames.length;
    for (const r of driftRows) {
      try {
        await pool.query(
          `ALTER TABLE "${tableCfg.name}" ALTER COLUMN "${r.column_name}" DROP NOT NULL`
        );
        result.columnsPatched++;
        log.info(`[notNullDrift] dropped NOT NULL on ${tableCfg.name}.${r.column_name} (schema says nullable, live DB had NOT NULL)`);
      } catch (err: any) {
        result.columnsFailed++;
        log.warn(`[notNullDrift] Failed on ${tableCfg.name}.${r.column_name}: ${err?.message?.slice(0, 120)}`);
      }
    }
  }
  return result;
}

export async function ensureCriticalConstraints(): Promise<void> {
  log.info(`[criticalConstraints] Verifying ${constraints.length} critical constraints`);
  let installed = 0;
  let alreadyPresent = 0;
  let failed = 0;

  for (const c of constraints) {
    try {
      const present = await c.isPresent();
      if (present) {
        alreadyPresent++;
        continue;
      }
      log.warn(`[criticalConstraints] MISSING: ${c.name} — installing now (${c.rationale})`);
      await c.apply();
      installed++;
      log.info(`[criticalConstraints] Installed: ${c.name}`);
    } catch (err: any) {
      failed++;
      log.error(`[criticalConstraints] Failed to install ${c.name}: ${err?.message}`, { error: err });
    }
  }

  log.info(
    `[criticalConstraints] Complete: ${alreadyPresent} already present, ${installed} installed, ${failed} failed`
  );

  // Generic id-default backfill — patches any varchar/text id column on a
  // public-schema table that lacks a default. Idempotent and self-skipping.
  const back = await backfillGenRandomUuidDefaults();
  if (back.scanned > 0) {
    log.info(
      `[idDefaultBackfill] Scanned ${back.scanned} columns missing id defaults — patched ${back.patched}, failed ${back.failed}`
    );
  } else {
    log.info(`[idDefaultBackfill] All public-schema id columns have defaults — no patches needed`);
  }

  // Generic schema drift scanners — both lazy-import @shared/schema once
  // and use Drizzle's getTableConfig() to introspect every table at runtime.
  // Two distinct drift modes are checked:
  //   1. NOT NULL drift — column is NOT NULL in live DB but the Drizzle
  //      schema declares it nullable. Drops the constraint.
  //   2. Timestamp default drift — column is NOT NULL with a Drizzle
  //      `defaultNow()` annotation but no DEFAULT in the live DB.
  //      Adds DEFAULT NOW().
  // Both are root causes for the drizzle-kit-push-skipped-something class
  // of errors that have been hitting production logs.
  try {
    const schemaModule = await import('@shared/schema');
    const schemaRecord = schemaModule as Record<string, unknown>;

    const nullDrift = await scanNotNullDrift(schemaRecord);
    if (nullDrift.columnsPatched > 0 || nullDrift.columnsFailed > 0) {
      log.info(
        `[notNullDrift] Scanned ${nullDrift.tablesScanned} tables, ${nullDrift.columnsChecked} nullable columns — patched ${nullDrift.columnsPatched}, failed ${nullDrift.columnsFailed}`
      );
    } else {
      log.info(
        `[notNullDrift] Scanned ${nullDrift.tablesScanned} tables, ${nullDrift.columnsChecked} nullable columns — no drift detected`
      );
    }

    const tsDrift = await scanTimestampDefaultDrift(schemaRecord);
    if (tsDrift.columnsPatched > 0 || tsDrift.columnsFailed > 0) {
      log.info(
        `[timestampDefaultDrift] Scanned ${tsDrift.tablesScanned} tables, ${tsDrift.columnsChecked} candidate columns — patched ${tsDrift.columnsPatched}, failed ${tsDrift.columnsFailed}`
      );
    } else {
      log.info(
        `[timestampDefaultDrift] Scanned ${tsDrift.tablesScanned} tables, ${tsDrift.columnsChecked} candidate columns — no drift detected`
      );
    }
  } catch (err: any) {
    log.error(`[schemaDrift] Scan failed: ${err?.message}`, { error: err });
  }
}
