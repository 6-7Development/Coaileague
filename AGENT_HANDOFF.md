# ═══════════════════════════════════════════════════════════
# AGENT SYNC BLOCK — refactor/route-cleanup branch

---
# AGENT SYNC BLOCK

# Updated: 2026-04-26
# ═══════════════════════════════════════════════════════════

## WHO GOES NEXT: JACK ✋
<<<<<<< HEAD
## BRANCH: refactor/route-cleanup (NOT development)

---

## CURRENT BRANCH HEALTH ✅

- Build: clean
- Broken prefix scan: 0 lines
- Startup: DATABASE_URL only (expected)
- development branch: stable, platform GREEN

---

## WHAT WAS JUST DONE (this commit)

Files DELETED (all handlers had 0 callers):
  trainingRoutes.ts     — 1,291L, 26 handlers
  performanceRoutes.ts  — 755L, 9 handlers
  complianceRoutes.ts   — 1,824L, 51 handlers

terminationRoutes.ts: 573→170L (-403L)
  Deleted: PATCH /terminations/:id, PATCH /terminations/:id/complete
  Kept: GET /terminations (5 callers), POST /terminations (5 callers)

---

## REFACTOR BRANCH CUMULATIVE

| Pass | Removed |
|---|---|
| File deletions (4 zero-prefix files) | -1,084L |
| Handler trimming pass 1 | -2,313L |
| HR + vehicle pass | -2,638L |
| Scheduler/onboarding pass | -2,294L |
| Ghost route + health repair | -645L |
| This pass (training/perf/compliance) | ~-4,273L |
| **TOTAL on branch** | **~13,247L** |

---

## NEXT TARGETS FOR JACK

Run prefix audit first, then audit individual handlers:
=======

## BRANCH RULES — MANDATORY
- `development` = stable production — DO NOT push route changes here
- `refactor/route-cleanup` = all cleanup work goes here
- Remote tips:
  - development: 9278e5a0a (platform GREEN ✅)
  - refactor/route-cleanup: eb7c54f0c (latest cleanup)

---

## CORRECT AUDIT METHODOLOGY (learned from crash)
>>>>>>> 6af93ac5b

**Step 1 — Check mount prefix first:**
```bash
<<<<<<< HEAD
# Check mount prefix callers before touching any file
grep -rn "/api/MOUNT_PREFIX" client/ | wc -l

# Remaining high-value targets:
wc -l server/routes/miscRoutes.ts      # 2,776L catch-all
wc -l server/routes/devRoutes.ts       # 2,458L dev-only
wc -l server/routes/timeOffRoutes.ts   # 709L
wc -l server/routes/shiftRoutes.ts     # 2,240L
=======
grep -rn "/api/MOUNT_PREFIX" client/ | wc -l
# If > 0: file must stay. Only trim dead handlers inside it.
# If 0: entire file can be deleted.
```

**Step 2 — Check individual handler paths:**
```bash
grep -rn "/api/MOUNT/specific-path" client/ server/ | grep -v FILENAME.ts
# If 0 results: handler is dead, safe to delete
>>>>>>> 6af93ac5b
```

**miscRoutes.ts** — find mount, likely 60%+ dead  
**devRoutes.ts** — should be stripped from production entirely

---

<<<<<<< HEAD
## PROCESS RULES
1. Check MOUNT PREFIX callers before deleting any file
2. Check SPECIFIC PATH callers before deleting any handler
3. Run broken-prefix scan after every deletion batch
4. Build check before every commit
5. No commits to development — refactor branch only


---

## LATEST CLAUDE PASS — bcc86cdbc → [this commit]

**This pass: shiftRoutes + miscRoutes + devRoutes (-4,408L + ghost cleanup)**

| File | Before | After | Notes |
|---|---|---|---|
| shiftRoutes.ts | 3,623L | 1,642L | -1,981L, 22 dead deleted |
| miscRoutes.ts | 2,777L | 2,004L | -773L, 29 dead deleted + workspaceId bug fixed |
| devRoutes.ts | 2,459L | 149L | -2,310L, 31 dead deleted — 4 dev-only seeds kept |

Build: clean ✅ | Broken prefixes: 0 ✅

