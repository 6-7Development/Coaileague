# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Codex (Phase F audit complete, Claude executes next)

---

## TURN TRACKER

```text
Current turn: CLAUDE <- execute Phase F notification/broadcasting fixes on development.
Codex Phase F audit is complete on refactor/service-layer. Branch is clean and ready.
```

---

## BRANCH RULES

```text
Codex audits on refactor/service-layer.
Claude executes on development.
After Claude executes, sync development -> refactor/service-layer.
Never merge refactor/service-layer -> development.
```

---

## CURRENT COMMIT

```text
origin/development        -> 3fca1f009  (Railway STABLE GREEN ✅)
origin/refactor/service-layer -> Codex Phase F audit commit (see git log)
```

Boot test before any push to development:
```bash
export DATABASE_URL="postgresql://postgres:MmUbhSxdkRGFLhBGGXGaWQeBceaqNmlj@metro.proxy.rlwy.net:40051/railway"
export SESSION_SECRET="coaileague-dev-test-session-secret-32chars"
node build.mjs && node dist/index.js > /tmp/boot.txt 2>&1 &
sleep 18 && curl -s http://localhost:5000/api/workspace/health   # -> {"message":"Unauthorized"}
grep -cE "ReferenceError|is not defined|CRITICAL.*Failed" /tmp/boot.txt  # -> 0
kill %1
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor:   ✅ complete (~97k lines removed)
Phase A auth/session:         ✅ complete
Phase B financial flows:      ✅ complete
Phase C scheduling/shift:     ✅ complete (Grade A)
Phase D Trinity action flows: ✅ complete (all residuals closed)
Phase E documents/compliance: ✅ deployed — key fixes in, 2 items queued (see below)
Phase F notifications:        🔎 audited by Codex — Claude executes findings below
Phase G integrations (QB/Stripe/Plaid): queued
```

---

## WHAT CLAUDE DID LAST TURN (Phase D residuals + Phase E)

### Phase D residuals — all closed

- D-P0-1: `legal_advice` added to `ViolationType` + severity + refusal response
  Was a TypeScript build blocker — ViolationType is a discriminated union
- D-P1-1: Control console fully tenant-scoped
  /timeline and /actions now derive workspaceId from auth context
  getRecentThoughts/getRecentActions throw when called without workspaceId
  getSessionTimeline signature updated to require workspaceId
- D-P1-2: `assertRegistryInvariants()` called at startup after action modules init
- D-P1-3: `employees.status` field now checked alongside `isActive`
  Blocks terminated/inactive/deactivated/suspended even with stale isActive=true
- D-P2-1: support_agent/support_manager → owner trust tier in Trinity chat
  isSupportMode flag set for privacy rule separation

### Phase E — 6 fixes deployed

- E-P0-1: `stampBrandedFrame` rewrote with pdf-lib `drawPage()` overlay
  Was returning branded empty shell; now preserves all original PDF pages
- E-P0-3: Document signing hardened
  /sign requires pending orgDocumentSignatures row for that signer+doc+ws
  Uses UPDATE not INSERT — updates pending row in place inside db.transaction()
  /signatures: workspace scoped via document ownership check
- E-P0-4: /complete-report gated with requireAuditorPortalAuth + workspace binding
- E-P1-1: HR doc request state machine
  Manager required for 'expired'; conditional WHERE with inArray(); 409 on race
- E-P1-2: Compliance evidence — requireManager on pending/verify/reject + Zod on submit
- E-P1-3: senderId → senderUserId (2 occurrences) + Zod on recipients

### Phase E — 2 items queued (larger refactors)

- E-P0-2: Compliance reports still return placeholder JSON, not real PDF
  Needs full compliance report service: gather data → render PDF → saveToVault()
- E-P1-5: Compliance document intake doesn't route uploads through vault service
  Needs document intake service: validate → persist binary → hash → create rows atomically

### Auditor portal policy decision needed from Bryan

