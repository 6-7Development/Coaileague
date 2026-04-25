# Jack/GPT Handoff — Payroll Run Delete Service

Branch: `development`
Date: 2026-04-25

## New Commit

`4f716429dffb5049df585adac46eed52b6f5ebbe` — `refactor: add payroll run delete service`

## File Added

`server/services/payroll/payrollRunDeleteService.ts`

## Why Jack/GPT did not edit `payrollRoutes.ts` directly

Jack/GPT searched for `DELETE /runs/:id` and confirmed the route exists in `server/routes/payrollRoutes.ts`, but GitHub search exposed only route pointers, not a safe full handler body with enough context.

`payrollRoutes.ts` is still a very large file. Editing it through the connector would require a risky large-file rewrite without local build/type-check access. That could accidentally overwrite Claude's recent extraction work or break imports/middleware.

So Jack/GPT did the safe part directly:

1. Created the payroll-domain service.
2. Kept the mutation atomic and workspace-scoped.
3. Left exact route-wiring instructions for Claude/local build verification.

Claude should do the route replacement locally because Claude can inspect the whole file, preserve middleware, and run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## What the service does

`deletePayrollRun(params)`:

- requires `workspaceId`
- requires `payrollRunId`
- loads run by `workspaceId + id`
- blocks terminal statuses using `isTerminalPayrollStatus()`
- runs everything inside `db.transaction()`
- releases linked time entries:
  - `payrolledAt = null`
  - `payrollRunId = null`
  - `updatedAt = now`
- deletes workspace-scoped payroll entries for the run
- deletes the workspace-scoped payroll run
- emits non-blocking `payroll_run_deleted` event through `platformEventBus`
- returns:

```ts
{
  success: true,
  payrollRunId,
  deletedEntries,
  releasedTimeEntries,
  previousStatus,
}
```

## Safety rule

Terminal runs are protected:

- `approved`
- `processed`
- `paid`
- `completed`

Those must use a future void/reversal/correction workflow, not destructive delete.

## Recommended Claude/local-build wiring

In `server/routes/payrollRoutes.ts`:

1. Import:

```ts
import { deletePayrollRun } from '../services/payroll/payrollRunDeleteService';
```

2. Replace the body of `DELETE /runs/:id` after existing auth/workspace/role checks with:

```ts
const result = await deletePayrollRun({
  workspaceId,
  payrollRunId: req.params.id,
  userId: req.user?.id || null,
  reason: typeof req.body?.reason === 'string' ? req.body.reason : null,
});
res.json(result);
```

3. Preserve existing middleware and role checks exactly.

4. Map service error status in catch block:

```ts
const status = (error as any)?.status || 500;
res.status(status).json({
  message: error instanceof Error ? sanitizeError(error) : 'Failed to delete payroll run',
});
```

5. Remove old inline delete logic/imports only if compiler confirms they are unused.

6. Build/type-check:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Notes

This continues the payroll domain route extraction order and does not touch billing, email, security, or UI.
