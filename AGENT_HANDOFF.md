# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Claude (Phase F complete)

---

## TURN TRACKER

```text
Current turn: CODEX <- verify Phase F fixes + audit Phase G (integrations: QB/Stripe/Plaid)
```

---

## CURRENT COMMIT

```text
origin/development           -> 3f868caef  (Railway STABLE GREEN ✅)
origin/refactor/service-layer -> synced to 3f868caef
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor:     ✅ complete (~97k lines removed)
Phase A auth/session:           ✅ complete
Phase B financial flows:        ✅ complete
Phase C scheduling/shift:       ✅ complete (Grade A)
Phase D Trinity action flows:   ✅ complete
Phase E documents/compliance:   ✅ complete (2 larger items queued)
Phase F notifications:          ✅ deployed — Codex to verify before Phase G
Phase G integrations (QB/Stripe/Plaid): 🔄 NOT STARTED — Codex audits next
```

---

## WHAT CLAUDE DID — Phase F (Codex: verify)

F-P0-1: NDS deliverSMS routes through consent/log path (sendSMSToUser/sendSMSToEmployee)
F-P0-2: Critical types (panic_alert, duress_alert, incident_alert, security_threat)
  bypass quiet hours + channel opt-outs in shouldDeliver(). @ts-expect-error removed.
F-P0-3: NDS idempotency — onConflictDoNothing + atomic claim with conditional WHERE
F-P1-1: Panic alert transitions — conditional WHERE guards on acknowledge/resolve,
  listAlerts limit clamped and parameterized
F-P1-2: Push delivery workspaceId passed at all three UNE call sites
F-P1-3: NDS acknowledge requires recipientUserId+workspaceId; /send restricted to requireManager
F-P1-4: Broadcast IDOR on get/stats/update/delete; acceptShiftToken double-accept fixed
F-P1-5: Resend bounce — update by Resend message ID first, address-based as fallback

Codex verify questions:
1. Is the critical-alert bypass in shouldDeliver() comprehensive enough?
2. Does the NDS atomic claim pattern match Codex's intent?
3. Any broadcast or push paths missed in workspace scoping?

---

## PHASE G — CODEX AUDIT TARGET

Integrations: QuickBooks, Stripe, Plaid

Files to inspect:
```
server/routes/quickbooksRoutes.ts
server/routes/stripeRoutes.ts
server/routes/stripeWebhooks.ts
server/routes/plaidRoutes.ts
server/services/billing/quickbooksService.ts
server/services/billing/stripeClient.ts
server/services/plaidService.ts
server/routes/billing-api.ts
server/routes/stripeInlineRoutes.ts
```

Look for:
1. Stripe webhooks — idempotency? event replay? workspace scope on each event type?
2. QuickBooks OAuth — PKCE/state param? token storage secure? cross-tenant sync possible?
3. Plaid ACH — workspace scope on all endpoints? balance check before transfer?
4. Any integration callback that accepts raw external data without ownership verification
5. Webhook signature verification on all inbound (Stripe, Plaid, QB)
6. Any raw financial math in integration paths (should use FinancialCalculator)

---

## QUEUED — POST-AUDIT (Pre-Go-Live Enhancement Sprint)

See previous handoff entries. Full list preserved in Claude's memory.
Key items: RBAC+IRC consolidation, action registry to <300, E-P0-2, E-P1-5,
ChatDock full sprint, Trinity brain wiring, holistic audit, UI polish.

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

