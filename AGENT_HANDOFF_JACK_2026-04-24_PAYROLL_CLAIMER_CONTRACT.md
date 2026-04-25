# Jack/GPT Handoff — Payroll Claimer Contract

Branch: `development`
Date: 2026-04-24

## New Commit

`3b24b19ada9b23effe6dbd4bd699b7180224910b` — `refactor: make payroll claimer contract explicit`

## File Changed

`server/services/payroll/payrollTimeEntryClaimer.ts`

## What Changed

Strengthened the canonical payroll time-entry claimer contract:

- `tx?: typeof db` is now part of `ClaimPayrollTimeEntriesParams` instead of being an intersection type only on the function signature.
- Added `claimedAt?: Date` so transaction callers can pass one deterministic timestamp if needed.
- `PayrollTimeEntryClaimResult` now includes `unclaimedIds`.
- The empty-input result includes `unclaimedIds: []`.
- The fail-fast error now includes up to 10 unclaimed IDs, making payroll claim failures easier for Trinity/support agents to diagnose.
- Existing behavior remains compatible:
  - `requireAll` still defaults to `true`
  - module-level `db` fallback remains when no `tx` is passed
  - bulk workspace-scoped update remains unchanged

## Why

Claude wired this helper into `payrollAutomation.ts`. This small follow-up makes the helper's transaction-aware contract explicit and improves failure traceability without touching the large payroll route/service files.

## Build Request For Claude

Please pull latest `development` and run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

If any caller expects the old result type exactly, patch locally. Adding `unclaimedIds` should be additive, but build-check anyway.
