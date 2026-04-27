# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Claude (Phase D fixes complete)

---

## TURN TRACKER

```text
Current turn: CODEX <- review Phase D fixes + audit Phase E (documents/compliance)
```

---

## BRANCH RULES

```text
Codex audits on refactor/service-layer.
Claude executes on development.
After Claude executes, sync development -> refactor/service-layer.
Never merge refactor/service-layer -> development.
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor: complete, ~97k lines removed.
Phase A auth/session: complete.
Phase B financial flows: complete.
Phase C scheduling/shift: complete.
Phase D Trinity action flows: FIXES DEPLOYED — Codex to verify before Phase E.
Phase E documents/compliance flows: NOT STARTED — Codex audits next.
```

---

## DEVELOPMENT TIP

```text
origin/development -> 0db5ac212 (STABLE GREEN after Phase D fixes)
```

---

## WHAT CLAUDE DID — Phase D (Codex: please verify)

### P0 fixes — action gates were broken

**preExecutionValidator** — fail-closed on error for high-risk categories
  Was: any validator exception → PASSED (fail open)
  Now: payroll/invoicing/billing/scheduling/admin/compliance/tax → blocked

**platformActionHub** — validator contract corrected
  Was: checking .valid (always undefined) → blocked every workspace action
  Now: checks .approved + handles .requiresConfirmation explicitly
  Also: fail-closed on catch for high-risk categories

**Dual-AI verification** — now actually blocks
  Was: only blocked if approved===false AND criticalIssues.length > 0 (catch continued)
  Now: blocks on any non-approved result. Catch → fail-closed block.

**payroll.run_payroll** — zero-hours gate before insert
  Was: insert payroll run first, count hours second
  Now: count approved hours FIRST, block with ZERO_APPROVED_HOURS if 0, then insert

### P1 fixes — security

**Session messages IDOR** — ownership check on getSessionMessages()
**Control console** — workspaceId from auth, not raw query
**Role lists** — canonical names + support_agent/support_manager added
**Terminated employee** — all payload aliases + terminationDate check
**Registry invariant** — assertRegistryInvariants() method added
**Dispatcher action ID** — payroll.run → payroll.run_payroll
**Tax action RBAC** — requiredRoles set, req.payload instead of req.params

### P2 fixes — guardrails + cleanup

**Legal/duty-of-care hard guard** — deterministic regex in trinityContentGuardrails
**Stale mode code** — legacy aliases removed, switchMode deprecated

### Codex — verify:
1. Does the fail-closed pattern in preExecutionValidator look correct?
2. Is the dual-AI catch block returning a proper ActionResult type?
3. Any other Trinity action paths that bypass the validator entirely?
4. Is the legal_advice guardrail pattern comprehensive enough?

---

## PHASE E — NEXT (Codex audits)

Target: Document and compliance flows

Files to inspect:
```
server/routes/payStubRoutes.ts
server/routes/payrollRoutes.ts          (pay stub generation + PDF)
server/services/paystubService.ts       (PDF generation — already partially fixed)
server/services/documents/             (document vault service)
server/routes/complianceReportsRoutes.ts
server/routes/compliance/
server/routes/documentVaultRoutes.ts
server/routes/documentLibraryRoutes.ts
server/routes/hr/documentRequestRoutes.ts
```

Look for:
1. Every document endpoint — does it return a real branded PDF saved to vault?
   OR does any endpoint return raw data instead of a PDF?
2. PDF has: header, footer, page numbers, document ID, tenant branding
3. DocuSign-equivalent signing: request → signed webhook → vault storage
4. Compliance evidence: license upload → expiration tracking → alert → regulator view
5. Auditor portal: read-only, no write paths possible, workspace scoped
6. i9, onboarding packet, credential wallet — end-to-end chain
7. Any document endpoint missing workspace scoping


## PHASE D - TRINITY ACTION FLOWS AUDIT

Codex audited these target/current files:

```text
server/services/trinity/trinityOrchestrationAdapter.ts
server/services/ai-brain/orchestrationBridge.ts
server/services/ai-brain/actionRegistry.ts
server/services/helpai/platformActionHub.ts
server/services/trinity/preExecutionValidator.ts
server/services/trinity/trinityActionDispatcher.ts
shared/config/orchestration.ts
shared/config/rbac.ts
server/routes/trinityChatRoutes.ts
server/routes/trinityControlConsoleRoutes.ts
server/services/ai-brain/trinityChatService.ts
server/services/ai-brain/trinityPersona.ts
server/services/ai-brain/trinityContentGuardrails.ts
server/services/ai-brain/trinityTaxComplianceActions.ts
```

Notes on briefing path drift:

