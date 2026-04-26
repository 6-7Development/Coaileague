# Jack/GPT Handoff — Payroll + Billing Batch Audit

Branch: `refactor/route-cleanup`
Date: 2026-04-26

## Current Refactor Tip Verified By Jack

```text
44d1318f4b96f7d160a102bb2dd1b4769aa5bfab
```

Claude's latest Trinity tooling batch:

```text
refactor: Trinity tooling batch — -418L + 2 files deleted
```

Claude reported:

- `workflowRoutes.ts`: deleted, -69L
- `workflowConfigRoutes.ts`: deleted, -103L
- `automationInlineRoutes.ts`: 142 -> 42L, -100L
- `controlTowerRoutes.ts`: 219 -> 208L, -11L
- `quickFixRoutes.ts`: 513 -> 378L, -135L
- broken prefix scan: 0
- build: clean
- refactor branch total: about 21,112L removed

## Batch Audited This Turn

Jack audited the next payroll/billing group:

```text
server/routes/payrollRoutes.ts
server/routes/billing-api.ts
server/routes/invoiceRoutes.ts
server/routes/timeOffRoutes.ts  # quick verify target from older handoff
```

All three financial route files are large/truncated in connector view and clearly active. Do not file-delete these.

## 1. payrollRoutes.ts

Mount:

```text
/api/payroll
```

Status: **active, high-risk financial surface. Trim only exact zero-caller handlers.**

Broad caller search for `/api/payroll` found active frontend callers and tests, including:

```text
client/src/pages/payroll-dashboard.tsx
client/src/pages/my-paychecks.tsx
client/src/pages/payroll-deductions.tsx
client/src/pages/payroll-garnishments.tsx
client/src/pages/tax-center.tsx
tests/api/payroll-run.test.ts
```

Visible route clusters in `payrollRoutes.ts` include:

```text
GET   /api/payroll/export/csv
GET   /api/payroll/proposals
PATCH /api/payroll/proposals/:id/approve
PATCH /api/payroll/proposals/:id/reject
POST  /api/payroll/create-run
```

The broad caller result also shows payroll deduction/garnishment/check/paycheck/tax pages, so many hidden/truncated payroll routes are likely live.

### Candidate for local verification only

`GET /api/payroll/export/csv` is visible and sensitive. No direct caller evidence was surfaced by connector, but export endpoints may be used by buttons not obvious in search. Do not delete without local exact UI verification.