**Next targets for Jack:**
- `shiftRoutes.ts` — Jack can audit /:id/cancel, /:id/duplicate, /recurring/* if they exist
- `timeOffRoutes.ts` (709L) — confirmed all 16 alive previously, quick verify + skip
- `scheduleosRoutes.ts`, `schedulesRoutes.ts`, `advancedSchedulingRoutes.ts`
- Trinity/AI files: `ai-brain-routes.ts`, `helpai-routes.ts`

---

## LATEST CLAUDE PASS — `5b19de1a7` → `[this commit]`

**Trinity tooling batch: -418L**

| File | Result |
|---|---|
| workflowRoutes.ts | DELETED (-69L, 3 handlers all dead) |
| workflowConfigRoutes.ts | DELETED (-103L, 4 handlers all dead) |
| automationInlineRoutes.ts | trimmed (-100L, 5 dead handlers) |
| controlTowerRoutes.ts | trimmed (-11L, /refresh dead) |
| quickFixRoutes.ts | trimmed (-110L, 6 dead handlers) |

Alive kept: /api/automation/triggers, /api/control-tower/summary,
/api/quick-fixes/actions+suggestions+requests+execute

**Refactor branch total: ~21112L removed**

**Next targets for Jack:**
- payrollRoutes.ts (2,068L) — mount /api/payroll
- billing-api.ts (912L) + invoiceRoutes.ts (2,462L) — billing surfaces
- timeOffRoutes.ts (709L) — quick verify
- When complete: PR refactor branch onto development


---

## LATEST CLAUDE PASS — Financial domain batch: -3,223L

| File | Before | After | Notes |
|---|---|---|---|
| payrollRoutes.ts | 3,753L | 1,719L | -2,034L, 27 dead handlers deleted |
| billing-api.ts | 1,839L | 1,588L | -251L, 11 dead handlers deleted |
| invoiceRoutes.ts | 3,819L | 2,881L | -938L, 20 dead handlers deleted |
| timeOffRoutes.ts | 709L | 709L | All 16 handlers alive — skip |

**Extra caution applied:** Preserved portal, PDF, payment-status, create-payment routes
even when exact-path search showed 0 — verified via broad/component search first.

**Refactor branch total: ~24,335L removed**

**Next: PR refactor branch onto development**
```bash
git checkout development
git merge --no-ff refactor/route-cleanup -m "refactor: merge route cleanup branch"
git push origin development
```
Before merging: Railway preview deploy on refactor branch recommended.
=======
## WHAT'S DONE ON refactor/route-cleanup (eb7c54f0c)

**Files deleted (mount prefix = 0 callers):**
- offboardingRoutes.ts (-236L)
- stateRegulatoryRoutes.ts (-408L)
- dispatch.ts (-350L)
- gpsRoutes.ts (-90L)

**Dead handlers removed (files kept, mount active):**
- rmsRoutes.ts: 1,729→960L (-769L)
- clientRoutes.ts: 1,605→1,340L (-265L)
- cadRoutes.ts: 590→219L (-371L)
- incidentPipelineRoutes.ts: 403→297L (-106L)
- postOrderRoutes.ts: 321→168L (-153L)
- contractPipelineRoutes.ts: 787→540L (-247L)
- proposalRoutes.ts: 237→150L (-87L)

**Refactor branch total so far: -3,397L**

---

## JACK'S NEXT TARGETS (on refactor/route-cleanup branch)

```bash
git checkout refactor/route-cleanup
git pull origin refactor/route-cleanup
```

**Priority files not yet touched:**
- `salesRoutes.ts` (393L) — find mount, audit handlers
- `vehicleRoutes.ts` (300L) — mount: /api/vehicles, Jack already cleaned some
- `hrInlineRoutes.ts` (1,796L) — mount: /api, many handlers
- `employeeRoutes.ts` (2,452L) — mount: /api/employees
- `hrisRoutes.ts` (249L) — mount: /api/hris
- `hiringRoutes.ts` (417L) — mount: /api/hiring
- `schedulerRoutes.ts` (887L) — mount: /api/schedules (20 callers — keep, trim inside)

**Audit pattern:**
```bash
# Find mount
grep -n "salesRouter\|salesRoute" server/routes/domains/*.ts | grep "app.use("

# List handlers
grep -n "router\." server/routes/salesRoutes.ts | grep -E "get|post|put|patch|delete"

# Check each path
grep -rn "/api/MOUNT/PATH" client/ server/ | grep -v salesRoutes.ts
```

---

## KNOWN SAFE DELETIONS (0 prefix callers — Jack can delete entire files)
Already confirmed from prefix audit:
- offboarding, stateRegulatory, dispatch, gps → already done ✅

Still to check if 0 prefix callers:
- Any new files Jack discovers during audit
>>>>>>> 6af93ac5b

