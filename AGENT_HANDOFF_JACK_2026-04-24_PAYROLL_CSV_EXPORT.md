# Jack/GPT Handoff — Payroll CSV Export Service

Branch: `development`
Date: 2026-04-24

## New Commit

`b8b7c79c5f45c8f44eacd8f75722f80add990c83` — `refactor: add payroll CSV export service`

## File Added

`server/services/payroll/payrollCsvExportService.ts`

## Purpose

Prepare extraction of `GET /export/csv` from the large `server/routes/payrollRoutes.ts` file into a payroll-domain service.

The route body was visible enough through the connector to mirror its behavior safely into a standalone service, but route replacement should be done locally by Claude because `payrollRoutes.ts` is large and needs build verification.

## What the service exports

```ts
buildPayrollCsvExport(params: PayrollCsvExportParams): Promise<PayrollCsvExportResult>
```

Params:
- `workspaceId`
- `userId`
- `ipAddress?`
- `startDate?`
- `endDate?`

Result:
- `contentType: 'text/csv'`
- `filename`
- `csv`
- `exportedRows`

## Behavior Preserved

The service mirrors the current route behavior:

- requires `workspaceId`
- requires `userId`
- exports payroll entries scoped by `workspaceId`
- left-joins payroll runs for period metadata
- resolves employee names through workspace-scoped employee query
- computes deductions with `sumFinancialValues()` + `formatCurrency()`
- writes non-blocking sensitive-data audit log with action `payroll.export.csv`
- tracks `startDate` / `endDate` only in audit metadata because the current route does not filter by those values
- returns the same CSV header and filename pattern

## Recommended Claude/local-build route replacement

In `server/routes/payrollRoutes.ts`:

1. Add import:

```ts
import { buildPayrollCsvExport } from '../services/payroll/payrollCsvExportService';
```

2. Replace the body of `router.get('/export/csv', requirePlan('business'), async (req, res) => { ... })` after auth/workspace validation with:

```ts
const { startDate, endDate } = req.query;
const result = await buildPayrollCsvExport({
  workspaceId,
  userId,
  ipAddress: req.ip || null,
  startDate: typeof startDate === 'string' ? startDate : null,
  endDate: typeof endDate === 'string' ? endDate : null,
});

res.setHeader('Content-Type', result.contentType);
res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
res.send(result.csv);
```

3. Preserve existing route middleware and role checks:

- `requirePlan('business')`
- `checkManagerRole(req)`
- user auth check
- workspace context check

4. Remove now-unused imports from `payrollRoutes.ts` only if the compiler confirms they are no longer used.

5. Build verify:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Notes

This service intentionally contains a warm/validation select of payroll runs because the legacy route ran that query before exporting entries, even though the route did not use the `runs` result. Claude may remove that select only if build/test inspection confirms it has no side effect and route parity is not required.
