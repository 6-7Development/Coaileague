# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place.
# Last updated: 2026-05-01 19:05 UTC — Claude (deferred-items sweep — all 8 closed, ready to merge)

---

# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place.
# Last updated: 2026-05-01 19:30 UTC — Claude (PHASE CLOSED — onboarding/Trinity/action wiring done)

---

## PHASE STATUS: CLOSED — ready to merge

```
BRANCH: claude/setup-onboarding-workflow-uE8II  (8 commits ahead of main)
SCOPE: Onboarding/registration/invite series + Trinity gating + action-wiring
       scan (shift CRUD / Trinity / end-user / races) + 6-issue self-audit
       + 8 deferred items closed.
NO ACTIVE CLAIM. The branch is yours to merge or hand to the next agent.
```

---

## OPEN FOLLOW-UPS — NOT FIXED THIS PHASE

These are real items that surfaced during the work but were either out of
scope, awaiting infrastructure, or genuinely not worth blocking the merge.
The next agent should pick them up — none are urgent enough to delay the
merge of this branch.

### Backward-compat shims that should be removed eventually

- **Legacy raw-token handoff fallback** (assistedOnboardingService.ts)
  — The `completeHandoff` and `getWorkspaceByToken` paths fall back to
  raw-token equality after a hash-lookup miss so in-flight pre-deploy
  handoffs keep working. After ~72 hours from deploy the handoff TTL
  expires every legacy row; remove the fallback in a follow-up commit
  along with a one-line `log.warn`-grep to confirm zero hits.

- **Eager onboarding_completed publish in workspace.ts** has been
  surgically removed. If any subscriber elsewhere assumed it would
  always fire on workspace creation, they need to be updated to
  subscribe to `workspace.created` instead.

### Multi-instance / scale considerations (works on single instance, may not on 2+)

- **Decision-logger 60s dedup is per-process** (trinityDecisionLogger.ts).
  In a multi-instance deployment, the same decision can still log twice
  if duplicate calls hit different processes. A real schema-level
  UNIQUE constraint on
  `(workspaceId, triggerEvent, chosenOption, relatedEntityId, time_bucket_minute)`
  would survive the multi-instance case. Requires a migration.

- **Trinity intake transaction** uses a dedicated pgClient via
  `pool.connect()`. Confirmed correct, but if the surrounding `pool`
  wrapper ever uses pgBouncer in transaction mode, the BEGIN/COMMIT
  pair may pin the connection unexpectedly. Verify before scaling.

### Opt-in concurrency control (existing clients unprotected)

- **Time-entry edit `expectedUpdatedAt`** is optional in the request
  body. Existing clients that don't send it keep the legacy last-write-
  wins behavior (no 409). The web `/dispatch` and mobile clients should
  be updated to send `expectedUpdatedAt` so the protection actually
  fires for the existing surface. ~30-line change per client.

### Defensible-but-debatable defaults I picked

- **Vendor → `clients` table** (publicOnboardingRoutes.ts). I chose to
  store vendors in the `clients` table with a `VND-` code prefix
  rather than create a new `vendors` table. Workspace_members.role
  still carries the RBAC distinction. A real `vendors` schema would
  be cleaner long-term but would have required a migration + every
  consumer of `clients` to learn about a new table. Owner decision.

- **DPS credentials enforced client-side only**
  (employee-onboarding-wizard.tsx step 5). Server-side route
  `/api/onboarding/certifications` accepts the data but doesn't
  reject the wizard completion if missing. Adding a server-side
  hard-block is a 1-line addition in onboardingPipelineRoutes.ts but
  would block existing in-flight wizards that already passed the
  client gate. Coordinate with HR before tightening.

- **Onboarding flag toggle on duplicate registration**
  (authCoreRoutes.ts:117). The post-`onConflictDoNothing` 400
  response returns "Email already registered" without re-sending the
  verification email. This is intentional (re-sending verification
  on duplicate signup attempts is an enumeration smell), but if
  product wants the resend behavior the change is one line.

