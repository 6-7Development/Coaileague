# COAILEAGUE REFACTOR — MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 — Claude (Phase B+C complete)

---

## TURN TRACKER

```text
Current turn: JACK ← review Phase B+C fixes + audit Phase D (Trinity action flows)
```

---

## BRANCH RULES

```text
Jack audits on refactor/service-layer.
Claude executes on development.
After Claude executes, sync development → refactor/service-layer.
Never merge refactor/service-layer → development.
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor: complete, ~97k lines removed.
Phase A auth/session: ✅ reviewed and green.
Phase B financial flows: ✅ all fixes deployed + follow-ups complete.
Phase C scheduling/shift: ✅ Grade A hardening deployed.
Phase D Trinity action flows: 🔄 NOT STARTED — Jack audits next.
```

---

## DEVELOPMENT TIP

```text
origin/development → 443e8bce2 (STABLE ✅ GREEN)
```

---

## WHAT CLAUDE DID — Phase B follow-ups + Phase C (Jack: please verify)

### Phase B follow-ups

**refundInvoice** — DB writes now atomic
  Stripe call stays pre-transaction (external side effects can't roll back).
  `update(invoices)` + `insert(invoiceAdjustments)` wrapped in `db.transaction()`.

**financeInlineRoutes PeriodSchema** — bug fixed
  Was: `enum(['month','quarter','year'])` — didn't match actual route values
  Now: `enum(['this_month','last_month','this_quarter','this_year','last_30_days'])`
  Validation runs BEFORE the switch, returns 400 on invalid input.

### Phase C — Grade A scheduling

**schedulingMath.ts** (NEW — `server/services/scheduling/`)
  Decimal-backed: `hoursBetween`, `addHours`, `subtractHours`, `roundHours`,
  `isOverHours`, `overtimeHours`, `restGapHours`, `msToHours`
  Geospatial: `haversineMeters`, `haversineMiles`, `haversineKm`
  (haversine was duplicated in 5 files — canonical source now here)

**schedulesRoutes.ts** — raw arithmetic → schedulingMath

**shiftRoutes.ts** — raw arithmetic → schedulingMath

**payrollTimesheetRoutes.ts** — state transitions hardened
  submit/approve/reject use conditional WHERE (id + workspaceId + expected status)
  All wrapped in `db.transaction()`. `RejectTimesheetSchema` wired. 409 on race.

**orchestratedScheduleRoutes.ts** — workspace IDOR fixed
  `/executions/:id` and `/orchestration/:id/steps` now scope by workspaceId.

**ScheduleOS/AI Scheduling™ branding** → Trinity Schedule (47 replacements)
  Route file names preserved as legacy aliases — no user exposure.

**Call-off/coverage audit** — pipeline is workspace-scoped throughout ✅
**GPS/proof-of-service audit** — clock-in and geofence routes properly scoped ✅

### Jack — verify Phase B+C:
1. Does refundInvoice transaction look correct? (Stripe-first, then DB transaction)
2. Are the timesheet conditional updates the right pattern?
3. Any haversine usages that should be migrated to schedulingMath immediately vs TODO?

---

## PHASE D — TRINITY ACTION FLOWS (Jack audits next)

**Jack's job:** Audit the Trinity action registry and orchestration flows.

Files to inspect:
```
server/services/ai-brain/trinityOrchestrationAdapter.ts
server/services/ai-brain/orchestrationBridge.ts
server/config/registry.ts          (action registry — must stay below 300 actions)
server/config/orchestration.ts     (Trinity orchestration config)
shared/config/rbac.ts              (RBAC gates on Trinity actions)
server/routes/trinityChatRoutes.ts (Trinity chat → action dispatch)
server/routes/trinityControlConsoleRoutes.ts
```

Look for:
1. **Action count** — is the registry below 300 total actions?
2. **Trinity reasoning gates** — do the 7 hard gates actually fire?
   - Terminated employee blocking
   - Zero approved hours hard gate
   - Dual-AI verification on financial actions
3. **Workspace isolation** — can Trinity access data from workspace A while operating in workspace B?
4. **Legal/duty-of-care hardcodes** — is Trinity blocked from giving legal advice?
5. **Tax calculation gate** — do tax calculations use internal tables only?
6. **Cross-tenant data bleed** — any Trinity query without workspace_id filter?
7. **Action registry duplicates** — are any action names registered twice?

---

## STANDARD: NO BANDAIDS

```text
Fix weak code across any phase/domain found during refactor or verification.
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
Scheduling is core and feeds everything — Grade A always.
```


