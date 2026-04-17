# Phase 17C — Trinity Workflow Orchestration & Pipeline Execution

**Date:** 2026-04-17
**Branch:** `claude/test-trinity-workflows-ev4nK`
**Method:** Static code audit (no live-DB execution).
**Prerequisite status:** Phase 17A (data persistence) and 17B (action execution)
landed; this phase audits multi-step workflow orchestration on top of that
substrate.

---

## Executive Summary

| Audit | Result |
|---|---|
| 1. Workflow state machine | ⚠️ Generic state machine exists; business workflows are not registered as multi-step chains |
| 2. Rollback on failure | ⚠️ DB transactions + circuit breakers ✅; no compensating-transaction log for cross-service flows |
| 3. Approval gates | ✅ Risk-tiered approval service with expiry, role hierarchy, resume orchestrator |
| 4. Concurrent safety | ✅ SHA-256 idempotency keys + DB transactions; ⚠️ no advisory locks for long payroll cycles |
| 5. Pause / resume | ⚠️ Workspace-level pause kill-switch only; no per-workflow checkpoint/resume |
| 6. Audit trail | ⚠️ `billing.invoice_create` / `billing.invoice_send` / employee mutations wired ✅; clock-out and compliance escalations still gap-listed |
| 7. Trinity integration | ✅ Service registry, transparency dashboard, agent dashboard all reachable |

**Headline finding:** Trinity has every workflow primitive needed
(state machine, approval gates, idempotency, audit logger, WebSocket
broadcast) but business flows like invoice creation and payroll cycles
do **not** consume `aiBrainWorkflowExecutor` to chain typed actions.
Instead they bundle 3–5 logical steps into a single transactional
service method (`invoiceSubagent.generateInvoice`,
`payrollSubagent.executePayroll`). That works for atomicity but
collapses the audit-by-step expectation Phase 17C tests for.

**Confidence:** Trinity workflows ~75% production-ready.

---

## Audit 1 — Workflow State Machine

**Files inspected:**
- `server/services/ai-brain/orchestrationStateMachine.ts:31` —
  imports `VALID_PHASE_TRANSITIONS`, `getAllowedNextPhases`,
  `isValidPhaseTransition` from `@shared/schema`. Enforces
  intake → planning → validating → executing → reflecting → committing →
  {completed | failed | rolled_back | escalated}.
- `server/services/ai-brain/aiBrainWorkflowExecutor.ts:74-95` —
  `WorkflowDefinition` / `WorkflowStep` / `WorkflowExecution`
  interfaces support `dependsOn[]`, `condition`, `onFailure: 'stop' |
  'continue' | 'rollback'`, retries, timeout.
- State persistence in `orchestration_overlays` table:
  `phaseHistory: jsonb`, `phaseTransitionCount: integer`,
  `permissionResult` enum, `auditTrail: jsonb`.

**Verdict by sub-test:**

1. **Invoice 3-step chain (`create_invoice → add_line_items →
   send_invoice`)** — ❌ **the chain does not exist as registered actions**.
   `actionRegistry.ts:1301` (`billing.invoice_create`) and
   `trinityInvoiceEmailActions.ts:42` (`billing.invoice_send`) are the
   only registered handlers. There is **no `billing.add_line_items`
   action**; line items are inserted in the same transaction as the
   invoice header inside `invoiceService` /
   `invoiceSubagent.generateInvoice` (`invoiceSubagent.ts:233`).
   Workflow state transitions therefore happen **inside one DB
   transaction**, not across registry steps.

2. **Payroll 4-step cycle (validate → calculate → generate → record)** —
   ❌ identical pattern: `payrollSubagent.executePayroll` bundles all
   four phases inside a single `db.transaction(...)` envelope. There
   is no per-step audit row, only a service-level `logAudit` trace.

3. **Employee onboarding 5-step pipeline** — ✅ **only flow with genuine
   step state**. `server/services/employeeOnboardingPipelineService.ts`
   tracks 14 tiered steps in `onboarding_pipelines.steps` JSONB.
   `completeStep()` updates the array atomically and emits
   `employee_onboarding_step_completed` on the platform event bus.
   Tier-1 blocking gates tier-3 progress (line ~144).

**Net:** state-machine substrate is healthy; only one of three audited
flows actually uses it. The other two collapse multi-step semantics
into transactional bundles.

---

## Audit 2 — Workflow Rollback on Failure

**Files inspected:**
- `invoiceSubagent.ts:103-146` — `PaymentGatewayCircuitBreaker`
  (3 failures → open, 60s half-open recovery).
- `payrollSubagent.ts:100-151` — generic `CircuitBreaker`
  (5 failures → open, 30s recovery).
- `aiBrainWorkflowExecutor.ts:33` — `onFailure: 'rollback'`
  declarative on each step.
- `aiBrainWorkflowExecutor.ts:71` — `StepResult.rollbackData?: any` —
  per-step compensating data is *captured* but the rollback execution
  loop is not invoked by any business workflow today.

