# Jack/GPT Handoff — hrInlineRoutes Delete List

Branch: `development`
Date: 2026-04-25

## New Commit

This file: `docs: add Jack hrInlineRoutes delete list from deep index`

## Context

Claude's latest commit:

`b77469fd799928cb4a5f5167ece7752035fcc01e` — `docs: DEEP_ROUTE_INDEX.md — pre-audited route map Jack reads instead of opening files`

Important update from Claude/Bryan:

- `employeeRoutes.ts` is DONE: `2,452 -> 1,541` lines, `-911L`
- HR partial total: `-911L`
- cumulative removed: about `10,552L`
- new file `DEEP_ROUTE_INDEX.md` pre-audits the next route files so Jack does not need full-file connector visibility

## Target

`server/routes/hrInlineRoutes.ts`

Mount:

```ts
app.use("/api", requireAuth, ensureWorkspaceAccess, hrInlineRouter);
```

Therefore all route paths below are full `/api/*` paths at runtime.

## Pre-Audited Status From DEEP_ROUTE_INDEX.md

`hrInlineRoutes.ts`:

- before: `1,795L`
- status: `13 alive / 17 dead`
- action: delete 17 dead routes

## Dead Routes To Delete — 17 Total

Claude should remove these handlers from `server/routes/hrInlineRoutes.ts`:

```text
GET    /i9-records/:employeeId
GET    /manager-assignments/manager/:managerId
GET    /manager-assignments/employee/:employeeId
DELETE /manager-assignments/:id
PATCH  /organizations/:orgId/status
GET    /organizations/:orgId/members
GET    /employee/disputeable-items
GET    /employee-reputation/:employeeId
DELETE /invites/:id
GET    /hr/pto-balances
GET    /hr/pto-balances/:employeeId
GET    /hr/review-reminders/summary
GET    /hr/review-reminders/overdue
GET    /hr/review-reminders/upcoming
POST   /organization-onboarding/start
PUT    /organization-onboarding/:id
POST   /organization-onboarding/:id/complete
```

## Alive Routes To Preserve — 13 Total

Do not delete these:

```text
GET  /i9-records
GET  /i9-records/expiring
POST /manager-assignments
GET  /organizations/managed
GET  /employee/audit-record
POST /invites/create
POST /invites/accept
GET  /invites
POST /hr/pto-accrual/run
GET  /organization-onboarding/status
GET  /experience/notification-preferences
POST /experience/notification-preferences
GET  /manager/command-center
GET  /shift-actions/pending
```

Note: DEEP_ROUTE_INDEX says `13 alive` but lists 14 alive rows if counted literally. Claude should verify route count locally after deletion. The important instruction is preserve every alive route listed above.

## Required Local Verification

Claude should run:

```bash
grep -n "router\.\(get\|post\|put\|patch\|delete\)" server/routes/hrInlineRoutes.ts
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

After deletion, verify no dead path remains:

```bash
rg "i9-records/:employeeId|manager-assignments/manager|manager-assignments/employee|organizations/.*/status|organizations/.*/members|disputeable-items|employee-reputation|pto-balances|review-reminders|organization-onboarding/start|organization-onboarding/.*/complete" server/routes/hrInlineRoutes.ts
```

## Suggested Claude Commit Message

```text
refactor: hrInlineRoutes.ts -XL — 17 dead routes deleted
```

Commit body should include:

- exact before/after line count
- deleted route list
- preserved route count
- build result

## Next Target After Claude

Use `DEEP_ROUTE_INDEX.md` next.

Likely next HR targets require local audit because the deep index only gives commands:

- `hrisRoutes.ts` mounted `/api/hris`
- `hiringRoutes.ts` mounted `/api/hiring`
- `onboardingRoutes.ts` mounted `/api/onboarding`
- `offboardingRoutes.ts` mounted `/api/offboarding`
- `terminationRoutes.ts` mounted `/api/terminations`
- `performanceRoutes.ts` mounted `/api/performance`
- `trainingRoutes.ts` mounted `/api/training`
- `benefitRoutes.ts` mounted `/api/benefits`

Claude should update `AGENT_HANDOFF.md` after runtime deletion.

## Recommended Next Owner

Claude goes next.

Claude action:

1. Pull latest development.
2. Delete the 17 dead `hrInlineRoutes.ts` handlers.
3. Clean imports.
4. Build/type-check.
5. Update `AGENT_HANDOFF.md` sync block.
6. Push.
