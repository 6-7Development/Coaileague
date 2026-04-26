# Jack/GPT Handoff — HR employeeRoutes Audit

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack employeeRoutes HR audit`

## Context

Claude's latest commit:

`d7581aa6b1de2623b3ad0da44e44681758d1695a` — `refactor: TIME domain COMPLETE — timeEntryRoutes.ts -128L`

Claude completed TIME and moved the refactor into HR:

- TIME total removed: about 1,621L
- cumulative removed: about 9,641L across Payroll + Billing + Scheduling + Time
- build clean

Claude assigned Jack:

- read `CODEBASE_INDEX.md` HR section first
- target: `server/routes/employeeRoutes.ts`
- mount: `/api/employees`
- next target after this: `server/routes/hrInlineRoutes.ts`

## Files Read

- `CODEBASE_INDEX.md` HR section
- `server/routes/domains/workforce.ts`
- `server/routes/employeeRoutes.ts` connector-visible portion

Confirmed mount from `workforce.ts`:

```ts
app.use("/api/employees", requireAuth, ensureWorkspaceAccess, employeeRouter);
```

Also note that separate routers are mounted on the same prefix:

```ts
app.use("/api/employees", requireAuth, ensureWorkspaceAccess, clockinPinRouter);
```

This means `/api/employees/*` is shared and must be audited carefully.

## Important Limitation

`employeeRoutes.ts` is large and truncates through the GitHub connector. `update_file` requires replacing the whole file, so Jack did **not** patch runtime code from partial content.

Claude should edit locally with `rg`, build, and update `AGENT_HANDOFF.md`.

## Visible Route Families Audited

Connector-visible routes include at least:

- `PATCH /api/employees/:employeeId/role`
- `PATCH /api/employees/:employeeId/position`
- `PATCH /api/employees/:employeeId/access`

There are more routes after truncation. Claude must inventory the full file locally.

## Active Caller Evidence

### `PATCH /api/employees/:employeeId/role`

Search:

```text
"/api/employees/" "role"
```

Active frontend callers surfaced:

- `client/src/pages/role-management.tsx`
- `client/src/components/employee-edit-dialog.tsx`
- `client/src/pages/employees.tsx`
- `client/src/hooks/useEmployee.ts`
- `client/src/pages/org-management.tsx`
- `client/src/pages/settings.tsx`

Keep.

### `PATCH /api/employees/:employeeId/position`

Search:

```text
"/api/employees/" "position" "client/src"
```

Connector results did not surface a clean direct caller, but the role-management / employee-edit pages from the broader role search likely own role/position mutation UI. Verify locally before changing.

Keep until exact local `rg` confirms otherwise.

### `PATCH /api/employees/:employeeId/access`

Search:

```text
"/api/employees/" "access" "client/src"
```

No clean direct active frontend caller surfaced, but this route performs critical activate/suspend behavior, seat-limit enforcement, audit logging, session invalidation, document-access grace window, and scheduling deactivation side effects.

Do **not** delete casually.

Potential overlap exists with:

- `deactivateRoutes.ts`
- `terminationRoutes.ts`
- possibly `offboardingRoutes.ts`

This should be treated as an overlap/consolidation candidate, not a dead-route candidate.

## Known Shared-Prefix Concern

`/api/employees` is not owned only by `employeeRoutes.ts`.

Other mounted route under same prefix:

- `clockinPinRouter`

Therefore Claude should inventory final registered route order before deleting/modifying paths under `/api/employees`.

## Potential Overlap Areas To Audit Locally

### 1. Employee activation/deactivation/access

Visible route:

- `PATCH /:employeeId/access`

Potential overlapping files:

- `deactivateRoutes.ts`
- `terminationRoutes.ts`
- `offboardingRoutes.ts`
- `owner-employee.ts`

Recommended action:

- Do not delete first.
- Map all active deactivation/suspension/termination endpoints.
- Decide canonical lifecycle path:
  - suspend/reactivate employee
  - terminate/offboard employee
  - owner bootstrap/repair
- Then delete true duplicate legacy route if any.

### 2. Employee documents

Search:

```text
"/api/employees/" "documents" "client/src"
```

No clean active component caller surfaced, only route inventory/docs/audit artifacts.

If document routes exist in the truncated part of `employeeRoutes.ts`, they may overlap with:

- `employeePacketRoutes.ts`
- `onboardingFormsRoutes.ts`
- `hr/documentRequestRoutes.ts`
- document vault/compliance document services

Recommended action:

- Local inventory exact employee document routes.
- If no callers, delete from `employeeRoutes.ts` or move responsibility to HR document/onboarding/compliance domain.

### 3. Clock-in PIN / employee PIN routes

`workforce.ts` mounts `clockinPinRouter` on `/api/employees`.

If `employeeRoutes.ts` has any PIN endpoints, those likely overlap and should be deleted/migrated.

Recommended local search:

```bash
rg "pin|clockin|clock-in|clockIn" server/routes/employeeRoutes.ts server/routes/clockinPinRoutes.ts client server shared
```

### 4. Platform workspace / platform role access

Visible imports:

- `PLATFORM_WORKSPACE_ID`
- `platformRoles`
- `users`
- `workspaces`

These may indicate platform-specific employee repair/list routes in the truncated portion. Verify callers before touching.

## Local Commands For Claude

### 1. Full route inventory

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/employeeRoutes.ts
```

### 2. Mounted prefix inventory

```bash
grep -n "api/employees\|employeeRouter\|clockinPinRouter" server/routes/domains/workforce.ts
```

### 3. Exact caller audit for visible critical routes

```bash
rg "/api/employees/.*/role|employees/.*/role" client server shared
rg "/api/employees/.*/position|employees/.*/position" client server shared
rg "/api/employees/.*/access|employees/.*/access" client server shared
```

### 4. Audit likely overlap areas

```bash
rg "deactivate|activate|suspend|reactivate|terminate|offboard" server/routes/employeeRoutes.ts server/routes/deactivateRoutes.ts server/routes/terminationRoutes.ts server/routes/offboardingRoutes.ts server/routes/owner-employee.ts client server shared
rg "/api/employees/.*/documents|employeeDocuments|employee-documents|document" server/routes/employeeRoutes.ts client server shared
rg "pin|clockin|clock-in|clockIn" server/routes/employeeRoutes.ts server/routes/clockinPinRoutes.ts client server shared
rg "PLATFORM_WORKSPACE_ID|platformRoles|platform role|platformRole" server/routes/employeeRoutes.ts client server shared
```

### 5. Search broad callers

```bash
rg "/api/employees" client/src client/public server tests shared
```

## Recommended Runtime Strategy

Do **not** start by extracting services.

Start with deletion/consolidation:

1. Local route inventory.
2. Identify routes with no caller evidence.
3. Remove clearly dead routes.
4. For overlap routes, leave active route in place and document canonical owner before deleting.
5. Clean imports.
6. Build.

## Possible Delete Candidates After Local Verification

Jack cannot confirm from connector due truncation, but these are likely candidates if they exist in the hidden part of `employeeRoutes.ts` and local caller audit is clean:

- employee document routes duplicated by HR document/onboarding/compliance routes
- old PIN/clock-in identity routes duplicated by `clockinPinRoutes.ts`
- platform repair/debug employee routes with no active caller
- legacy employee access/deactivate aliases if `deactivateRoutes.ts` owns the active path

Do **not** delete:

- `PATCH /:employeeId/role`
- `PATCH /:employeeId/position`
- `PATCH /:employeeId/access`

unless local audit confirms replacement/canonical caller migration. These are sensitive HR mutation paths.

## Required Verification

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Suggested Claude Commit Message

```text
refactor: delete dead employee routes and document HR lifecycle overlaps
```

Commit body should include:

- route inventory count before/after
- exact routes deleted
- active routes preserved
- `employeeRoutes.ts` before/after line count
- any overlap routes intentionally deferred
- build result

## Next Target After Claude

`server/routes/hrInlineRoutes.ts` — 1,795L, mounted at `/api` with full paths inside.

Claude should update `AGENT_HANDOFF.md` sync block locally after runtime cleanup.

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Run local route/caller inventory.
3. Delete confirmed dead employee routes only.
4. Document overlap routes not deleted.
5. Build/type-check.
6. Update `AGENT_HANDOFF.md`.
7. Push.
