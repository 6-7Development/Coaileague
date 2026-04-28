# COAILEAGUE - MASTER HANDOFF
# ONE FILE. Update in place. Never create new handoff files.
# Last updated: 2026-04-28 - Codex (synced Claude Phase 1A + Codex consolidation lane)

---

## THREE-AGENT RELAY PROTOCOL

```
CLAUDE   -> implementation lead on development (domain fixes, UI polish, boot tests)
CODEX    -> verification + hardening lead (audits, refactors, weak-code removal)
COPILOT  -> acceleration only (Zod schemas, test scaffolds, repeated patterns)
```

Whole-domain = routes, services, jobs, workers, queues, automations, webhooks,
storage, events, migrations, tests, validation, and user-facing paths.
One domain, one complete sweep, one coherent commit.

---

## TURN TRACKER

```
Current state: PARALLEL LANES
  Claude - Phase 1A scheduling audit complete; working email entity panel polish on development.
  Codex  - Synced development into refactor lane; owns RBAC/IRC consolidation and server hardening.
  Copilot - Queued for narrow Zod/test batches only after the current lane is stable.

Next merge target:
  Codex pushes refactor/service-layer only.
  Claude reviews/merges into development with build + boot validation.
```

---

## CURRENT COMMITS

```
origin/development           -> 89264fa9  (Claude Phase 1A scheduling audit + email gap analysis)
origin/refactor/service-layer -> 4fc03156  (Codex holistic consolidation harness)
local Codex lane             -> merging development forward before next hardening patch
```

Boot test before any push to development:
```bash
node build.mjs
node dist/index.js > /tmp/boot.txt 2>&1 &
sleep 18
curl -s http://localhost:5000/api/workspace/health  # must return {"message":"Unauthorized"}
grep -cE "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot.txt  # must return 0
kill %1
```

---

## PLATFORM STATUS - VERIFIED CLEAN

**62/62 features from features page verified present in codebase.**
**No feature was removed during audit phases A-I or Phase 0 registry consolidation.**

Registry: 143 handlers, 137 Trinity-visible, 0 duplicates, under the 300 cap.
Log fixes: 0 thought recording errors, 0 billing canary false positives.
All audit hardening phases A-I are deployed and stable.

---

## PHASE 1A - CLAUDE AUDIT RESULTS

### Scheduling Pipeline: Grade A
26/27 checks pass. The single reported failure was a false positive: the state
machine uses `eq(status, "submitted")` conditional WHERE, which correctly guards
the expected prior state for that transition.

Backend scheduling verified:
- `schedulingMath.ts` in use for hours, overtime, and GPS math.
- Timesheet state transitions are atomic with conditional WHERE + 409 on race.
- Shift monitoring filters to active workspaces only.
- Coverage pipeline is workspace-scoped and stoppable.
- Orchestrated schedule endpoints are workspace-scoped.
- Trinity action catalog has `fill_open_shifts`, `generate_schedule`, and `scheduling.*`.

Schedule UI status:
- `client/src/pages/universal-schedule.tsx` has drag/drop, week view, shift creation, overtime warnings, Trinity auto-fill, bulk publish, and templates.
- `client/src/pages/schedule-mobile-first.tsx` exists for mobile scheduling.

Remaining Phase 1A enhancement gaps:
- Trinity <-> Schedule data pipeline end-to-end verification.
- Shift room auto-creation on schedule publish.
- Schedule -> Payroll -> Invoice smoke test.
- Color-coded shift status indicators in grid.
- Fast add-shift flow: client + site + time + officer in fewer than 5 taps.
- Client transparency mode per shift.

### Email UI: Enhance Existing, Do Not Rebuild
`client/src/components/email/EmailHubCanvas.tsx` already has operational channel
folders, Trinity panel, compose, thread view, and sub-address routing.

Email polish priority:
1. Entity context panel in existing right-side Trinity panel.
2. Channel tab bar at top.
3. Trinity suggested actions per email.
4. Pre-drafted Trinity reply.
5. Action-needed / urgent / PDF tags on inbox rows.
6. Smart views: Needs Action, Client Mail.

Claude owns email polish. Codex must not edit:
- `client/src/components/email/EmailHubCanvas.tsx`
- `client/src/pages/inbox.tsx`
- `client/src/components/email/`

---

## CODEX HOLISTIC CONSOLIDATION SWEEP 1 - HARNESS COMPLETE

**Result:** Complete on `refactor/service-layer` as a safe audit/coordination commit.
It adds a repeatable scanner and owner lanes without changing runtime behavior.

Command:
```bash
npm run audit:consolidation
```

Windows Codex fallback:
```powershell
& "C:\Users\txpsi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\audit\holistic-consolidation-audit.mjs
```

Files changed by Codex harness:
- `scripts/audit/holistic-consolidation-audit.mjs`
- `package.json`
- `AGENT_HANDOFF.md`

Current scan result:
- 2,157 files scanned.
- P0: 2 coordination blockers.
- P1: 63 hardening/refactor candidates.
- P2: 1 large-file decomposition inventory.

### P0 - Codex Owns: RBAC + IRC Mode Consolidation
Finding: IRC/mode code still appears in permission-sensitive ChatDock surfaces.