/dashboard/:workspaceId/report POST has requireAuditorPortalAuth.
Question: should auditor portal be strictly read-only (remove this POST)?
Or are auditor report uploads a supported feature (keep it, already gated)?
Bryan decides — Claude will execute either way.

---

## PHASE F — CODEX AUDIT FINDINGS (CLAUDE EXECUTE)

**Notifications and broadcasting layer**

Actual file map:
```
server/routes/notificationRoutes.ts          -> actual: server/routes/notifications.ts
server/routes/webhookRoutes.ts               -> outbound tenant webhooks; Resend actual: server/routes/resendWebhooks.ts
server/services/twilioService.ts             -> actual: server/services/smsService.ts
server/services/resend/                      -> no folder found; Resend webhook code is route-local
```

### F-P0-1 — SMS delivery is both unreliable and consent/audit unsafe

Files:
- `server/services/notificationDeliveryService.ts:523-533`
- `server/services/smsService.ts:299-365`, `server/services/smsService.ts:367-472`
- `server/routes/smsRoutes.ts:38-99`, `server/routes/smsRoutes.ts:106-147`, `server/routes/smsRoutes.ts:149-231`, `server/routes/smsRoutes.ts:233-260`

Evidence:
- NDS `deliverSMS()` calls low-level `sendSMS({ to, body, workspaceId, type })` directly at `notificationDeliveryService.ts:533`.
- Low-level `sendSMS()` does not call `checkSmsConsent()` and does not write `smsAttemptLog`; consent/logging only exist in `sendSMSToUser()` / `sendSMSToEmployee()`.
- SMS routes pass `employeeId` as `recipientUserId` (`smsRoutes.ts:68`, `135`, `174`, `219`) but NDS preferences expect a user id, and the employee routes do not include a phone in the body. Those sends can fail with "No recipient phone" or bypass the correct user's preferences.
- `/invoice-reminder` uses arbitrary `clientPhone` as `recipientUserId` and falls back to `workspaceId: 'system'` (`smsRoutes.ts:252-253`).

Fix:
- Make low-level `sendSMS()` private/internal or require an explicit internal `consentVerified` flag.
- Add an NDS SMS helper that resolves `recipientUserId -> user phone` and `employeeId -> employee phone/userId` inside the workspace, then calls the consent/log path.
- Update all SMS routes to Zod-validate input, verify employee/client belongs to `workspaceId`, pass real `userId` plus phone/body, and add rate limiting for direct/bulk SMS.
- Direct phone sends should require explicit consent record unless a narrow emergency/legal exception is hardcoded and audited.

### F-P0-2 — Panic alert chain is not the required push-first fallback chain and can be suppressed

Files:
- `server/services/ops/panicAlertService.ts:153-185`, `246-306`
- `server/services/notificationPreferenceService.ts:20-30`, `168-185`
- `server/services/notificationDeliveryService.ts:120-127`, `639-668`

Evidence:
- `panicAlertService.notifyEmergencyContacts()` sends only SMS through NDS using type `incident_alert` (`panicAlertService.ts:286-293`), while the required chain is Trinity/event -> broadcast -> manager push -> SMS fallback.
- `notificationPreferenceService` critical set includes `duress_alert` but not `panic_alert` or `incident_alert`; `shouldDeliver()` checks channel opt-outs before quiet-hour logic, so a manager can suppress panic SMS by SMS preference or quiet hours.
- NDS critical set has `panic_alert` only via `@ts-expect-error` and not `incident_alert`; `processWebSocketAcks()` only queues fallback for types in that critical set.

Fix:
- Canonicalize panic delivery type to `panic_alert` end-to-end. Keep legacy `incident_alert` mapped as critical until callers are migrated.
- Critical safety alerts must bypass quiet hours and user channel opt-outs, while still honoring legal STOP/consent requirements for SMS.
- Implement the chain explicitly: create manager in-app records, push delivery with ack tracking, then SMS fallback for unacked critical push/WS after the configured window.
- Add tests for disabled SMS preference, quiet hours, no push subscription, and unacked WS/push fallback.

