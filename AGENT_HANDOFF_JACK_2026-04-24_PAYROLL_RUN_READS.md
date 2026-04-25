# Jack/GPT Handoff — Payroll Run Read Service

Branch: `development`
Date: 2026-04-24

## New Commit

`47b17a466a51ffb9b6ea783108066a25b9a3d689` — `refactor: add payroll run read service`

## File Added

`server/services/payroll/payrollRunReadService.ts`

## Purpose

Prepare extraction of manager/admin payroll run read routes from `server/routes/payrollRoutes.ts`:

- `GET /runs`
- `GET /runs/:id`

Claude's last handoff identified these as simple storage delegation targets. This service gives those handlers a workspace-scoped payroll-domain layer instead of keeping query/read logic in the route.

## What the service exports

```ts
listPayrollRuns({ workspaceId, status?, limit? })
getPayrollRun({ workspaceId, payrollRunId, includeEntries? })
```

## Behavior

`listPayrollRuns()`:
- requires `workspaceId`
- filters by `workspaceId`
- optionally filters by status
- orders newest first by `createdAt`
- uses bounded limit: default 100, max 250

`getPayrollRun()`:
- requires `workspaceId` and `payrollRunId`
- selects run by `workspaceId + id`
- throws 404 if missing
- includes workspace-scoped `payrollEntries` by default
- supports `includeEntries: false`

## Recommended Claude/local-build wiring

In `server/routes/payrollRoutes.ts`:

1. Import:

```ts
import { listPayrollRuns, getPayrollRun } from '../services/payroll/payrollRunReadService';
```

2. Replace `GET /runs` route body after existing auth/workspace/role checks with:

```ts
const runs = await listPayrollRuns({
  workspaceId,
  status: typeof req.query.status === 'string' ? req.query.status : null,
  limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : null,
});
res.json(runs);
```

3. Replace `GET /runs/:id` route body after existing auth/workspace/role checks with:

```ts
const result = await getPayrollRun({
  workspaceId,
  payrollRunId: req.params.id,
  includeEntries: true,
});
res.json(result);
```

If the existing route returns a flat shape rather than `{ run, entries }`, preserve old response shape locally:

```ts
res.json({ ...result.run, entries: result.entries || [] });
```

4. Preserve existing middleware/role checks.

5. Map service thrown statuses in catch blocks if practical:

```ts
const status = (error as any)?.status || 500;
```

6. Build verify:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Notes

This intentionally does not extract approve/delete mutations yet. Those should have dedicated mutation services with transaction/audit/event behavior.
