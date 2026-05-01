# COAILEAGUE — CLAUDE SESSION HANDOFF
# ONE FILE. Update in place. Claude-only. Bryan + Claude sessions only.
# Last updated: 2026-05-01 — Claude (action-wiring-manifest session)

> **This file is the team-coordination ledger for Claude sessions only.**
> No Codex. No Copilot. No GPT. No outside agents.
> Every Claude session reads this file FIRST, claims its domain, leaves notes,
> and signs out before ending. No overstepping. No platform breakage.

---

## TEAM RULES (read before doing anything)

1. **Read first, write second.** Open this file before touching code. Read
   the ACTIVE CLAIMS table and the SESSION LOG. If your domain is claimed by
   a session that's still active (signed in within the last 24h and not
   signed out), pick a different domain or coordinate via the SESSION LOG.
2. **Claim before you cut.** Before editing any file, add a row to ACTIVE
   CLAIMS with your session ID, branch, files/domain, and started-at
   timestamp. One claim per domain. If a file you need is in another
   session's claim, **stop and write a note in SESSION LOG** describing what
   you need and why; let the holding session respond or release.
3. **No silent edits.** Every commit on a Claude branch must be reflected as
   a row in SESSION LOG with branch, commit SHA, summary, and any follow-up
   work the next session should know about.
4. **Sign out cleanly.** Before ending a session: commit + push, move your
   ACTIVE CLAIMS row to RECENT SESSIONS with status (done / in-progress /
   blocked), and update the SESSION LOG.
5. **Don't break the platform.** Run `node build.mjs 2>&1 | grep "✅ Server\\|ERROR"`
   before signing out from any branch that touches server code. If the
   build is red, leave it red on your branch only — never push red to
   `development`. Note the breakage in SESSION LOG so the next session
   doesn't pull a poisoned base.
6. **Stay in your lane.** A claim covers files + the obvious adjacent
   utilities. Cross-domain refactors require a new claim and a SESSION LOG
   note explaining the scope expansion.
7. **No bandaids.** TRINITY.md laws apply. No raw money math, no scheduling
   hour math, no workspace IDOR, no state transitions without expected-status
   guard, no stubs, no fake success.

---

## ACTIVE CLAIMS

> **Format:** SessionID · Branch · Domain · Files (key paths) · Started · Last update
> One row per active session. Move to RECENT SESSIONS on sign-out.

| Session | Branch | Domain | Key files | Started (UTC) | Last update |
|---------|--------|--------|-----------|---------------|-------------|
| _claude-action-wiring-LjP5K_ | `claude/action-wiring-manifest-LjP5K` | Action Wiring Manifest first-pass + Claude-only handoff protocol | `scripts/audit/generate-action-wiring-manifest.ts`, `scripts/audit/check-action-wiring-gaps.ts`, `ACTION_WIRING_MANIFEST.md`, `action-wiring-manifest.json`, `AGENT_HANDOFF.md` | 2026-05-01 | 2026-05-01 — signed out, see RECENT SESSIONS |

_(no other active sessions)_

---

## SESSION LOG (newest at top — append, do not edit history)

### 2026-05-01 · claude-action-wiring-LjP5K
**Branch:** `claude/action-wiring-manifest-LjP5K`
**Commit:** `f107161`
**What changed:**
- Built `scripts/audit/generate-action-wiring-manifest.ts` — regex +
  import-graph scanner across UI / backend / Trinity / WS / automation.
- Built `scripts/audit/check-action-wiring-gaps.ts` — gap report;
  `--strict` exits non-zero on any gap (CI-friendly).
- Wrote first-pass `ACTION_WIRING_MANIFEST.md` (3,688 records,
  citations) and `action-wiring-manifest.json` (machine consumable).
- Rewrote AGENT_HANDOFF.md to be Claude-only with session check-in
  protocol (this rewrite).