```text
server/services/ai-brain/trinityOrchestrationAdapter.ts does not exist on f3f92da6c.
Current adapter path is server/services/trinity/trinityOrchestrationAdapter.ts.
server/config/registry.ts and server/config/orchestration.ts do not exist on f3f92da6c.
Current action registry is server/services/ai-brain/actionRegistry.ts plus server/services/helpai/platformActionHub.ts.
Current orchestration config is shared/config/orchestration.ts.
```

### P0 - Fix before any further Trinity action testing

1. `platformActionHub` misreads the pre-execution validator result, so workspace-scoped actions are blocked even when validation passes.

Files/lines:

```text
server/services/helpai/platformActionHub.ts:2288-2300
server/services/trinity/preExecutionValidator.ts:21-33
```

Problem:

`validateBeforeExecution()` returns `{ approved: boolean, reason?, requiresConfirmation? }`, but `executeAction()` checks `(preExecResult as any).valid`. `valid` is undefined for every result, so `!undefined` is true and the hub returns "Pre-execution validation failed" for any request with `workspaceId`. This means Trinity chat-dispatched workspace actions do not actually execute through the normal path.

Exact fix:

Change the hub contract check to use `approved`. Handle `requiresConfirmation` explicitly and return a confirmation-required result. Example intent:

```ts
if (!preExecResult.approved) block;
if (preExecResult.requiresConfirmation) return requiresHumanConfirmation;
```

Add a regression test that a benign workspace-scoped read action with a passing validator reaches its handler.

2. Pre-execution gates fail open on validator exceptions.

Files/lines:

```text
server/services/trinity/preExecutionValidator.ts:280-287
server/services/helpai/platformActionHub.ts:2299-2302
```

Problem:

The validator catches any internal error, logs `error_fallthrough`, then returns `PASSED`. The hub also catches validator throws and continues. These are supposed to be hard gates for employment status, zero/invalid financial inputs, billing-cycle conflicts, and payroll/invoice safety; they cannot fail open.

Exact fix:

Make validator errors fail closed for all mutating/high-risk action categories (`payroll`, `invoicing`, `billing`, `scheduling`, `admin`, `compliance`, `tax`). The hub catch should block those categories with a typed fail-safe response. Only read-only health/status actions may degrade open.

3. Mandatory dual-AI verification is non-blocking.

Files/lines:

```text
server/services/helpai/platformActionHub.ts:2567-2614
server/services/ai-brain/actionRegistry.ts:2287-2308
```

Problem:

The hub labels dual-AI verification as mandatory, but catches verifier errors and only logs a warning. It also only blocks when `!approved` and `criticalIssues.length > 0`; a rejected result with no `criticalIssues`, a timeout, or an unavailable verifier proceeds to the handler. `billing.invoice_void` has its own fail-closed deliberation gate, but the general hub gate for payroll/invoicing/billing/compliance/tax is fail-open.

Exact fix:

For `needsDualAI` actions, block unless the verifier returns an explicit approved result. On verifier error/unavailable/timeout, return a fail-safe ActionResult and do not call `handler.handler()`. Treat any `approved === false` as blocked, regardless of whether `criticalIssues` is populated.

4. Trinity payroll action bypasses the zero-approved-hours hard gate and creates a run before counting hours.

Files/lines:

```text
server/services/helpai/platformActionHub.ts:1385-1438
server/routes/payrollRoutes.ts:418-438 (good route pattern to reuse)
```

Problem:

`payroll.run_payroll` inserts a `payrollRuns` row first, then aggregates approved time entries. If there are zero approved entries/hours, it still sends a payroll notification and returns success with `0.0 total hours`. This bypasses the route-level hard gate that Phase C added.

Exact fix:

Move the approved-hours/count query before any insert/notification. If count is zero or total hours is zero, return a blocking result with `ZERO_APPROVED_HOURS` and do not create a payroll run. Prefer extracting the existing route gate into a shared payroll service so the route and Trinity action use one code path. Use `schedulingMath`/decimal-safe helpers for hour totals where values leave SQL.

### P1 - Security and tenant isolation

5. Trinity chat session messages endpoint is an IDOR.

Files/lines:

```text
server/routes/trinityChatRoutes.ts:170-174
server/services/ai-brain/trinityChatService.ts:1964-1975
server/services/ai-brain/trinityChatService.ts:3471-3476
```

Problem:

The route is workspace/auth gated, but it passes only `sessionId` into `getSessionMessages()`. The service then queries `trinityConversationTurns` by `sessionId` only. Any authorized Trinity user who can guess/obtain another session ID can read that conversation, including another user in the same workspace or a different workspace. The private `getSession(sessionId, userId)` helper already shows the intended ownership check, but the public message fetch bypasses it.

Exact fix:

Change `getSessionMessages(sessionId, userId, workspaceId)` to first verify the session belongs to both the requesting user and workspace, then query turns. Or perform an inner join from turns to sessions and filter by `session.id`, `session.userId`, and `session.workspaceId` in one query. Return 404 for no authorized session.

