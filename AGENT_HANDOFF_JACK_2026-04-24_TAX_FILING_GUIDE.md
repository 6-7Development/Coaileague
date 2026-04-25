# Jack/GPT Handoff — Payroll Tax Filing Guide Service

Branch: `development`
Date: 2026-04-24

## New Commit

`de9a1cc0b9041e4467439450868574600cfc7d23` — `refactor: add payroll tax filing guide service`

## File Added

`server/services/payroll/payrollTaxFilingGuideService.ts`

## Purpose

Claude's payrollRoutes audit identified tax filing guide routes as the lowest-risk extraction target:

- `GET /tax-filing/deadlines`
- `GET /tax-filing/guide/:formType`
- `GET /tax-filing/state-portals`
- `GET /tax-center`

Because direct route extraction from the 3,700+ line `payrollRoutes.ts` file is risky through Jack/GPT's connector, Jack/GPT added a pure read-only service first.

## What the service exports

- `getPayrollTaxFilingDeadlines()`
- `getPayrollTaxFilingGuide(formType)`
- `getPayrollStatePortals()`
- `getPayrollTaxCenter()`

## Service characteristics

- Pure data/service module
- No DB access
- No writes
- No side effects
- No external imports
- Operational guidance only, with compliance notice that final filings require employer/accountant/admin review

## Recommended Claude/local-build route extraction

In `server/routes/payrollRoutes.ts`:

1. Import service helpers:

```ts
import {
  getPayrollTaxFilingDeadlines,
  getPayrollTaxFilingGuide,
  getPayrollStatePortals,
  getPayrollTaxCenter,
} from '../services/payroll/payrollTaxFilingGuideService';
```

2. Replace inline route bodies for the four tax guide GET handlers with thin pass-throughs:

```ts
router.get('/tax-filing/deadlines', async (_req, res) => {
  res.json(getPayrollTaxFilingDeadlines());
});

router.get('/tax-filing/guide/:formType', async (req, res) => {
  const guide = getPayrollTaxFilingGuide(req.params.formType);
  if (!guide) return res.status(404).json({ error: 'Unsupported payroll tax form type' });
  res.json(guide);
});

router.get('/tax-filing/state-portals', async (_req, res) => {
  res.json(getPayrollStatePortals());
});

router.get('/tax-center', async (_req, res) => {
  res.json(getPayrollTaxCenter());
});
```

3. Preserve any existing auth/plan middleware on those routes if currently present.

4. Build verify:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Notes

This commit does not change runtime route behavior yet. It creates the extraction target so Claude can safely shrink `payrollRoutes.ts` with local full-file inspection and build verification.
