# COAILEAGUE REFACTOR — MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 — Jack/GPT Grade A scheduling hardening audit

---

## TURN TRACKER

```text
Current turn: CLAUDE ← execute Phase B follow-ups + Grade A scheduling hardening
```

Bryan clarified the standard:

```text
Fix all weak code. Replace with structured strengthened code. Don't leave bandaids behind.
Correct any phase/domain while refactoring or verifying the code base. Whatever weak code is found, strengthen it for Grade A code.
Scheduling is core and feeds everything else, so it needs to be super duper.
```

This means phase labels are bookkeeping only. If weak code is found in any domain while doing this pass, strengthen it properly.

---

## BRANCH RULES

```text
Jack audits on refactor/service-layer.
Claude executes on development.
After Claude executes, sync development → refactor/service-layer.
Never merge refactor/service-layer → development unless Claude is explicitly deploying the reviewed execution.
```

Before deployment/merge:

```bash
node build.mjs
export DATABASE_URL="postgresql://postgres:MmUbhSxdkRGFLhBGGXGaWQeBceaqNmlj@metro.proxy.rlwy.net:40051/railway"
export SESSION_SECRET="coaileague-dev-test-session-secret-32chars"
node dist/index.js > /tmp/boot.txt 2>&1 &
sleep 18
curl -s http://localhost:5000/api/workspace/health
# expected: {"message":"Unauthorized"}
grep -cE "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot.txt
# expected: 0
kill %1
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor: complete, ~97k lines removed.
Phase A auth/session: reviewed and green.
Phase B financial flows: deployed by Claude, but Jack found follow-ups.
Phase C scheduling/shift flows: Jack audit complete; requires structural hardening.
```

---

# PHASE B REVIEW — FINANCIAL FOLLOW-UPS

## B1. invoiceAdjustmentService refund transaction gap

Claude's transaction wrapping for these is good:

```text
creditInvoice: invoice update + adjustment insert in db.transaction()
discountInvoice: invoice update + adjustment insert in db.transaction()
correctInvoiceLineItem: line item update + invoice update + adjustment insert in db.transaction()
```

But `refundInvoice` still has this issue:

```text
Stripe refund first is correct because Stripe cannot be rolled back.
But after Stripe succeeds, the DB writes should still be internally atomic.
Current risk: invoice update succeeds, invoiceAdjustments insert fails → money moved but DB audit is half-written.
```

Required fix:

```text
In refundInvoice, after Stripe succeeds, wrap invoice update + invoiceAdjustments insert in db.transaction().
Keep offline/manual ledger write and platform event after transaction commit.
```

## B2. financialLedgerService still has raw financial arithmetic

Jack found raw arithmetic still present after Phase B summary claimed all raw arithmetic was converted.

Fix remaining money/financial aggregate math in:

```text
Balance sheet:
  totalLiabilities = accruedPayroll + taxesPayable
  retainedEarnings = totalAssets - totalLiabilities

Revenue per guard hour:
  revenuePerHour = revenue / hours

Client profit margin:
  profit = revenue - laborCost

AR aging buckets:
  summary.totalOutstanding += outstanding
  summary.current += outstanding
  summary.days1to30 += outstanding
  summary.days31to60 += outstanding
  summary.days61to90 += outstanding
  summary.over90 += outstanding

Payroll journal totals:
  totalGross += entry.grossPay
  totalNet += entry.netPay
  totalEmployeeTaxes += entry.federalTax + entry.stateTax + entry.socialSecurity + entry.medicare
  totalEmployerFICA += entry.employerSocialSecurity + entry.employerMedicare
  totalFUTA += entry.employerFUTA
  totalSUTA += entry.employerSUTA

Employer tax liabilities:
  ficaTotal = employerSS + employerMedicare
  futaLiability = Math.min(employeeCount * futaWageBase, totalGross) * futaRate
  sutaLiability = Math.min(employeeCount * sutaWageBase, totalGross) * sutaRate
  totalEmployerObligation = ficaTotal + futaLiability + sutaLiability
  totalTrustFundLiability = federalIncomeTaxWithheld + employeeSS + employeeMedicare + employerSS + employerMedicare
  quarterlyDeadlines estimated = totalEmployerObligation / 4
```

Required fix:

```text
Use financialCalculator helpers for money/financial aggregate math.
For min(employeeCount * wageBase, totalGross), compute employeeCount*wageBase with Decimal helper, compare against totalGross, then multiply selected base by rate with helper.
```

## B3. financeInlineRoutes period validation bug

Current issue:

```text
PeriodSchema = z.enum(['month', 'quarter', 'year']).default('month')
route switch accepts this_month, last_month, this_quarter, this_year
periodParsed is created but not used
invalid period silently falls back to 30 days
```

