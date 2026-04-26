# Jack/GPT Handoff — OPS Post Orders + CAD Audit

Branch: `development`
Date: 2026-04-25

## Sync Check

Jack confirmed `development` at:

```text
15ebb090bb80262b10d24b9f52606bf9d6666c9d
```

Claude's COMPLIANCE cleanup is visible and confirmed complete.

## Runtime Commit

```text
c6b339029a318836e7b87c9d973d0c2747092c88 — refactor: delete dead post order routes
```

## File Changed

```text
server/routes/postOrderRoutes.ts
```

## What Changed

Deleted 3 dead/no-caller post-order handlers:

```text
GET  /api/post-orders
POST /api/post-orders/assign-to-shift
GET  /api/post-orders/shift/:shiftId
```

Removed unused import:

```ts
count
```

## Active Post Order Routes Preserved

Preserved routes used by `client/src/pages/post-orders.tsx`:

```text
GET    /api/post-orders/templates
GET    /api/post-orders/templates/:id
POST   /api/post-orders/templates
PATCH  /api/post-orders/templates/:id
DELETE /api/post-orders/templates/:id
POST   /api/post-orders/acknowledge
GET    /api/post-orders/acknowledgments/:shiftOrderId
GET    /api/post-orders/tracking
```

## Caller Audit Evidence

### Active

Broad search for `/api/post-orders` found active callers:

```text
client/src/pages/post-orders.tsx
client/src/pages/client-portal.tsx
all_frontend_calls.txt
scripts/stress-test-v2.sh
scripts/stress-test-comprehensive.sh
server/tests/enhancementStressTest.ts
```

Direct file read of `client/src/pages/post-orders.tsx` confirmed active use of:

```text
/api/post-orders/templates
/api/post-orders/acknowledge
/api/post-orders/acknowledgments/:id
/api/post-orders/tracking
```

### Deleted

No caller evidence found for:

```text
/api/post-orders/assign-to-shift
/api/post-orders/shift/:shiftId
```

No exact caller found for root `GET /api/post-orders`; active UI uses `/templates` instead.

## Build Verification Required

Claude should run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Incident Pipeline Audit Result

File:

```text
server/routes/incidentPipelineRoutes.ts
```

Mount:

```text
/api/incident-reports
```

Audit result: **all visible handlers appear live**.

Active caller evidence from `client/src/pages/incident-pipeline.tsx` for:

```text
GET  /api/incident-reports
POST /api/incident-reports
GET  /api/incident-reports/:id
PATCH /api/incident-reports/:id/status
POST /api/incident-reports/:id/trinity-polish
POST /api/incident-reports/:id/activity
```

Recommendation: do not delete from `incidentPipelineRoutes.ts` in this pass.

## CAD Audit Result

File:

```text
server/routes/cadRoutes.ts
```

Mount:

```text
/api/cad
```

Active caller evidence from `client/src/pages/cad-console.tsx` for:

```text
/api/cad/calls
/api/cad/units
/api/cad/geofence-departures
```

No caller evidence found through connector search for:

```text
/api/cad/manual-override
/api/cad/officer-check
```

`cadRoutes.ts` is long/truncated in connector view, so Jack did not patch it directly.

## Recommended Claude CAD Local Audit

Run full route inventory:

```bash
grep -n "cadRouter\.\(get\|post\|put\|patch\|delete\)" server/routes/cadRoutes.ts
```

Then exact caller audit:

```bash
rg "/api/cad/manual-override|cad/manual-override" client server shared
rg "/api/cad/officer-check|cad/officer-check" client server shared
rg "/api/cad/geofence-departures|cad/geofence-departures" client server shared
rg "/api/cad/calls|cad/calls" client server shared
rg "/api/cad/units|cad/units" client server shared
```

If local `rg` confirms no callers, delete:

```text
POST /manual-override
any /officer-check route(s), if present
```

Do not delete calls/units/geofence-departures routes.

## Next OPS Targets After Claude Verifies

Continue OPS cleanup with:

1. `cadRoutes.ts` local deletion of dead handlers if confirmed.
2. `dispatchRoutes.ts`
3. `gpsRoutes.ts`
4. `guardTourRoutes.ts`
5. `vehicleRoutes.ts`
6. `equipmentRoutes.ts`
7. `incidentPatternRoutes.ts`

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Confirm tip includes `c6b3390` and this handoff.
3. Build/type-check.
4. Run CAD local audit and delete confirmed dead CAD handlers.
5. Update `AGENT_HANDOFF.md` and `DEEP_ROUTE_INDEX.md`.
6. Push and verify remote tip.
