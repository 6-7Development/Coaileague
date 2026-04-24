# CoAIleague Shared Agent Handoff

Branch: `development`
Repo: `Coaileague/Coaileague`
Current known tip when created: `d64f5ab41669a1f00ab977fde4a80cbbbd2e9587`
Created by: Jack / GPT
Date: 2026-04-24

## Purpose

This file is the shared coordination log between Jack/GPT and Claude during the CoAIleague production-readiness refactor.

Use this file so Bryan does not have to manually copy/paste agent notes back and forth.

Both agents should read this file before starting new work and update it after meaningful commits, especially when work affects scheduling, invoicing, payroll, Trinity actions, automation, mutations, support traceability, or canonical source-of-truth enforcement.

## Operating Rules

1. Work only on `development`. Never push directly to `main`.
2. Refactor with intent: condense, unify, remove duplicate paths, remove dead code, and reduce scattered logic.
3. Prefer one canonical path per business intent:
   - UI entry
   - API route
   - service/orchestrator
   - DB mutation
   - event/audit/support trace
4. Do not delete API routes until frontend route usage is known.
5. All workspace-scoped queries and writes must include `workspaceId` / `workspace_id`.
6. All financial writes must be inside `db.transaction()`.
7. Financial math should route through `financialCalculator` / Decimal helpers, not scattered native float math.
8. Tax logic should use canonical internal tax rules/services, not embedded hardcoded route/service tables.
9. If a file is too large or risky to patch through a connector, leave a precise note here for the local build agent.
10. Claude/local build agent should verify with at least:
    - `node build.mjs`
    - `npx tsc -p tsconfig.json --noEmit` when practical

## Current Production-Readiness State

### Action and automation cleanup

- `7de1fcdc7` — Jack/GPT centralized legacy Trinity action shims into a data-driven registry.
- `c3998e11e` — Jack/GPT retired unused billing/notify action shims.
- `3a657afb6` — Jack/GPT disabled the legacy action redirect layer entirely. Canonical action IDs only.
- `691749374` — Jack/GPT clarified `scheduleLiveNotifierActions.ts` as a no-op and pointed scheduling notifications to canonical event subscribers.
- `b86c04f2b` — Jack/GPT hardened `automation.ts` anchor-close route and extracted side-effect/notification/broadcast helpers.
- `7399b136a` — Jack/GPT made anchor-close finance batches deterministic through deterministic invoice/payroll decisions and audit events.

### Seed / development workload cleanup

- `337db796e` through `7ab0ef858` — Jack/GPT seed commits fixed future shift overlap constraints and simplified future shifts into 100% open/published workload so Trinity has real scheduling work to fill.

### Canonical feature spine

- `e1fa0bec1` — Jack/GPT added `CanonicalFeatureSpine` to `sourceOfTruthRegistry.ts` for Scheduling, Time Tracking, Payroll, and Billing.
  - Captures UI entry, route, service, mutation owner, persistence tables, event types, and support trace fields.
  - Startup registry output marks `[SPINE]` domains.

### Scheduling

- `05165b4c4` — Claude hardened `trinitySchedulingOrchestrator.ts` mutation apply path:
  - all verified shift mutations inside `db.transaction()`
  - workspace locked from execution record
  - update/delete scoped by `workspaceId`
  - full update payload supported
  - mutation summary persisted: inserted, updated, deleted, skipped, errors

### Billing / invoicing

- `fe5a0cdff` — Claude closed duplicate-invoice gap in `timesheetInvoiceService.ts`:
  - atomically claims source `timeEntries` with `billedAt`
  - aborts if any entry is already billed/unavailable
  - back-links `invoiceId` to claimed entries
  - `getUninvoicedTimeEntries()` now uses `billedAt IS NULL` + `invoiceId IS NULL`
  - build verified clean by Claude

### Payroll / tax / ledger

- `f3e982b34` — Jack/GPT routed `payrollTaxService.ts` money rounding through `financialCalculator` helpers. Public API unchanged.
- `8c087c795` — Claude removed unused 310-line `STATE_TAX_CONFIG` dead code from `payrollAutomation.ts`. Build verified clean by Claude.
- `d64f5ab4` — Jack/GPT centralized payroll ledger terminal/draft status semantics in `server/services/payroll/payrollLedger.ts`.

### Legacy infrastructure containment

- `a2f9deea` — Jack/GPT made `legacyBootstrapRegistry.ts` duplicate-safe and traceable via `getLegacyBootstrapRegistryStatus()`.

## Current Known Tip

`development` current known tip after Jack/GPT update:

`d64f5ab41669a1f00ab977fde4a80cbbbd2e9587`

Commit message: `refactor: centralize payroll ledger status semantics`

Claude should pull this tip before continuing.

## Current Next Targets

### 1. Payroll finalization spine

Goal: one canonical payroll finalization path.

Check:
- `server/services/payrollAutomation.ts`
- `server/routes/payrollRoutes.ts`
- `server/services/ai-brain/subagents/payrollSubagent.ts`
- `server/services/payroll/payrollLedger.ts`
- `server/services/automation/payrollHoursAggregator.ts`

Look for:
- duplicate run creation paths
- time entries not claimed/linked to payroll run
- partial writes outside transaction
- scattered `parseFloat(toFixed())` and raw multiplications
- tax/rate constants that belong in canonical registry/services
- route-level business logic that should move to service/domain layer

### 2. Route/domain consolidation

`payrollRoutes.ts` is still very large and mixes:
- DB bootstrap registration
- Plaid transfer table bootstrap
- lock management
- exports
- PDF generation
- proposal approval/rejection
- payroll run creation
- notifications/events
- tax imports

Do not split blindly. Recommended sequence:
1. Extract small pure helpers/services.
2. Preserve route behavior.
3. Build after each extraction.
4. Only retire route code after frontend route audit confirms usage.

### 3. Legacy bootstrap retirement

`legacyBootstrapRegistry.ts` is safer now, but still transitional.

Long-term fix:
- move route-level `CREATE TABLE IF NOT EXISTS` bootstraps into schema/domain/parity layer
- delete route-level bootstrap registrations one by one after build and data safety checks

### 4. Support / agent traceability

Next after financial spines:
- expose canonical traces for scheduling/invoice/payroll operations
- make support/HelpAI/Trinity able to answer:
  - who triggered it
  - workspace/client/employee affected
  - route/service used
  - DB IDs changed
  - audit/event emitted
  - failure/remediation steps

## Notes For Claude

Jack/GPT cannot run local build from current environment. Connector patches are reason-checked only unless otherwise stated.

Claude should:
1. Pull latest `development`.
2. Build/type-check Jack commits.
3. Append results under `Claude Notes` below.
4. If Claude changes a file Jack mentioned, update current tip and next target here.

## Notes For Jack/GPT

Before new work:
1. Fetch this file from `development`.
2. Fetch current `development` commit.
3. Read Claude notes below.
4. Avoid overwriting any newer Claude changes.
5. Append a short note after each commit.

## Claude Notes

Claude: append notes here.

## Jack/GPT Notes

### 2026-04-24 — Jack/GPT

Created this shared handoff file so Bryan can simply say "go" and both agents can coordinate through the repo.

Latest Jack/GPT commit before this file: `d64f5ab41669a1f00ab977fde4a80cbbbd2e9587`.

Next preferred Jack/GPT target: inspect payroll finalization/claiming path and identify safe, compact commits or hand off larger service extraction to Claude.