6. Control Console history endpoints can return unscoped Trinity thoughts/actions.

Files/lines:

```text
server/routes/trinityControlConsoleRoutes.ts:36-40
server/routes/trinityControlConsoleRoutes.ts:107
server/routes/trinityControlConsoleRoutes.ts:124-131
server/routes/trinityControlConsoleRoutes.ts:154-161
server/services/ai-brain/trinityControlConsole.ts:613-637
server/services/ai-brain/trinityControlConsole.ts:642-666
server/services/ai-brain/trinityControlConsole.ts:671-679
```

Problem:

`/timeline` fetches by `sessionId` only. `/thoughts` and `/actions` accept `workspaceId` directly from query, and if omitted the service passes `where(undefined)`, returning recent rows across all workspaces. The stream route also trusts `req.query.workspaceId` as a fallback. Since these records can contain prompts, payloads, PII, financial context, and action parameters, this violates the no cross-tenant data bleed standard and conflicts with the support-mode prompt that says platform staff must see aggregate data only.

Exact fix:

Mount this router with `requireAuth` before `requirePlatformStaff` or add it per route. Derive allowed workspace scope from a vetted support/elevated-session context, not raw query. Require `workspaceId` for tenant-level logs and enforce it in the service methods. `getSessionTimeline` must also require workspace scope and filter thoughts/actions by both session and workspace. If root/sysop needs global diagnostics, expose a separate aggregate-only endpoint with redacted payloads.

7. Trinity chat platform-role gates use stale role names and exclude support agents.

Files/lines:

```text
server/routes/trinityChatRoutes.ts:36-37
server/routes/trinityChatRoutes.ts:106-120
server/services/ai-brain/trinityChatService.ts:788-789 (canonical support list differs)
shared/config/rbac.ts:527-533 (role groups)
```

Problem:

The local chat route allows `co_admin` and `sysops` but the canonical platform roles are `root_admin`, `deputy_admin`, `sysop`, `support_manager`, `support_agent`, and `compliance_officer`. The brief requires support agents to use Trinity, but the route blocks them. It also maps trust tier using the stale role strings, so support-mode detection and owner-level context are inconsistent between route and service.

Exact fix:

Use the canonical shared/server role helpers instead of hardcoded arrays. Include `support_manager` and `support_agent` for Trinity access. Normalize legacy aliases centrally if `co_admin`/`sysops` still need backward compatibility. Add a route-level test for support_agent access and for field employee denial.

8. Terminated employee block is incomplete.

Files/lines:

```text
server/services/trinity/preExecutionValidator.ts:97-114
server/routes/payrollRoutes.ts:383-389 (example status-based filtering)
```

Problem:

The validator only checks `employees.isActive === false` for `payload.employeeId`. It does not select or block `employees.status = 'terminated'/'inactive'`, `terminatedAt`, or common payload aliases like `officerId`, `targetEmployeeId`, `assignedEmployeeId`, and `employeeIds`. A terminated employee with inconsistent `isActive` state, or an action using a different key, can bypass the hard gate.

Exact fix:

Normalize all employee target IDs from scalar and array payload fields. Select `isActive`, `status`, and termination fields, scoped by `workspaceId`. Block terminated/inactive/deactivated/suspended statuses even if `isActive` is stale. Include a multi-employee payload test.

### P1 - Registry and dispatch correctness

9. Action registry is not demonstrably below 300 actions and has no runtime cap.

Files/lines:

```text
server/services/helpai/platformActionHub.ts:2151-2169
server/services/ai-brain/actionRegistry.ts:150-180
```

Audit count:

Static scan across `server/services/ai-brain`, `server/services/helpai`, `server/services/trinity`, `server/routes`, and `shared/config` found:

```text
698 actionId literal/mkTaxAction occurrences
561 unique action IDs
88 duplicate action IDs by literal occurrence
721 registerAction call sites
```

Not every literal is necessarily registered at runtime, but the codebase is already far beyond the 300-action architectural target unless a large subset is dead/unloaded. `registerAction()` ignores duplicate registrations, but it does not enforce a maximum count or fail startup when the cap is exceeded.

Exact fix:

Add a boot-time registry invariant after all action modules initialize:

```ts
const count = platformActionHub.getRegisteredActions().length;
if (count > 300) throw new Error(...)
```

Then consolidate/disable low-value action sets until runtime count is under 300. Add a test that initializes the registry and asserts unique action IDs and count `< 300`.

10. Chat dispatcher maps payroll intent to an unregistered action ID.

Files/lines:

```text
server/services/trinity/trinityActionDispatcher.ts:84-91
server/services/helpai/platformActionHub.ts:1385
server/services/ai-brain/trinityExecutivePlanner.ts:191,306
```

Problem:

