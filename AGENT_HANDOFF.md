# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place.
# Last updated: 2026-04-28 — Claude (Phase 1A audit complete, gap analysis done)

---

## TURN TRACKER

```
Current state: PARALLEL LANES
  Claude — Phase 1A audit complete, ready for email entity panel polish
  Codex  — Running holistic consolidation audit in refactor/service-layer
  
Next: Codex commits clean, Claude merges, then email entity panel polish begins
```

---

## CURRENT COMMITS

```
origin/development           → c13121aee  (Railway GREEN ✅)
origin/refactor/service-layer → 4b2aea548  (Codex parallel lane)
```

Boot test before any push to development:
```bash
export DATABASE_URL="postgresql://postgres:MmUbhSxdkRGFLhBGGXGaWQeBceaqNmlj@metro.proxy.rlwy.net:40051/railway"
export SESSION_SECRET="coaileague-dev-test-session-secret-32chars"
node build.mjs && node dist/index.js > /tmp/boot.txt 2>&1 &
sleep 18 && curl -s http://localhost:5000/api/workspace/health  # → {"message":"Unauthorized"}
grep -cE "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot.txt  # → 0
kill %1
```

---

## PLATFORM STATUS — VERIFIED CLEAN

**62/62 features from features page verified present in codebase.**
**No feature was removed during audit phases A-I or Phase 0 registry consolidation.**

Registry: 143 handlers, 137 Trinity-visible, 0 duplicates, well under 300 cap.
Log fixes: 0 thought recording errors, 0 billing canary false positives.
All audit hardening (A-I): deployed and stable.

---

## PHASE 1A — AUDIT RESULTS

### Scheduling pipeline: GRADE A ✅
26/27 checks pass. The 1 "fail" was a false positive — state machine uses
`eq(status, "submitted")` conditional WHERE (correct, not `inArray`).

Backend scheduling verified:
- schedulingMath.ts in use (hoursBetween, addHours, OT, haversine GPS) ✅
- Timesheet state transitions atomic with conditional WHERE + 409 on race ✅
- Shift monitoring filters to active workspaces only ✅
- Coverage pipeline workspace-scoped and stoppable ✅
- Orchestrated schedule endpoints workspace-scoped (Phase D fix) ✅
- Trinity action catalog has: fill_open_shifts, generate_schedule, scheduling.* ✅

### Schedule UI: FEATURE-COMPLETE, polish gaps remain
universal-schedule.tsx (3126L) has: drag-drop, week view, shift creation,
OT warning, Trinity auto-fill, bulk publish, templates ✅
schedule-mobile-first.tsx (1377L) exists ✅

Schedule gaps for Phase 1A enhancement:
- Trinity ↔ Schedule data pipeline end-to-end verification
- Shift room auto-creation on schedule publish (ChatDock integration)
- Schedule → Payroll → Invoice smoke test
- Color-coded shift status indicators in grid
- Fast add-shift: client+site+time+officer in <5 taps
- Client transparency mode per shift

### Email UI: INFRASTRUCTURE SOLID, entity panel is the key gap
EmailHubCanvas.tsx (3796L) already has:
- Operational channel folders: calloffs, incidents, support, billing, docs ✅
- Trinity AI panel + automation toggle ✅
- Compose, thread view, sub-address routing ✅

Email gaps (priority order for polish sprint):
1. Entity context panel — MISSING
   When email is opened from Maegan@Statewide: show her client stats,
   open shifts, contract rate, invoiced MTD. The mockup I built shows the vision.
2. Channel tab bar at top — MISSING (operational tabs like Gmail but for ops)
3. Trinity suggested actions per email — MISSING
   (update shift, generate PDF amendment, send confirmation, update invoice)
4. Pre-drafted Trinity reply — MISSING (ready to edit+send in one tap)
5. Action-needed / Urgent / PDF tags on inbox rows — MISSING
6. Smart views: Needs Action, Client Mail — MISSING

### ChatDock: FOUNDATION SOLID, delivery layer is the key gap
ChatDock.tsx exists with: WebSocket, HelpAI, shift rooms, mobile version ✅
Full gap list in memory (Redis pub/sub, durable store, FCM, receipts, etc.)

---

## CODEX PARALLEL LANE — MERGE PROTOCOL

When Codex commits his holistic consolidation/audit work:

1. Codex pushes to refactor/service-layer (NOT development)
2. Claude reviews the diff: `git diff development codex2/sl --name-only`
3. If no conflicts with active email polish work:
   `git checkout development && git checkout codex2/sl -- <files>`
4. Claude builds + boot tests before committing
5. Single merge commit: "merge: Codex holistic consolidation + Claude email polish"

Files Codex should NOT touch (Claude is working on these):
- client/src/components/email/EmailHubCanvas.tsx
- client/src/pages/inbox.tsx
- client/src/components/email/ directory

Files Claude should NOT touch (Codex is auditing these):
- server/routes/domains/ (IRC/RBAC consolidation)
- server/websocket.ts (ChatDock architecture)
- Any server/routes/compliance/ or portal files

---

## ACTIVE WORK — EMAIL ENTITY PANEL (Claude's next task)

The mockup is built. Now wire it into EmailHubCanvas.tsx.

When an email is opened, the right panel shows:
- If sender is a client: open shifts, contract rate, invoiced MTD, officer count
- If sender is an employee: upcoming shifts, timesheet status, certifications
- Trinity suggested actions (context-aware, based on email content)
- Pre-drafted reply from Trinity

API endpoints to call:
- GET /api/clients?email={senderEmail} → client context
- GET /api/employees?email={senderEmail} → employee context
- GET /api/shifts?clientId={id}&status=open → open shifts
- POST /api/ai-brain/chat (Trinity draft reply suggestion)

Implementation approach:
- Add a `senderEntity` state to EmailHubCanvas (client | employee | unknown)
- When email is selected, fetch entity by sender email
- Render entity panel in the existing trinity-panel slot
- Keep existing Trinity AI toggle panel as a tab within the same space

---

## ENHANCEMENT SPRINT DOMAINS (full plan)

### Priority sequence after email entity panel:

**EMAIL** (current)
  [x] Entity context panel
  [ ] Channel tab bar  
  [ ] Trinity suggested actions
  [ ] Pre-drafted replies
  [ ] Tags on inbox rows
  [ ] Smart views

**SCHEDULE Phase 1A**
  [ ] Trinity ↔ schedule pipeline E2E verification
  [ ] Shift room auto-creation on publish
  [ ] Color-coded shift status indicators
  [ ] Fast add-shift modal

**CHATDOCK** (after schedule)
  [ ] Redis pub/sub foundation
  [ ] Durable message store
  [ ] FCM + 4-tier delivery
  [ ] Read receipts, replies, reactions
  [ ] Content moderation + legal hold

**PORTALS** (parallel to above)
  [ ] Workspace dashboard Grade A
  [ ] Client portal read-only surface
  [ ] Auditor portal PDF reports

**HOLISTIC UX**
  [ ] All action buttons verified
  [ ] Forms mobile-optimized
  [ ] UI toast polish
  [ ] Seasonal theming restored

**TRINITY BRAIN**
  [ ] Triad genuine reasoning
  [ ] Proactive operating behavior

---

## STANDARD: NO BANDAIDS

```
No raw money math — FinancialCalculator.
No raw scheduling hour math — schedulingMath.ts.
No workspace IDOR.
No state transitions without expected-status guard.
Trinity = one individual, no mode switching.
HelpAI = only bot field workers see.
One domain, one complete sweep, one coherent commit.
No duplicate UI services — edit what exists, don't create parallel versions.
```
