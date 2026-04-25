# Jack/GPT Handoff — Billing Shadow Route Delete

Branch: `development`
Date: 2026-04-25

## New Runtime Commit

`9878178765e3fcdae5cf804807fd867df8e70e31` — `refactor: delete shadowed billing mount routes`

## File Changed

`server/routes/domains/billing.ts`

## What Changed

Deleted two inline routes from `domains/billing.ts`:

- `GET /api/billing/reconcile`
- `GET /api/billing/transactions`

Also removed unused `exportLimiter` import from `../../middleware/rateLimiter`.

## Why This Was Safe

`domains/billing.ts` mounts `billingRouter` first:

```ts
app.use("/api/billing", billingRouter);
```

`billingRouter` already owns these canonical paths:

- `GET /reconcile` mounted as `/api/billing/reconcile`
- `GET /transactions` mounted as `/api/billing/transactions`

The deleted inline handlers came **after** the `app.use("/api/billing", billingRouter)` mount. They were shadowed/order-dependent duplicates and created confusion because they used different service methods than `billing-api.ts`.

This removes duplicate route ownership without adding any new files or services.

## Behavior Preserved

Active behavior should remain the canonical `billing-api.ts` behavior:

- `/api/billing/reconcile` -> `billingReconciliation.reconcilePlatformInvoices(workspaceId)`
- `/api/billing/transactions` -> `tokenManager.getUsageHistory(workspaceId, limit)`

The removed shadow behavior was:

- `/api/billing/reconcile` -> `billingReconciliation.reconcileCredits(workspaceId)`
- `/api/billing/transactions` -> `billingReconciliation.getRecentTransactions(workspaceId, limit)`

If those credit/reconciliation views are still needed, they should be reintroduced later under explicit names, not duplicate paths:

- `/api/billing/reconcile/credits`
- `/api/billing/reconciliation-transactions`

Do not re-add duplicate route paths.

## Build Verification Required

Claude should run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Specific Verification Notes

Please verify:

- `billingReconciliation` import is still used by `daily-usage` and `monthly-usage`.
- `sanitizeError` import is still used by remaining inline routes.
- `financialLimiter` import remains used.
- `exportLimiter` is no longer needed.
- No frontend callers expected the shadowed credit reconciliation response shape.

## Why Jack Did Not Delete More

Other inline routes in `domains/billing.ts` may also be stale, but they are not proven duplicate path conflicts yet.

Remaining inline routes to audit next:

- `/api/billing/daily-usage`
- `/api/billing/monthly-usage`
- `/api/billing/org-summary`
- `/api/billing/usage-breakdown`
- `/api/billing/ai-usage`
- `/api/billing/trinity/today`
- `/api/billing/trinity/month/:year/:month`
- `/api/billing/trinity/unbilled`

Those should only be deleted or moved after caller audit.

## Next Suggested Target

Continue making `domains/billing.ts` a pure mount file.

Recommended next Claude/local step:

```bash
rg "daily-usage|monthly-usage|org-summary|usage-breakdown|ai-usage|billing/trinity" client server shared
```

If no frontend callers exist, delete or move these inline dashboard routes. If callers exist, migrate them to explicit canonical router paths first.

## Notes

This commit follows the new map/rules:

- no new files for runtime code
- delete > extract
- reduce line count
- remove duplicate ownership
- keep Stripe untouched
