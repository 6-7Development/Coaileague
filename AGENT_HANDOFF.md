# COAILEAGUE — MASTER HANDOFF
# ONE FILE. Update in place. Never create new handoff files.
# Last updated: 2026-04-28 — Claude (log fixes + enhancement sprint plan)

---

## THREE-AGENT RELAY PROTOCOL

```
CLAUDE   → implementation lead on development (audits + executes + boot-tests)
COPILOT  → acceleration only (Zod, test scaffolds, repeated patterns)
CODEX    → verification + hardening lead (verifies, strengthens, decides phases)
```

Whole-domain = routes, services, jobs, workers, queues, automations, webhooks,
storage, events, migrations, tests, validation, user-facing paths.
One domain, one complete sweep, one coherent commit.

---

## TURN TRACKER

```
Current turn: CODEX
  → Phase 0 (CRITICAL FIRST): Action registry consolidation
    900 actions → target <300. Audit, merge, deprecate, remove duplicates.
    Document every removed/merged action with reason.
  → Then verify log fixes (af832ce21)
  → Then plan Phase 1 execution or hand back to Claude
```

---

## CURRENT COMMIT STATE

```
origin/development           → af832ce21  (Railway GREEN ✅ — log fixes deployed)
origin/refactor/service-layer → 84859ce58  (synced)
```

---

## RECENT FIX — LOG ERRORS (af832ce21)

Root cause analysis from Railway production logs (2026-04-28):

**[TrinityThoughtEngine] Failed to record thought: (silent empty message)**
  sessionId is NOT NULL but daemon-triggered thoughts have no active session.
  Fix: fallback sessionId generated (auto-{workspace}-{phase}-{timestamp}).
  Catch degrades gracefully (no throw — thought engine is observability, not ops).
  Error.message + error.code now extracted for readable logs.

**[BILLING_LEAK_CANARY] finalizeBilling NO workspaceId (false positive)**
  Platform startup notification enrichment fires with undefined workspaceId.
  isBillingExcluded() correctly handles it but canary fired before that check.
  Fix: canary only warns when workspaceId !== undefined.

**[AiMetering] record error / [ResolutionFabric] Failed to record outcome (silent)**
  PostgreSQL error objects weren't serializing — all catch blocks now extract
  .message + .code + workspaceId context.

---

## PHASE 0 — ACTION REGISTRY CONSOLIDATION (Codex owns)

**Why this is critical:**
- 900 registered actions vs <300 architectural cap (3× over limit)
- Trinity's action dispatcher scans the full registry on every request
- Duplicate action IDs silently discarded (assertRegistryInvariants warns at boot)
- Some actions registered in 5+ places under different names for the same operation
- Before enhancement sprint starts, the registry must be clean

**Codex process:**
1. Run assertRegistryInvariants() output — list all 900 action IDs
2. Group by domain prefix (scheduling.*, payroll.*, compliance.*, etc.)
3. For each group: identify duplicates, stale/unused, and consolidation candidates
4. Remove or merge into canonical IDs (update all callers)
5. Target: <300 total, no duplicates, every action has a clear owner
6. Document every removal in handoff with reason

**Expected consolidation areas (from audit observations):**
- Trinity intelligence layers registered 33 actions — many overlap with Core Subagent actions
- Document orchestration: 7 actions, some overlap with compliance domain
- QB Management: 5 actions that partially overlap with integration brain's 18
- Scheduling: autonomous scheduling (6) + Trinity Schedule (24) + L1 Cognition (7) = overlap
- Payroll: L2 Math Engine (7) + Core Subagent payroll (3) + Timesheet Cycle (17) = overlap
- Analytics: 9 BI + Analytics Snapshot (13) = heavy overlap
- UI Control Subagent: 11 DISABLED — remove entirely
- HRIS actions: duplicated across multiple registration sites

---

## ENHANCEMENT SPRINT — FULL DOMAIN MAP

After Phase 0 registry consolidation, the enhancement sprint proceeds by domain.
Each domain follows the same whole-domain definition (routes+services+jobs+tests).

---

### DOMAIN 1 — SCHEDULING UI/UX + AUTOMATION PIPELINE
*Codex's suggested first track — scheduling is the front door to everything else*

