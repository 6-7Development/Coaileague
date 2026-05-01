# Schedule Interface — Round 2 Polish Pass

Picks up from `SCHEDULE_INTEGRATION_VERIFICATION.md`. Re-ran the full crawl
with a wider lens: TypeScript on the entire codebase, every endpoint the UI
references, and every guard that wraps a schedule route. Found and fixed
seven additional issues — five real bugs, two TS gaps that would surprise a
future contributor.

## Verifier: 27/27 PASS

`sim_output/verifier-final.log` — every endpoint `universal-schedule.tsx`,
`schedule-mobile-first.tsx`, and the swap/duplicate/publish pipelines invoke
returned a real, deterministic response against seeded data.

New tests added in this round:
* `POST /api/schedules/unpublish` (proves the workspaceId crash is gone).
* `POST /api/shifts/:id/send-reminder` duplicate-call (proves the misleading
  404 is gone).

## Bugs Found and Fixed (this round)

### 1. `POST /api/schedules/publish` — `ReferenceError: workspaceId is not defined`

`server/routes/schedulesRoutes.ts:101` and `:301` referenced a free
`workspaceId` symbol that was never declared. The handler crashed at
`storage.getWorkspace(workspaceId)` before any logic ran.

The verifier reproduced it pre-fix:
```
HTTP 500 {"message":"workspaceId is not defined"}
```

Fix: bind `const workspaceId = req.workspaceId!` from the
`ensureWorkspaceAccess` middleware that already runs in front of this
router. Same fix on `/unpublish`. Verifier post-fix:
```
HTTP 200 {"success":true,"message":"26 shifts unpublished and reverted to draft."}
```

### 2. `POST /api/shifts/:id/send-reminder` — duplicate call returns 404 "Shift not found"

`shiftRemindersService.sendShiftReminder()` returned `null` for two
different cases: (a) the shift doesn't exist, (b) the idempotency key
already fired. The route mapped both to `404 Shift not found`. Hitting the
button twice in a row produced a misleading "shift not found" toast even
when the shift was right there.

Fix: extended `ReminderResult.status` with a `'duplicate'` discriminator,
return that instead of `null` when the dedupe gate fires, and have the
route map duplicate → `200 { success: true, alreadySent: true }`. Verifier
proves both pre- and post-fix behavior.

### 3. `gamificationService.resetWeeklyPoints` / `resetMonthlyPoints` — methods didn't exist

`autonomousScheduler.ts:4746,4750` called these from the weekly/monthly
cron, but the service exposed only `resetPeriodPoints(workspaceId, period)`
which requires a workspaceId. The cron is global. Result: the cron threw
silently every Sunday and on the 1st of each month.

Fix: added global `resetWeeklyPoints()` and `resetMonthlyPoints()` to the
service, which run a single global UPDATE. Also added the missing import
in `autonomousScheduler.ts`.

### 4. `actionRegistry.ts` optimistic-concurrency check broken

The shift-update action attempted optimistic locking against
`current.updatedAt`, but the `db.select({status, startTime, endTime})`
literally didn't fetch `updatedAt`. Result: `current.updatedAt` was always
undefined → `actualMs = 0` → `Math.abs(0 - expectedMs) > 1000` for any
non-trivial `expectedUpdatedAt` → every concurrent edit wrongly threw
`CONCURRENT_MODIFICATION`, blocking legitimate writes.

Fix: added `updatedAt: shifts.updatedAt` to the select, and corrected the
`as string` cast that no longer matches the now-correctly-typed Date.

### 5. `trinitySchedulingRoutes.ts` — fragile defensive imports

Three handlers used `await import(...).catch(() => ({...prop: null}))` to
defend against missing schema entries. TypeScript narrowed the resulting
union into a discriminated type and refused to access the property
afterwards (errors at lines 368, 393, 415). Functionality was correct;
the type was unsound.

Fix: switched to `const schemaModule: any = await import(...)` and a single
`?? null` fallback, which gives the same runtime behavior with a sound
type.

## TypeScript Errors Cleared on the Schedule Surface

Round 1 closed the silent runtime bugs; round 2 closed the static-typing
gaps that protect future contributors.

| Before round 2 | After round 2 |
|----------------|---------------|
| 21 schedule-scope errors | 2 schedule-scope errors (both pre-existing, unrelated to this audit) |
| Files I touched: 0 errors | Files I touched: 0 errors |

Specific fixes (each one keeps a real component compiling):
* `IsolatedScheduleToolbar.tsx` — added missing `Zap` import from
  `lucide-react`.
* `ScheduleGrid.tsx` — `SHIFT_COLORS` was missing 8 of 14 statuses in
  `Record<ShiftStatus, …>`. Filled in `open/assigned/confirmed/approved/
  in_progress/cancelled/calloff/no_show`.
* `CalendarSyncDialog.tsx` — `uploadedFile` narrow in JSX.
* `schedule-mobile-first.tsx` — added missing `React` import (page used
  `React.useState` without importing the namespace) and threaded the
  `defaultViewMode` prop through the wrapper so universal-schedule's
  fallback render compiles.
* `universal-schedule.tsx` — `shift.status === 'denied'` is now
  `shift.deniedAt` (the `denied` enum value was removed; the column
  still holds the timestamp).
* `shiftRoutes.ts` — removed two `@ts-expect-error` directives whose
  underlying types are now correct.

## What I Verified Did NOT Regress

* Vite production build: succeeds, all schedule lazy chunks emitted
  (universal-schedule, schedule-mobile-first, team-schedule, shift-*).
* Email pipeline: `scripts/fire-proof-email.mjs` reports
  `email.sent=true` and the server log shows the same end-to-end trace
  (route → service → emailCore → CAN-SPAM template → notification fan-out).
* Original 25 verifier endpoints still pass; the two new ones pass too.

## Files Touched This Round

* `server/routes/schedulesRoutes.ts` — workspaceId binding on publish/unpublish.
* `server/routes/shiftRoutes.ts` — duplicate-reminder mapping + 2 dead `@ts-expect-error`.
* `server/routes/trinitySchedulingRoutes.ts` — userId guard + defensive-import retype.
* `server/services/shiftRemindersService.ts` — duplicate result discriminator.
* `server/services/ai-brain/actionRegistry.ts` — load `updatedAt` for optimistic locking.
* `server/services/autonomousScheduler.ts` — import gamificationService.
* `server/services/gamification/gamificationService.ts` — global weekly/monthly reset methods.
* `client/src/pages/universal-schedule.tsx` — `denied` → `deniedAt`.
* `client/src/pages/schedule-mobile-first.tsx` — React import + default-export prop pass-through.
* `client/src/components/schedule/IsolatedScheduleToolbar.tsx` — `Zap` import.
* `client/src/components/schedule/ScheduleGrid.tsx` — full `ShiftStatus` color map.
* `client/src/components/schedule/CalendarSyncDialog.tsx` — narrow `uploadedFile`.
* `scripts/verify-schedule-integration.mjs` — +2 tests (publish+duplicate-reminder).

## Reproduction (unchanged from round 1)

```bash
pg_ctlcluster 16 main start
node scripts/verify-schedule-integration.mjs   # 27/27 PASS
node scripts/fire-proof-email.mjs              # email pipeline trace
```
