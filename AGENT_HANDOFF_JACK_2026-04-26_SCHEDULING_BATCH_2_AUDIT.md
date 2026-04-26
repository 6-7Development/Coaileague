# Jack/GPT Handoff — Scheduling Batch 2 Audit

Branch: `refactor/route-cleanup`
Date: 2026-04-26

## Current Refactor Tip Verified By Jack

```text
9ee567730a63e050fc9d8b32c65d817fd8fb0316
```

Claude's latest execution of Jack's prior 3-file batch:

```text
refactor: -4,408L — shift/misc/dev routes cleaned
```

Claude reported:

- `shiftRoutes.ts`: 3,623 -> 1,642L, -1,981L
- `miscRoutes.ts`: 2,777 -> 2,004L, -773L
- `devRoutes.ts`: 2,459 -> 149L, -2,310L
- broken prefix scan: 0
- build: clean
- refactor branch total: about 17,655L removed

## Batch Audited This Turn

Jack audited the next scheduling group together:

```text
server/routes/timeOffRoutes.ts
server/routes/scheduleosRoutes.ts
server/routes/schedulesRoutes.ts
server/routes/advancedSchedulingRoutes.ts
client/src/components/schedule/ScheduleToolbar.tsx
client/src/components/schedule-proposal-drawer.tsx
```

## 1. timeOffRoutes.ts

Status: **skip / keep**.

The file is fully visible through connector and contains active time-off/PTO/timesheet approval surfaces:

```text
/api/pto
/api/pto/:id/approve
/api/pto/:id/deny
/api/time-off-requests/my
/api/time-off/pending-count
/api/timesheets/pending-count
/api/time-off-requests/pending
/api/time-off-requests
/api/time-off-requests/:id/status
/api/shift-actions/pending
/api/shift-actions/:id/approve
/api/timesheet-edit-requests
/api/timesheet-edit-requests/pending
/api/timesheet-edit-requests/:id/review
```

Recommendation: do not file-delete. Quick local verify and skip unless Claude finds individual zero-caller handlers.

## 2. schedulesRoutes.ts

Mount:

```text
/api/schedules
```

Status: **active file, trim inside only**.

### Live caller evidence found

`client/src/components/schedule/ScheduleToolbar.tsx` actively uses:

```text
POST /api/schedules/publish
POST /api/schedules/unpublish
GET  /api/schedules/week/stats
```

`client/src/components/schedule/TrinityInsightsPanel.tsx` actively uses:

```text
GET  /api/schedules/ai-insights
POST /api/schedules/apply-insight
```

### Strong delete/fix candidate

No caller evidence found for:

```text
GET /api/schedules/export/csv
```

Visible bug in that handler:

```text
format(new Date(...), ...)
```

but `schedulesRoutes.ts` does not visibly import `format`. If route is dead, delete the handler. If route must stay, add the proper import and wire the frontend export menu to it.

Jack recommendation: delete `/export/csv` if local `rg` confirms no callers.

Claude local commands:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/schedulesRoutes.ts
rg "/api/schedules/export/csv|schedules/export/csv" client server shared scripts tests
rg "format\(" server/routes/schedulesRoutes.ts
```

Expected likely action:

```text
DELETE GET /api/schedules/export/csv
```

Keep:

```text
GET  /week/stats
POST /publish
POST /unpublish
POST /apply-insight
GET  /ai-insights
```

## 3. scheduleosRoutes.ts

Mount:

```text
/api/scheduleos
```

Status: **active but mixed; local inventory required**.

Broad caller search found active scheduling/proposal UI and workflow files related to `/api/scheduleos`:

```text
client/src/components/schedule-proposal-drawer.tsx
client/src/pages/universal-schedule.tsx
client/src/hooks/useWorkflowProposals.ts
client/src/pages/approvals-hub.tsx
```

Reading `client/src/components/schedule-proposal-drawer.tsx` confirmed live use of:

```text
GET   /api/scheduleos/proposals/:id
PATCH /api/scheduleos/proposals/:id/approve
PATCH /api/scheduleos/proposals/:id/reject
```

Visible `scheduleosRoutes.ts` also has many AI/migration/service request handlers, but connector view is truncated.

### No exact caller evidence found in connector search for visible cluster

```text
/api/scheduleos/ai/status
/api/scheduleos/ai/toggle
/api/scheduleos/ai/trigger-session
/api/scheduleos/migrate-schedule
/api/scheduleos/import-migrated-shifts
```

But broad `/api/scheduleos` is active, so do not unmount or file-delete.

Claude local commands:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/scheduleosRoutes.ts
rg "/api/scheduleos" client server shared scripts tests
rg "/api/scheduleos/ai/status|/api/scheduleos/ai/toggle|/api/scheduleos/ai/trigger-session" client server shared scripts tests
rg "/api/scheduleos/migrate-schedule|/api/scheduleos/import-migrated-shifts" client server shared scripts tests
rg "/api/scheduleos/request-service|/api/scheduleos/proposals" client server shared scripts tests
```