Evidence examples:
- `server/services/ircEventRegistry.ts` includes admin-style IRC concepts such as kick, ban, mute, promote, and auth.
- `server/services/chatParityService.ts` still reasons about who can join rooms.
- `server/routes/chat-management.ts` has role/room mutation paths that must route through RBAC helpers.

Fix direction:
- RBAC owns all permission decisions.
- Room type owns behavior only: Shift Room, Team Channel, Direct Message.
- IRC/mode strings become internal routing metadata only.
- Do not rewrite `server/websocket.ts` until ChatDock durable foundation has tests.

### P0 - Claude Owns Later: ChatDock Durable Foundation
Direct WebSocket/in-memory broadcast patterns remain around ChatDock. Before
read receipts, reactions, polls, media gallery, or voice:
- Add durable message store with per-room sequence numbers.
- Add Redis pub/sub under `broadcastToWorkspace` for multi-replica Railway.
- Add FCM push before RCS/SMS fallbacks.
- Add typed WebSocket events.

### P1 - Copilot Owns: Zod Boundary Sweep
Scanner surfaced route files where mutation handlers read `req.body` without an
obvious local `z.object(...).safeParse(req.body)` boundary.

First batches:
- Chat: `chat-management.ts`, `chat-rooms.ts`, `chat-uploads.ts`, `chat.ts`, `chatInlineRoutes.ts`.
- Admin/AI: `adminRoutes.ts`, `ai-brain-routes.ts`, `aiBrainControlRoutes.ts`, `aiBrainInlineRoutes.ts`.
- Billing: `billing-api.ts`, `billingSettingsRoutes.ts`, `budgetRoutes.ts`.

### P1 - Codex Owns: Route Mount, PDF/Vault, Payroll/ACH
- Review duplicate route mounts in `server/routes/domains/*` one domain at a time.
- Verify document/tax/paystub routes produce branded PDFs and persist to tenant vault.
- Verify payroll/ACH/Plaid/paystub path for FinancialCalculator, idempotency, workspace ownership, and vault persistence before notification/transfer.

### P2 - Large File Decomposition Inventory
Largest surviving files:
- `server/storage.ts`
- `server/websocket.ts`
- `server/services/ai-brain/aiBrainMasterOrchestrator.ts`
- `client/src/pages/settings.tsx`
- `server/routes/voiceRoutes.ts`

Rule: split only after tests pin behavior and only by domain boundary. No cosmetic churn before live.

---

## CODEX PARALLEL LANE - CURRENT FILE GUARDRAILS

Codex may touch:
- `server/routes/domains/`
- `server/services/ircEventRegistry.ts`
- `server/services/chatParityService.ts`
- Chat/RBAC helper files when needed
- Server compliance, payroll, ACH, PDF/vault audit files in later commits

Codex should avoid while Claude is polishing:
- `client/src/components/email/EmailHubCanvas.tsx`
- `client/src/pages/inbox.tsx`
- `client/src/components/email/`

Claude should avoid while Codex is hardening:
- `server/routes/domains/`
- `server/services/ircEventRegistry.ts`
- `server/services/chatParityService.ts`
- `server/websocket.ts`

---

## ACTIVE WORK - EMAIL ENTITY PANEL (Claude)

Wire into existing `EmailHubCanvas.tsx`.

When an email is opened, the right panel shows:
- If sender is a client: open shifts, contract rate, invoiced MTD, officer count.
- If sender is an employee: upcoming shifts, timesheet status, certifications.
- Trinity suggested actions based on email content.
- Pre-drafted reply from Trinity.

Use existing components and routes where possible. Do not create a duplicate email hub.

---

## ENHANCEMENT SPRINT PRIORITY

**EMAIL** (current)
- Entity context panel.
- Channel tab bar.
- Trinity suggested actions.
- Pre-drafted replies.
- Tags on inbox rows.
- Smart views.

**SCHEDULE Phase 1A**
- Trinity <-> schedule pipeline E2E verification.
- Shift room auto-creation on publish.
- Color-coded shift status indicators.
- Fast add-shift modal.

**CHATDOCK**
- Redis pub/sub foundation.
- Durable message store.
- FCM + four-tier delivery.
- Read receipts, replies, reactions/emotes.
- Content moderation + legal hold.
- RBAC owns permissions; room type owns behavior.

**PORTALS**
- Workspace dashboard Grade A.
- Client portal read-only surface.
- Auditor portal PDF reports.

**HOLISTIC UX**
- All buttons/icons verified for coherent action outcomes.
- Forms mobile-optimized.
- Toast/error/success polish.
- No duplicate UI services.

**TRINITY BRAIN**
- Triad genuine reasoning.
- Proactive operating behavior.
- One unified Trinity personality, no mode switching.

---

## STANDARD: NO BANDAIDS

```
No raw money math - FinancialCalculator.
No raw scheduling hour math - schedulingMath.ts.
No workspace IDOR.
No state transitions without expected-status guard.
No user-facing legacy branding.
Every generated document = real branded PDF in tenant vault.
Trinity = one individual, no mode switching.
HelpAI = only bot field workers see.
One domain, one complete sweep, one coherent commit.
No duplicate UI services - edit what exists, do not create parallel versions.
```
