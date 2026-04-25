# Jack/GPT Handoff — Payroll Run Mark-Paid Service

Branch: `development`
Date: 2026-04-25

## New Commit

`604b1883782c91c646e0890f9d6b299ac77ae7a2` — `refactor: add payroll run mark-paid service`

## File Added

`server/services/payroll/payrollRunMarkPaidService.ts`

## What Changed

Added a payroll-domain service for marking a payroll run as paid.

This service centralizes the post-disbursement/manual-confirmation mutation instead of leaving it buried in `payrollRoutes.ts`.

## Why Jack/GPT Did Not Edit `payrollRoutes.ts` Directly

Jack attempted to locate the current `POST /runs/:id/mark-paid` handler body through the GitHub connector. Search only surfaced stale route pointers and unrelated references, not a reliable current handler body.

Because `payrollRoutes.ts` is still large and actively being cleaned by Claude, direct connector editing would risk:

- overwriting Claude's latest import cleanup
- missing route middleware/role checks
- breaking imports without local compiler feedback
- changing route behavior from an incomplete handler view

So Jack did the safe bounded part:

1. Created the domain service.
2. Kept it workspace-scoped and transactional.
3. Left exact local wiring instructions for Claude.

Claude should wire the route locally because Claude can inspect the whole file and run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## What The Service Does

`markPayrollRunPaid(params)`:

- requires `workspaceId`
- requires `payrollRunId`
- requires `userId`
- locks the payroll run row with `.for('update')`
- scopes the run by `workspaceId + payrollRunId`
- allows mark-paid only from:
  - `approved`
  - `processed`
  - `disbursing`
  - already-paid idempotent states: `paid`, `completed`
- rejects draft/pending/not-ready statuses with 409
- idempotently returns success if already paid/completed
- updates payroll run:
  - `status = paid`
  - `disbursementStatus = completed`
  - `disbursementDate`
  - `disbursedAt`
  - `processedBy` / `processedAt` if missing
  - `updatedAt`
- stamps payroll entries for the run:
  - `disbursedAt`
  - `payoutStatus = completed`
  - `payoutCompletedAt`
  - `updatedAt`
- writes SOC2-style `storage.createAuditLog()` non-blocking
- writes `billingAuditLog` non-blocking
- broadcasts `payroll_updated / paid` non-blocking
- publishes `payroll_run_paid` event non-blocking

## Result Shape

```ts
{
  success: true,
  payrollRunId: string,
  previousStatus: string | null,
  status: 'paid',
  paidAt: string,
  updatedEntries: number,
  alreadyPaid: boolean,
}
```

## Recommended Claude Local Wiring

In `server/routes/payrollRoutes.ts`:

### 1. Import

```ts
import { markPayrollRunPaid } from '../services/payroll/payrollRunMarkPaidService';
```

### 2. Replace Route Body

Replace the body of `POST /runs/:id/mark-paid` after existing auth/workspace/role checks with:

```ts
const result = await markPayrollRunPaid({
  workspaceId,
  payrollRunId: req.params.id,
  userId: req.user!.id,
  userEmail: req.user?.email || 'unknown',
  userRole: req.user?.role || 'user',
  ipAddress: req.ip || null,
  userAgent: req.get('user-agent') || null,
  reason: typeof req.body?.reason === 'string' ? req.body.reason : null,
});

res.json(result);
```

### 3. Preserve Existing Route Protection

Do not remove existing:

- auth check
- workspace context check
- manager/admin role guard
- plan/tier guard if present
- idempotency/rate-limit middleware if present

### 4. Status-Aware Error Mapping

Use:

```ts
const status = (error as any)?.status || 500;
const extra = (error as any)?.extra || {};
res.status(status).json({
  message: error instanceof Error ? sanitizeError(error) : 'Failed to mark payroll run paid',
  ...extra,
});
```

### 5. Remove Old Inline Logic Carefully

Remove old inline mark-paid logic only after confirming the route now delegates to the service.

Remove imports only if `tsc` confirms they are unused.

## Build / Type Verification Required

Please run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Specific Verification Notes For Claude

Please verify these fields exist and compile in the current schema:

- `payrollRuns.disbursedAt`
- `payrollRuns.disbursementDate`
- `payrollRuns.disbursementStatus`
- `payrollEntries.payoutCompletedAt`
- `payrollEntries.payoutStatus`
- `billingAuditLog.oldState`
- `billingAuditLog.newState`

Please also verify import path:

```ts
const { broadcastToWorkspace } = await import('../../websocket');
```

If the route cleanup now prefers the static `broadcastToWorkspace` from `../websocket`, Claude can adjust the service import path locally or leave the dynamic import if it builds.

## Behavior Decision To Confirm

Jack chose this policy:

- `mark-paid` is the confirmation step after ACH/NACHA/manual payment completion.
- It should not initiate ACH/NACHA itself.
- It should reject draft/pending runs.
- It should be idempotent for already paid/completed runs.

If existing route behavior allows marking a draft directly paid, Claude should flag it before preserving that behavior. Jack recommends the stricter policy above for production readiness.

## Next Suggested Payroll Targets

After this route is wired and build-clean, remaining complex payroll routes are:

1. `POST /runs/:id/process` — ACH/NACHA/payment initiation; high risk, transaction-heavy.
2. `POST /:runId/void` — reversal workflow; high risk, should be its own service.
3. `POST /create-run` — very large; may already rely on `createAutomatedPayrollRun()` but route still carries compliance gates.
4. Bank account/Plaid handlers — sensitive, should be reviewed carefully before extraction.

## Notes

This continues payroll-domain completion only. It does not touch billing, RFP pricing, email, security, or UI.
