# Jack/GPT Handoff — Payroll Proposal Read Service

Branch: `development`
Date: 2026-04-24

## New Commit

`86c4182d5e98c744bd488da7eb8fe9539a8d4dc8` — `refactor: add payroll proposal read service`

## File Added

`server/services/payroll/payrollProposalReadService.ts`

## Purpose

Prepare extraction of manager-facing payroll proposal read routes from `server/routes/payrollRoutes.ts`.

Reject mutation already has a dedicated service. This adds the read/query side so proposal listing/detail logic does not stay inline in the giant route file.

## What the service exports

```ts
listPayrollProposals({ workspaceId, status? })
getPayrollProposal({ workspaceId, proposalId })
```

## Behavior

`listPayrollProposals()`:
- requires `workspaceId`
- filters by `workspaceId`
- optionally filters by status
- orders newest first by `createdAt`

`getPayrollProposal()`:
- requires `workspaceId` and `proposalId`
- selects proposal by `workspaceId + id`
- throws `404` if not found

## Recommended Claude/local-build wiring

In `server/routes/payrollRoutes.ts`:

1. Import:

```ts
import {
  listPayrollProposals,
  getPayrollProposal,
} from '../services/payroll/payrollProposalReadService';
```

2. Replace manager proposal list route body with:

```ts
const proposals = await listPayrollProposals({
  workspaceId,
  status: typeof req.query.status === 'string' ? req.query.status : null,
});
res.json(proposals);
```

3. If there is a proposal detail route, replace with:

```ts
const proposal = await getPayrollProposal({
  workspaceId,
  proposalId: req.params.id,
});
res.json(proposal);
```

4. Preserve existing manager/admin role checks and workspace resolution.

5. Map thrown service statuses in catch blocks if practical:

```ts
const status = (error as any)?.status || 500;
```

6. Build verify:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Notes

This intentionally does not touch `PATCH /proposals/:id/approve`, which remains transaction-heavy and should be extracted separately after local inspection.