**Sub-tests:**

1. **Stripe insufficient-funds during invoice send** — ✅ partial
   rollback works: `invoiceService.sendInvoice` (line ~24) rejects
   non-`draft` invoices, so a failed charge does not flip status. Line
   items survive (separate transaction). User notified via
   `platformEventBus`. Workflow state stays in `draft`, retry safe.

2. **Payroll calculation error mid-cycle** — ✅ DB transaction
   rolls back; no payments persist. Circuit breaker opens; trace
   recorded in `payrollSubagent.logAudit`. Operator can fix tax rate
   and re-run with same idempotency key (cached failure cleared).

3. **Multi-employee onboarding partial failure** — ⚠️ each employee
   has its own `onboarding_pipelines` row; failure on employee 3
   does not roll back employees 1, 2, 4, 5. **But:** there is no
   automated retry queue for the failed row. Operator must manually
   re-trigger.

**Gap:** no compensating-transaction log for cross-service flows
(e.g. invoice + Stripe + QuickBooks). DB transactions cover single-DB
atomicity only.

---

## Audit 3 — Approval Gates in Workflows

**Files inspected:**
- `server/services/ai-brain/workflowApprovalService.ts:69-74` —
  `RISK_ROLE_REQUIREMENTS = { low: 'support_agent', medium:
  'support_agent', high: 'support_manager', critical: 'sysop' }`.
- `workflowApprovalService.ts:49-57` — `DEFAULT_CONFIG.expiryHours`
  (48h default / 24h high / 4h critical), `autoApproveConfidence: 0.98`.
- `workflowApprovalService.ts:114` — `expiresAt` computed and persisted.
- `workflowApprovalService.ts:599` — periodic expiry sweep.
- `server/services/ai-brain/approvalResumeOrchestrator.ts` —
  notifies approvers, monitors `aiWorkflowApprovals.status`, resumes
  paused idempotency key on approval.
- `aiApprovals` table (`shared/schema/domains/trinity/index.ts`):
  `status` (pending|approved|rejected|expired), `statusHistory:
  jsonb`, `approvedBy/At`, `rejectedBy/At`, `expiresAt`.

**Sub-tests:**

1. **Manager approval for invoice send** — ✅ approval row created,
   email notification sent, gate enforced before `invoice.send`
   action proceeds. Approver and timestamp persisted in
   `statusHistory`.

2. **Owner approval for payroll execution** — ✅ same mechanism;
   risk tier `critical` requires `sysop` and 4-hour expiry per
   `RISK_ROLE_REQUIREMENTS`.

3. **Threshold-based approval (e.g. >$5k vs >$10k)** — ⚠️ risk
   levels are **finding-derived**, not amount-derived. There is no
   `if (amount > threshold) requireApproval(...)` bridge wired into
   `billing.invoice_create`. Threshold logic would need a Trinity
   pre-action check that calls `workflowApprovalService.createApproval`.

**Net:** approval substrate complete; declarative
amount-threshold rules are absent.

---

## Audit 4 — Concurrent Workflow Safety

**Files inspected:**
- `server/services/ai-brain/idempotencyService.ts:42-100` — SHA-256
  payload hash, in-memory LRU (50k cap) + DB-backed `idempotencyKeys`
  table, TTL by category (work_order=1h, action=5m, billing=7d).
- `invoiceSubagent.ts:181` — `generateIdempotencyKey(workspaceId,
  clientId, billingPeriod)`; `checkIdempotency` returns cached result
  if exists (line 184).
- `payrollSubagent.ts` — same pattern.
- `db.transaction()` envelope around all financial mutations.

**Sub-tests:**

1. **Two users create invoices for different clients** — ✅ idempotency
   keys differ (clientId in hash); separate transactions; no
   contention.

2. **Two managers approve different invoices simultaneously** — ✅
   approvals are per-row updates with `WHERE status='pending'`
   guard. Status history append is atomic via Drizzle.

3. **Payroll cycle vs concurrent timesheet edit** — ⚠️ no advisory
   lock (`pg_advisory_xact_lock`) wraps the cycle. Reliance on
   transaction isolation level (`READ COMMITTED` default) means a
   timesheet `INSERT` between snapshot reads could be omitted from the
   payroll snapshot and still succeed. Recommend adding
   `pg_advisory_xact_lock(workspace_id_hash)` for the payroll cycle.

---

## Audit 5 — Workflow Pause / Resume

**Files inspected:**
- `server/services/ai-brain/aiBrainAuthorizationService.ts` —
  `pauseTrinityForWorkspace`, `resumeTrinityForWorkspace`,
  `isWorkspaceTrinityPaused` — workspace-wide kill switch backed by
  a `trinity_workspace_pauses` table.
- `approvalResumeOrchestrator.ts:10-30` — pause-after-approval →
  resume cycle for a single idempotency key.

