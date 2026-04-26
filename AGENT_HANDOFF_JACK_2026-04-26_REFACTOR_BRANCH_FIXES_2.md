# Jack/GPT Handoff — Refactor Branch Health Fixes 2

Branch: `refactor/route-cleanup`
Date: 2026-04-26

## Branch Rule

No route cleanup on `development`.
All work here is on `refactor/route-cleanup`.

## Claude Latest Verified By Jack

Jack confirmed refactor branch tip before starting:

```text
8085acbcd6be1cbf135cad64893eed915f5c029b
```

Claude's commit said build clean, but the diff/file contents showed real syntax issues in CAD and HRIS. Jack repaired them before doing further cleanup.

## Commit 1 — CAD Router Repair

```text
1c6d7dce — fix: repair CAD router references on refactor branch
```

File:

```text
server/routes/cadRoutes.ts
```

Actual broken identifiers found:

```text
adRouter.post(...)
dRouter.post(...)
Router.delete(...)
```

Fix:

- restored them to `cadRouter.*`
- removed now-unused imports from earlier cleanup
- no new CAD deletion performed

## Commit 2 — Sales Cleanup

```text
a16c0106 — refactor: trim dead sales document delivery routes
```

File:

```text
server/routes/salesRoutes.ts
```

Prefix audit:

```text
/api/sales              active callers found
/api/document-delivery  no callers found
```

Deleted:

```text
/api/document-delivery/* router and mount
GET /api/sales/activities
duplicate late POST /api/sales/outreach/crawl stub
```

Preserved:

```text
GET  /api/sales/invitations
POST /api/sales/invitations/send
GET  /api/sales/proposals
POST /api/sales/proposals
POST /api/sales/outreach/crawl
POST /api/sales/outreach/send
GET  /api/sales/outreach/pipeline
GET  /api/sales/outreach/pipeline/:stage
```

Bug fix:

`GET /api/sales/invitations` referenced `workspaceId` without declaring it. Now it uses `req.workspaceId` and returns 403 if missing.

## Commit 3 — HRIS Router Repair

```text
8f92e940 — fix: repair HRIS routes on refactor branch
```

File:

```text
server/routes/hrisRoutes.ts
```

Actual broken content found:

```text
uter.get('/callback/:provider'...)
missing semicolon/close on final route
stale imports for deleted OAuth/sync/disconnect routes
```

Fix:

Reduced file to the two active HRIS routes Claude intended to preserve:

```text
GET /api/hris/providers
GET /api/hris/connections
```

Removed stale imports:

```text
HRISProvider
SyncDirection
EntityType
HRIS_PROVIDERS
z
platformEventBus
typedPool
```

## Required Claude Verification

Run on `refactor/route-cleanup`:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

Branch-health checks:

```bash
rg "adRouter|dRouter|Router\.delete" server/routes/cadRoutes.ts
rg "uter\.get|callback/:provider|sync/:provider|disconnect/:provider|sync-status/:provider" server/routes/hrisRoutes.ts
rg "/api/document-delivery|document-delivery" client server shared scripts tests
rg "/api/sales/activities|sales/activities" client server shared scripts tests
```

Expected:

- no malformed CAD router identifiers
- no malformed HRIS callback leftovers
- no active document-delivery callers
- no active sales activities callers

## Important Process Note

Do not mark the branch as build-clean until after checking the actual file contents, not just commit messages. The previous commit message reported build clean but the fetched file contents were syntactically broken.

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull `refactor/route-cleanup`.
2. Confirm commits `1c6d7dce`, `a16c0106`, `8f92e940`.
3. Run build/type-check.
4. Update `AGENT_HANDOFF.md` with the new refactor branch tip if clean.
5. Continue next target only after branch health is verified.
