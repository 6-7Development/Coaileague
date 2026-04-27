# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Codex (3-agent roles clarified; Codex hardening role added)

---

## THREE-AGENT RELAY PROTOCOL

```
CLAUDE      → executes domain, boot-tests, commits
COPILOT     → boilerplate acceleration (Zod, test scaffolds, helper patterns)
CODEX       → verifies, decides next domain or signals AUDIT COMPLETE
```

Speed rule: One domain, one complete sweep, one coherent commit.

Role clarification (supersedes the shorthand above):
- CODEX verifies, but is also expected to strengthen weak code, remove bandaids,
  and perform scoped refactors/enhancements when a domain can be improved safely
  on `refactor/service-layer`. Codex documents exact risks, line numbers, fix
  instructions, validation, and any code changes made.
- CLAUDE remains implementation lead on `development`, integrates Codex hardening
  changes when Codex made them, boot-tests, and syncs back.
- COPILOT is acceleration only: repeated Zod/schema work, test scaffolds, helper
  replacements, and repeated route-guard sweeps after Claude/Codex define the
  canonical pattern. No architecture calls, final safety decisions, or independent
  merges.

Whole-domain definition: routes, services, jobs, schedulers, queues, workers,
automations, webhooks, storage, events, migrations, tests, validation, and
user-facing action paths. Nothing in the domain is considered done until the full
workflow is coherent end-to-end.

Ownership rule: no two agents edit the same files at the same time. If Codex
patches code during verification, Claude integrates those exact changes or
documents why a different implementation replaced them.

---

## TURN TRACKER

```text
Current turn: COPILOT
  → Look for repeated Zod schema patterns, test stubs, or helper boilerplate
    that can be added quickly across the codebase
  → Suggested target: add test scaffolds for the key fixes from Phases D-H
  → OR if no narrow scope found: signal CODEX to verify Phase H

After Copilot: CODEX
  -> Verify Phase H fixes and strengthen/refactor weak Phase H code if safely scoped.
  → Verify Phase H fixes
  → Determine: any remaining domains?
  → Suggest: AUDIT COMPLETE if nothing critical remains
```

---

## CURRENT COMMIT

```text
origin/development           -> 8aca7e864  (Railway STABLE GREEN ✅)
origin/refactor/service-layer -> this commit
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor:             ✅ complete (~97k lines removed)
Phase A auth/session:                  ✅ complete
Phase B financial flows:               ✅ complete
Phase C scheduling/shift:              ✅ complete (Grade A)
Phase D Trinity action flows:          ✅ complete
Phase E documents/compliance:          ✅ complete
Phase F notifications/broadcasting:    ✅ complete
Phase G integrations (QB/Stripe/Plaid): ✅ complete
Phase H admin/upload/platform guards:  ✅ deployed — Copilot then Codex to verify
```

---

## WHAT CLAUDE DID — Phase H (verify)

H-P0-1: bulk-operations — 5 MB file limit + MIME filter (CSV/Excel) + requireManager on imports
H-P1-1: platform survey creation — requirePlatformStaff (was completely open)
H-P1-2: adminDevExecuteRoute — production hard block added (defense-in-depth)

PASSES (no action needed, documented for audit trail):
  adminRoutes, adminWorkspaceDetailsRoutes, financialAdminRoutes,
  platformRoutes, adminPermissionRoutes, securityAdminRoutes,
  platformConfigValuesRoutes, admin/aiCosts, auditorRoutes,
  bulk-operations exports, chat-uploads — all properly gated ✅

---

## COPILOT SCOPE (narrow, acceleration only)

Suggested narrow targets across the codebase:
1. Any route file that has manual body destructuring instead of Zod — add schema
2. Test stubs for key security fixes (panic alert double-ack, NDS atomic claim,
   broadcast token double-accept, Plaid ownership, QB IDOR)
3. Helper function for "is deliverable employee" (isActive + status exclusion)
   shared across UNE, scheduling, and validator
4. Any remaining `// @ts-expect-error — TS migration: fix in refactoring sprint`
   comments where the actual fix is simple

DO NOT: make architecture changes, merge independently, touch auth patterns

---

## QUEUED — POST-AUDIT ENHANCEMENT SPRINT

After Codex signals AUDIT COMPLETE, in priority order:

1. RBAC + IRC mode consolidation
2. Action registry to <300 actions
3. E-P0-2 compliance report PDF service
4. E-P1-5 compliance document vault intake
5. ChatDock full enhancement sprint (see memory for full list)
6. Holistic audit of all services as unified whole
7. Trinity biological brain wiring enhancement
8. UI polish (update toast, seasonal effects, mobile offline)

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
Every generated document = real branded PDF saved to tenant vault.
Trinity action mutations = workspace scope + fail-closed gates + audit trail.
Trinity is one individual. No mode switching. HelpAI is the only bot field workers see.
One domain, one complete sweep, one coherent commit.
```

---

## QUEUED — POST-AUDIT ENHANCEMENT SPRINT

After Codex signals AUDIT COMPLETE:

### Priority 1 — Foundation
- RBAC + IRC mode consolidation (RBAC owns permissions, room type owns behavior)
- Action registry consolidation below 300 (currently ~561, warns at boot)
- E-P0-2: compliance report PDF service
- E-P1-5: compliance document vault intake service

### Priority 2 — ChatDock Enhancement
1. Durable message store + Redis pub/sub
2. FCM push + four-tier delivery (WS → FCM → RCS → SMS)
3. Typed WebSocket event protocol (Trinity/HelpAI streaming)
4. Read receipts + acknowledgment receipts (post orders)
5. Message replies, pins, polls, media gallery, archive, search
6. Presence tied to shift status (connected/offline/NCNS)
7. HelpAI scheduled messages + shift close summary cards
8. Content moderation + report queue + legal hold + evidence export
9. Live call/radio button (WebRTC already wired)
10. Async voice messages + Whisper transcription
KEEP: emoji reactions, emoticons, picker, Seen/Acknowledged/Reviewed
SKIP: stickers, games, themes, word effects

### Priority 3 — Holistic Audit
- All services as unified whole: ChatDock, email, forms, PDF, workflows, storage
- Login/logout/session persistence verification
- All action-triggering buttons/icons verified for correct workflow outcomes
- Auditor portal, client portal, workspace dashboards → Grade A

### Priority 4 — Trinity Brain + UI
- Gemini+Claude+GPT triad: genuine reasoning before Trinity speaks (not just routing)
- Seasonal/holiday theming restored on public pages
- Mobile offline-first (op-sqlite, optimistic sends)
- Update notification toast: Vivaldi-style minimal (icon + version + arrow)
