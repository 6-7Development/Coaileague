# Jack/GPT Handoff — onboardingInlineRoutes Delete List

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack onboardingInlineRoutes delete list`

## Context

Bryan/Claude provided a pre-audited route map for `server/routes/onboardingInlineRoutes.ts`:

- before: about `1,545L`
- status: `8 alive / 25 dead`
- action: delete 25 unused handlers next Claude turn

Jack checked the current repo mounts. Actual mount from `server/routes/domains/orgs.ts`:

```ts
app.use("/api/onboarding", onboardingInlineRouter);
app.use("/api/onboarding", requireAuth, ensureWorkspaceAccess, onboardingRouter);
```

So all paths below are under `/api/onboarding/*`.

## Branch Visibility Note

At Jack's check, `development` still showed `7d44b99b` as the visible tip. Claude's stated `onboardingRoutes.ts` cleanup commit was not visible yet through Jack's connector.

Claude should pull latest and verify branch order before applying this cleanup.

## Dead Routes To Delete — 25 Total

Delete these handlers from `server/routes/onboardingInlineRoutes.ts`:

```text
GET    /invite/:token
GET    /invites
POST   /invite/:id/resend
POST   /invite/:id/revoke
POST   /invite/:token/opened
GET    /invites/status/:status
GET    /invites/stats
GET    /application/:id
GET    /applications
POST   /signatures
GET    /signatures/:applicationId
GET    /certifications/:applicationId
POST   /documents/upload-url
POST   /documents/confirm
GET    /documents/:applicationId
GET    /contracts/:applicationId
POST   /contracts/:contractId/sign
GET    /migration-capabilities
GET    /test-workflow
GET    /diagnostics/:workspaceId
POST   /initialize-trinity
POST   /submit/:applicationId
GET    /pending-review
POST   /approve/:employeeId
GET    /readiness
```

## Alive Routes To Preserve — 8 Route Groups

Preserve these route groups:

```text
POST /invite
POST /application
POST /certifications
GET  /progress
POST /skip
POST /complete
GET  /status
/create-org/progress
```

For `/create-org/progress`, verify exact methods locally and preserve the active ones.

## Path List Cleanup

`onboardingInlineRoutes.ts` has a top path list / request gate that references multiple onboarding subpaths. After removing the 25 handlers, Claude should remove stale entries for deleted paths from that list so the file only documents active route groups.

## Likely Import Cleanup

After deletion, many imports may become unused. Let `tsc` decide, but likely candidates include imports related to:

- old invite lookup/list/resend/revoke flows
- application read/list/update flows
- signatures/contracts/documents
- migration diagnostics/test workflows
- raw SQL helpers
- object storage helpers
- websocket/scheduled side effects

Do not remove imports blindly.

## Required Local Verification

Route inventory:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/onboardingInlineRoutes.ts
```

Build:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

Dead-path verification:

```bash
rg "invite/:token|invite/:id/resend|invite/:id/revoke|invite/:token/opened|invites/status|invites/stats|application/:id|applications|signatures|documents/upload-url|documents/confirm|documents/:applicationId|contracts/:applicationId|contracts/:contractId/sign|migration-capabilities|test-workflow|diagnostics/:workspaceId|initialize-trinity|submit/:applicationId|pending-review|approve/:employeeId|readiness" server/routes/onboardingInlineRoutes.ts
```

Alive-path verification:

```bash
rg "'/invite'|'/application'|'/certifications'|'/progress'|'/skip'|'/complete'|'/status'|'/create-org/progress'" server/routes/onboardingInlineRoutes.ts
```

## Discrepancies To Communicate

### 1. HRIS cleanup issue found by Jack

Jack found and fixed a real broken leftover in `server/routes/hrisRoutes.ts`:

```text
8baf52f4 — fix: repair hris routes after dead route cleanup
```

Claude should make sure this fix is included before building.

### 2. Deep index stale sections

At Jack's read, `DEEP_ROUTE_INDEX.md` still listed HRIS/Hiring delete rows even though Claude's commit said those were already cleaned.

Claude should refresh `DEEP_ROUTE_INDEX.md` after this pass.

### 3. Onboarding mount wording mismatch

Some older notes mention `/api/sps/onboarding`, but actual current mount is `/api/onboarding` in `server/routes/domains/orgs.ts`.

Use the actual mount.

## Suggested Claude Commit Message

```text
refactor: onboardingInlineRoutes.ts -XL — 25 dead handlers deleted
```

Commit body should include:

- 25 dead handlers deleted
- active groups preserved
- before/after line count
- top path list cleaned
- imports removed
- build result

## Next Target After Claude

After this cleanup:

1. Verify HR is fully clean.
2. Update `DEEP_ROUTE_INDEX.md` and `AGENT_HANDOFF.md`.
3. Move to CLIENT domain: `server/routes/clientRoutes.ts`, mount `/api/clients`.

## Recommended Next Owner

Claude goes next.
