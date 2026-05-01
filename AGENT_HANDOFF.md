# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place.
# Last updated: 2026-05-01 — Claude (unify duplicate services sweep)

---

## TURN TRACKER

```
ACTIVE LANE — CLAUDE
  Branch: claude/unify-duplicate-services-7ZzYF
  Base:   438cca2  feat(simulation): hard-persist ACME simulation
  Status: PHASE 1 LANDED — ai schedule trigger unified to one source of truth.
          Comprehensive duplicate audit + roadmap published.

ARCHITECT: CLAUDE
  → Pulls all agent branches when submitted
  → Reviews diff, verifies correctness, runs build + boot test
  → Merges clean to development
  → Pushes to Railway
```

---

## CURRENT BASE

```
HEAD on this branch → see latest commit on claude/unify-duplicate-services-7ZzYF
Last green: 438cca2  feat(simulation): hard-persist ACME simulation + branded PDFs
```

---

## ACTIVE WORK — DUPLICATE SERVICE UNIFICATION

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
- ⏳ Move `VALID_NOTIFICATION_TYPES` to `shared/schema` — deferred (needs DB enum cross-check).

**Phase 3 (route consolidation — see audit for file lists):**
- Chat routes 8 → 2.
- AI Brain routes 8 → 3.
- Schedule routes 4 → 1.
- Automation routes 4 → 2.
- Trinity routes 25+ → 4.

**Phase 4 (legacy audit & deletion):**
- `advancedSchedulingService.ts` — confirm zero callers, delete.
- `scheduleMigration.ts` — confirm migration done, delete.
- `emailAutomation.ts` — audit overlap with `emailService`.

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