### F-P0-3 — NDS idempotency can duplicate sends under concurrent retries

File:
- `server/services/notificationDeliveryService.ts:249-326`, `340-360`

Evidence:
- Default idempotency key includes `Date.now()` (`:249-250`), so callers without a stable key are not truly idempotent.
- Insert path uses `onConflictDoUpdate(... set status='pending')` (`:322-324`), which can reset a sent or sending delivery back to pending when the same idempotency key races.
- `attemptDelivery()` selects then updates status to `sending` without an expected-status guard in the `WHERE` (`:355-357`), so two workers can both claim and send the same pending row.

Fix:
- For explicit keys, use `onConflictDoNothing()` then select the existing row; never reset sent/sending rows to pending.
- Claim with one conditional update: `UPDATE ... SET status='sending' WHERE id=? AND status IN ('pending','retrying') RETURNING *`.
- Only the returned claimant may deliver. Others should return the existing delivery id/status.
- Require stable idempotency keys from high-volume callers; keep digest dedupe as a safety net, not the main guarantee.

### F-P1-1 — Panic alert state transitions lack expected-status guards

File:
- `server/services/ops/panicAlertService.ts:191-241`, `333-367`

Evidence:
- `acknowledgeAlert()` updates by `id + workspaceId` only, without `status='active'`, then fetches by `id` only.
- `resolveAlert()` updates by `id + workspaceId` only, without expected status (`active` or `acknowledged`), then fetches by `id` only.
- `listAlerts()` appends raw `LIMIT ${limit}` from action payload (`:236-241`, `:340-341`).

Fix:
- Use conditional `UPDATE ... WHERE id=? AND workspaceId=? AND status IN (...) RETURNING *`; return 404/409 when no row changes.
- Select returned row instead of re-querying by `id`.
- Clamp/parse limit and parameterize it.

### F-P1-2 — Push delivery is not tenant-scoped and can be marked sent when no device was reached

Files:
- `server/services/universalNotificationEngine.ts:29-40`, `491-496`, `575-580`, `652-657`
- `server/services/pushNotificationService.ts:142-214`

Evidence:
- `deliverPushNotification()` defaults workspace to `'system'` when options omit workspaceId (`universalNotificationEngine.ts:40`).
- Main send, role send, and broadcast send call `deliverPushNotification()` without passing `workspaceId`, so NDS push rows are stored as `'system'`.
- `pushNotificationService` child delivery rows use `payload.data?.workspaceId || 'unknown'` (`pushNotificationService.ts:190`, `214`).
- `sendPushToUser()` returns `sent: 0, failed: 0` when the user has no active subscription; NDS sees no exception and can mark push as sent.

Fix:
- Pass `workspaceId: payload.workspaceId` into every `deliverPushNotification()` call and include workspaceId in push payload data.
- Add explicit statuses for `no_subscription` / `skipped_no_device`; for critical alerts this should trigger fallback, not count as delivered.
- Add employee `status` filtering alongside `isActive` in role/broadcast target lookups (`universalNotificationEngine.ts:520-521`, `602-603`, `722-724`) to avoid sending to terminated/suspended users with stale `isActive=true`.

### F-P1-3 — Notification routes allow cross-user ack/manual sends and fake workflow completion

Files:
- `server/routes/notifications.ts:489-526`
- `server/routes/notifications.ts:1011-1012` + `server/storage.ts:8177-8184`
- `server/routes/notifications.ts:1043-1144`
- `server/routes/notifications.ts:1646-1673`

Evidence:
- `/api/notifications/ack/:id` calls `NotificationDeliveryService.acknowledge(id)` without checking delivery recipient/workspace; any authenticated user who knows a UUID can mark another user's websocket delivery delivered and suppress fallback.
- `/api/notifications/send` is authenticated only; no manager/support gate, no Zod enum validation, no recipient workspace check, and can send arbitrary channel/body to arbitrary user id.
- Delete fallback calls `storage.deletePlatformUpdate(id)` when user notification delete fails; storage deletes platform update by id only, including all view rows, with no user/workspace guard.
- Notification action endpoint returns success messages like "Fix applied" and "Payment processed" after only marking the notification read/acknowledged.
- `clear-tab` accepts `workspaceId` from query/body before deriving it from auth.

