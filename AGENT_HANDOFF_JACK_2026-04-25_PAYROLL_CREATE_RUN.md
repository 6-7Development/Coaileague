# Jack/GPT Handoff — Payroll Create-Run Service

Branch: `development`
Date: 2026-04-25

## New Commit

`176fe1c5ad02d5eb8b9251f4d4ed37097756e580` — `refactor: add payroll run creation service`

## File Added

`server/services/payroll/payrollRunCreationService.ts`

## What Changed

Added a payroll-domain service for the full `POST /create-run` workflow.

This service centralizes the existing route behavior:

- Professional+ tier gate
- suspended/cancelled subscription gate
- DB-backed payroll run lock
- request period parsing
- auto period detection
- payroll period validation
- overlap check
- workspace-wide compliance warning scan
- zero-approved-hours hard gate
- duplicate-period transaction guard
- canonical `createAutomatedPayrollRun()` call
- SOC2 audit log
- payroll run created notification
- workspace websocket broadcast
- platform event
- billing audit log
- guaranteed lock release in `finally`

## Why Jack/GPT Did Not Edit `payrollRoutes.ts` Directly

This time Jack could see the `POST /create-run` handler body. However, it is still a large compliance-heavy route with many imports and side effects. Replacing it through the GitHub connector would risk breaking local import cleanup without compiler feedback.

Safe action taken:

1. Extracted the route logic into a service file.
2. Preserved behavior as closely as possible.
3. Left exact local wiring instructions for Claude.

Claude should wire the route locally and run build/type-check.

## Service Export

```ts
createPayrollRunForPeriod(params): Promise<CreatePayrollRunResult>
```

## Params

```ts
{
  workspaceId: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  payPeriodStart?: string | null;
  payPeriodEnd?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
```

## Result Shape

```ts
{
  payrollRun: any,
  complianceWarnings: Array<{
    employeeId: string;
    name: string;
    issue: string;
  }>,
}
```

## Important Behavior Preserved

The service preserves the old response data by returning `payrollRun` and `complianceWarnings`. The route should continue to respond with:

```ts
res.json({ ...result.payrollRun, complianceWarnings: result.complianceWarnings });
```

## Recommended Claude Wiring

In `server/routes/payrollRoutes.ts`:

### 1. Import

```ts
import { createPayrollRunForPeriod } from '../services/payroll/payrollRunCreationService';
```

### 2. Replace `POST /create-run` body after existing middleware declaration

Keep route signature:

```ts
router.post('/create-run', mutationLimiter, idempotencyMiddleware, async (req: AuthenticatedRequest, res) => {
```

Then the handler body can become:

```ts
try {
  const roleCheck = checkManagerRole(req);
  if (!roleCheck.allowed) return res.status(roleCheck.status || 403).json({ message: roleCheck.error });

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const workspaceId = req.workspaceId!;

  const schema = z.object({
    payPeriodStart: z.string().optional(),
    payPeriodEnd: z.string().optional(),
  });

  const validationResult = schema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(422).json({
      message: 'Invalid request',
      errors: validationResult.error.errors,
    });
  }

  const result = await createPayrollRunForPeriod({
    workspaceId,
    userId,
    userEmail: req.user?.email || 'unknown',
    userRole: req.user?.role || 'user',
    payPeriodStart: validationResult.data.payPeriodStart || null,
    payPeriodEnd: validationResult.data.payPeriodEnd || null,
    ipAddress: req.ip || null,
    userAgent: req.get('user-agent') || null,
  });

  res.json({ ...result.payrollRun, complianceWarnings: result.complianceWarnings });
} catch (error: unknown) {
  const status = (error as any)?.status || (error as any)?.statusCode || 500;
  const extra = (error as any)?.extra || {};

  if ((error as any)?.code === 'DUPLICATE_PAYROLL_RUN') {
    return res.status(409).json({
      message: error instanceof Error ? sanitizeError(error) : 'Duplicate payroll run',
      code: (error as any).code,
      existingRunId: (error as any).existingRunId,
      existingRunStatus: (error as any).existingRunStatus,
    });
  }

  log.error('Error creating payroll run:', error);
  res.status(status).json({
    message: error instanceof Error ? sanitizeError(error) : 'Failed to create payroll run',
    ...extra,
  });
}
```

### 3. Remove Route-Local Lock Helpers If Unused

After wiring, Claude can likely remove from `payrollRoutes.ts` if compiler confirms unused:

- `PAYROLL_RUN_LOCK_TTL_MS`
- `acquirePayrollRunLock()`
- `releasePayrollRunLock()`
- `payrollRunLocks` import

Do not remove blindly. Let `tsc` confirm.

### 4. Remove Other Imports Only If Unused

Potential imports that may become unused after extraction:

- `validatePayrollPeriod`
- `businessRuleResponse`
- `getWorkspaceTier`
- `hasTierAccess`
- `detectPayPeriod`
- `createAutomatedPayrollRun`
- `notificationHelpers`
- `billingAuditLog`
- `count`
- `gte`
- `lte`
- `sql`
- `timeEntries`
- `employees`

Some may still be used by other handlers. Do not remove blindly.

## Build Verification Required

Please run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Specific Verification Notes

Please verify these compile:

- `payrollRunLocks` imported from `@shared/schema`
- `detectPayPeriod(workspaceId)` returns `{ periodStart, periodEnd }`
- `createAutomatedPayrollRun({ workspaceId, periodStart, periodEnd, createdBy })`
- `employees.compliancePayType`
- `employees.guardCardExpiryDate`
- `employees.guardCardNumber`
- `employees.onboardingStatus`
- `billingAuditLog.newState`
- websocket dynamic import path `await import('../websocket')`

## Behavior Boundary

This service intentionally still calls the existing canonical `createAutomatedPayrollRun()` function. It does not create a second payroll calculation engine.

## Why This Slice Is Useful

`POST /create-run` was one of the biggest remaining route handlers. Moving it into a domain service makes the route a thin wrapper and keeps compliance, lock, and audit behavior together.

## Next Suggested Payroll Targets

After this route is wired:

1. Bank account/Plaid handlers — sensitive; review carefully.
2. Process-provider orchestration extraction — separate sprint only.
3. Import cleanup in `payrollRoutes.ts` after all extractions are complete.

## Notes

This is payroll-domain cleanup only. It does not touch billing, RFP pricing, email, security, or UI.