Required fix:

```text
Make PeriodSchema match the actual accepted values or normalize to a new canonical enum.
Use parsed.data.period before switch.
Return 400 on invalid period.
```

---

# PHASE C — GRADE A SCHEDULING HARDENING

## C0. Legacy branding rule: ScheduleOS / OS

Bryan clarified:

```text
ScheduleOS is legacy. Any OS branding was replaced with Trinity Schedule branding or Smart Schedule.
```

Required cleanup:

```text
Do not introduce new ScheduleOS or OS branding.
Replace user-facing messages, comments, endpoint descriptions, logs, and docs with Trinity Schedule or Smart Schedule.
```

Compatibility note:

```text
Existing route file/URL names such as scheduleosRoutes.ts or /scheduleos may remain temporarily only if required for backward compatibility.
If kept, add comments saying they are legacy compatibility aliases for Trinity Schedule / Smart Schedule.
Do not expose ScheduleOS branding to users.
```

Search locally because connector search did not reliably find all occurrences:

```bash
rg -n "ScheduleOS|Schedule OS|scheduleos|scheduleOS|AI Scheduling™|Scheduling™|OS branding" server client shared docs --glob '*.{ts,tsx,md}' || true
```

---

## C1. Required architecture: canonical shift assignment service

Jack found that `shiftRoutes.ts` has the strongest scheduling protections, but several other paths update shift assignment directly.

Strong path:

```text
server/routes/shiftRoutes.ts POST /
```

Weaker/bypass-prone paths:

```text
server/routes/scheduleosRoutes.ts — AI smart-generate and proposal approval update shifts directly
server/routes/orchestratedScheduleRoutes.ts — AI fill shift updates shifts directly
migration/import routes — create/import shifts with weaker validation
```

Required structural fix:

```text
Create or strengthen a shared service, for example:
server/services/scheduling/shiftAssignmentService.ts
```

All assignment paths must call this service, including:

```text
manual shift creation/assignment
AI fill shift
AI proposal approval
Smart Schedule / Trinity Schedule generation
coverage/call-off replacement
migration/import assignment if employee assignment exists
```

The service should centralize:

```text
workspace scoping
employee workspace membership
employee active/suspended/pending status
onboarding eligibility
license/certification eligibility
armed-post eligibility
minimum rest-period enforcement + owner override audit
overtime warning/acknowledgment audit
advisory lock per employee
PostgreSQL exclusion constraint 23P01 handling
stagedShifts creation for billable shifts
chatroom provisioning after commit
webhook/event publish after commit
```

Do not copy/paste these checks into more routes. Make one boring, canonical path.

---

## C2. Shift overlap and assignment safety

Current good pattern in `shiftRoutes.ts`:

```text
PostgreSQL btree_gist exclusion constraint no_overlapping_employee_shifts is the atomic source of truth.
Per-employee advisory locks serialize concurrent assignment.
23P01 is caught and returned as SHIFT_OVERLAP_CONFLICT.
```

Required fix:

```text
Ensure every direct update to shifts.employeeId/status uses the canonical assignment service and gets the same lock/constraint/23P01 behavior.
```

Local search:

```bash
rg -n "update\(shifts\)|employeeId: assignment\.employeeId|employeeId: .*employeeId|status: 'scheduled'|status: \"scheduled\"" server/routes server/services --glob '*.ts'
```

---

## C3. Raw scheduling arithmetic

Jack found raw hour/duration arithmetic in core scheduling paths:

```text
schedulesRoutes.ts:
  totalHours += hours
  employeeHours.set(employeeId, empHours + hours)
  overtimeHours += hours - 40
  Math.round(totalHours * 10) / 10
  Math.round(overtimeHours * 10) / 10

shiftRoutes.ts:
  gapHours = ms / hour
  newShiftHours = ms / hour
  currentHours reduce(sum + sh)
  projected = currentHours + newShiftHours
  Math.round(currentHours * 10) / 10
  Math.round(newShiftHours * 10) / 10
  Math.round(projected * 10) / 10
```

Required fix:

```text
Create a small scheduling time math helper, for example:
server/services/scheduling/schedulingMath.ts
```

Suggested helpers:

```ts
hoursBetween(start: Date, end: Date): string
addHours(...hours: Array<string | number>): string
subtractHours(a: string | number, b: string | number): string
roundHours(hours: string | number, decimals = 1): number
isOverHours(hours: string | number, threshold: string | number): boolean
```

Use Decimal internally or the existing Decimal-backed financialCalculator helpers if preferred.

---

## C4. Timesheet state transitions need atomicity

