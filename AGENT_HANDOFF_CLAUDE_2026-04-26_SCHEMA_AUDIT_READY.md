# Claude Handoff for Jack — Schema Audit Domain
Date: 2026-04-26

## Production Status
development: e0ca20e2b — LIVE ✅
Platform total removed: ~38,140L across routes + client + services

## What Claude Just Completed
Merged refactor/service-layer → development:
  - 25 dead hooks deleted (-4,246L)
  - 4 dead pages deleted (-4,739L)  
  - 20 dead components deleted (-9,274L)
  - 2 dead service files deleted (-287L)
  - apiEndpoints.ts: 4 dead training entries removed

## Current Branch: refactor/schema-audit
Fresh from development e0ca20e2b.

---

## JACK'S DOMAIN: Database Schema

Same methodology as routes — find tables/columns with zero callers, confirm dead, delete.

### The Target
server/db.ts + shared/schema.ts are the ORM layer.
661 tables defined. After removing 800+ dead route handlers, many tables
are no longer read or written.

### Jack's Audit Commands
```bash
# List all table names defined in schema
grep -n "export const.*= pgTable\|export const.*= table" shared/schema.ts | head -50

# Check if a table is used anywhere (ORM callers)
grep -rn "tableName\|from.*tableName\|insert.*tableName\|update.*tableName" \
  server/ shared/ --include="*.ts" | grep -v "schema.ts" | wc -l

# Find table exports with zero server callers
# Pattern: export const xyzTable = pgTable(...)
# Check: grep -rn "xyzTable" server/ | grep -v schema.ts
```

### High-Value Targets for Jack to Audit
Based on deleted routes, these tables likely have no live ORM callers:
  - training_sessions, training_enrollments, training_certifications
  - compliance_audit_sessions, compliance_audit_requests, compliance_audit_findings
  - performance_notes, disciplinary_records, performance_reviews
  - offboarding_tasks, offboarding_records
  - scheduler_profiles, scheduler_events, scheduler_snapshots
  - workflow_configs, workflow_status
  - dispatch_calls, dispatch_units
  - gps_logs, gps_geofences
  - kpi_alert_triggers, benchmark_metrics
  - suggested_changes
  - migration_records

### Jack's audit pattern per table:
```bash
TABLE="training_sessions"
grep -rn "$TABLE" server/ shared/ --include="*.ts" | grep -v "schema.ts\|migration" | wc -l
# If 0: table is dead, safe to remove from schema + any seed data
```

### Process (same as routes)
1. Jack audits tables in batches — full domain per turn
2. Claude executes: removes from schema.ts, removes from any seed files, migration safe
3. Build check, push to refactor/schema-audit
4. When complete: PR to development

### Do NOT touch:
- Any table with active Drizzle ORM callers (select/insert/update/delete)
- Core auth tables (users, sessions, workspaces, workspace_members)
- Financial tables (payroll_runs, invoices, payments) — verify carefully
- Trinity tables (trinity_requests, trinity_approvals) — active

---

## After Schema: Shared Types Layer
shared/schema.ts also has Zod schemas and TypeScript types tied to deleted features.
Same scan: find exported types with zero callers.

## After That: Enhancement Phase
- payrollTaxFormService.ts (already created, needs wiring)
- Resend inbound email routing (calloffs@, incidents@, docs@, support@)
- TypeScript strict mode pass on cleaned surface

