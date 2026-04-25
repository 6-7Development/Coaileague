# Jack/GPT Handoff — Payroll Remaining-Handler Audit

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack payroll remaining-handler audit`

## Context

Claude's latest commit:

`8684dbfe8770baaf1c1d7704b1d41369b90f5e11` — `refactor: extract all 5 bank account handlers to payrollBankAccountService`

Claude reported:

- all 5 bank account handlers extracted and wired
- build clean
- `payrollRoutes.ts`: `3754 -> 2666` lines
- 26 handlers extracted
- next Jack task: audit remaining handlers and respond to workflow question

## Jack/GPT Audit Position

Do **not** create another payroll service until the next target is confirmed from local route inventory.

Reason: after the bank-account pass, the remaining payroll route file is no longer obviously one giant handler. Blindly creating more services risks creating another wrapper layer or duplicate path instead of removing complexity.

The next correct move is a local route inventory and import cleanup pass.

## Known Completed Payroll Extractions

Confirmed from prior Jack/Claude loop:

### Read / self-service / tax forms

- `payrollRunReadService.ts`
- `payrollEmployeeSelfServiceService.ts`
- `payrollEmployeeTaxFormsService.ts`
- `payrollProposalReadService.ts`
- `payrollCsvExportService.ts`

### Proposal lifecycle

- `payrollProposalApprovalService.ts`
- `payrollProposalRejectionService.ts`

### Run lifecycle

- `payrollRunCreationService.ts`
- `payrollRunDeleteService.ts`
- `payrollRunMarkPaidService.ts`
- `payrollRunProcessStateService.ts`
- `payrollRunVoidService.ts`

### Bank account/direct deposit

- `payrollBankAccountService.ts`

## Highest-Value Next Pass For Claude / Codex

### 1. Local route inventory

Please run locally:

```bash
grep -n "router\." server/routes/payrollRoutes.ts
```

Then classify every remaining route into one of these buckets:

```text
A. already-thin wrapper — leave alone
B. small enough inline — leave alone
C. still has business mutation logic — extract service
D. duplicate or legacy path — retire or redirect carefully
E. sensitive provider/integration flow — defer to dedicated sprint
```

This route inventory should be committed as either:

- an update to this handoff file, or
- a new `AGENT_HANDOFF_CLAUDE_2026-04-25_PAYROLL_ROUTE_INVENTORY.md`

### 2. Import cleanup pass

After the bank-account extraction and create-run extraction, `payrollRoutes.ts` likely has dead imports and local helpers.

Do this only with local `tsc`, not by guesswork.

Likely cleanup candidates:

- duplicated `isValidPayrollTransition` imports
- stale `employeeBankAccounts` route imports if now unused
- stale encryption imports if bank service owns encryption
- stale onboarding progress imports if bank service owns onboarding update
- stale payroll run lock helpers if creation service owns locking
- stale notification/audit imports if all remaining handlers no longer use them
- stale Plaid/bank account helpers from route file
- old `@ts-expect-error` comments around websocket imports

Required verification:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

### 3. Process-provider orchestration — defer

`POST /runs/:id/process` still contains sensitive provider orchestration and should **not** be extracted casually.

Jack's `payrollRunProcessStateService.ts` only handles the state transition. Claude correctly preserved the provider logic inline.

Treat full process extraction as a separate dedicated sprint after route inventory.

### 4. Bank account service review

Claude created `payrollBankAccountService.ts` autonomously and build-clean.

Recommended follow-up review:

- confirm `addBankAccount()` primary swap should be transactional, not only update-then-insert outside transaction
- confirm security alert target roles are correct
- confirm manual ACH account entries never decrypt in route/service responses
- confirm onboarding-completed event shape matches event bus expectations
- confirm `verifyBankAccount()` behavior is appropriate for manual ACH accounts if no Plaid token exists

This is review only unless a clear bug is found.

## Workflow Question — Codex vs Current Loop vs ZIP

### Best workflow when Codex is available

Codex should handle:

- full local repo pulls
- route inventory with grep/ripgrep
- large route patches
- import cleanup
- compiler-driven dead code removal
- build/type verification
- multi-file refactors

Codex is best for large-file edits because he can run the repo locally.

### Current best workflow while Codex is unavailable

Continue the Jack + Claude loop:

- Jack creates bounded services/registries/docs when the target is safe and clear.
- Claude wires into large files locally and build-checks.
- Jack avoids blind route rewrites through the GitHub connector.
- Claude reports line count, build result, and next target in commit message.

This workflow has worked well and reduced `payrollRoutes.ts` substantially without breaking build.

### ZIP fallback

A source ZIP is useful only if Jack needs wider local-style inspection and GitHub connector search is insufficient.

However, since Claude can pull and build the full repo, ZIP is not the preferred route right now.

Recommended priority:

```text
1. Codex local repo when available
2. Claude local repo + Jack bounded services/handoffs
3. ZIP only as fallback for Jack inspection
```

## Jack/GPT Limitation Reminder

Jack can create and update files through the GitHub connector, but does not have a true local working tree/build loop here.

Safe for Jack:

- new bounded service files
- small registry/helper edits
- architecture audits
- handoff documents
- exact implementation guidance

Risky for Jack:

- large `payrollRoutes.ts` rewrites
- import cleanup without compiler
- deleting legacy paths without caller inventory
- sensitive provider/payment orchestration extraction

## Recommended Next Commit For Claude

Claude should do one of these next:

### Option A — Preferred

Local route inventory + import cleanup:

```bash
grep -n "router\." server/routes/payrollRoutes.ts
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

Commit message should include:

- remaining route count
- line count
- deleted imports/helpers
- next extraction candidate, if any

### Option B

If a clearly large remaining handler is found, paste/summarize it in a Claude handoff and assign Jack a bounded service extraction.

## No New Code Added In This Commit

This is intentionally an audit/handoff commit only.

Reason: the payroll domain is now close enough that the next refactor should be compiler-guided cleanup, not speculative service creation.

## Notes

Stay in payroll until route inventory/import cleanup is complete. Do not jump to billing, RFP pricing, email, security, or UI unless Bryan explicitly redirects.
