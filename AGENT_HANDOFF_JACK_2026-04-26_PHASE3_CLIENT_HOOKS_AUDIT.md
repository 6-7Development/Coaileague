# Jack/GPT Handoff — Phase 3 Client Hooks Audit

Branch: `refactor/client-cleanup`
Date: 2026-04-26

## Branch setup

Jack created the Phase 3 client cleanup branch from stable `development`:

```text
refactor/client-cleanup
```

Base commit:

```text
ac57edcf130478fdf03ad9eb7fe8e8f6f8d1c2ce
refactor: merge service layer final batch — partners/auth/oauth cleanup
```

Reason: Claude's handoff says Phase 2 service-layer cleanup is complete and merged to `development`. Client-side cleanup should not continue on the old `refactor/service-layer` branch.

## Current Phase 3 scope

First domain: client hooks.

Claude's handoff named 24 likely-dead hooks. Jack ran connector search batches for the hook names and saw no caller hits. Two sample files were fetched and confirmed present:

```text
client/src/hooks/useFastMode.ts
client/src/hooks/use-smart-replies.ts
```

Important: GitHub connector search is not enough to delete client files. Vite must verify after deletion.

---

# Critical client deletion rule

Client cleanup is different from server cleanup.

`grep` and GitHub search can miss barrel exports, re-exports, and Vite resolution.

Mandatory rule:

```bash
# delete one file or one very small, related group
npx vite build 2>&1 | grep -E "ENOENT|error during|built in"
```

Expected:

```text
built in X.XXs
```

If output includes `ENOENT` or `error during`, restore immediately.

---

# Hook delete candidates from Claude handoff

Delete only after local path import check and Vite build.

## Batch A — AI/notification/session hooks

```text
client/src/hooks/use-notification-preferences.ts
client/src/hooks/useSessionCheckpoint.ts
client/src/hooks/use-force-refresh.ts
client/src/hooks/use-smart-replies.ts
client/src/hooks/useFastMode.ts
```

## Batch B — role/device/shift/mascot observer hooks

```text
client/src/hooks/use-role-theme.ts
client/src/hooks/use-shift-websocket.ts
client/src/hooks/use-device-settings.ts
client/src/hooks/use-mascot-chat-observer.ts
client/src/hooks/useLoginValidation.ts
```

## Batch C — notification/mascot/login-loading hooks

```text
client/src/hooks/use-notification-state.ts
client/src/hooks/use-mascot-task-generation.ts
client/src/hooks/useLogoutValidation.ts
client/src/hooks/use-haptic-feedback.ts
client/src/hooks/useLoadingState.ts
```

## Batch D — mascot/theme/loading/sound/route/token/feature hooks

```text
client/src/hooks/use-mascot-action-states.ts
client/src/hooks/use-seasonal-theme.ts
client/src/hooks/useCoAIleagueLoading.ts
client/src/hooks/use-chat-sounds.ts
client/src/hooks/use-route-transition.ts
client/src/hooks/use-token-awareness.ts
client/src/hooks/useFeatureFlags.ts
```

Claude's handoff said 24 hooks, but the listed names total 22. Claude should locally enumerate `client/src/hooks` and reconcile if two names were omitted from the handoff.

---

# Local verification method

For each candidate file:

```bash
file="client/src/hooks/useFastMode.ts"
base="$(basename "$file" .ts)"
rg "from ['\"].*/${base}['\"]|from ['\"]@/hooks/${base}['\"]|import\(.*${base}" client/src --glob '*.{ts,tsx}'
```

Also check extensionless path references:

```bash
rg "@/hooks/useFastMode|hooks/useFastMode|useFastMode" client/src --glob '*.{ts,tsx}'
```

Then delete and immediately run Vite:

```bash
git rm "$file"
npx vite build 2>&1 | grep -E "ENOENT|error during|built in"
```

If Vite fails:

```bash
git restore "$file"
```

---

# Notes from sample files

## useFastMode.ts

File exists and implements old Fast Mode credit/task state.

It calls removed/likely-retired endpoints:

```text
/api/ai-brain/fast-mode/status
/api/ai-brain/fast-mode/value
```

Connector search found no caller hit for `useFastMode`.

Likely delete, but verify with Vite.

## use-smart-replies.ts

File exists and implements AI-powered smart replies.

It calls:

```text
/api/experience/smart-replies/templates
/api/experience/smart-replies/generate
/api/experience/smart-replies/usage
```

Connector search found no caller hit for `use-smart-replies`.

Likely delete, but verify with Vite.

---

# Recommended Claude execution batch

To satisfy Bryan's whole-domain/half-domain speed rule safely:

1. Locally enumerate all hook candidates.
2. Delete in small batches of 3-5 hooks max.
3. Run Vite after each small batch.
4. Restore immediately on ENOENT/error.
5. Commit the successful hook cleanup batch.

Suggested order:

```text
Batch A -> Vite
Batch B -> Vite
Batch C -> Vite
Batch D -> Vite
```

Then run final checks:

```bash
npx vite build 2>&1 | grep -E "ENOENT|error during|built in"
node build.mjs
rg "require\(" server/ --glob "*.ts" | grep -v "node_modules|.d.ts|//|build.mjs" || true
rg "<<<<<<<|=======|>>>>>>>" .
```

Server boot test is not required for hook-only deletion unless server files change, but running it before merging the PR is still recommended.

---

# Next Phase 3 domains after hooks

After hook cleanup, audit:

```text
client/src/pages/        scaffolded pages not imported in App.tsx
client/src/components/   especially ai-brain/, gamification-adjacent, empire/, mascot/
client/src/config/       remaining stale config files after apiEndpoints trim
```

Jack can take pages/components as the next whole-domain audit after Claude executes the hooks cleanup.
