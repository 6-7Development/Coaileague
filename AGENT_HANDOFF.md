# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place.
# Last updated: 2026-05-01 — Claude (unify duplicate services sweep — CLOSED)

---

## TURN TRACKER

```
LANE — CLAUDE — ✅ CLOSED, READY FOR REVIEW/MERGE
  Branch: claude/unify-duplicate-services-7ZzYF
  Base:   438cca2  feat(simulation): hard-persist ACME simulation
  HEAD:   (see latest commit) — Phase 5: dead routes + schema-drift fix
  Commits: 6 (Phases 1, 2, 3, handoff close, 4, 5)

  Net diff vs base: ~40 files changed, ~8,130 LOC dead code removed
  Bugs fixed: 1 runtime crash (GeoCompliance import)
  Schema-drift risks eliminated: 1 (notification type set)

ARCHITECT: CLAUDE
  → Pulls all agent branches when submitted
  → Reviews diff, verifies correctness, runs build + boot test
  → Merges clean to development
  → Pushes to Railway
```

---

## CURRENT BASE

```
Branch:     claude/unify-duplicate-services-7ZzYF (pushed)
HEAD:       2884e3f
Base of branch: 438cca2  feat(simulation): hard-persist ACME simulation + branded PDFs
```

---

## ✅ WORK COMPLETED ON THIS BRANCH (3 PHASES)

**Audit doc:** `DUPLICATE_AUDIT_2026_05_01.md` (full duplicate map, route clusters, payload schemas, consolidation roadmap)

**Phase 1 landed (this branch):**
- Removed broken stub `server/services/aiSchedulingTriggerService.ts` (98 LOC of fake `confidence: 95` returns).
- Routed `aiBrainMasterOrchestrator` action `scheduling.generate_ai_schedule` directly to `autonomousSchedulingDaemon.triggerManualRun()` — the canonical engine (delegates to `trinityAutonomousScheduler`).
- Removed dead import in `server/routes/automationInlineRoutes.ts`.
- Updated `shared/schema/domains/DOMAIN_CONTRACT.ts`.

**Phase 2 landed (small mechanical, low risk):**
- ✅ Deleted `server/services/scheduling/trinityOrchestrationBridge.ts` (45-LOC shim, zero callers).
- ✅ Deleted `server/services/notificationThrottleService.ts` (283-LOC service, zero callers — full dead code).
- ✅ Dropped 47 LOC of dead helper methods from `entityCreationNotifier.ts`.

**Phase 3 landed (dead-service sweep — symbol-level verified):**
- ✅ Deleted **9 zero-caller services** (~2,493 LOC):
  - expansionSeed.ts, redisPubSubAdapter.ts, sentimentAnalysis.ts,
    timeEntryDisputeService.ts, trainingRateService.ts,
    trinityServiceConnector.ts, fileStorageIsolationService.ts,
    communicationFallbackService.ts, automationMetrics.ts.
- 🐛 Fixed runtime crash bug: `timeEntryRoutes.ts` was calling
  `GeoComplianceService.detectIPAnomaly(...)` without importing it (the
  `@ts-expect-error` directive was masking the missing import). Added the
  import; geoCompliance.ts preserved as a real service.
- Cleaned: DOMAIN_CONTRACT (3 entries), platform360StressTest (1 entry),
  trinitySelfAssessment (1 stale resolution-note).

**Phase 4 landed (final orphan sweep — broader symbol scan caught 4 more):**
- ✅ Deleted `server/services/dispatch.ts` (506 LOC) — `DispatchService`
  class never imported. `routes/dispatch.ts` is a separate file using raw
  `pool` queries; preserved.
- ✅ Deleted `server/services/notificationRuleEngine.ts` (347 LOC) — class
  exported but never imported anywhere. **Correction to Phase 2 note:** I
  had originally preserved this thinking it complemented the throttle
  service. Broader symbol scan in Phase 4 confirmed both were dead.
- ✅ Deleted `server/services/documentDeliveryService.ts` (652 LOC) —
  `DocumentDeliveryService` class never imported.
- ✅ Deleted `server/services/scheduleRollbackService.ts` (245 LOC) —
  `createScheduleSnapshot` / `rollbackSchedule` never called.