Natural-language "run payroll" dispatches `payroll.run`, but the registered payroll action is `payroll.run_payroll`. This means payroll requests can queue approvals or attempt execution against an unknown action, bypassing the intended handler/gates and producing confusing failures.

Exact fix:

Change dispatcher action ID to `payroll.run_payroll`. Add a startup/test invariant that every `ACTION_INTENT_PATTERNS[].actionId` exists in `helpaiOrchestrator.getAction()` after registry initialization.

11. Tax compliance actions lack explicit RBAC and use `req.params` instead of action payload.

Files/lines:

```text
server/services/ai-brain/trinityTaxComplianceActions.ts:18-28
server/services/ai-brain/trinityTaxComplianceActions.ts:38-352
server/services/helpai/platformActionHub.ts:2799-2802
```

Problem:

`mkTaxAction()` does not set `requiredRoles`, while `isAuthorized()` expects a `requiredRoles` array and calls `.length`. Depending on call path this can crash, or future defaulting could accidentally open tax actions too broadly. The handler also reads `req.params`, but `ActionRequest` carries `payload`, so user-supplied tax calculation parameters may be ignored. Calculations do use internal tax tables, which is good, but the root-admin update gate is not encoded as a test/invariant.

Exact fix:

Set explicit roles on every tax action. Read-only/audit tax actions should be owner/support/platform roles only; any tax-table update/import action must be root_admin only and should not fetch from external sources at runtime. Change handlers to use `req.payload`. Add tests for `tax.calculate_sample_withholding` authorization and parameter use.

### P2 - Prompt/persona cleanup and legal guardrails

12. Legal/duty-of-care block is prompt guidance, not a hardcoded guard.

Files/lines:

```text
server/services/ai-brain/trinityContentGuardrails.ts:70-107
server/services/ai-brain/trinityChatService.ts:459-464
server/services/ai-brain/trinityPersona.ts:844-848
server/services/ai-brain/trinityPersona.ts:1634-1643
```

Problem:

The persona says not to give legal advice, but the content guardrails only block illegal/unethical patterns. The knowledge corpus instructs Trinity to provide legal basis, statute names, and state-specific legal procedure, then append a disclaimer. That is not a hardcoded legal-advice block. There is also no explicit duty-of-care classifier/block in the action or chat path.

Exact fix:

Add deterministic legal/duty-of-care classification before LLM generation. For requests seeking legal conclusions, contract interpretation, liability predictions, use-of-force authorization, termination legality, or duty-of-care assumptions, Trinity should provide operational/compliance information only and state that formal legal advice must come from counsel. Keep state statute context as "compliance reference" but block prescriptive legal advice. Add tests for legal-advice and duty-of-care prompts.

13. Trinity mode cleanup is mostly done but stale mode/personal code remains.

Files/lines:

```text
server/services/ai-brain/trinityChatService.ts:1-10
server/services/ai-brain/trinityChatService.ts:134-139
server/services/ai-brain/trinityChatService.ts:468-640
server/services/ai-brain/trinityChatService.ts:3294-3311
server/services/ai-brain/trinityPersona.ts:2108-2130
```

Problem:

The active path forces `ConversationMode = 'business'`, and `trinityPersona.ts` correctly says Trinity has no modes. But `trinityChatService.ts` still contains stale comments for "Business/Personal/Integrated mode conversations", a large `buildPersonalModePrompt()`, legacy aliases, and a public `switchMode()` method. This is not currently the top blocker, but it invites future regressions and contradicts the one-individual architecture.

Exact fix:

Remove `buildPersonalModePrompt`, legacy aliases, and `switchMode()` if no callers remain. Keep the DB `mode` column as a hardcoded back-compat value only. Update comments/API metadata from BUDDY/mode language to unified Trinity language.

---

## CLAUDE EXECUTION ORDER

```text
1. Fix validator result contract + fail-closed behavior (P0 #1/#2).
2. Fix dual-AI fail-open behavior (P0 #3).
3. Fix payroll.run_payroll zero-approved-hours gate and action dispatcher ID (P0 #4 + P1 #10).
4. Fix chat session-message IDOR and control-console tenant scoping (P1 #5/#6).
5. Fix Trinity chat platform-role lists/support access (P1 #7).
6. Fix terminated employee normalization/status checks (P1 #8).
7. Add registry count/duplicate/intent-action invariants and consolidate below 300 (P1 #9).
8. Fix tax action RBAC/payload handling and add tax-table update invariant (P1 #11).
9. Add legal/duty-of-care hard guard and clean stale mode code (P2 #12/#13).
```

---

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
No Trinity action mutation without workspace scope, hard preflight gates, audit trail,
and fail-closed behavior for financial/compliance/tax/scheduling risk.
Trinity is one individual. No Business/Personal/Tech mode switching.
```