`payrollTimesheetRoutes.ts` is better after Phase B, but still has structural gaps:

```text
create route parses req.body manually even though CreateTimesheetSchema exists.
reject route reads req.body.reason manually even though RejectTimesheetSchema exists.
submit/approve/reject update status, then write audit separately.
```

Required fix:

```text
Use parsed Zod data in create and reject.
Wrap state transition + audit write in db.transaction() for submit/approve/reject.
Use conditional update WHERE id + workspaceId + expected prior status to prevent racey double-submit/double-approve.
```

Recommended pattern:

```text
UPDATE payroll_timesheets
SET status = 'approved', approved_by = ..., approved_at = ..., updated_at = ...
WHERE id = ... AND workspace_id = ... AND status = 'submitted'
RETURNING *
```

If no row returns, fetch current status and return 409.

---

## C5. Orchestrated schedule data isolation

`orchestratedScheduleRoutes.ts` has router-level auth and workspace status endpoints, but some lookup endpoints fetch by raw ID without scoping the DB query itself:

```text
GET /executions/:executionId
GET /orchestration/:orchestrationId/steps
possibly other execution/orchestration detail endpoints
```

Required fix:

```text
Every execution/orchestration lookup must include workspaceId in the query or service lookup.
Do not fetch by ID first and then infer access later.
```

Pattern:

```text
where(and(eq(automationExecutions.id, executionId), eq(automationExecutions.workspaceId, workspaceId)))
```

For in-memory universalStepLogger lookups, verify returned context.workspaceId equals req.workspaceId before returning steps.

---

## C6. Shift chatroom route validation and atomic audit chains

`shiftChatroomRoutes.ts` is mostly workspace-scoped and has Zod on several mutation bodies.

Remaining weak spots:

```text
POST /:chatroomId/send uses manual destructuring/content check; replace with Zod schema.
DAR approve/reject/escalate/request-changes/legal-hold do DB update then appendAccessLog separately.
```

Required fix:

```text
Use Zod on /send payload.
Where a DAR status change and access-log append must both happen, wrap them in one db.transaction() or make appendAccessLog accept tx.
```

---

## C7. Call-off / coverage pipeline

Connector search did not surface a clear end-to-end call-off → coverage pipeline → Trinity alert chain.

Required local audit:

```bash
rg -n "call.?off|callOff|coverage|shiftCoverageRequests|shiftOffers|replacement|open shift|open-shift|trinity.*coverage|coverage.*trinity" server client shared --glob '*.{ts,tsx}'
```

If pipeline exists:

```text
Verify workspace scoping, replacement assignment through canonical assignment service, notifications/events after commit, and no direct employeeId shift update bypass.
```

If pipeline does not exist or is partial:

```text
Document as product gap and add a minimal service skeleton / TODO guarded by no broken runtime behavior, or create the core service if scope allows.
```

---

## C8. GPS / proof-of-service / guard tour chain

Required local audit:

```bash
rg -n "gps|latitude|longitude|check.?in|clock.?in|proof|guard.?tour|tour|geofence|haversine|location stamp" server client shared --glob '*.{ts,tsx}'
```

Verify:

```text
workspace membership before check-in/clock-in
employee assigned to shift or manager override
location distance calculation centralized
raw Haversine helper not duplicated without validation
proof-of-service writes are atomic with time entry / DAR / guard tour state where required
```

---

## CLAUDE EXECUTION ORDER

```text
1. Apply Phase B follow-ups: refund transaction, remaining financialLedgerService math, financeInlineRoutes PeriodSchema bug.
2. Add schedulingMath helper and replace raw scheduling hour arithmetic.
3. Create/strengthen canonical shiftAssignmentService and route manual/AI/proposal assignment paths through it.
4. Harden payrollTimesheetRoutes state transitions with conditional updates + transactions.
5. Scope orchestrated schedule execution/detail endpoints by workspace.
6. Zod + transaction improvements in shiftChatroomRoutes/DAR flows.
7. Rename user-facing ScheduleOS/OS/AI Scheduling™ strings to Trinity Schedule or Smart Schedule while preserving legacy route aliases if needed.
8. Local audit call-off/coverage and GPS/proof-of-service chains. Fix what is weak; document any product gaps.
9. Run build + boot. Deploy green. Sync development → refactor/service-layer. Update this handoff with exact fixes and mark Jack reviewer.
```

---

## EXPECTED QUALITY BAR

```text
No bandaids.
No duplicate assignment rules in separate routes.
No raw money math.
No raw scheduling duration math where it affects overtime/rest/payroll.
No workspace IDOR in execution/detail endpoints.
No state transition without expected-status guard.
No user-facing ScheduleOS legacy branding.
```

Claude goes next.
