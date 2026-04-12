/**
 * PHASE 35 — SEARCH INFRASTRUCTURE BOOTSTRAP
 *
 * Idempotent boot-time setup for global search:
 *   1. Enable pg_trgm extension (needed for similarity() in fuzzy name search)
 *   2. Create search_query_log table (analytics — no PII)
 *   3. Create concurrent GIN indexes on searchable text columns
 *
 * Registered via registerLegacyBootstrap so it runs after the DB pool is up.
 * All DDL is safe to re-run (IF NOT EXISTS / CONCURRENT).
 */

import { registerLegacyBootstrap } from './legacyBootstrapRegistry';
import { createLogger } from '../lib/logger';

const log = createLogger('searchBootstrap');

registerLegacyBootstrap('search_infrastructure', async (pool) => {
  // ── 1. pg_trgm extension ─────────────────────────────────────────────────
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  log.info('[searchBootstrap] pg_trgm extension ensured');

  // ── 2. search_query_log table ────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS search_query_log (
      id              BIGSERIAL PRIMARY KEY,
      workspace_id    TEXT        NOT NULL,
      query_text      TEXT        NOT NULL,
      entity_types    TEXT[]      NOT NULL DEFAULT '{}',
      result_count    INTEGER     NOT NULL DEFAULT 0,
      took_ms         INTEGER     NOT NULL DEFAULT 0,
      user_role       TEXT        NOT NULL DEFAULT 'unknown',
      clicked_entity_type TEXT    NULL,
      clicked_entity_id   TEXT    NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Index for workspace scoping (queries in log-click and suggestions endpoints)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS search_query_log_workspace_idx
      ON search_query_log (workspace_id, created_at DESC)
  `);

  log.info('[searchBootstrap] search_query_log table ensured');

  // ── 3. GIN trigram indexes on searchable text columns ────────────────────
  // Each index is CONCURRENT and IF NOT EXISTS — safe on every boot.
  // Tables that may not yet exist in some envs are skipped gracefully.

  const ginIndexes: Array<{ table: string; name: string; expr: string }> = [
    {
      table: 'employees',
      name: 'employees_search_gin',
      expr: `(coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(employee_number,'') || ' ' || coalesce(guard_card_number,'') || ' ' || coalesce(phone,''))`,
    },
    {
      table: 'clients',
      name: 'clients_search_gin',
      expr: `(coalesce(company_name,'') || ' ' || coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(poc_name,'') || ' ' || coalesce(client_number,''))`,
    },
    {
      table: 'shifts',
      name: 'shifts_search_gin',
      expr: `(coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(shift_number,''))`,
    },
    {
      table: 'invoices',
      name: 'invoices_search_gin',
      expr: `(coalesce(invoice_number,'') || ' ' || coalesce(notes,''))`,
    },
    {
      table: 'incident_reports',
      name: 'incident_reports_search_gin',
      expr: `(coalesce(title,'') || ' ' || coalesce(polished_description,'') || ' ' || coalesce(raw_description,'') || ' ' || coalesce(incident_type,'') || ' ' || coalesce(location_address,''))`,
    },
    {
      table: 'document_vault',
      name: 'document_vault_search_gin',
      expr: `(coalesce(title,'') || ' ' || coalesce(category,''))`,
    },
    {
      table: 'support_tickets',
      name: 'support_tickets_search_gin',
      expr: `(coalesce(subject,'') || ' ' || coalesce(description,'') || ' ' || coalesce(ticket_number,''))`,
    },
  ];

  for (const idx of ginIndexes) {
    try {
      // Validate that table and index names are safe SQL identifiers before
      // interpolating — these come from the hardcoded array above but we guard
      // defensively in case this pattern is reused with dynamic input.
      const SAFE_IDENT_RE = /^[a-z_][a-z0-9_]*$/;
      if (!SAFE_IDENT_RE.test(idx.table) || !SAFE_IDENT_RE.test(idx.name)) {
        log.warn(`[searchBootstrap] Skipping GIN index with unsafe identifier: ${idx.name}`);
        continue;
      }

      // Check if table exists before attempting CONCURRENT index creation.
      // CONCURRENT cannot run inside a transaction, so we use a plain pool.query.
      const tableCheck = await pool.query(
        `SELECT to_regclass($1::text)`,
        [idx.table]
      );
      if (!tableCheck.rows[0]?.to_regclass) {
        log.info(`[searchBootstrap] table ${idx.table} does not exist yet — skipping GIN index`);
        continue;
      }

      // Check if index already exists
      const idxCheck = await pool.query(
        `SELECT to_regclass($1::text)`,
        [idx.name]
      );
      if (idxCheck.rows[0]?.to_regclass) {
        continue; // already exists
      }

      await pool.query(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${idx.name}
           ON ${idx.table} USING GIN (${idx.expr} gin_trgm_ops)`
      );
      log.info(`[searchBootstrap] GIN index ${idx.name} created`);
    } catch (err: any) {
      // Non-fatal — a missing column or transient error should not prevent boot
      log.warn(`[searchBootstrap] GIN index ${idx.name} skipped: ${err?.message}`);
    }
  }

  log.info('[searchBootstrap] Search infrastructure bootstrap complete');
});