Recommendation:

- keep proposal routes confirmed by drawer
- trim exact zero-caller AI/migration/request-service handlers only after local proof

## 4. advancedSchedulingRoutes.ts

Mount:

```text
/api/scheduling
```

Status: **active but mixed; local inventory required**.

Broad `/api/scheduling` search found active callers:

```text
client/src/components/schedule/ShiftSwapDrawer.tsx
client/src/pages/universal-schedule.tsx
client/src/pages/shift-marketplace.tsx
server/routes/schedulingInlineRoutes.ts
```

Visible route groups in `advancedSchedulingRoutes.ts`:

```text
/recurring
/recurring/:patternId
/recurring/:patternId/generate
/recurring/:patternId/conflicts
/recurring/generate       legacy
/shifts/:shiftId/swap-request
/swap-requests
/swap-requests/:swapId
/swap-requests/:swapId/approve
/swap-requests/:swapId/reject
/swap-requests/:swapId/cancel
/shifts/:shiftId/available-employees
/shifts/:shiftId/ai-suggestions
/swap/request             legacy
/swap/:swapId/respond     legacy
/swap/requests            legacy
/swap/:swapId/cancel      legacy
```

Connector exact search for `/api/scheduling/recurring`, `/api/scheduling/swap`, `/api/scheduling/shifts` returned no exact caller results, but broad `/api/scheduling` is active and specific UI files likely use the swap endpoints dynamically. Needs local exact mapping.

Claude local commands:

```bash
grep -n "advancedSchedulingRouter\.\(get\|post\|put\|patch\|delete\)" server/routes/advancedSchedulingRoutes.ts
rg "/api/scheduling" client server shared scripts tests
rg "/api/scheduling/recurring|scheduling/recurring" client server shared scripts tests
rg "/api/scheduling/swap-requests|scheduling/swap-requests|/api/scheduling/swap/|scheduling/swap/" client server shared scripts tests
rg "/api/scheduling/shifts/.*/swap-request|/api/scheduling/shifts/.*/available-employees|/api/scheduling/shifts/.*/ai-suggestions" client server shared scripts tests
```

Recommendation:

- keep any endpoint used by `ShiftSwapDrawer.tsx` and `shift-marketplace.tsx`
- delete legacy aliases only if no local callers:
  - `POST /swap/request`
  - `POST /swap/:swapId/respond`
  - `GET /swap/requests`
  - `POST /swap/:swapId/cancel`
  - `POST /recurring/generate`

## Why Jack Did Not Runtime-Patch

This batch includes two large/truncated files (`scheduleosRoutes.ts`, `advancedSchedulingRoutes.ts`). Rewriting them through connector is risky and caused previous broken-prefix issues.

Jack only fully trusts direct runtime edits when the full file is visible and small. `schedulesRoutes.ts` is fully visible, but the safest next step is for Claude to locally delete/fix `/export/csv` while also handling the larger scheduling files in one build pass.

## Claude Execution Pass

Claude should now do one local scheduling batch pass:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
rg "\b(adRouter|dRouter|uter|outer|ter|er)\." server/routes
```

Then:

1. Skip/keep `timeOffRoutes.ts` unless local exact callers prove dead handlers.
2. Delete or fix `GET /api/schedules/export/csv`.
3. Locally inventory and trim `scheduleosRoutes.ts` exact zero-caller handlers.
4. Locally inventory and trim `advancedSchedulingRoutes.ts` legacy aliases if zero-caller.
5. Build/type-check/startup test.
6. Update `AGENT_HANDOFF.md`.

## Recommended Next Owner

Claude goes next for local execution/build pass.