**Why first:** Schedule data feeds payroll, invoicing, client billing, Trinity automation,
time tracking, compliance, and ChatDock shift rooms. If scheduling is broken or
unintuitive, every downstream system suffers.

**Phase 1A — Desktop Schedule Board**
- Drag-and-drop shift board with Sling/When I Work parity
- Week/day/month views with visual shift status indicators
- Fast add-shift modal (client, site, time, officer in <5 taps)
- Shift template application with one click
- Bulk publish flow — manager reviews, Trinity flags issues, one confirm
- Conflict indicators: overlapping shifts, uncertified officers, overtime warnings
- Open shift board with color-coded urgency (unfilled → Trinity auto-fill active)

**Phase 1B — Mobile Scheduling**
- Officer-facing: see my schedule, request time off, accept/decline shift offers
- Manager-facing: approve timesheets, view coverage gaps, send shift offers
- Touch-optimized (no drag-drop — tap to select, swipe to action)
- Offline-capable: schedule visible without connection, sync on reconnect

**Phase 1C — Trinity ↔ Schedule Pipeline**
- Verify Trinity can read, create, modify, and publish shifts end-to-end
- Auto-fill logic: Trinity generates candidate list → manager approves → schedule updates
- Scheduling decisions feed payroll correctly (hours, OT, rates)
- Schedule changes propagate to: invoicing, ChatDock shift rooms, time tracking
- Shift room auto-creation on publish, auto-archive on completion
- Trinity scheduling actions verified against <300 consolidated registry

**Phase 1D — Schedule → Payroll → Invoice Pipeline**
- Verify the full chain: published schedule → approved timesheet → payroll run → client invoice
- Confirm FinancialCalculator used throughout (no raw math)
- Verify client billing rates match contract rates
- End-to-end smoke test: create shift → complete shift → approve timesheet → run payroll → generate invoice

---

### DOMAIN 2 — CHATDOCK FOUNDATION + FEATURES
*Full TODO list from memory + conversations*

**Phase 2A — Reliability Foundation (do first — everything else depends on this)**
- Redis pub/sub under broadcastToWorkspace for multi-replica Railway deployment
- Durable message store with per-room sequence numbers (replaces 5-min in-memory buffer)
- FCM push notifications for offline workers (firebase-admin)
- Four-tier delivery pyramid: WebSocket → FCM → RCS → SMS (Twilio fallback)
- Begin Twilio RCS brand verification onboarding (1-3 week calendar lead time)
- Typed WebSocket event protocol:
  ai_message_start, ai_token (batched 30-60ms), ai_tool_call,
  ai_tool_result, ai_message_end, ai_error
- Run AI streams through Redis Streams for device-switching mid-response

**Phase 2B — Architecture Simplification**
- IRC mode system removed from user layer (internal routing stays)
- Three room types only: Shift Room, Team Channel, Direct Message
- HelpAI = only bot field workers see (no bot confusion)
- Shift room: auto-created on shift publish, auto-archived on shift end
- Client transparency mode per account (read-only observer vs reports-only)
- Client portal: separate read-only surface (officer status, incidents, end-of-shift)

**Phase 2C — WhatsApp + Messenger Feature Parity**
- Read receipts: sent → delivered → read (Messenger-style profile pic indicators)
- Message replies with quoted preview (threaded context)
- Reactions/emoji picker (quick-row: 6 most used per workspace + full picker)
- Practical acknowledgments: Seen, Acknowledged, Reviewed
- Polls (HelpAI drops coverage polls for scheduling)
- Pinned messages — multiple pins, HelpAI auto-pins post orders at shift start
- Acknowledgment receipts on post orders (required before clock-in on some sites)
- Shared media gallery per room (proof-of-service photos, incident images)
- Message edit + soft delete (original preserved for compliance)
- Per-conversation notification control
- Full-text search scoped by workspace/room/date/officer
- Auto-archive shift rooms on shift end
- Shift room summary card auto-generated at close (officer, site, hours, incidents)
- Informative empty state: shift details + HelpAI greeting when room opens
- Messenger-style read receipts showing last reader profile pics
- Virtual scrolling for performance on long shift history

**Phase 2D — Safety + Compliance Layer**
- OpenAI moderation API on every message (first-pass classifier)
- Report system: user selects category, captures flagged msg + 10-msg context
- Management report queue with severity triage
- Legal hold: locks conversation on escalation (no edits/deletes, even by admins)
- Evidence export: PDF with chain-of-custody metadata + raw JSON for forensics
- Cryptographic hash of conversation at time of escalation
- Auto-write to employee HR record on manager action
- Trinity flags patterns across conversations (silent monitor, never unilateral)