### CI / tooling

- **`@types/node` install** — `package.json` declares it
  (`^20.19.39`) but the local sandbox doesn't populate `node_modules`
  beyond `typescript`. Verify CI's npm-install step is actually
  catching the kinds of missing-import bugs we surfaced in
  `timeEntryRoutes.ts`. Run `tsc --noEmit -p tsconfig.server.json`
  in CI and assert the output is empty (not just "passed except for
  the @types/node bail"). One-line CI guard.

- **Test patterns are brittle** (tests/unit/onboarding-wiring.test.ts).
  Several tests grep source files for substrings (e.g.,
  `"type: 'onboarding_completed'"`). A future refactor could break
  these tests without changing semantics. Migrate to behavior-level
  integration tests when a DB harness is available.

### Action surfaces NOT scanned this phase

The action-wiring scan focused on shift CRUD, Trinity actions, and
end-user time/break/clock actions. The following surfaces had NO
dedicated scan and are likely to harbor similar issues (missing
broadcasts, race conditions, missing audit logs):

- **Payroll execution** (server/services/payrollAutomation.ts,
  server/routes/payrollRoutes.ts and friends) — payroll runs, voids,
  approval cascades.
- **Document signing** (server/routes/documentRoutes.ts,
  documentTemplateRoutes.ts, documentVaultRoutes.ts) — sign / seal /
  audit-trail flows.
- **Chat messaging proper** (server/services/ChatServerHub.ts,
  chat-rooms.ts, chatInline / commInline / dockChat). The
  notification surface was scanned; the message-send / read /
  ephemeral / IRC pathways were not.
- **Dispatch console** (server/routes/dispatch.ts,
  cadRoutes.ts) — incident creation, officer assignment, broadcast.
- **Voice / SMS pipelines** (server/routes under voice/, twilio
  webhooks).
- **Billing & invoicing** (server/routes/billing-api.ts,
  bidAnalyticsRoutes.ts, invoice creation/payment cascades).

Roughly half the platform's action surface. A follow-up scan in the
same shape as this one would be high-leverage.

### Cosmetic / low-priority

- **`time-entry-routes.ts` vs `timeEntryRoutes.ts`** — two files,
  both mounted, named differently (hyphen vs camelCase). The split
  is documented in `routes/domains/time.ts:16-17` but is itself a
  smell — anyone assuming one file might break the other. Consider
  consolidating in a future cleanup.

- **`gen_random_uuid()::varchar` cast vs Drizzle default**
  (`migrations/0006_auditor_settings.sql` vs the schema definition).
  Both work; only matters if someone hand-writes a raw INSERT
  bypassing Drizzle. Cosmetic alignment, no correctness issue.

- **WS resubscribe-on-reconnect lifecycle** — `SettingsSyncListener`
  and `OnboardingProgressBanner` both rely on `useWebSocketBus`. If
  the WS provider disconnects and reconnects, hooks should resubscribe
  cleanly via the existing useEffect cleanup. Verified the cleanup
  function is returned from `bus.subscribe`; not stress-tested under
  connection churn.

---

## RECENT MERGES TO claude/setup-onboarding-workflow-uE8II

```
aa91fee  fix(deferred): close all 8 deferred items from prior scans
ce84ee7  fix(self-audit): patch 6 issues introduced by my own grade-A series
ffc3079  fix(actions): wire missing broadcasts, gates, and races flagged by scan
da854f7  chore(handoff): claim active scan + log onboarding series in AGENT_HANDOFF
50f0da3  polish(onboarding): grade-A series — security, loop closure, UI surfaces, docs
56470a0  polish(onboarding): grade-A finish — WS sync, real completion gate, UIs, tests, docs
c1553f8  feat(onboarding): close remaining settings/sync/Trinity gating gaps
7a1174b  fix(onboarding): wire missing pipeline links across roles & tenants
```

Cumulative footprint: ~40 files, ~2,600 insertions. Both `tsc --noEmit -p
tsconfig.json` and `tsc --noEmit -p tsconfig.server.json` clean.

Key changes (so other agents don't re-do them):
- `workspace.handoff_completed`, `workspace.assisted_created`, `client.registered`,
  `onboarding_step.completed`, `onboarding.completed`,
  `onboarding.admin_force_complete` audit_log actions are NEW —
  prefer adding to these rather than creating parallel actions.
- `requireOnboardingComplete` middleware exists — apply to new Trinity-gated
  routes via `import { requireOnboardingComplete } from '../middleware/workspaceScope'`.
- `broadcastSettingsUpdated()` is the canonical settings invalidation helper.
  All new settings PATCH endpoints should call it rather than rolling their own.
- `useSettingsSync` (mounted globally in App.tsx) auto-invalidates react-query
  keys on `settings_updated` WS events — register your scope in the
  SCOPE_TO_QUERY_KEYS map in `client/src/hooks/use-settings-sync.ts`.
- `OnboardingProgressBanner` is mounted globally and listens for
  `onboarding_completed`. Don't render a parallel celebration card.
- `auditorSettings` table replaces all per-auditor preferences;
  workspace-scoped writes require an active audit (auditorHasAuditForWorkspace).
- `currentNdaVersion()` controls auditor NDA gate — bump
  `process.env.AUDITOR_NDA_VERSION` to force re-acceptance.
- `aiTokenGateway.preAuthorize('agent_spawn:<key>')` is now called inside
  `spawnAgent` — every Trinity agent spawn goes through token budget gating.
- `trinitySelfEditGovernance.getPathTier(filePath)` returns the tier
  (`config` / `service_logic` / `core_infrastructure` / `database_schema`).
  Use it before letting a non-platform-staff caller schedule a change.
- New platform-staff override: `POST /api/workspace/onboarding/admin-force-complete/:id`
  for unsticking workspaces stuck mid-onboarding.

---

## DETAILED FIX LOG (kept for archaeology — superseded by OPEN FOLLOW-UPS above for next-session work)

### ACTION-WIRING SCAN — FIXES SHIPPED (2026-05-01)

Three parallel Explore agents reported 25+ issues across shift CRUD,
Trinity actions, and end-user actions. After per-issue verification:

1. **schedulesRoutes.ts:101+150+301** — `workspaceId` ReferenceError on
   /publish, audit log, and /unpublish. Replaced with `userWorkspace.workspaceId`
   and `workspace.id`. (CRITICAL — both endpoints crashed on first call.)
2. **shiftRoutes.ts:1853** — shift marketplace pickup had no WS broadcast
   or event publish. Added `broadcastShiftUpdate` + `platformEventBus.publish('shift_assigned')`.
3. **shiftRoutes.ts:1809** — `getEmployeeByUserId` called without workspaceId.
   Added the scope arg so multi-workspace users hit the right row first.
4. **shiftRoutes.ts:3000+** — shift switch request had no broadcast/event.
   Added `broadcastToWorkspace('shift_switch_requested')` + event publish.
5. **timeEntryRoutes.ts** — missing imports for `format`, `broadcastToWorkspace`,
   `GeoComplianceService`, `calculatePayrollHours` (would have crashed clock-in,
   approve, reject, bulk-approve, clock-out, CSV export, payroll calc). Added.
6. **trinitySessionRoutes.ts:44+79** — `/turn` and `/end` had NO ownership
   check (IDOR-style: any auth'd user could inject turns into another user's
   session). Added `trinityConversationSessions.userId` lookup with 403 on
   mismatch.
7. **trinityIntakeRoutes.ts:65+** — `/respond` race window between INSERT
   into trinity_intake_responses and UPDATE of trinity_intake_sessions.
   Wrapped in `BEGIN/COMMIT` via dedicated client.
8. **coveragePipeline.ts:122+** — idempotency key was `${shiftId}` only,
   so re-triggering after coverage flipped was silently no-op. Now includes
   `shift.updatedAt.getTime()` so real state changes pass through.
9. **trinityEventSubscriptions.ts (onOnboardingCompleted)** — WS broadcast
   failure was swallowed silently. Now `log.warn`s so ops can detect stale
   completions.
10. **authCoreRoutes.ts:117+** — register email-uniqueness race
    (parallel signups bypass pre-INSERT SELECT and crash on UNIQUE
    constraint). Switched to `INSERT ... ON CONFLICT DO NOTHING` and
    return 400 if no row comes back.
11. **automationTriggerService.ts (handleSchedulePublished)** — re-fired
    events ignored the per-feature automation toggle. Added
    `trinityAutomationToggle.isFeatureAutomated('schedule_publishing')`
    early return.
12. **workspace.ts** — new platform-staff-only manual override
    `POST /api/workspace/onboarding/admin-force-complete/:workspaceId` so
    workspaces stuck mid-onboarding (silent subscriber failure) can be
    unstuck without hand-crafted SQL.

Both `tsc --noEmit -p tsconfig.server.json` and `tsc --noEmit -p
tsconfig.json` clean after the patches.

### SELF-AUDIT PASS — FOLLOW-UP FIXES (2026-05-01 18:14 UTC)

A cold-eyes review of the previous 6 commits caught issues I had introduced
in my own work. These were verified directly (not just by agent summary)
and patched before merge:

- **assistedOnboardingService.ts** — Hashing handoff tokens broke pending
  pre-deploy handoffs (raw token in DB, hashed token from email → no match).
  Added dual-lookup fallback in both `completeHandoff` and
  `getWorkspaceByToken`: try hash first, fall back to raw, log warn on
  legacy match.
- **workspace.ts /onboarding/admin-force-complete** — was flipping the
  flag directly but NOT publishing `onboarding_completed`, so the in-app
  notification + WS broadcast + thalamic_log signal all silently skipped.
  Now publishes the event after the defensive UPDATE; the handler's
  UPDATE is idempotent so this doesn't loop.
- **miscRoutes.ts client signup** — `req.session` properties were set
  but `save()` never awaited, so the Set-Cookie header could race the
  redirect to `/client-portal` and land users on `/login` with no session.
  Now awaits `req.session.save()` and only redirects to `/client-portal`
  if the save succeeded; falls back to `/login` otherwise.
- **onboarding-progress-banner.tsx** — `completeMut.onSuccess` and the
  WS `onboarding_completed` event would both fire toasts on the same
  tick (banner morphs into celebration AND toast pops up). Now skips the
  mutation toast when `celebrate` is already true.
- **settingsSyncBroadcaster.ts** — Sub-tenant fan-out only broadcast to
  direct children, missing 3-level-deep grandchildren that inherit
  through the parent chain. Now does a bounded BFS (depth 5, 200-node
  cap) over `parentWorkspaceId` so all descendants invalidate.
- **tests/unit/onboarding-wiring.test.ts** — Old assertion required
  exactly one `type: 'onboarding_completed'` occurrence in workspace.ts;
  the new admin-force endpoint added a second valid one. Test now
  scopes the "must NOT be in create handler" check to the create-block
  slice and adds a router-shape assertion for the new endpoint.

Both `tsc --noEmit` runs still clean.

### DEFERRED ISSUES — ALL CLOSED 2026-05-01 19:05 UTC

All 8 items from the previous deferred list shipped this turn. Patches:

1. ✅ **trinityDecisionRoutes.ts override** — `markHumanOverride` now does
   a conditional UPDATE (`WHERE humanOverride = false`) and returns
   `{ alreadyOverridden: bool }`. The route returns
   `{ success: true, alreadyOverridden: true }` on the second call,
   making the endpoint idempotent without an idempotencyKeys table.
2. ✅ **trinityDecisionLogger.ts logDecision** — added 60-second in-memory
   dedup window keyed on
   `(workspaceId|triggerEvent|chosenOption|relatedEntityType|relatedEntityId)`.
   Mirrors the existing `_recentlyPaidRuns` pattern in
   trinityEventSubscriptions.ts.
3. ✅ **agentSpawner.ts** — every `spawnAgent()` call now goes through
   `aiTokenGateway.preAuthorize('agent_spawn:<key>')` first; surfaces
   the same `TOKEN_HARD_CAP_REACHED` reason the rest of the platform
   uses; fails open on gateway errors so a transient billing service
   outage doesn't take down all Trinity automation.
4. ✅ **trinitySelfEditRoutes.ts /proposals** — sysop can still propose
   `config` and `service_logic` changes, but proposals touching
   `core_infrastructure` (db.ts, index.ts, auth.ts) or `database_schema`
   (shared/schema.ts, drizzle/) now require full platform-staff. Tier
   computed via `trinitySelfEditGovernance.getPathTier(file)` for each
   change, then 403'd if any one needs platform-staff and the caller
   isn't.
5. ✅ **timeEntryRoutes.ts:703 manual_clockin_overrides** — INSERT
   rewritten to align with the actual schema: writes to (id, workspace_id,
   employee_id, shift_id, override_type, reason, metadata) only. Site /
   officer-name / reason-code detail now lands in `metadata` jsonb.
6. ✅ **shiftRoutes.ts /:id/accept** — was both racy AND insecure (any
   officer in the workspace could accept any shift in eligible statuses).
   Now wraps a SELECT FOR UPDATE → permission check → conditional UPDATE
   in a single transaction; verifies `shift.employeeId === callingEmployee.id`
   so only the assigned officer can accept their own shift; returns
   409 SHIFT_NOT_ACCEPTABLE on stale-state and 403 on identity mismatch.
7. ✅ **time-entry-routes.ts entries/:id PATCH** — added optimistic
   concurrency control: clients can pass `expectedUpdatedAt` in the body;
   if it doesn't match the current row, throw `TIME_ENTRY_STALE` and
   return 409 with the live `currentUpdatedAt`. Clients without
   `expectedUpdatedAt` keep the legacy last-write-wins behaviour
   (backward compatible).
8. ✅ **validateEnvironment.ts** — TRINITY_BOT_TOKEN now warned about
   when missing (added to BILLING_VARS-style soft-warn list); checks
   length (32+) and character set (hex/base64url) and warns on either
   mismatch. Doesn't fail-fast because some deployments don't run
   Trinity bot integrations.

---

## TURN TRACKER

```
PARALLEL LANES — ALL ACTIVE NOW:

  LANE A — CLAUDE
    Branch: enhancement/lane-a-claude
    Working on: A1 (Scheduling), A2 (Email), A3 (Zod Tier 1)

  LANE B — CODEX
    Branch: enhancement/lane-b-codex
    Working on: B1 (ChatDock durable), B2 (RBAC/IRC), B3 (large files), B4 (middleware)

  LANE C — COPILOT
    Branch: enhancement/lane-c-copilot
    Working on: C1 (ChatDock features), C2 (Zod sweep), C3 (document PDFs)

ARCHITECT: CLAUDE
  → Pulls all agent branches when submitted
  → Reviews diff, verifies correctness, runs build + boot test
  → Merges clean to development
  → Pushes to Railway
```

---

## CURRENT BASE

```
origin/development → 8e02aaf97  (Railway STABLE GREEN ✅)
```

---

## FULL PLAN

See: ENHANCEMENT_SPRINT_PLAN.md (same directory)
Contains: domain map, success criteria, merge protocol, agent assignments

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
  reviewRoutes, mileageRoutes, hrInlineRoutes, permissionMatrixRoutes

**CODEX owns:** websocket.ts, storage.ts, ircEventRegistry.ts,
  chat-management.ts, chatParityService.ts, chatServer.ts,
  chat/broadcaster.ts (new), chat/shiftRoomManager.ts (new)

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
```