**Spot-verified real findings:**
- `/api/clients/dockchat/reports/:id/{acknowledge,resolve}` is called
  from `client/src/pages/admin-helpai.tsx` but no backend route exists.
- `/api/integrations/connection-request` — UI hits `/api/integrations/...`,
  router actually mounts at `/api/workspace/integrations/...`.
**Open for next session:** see EXECUTION ORDER below; start with Trinity
Schedule. Audit is map-only — no fixes applied yet.
**Build:** not run (audit-only changes, no server code touched).
**Sign-out:** done.

---

## RECENT SESSIONS (last 10, newest at top)

| When | Session | Branch | Status | Notes |
|------|---------|--------|--------|-------|
| 2026-05-01 | claude-action-wiring-LjP5K | `claude/action-wiring-manifest-LjP5K` | done | Action Wiring Manifest first-pass shipped. Map only, no fixes. |

---

## CHECK-IN TEMPLATE (copy into ACTIVE CLAIMS)

```
| <session-id> | <branch> | <domain — one short phrase> | <key files / paths> | <YYYY-MM-DD HH:MM UTC> | <YYYY-MM-DD HH:MM UTC> |
```

## SESSION-LOG TEMPLATE (copy into SESSION LOG when committing)

```
### YYYY-MM-DD · <session-id>
**Branch:** `<branch>`
**Commit:** `<sha>`
**What changed:**
- <bullet — files + intent>
**Why:**
- <one-line — link to the rule, finding, or ticket that motivated it>
**Build:** passed / failed (paste the grep result if failed)
**Open for next session:**
- <anything the next session must know — pinned FIXMEs, half-done work,
  config flags, unresolved manifest entries>
**Sign-out:** done / in-progress / blocked
```

---

## EXECUTION ORDER (action-truth audit follow-up)

> Source of truth: `ACTION_WIRING_MANIFEST.md` + `action-wiring-manifest.json`.
> Re-run the generator after major mount/route changes; never edit the JSON
> by hand.

1. **Trinity Schedule / Smart Schedule** — `server/routes/schedulesRoutes.ts`,
   `shiftRoutes.ts`, `shiftTradingRoutes.ts`, `orchestratedScheduleRoutes.ts`,
   `staffingBroadcastRoutes.ts`, plus the `scheduling.*` block in
   `server/services/ai-brain/actionRegistry.ts` (lines 447-1100). Goal:
   every shift mutation has `requireAuth` + `ensureWorkspaceAccess` + Zod +
   atomic exclusion-constraint write + `broadcastShiftUpdate` +
   `notificationDeliveryService.send` on publish/cancel.
2. **Trinity Actions (registry)** — `server/services/ai-brain/actionRegistry.ts`.
   Hunt for: duplicate actionIds, registered-but-no-handler, mutating
   actions without `withAuditWrap`/`logActionAudit`, financial mutations
   without `requireDeliberationConsensus` / `requiresFinancialApproval`.
3. **ChatDock / Messaging** — `server/routes/chat-management.ts`,
   `chat-rooms.ts`, `server/services/ChatServerHub.ts`,
   `MessageBridgeService.ts`, `client/src/components/ChatDock.tsx`. Most
   `chat/manage/messages/*` routes flagged MISSING_ZOD + MISSING_AUDIT.
   Confirm WS emit → notification bell → read-receipt loop is closed.
4. **Universal Notification System** — verify
   `NotificationDeliveryService.send()` is the sole sender (TRINITY.md §B).
   Audit bell-count refresh path: WS emit → client store → badge.
5. **Employee / Client / Subtenant CRUD** — `server/routes/employees*.ts`,
   `clientsRoutes*.ts`, `adminWorkspaceDetailsRoutes.ts`. Many UI_ONLY
   entries here.
6. **Document Vault / PDFs** — `server/routes/documentLibraryRoutes.ts`,
   `server/services/documents/*`. Confirm signed URL generation, vault
   persistence before email/download.
