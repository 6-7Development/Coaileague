# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Claude (Phase D+E complete, pre-go-live todos locked)

---

## TURN TRACKER

```text
Current turn: CODEX <- audit Phase F (notifications/broadcasting)
Claude is done with Phase D residuals + Phase E. Branch is clean and green.
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
origin/refactor/service-layer -> 6de0bb538  (Codex's audit branch)
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
Phase F notifications:        🔄 NOT STARTED — Codex audits next
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

## PHASE F — CODEX AUDIT TARGET

**Notifications and broadcasting layer**

Files to inspect:
```
server/services/notificationDeliveryService.ts
server/services/universalNotificationEngine.ts
server/services/platformEventBus.ts
server/routes/notificationRoutes.ts
server/routes/webhookRoutes.ts              <- Resend webhook (known 401 issue)
server/services/emailService.ts
server/services/twilioService.ts
server/services/resend/
```

Look for:
1. **NotificationDeliveryService** — retry logic present? idempotency keys on sends?
   Does it prevent duplicate sends on retry?
2. **Panic alert chain** — does it actually fire end-to-end?
   Trinity → broadcast → manager push → SMS fallback?
3. **Resend webhook RESEND_WEBHOOK_SECRET** — is the secret validated before processing?
   Known open item: was returning 401 in Railway prod. Is it now set? Verified?
4. **platformEventBus** — subscriber errors isolated?
   Does one failing subscriber kill the event for all others?
5. **Notification routes** — workspace scope on all endpoints?
6. **Twilio SMS** — workspace scoped? Rate limited? Error handling on failed sends?
7. **Email service** — workspace tenant isolation? No cross-tenant sends possible?

Document findings file-by-file with line numbers and prioritized fix instructions for Claude.

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

