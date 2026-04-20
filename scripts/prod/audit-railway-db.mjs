#!/usr/bin/env node
// CoAIleague Railway DB audit — read-only, all 10 sections.
//
// Usage:
//   DATABASE_URL=postgresql://... node scripts/prod/audit-railway-db.mjs
//   # or:
//   railway run node scripts/prod/audit-railway-db.mjs
//
// Writes:
//   audit_reports/railway-audit-<ISO>.json   (raw)
//   audit_reports/railway-audit-<ISO>.txt    (human summary)
//
// Per-query failures are captured and reported — the audit never aborts
// midway. Missing tables/columns surface as findings, not crashes.

import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(2);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 4,
  statement_timeout: 30_000,
  query_timeout: 30_000,
  idleTimeoutMillis: 5_000,
});

const results = {};
const errors = [];

async function run(section, label, sql, params = []) {
  const key = `${section}::${label}`;
  try {
    const { rows } = await pool.query(sql, params);
    results[key] = rows;
    console.log(`[ok] ${key}  rows=${rows.length}`);
    return rows;
  } catch (e) {
    const msg = e?.message || String(e);
    errors.push({ section, label, error: msg });
    results[key] = { error: msg };
    console.log(`[err] ${key}  ${msg}`);
    return null;
  }
}

// Tables that must exist (from spec Section 1).
const EXPECTED_TABLES = [
  'workspaces','users','employees','clients','sites','shifts','invoices',
  'payroll_runs','payroll_periods','time_entries','time_punches','timesheet_approvals',
  'org_subscriptions','processed_stripe_events','billing_audit_log',
  'ai_usage_events','ai_usage_daily_rollups','token_usage_monthly',
  'elite_feature_usage','payroll_run_locks',
  'shift_chatrooms','shift_chatroom_messages','shift_chatroom_members',
  'notification_deliveries','notifications','inbound_email_log',
  'trinity_email_conversations','email_sends',
  'trinity_conversation_sessions','trinity_conversation_turns',
  'trinity_thought_signatures','trinity_thinking_sessions','thalamic_log',
  'trinity_emotional_memory','trinity_cognitive_state','temporal_entity_arcs',
  'trinity_narrative','trinity_self_awareness','somatic_pattern_library',
  'social_entities','incubation_queue','trinity_hypothesis_sessions',
  'trinity_memory_service','trinity_goal_executions','trinity_buddy_settings',
  'trinity_automation_settings','trinity_workspace_pauses','trinity_runtime_flags',
  'trinity_action_invocations','trinity_decision_log','trinity_audit_logs',
  'regulatory_rules','compliance_checks','audit_logs',
  'employee_certifications','document_vault','employee_documents','document_signatures',
  'shift_trades','shift_coverage_requests','availability',
  'guard_tours','guard_tour_checkpoints','shift_proof_photos',
  'ai_approvals','ai_brain_action_logs','ai_brain_jobs','ai_insights',
  'ai_proactive_alerts','ai_gap_findings',
  'performance_reviews','training_modules','training_sessions',
  'daily_activity_reports','incident_reports','dar_reports',
  'visitors','key_control','lost_and_found',
  'ai_rate_limit_windows','plaid_transfer_attempts',
  'rfp_deals','activities','support_tickets','support_conversations',
];

// Columns the code expects (from spec Section 5).
const EXPECTED_COLUMNS = [
  ['shifts','deleted_at'],
  ['employees','deleted_at'],
  ['clients','deleted_at'],
  ['invoices','deleted_at'],
  ['document_vault','deleted_at'],
  ['shift_chatroom_messages','is_audit_protected'],
  ['shift_proof_photos','chain_of_custody_hash'],
  ['dar_reports','pdf_url'],
  ['dar_reports','photo_count'],
  ['invoices','workspace_id'],
  ['temporal_entity_arcs','trinity_attention_level'],
  ['trinity_emotional_memory','context_summary'],
  ['somatic_pattern_library','feature_vector'],
  ['thalamic_log','trust_tier'],
  ['workspaces','plaid_item_id'],
  ['workspaces','plaid_access_token_encrypted'],
  ['workspaces','trinity_access_enabled'],
  ['payroll_run_locks','workspace_id'],
  ['payroll_run_locks','expires_at'],
];