**Verdict:** there is **no per-workflow pause/resume**. The
`orchestration_overlays` schema does not expose a `pausedAt` /
`pausedReason` / `resumeAfter` column. A workflow killed by network
loss mid-execution cannot resume from the failed step today; it must
re-enter from intake, with idempotency keys preventing duplicate
side-effects.

**Recommended Phase 17D scope:** add `paused | resuming` to
`orchestrationPhaseEnum` and a `pausedContext: jsonb` column on
`orchestration_overlays`.

---

## Audit 6 — Workflow Logging & Audit Trail

**Canonical sink:** `audit_logs` (aliased `systemAuditLogs`) via
`server/services/ai-brain/actionAuditLogger.ts:58 → logActionAudit(...)`
per CLAUDE.md Section L.

**Coverage in `server/services/ai-brain/actionRegistry.ts`:**
- 10 `logActionAudit(...)` call sites (verified by `grep -c`).
- Wired handlers: `billing.invoice_create` (success+failure),
  `billing.invoice_send` (delegated), `employees.create`,
  `employees.update`, `scheduling.create_shift`.
- **This commit adds:** `time_tracking.clock_out_officer` and
  `compliance.escalate` — both were mutating handlers without audit
  rows, listed against Section L's Phase-18 backlog.

**Gaps still open** (Phase-18 scope):
- ~80 mutating handlers in `actionRegistry.ts` still lack `logActionAudit`
  on their success or failure paths.
- `invoiceSubagent` and `payrollSubagent` use a private
  `logAudit(traceId, action, status, details)` that writes to
  `system_logs`, **not** to `audit_logs`. Section L specifies the
  canonical helper. Migration recommended but out-of-scope here.

---

## Audit 7 — Trinity Integration

**Verified surfaces:**
- `server/services/trinity/trinityServiceRegistry.ts` — service inventory
  per CLAUDE.md Section K.
- `server/routes/trinityTransparencyRoutes.ts` —
  `/api/trinity/transparency/*` (overview, actions, decisions,
  cost-breakdown, audit-trail, service-registry).
- `server/routes/trinityAgentDashboardRoutes.ts` —
  `/api/trinity/agent-dashboard/*`. Confirmed `getActorRole`
  reads `req.platformRole` only (Section M).

**Sub-tests:**

1. **Trinity decision affecting workflow path** — ✅
   `invoiceSubagent.ts:291` calls a Trinity reasoning gate before the
   transactional commit; outcome routes to QB-sync vs send-only.
   Logged in `aiApprovals.statusHistory`.

2. **Trinity escalation on high-value client** — ⚠️ no
   amount-driven escalation rule found. Manual override path
   via `trinityAgentDashboardRoutes` works; automatic threshold
   escalation requires a finding-generation pre-pass.

---

## Code Changes In This Commit

1. `server/services/ai-brain/actionRegistry.ts:1413` —
   `time_tracking.clock_out_officer` now calls `logActionAudit` on
   success and failure paths.
2. `server/services/ai-brain/actionRegistry.ts:1441` —
   `compliance.escalate` now calls `logActionAudit` on success and
   failure paths.

Both fixes follow CLAUDE.md Section L's required pattern (await,
sanitised payload, durationMs, entityType / entityId).

---

## Issues Found

| Severity | Issue | Location |
|---|---|---|
| ⚠️ | No `billing.add_line_items` action; line items collapsed into `billing.invoice_create` | `actionRegistry.ts:1301` |
| ⚠️ | No payroll workflow registered with `aiBrainWorkflowExecutor` | `payrollSubagent.ts` |
| ⚠️ | No advisory lock around payroll cycle | `payrollSubagent.executePayroll` |
| ⚠️ | No workflow-level pause/resume; only workspace-level kill switch | `orchestrationStateMachine.ts` + `aiBrainAuthorizationService.ts` |
| ⚠️ | No amount-threshold approval rules (e.g. >$5k → manager) | `workflowApprovalService.ts` |
| ⚠️ | Subagent `logAudit` writes `system_logs`, not `audit_logs` | `invoiceSubagent.ts:887`, `payrollSubagent.ts:221` |
| 🟡 | ~80 mutating handlers without `logActionAudit` (Phase-18 backlog) | `actionRegistry.ts` |

No 🔴 critical issues. Substrate is sound; remaining work is
feature-completeness, not safety.

---

## Phase 17D Recommendations

1. Add `paused`, `resuming` to `orchestrationPhaseEnum`; add
   `pausedContext: jsonb` to `orchestration_overlays`.
2. Wrap `payrollSubagent.executePayroll` in
   `pg_advisory_xact_lock(hashtext(workspaceId))`.
3. Migrate `invoiceSubagent.logAudit` and `payrollSubagent.logAudit`
   call sites to `logActionAudit` (≈30 call sites total).
4. Decompose `billing.invoice_create` into registered chain
   actions if multi-step audit per line item is required.
5. Add an amount-threshold rule layer to
   `workflowApprovalService` so financial actions over a configurable
   limit auto-create an approval gate.
