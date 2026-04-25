# Jack/GPT Handoff — billing-api.ts Caller Audit

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack billing-api caller audit`

## Context

Claude's latest commit:

`98063bf6bd117142f5ea5781b0bc8b9e7d59d531` — `refactor: billing domain dead route cleanup + ai-usage migration`

Claude made `server/routes/domains/billing.ts` a pure mount file and moved active `/api/billing/ai-usage` into `billing-api.ts`.

Next assigned task: audit `server/routes/billing-api.ts` callers.

## Jack/GPT Limitation On This Pass

Jack could fetch `billing-api.ts`, but the GitHub connector truncates long file output and does not provide a range-based editor. Jack did **not** directly edit `billing-api.ts` because deleting route blocks through a partial view would risk corrupting the file.

Safe work done:

1. Read `CODEBASE_INDEX.md` billing section first.
2. Read the visible part of `billing-api.ts`.
3. Ran caller searches for visible billing routes.
4. Documented likely keep/delete candidates for Claude local verification.

Claude has local full-file/build access and should do the runtime deletion if local `rg` confirms these findings.

## Visible billing-api.ts Route Set Audited

Routes visible in connector fetch:

- `GET /api/billing/tiers`
- `GET /api/billing/subscription`
- `GET /api/billing/current-charges`
- `GET /api/billing/reconcile`
- `GET /api/billing/pricing`
- `GET /api/billing/platform-invoices`
- `POST /api/billing/usage`
- `GET /api/billing/usage/summary`
- `GET /api/billing/usage/metrics`
- `POST /api/billing/usage/estimate`
- `GET /api/billing/credits`
- `GET /api/billing/credits/balance`
- `GET /api/billing/transactions`
- `POST /api/billing/credits/purchase`
- `GET /api/billing/credits/auto-recharge`
- `POST /api/billing/credits/auto-recharge`
- `GET /api/billing/invoices`
- `GET /api/billing/invoices/:id`
- `GET /api/billing/features/:featureKey`
- `GET /api/billing/features`
- `POST /api/billing/features/:addonId/toggle`
- `GET /api/billing/addons/available`
- `GET /api/billing/addons`
- `POST /api/billing/addons/:addonId/purchase`
- `POST /api/billing/addons/:addonId/cancel`
- `GET /api/billing/account/status`

There are likely additional routes after the connector truncation point. Claude should inventory the full file locally.

## Caller Searches Run

```text
"/api/billing/tiers" OR "billing/tiers" OR "apiRequest(\"GET\", \"/api/billing/tiers"
"/api/billing/pricing" OR "billing/pricing"
"/api/billing/subscription" OR "billing/subscription" OR "current-charges" OR "platform-invoices"
"/api/billing/usage/summary" OR "billing/usage/summary" OR "usage/metrics" OR "usage/estimate"
"/api/billing/credits" OR "billing/credits" OR "credits/balance" OR "credits/auto-recharge"
"/api/billing/features" OR "billing/features" OR "addons/available" OR "billing/addons"
"/api/billing/invoices" OR "billing/invoices" OR "account/status" OR "billing/account/status"
```

## Caller Findings

### Active / likely keep

#### `GET /api/billing/pricing`

Caller found:

- `client/src/pages/billing.tsx`

Keep unless frontend migrates to another canonical pricing endpoint.

#### `GET /api/billing/account/status` or related account/subscription view

Caller search found:

- `client/src/pages/subscription-dashboard.tsx`

Keep account/subscription dashboard paths until local `rg` maps exact calls.

#### `GET /api/billing/invoices` / invoice reads

Caller search matched subscription dashboard context. Treat invoice read endpoints as keep unless local `rg` confirms no direct calls.

### No obvious callers through connector search

These had no obvious frontend/client callers in GitHub connector search:

- `GET /api/billing/tiers`
- `GET /api/billing/current-charges`
- `GET /api/billing/platform-invoices`
- `POST /api/billing/usage`
- `GET /api/billing/usage/summary`
- `GET /api/billing/usage/metrics`
- `POST /api/billing/usage/estimate`
- `GET /api/billing/credits`
- `GET /api/billing/credits/balance`
- `GET /api/billing/transactions`
- `POST /api/billing/credits/purchase`
- `GET /api/billing/credits/auto-recharge`
- `POST /api/billing/credits/auto-recharge`
- `GET /api/billing/features/:featureKey`
- `GET /api/billing/features`
- `POST /api/billing/features/:addonId/toggle`
- `GET /api/billing/addons/available`
- `GET /api/billing/addons`
- `POST /api/billing/addons/:addonId/purchase`
- `POST /api/billing/addons/:addonId/cancel`

One broad add-on/features search returned only:

- `server/tests/crossPlatformSyncStressTest.ts`

That suggests the add-on feature routes may be test-only or stale, but Claude should verify locally.

## High-Confidence Delete Candidates After Local Verification

These are the safest likely deletions because the business model moved away from credit packs/auto-recharge:

### 1. `POST /api/billing/credits/purchase`

Already returns 410 Gone. No callers found.

Recommendation: delete the route entirely unless external clients depend on the 410 response.

### 2. `GET /api/billing/credits/auto-recharge`

No callers found. Auto-recharge belongs to retired credit-pack model.

Recommendation: delete if local `rg` confirms no callers and `tokenManager.getAutoRechargeConfig()` is otherwise unused.

### 3. `POST /api/billing/credits/auto-recharge`

No callers found. Same retired model.

Recommendation: delete if local `rg` confirms no callers and `tokenManager.configureAutoRecharge()` is otherwise unused.

### 4. `POST /api/billing/usage/estimate`

No callers found. Estimation could be useful, but if unused, it is another exposed billing surface.

Recommendation: delete unless frontend/admin uses it.

## Medium-Confidence Consolidation Candidates

Do not delete blindly; verify callers and intended canonical route first.

### Credit/token routes

Visible credit routes:

- `/credits`
- `/credits/balance`
- `/transactions`

Potential canonical replacement may be `/api/usage/*` via `usageRouter`, which is mounted separately.

Recommendation:

- If no callers, delete or move to `/api/usage` only.
- If callers exist, migrate frontend to `/api/usage/*` and leave short deprecation window.

### Feature/add-on routes

Visible add-on routes likely overlap with `billingTiersRegistry` and `featureGateService`.

Recommendation:

- Keep only if frontend actually manages add-ons today.
- If not used, delete purchase/cancel/toggle endpoints until billing add-on flow is fully productized.
- Do not leave exposed purchase/cancel routes that are not wired to Stripe/subscription truth.

### `/tiers` vs `/pricing`

Both return tier/pricing style data from `subscriptionTiers`.

Caller found for `/pricing`; none for `/tiers`.

Recommendation:

- Keep `/pricing` for frontend compatibility.
- Delete `/tiers` only if local `rg` confirms no callers and no external API docs depend on it.
- Longer term, route both through `billingTiersRegistry` so pricing has one formatter.

## Local Verification Commands For Claude

Please run:

```bash
rg "/api/billing/tiers|billing/tiers" client server shared
rg "/api/billing/pricing|billing/pricing" client server shared
rg "/api/billing/current-charges|current-charges|platform-invoices" client server shared
rg "/api/billing/usage|billing/usage|usage/summary|usage/metrics|usage/estimate" client server shared
rg "/api/billing/credits|billing/credits|credits/balance|credits/auto-recharge|credits/purchase" client server shared
rg "/api/billing/features|billing/features|addons/available|billing/addons" client server shared
rg "/api/billing/invoices|billing/invoices|account/status|billing/account/status" client server shared
```

Then inspect full handler inventory:

```bash
grep -n "billingRouter\.\(get\|post\|put\|patch\|delete\)" server/routes/billing-api.ts
```

## Recommended Claude Runtime Commit

If local verification matches Jack's connector audit:

1. Delete retired credit purchase route.
2. Delete auto-recharge GET/POST routes.
3. Delete unused usage estimate route.
4. Remove now-unused imports from `billing-api.ts`.
5. Run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

6. Commit with line count before/after.

## Important Preservation Notes

Keep for now:

- `/api/billing/pricing` because frontend caller found.
- subscription/account/invoice dashboard routes until exact local calls are mapped.
- Stripe routes untouched.
- `domains/billing.ts` untouched unless Claude wants to remove leftover blank comments from previous cleanup.

## No Runtime Code Added In This Commit

This is intentionally a caller-audit handoff because Jack cannot safely perform partial deletion in the long `billing-api.ts` file through the connector.

## Next After Claude Cleanup

Once dead credit/usage routes are removed, next Jack target should be:

- `billingSettingsRoutes.ts` caller/overlap audit against billing-api and stripe routes, or
- `invoiceRoutes.ts` route inventory, because the index flags it as the biggest billing file with inline DB.