- Cleaned: DOMAIN_CONTRACT (4 entries removed).

**Phase 5 landed (route sweep + schema dedup):**

PHASE 5A — 9 dead route files deleted (~3,285 LOC):
- `dispatch.ts` (97 LOC) — `/api/dispatch/*` never mounted, never fetched.
- `gamificationRoutes.ts` (56 LOC) — never imported.
- `gpsRoutes.ts` (76 LOC) — never imported, no client fetch.
- `mascot-routes.ts` (2,710 LOC) — never mounted; client constants
  defined but no fetch ever issued; WS event `mascot.directive.updated`
  never emitted server-side. Cleaned up dead client constants in
  `apiEndpoints.ts` + dead WS handler in `ForceRefreshProvider.tsx`
  + dead allowlist entries in `maintenanceMiddleware.ts`.
- `schedulerRoutes.ts` (77 LOC) — never imported.
- `tokenRoutes.ts` (52 LOC) — never imported.
- `trainingRoutes.ts` (78 LOC) — defined `/modules`, `/attempts`,
  `/certificates`, `/compliance-summary`. Client calls
  `/api/training/certification` etc. — those are served by
  `trainingCertificationRouter` (mounted), not by this orphan.
- `workflowConfigRoutes.ts` (65 LOC) — never imported.
- `workflowRoutes.ts` (74 LOC) — never imported.

PHASE 5B — `VALID_NOTIFICATION_TYPES` collapsed to 1 line:
- Was: 95-line hardcoded `Set` of notification type strings.
- Now: `new Set(notificationTypeEnum.enumValues)` — derived from the
  Drizzle pgEnum. Runtime guard can never drift from DB schema.
- Pattern already used elsewhere (`schemaParityService.ts`).

PHASE 5C — `automation-schemas.ts` audit:
- Verified single consumer (`automation-engine.ts`). Not duplicated.
  Audit speculation about route-level dupes was wrong. No-op.

**Cumulative across 5 phases:** 25 files deleted (16 services + 9 routes),
~8,130 LOC of dead/stub code removed, 1 latent runtime bug fixed,
1 schema-drift risk eliminated.

---

## 🔍 DEBT LEFT BEHIND — REPORT TO NEXT AGENT

This branch's scope is **closed**. Sweep was thorough at the
service-file level. Remaining duplicate-domain debt is documented
in `DUPLICATE_AUDIT_2026_05_01.md` and listed below as a punch list
for whoever picks up Phase 4+. None of these are blockers.

### Phase 4 candidates (deferred — need verification before action)

**Route file consolidation** (high LOC, low semantic risk if done carefully):
- Chat routes: 8 files → consolidate to 2 (verify each mount path first).
- AI Brain routes: 8 files → 3 (control / memory / orchestrator).
- Schedule routes: 4 files → 1.
- Automation routes: 4 files → 2.
- Trinity routes: 25+ files → 4 (core / chat / ops / staffing).

**Schema deduplication:**
- ✅ `VALID_NOTIFICATION_TYPES` — DONE (now derives from `notificationTypeEnum.enumValues`).
- ✅ `automation-schemas.ts` — verified single consumer; not actually duplicated.
- `aiBrainGuardrails` config in `shared/config` vs runtime checks
  scattered across `aiGuardRails.ts`, `aiBrainAuthorizationService.ts`.
  **DEFERRED** — needs runtime profiling to know what's actually authoritative.

**Notification stack tightening** (decided keep, but boundaries fuzzy):
- `notificationService` (per-user) and `universalNotificationEngine`
  (RBAC broadcast) coexist. Document API contract so callers stop
  mixing them.
- `notificationRuleEngine` interaction with `notificationDeliveryService`
  needs a single ordering contract.