// Count helper that returns NULL if the table doesn't exist.
function countSql(table, whereClause = '') {
  return `
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) THEN (SELECT COUNT(*) FROM public.${table} ${whereClause})::text
    ELSE '__MISSING__' END AS count
  `;
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`\n=== CoAIleague Railway DB audit  ${startedAt} ===\n`);

  // ---------- SECTION 1: table existence ----------
  await run('1', 'missing_tables', `
    SELECT t.table_name
    FROM unnest($1::text[]) AS t(table_name)
    LEFT JOIN information_schema.tables ist
      ON ist.table_name = t.table_name AND ist.table_schema = 'public'
    WHERE ist.table_name IS NULL
    ORDER BY t.table_name;
  `, [EXPECTED_TABLES]);

  await run('1', 'total_tables_in_db', `
    SELECT COUNT(*)::int AS total
    FROM information_schema.tables WHERE table_schema = 'public';
  `);

  // ---------- SECTION 2: critical row counts ----------
  const criticalTables = [
    'workspaces','users','employees','clients','sites','shifts','invoices',
    'payroll_runs','time_entries','notification_deliveries','inbound_email_log',
    'shift_chatroom_messages','dar_reports','regulatory_rules','ai_approvals',
    'ai_brain_action_logs','support_tickets','elite_feature_usage',
  ];
  const counts = [];
  for (const t of criticalTables) {
    const rows = await run('2', `count_${t}`, countSql(t));
    counts.push({ table: t, count: rows?.[0]?.count ?? null });
  }
  results['2::row_counts'] = counts;

  // ---------- SECTION 3A: brain table health ----------
  const brainChecks = [
    { table: 'thalamic_log', tsCol: 'created_at' },
    { table: 'trinity_emotional_memory', tsCol: 'created_at' },
    { table: 'temporal_entity_arcs', tsCol: 'last_assessed_at' },
    { table: 'trinity_narrative', tsCol: 'updated_at' },
    { table: 'somatic_pattern_library', tsCol: null },
    { table: 'incubation_queue', tsCol: 'created_at' },
    { table: 'trinity_hypothesis_sessions', tsCol: 'created_at' },
    { table: 'trinity_thought_signatures', tsCol: 'created_at' },
    { table: 'social_entities', tsCol: 'last_assessed' },
    { table: 'trinity_self_awareness', tsCol: null },
  ];
  for (const { table, tsCol } of brainChecks) {
    const whereDay = tsCol ? `WHERE ${tsCol} > NOW() - INTERVAL '24 hours'` : 'WHERE 1=0';
    const whereWeek = tsCol ? `WHERE ${tsCol} > NOW() - INTERVAL '7 days'` : 'WHERE 1=0';
    await run('3A', `brain_${table}`, `
      SELECT
        CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name=$1
        ) THEN (SELECT COUNT(*) FROM public.${table})::text ELSE '__MISSING__' END AS total,
        CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name=$1
        ) THEN (SELECT COUNT(*) FROM public.${table} ${whereDay})::text ELSE '__MISSING__' END AS last_24h,
        CASE WHEN EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name=$1
        ) THEN (SELECT COUNT(*) FROM public.${table} ${whereWeek})::text ELSE '__MISSING__' END AS last_7d;
    `, [table]);
  }

  // ---------- SECTION 3B: narrative identity preview ----------
  await run('3B', 'narrative_preview', `
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name='trinity_narrative'
    ) THEN 'OK' ELSE 'MISSING' END AS status;
  `);
  await run('3B', 'narrative_rows', `
    SELECT workspace_id,
           LEFT(self_assessment, 120) AS self_assessment_preview,
           updated_at
    FROM trinity_narrative
    ORDER BY updated_at DESC
    LIMIT 5;
  `).catch(() => null);

  // ---------- SECTION 3C: dream cycle ----------
  await run('3C', 'memory_consolidation', `SELECT MAX(updated_at) AS last_ran FROM trinity_memory_service;`);
  await run('3C', 'social_graph',        `SELECT MAX(last_assessed) AS last_ran FROM social_entities;`);
  await run('3C', 'temporal_arcs',       `SELECT MAX(last_assessed_at) AS last_ran FROM temporal_entity_arcs;`);
  await run('3C', 'narrative_update',    `SELECT MAX(updated_at) AS last_ran FROM trinity_narrative;`);
  await run('3C', 'incubation',          `SELECT MAX(last_attempted_at) AS last_ran FROM incubation_queue;`);

  // ---------- SECTION 4: mock / seed data ----------
  await run('4A', 'seed_workspaces', `
    SELECT id, name, status, created_at
    FROM workspaces
    WHERE name ILIKE ANY(ARRAY['%acme%','%test%','%demo%','%anvil%','%sample%','%dev%','%staging%'])
       OR id LIKE 'dev-%' OR id LIKE 'test-%' OR id LIKE 'acme-%'
    ORDER BY created_at;
  `);

  await run('4B', 'seed_users', `
    SELECT id, email, LEFT(first_name,20) AS first_name, created_at
    FROM users
    WHERE email ILIKE ANY(ARRAY[
      '%@example.com','%@test.com','%@fake.com',
      'test@%','admin@acme%','manager@acme%',
      '%testuser%','%seeduser%','%devuser%'
    ])
    ORDER BY created_at;
  `);

  await run('4C', 'seed_phones', `
    SELECT id, first_name, last_name, phone, workspace_id
    FROM employees
    WHERE phone LIKE '555%' OR phone LIKE '(555)%'
       OR phone = '1234567890' OR phone = '0000000000'
       OR phone ILIKE '%555-0%'
    LIMIT 20;
  `);

  await run('4D', 'null_island_gps', `
    SELECT id, workspace_id, gps_lat AS latitude, gps_lng AS longitude, captured_at AS created_at
    FROM shift_proof_photos
    WHERE (gps_lat = 0 AND gps_lng = 0) OR gps_lat IS NULL OR gps_lng IS NULL
    LIMIT 10;
  `);

  await run('4E', 'suspicious_round_invoices', `
    SELECT workspace_id, COUNT(*) AS invoice_count,
      COUNT(*) FILTER (WHERE total::numeric IN (1000,5000,10000,999,100,500)) AS suspicious_round
    FROM invoices
    WHERE workspace_id NOT IN (
      SELECT id FROM workspaces
      WHERE name ILIKE ANY(ARRAY['%acme%','%test%','%demo%'])
    )
    GROUP BY workspace_id
    HAVING COUNT(*) FILTER (WHERE total::numeric IN (1000,5000,10000,999,100,500)) > 3;
  `);

  await run('4F', 'regulatory_rules_by_source', `
    SELECT state, category, COUNT(*) AS rule_count,
      MAX(last_verified) AS last_verified,
      COUNT(*) FILTER (WHERE verified_by = 'trinity_research') AS trinity_researched,
      COUNT(*) FILTER (WHERE verified_by = 'seed') AS seeded
    FROM regulatory_rules
    GROUP BY state, category
    ORDER BY state, category;
  `);

  // ---------- SECTION 5: schema drift ----------
  const cols = await run('5', 'expected_columns_lookup', `
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (table_name, column_name) IN (
        ${EXPECTED_COLUMNS.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',')}
      );
  `, EXPECTED_COLUMNS.flat());
  const present = new Set((cols || []).map(r => `${r.table_name}.${r.column_name}`));
  const missingColumns = EXPECTED_COLUMNS
    .filter(([t, c]) => !present.has(`${t}.${c}`))
    .map(([t, c]) => ({ table: t, column: c, status: 'MISSING' }));
  results['5::missing_columns'] = missingColumns;

  // ---------- SECTION 6: workspace isolation ----------
  await run('6A', 'cross_tenant_employees', `
    SELECT e.id AS employee_id, e.workspace_id AS employee_workspace, u.id AS user_id
    FROM employees e
    JOIN users u ON u.id = e.user_id
    WHERE e.workspace_id IS NOT NULL
      AND u.workspace_id IS NOT NULL
      AND e.workspace_id != u.workspace_id
    LIMIT 10;
  `);
  await run('6B', 'shifts_missing_workspace', `
    SELECT COUNT(*)::int AS n FROM shifts WHERE workspace_id IS NULL OR workspace_id = '';
  `);
  await run('6C', 'invoices_missing_workspace', `
    SELECT COUNT(*)::int AS n FROM invoices WHERE workspace_id IS NULL OR workspace_id = '';
  `);
  await run('6D', 'deliveries_missing_workspace', `
    SELECT COUNT(*)::int AS n FROM notification_deliveries WHERE workspace_id IS NULL;
  `);

  // ---------- SECTION 7: feature wiring ----------
  await run('7A', 'inbound_email_pipeline', `
    SELECT email_category, COUNT(*) AS total,
      COUNT(*) FILTER (WHERE processing_status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE processing_status = 'failed')    AS failed,
      COUNT(*) FILTER (WHERE processing_status = 'pending')   AS pending,
      MAX(received_at) AS most_recent
    FROM inbound_email_log
    GROUP BY email_category
    ORDER BY total DESC;
  `);

  await run('7B', 'calloff_coverage', `
    SELECT COUNT(*) AS total_calloffs,
      COUNT(*) FILTER (WHERE coverage_found = true)  AS covered,
      COUNT(*) FILTER (WHERE coverage_found = false) AS uncovered,
      AVG(EXTRACT(EPOCH FROM (coverage_found_at - created_at))/60)::numeric(6,1)
        AS avg_coverage_time_minutes
    FROM calloff_requests
    WHERE created_at > NOW() - INTERVAL '30 days';
  `);

  await run('7C', 'nds_health', `
    SELECT channel, status, COUNT(*) AS count, MAX(created_at) AS most_recent
    FROM notification_deliveries
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY channel, status
    ORDER BY channel, status;
  `);

  await run('7D', 'thought_signatures_7d', `
    SELECT phase, COUNT(*) AS count,
      AVG(confidence_score)::numeric(4,2) AS avg_confidence,
      MAX(created_at) AS most_recent
    FROM trinity_thought_signatures
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY phase
    ORDER BY count DESC;
  `);

  await run('7E', 'stuck_payroll_locks', `
    SELECT * FROM payroll_run_locks WHERE expires_at < NOW();
  `);

  await run('7F', 'proof_photo_gps', `
    SELECT COUNT(*) AS total_photos,
      COUNT(*) FILTER (WHERE gps_lat IS NOT NULL) AS with_gps,
      COUNT(*) FILTER (WHERE gps_lat IS NULL) AS without_gps,
      COUNT(*) FILTER (WHERE is_audit_protected = true) AS audit_protected,
      MAX(captured_at) AS most_recent
    FROM shift_proof_photos;
  `);

  await run('7G', 'dar_pdfs', `
    SELECT COUNT(*) AS total_dars,
      COUNT(*) FILTER (WHERE pdf_url IS NOT NULL) AS with_pdf,
      COUNT(*) FILTER (WHERE pdf_url IS NULL)     AS without_pdf,
      COUNT(*) FILTER (WHERE trinity_articulated = true) AS trinity_articulated,
      MAX(created_at) AS most_recent
    FROM dar_reports;
  `);

  // ---------- SECTION 8: operational snapshot ----------
  const ops = [
    ['active_workspaces',         `SELECT COUNT(*)::text AS value FROM workspaces WHERE status = 'active'`],
    ['active_employees',          `SELECT COUNT(*)::text FROM employees WHERE is_active = true`],
    ['shifts_this_week',          `SELECT COUNT(*)::text FROM shifts WHERE start_time > NOW() - INTERVAL '7 days'`],
    ['uncovered_shifts_48h',      `SELECT COUNT(*)::text FROM shifts WHERE (employee_id IS NULL OR employee_id = '')
                                     AND status NOT IN ('cancelled','completed')
                                     AND start_time BETWEEN NOW() AND NOW() + INTERVAL '48 hours'`],
    ['open_invoices_total',       `SELECT COALESCE(SUM(total::numeric),0)::text FROM invoices
                                     WHERE status NOT IN ('paid','void','draft')`],
    ['overdue_invoices',          `SELECT COUNT(*)::text FROM invoices
                                     WHERE status NOT IN ('paid','void','draft') AND due_date < NOW()`],
    ['payroll_runs_this_month',   `SELECT COUNT(*)::text FROM payroll_runs
                                     WHERE created_at > DATE_TRUNC('month', NOW())`],
    ['failed_notifications_24h',  `SELECT COUNT(*)::text FROM notification_deliveries
                                     WHERE status IN ('failed','permanently_failed')
                                       AND created_at > NOW() - INTERVAL '24 hours'`],
    ['pending_ai_approvals',      `SELECT COUNT(*)::text FROM ai_approvals WHERE decision = 'pending'`],
    ['thalamic_signals_today',    `SELECT COUNT(*)::text FROM thalamic_log
                                     WHERE created_at > NOW() - INTERVAL '24 hours'`],
    ['calloff_emails_30d',        `SELECT COUNT(*)::text FROM inbound_email_log
                                     WHERE email_category = 'calloff'
                                       AND received_at > NOW() - INTERVAL '30 days'`],
    ['trinity_chats_today',       `SELECT COUNT(*)::text FROM trinity_conversation_turns
                                     WHERE created_at > NOW() - INTERVAL '24 hours'`],
  ];
  const opsOut = [];
  for (const [label, sql] of ops) {
    const r = await run('8', label, sql);
    opsOut.push({ metric: label, value: r?.[0]?.value ?? r?.[0]?.count ?? null });
  }
  results['8::ops_snapshot'] = opsOut;

  // ---------- SECTION 9: indexes / vacuum ----------
  await run('9', 'large_tables_stats', `
    SELECT schemaname, relname AS tablename, n_live_tup AS row_count,
           n_dead_tup AS dead_rows, last_vacuum, last_analyze
    FROM pg_stat_user_tables
    WHERE n_live_tup > 1000
    ORDER BY n_live_tup DESC
    LIMIT 20;
  `);

  await run('9', 'workspace_id_index_gaps', `
    WITH ws_tables AS (
      SELECT c.table_name
      FROM information_schema.columns c
      WHERE c.column_name = 'workspace_id' AND c.table_schema = 'public'
    ),
    indexed AS (
      SELECT DISTINCT tablename FROM pg_indexes
      WHERE schemaname = 'public'
        AND (indexname ILIKE '%workspace%' OR indexdef ILIKE '%workspace_id%')
    )
    SELECT w.table_name, s.n_live_tup AS row_count
    FROM ws_tables w
    JOIN pg_stat_user_tables s ON s.relname = w.table_name
    WHERE w.table_name NOT IN (SELECT tablename FROM indexed)
      AND s.n_live_tup > 100
    ORDER BY s.n_live_tup DESC
    LIMIT 20;
  `);

  // ---------- SECTION 10: Statewide tenant audit ----------
  await run('10', 'statewide_tenant', `
    SELECT
      w.id AS workspace_id, w.name, w.status, w.subscription_status,
      w.trinity_access_enabled,
      w.plaid_item_id IS NOT NULL AS plaid_connected,
      w.plaid_access_token_encrypted IS NOT NULL AS plaid_token_stored,
      (SELECT COUNT(*) FROM employees WHERE workspace_id = w.id AND is_active = true)
        AS active_employees,
      (SELECT COUNT(*) FROM clients   WHERE workspace_id = w.id) AS client_count,
      (SELECT COUNT(*) FROM sites     WHERE workspace_id = w.id) AS site_count,
      (SELECT COUNT(*) FROM shifts    WHERE workspace_id = w.id
         AND start_time > NOW() - INTERVAL '7 days') AS shifts_this_week,
      (SELECT COUNT(*) FROM trinity_conversation_sessions WHERE workspace_id = w.id)
        AS trinity_sessions,
      (SELECT MAX(created_at) FROM trinity_conversation_turns
         WHERE workspace_id = w.id) AS last_trinity_chat
    FROM workspaces w
    WHERE w.name ILIKE '%statewide%' OR w.name ILIKE '%protective%' OR w.status = 'active'
    ORDER BY w.created_at;
  `);

  // ---------- write reports ----------
  const finishedAt = new Date().toISOString();
  const outDir = 'audit_reports';
  mkdirSync(outDir, { recursive: true });
  const stamp = finishedAt.replace(/[:.]/g, '-');
  const jsonPath = join(outDir, `railway-audit-${stamp}.json`);
  const txtPath  = join(outDir, `railway-audit-${stamp}.txt`);

  writeFileSync(jsonPath, JSON.stringify({ startedAt, finishedAt, results, errors }, null, 2));

  // human summary
  const lines = [];
  const h = (s) => lines.push(`\n=== ${s} ===`);
  lines.push(`CoAIleague Railway DB audit`);
  lines.push(`started:  ${startedAt}`);
  lines.push(`finished: ${finishedAt}`);
  lines.push(`errors:   ${errors.length}`);

  h('SECTION 1 — missing tables');
  const mt = results['1::missing_tables'];
  if (Array.isArray(mt)) {
    if (mt.length === 0) lines.push('OK: every expected table exists.');
    else mt.forEach(r => lines.push(`  MISSING: ${r.table_name}`));
  }
  const totalTables = results['1::total_tables_in_db'];
  if (Array.isArray(totalTables)) lines.push(`total tables in DB: ${totalTables[0]?.total}`);

  h('SECTION 2 — critical row counts');
  for (const { table, count } of results['2::row_counts']) {
    lines.push(`  ${table.padEnd(30)} ${count ?? '-'}`);
  }

  h('SECTION 3A — brain tables');
  for (const { table } of brainChecks) {
    const r = results[`3A::brain_${table}`];
    if (Array.isArray(r) && r[0]) {
      lines.push(`  ${table.padEnd(32)} total=${r[0].total}  24h=${r[0].last_24h}  7d=${r[0].last_7d}`);
    } else {
      lines.push(`  ${table.padEnd(32)} ERROR`);
    }
  }

  h('SECTION 3C — dream cycle last runs');
  for (const k of ['memory_consolidation','social_graph','temporal_arcs','narrative_update','incubation']) {
    const r = results[`3C::${k}`];
    if (Array.isArray(r)) lines.push(`  ${k.padEnd(22)} ${r[0]?.last_ran ?? '-'}`);
  }

  h('SECTION 4 — mock/seed data');
  for (const [label, key] of [
    ['seed workspaces',      '4A::seed_workspaces'],
    ['seed users',           '4B::seed_users'],
    ['placeholder phones',   '4C::seed_phones'],
    ['null-island GPS',      '4D::null_island_gps'],
    ['suspicious invoices',  '4E::suspicious_round_invoices'],
  ]) {
    const r = results[key];
    if (Array.isArray(r)) lines.push(`  ${label.padEnd(24)} ${r.length} rows`);
    else lines.push(`  ${label.padEnd(24)} ERROR`);
  }

  h('SECTION 5 — missing columns');
  if (missingColumns.length === 0) lines.push('OK: all expected columns present.');
  else missingColumns.forEach(c => lines.push(`  MISSING: ${c.table}.${c.column}`));

  h('SECTION 6 — tenant isolation');
  const iso = [
    ['cross-tenant employees', '6A::cross_tenant_employees', 'rows'],
    ['shifts without workspace_id', '6B::shifts_missing_workspace', 'count'],
    ['invoices without workspace_id','6C::invoices_missing_workspace','count'],
    ['deliveries without workspace_id','6D::deliveries_missing_workspace','count'],
  ];
  for (const [label, key, kind] of iso) {
    const r = results[key];
    if (!Array.isArray(r)) { lines.push(`  ${label.padEnd(34)} ERROR`); continue; }
    const v = kind === 'rows' ? r.length : (r[0]?.n ?? '-');
    lines.push(`  ${label.padEnd(34)} ${v}`);
  }

  h('SECTION 7 — feature wiring (preview)');
  for (const key of [
    '7A::inbound_email_pipeline','7B::calloff_coverage','7C::nds_health',
    '7D::thought_signatures_7d','7E::stuck_payroll_locks','7F::proof_photo_gps','7G::dar_pdfs',
  ]) {
    const r = results[key];
    if (Array.isArray(r)) lines.push(`  ${key.padEnd(32)} ${r.length} rows`);
    else lines.push(`  ${key.padEnd(32)} ERROR (${results[key]?.error ?? 'unknown'})`);
  }

  h('SECTION 8 — operational snapshot');
  for (const { metric, value } of results['8::ops_snapshot']) {
    lines.push(`  ${metric.padEnd(28)} ${value ?? '-'}`);
  }

  h('SECTION 9 — large tables');
  const big = results['9::large_tables_stats'];
  if (Array.isArray(big)) {
    big.forEach(r => lines.push(`  ${String(r.tablename).padEnd(36)} rows=${r.row_count} dead=${r.dead_rows}`));
  }
  h('SECTION 9 — workspace_id index gaps');
  const gaps = results['9::workspace_id_index_gaps'];
  if (Array.isArray(gaps)) {
    if (gaps.length === 0) lines.push('  OK: every ws-scoped table with >100 rows has an index mentioning workspace_id.');
    else gaps.forEach(r => lines.push(`  GAP: ${r.table_name} (rows=${r.row_count})`));
  }

  h('SECTION 10 — Statewide tenant');
  const sw = results['10::statewide_tenant'];
  if (Array.isArray(sw) && sw.length > 0) {
    for (const r of sw) {
      lines.push(
        `  ${r.name} (${r.workspace_id}) status=${r.status} plaid=${r.plaid_connected} ` +
        `employees=${r.active_employees} sites=${r.site_count} shifts7d=${r.shifts_this_week} ` +
        `last_chat=${r.last_trinity_chat ?? '-'}`
      );
    }
  } else {
    lines.push('  No active/Statewide workspace found.');
  }

  if (errors.length) {
    h('ERRORS');
    errors.forEach(e => lines.push(`  [${e.section}] ${e.label}: ${e.error}`));
  }

  writeFileSync(txtPath, lines.join('\n') + '\n');

  console.log(`\nWrote:\n  ${jsonPath}\n  ${txtPath}`);
  await pool.end();
}

main().catch(e => {
  console.error('Fatal:', e);
  pool.end().catch(() => {});
  process.exit(1);
});