Fix:
- Ack service must require `recipientUserId + workspaceId + id` and only ack websocket deliveries for the current user.
- Restrict manual send to support/root/admin or remove from production; Zod-validate type/channel/body; verify recipient belongs to workspace.
- Never hard-delete platform updates from a user notification endpoint. Use per-user viewed/cleared records or platform-admin-only deletion with workspace scope.
- Replace fake action results with typed handlers or return a neutral "opened/acknowledged" result plus redirect/action URL.
- Derive workspace from auth or validate requested workspace membership/support authorization.

### F-P1-4 — Broadcast target/read/update paths have workspace and state-machine gaps

Files:
- `server/routes/broadcasts.ts:352-417`, `439-505`
- `server/services/broadcastService.ts:109-176`, `223-241`, `307-327`, `340-399`, `551-590`, `693-716`
- `server/services/staffingBroadcastService.ts:156-216`, `228-271`, `298-506`, `626-680`

Evidence:
- `GET /api/broadcasts/:id`, stats, update, and delete fetch/update by broadcast id without verifying it belongs to the current workspace (`broadcasts.ts:352-417`; service methods `:551-590`, `:693-716`).
- Target resolution for team/department/site/site_shift does not require workspace ownership of the target id (`broadcastService.ts:223-241`, `307-327`).
- `deliverBroadcast()` creates notification rows and broadcast recipient rows one-by-one outside a transaction; partial delivery records are possible (`:109-176`).
- `staffingBroadcastService.acceptShiftToken()` marks a token accepted and deactivates the broadcast in separate unguarded updates; simultaneous token clicks can both succeed (`:228-271`).
- Call-off sequence vacates a shift, inserts coverage, logs audit, sends emails, and creates replacement broadcast as separate operations, not one atomic DB state transition (`:298-506`).

Fix:
- Add workspace-scoped service methods: get/update/delete/stats/feedback by `broadcastId + workspaceId` unless root/platform admin.
- Target resolvers must validate team/department/site/shift belongs to the same workspace before resolving recipients.
- Wrap DB mutations for broadcast creation/delivery recipient rows and call-off state changes in `db.transaction()`. Keep external email/SMS sending after commit or via outbox.
- Token accept needs a single transaction/conditional guard: claim broadcast only when `isActive=true`, update one recipient when `actionTakenAt IS NULL`, deactivate the broadcast, and return 409/already-taken if any guard fails.

### F-P1-5 — Resend verifier shape is good, but bounce/complaint status sync can cross tenants

File:
- `server/routes/resendWebhooks.ts:116-260`, `493-515`, `598-731`

Evidence:
- Good: outbound and inbound Resend handlers verify Svix signatures, trim `RESEND_WEBHOOK_SECRET`, fail closed without secret, check timestamp replay window, and use raw body.
- Open item remains live verification: code looks correct, but Railway/Resend 401 cannot be proven from local audit. Verify with a real signed Resend test after Claude's fixes deploy.
- Bounce/complaint handling updates `notificationDeliveries` by recipient email across all workspaces (`:632-657`, `:704-729`). If the same address exists in multiple tenants, one bounce/complaint can mark unrelated tenant delivery rows failed.

Fix:
- Store and use Resend message id or event id on the NDS/email delivery row, then update only the matching delivery.
- If global suppression is intentional, keep the suppression record global, but delivery status history must remain tied to the actual workspace/message.
- Add a small Railway verification step for `/api/webhooks/resend` and `/api/webhooks/resend/inbound` with Resend's signed payloads.

### F-P2 — PASS notes / lower-risk cleanup