Claude local commands:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/payrollRoutes.ts
rg "/api/payroll" client server shared scripts tests
rg "/api/payroll/export/csv|payroll/export/csv" client server shared scripts tests
rg "/api/payroll/proposals|payroll/proposals" client server shared scripts tests
rg "/api/payroll/create-run|payroll/create-run" client server shared scripts tests
rg "/api/payroll/deductions|/api/payroll/garnishments|/api/payroll/paystubs|/api/payroll/tax" client server shared scripts tests
```

Recommendation:

- keep file and active core routes
- trim only exact no-caller handler(s)
- use extra caution: payroll route errors have legal/financial impact

## 2. billing-api.ts

Mount:

```text
/api/billing
```

Status: **active, high-risk billing/Stripe/token surface. Trim only exact zero-caller handlers.**

Broad caller search found active frontend and system callers, including:

```text
client/src/pages/billing.tsx
client/src/pages/subscription-dashboard.tsx
client/src/components/billing/AiUsageDashboard.tsx
client/src/components/billing/InvoicePreviewWidget.tsx
client/src/components/trinity-credits.tsx
client/src/lib/stripeCheckout.ts
client/src/hooks/use-token-monitor.ts
server/routes/billing-api.ts
server/routes/domains/billing.ts
server/routes/stripeInlineRoutes.ts
```

Visible active route clusters in `billing-api.ts` include:

```text
GET  /api/billing/tiers
GET  /api/billing/subscription
GET  /api/billing/current-charges
GET  /api/billing/reconcile
GET  /api/billing/pricing
GET  /api/billing/platform-invoices
POST /api/billing/usage
GET  /api/billing/usage/summary
GET  /api/billing/usage/metrics
POST /api/billing/usage/estimate
GET  /api/billing/credits
GET  /api/billing/credits/balance
GET  /api/billing/transactions
POST /api/billing/credits/purchase  # 410 Gone legacy endpoint
GET  /api/billing/credits/auto-recharge
POST /api/billing/credits/auto-recharge
GET  /api/billing/invoices
GET  /api/billing/invoices/:id
GET  /api/billing/features/:featureKey
GET  /api/billing/features
POST /api/billing/features/:addonId/toggle
GET  /api/billing/addons/available
GET  /api/billing/addons
```

### Strong cleanup candidates for local verification

Potential legacy or low-value handlers:

```text
POST /api/billing/credits/purchase  # retired 410 endpoint
GET  /api/billing/credits/balance   # legacy alias if `/credits` is the canonical caller
POST /api/billing/usage/estimate    # likely service/internal only; verify
GET  /api/billing/reconcile         # admin/internal; verify caller and role
```

Do not remove pricing/subscription/credits/invoices routes without direct proof.

Claude local commands:

```bash
grep -n "billingRouter\.\(get\|post\|put\|patch\|delete\)" server/routes/billing-api.ts
rg "/api/billing" client server shared scripts tests
rg "/api/billing/credits/purchase|billing/credits/purchase" client server shared scripts tests
rg "/api/billing/credits/balance|billing/credits/balance" client server shared scripts tests
rg "/api/billing/usage/estimate|billing/usage/estimate" client server shared scripts tests
rg "/api/billing/reconcile|billing/reconcile" client server shared scripts tests
```

Recommendation:

- keep active billing core
- delete retired/legacy aliases only after local proof
- preserve any route used by Stripe checkout, subscription dashboard, token monitor, or billing page

## 3. invoiceRoutes.ts

Mount:

```text
/api/invoices
```

Status: **active, high-risk invoicing/payment surface. Trim only exact zero-caller handlers.**

Broad caller search found active frontend callers, including:

```text
client/src/pages/invoices.tsx
client/src/pages/invoice-aging.tsx
client/src/pages/pay-invoice.tsx
client/src/pages/cash-flow-dashboard.tsx
client/src/pages/client-portal.tsx
client/src/components/billing/InvoicePreviewWidget.tsx
client/src/pages/dashboards/OrgOwnerDashboard.tsx
tests/api/invoice-payment.test.ts
```

Visible route clusters in `invoiceRoutes.ts` include:

```text
GET   /api/invoices/:id/pdf
GET   /api/invoices/proposals
PATCH /api/invoices/proposals/:id/approve
PATCH /api/invoices/proposals/:id/reject
POST  /api/invoices/auto-generate
```

The file is large/truncated, and broad callers prove it is core. Do not file-delete.

### Candidate for local verification only

`POST /api/invoices/auto-generate` may be active through automation/billing flows or may be legacy now that `/api/automation/invoice/anchor-close` exists. Need local exact caller proof before trimming.

Claude local commands:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/invoiceRoutes.ts
rg "/api/invoices" client server shared scripts tests
rg "/api/invoices/auto-generate|invoices/auto-generate" client server shared scripts tests
rg "/api/invoices/proposals|invoices/proposals" client server shared scripts tests
rg "/api/invoices/.*/pdf|invoices/.*/pdf|/api/invoices/:id/pdf" client server shared scripts tests
rg "/api/invoices/.*/pay|pay-invoice|invoice-payment" client server shared scripts tests
```

Recommendation:

- keep active invoice list/detail/payment/PDF routes
- trim proposal/auto-generate only if local `rg` proves no active UI/system/test caller
- preserve portal/public payment routes even if not visible in client search

## 4. timeOffRoutes.ts Quick Verify

Earlier Jack read this file and found active surfaces. Recommendation remains **skip/keep** unless local exact caller inventory finds dead handlers.

Visible active route groups included:

```text
/api/pto
/api/time-off-requests
/api/time-off-requests/my
/api/time-off/pending-count
/api/timesheets/pending-count
/api/shift-actions/pending
/api/timesheet-edit-requests
```

Claude local quick check:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/timeOffRoutes.ts
rg "/api/pto|/api/time-off|/api/time-off-requests|/api/timesheets/pending-count|/api/shift-actions|/api/timesheet-edit-requests" client server shared scripts tests
```

## Recommended Claude Execution Pass

Run one financial-domain local pass:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
rg "\b(adRouter|dRouter|uter|outer|ter|er)\." server/routes
```

Then:

1. Keep payroll, billing, and invoice files mounted.
2. Trim only exact zero-caller routes, with extra caution for exports, PDFs, public payment, Stripe, payroll, tax, deductions, garnishments, and paystubs.
3. Consider deleting legacy billing aliases only if local proof is strong:
   - `POST /api/billing/credits/purchase`
   - `GET /api/billing/credits/balance`
   - `POST /api/billing/usage/estimate`
   - `GET /api/billing/reconcile`
4. Consider trimming invoice/payroll proposal/auto-generation routes only after local exact caller proof.
5. Quick-verify and likely skip `timeOffRoutes.ts`.
6. Build/type-check/startup test.
7. Update `AGENT_HANDOFF.md` with current total.

## Why Jack Did Not Runtime-Patch

These are money/payroll/payment routes and the files are large/truncated. Direct connector rewrite is not appropriate. This batch is an execution map for Claude's full local repo, `rg`, build, and startup checks.
