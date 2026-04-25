# Jack/GPT Handoff — Scheduling scheduleosRoutes Audit

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack scheduleosRoutes audit`

## Context

Claude's latest commit:

`203d7cfb014a714b763585feeb1b36037130dd47` — `refactor: shiftRoutes.ts -1,383 lines — 21 dead routes deleted`

Claude completed the first scheduling cleanup pass:

- `shiftRoutes.ts`: `3,623 -> 2,240` lines
- 21 dead routes deleted
- 17 active handlers preserved
- build clean

Claude assigned Jack the next scheduling target:

- Option A: `scheduleosRoutes.ts` at ~1,325 lines, mount `/api/scheduleos`
- Option B: `schedulerRoutes.ts` at ~886 lines, mount `/api/scheduler`
- Option C: overlap audit across schedule-related route files

Jack chose **Option A: `scheduleosRoutes.ts`** because it is larger and the index specifically flags it as overlapping with `schedulerRoutes.ts`.

## Files Read

- `CODEBASE_INDEX.md` scheduling section
- `server/routes/domains/scheduling.ts`
- `server/routes/scheduleosRoutes.ts` connector-visible portion

Confirmed mount:

```ts
app.use("/api/scheduleos", requireAuth, ensureWorkspaceAccess, scheduleosRouter);
```

## Important Limitation

`scheduleosRoutes.ts` is too large for safe direct rewriting through the GitHub connector. Fetch output truncates before the full handler inventory and `update_file` requires replacing the entire file.

Jack did **not** patch this file directly because a partial overwrite could erase unseen handlers.

Claude should use local `rg`, patch locally, build, and update `AGENT_HANDOFF.md`.

## Visible Route Inventory

Visible routes from the fetched portion:

- `POST /api/scheduleos/ai/toggle`
- `POST /api/scheduleos/ai/trigger-session`
- `GET /api/scheduleos/ai/status`
- `POST /api/scheduleos/smart-generate`
- `GET /api/scheduleos/proposals`
- `GET /api/scheduleos/proposals/:id`
- `PATCH /api/scheduleos/proposals/:id/approve`
- `PATCH /api/scheduleos/proposals/:id/reject`
- `POST /api/scheduleos/migrate-schedule`
- `POST /api/scheduleos/import-migrated-shifts`
- `POST /api/scheduleos/request-service`

There are more routes after truncation. Claude must inventory full file locally.

## Caller Audit Results

### Keep / likely active

#### `POST /api/scheduleos/ai/toggle`

Search found active/frontend references:

- `client/src/pages/universal-schedule.tsx`
- `all_frontend_calls.txt`
- old reports/docs

Keep unless frontend is migrated.

#### Schedule proposals routes

Search for `/api/scheduleos/proposals` found active references:

- `client/src/components/schedule-proposal-drawer.tsx`
- `client/src/pages/approvals-hub.tsx`
- `client/src/hooks/useWorkflowProposals.ts`
- `server/architecture/canonicalSources.ts`

Keep proposal list/detail/approve/reject routes unless replaced by a canonical proposal workflow.

### No active caller found through connector search

These showed no obvious active frontend caller from connector search:

#### `POST /api/scheduleos/ai/trigger-session`

Search:

```text
"/api/scheduleos/ai/trigger-session" OR "scheduleos/ai/trigger-session"
```

Result: none.

This appears to overlap with newer Trinity scheduling orchestration routes/actions. It likely belongs in `trinitySchedulingRoutes.ts` or the now-canonical scheduling orchestrator path, not in ScheduleOS route surface.

#### `POST /api/scheduleos/smart-generate`

Search:

```text
"/api/scheduleos/smart-generate" OR "scheduleos/smart-generate"
```

Result: only `server/architecture/canonicalSources.ts`.

No frontend caller found. It also overlaps with Trinity scheduling orchestration and schedule proposal flow.

#### `POST /api/scheduleos/migrate-schedule`

Search:

```text
"/api/scheduleos/migrate-schedule" OR "scheduleos/migrate-schedule"
```

Result: `SCHEDULE_MIGRATION_UPGRADES.md` only.

No active frontend caller found.

#### `POST /api/scheduleos/import-migrated-shifts`

Search:

```text
"/api/scheduleos/import-migrated-shifts" OR "scheduleos/import-migrated-shifts"
```

Result: none.

No active frontend caller found.

#### `POST /api/scheduleos/request-service`

Search:

```text
"/api/scheduleos/request-service" OR "scheduleos/request-service"
```

Result: none.

No active frontend caller found. It also appears to create service coverage requests, call AI scheduling, log AI usage, and likely generate invoices/Stripe charges later in the unseen portion. This may be a stale monolithic service request path.

### `GET /api/scheduleos/ai/status`

Search found only old docs/audit references, not an obvious active frontend caller. However, because `POST /ai/toggle` is live and UI often pairs toggle + status reads, Claude should verify locally before deleting.

## Strong Deletion Candidates After Local Verification

If local `rg` confirms no callers, delete these first:

1. `POST /ai/trigger-session`
2. `POST /smart-generate`
3. `POST /migrate-schedule`
4. `POST /import-migrated-shifts`
5. `POST /request-service`

Possible additional candidate:

6. `GET /ai/status` — only if `universal-schedule.tsx` or other UI no longer reads it.

Do **not** delete:

- `/ai/toggle`
- `/proposals`
- `/proposals/:id`
- `/proposals/:id/approve`
- `/proposals/:id/reject`

unless active caller migration happens first.

## Local Commands For Claude

### 1. Full route inventory

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/scheduleosRoutes.ts
```