**Phase 2E — HelpAI + Shift Room Enhancements**
- Presence tied to shift status (on-shift/connected, on-shift/offline, off-shift, NCNS)
- HelpAI scheduled messages: 30min before shift, end-of-shift, no-clockout alert
- HelpAI drops coverage polls when open shifts need filling
- Live call/radio button in shift rooms (WebRTC already wired — officers use like radio)
- Async voice messages: Opus recording → presigned upload → audio player in chat
- Whisper/Deepgram transcription for Trinity context from voice
- Push-to-talk as fast follow if field ops need live group comms

**Phase 2F — Mobile Offline-First**
- op-sqlite local store, optimistic sends, NetInfo-driven sync
- Messages send optimistically, sync on reconnect
- Background sync for offline workers returning to connectivity

**SKIP (confirmed):** stickers, games, themes, chat color customization, word effects,
consumer gimmicks. Keep: emoji reactions, emoticons, picker, Seen/Acknowledged/Reviewed,
curated professional reaction set for client-visible rooms.

---

### DOMAIN 3 — EMAIL + COMMUNICATIONS
*Every enhancement vs Gmail with AI intelligence*

**Phase 3A — Email Infrastructure**
- Resend inbound routing: calloffs@, incidents@, docs@, support@ with Trinity auto-processing
- RESEND_WEBHOOK_SECRET confirmed in Railway prod (known 401 issue — verify fixed)
- Dedicated inbound addresses with Trinity auto-routing per channel
- CAN-SPAM compliance verified on all outgoing emails
- Bounce handling: message-ID scoped (Phase G fix), suppression list managed
- Email threading: replies link to original conversation in audit trail
- Attachment handling: virus scan → vault storage → link in email body

