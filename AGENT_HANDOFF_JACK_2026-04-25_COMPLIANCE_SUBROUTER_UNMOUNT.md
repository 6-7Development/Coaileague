# Jack/GPT Handoff — Compliance Subrouter Unmount

Branch: `development`
Date: 2026-04-25

## Sync Check

Jack confirmed `development` at:

```text
70525fe934017d5e966c37d404e09b6f1f8f23aa
```

Claude's CLIENT cleanup is visible and confirmed complete.

## Runtime Commit

```text
55573fe8d2b32b5162aa15bce1c5613fea8c1f78 — refactor: unmount dead security compliance subrouters
```

## File Changed

```text
server/routes/compliance/index.ts
```

## What Changed

Removed zero-caller `/api/security-compliance/*` submounts from the compliance index router:

```text
/api/security-compliance/requirements
/api/security-compliance/audit-trail
/api/security-compliance/checklists
/api/security-compliance/packets
/api/security-compliance/regulatory-portal
```

Removed their imports from `server/routes/compliance/index.ts`:

```ts
requirementsRoutes
auditTrailRoutes
checklistsRoutes
packetsRoutes
regulatoryPortalRoutes
```

## Active Submounts Preserved

Preserved caller-backed `/api/security-compliance/*` submounts:

```text
/states
/document-types
/records
/documents
/approvals
/regulator
/enforcement
/matrix
```

## Caller Audit Evidence

### Preserved — active callers found

```text
/api/security-compliance/states
/api/security-compliance/document-types
/api/security-compliance/records
/api/security-compliance/documents
/api/security-compliance/approvals
/api/security-compliance/regulator
/api/security-compliance/enforcement
/api/security-compliance/matrix
```

Frontend callers surfaced in compliance pages such as:

```text
client/src/pages/compliance/index.tsx
client/src/pages/compliance/employee-detail.tsx
client/src/pages/compliance/approvals.tsx
client/src/pages/compliance/regulator-access.tsx
client/src/pages/compliance/regulator-portal.tsx
client/src/pages/compliance/auditor-portal.tsx
client/src/pages/compliance-matrix.tsx
```

### Removed — no caller evidence found

Searches returned no active callers for:

```text
/api/security-compliance/requirements
/api/security-compliance/audit-trail
/api/security-compliance/checklists
/api/security-compliance/packets
/api/security-compliance/regulatory-portal
```

Important nuance: `regulatoryPortalRoutes` is still live under a different canonical mount:

```text
/api/compliance/regulatory-portal
```

That path has active callers. This commit only removed the unused duplicate `/api/security-compliance/regulatory-portal` mount.

## Why This Was Safe

This was a mount cleanup only. It did not delete route implementation files yet.

It removes stale public surfaces from `/api/security-compliance` while leaving the actual modules intact for Claude to verify locally.

## Claude Build Verification Required

Claude should run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Claude Follow-Up Candidate

If build passes and local `rg` confirms no remaining imports, delete the now-orphaned files:

```text
server/routes/compliance/requirements.ts
server/routes/compliance/auditTrail.ts
server/routes/compliance/checklists.ts
server/routes/compliance/packets.ts
```

Do **not** delete:

```text
server/routes/compliance/regulatoryPortal.ts
```

because it is still imported and mounted separately at:

```text
/api/compliance/regulatory-portal
```

Local verification:

```bash
rg "requirementsRoutes|auditTrailRoutes|checklistsRoutes|packetsRoutes" server/routes server/services client shared
rg "regulatoryPortalRoutes" server/routes/domains/compliance.ts server/routes/compliance/index.ts server/routes/compliance
```

## Next Compliance Audit Targets

After Claude verifies/deletes orphan files:

1. `licenseRoutes.ts` / license dashboard mount audit
2. `officerCertificationRoutes.ts` under `/api/training/certification`
3. large enforcement router `server/routes/complianceRoutes.ts` under `/api/enforcement`
4. compliance reports / evidence routes

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Confirm tip includes `55573fe8`.
3. Build/type-check.
4. Delete orphan files if local `rg` confirms no imports.
5. Update `AGENT_HANDOFF.md` and `DEEP_ROUTE_INDEX.md`.
6. Push and verify remote tip.
