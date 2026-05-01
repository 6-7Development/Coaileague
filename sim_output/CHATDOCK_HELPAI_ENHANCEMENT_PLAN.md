# ChatDock + HelpAI/Trinity — Enhancement & Polish Plan

**Date:** 2026-05-01
**Branch:** `claude/test-chatdock-integration-dOzPS`

This document captures (a) what was verified about the brain/memory architecture
the user described, (b) the four targeted fixes applied this session that took
the audit from 25/34 to 35/35, and (c) a concrete proposal of next-step
enhancements + visual polish to bring ChatDock to a Class-A experience.

The intent is to give the user a clear menu of follow-up work — not to apply
any of these without confirmation.

---

## Verified architecture (audit: 35/35)

| Group | Verified |
|---|---|
| Trinity biblical core | values anchor, character foundation, master prompt, knowledge corpus, cognitive architecture, learning protocol — all present and consumed by `trinityChatService` |
| HelpAI inherits Trinity brain | now imports `TRINITY_VALUES_ANCHOR` + `PERSONA_CHARACTER_FOUNDATION`, uses the same Gemini Pro tier, shares the human-personality block |
| HelpAI field-manager persona | summon contexts describe HelpAI as "field intelligence assistant / co-pilot", joins as `chat_participants` with `admin` role, shift-room welcome covers real-time guidance / incident reporting / clock-in / emergency |
| Officer memory | `helpai_officer_profiles` tracks style, language, struggles, requests, strengths, mood, stressSignals, distressHistory, observationNotes — and the live persona prompt now also surfaces shift load (7d), cert status, reliability score (90d), call-offs (30d), incident reports (60d), and good-officer notes |
| Trinity audience adaptation | role scoping (owner / co-owner / manager / supervisor / officer), Mode-2 platform-support preamble, billing restriction, supervisor site-scoping, plus four new audience modules: CLIENT, AUDITOR, GUEST, AGENT-TO-AGENT (other AI) — selected per-call by `resolveTrinityAudience()` |
| Cross-bot memory bridge | HelpAI now reads `trinityMemoryService.buildOptimizedContext()` so it sees what Trinity already learned about the user |

Receipts: `sim_output/helpai-trinity-audit.{txt,json}`,
`sim_output/chatdock-runtime-verify.{txt,json}`,
`sim_output/chatdock-wiring-audit.txt`.

---

## Fixes applied this session

1. **HelpAI biblical-brain inheritance** — `helpAIBotService.ts` now prepends
   `TRINITY_VALUES_ANCHOR` and `PERSONA_CHARACTER_FOUNDATION` into its
   `systemInstruction`, then declares HelpAI's own field-manager personality
   on top. Same convictions, different posture.

2. **Officer-memory call-ins + incidents** — `helpAIOfficerPersonaService`
   now computes:
   - 30-day call-off / late-arrival summary from the `shifts` table
   - 60-day incident-report summary (with severity + open count) from
     `incident_reports`
   - "good officer" strengths surface from the existing profile JSON
     (top 3 entries)
   These render as `Attendance: …`, `Recent incidents: …`, `Strengths on
   file: …` lines in the prompt — HelpAI talks like a watch commander
   who knows the team.

3. **Trinity audience modules** — Four new prompt modules in
   `trinityPersona.ts` (`CLIENT_AUDIENCE_MODULE`, `AUDITOR_AUDIENCE_MODULE`,
   `GUEST_AUDIENCE_MODULE`, `AGENT_TO_AGENT_AUDIENCE_MODULE`) plus a
   `getAudienceModule(audience)` selector. `trinityChatService` now calls
   `resolveTrinityAudience()` and appends the right module after role-scoping
   so role hard-limits still win on conflict.