**Phase 3B — AI-Enhanced Email**
- Trinity drafts emails on manager request (shift reports, client updates, compliance notices)
- Smart reply suggestions on inbound emails (HelpAI surfaces options, manager approves)
- Auto-categorization of inbound: calloff requests, incident reports, client complaints
- Priority inbox: Trinity flags urgent inbound before manager opens dashboard
- Scheduled send with smart timing (don't notify officers at 3am for non-urgent)
- Email digest: Trinity summarizes overnight activity for morning manager briefing

**Phase 3C — Communication Channel Unification**
- Single notification center: email, SMS, RCS, in-app, push all visible in one place
- Delivery confirmation per channel visible to sender
- Worker communication preferences (channel priority, quiet hours, STOP compliance)
- Manager broadcast: write once, deliver via best available channel per worker
- Trinity AI-to-SMS escalation chain fully wired (requireAck → FCM → RCS → SMS)

---

### DOMAIN 4 — PDF GENERATION + DOCUMENTS
*Working with workflows, pipelines, automations*

**Phase 4A — Core PDF Quality**
- Every generated document: real branded PDF with header, footer, page numbers, doc ID
- Saved to tenant vault (already fixed in Phase E — verify in production)
- stampBrandedFrame using pdf-lib overlay (Phase E fix — verify output quality)
- Document download links work and expire correctly

**Phase 4B — Payroll Documents**
- Pay stubs: gross/net/deductions/YTD, direct deposit confirmation
- Payroll summary report
- W-2, 1099-NEC, 1099-MISC generation pipeline
- 941 quarterly filing report
- 940 annual FUTA report
- All use FinancialCalculator (no raw math — already Phase B audited)
- Verify PDF generation pipeline end-to-end: payroll run → PDF → vault → email to employee

**Phase 4C — HR Documents**
- Employment verification / proof of employment
- Contractor records and agreements
- Disciplinary notices
- Training certificates
- Drug test results
- I-9 completion flow (Phase E fix — verify chain)
- DocuSign-equivalent e-signature pipeline: send → sign → vault

**Phase 4D — Operations Documents**
- Incident reports (auto-generated from shift room incidents)
- Work orders
- Compliance certificates and license exports
- Client contracts and proposals
- Proof-of-service reports (GPS-stamped, officer-signed)
- End-of-shift summary PDFs (generated by HelpAI at shift close)

**Phase 4E — Compliance Reports (E-P0-2 and E-P1-5 — queued)**
- Compliance report endpoints return real PDFs (currently placeholder JSON)
- Compliance document intake routes uploads through vault service atomically
- Regulatory auditor portal: read-only, Grade A, complete audit trail

---

### DOMAIN 5 — BILLING + SUBSCRIPTIONS
*Subscriptions, payments, client invoicing, payroll ACH*

**Phase 5A — Subscription Billing**
- Stripe subscription lifecycle: trial → active → past_due → cancelled
- Upgrade/downgrade plan flow with proration
- Billing portal: manager sees invoices, payment method, plan details
- Failed payment recovery: email → SMS → grace period → suspend
- Credits system: credit balance visible, spend tracked per AI feature
- Usage dashboard: token spend by feature, workspace, and time period

**Phase 5B — Client Invoicing**
- Client invoice auto-generation from approved timesheets + contract rates
- Invoice approval workflow: Trinity generates → manager reviews → send to client
- Payment tracking: outstanding, overdue, collected
- Collections intelligence: Trinity flags overdue, suggests escalation
- QuickBooks sync verified (Phase G fixes in production)
- Invoice PDF: professional branded, itemized, ACH payment instructions

**Phase 5C — Payroll ACH**
- Plaid direct deposit: employee links bank account → payroll run → ACH transfer
- Idempotency on ACH transfers (Phase G fix — verify in production)
- Pre-transfer balance validation
- Transfer status tracking: initiated → pending → settled → failed
- Failed transfer recovery notification chain
- Pay stub generation and vault storage before ACH initiation

**Phase 5D — Financial Reporting**
- P&L report using FinancialCalculator (Phase B fix — verify output)
- Labor cost analysis per client, site, and time period
- Margin analysis: revenue vs labor vs overhead
- Cash flow intelligence: Trinity flags receivables risk
- Budget vs actual variance (AI-generated narrative)

---

### DOMAIN 6 — PORTALS + DASHBOARDS
*Auditor portal, client portal, workspace dashboards — Grade A uniformity*

**Phase 6A — Workspace Dashboard**
- Single-pane view: staffing status, open shifts, pending approvals, recent incidents
- Real-time data via WebSocket (no page refresh needed)
- Trinity insights panel: what needs attention right now
- Quick actions: approve timesheet, fill open shift, send broadcast
- Mobile-responsive layout

**Phase 6B — Client Portal**
- Read-only surface: officer check-in status, active shifts, incidents filed
- End-of-shift reports auto-delivered
- Service level metrics: coverage rate, on-time arrival, incident rate
- Document access: contracts, proof-of-service, compliance certificates
- Direct message to shift supervisor (routes to HelpAI)
- Client transparency mode per account (configured by workspace owner)

**Phase 6C — Regulatory Auditor Portal**
- Read-only, fully gated (requireAuditorPortalAuth — Phase E fix verified)
- License and certification tracking with expiry alerts
- Incident report access for auditor's assigned workspaces
- Audit trail export: timestamped, cryptographically signed
- Regulator-facing report generation (PDF, not JSON — Phase E fix)

**Phase 6D — Platform Admin Dashboard**
- Tenant health at a glance: active workspaces, revenue, AI spend
- Service health: all daemon statuses, DB circuit breaker, Redis status
- Action registry health: <300 actions, no duplicates (Phase 0 fix visible here)
- Support queue: open tickets, SLA status
- Billing health: subscriptions, failed payments, churn risk

---

### DOMAIN 7 — HOLISTIC UX AUDIT
*Login/logout/session, every button/icon, forms, uniformity*

**Phase 7A — Auth Flows**
- Login: remember me, MFA, SSO paths
- Logout: session destroy + cookie clear (Phase A fix — verify clean)
- Session persistence: refresh token rotation, idle timeout behavior
- Password reset: email link → one-time token → new password
- Social auth: Google, Microsoft OAuth flows
- Workspace switching: clean context transition, no data bleed

**Phase 7B — Every Action Button/Icon**
Systematic sweep: every button and icon that triggers an action must:
- Produce the correct intended outcome
- Show loading state during processing
- Handle error gracefully with user-facing message
- Be disabled when not applicable (not just hidden)
- Have correct RBAC — disabled/hidden for unauthorized roles

Priority workflow buttons:
- Clock in/out → GPS validated → timesheet entry
- Publish schedule → Trinity validation → shift rooms created
- Approve timesheet → payroll eligibility updated
- Run payroll → ACH transfers initiated
- Send invoice → client notified → QuickBooks synced
- File incident → HR record updated → manager alerted

**Phase 7C — Online Forms**
- Employee onboarding: personal info, I-9, direct deposit, emergency contacts
- Client intake: contract details, site info, post orders, billing rates
- Incident report form: standardized fields, photo upload, GPS location
- Drug test result entry: date, result, provider, certificate upload
- Training completion form: module, score, certificate
- All forms: Zod-validated (Phase B sweep — verify completeness)
- All forms: save draft, resume later
- All forms: mobile-optimized

**Phase 7D — UI Polish**
- Update notification toast: Vivaldi-style minimal (icon + version + arrow)
  Non-blocking, dismissible, bottom or top of screen
- Modal/dialog system: consistent open/close animations, keyboard navigation
- Toast/notification system: severity-coded, auto-dismiss, action buttons
- Loading states: skeleton screens (not spinners for content-heavy views)
- Empty states: contextual, with clear action (not just "no data")
- Error states: user-friendly message + retry option
- Seasonal/holiday theming restored on public pages (SnowfallEngine removed in Phase 3)

---

### DOMAIN 8 — TRINITY BIOLOGICAL BRAIN
*Gemini + Claude + GPT triad: genuine reasoning, not just routing*

**Phase 8A — Triad Wiring Enhancement**
- Three agents genuinely inform each other's reasoning before Trinity speaks
- Not just: "route to Gemini" or "route to GPT" based on feature key
- Pattern: Gemini proposes → Claude reasons → GPT synthesizes → Trinity speaks
- Implement token-efficient cross-agent consultation for high-stakes decisions
- Research: best-in-class multi-agent reasoning patterns (2025-2026)

**Phase 8B — Trinity Personality + Consciousness**
- Trinity is ONE unified individual (no mode switching — Phase D fix)
- Proactive operating behavior: Trinity surfaces issues before asked
- Contextual depth: she reads workspace history and knows the operation
- Biological clock: Trinity's 2am dream state (hebbianLearningService already exists)
- Calibrated response depth: field question vs strategic question vs compliance question

**Phase 8C — HelpAI Field Supervisor**
- HelpAI's own action set scoped to field operations (not Trinity's full registry)
- Field supervisor personality: direct, calm, solution-focused
- Escalation to Trinity: invisible to workers (HelpAI says "let me check" and returns)
- Context continuity: HelpAI knows the shift history when Trinity escalates back