**Verified active in this sweep — DO NOT delete** (left as guidance for
next agent so they don't waste cycles re-verifying):
- `advancedSchedulingService.ts` — canonical per `sourceOfTruthRegistry`,
  4+ callers via `aiBrainMasterOrchestrator` + `advancedSchedulingRoutes`.
- `scheduleMigration.ts` — exports `extractedShiftSchema` for Zod
  validation in `scheduleosRoutes.ts:444`. Active.
- `emailAutomation.ts` — billing-aware bulk email, distinct from
  transactional `emailService`. Used by cron + trial manager + collections.
- `geoCompliance.ts` — real buddy-punching detection. Was almost flagged
  as dead because of a missing import in `timeEntryRoutes.ts:791`
  (Phase 3 fixed that import).
- `entityCreationNotifier.ts` — domain orchestrator (not a notification
  duplicate). Fires notifications + creates onboarding tasks + drafts
  contracts. Keep as-is.

**Action registries (verified NOT duplicates — layered architecture):**
- `services/helpai/platformActionHub.ts` (3,367 LOC) — central hub.
- `services/helpai/actionCatalogPolicy.ts` (273 LOC) — classification policy.
- `services/helpai/supportActionRegistry.ts` (565 LOC) — human support actions.
- `services/ai-brain/actionRegistry.ts` (5,079 LOC) — Trinity AI registers
  actions into the hub.
- `services/bots/shiftBotActionRegistry.ts` (167 LOC) — shift-bot specific.

**Email stack (verified layered, NOT duplicate):**
- `emailCore.ts` = transport + CAN-SPAM-compliant typed senders.
- `emailService.ts` = orchestration + automation flavor (imports emailCore).
- `emailTemplateBase.ts` = shared HTML template helpers.

---

## STATUS: BRANCH CLOSED

```
✅ All 3 phases landed and pushed.
✅ Zero lingering imports to deleted files.
✅ Zero broken references in DOMAIN_CONTRACT, tests, registries.
✅ One latent runtime bug discovered + fixed (GeoComplianceService import).
✅ All "verified active" services documented to prevent future false-deletes.

Ready for architect review + merge to development.
```

---

## FULL PLAN

See: `DUPLICATE_AUDIT_2026_05_01.md` (this sprint)
See: `ENHANCEMENT_SPRINT_PLAN.md` (prior sprint)

---

## AGENT SUBMISSION FORMAT

When done with a domain, submit using this format:

```
AGENT: {Claude/Codex/Copilot}
BRANCH: enhancement/lane-{x}-{agent}
COMMIT: {sha}
DOMAIN: {what was worked on}
FILES CHANGED: {list — own domain only}
WHAT WAS DONE: {3-5 line summary}
CONFLICTS WITH: none / {list if any}
BOOT TEST: passed / failed
READY TO MERGE: yes
```

---

## DOMAIN OWNERSHIP (prevents conflicts)

**CLAUDE owns:** universal-schedule.tsx, EmailHubCanvas.tsx, inbox.tsx,
  schedulesRoutes, availabilityRoutes, engagementRoutes, uacpRoutes,
  reviewRoutes, mileageRoutes, hrInlineRoutes, permissionMatrixRoutes,
  **server/services/scheduling/**, **server/services/ai-brain/aiBrainMasterOrchestrator.ts**

**CODEX owns:** websocket.ts, storage.ts, ircEventRegistry.ts,
  chat-management.ts, chatParityService.ts, chatServer.ts,
  chat/broadcaster.ts, chat/shiftRoomManager.ts

**COPILOT owns:** ChatDock.tsx and chatdock/ directory,
  chatInlineRoutes, commInlineRoutes, salesInlineRoutes, formBuilderRoutes,
  services/documents/ (PDF), all remaining un-Zodded routes

---

## ARCHITECT MERGE PROTOCOL (Claude executes)

```bash
git fetch origin {agent-branch}:refs/remotes/agent/{lane}
git diff development..agent/{lane} --name-only  # check ownership
git checkout development
git checkout agent/{lane} -- {owned-files-only}
node build.mjs 2>&1 | grep "✅ Server|ERROR"
# boot test
git add {files} && git commit -m "merge: {agent} {domain}"
git push origin development
```

---

## STANDARD: NO BANDAIDS

```
No raw money math. No raw scheduling hour math. No workspace IDOR.
No state transitions without expected-status guard. No stubs/placeholders.
Every button wired. Every endpoint real DB data.
Trinity = one individual. HelpAI = only bot field workers see.
One domain, one complete sweep, one coherent commit.
ONE SOURCE OF TRUTH per concept — see DUPLICATE_AUDIT_2026_05_01.md.
```