4. **Cross-bot memory bridge** — HelpAI's prompt now ends with a `SHARED
   MEMORY` block fed by `trinityMemoryService.buildOptimizedContext()`, so
   HelpAI inherits whatever Trinity has already learned about the user.

---

## Recommended next-step enhancements

Each item below is independent and can be cherry-picked. I'd suggest tackling
them in the listed order — the highest-leverage items are first.

### A. Memory & intelligence (back-end)

1. **Cross-bot insight publishing.** Wire `helpAIBotService` to call
   `trinityMemoryService.shareInsight()` after every closed session so the
   knowledge HelpAI gathers (officer struggles, recurring requests, recovery
   patterns) propagates back to Trinity. Currently the bridge is one-way.

2. **Per-site officer scorecards.** Extend the officer persona to include a
   "best at site" hint (highest reliability per `site_id` over 90 days).
   Lets HelpAI say things like "you've worked Hudson Tower 14 times with a
   100% on-time rate — comfortable taking it again Thursday?"

3. **Shift-pattern fingerprint.** Detect each officer's typical
   sleep/availability windows from clock-in history and feed it into
   `helpaiOfficerProfiles.observationNotes` automatically. HelpAI stops
   suggesting 04:00 shifts to officers who have always declined them.

4. **Call-in distress signal.** When the call-off counter for an officer
   crosses a threshold (3 in 14 days), have HelpAI flag it to their
   supervisor via the existing `helpAIOrchestrator.summonSupervisorCheckIn`
   path (path exists; trigger doesn't). Surfaces burnout before it becomes
   a no-show pattern.

5. **Trinity shadow-presence in DMs.** Trinity should silently summarize
   every DM that crosses a sentiment-negative threshold for the org-owner's
   weekly digest. The `chatSentimentService` already runs per-message —
   pipe its output into `trinityMemoryService.shareInsight` so Trinity can
   speak to the owner about team morale with real evidence.

### B. ChatDock UX & visual polish

The verifier confirms function — these items target *feel*. All low-risk,
all reversible.

1. **Message-status ladder visible inline.** WhatsApp-style ✓ → ✓✓ → ✓✓ blue.
   Backend already has read receipts; the dock currently renders only a
   single static check. Adopt three states: `sent` (faint ✓), `delivered`
   (✓✓), `read` (✓✓ accent). Drives the "alive" feel the user asked for
   on swipe/scroll.

2. **Unified message tail / bubble shape.** Currently bubbles render with a
   uniform border-radius. Apply the iOS Messages "tail on first/last in
   sequence" pattern — drops perceived noise and groups consecutive sender
   messages visually.

3. **Swipe-to-reply on touch.** A short rightward swipe on any message bubble
   should reveal a reply preview (mirrors WhatsApp). The `replyingTo` state
   already exists; we'd just need a `useTouchSwipe` wrapper around each
   message row + a haptic on threshold crossing.

4. **Pull-to-load-history.** When the scroll container reaches the top,
   fetch older messages and slide them in with the existing
   `messageSlideIn` keyframe. Requires a small backend tweak (cursor-paged
   `/api/chat/conversations/:id/messages?before=…`).

5. **Typing indicator in the room list.** When someone is typing in another
   room, the room's preview line should switch to "Pat is typing…" with a
   subtle pulse. The WS already broadcasts `user_typing`; only the room-list
   summary needs to subscribe.

6. **Voice-message waveform + scrubbing.** Voice notes currently render as
   `[Shared audio]` link text. A real `<audio>` with a waveform bar (using
   `wavesurfer.js` — ~30KB gzipped) and tap-to-jump scrubbing would close
   the WhatsApp gap.

7. **Sticky date dividers ("Today", "Yesterday", "Mon, Apr 28").** Common
   in iMessage / Messenger; absent here. One absolutely-positioned pill
   over the scroll container, recomputed in `IntersectionObserver`.

8. **Composer auto-grow + monospace block detection.** The textarea is
   single-row. Auto-grow up to 6 lines, and detect ` ```code``` ` to render
   the input in monospace as the user types — same trick Slack uses.

9. **Reaction-bar haptic ripple.** The 6-emoji popover already pops in with
   the spring keyframe added this session. Add a 60ms staggered fade-in on
   each emoji so the hand reaches the most-recent one last (Messenger does
   this — feels expensive).

10. **HelpAI/Trinity author chips.** When HelpAI or Trinity speaks in a
    room, render the message with a subtle gradient border + a small
    glyph chip ("Field Manager" for HelpAI, "Senior" for Trinity) so users
    instinctively know it's the AI talking, not a colleague named "HelpAI".

### C. ChatDock structural polish

1. **Move the 12 inline mutation hooks into one `useChatActions(roomId)`.**
   `ChatDock.tsx` is ~3,000 lines partly because every reaction / pin /
   delete / edit / forward defines its own `useMutation` block. A single
   typed actions hook would shrink the file ~40% and make the dock easier
   to test in isolation.

2. **Lazy-split `ChatDock.tsx` into the bubble shell + the conversation
   pane.** The bubble shell (1,500 lines of room-list + portal) and the
   conversation pane (1,500 lines of message-list + composer) are loaded
   eagerly even when the dock is closed. Code-splitting drops first-paint
   work for users who never open chat.

3. **Lift the 8 `useState` typing flags into one `chatViewReducer`.**
   Replying, editing, lightbox, action-menu, search, command-palette,
   reaction-picker, and selection mode each have their own state. A single
   reducer with explicit transitions kills the "two overlays open at once"
   class of bug.

### D. PWA / iOS / Android parity

The static audit confirmed all three platforms hit the same `/ws/chat`. To
make the *experience* feel native:

1. **Capacitor `Haptics` plugin.** The `haptics` util currently uses
   `navigator.vibrate`. iOS doesn't honour Web Vibration. Wrap with the
   Capacitor `Haptics.impact({ style: 'light' })` when running in native.

2. **`safe-area-inset-bottom` on the composer.** iOS PWA users currently
   have the send button slip under the home indicator on certain rooms.
   One-line CSS fix.

3. **`overscroll-behavior: contain` on the message list.** Stops iOS
   bounce-scroll from dragging the underlying app when ChatDock is full
   screen.

4. **`background-fetch` for unread counts when the app is backgrounded.**
   Currently the badge stays stale until the app is foregrounded. The
   notification path exists; only the silent-fetch needs wiring.

5. **Splash → first-message TTI budget.** Ship a tracking ping in
   `WebSocketProvider` for `connect → ws_authenticated → first
   conversation_history`. Once instrumented, any regression past 2.0s on
   mobile becomes a build-blocking CI signal.

### E. Risks worth knowing about

These are not bugs we should chase right now, but they're worth flagging:

- `dockChatRoutes.ts` writes to columns (`content`, `metadata`,
  `client_message_id`, `delivery_status`, `sequence_number`) that don't
  exist in the Drizzle schema. ChatDock doesn't call `/api/chat/dock/*`,
  but anything that does will 500. Either align the schema or delete the
  stale router.
- `helpAICoreEngine.ts` has parallel persona logic that hasn't been
  re-pointed at the new `TRINITY_VALUES_ANCHOR` import. If we ever route
  HelpAI through this engine instead of `helpAIBotService`, the biblical
  values won't carry. Worth a single review pass.
- `clientPortalHelpAIService.ts` has its own AI prompt assembly that does
  not yet consume the new `CLIENT_AUDIENCE_MODULE`. Easy unification —
  same import, same prepend.