---

## PHASE 0 DETAIL — CODEX ACTION REGISTRY CONSOLIDATION

This is the highest-priority item before enhancement sprint begins.

**Files to audit:**
```
server/services/helpai/platformActionHub.ts   (ACTION_REGISTRY — the source of truth)
server/services/ai-brain/actionRegistry.ts
server/services/ai-brain/*.ts                 (all registration sites)
server/index.ts                               (startup registration calls)
```

**Process:**
1. Extract all action IDs at startup: `helpaiOrchestrator.getRegisteredActions().map(a => a.actionId)`
2. Group by domain prefix
3. For each group find: exact duplicates, functional duplicates, disabled/dead actions
4. Canonical action IDs follow pattern: `domain.verb_noun` (e.g., `payroll.run_payroll`)
5. Callers updated to use canonical ID
6. Test: every removed action has no callers
7. Final count must be <300

**Expected impact:**
- Faster action dispatch (linear scan gets faster)
- No duplicate registration warnings at boot
- Cleaner `DomainHealth` report (4/15 → >10/15 domains healthy)
- Easier maintenance: one canonical place per action

---

## STANDARD: NO BANDAIDS

```
No raw money math — FinancialCalculator only.
No raw scheduling hour math — schedulingMath.ts only.
No workspace IDOR — every tenant query scoped by workspaceId.
No state transitions without expected-status WHERE guard.
No user-facing legacy branding.
Every generated document = real branded PDF in tenant vault.
Trinity = one individual, no mode switching.
HelpAI = the only bot field workers see.
One domain, one complete sweep, one coherent commit.
Jobs/workers/queues are part of every domain.
```
