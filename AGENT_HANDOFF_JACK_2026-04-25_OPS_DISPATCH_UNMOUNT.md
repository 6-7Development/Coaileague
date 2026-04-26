# Jack/GPT Handoff — OPS Dispatch Unmount

Branch: `development`
Date: 2026-04-25

## Sync Check

Jack checked `development` and saw latest tip:

```text
055b9586452f4627f344345c8433bbfed213149f
```

No newer Claude commit was visible yet after Jack's post-orders/CAD handoff.

## Runtime Commit

```text
07f803588049b2f2bfa99df397b134cba55aa4da — refactor: unmount dead dispatch router
```

## File Changed

```text
server/routes/domains/ops.ts
```

## What Changed

Removed the dead `/api/dispatch` mount:

```ts
app.use("/api/dispatch", requireAuth, ensureWorkspaceAccess, dispatchRouter);
```

Removed stale import:

```ts
import dispatchRouter from "../dispatch";
```

Removed `/api/dispatch` from the canonical-prefix comment.

## Why This Was Safe

Jack read `server/routes/dispatch.ts`, which contains 8 handlers:

```text
POST  /gps
GET   /units
GET   /units/:employeeId/trail
GET   /units/on-shift
POST  /units/status
POST  /incidents
GET   /incidents
PATCH /incidents/:id/status
POST  /assignments
POST  /assignments/respond
```

Caller searches for these route families found no active callers outside `server/routes/dispatch.ts` itself and an old progress doc:

```text
/api/dispatch/gps
/api/dispatch/units
/api/dispatch/incidents
/api/dispatch/assignments
```

Search for router references showed only:

```text
server/routes/domains/ops.ts
```

Therefore `/api/dispatch` was an orphaned route surface. The active CAD/field ops flows are using `/api/cad/*`, not `/api/dispatch/*`.

## Follow-Up Candidate For Claude

If local build passes and `rg` confirms no imports remain, delete:

```text
server/routes/dispatch.ts
```

Expected removal: about 330 lines.

Local verification:

```bash
rg "dispatchRouter|../dispatch|/api/dispatch" client server shared scripts tests
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Existing Runtime Commit Still Needs Claude Verification

Jack's previous runtime commit also needs build verification:

```text
c6b339029a318836e7b87c9d973d0c2747092c88 — refactor: delete dead post order routes
```

Deleted from `server/routes/postOrderRoutes.ts`:

```text
GET  /api/post-orders
POST /api/post-orders/assign-to-shift
GET  /api/post-orders/shift/:shiftId
```

Preserved active post-order routes used by `client/src/pages/post-orders.tsx`.

## CAD Status Still Pending Claude Local Audit

`server/routes/cadRoutes.ts` is long/truncated in Jack's connector view.

Active caller evidence exists for:

```text
/api/cad/calls
/api/cad/units
/api/cad/geofence-departures
```

No caller evidence found for:

```text
/api/cad/manual-override
/api/cad/officer-check
```

Claude local audit:

```bash
grep -n "cadRouter\.\(get\|post\|put\|patch\|delete\)" server/routes/cadRoutes.ts
rg "/api/cad/manual-override|cad/manual-override" client server shared
rg "/api/cad/officer-check|cad/officer-check" client server shared
```

If clean, delete those CAD dead handlers.

## Next OPS Targets

After Claude verifies/deletes dispatch and CAD dead handlers:

1. `guardTourRoutes.ts`
2. `vehicleRoutes.ts`
3. `equipmentRoutes.ts`
4. `incidentPatternRoutes.ts`
5. `situationRoutes.ts`
6. `safetyRoutes.ts`
7. `rmsRoutes.ts`

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Confirm tip includes `07f8035` and this handoff.
3. Build/type-check post-order cleanup + dispatch unmount.
4. Delete `server/routes/dispatch.ts` if local references are clean.
5. Audit/delete CAD dead handlers if confirmed.
6. Update `AGENT_HANDOFF.md` and `DEEP_ROUTE_INDEX.md`.
7. Push verified remote tip.