### 2. Exact caller audit

```bash
rg "/api/scheduleos/ai/toggle|scheduleos/ai/toggle" client server shared
rg "/api/scheduleos/ai/status|scheduleos/ai/status" client server shared
rg "/api/scheduleos/ai/trigger-session|scheduleos/ai/trigger-session" client server shared
rg "/api/scheduleos/smart-generate|scheduleos/smart-generate" client server shared
rg "/api/scheduleos/proposals|scheduleos/proposals" client server shared
rg "/api/scheduleos/migrate-schedule|scheduleos/migrate-schedule" client server shared
rg "/api/scheduleos/import-migrated-shifts|scheduleos/import-migrated-shifts" client server shared
rg "/api/scheduleos/request-service|scheduleos/request-service" client server shared
```

### 3. Overlap audit with canonical scheduling services/routes

```bash
rg "startSchedulingSession|trinitySchedulingOrchestrator|scheduleSmartAI|scheduleProposals|extractScheduleFromFile|serviceCoverageRequests" \
  server/routes/scheduleosRoutes.ts \
  server/routes/trinitySchedulingRoutes.ts \
  server/routes/orchestratedScheduleRoutes.ts \
  server/routes/advancedSchedulingRoutes.ts \
  server/routes/schedulerRoutes.ts \
  server/services
```

### 4. Import cleanup after deletion

Likely imports that may become unused if the candidate routes are deleted:

- `requireStarter`
- `requireProfessional` if only used by deleted/paid paths
- `calculateInvoiceLineItem`
- `calculateInvoiceTotal`
- `applyTax`
- `addFinancialValues`
- `divideFinancialValues`
- `toFinancialString`
- `crypto`
- `tokenManager`
- `stripe`
- `isStripeConfigured`
- `notificationHelpers`
- schema imports such as `smartScheduleUsage`, `stagedShifts`, `users`, `platformRoles`
- drizzle imports such as `or`, `isNotNull`, `gte`, `lte` depending on unseen handlers

Do not remove blindly. Let `tsc` decide.

## Recommended Claude Runtime Commit

If local verification matches Jack's connector audit:

```text
refactor: delete dead scheduleos legacy routes
```

Commit body should include:

- route inventory count before/after
- exact dead routes deleted
- exact active routes preserved
- `scheduleosRoutes.ts` line count before/after
- build result

Required checks:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Why This Cut Matters

`scheduleosRoutes.ts` appears to contain old SmartSchedule AI and migration paths that overlap with:

- `trinitySchedulingOrchestrator`
- `trinitySchedulingRoutes.ts`
- `orchestratedScheduleRoutes.ts`
- current proposal drawer/approval workflow
- billing/token usage systems

Deleting dead ScheduleOS routes will reduce confusion and prevent old AI scheduling paths from competing with the canonical Trinity scheduling spine.

## Next Suggested Target After Claude Cleans This

After `scheduleosRoutes.ts` cleanup:

1. `schedulerRoutes.ts` — caller audit and overlap check with remaining ScheduleOS routes.
2. `schedulesRoutes.ts` — smaller, likely weekly schedule/publish/stats routes.
3. `advancedSchedulingRoutes.ts` — audit boundary vs autonomous scheduling and Trinity scheduling.

Stay in Scheduling until these files have one clear route ownership map.

## AGENT_HANDOFF.md Sync Note

Jack did not update `AGENT_HANDOFF.md` directly because the file is large/truncated in the connector. Claude should update the top sync block locally after build-verifying the runtime cleanup.

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Run local inventory + caller audit above.
3. Delete confirmed dead ScheduleOS routes.
4. Clean imports.
5. Build-check.
6. Update `AGENT_HANDOFF.md` sync block.
7. Push.
