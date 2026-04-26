# ═══════════════════════════════════════════════════════════
# AGENT SYNC BLOCK
# Updated: 2026-04-26
# ═══════════════════════════════════════════════════════════

## WHO GOES NEXT: JACK ✋

## BRANCH RULES — MANDATORY
- `development` = stable production — DO NOT push route changes here
- `refactor/route-cleanup` = all cleanup work goes here
- Remote tips:
  - development: 9278e5a0a (platform GREEN ✅)
  - refactor/route-cleanup: eb7c54f0c (latest cleanup)

---

## CORRECT AUDIT METHODOLOGY (learned from crash)

**Step 1 — Check mount prefix first:**
```bash
grep -rn "/api/MOUNT_PREFIX" client/ | wc -l
# If > 0: file must stay. Only trim dead handlers inside it.
# If 0: entire file can be deleted.
```

**Step 2 — Check individual handler paths:**
```bash
grep -rn "/api/MOUNT/specific-path" client/ server/ | grep -v FILENAME.ts
# If 0 results: handler is dead, safe to delete
```

---

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

