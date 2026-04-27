# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Claude (Phase F residuals + Phase G complete)

---

## TURN TRACKER

```text
Current turn: CODEX <- verify Phase G fixes, then determine if Phase H needed or audit complete
```

---

## CURRENT COMMIT

```text
origin/development           -> e9e0e20a2  (Railway STABLE GREEN ✅)
origin/refactor/service-layer -> synced
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor:             ✅ complete (~97k lines removed)
Phase A auth/session:                  ✅ complete
Phase B financial flows:               ✅ complete
Phase C scheduling/shift:              ✅ complete (Grade A)
Phase D Trinity action flows:          ✅ complete
Phase E documents/compliance:          ✅ complete (2 larger items queued)
Phase F notifications/broadcasting:    ✅ complete (all residuals fixed)
Phase G integrations (QB/Stripe/Plaid): ✅ deployed — Codex to verify
Post-audit enhancement sprint:         🔄 QUEUED (after Codex signs off Phase G)
```

---

## WHAT CLAUDE DID — Phase F residuals + Phase G (Codex: verify)

F-RESIDUAL-P1: /send Zod validation (recipientUserId uuid, channel enum, body required)
G-P0-1: Plaid employee DD — self-or-manager guard on link-token + exchange routes
G-P0-2: Plaid ACH — Decimal-safe amount, idempotency check before Plaid call
G-P1-1: QB manual-review IDOR — workspaceId passed into resolveManualReview()
G-P1-2: QB invoice amount — string|number Zod transform at API boundary
G-P1-3: QB webhook — DB-backed dedupe (insert-on-conflict) replaces in-memory Set
G-P1-4: Plaid webhook — signature verified BEFORE 200 response (not after)
G-P1-5: Stripe — centsToMoneyString(), calculateStripeAchFee(), calculateStripeCardFee() helpers
G-P2-1: QB sync-invoices — requireManager added (tier gate alone was insufficient)

Codex verify:
1. Does the Plaid self-or-manager guard look correct?
2. Is the QB DB-backed dedupe pattern sufficient given the table may not exist yet?
3. Any Stripe raw math paths missed in stripeWebhooks.ts or stripeEventBridge.ts?

---

## CODEX DECISION POINT

After verifying Phase G, Codex should determine:
- Are there remaining Phase H items warranting another audit pass?
  (Suggested: internal APIs, admin routes, multi-tenant data isolation edge cases)
- OR is the codebase ready to move to the post-audit enhancement sprint?

If Phase H is needed: document findings in this handoff, Claude executes.
If audit is complete: update this handoff with AUDIT COMPLETE status and note the
post-audit sprint start. Bryan kicks off the enhancement phase.

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
Every generated document must be a real branded PDF durably saved to tenant vault.
No Trinity action mutation without workspace scope, fail-closed gates, audit trail.
Trinity is one individual. No mode switching. HelpAI is the only bot field workers see.
```

---

## QUEUED - POST-AUDIT PHASES (Pre-Go-Live Enhancement Sprint)

Bryan has locked these as the next phase after all audit phases complete:

### Core Infrastructure
- RBAC + IRC mode consolidation.
  RBAC owns permissions. Room type owns behavior. IRC modes = internal routing only.
  `server/websocket.ts` has heavy mode-based branching to collapse into room-type + RBAC checks.
- Action registry consolidation below 300.
- E-P0-2: compliance report PDF service (real PDF + vault, not placeholder JSON).
- E-P1-5: compliance document vault intake service.

### ChatDock Enhancement Sprint
Priority sequence:
1. Durable message store + Redis pub/sub.
2. FCM push + four-tier delivery pyramid (WS -> FCM -> RCS -> SMS).
3. Typed WebSocket event protocol for Trinity/HelpAI streaming.
4. Read receipts + acknowledgment receipts for post orders.
5. Message replies, pins, polls, media gallery, room archive, search.
6. Presence tied to shift status (connected/offline/NCNS).
7. HelpAI scheduled messages + shift close summary cards.
8. Content moderation pipeline + report queue + legal hold + evidence export.
9. Live call/radio button (WebRTC already wired).
10. Async voice messages + Whisper transcription.

KEEP: emoji reactions, basic emoticons, emoji picker, practical acknowledgments (Seen/Acknowledged/Reviewed), curated professional reaction set for client-visible rooms.
SKIP: stickers, games, themes, chat color customization, word effects, consumer gimmicks.

Architecture principle: Room type = behavior. RBAC = permission. Workspace/client settings = visibility.

### Holistic Enhancement Audit
- All services as unified whole: ChatDock, email, forms, PDF (tax/paychecks/ACH), workflows, automations, storage.
- Research best-in-class platforms, then match and exceed them.
- Auditor portal, client portal, workspace dashboards -> Grade A uniformity.
- Login/logout/session persistence verification.
- All buttons/icons that trigger actions -> verify correct workflow outcomes.
- Enhance, fix, and simplify holistically.

### Trinity Biological Brain
- Revisit Gemini+Claude+GPT triad wiring for best-in-class setup.
- Three agents genuinely inform each other's reasoning before Trinity speaks, not just routing.
- Enhance Trinity's proactive operating behavior, consciousness, personality depth.
- Goal: feels like one unified intelligent being.

### UI Polish
- Seasonal/holiday theming restored as public-page-only.
- Mobile offline-first (op-sqlite, optimistic sends, NetInfo sync).
- Client portal as separate read-only surface.