7. **Automation / Workflow / Pipeline** —
   `server/services/automationEventsService.ts`,
   `automation/automationExecutionTracker.ts`, `automation/workflowLedger.ts`,
   `automationGovernanceService.ts`. Verify each emit/cron has a downstream
   consumer and a completion event/notification.

---

## ACTION WIRING MANIFEST — first-pass summary (2026-05-01)

> **Rule:** every action in the platform must be fully traceable from intent
> to actual effect. No silent failures. No fake success. No registered action
> without a real mutation/read/service path. No UI button without a route.
> This is not a dead-code audit — it is an **action truth audit**.

### Audit scripts

```bash
npx tsx scripts/audit/generate-action-wiring-manifest.ts
npx tsx scripts/audit/check-action-wiring-gaps.ts          # --strict to gate CI
```

### Manifest paths

- `ACTION_WIRING_MANIFEST.md`     — human-readable
- `action-wiring-manifest.json`   — machine-readable

### First-pass scope counts

| Source | Count |
|--------|-------|
| Backend route declarations | 2,940 |
| Frontend API calls (apiRequest + fetch + useQuery) | 1,825 |
| Trinity actionRegistry actionIds | 420 |
| WebSocket events (on + emit) | 34 |
| Automation/cron entries | 44 |
| **Unique action records** | **3,688** |
| Duplicate actionId keys | 328 |

### High-risk findings

| Status | Count | Notes |
|--------|-------|-------|
| PARTIAL  (wired but flagged) | 382 | Mostly MISSING_ZOD / MISSING_AUDIT / MISSING_TRANSACTION |
| UI_ONLY  (no backend route)  | 562 | Real 404 risks + some template-literal false positives — verify per-row |
| BACKEND_ONLY (no UI binding) | 1,850 | Includes legitimate internal/admin/integration routes |
| MISSING_RBAC (mutating)      | 296 | Top blocker |
| MISSING_ZOD (mutating)       | 691 | Tier-1 routes without schema validation |
| MISSING_WORKSPACE_SCOPE      | 28  | Verify each — some scope inside the handler not via middleware |
| MISSING_AUDIT (mutating)     | 1,062 | Many routes do not call `logActionAudit` / `auditLogger` |
| MISSING_TRANSACTION (multi-write) | 314 | Multi-write routes without `db.transaction` |
| SILENT_FAILURE_RISK          | 562 | Same set as UI_ONLY |
| REGISTERED_NOT_EXECUTABLE    | 189 | Trinity actionId literal exists but no `registerAction` reference |

### Scanner caveats

- Regex + import-graph (incl. dynamic `await import`). Not a full TS AST.
- Auth/RBAC detection is name-based — extend `AUTH_MIDDLEWARE_NAMES` in the
  generator when new guards land.
- Zod / notification / audit detection is per-file; verify per-route by hand
  on the high-risk list.
- DB writes are extracted from `db.insert/update/delete` literals only —
  ORM helpers and raw SQL templates may be missed.
- Path matching tries several `${var}` ↔ `:param` normalizations; some
  template literals still don't match. Spot-check before fixing.

---

## CURRENT BASE

```
origin/development → 8e02aaf97  (Railway STABLE GREEN — verify before basing new branches)
```

When starting a new session: `git fetch origin development && git log -1 origin/development`
and update this line if the SHA has moved.

---

## CLAUDE MERGE PROTOCOL

Only merge to `development` after another Claude session (or Bryan) has
reviewed the branch. Do not self-merge unless Bryan explicitly authorizes
it for that session.

```bash
git fetch origin {claude-branch}:refs/remotes/claude/{branch}
git diff development..claude/{branch} --name-only      # confirm scope
git checkout development
git checkout claude/{branch} -- {files-in-scope-only}
node build.mjs 2>&1 | grep "✅ Server\|ERROR"           # must show ✅
# boot test if server-side
git add {files} && git commit -m "merge: {branch-summary}"
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