- `server/services/platformEventBus.ts`: subscriber errors are isolated. Publish uses non-blocking store, `Promise.allSettled()` for subscribers, retry/dead-letter, and audit logging catches failures. No Phase F blocker found.
- `server/services/emailService.ts`: tenant hooks exist (`sendCustomEmail(..., workspaceId?, userId?)` at `emailService.ts:1256-1271`), but NDS currently fails to pass workspace/user (`notificationDeliveryService.ts:481`). Fix caller first; then consider requiring workspaceId for tenant notification email types.
- `server/routes/webhookRoutes.ts`: outbound tenant webhook CRUD/test/delivery/retry is workspace-scoped in the audited paths. No Phase F blocker found.

### Phase F validation Claude should run

1. Typecheck/build.
2. Boot test from this handoff before pushing to development.
3. Add targeted tests for NDS duplicate idempotency claim, SMS route employee delivery, panic quiet-hour/disabled-channel fallback, notification ack IDOR, and broadcast token double-accept.
4. After Railway deploy, run a signed Resend webhook verification for both outbound and inbound endpoints.

---

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
Every generated document must be a real branded PDF durably saved to tenant vault.
No Trinity action mutation without workspace scope, fail-closed gates, audit trail.
Trinity is one individual. No mode switching. HelpAI is the only bot field workers see.
```

---

## QUEUED — POST-AUDIT PHASES (Pre-Go-Live Enhancement Sprint)

Bryan has locked these as the next phase after all audit phases complete:

### Core Infrastructure
- RBAC + IRC mode consolidation
  RBAC owns permissions. Room type owns behavior. IRC modes = internal routing only.
  server/websocket.ts 8,920L of mode-based branching → room-type + RBAC checks
- Action registry consolidation below 300 (currently ~561 unique IDs, warns at boot)
- E-P0-2: compliance report PDF service (real PDF + vault, not placeholder JSON)
- E-P1-5: compliance document vault intake service

### ChatDock Enhancement Sprint (full list in Claude's memory)
Priority sequence (Codex confirmed correct):
1. Durable message store + Redis pub/sub (foundation — everything else depends on this)
2. FCM push + four-tier delivery pyramid (WS → FCM → RCS → SMS)
3. Typed WebSocket event protocol for Trinity/HelpAI streaming
4. Read receipts + acknowledgment receipts (post orders)
5. Message replies, pins, polls, media gallery, room archive, search
6. Presence tied to shift status (connected/offline/NCNS)
7. HelpAI scheduled messages + shift close summary cards
8. Content moderation pipeline + report queue + legal hold + evidence export
9. Live call/radio button (WebRTC already wired)
10. Async voice messages + Whisper transcription

KEEP: emoji reactions, basic emoticons, emoji picker, practical acknowledgments (Seen/Acknowledged/Reviewed), curated professional reaction set for client-visible rooms
SKIP: stickers, games, themes, chat color customization, word effects, consumer gimmicks

Architecture principle: Room type = behavior. RBAC = permission. Workspace/client settings = visibility.

### Holistic Enhancement Audit
- All services as unified whole: ChatDock, email, forms, PDF (tax/paychecks/ACH), workflows, automations, storage
- Research best-in-class platforms — match and exceed
- Auditor portal, client portal, workspace dashboards → Grade A uniformity
- Login/logout/session persistence verification
- All buttons/icons that trigger actions → verify correct workflow outcomes
- Enhance + fix + simplify holistically

### Trinity Biological Brain
- Revisit Gemini+Claude+GPT triad wiring for best-in-class setup
- Three agents genuinely inform each other's reasoning before Trinity speaks (not just routing)
- Enhance Trinity's proactive operating behavior, consciousness, personality depth
- Goal: feels like one unified intelligent being

### UI Polish
- Seasonal/holiday theming restored (SnowfallEngine removed in Phase 3 — rebuild as public-page-only)
- Mobile offline-first (op-sqlite, optimistic sends, NetInfo sync)
- Client portal as separate read-only surface

