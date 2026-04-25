# Jack/GPT Handoff — Scheduling shiftRoutes Audit

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack scheduling shiftRoutes audit`

## Context

Claude's latest sync block gave Jack two choices:

- Option A: wire more billing enforcement middleware
- Option B: move to Scheduling, starting with `server/routes/shiftRoutes.ts`

Jack chose **Option B — Scheduling** because the current project rule is route simplification and line reduction, and `shiftRoutes.ts` is the largest untouched core operations file.

## Files Read

- `CODEBASE_INDEX.md` — Scheduling domain section
- `server/routes/shiftRoutes.ts` — connector-visible portion
- `all_registered_routes.txt` — route registry evidence
- `all_frontend_calls.txt` — frontend call inventory, but output is too large/truncated

## Important Limitation

`shiftRoutes.ts` is too large for safe direct patching through the GitHub connector.

The connector can fetch the beginning of the file, but output truncates before the full handler inventory. `update_file` requires replacing the entire file. Jack did **not** rewrite it from partial content because that could corrupt the route file or erase unseen handlers.

This needs Claude/Codex local editing with:

```bash
rg
grep
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Visible Route Section Audited

The visible portion of `shiftRoutes.ts` includes:

- `GET /api/shifts`
- `GET /api/shifts/today`
- `GET /api/shifts/upcoming`
- `GET /api/shifts/pending`
- `GET /api/shifts/stats`
- `GET /api/shifts/:id`
- `POST /api/shifts`

The visible file also includes helper/state code:

- `haversineMeters()`
- `bulkShiftLocks`
- `BULK_SHIFT_LOCK_TTL_MS`
- `acquireBulkShiftLock()`
- `releaseBulkShiftLock()`
- `validateShiftAccess()`

## Caller Audit Results

### Live callers found

`/api/shifts/today`

Search found:

- `client/src/pages/worker-dashboard.tsx`

Keep.

`/api/shifts/upcoming`

Search found:

- `client/src/pages/worker-dashboard.tsx`
- `client/public/sw.js`

Keep.

Broad `/api/shifts` search found active scheduling UI and components including:

- `client/src/pages/schedule-mobile-first.tsx`
- `client/src/pages/universal-schedule.tsx`
- `client/src/pages/employee-portal.tsx`
- `client/src/pages/worker-dashboard.tsx`
- `client/src/components/mobile/schedule/ApprovalsDrawer.tsx`
- `client/src/components/shift-approval-dialog.tsx`
- `client/src/components/pending-approvals-banner.tsx`
- `client/src/components/ShiftOfferSheet.tsx`

This means root/list/detail/mutation routes are likely live and should not be removed without exact local caller mapping.

### No exact caller found via connector search

`/api/shifts/pending`

Searches:

```text
"/api/shifts/pending" OR "shifts/pending"
```

No exact caller found.

`/api/shifts/stats`

Searches:

```text
"/api/shifts/stats" OR "shifts/stats"
```

No exact caller found.

Important: broad `/api/shifts` search found approval-related UI, so Claude should local-rg before deleting these two. They may be generated or called through a helper not visible in connector search.

## Helper Audit Results

Connector search for helper names:

- `haversineMeters`
- `validateShiftAccess`

only surfaced `server/routes/shiftRoutes.ts` and/or old report references.

This suggests they may be unused internal helpers, but Jack cannot prove no internal call later in the truncated part of the same file. Claude should verify locally.

## Recommended Claude Local Commands

### 1. Full route inventory

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/shiftRoutes.ts
```

### 2. Exact caller audit for visible suspected dead routes

```bash
rg "/api/shifts/pending|shifts/pending|['\"]\/pending['\"]" client server shared
rg "/api/shifts/stats|shifts/stats|['\"]\/stats['\"]" client server shared
```

### 3. Helper usage audit

```bash
rg "haversineMeters\(" server/routes/shiftRoutes.ts
rg "validateShiftAccess\(" server/routes/shiftRoutes.ts
rg "acquireBulkShiftLock\(|releaseBulkShiftLock\(|bulkShiftLocks|BULK_SHIFT_LOCK_TTL_MS" server/routes/shiftRoutes.ts
```

### 4. Broad scheduling overlap audit

```bash
rg "/api/shifts" client server shared
rg "shiftRoutes|scheduleosRoutes|schedulerRoutes|schedulesRoutes|advancedSchedulingRoutes|autonomousSchedulingRoutes" server/routes/domains server/routes.ts server/routes
```

## Recommended Runtime Cleanup If Local Verification Confirms

If local `rg` confirms no callers:

1. Delete `GET /api/shifts/pending`
2. Delete `GET /api/shifts/stats`
3. Remove now-unused imports from `shiftApprovalService`:
   - `getPendingShifts`
   - `getApprovalStats`
4. If helper audit confirms no usage in the full file:
   - delete `haversineMeters()`
   - delete `validateShiftAccess()`
   - delete bulk shift lock helper/state only if `acquireBulkShiftLock`/`releaseBulkShiftLock` have no usages
5. Run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Suggested Commit Message For Claude If Verified

```text
refactor: delete dead shift approval routes and unused helpers
```

Commit body should include:

- `shiftRoutes.ts` line count before/after
- caller audit results
- build result
- next target

## Next Scheduling Targets After This First Cut

After dead routes/helpers are removed, next best target is **not** full rewrite yet.

Recommended sequence:

1. Extract or verify canonical shift mutation path for `POST /api/shifts`.
   - This route is huge and mixes validation, contract gate, compliance, rest-period checks, overtime warnings, notifications, events, chatroom creation, post orders, and DB write.
   - It should eventually become one domain service, but only after local inventory.
2. Audit overlap between:
   - `shiftRoutes.ts`
   - `scheduleosRoutes.ts`
   - `schedulerRoutes.ts`
   - `schedulesRoutes.ts`
   - `advancedSchedulingRoutes.ts`
   - `autonomousSchedulingRoutes.ts`
3. Do not create new services if existing services already own the behavior.
4. Delete dead paths first.

## Why Jack Did Not Add Runtime Code

Current rule says every runtime commit should reduce line count. Jack could not safely reduce `shiftRoutes.ts` through the connector because the file is too large/truncated.

A bad whole-file replacement would be worse than no runtime change.

This handoff gives Claude the exact local deletion candidates and verification commands.

## AGENT_HANDOFF.md Sync Note

Jack did not update `AGENT_HANDOFF.md` directly because the file is very large and connector output is truncated. Claude should update the top sync block locally after build-verifying the next runtime change.

## Recommended Next Owner

Claude should go next.

Claude action:

1. Pull latest development.
2. Run the local commands above.
3. Delete confirmed dead routes/helpers.
4. Build-check.
5. Update `AGENT_HANDOFF.md` sync block.
6. Push.

## Notes

Stay in Scheduling. Do not jump to Time/HR until `shiftRoutes.ts` has at least its first dead-route/helper cleanup pass.
