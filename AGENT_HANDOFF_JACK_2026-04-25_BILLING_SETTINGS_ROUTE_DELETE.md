# Jack/GPT Handoff — Billing Settings Route Delete

Branch: `development`
Date: 2026-04-25

## New Runtime Commit

`51db32b4fcf3a5b3366e3b54bf78e6b317dc8505` — `refactor: delete unused billing settings routes`

## File Changed

`server/routes/billingSettingsRoutes.ts`

## What Changed

Deleted four unused billing-settings handlers after caller audit:

- `POST /api/billing-settings/workspace`
- `GET /api/billing-settings/clients`
- `PATCH /api/billing-settings/clients/:clientId`
- `DELETE /api/billing-settings/clients/:clientId`

Kept active routes used by `client/src/pages/billing.tsx`:

- `GET /api/billing-settings/workspace`
- `PATCH /api/billing-settings/workspace`
- `GET /api/billing-settings/clients/:clientId`
- `POST /api/billing-settings/clients/:clientId`
- `GET /api/billing-settings/payment-methods`
- `POST /api/billing-settings/payment-methods/setup-intent`
- `POST /api/billing-settings/payment-methods/set-default/:paymentMethodId`
- `DELETE /api/billing-settings/payment-methods/:paymentMethodId`
- `GET /api/billing-settings/seat-hard-cap`
- `PATCH /api/billing-settings/seat-hard-cap`

## Caller Audit Evidence

Caller searches found `client/src/pages/billing.tsx` for all active route groups:

- workspace settings
- client billing settings
- payment methods
- seat hard cap

Method-specific checks found no caller evidence for:

- `POST /workspace`
- base `GET /clients`
- client `PATCH /clients/:clientId`
- client `DELETE /clients/:clientId`

The active UI uses:

- query key `/api/billing-settings/workspace`
- `PATCH /api/billing-settings/workspace`
- query key `/api/billing-settings/clients`, selectedClientId` which resolves to `/api/billing-settings/clients/:clientId`
- `POST /api/billing-settings/clients/:clientId` for create/update
- payment method list/setup/set-default/delete
- seat-hard-cap GET/PATCH

## Why This Was Safe

The removed routes were either duplicate write shapes or unused convenience/list/delete endpoints:

- Workspace settings writes now use the stronger `PATCH /workspace` path, which syncs `billingSettingsBlob`, workspace mirror columns, `payrollSettings`, and audit log in a transaction.
- Client terms save uses `POST /clients/:clientId`, which already upserts. The separate `PATCH /clients/:clientId` was redundant and showed no caller evidence.
- Base `GET /clients` showed no caller evidence; UI gets clients from `/api/clients` and per-client settings from `/api/billing-settings/clients/:clientId`.
- Client settings delete showed no caller evidence.

## Expected Line Reduction

Approximate reduction: about 125–150 lines.

Claude should verify exact before/after line count locally.

## Build Verification Required

Claude should run:

```bash
node build.mjs
npx tsc -p tsconfig.json --noEmit
```

## Specific Verification Notes

Please verify:

- `client/src/pages/billing.tsx` still loads payroll cycle settings.
- Saving payroll cycle still works via `PATCH /api/billing-settings/workspace`.
- Saving client billing terms still works via `POST /api/billing-settings/clients/:clientId`.
- Payment method setup/default/delete still works.
- Seat hard cap toggle still works.
- No now-unused imports remain in `billingSettingsRoutes.ts`.

Likely imports still used:

- `PLATFORM`
- `Stripe`
- `getCanonicalStripe`
- `insertClientBillingSettingsSchema`
- `clients`
- `clientBillingSettings`
- `payrollSettings`
- `auditLogs`
- `workspaces`
- `eq`, `and`

## AGENT_HANDOFF.md Sync Note

The new protocol says each agent updates `AGENT_HANDOFF.md` after every commit. Jack attempted to fetch it, but the connector returned a truncated long file. Jack did **not** update it because replacing the whole handoff from a truncated view would risk destroying context.

Claude should update the top AGENT SYNC BLOCK locally after pulling/building this commit.

Suggested sync block update:

- WHO GOES NEXT: JACK after Claude build-verifies
- What just happened: Jack deleted 4 unused billing-settings routes
- Billing status: `billingSettingsRoutes.ts` reduced from 600L to verified new line count
- Next Jack target: `stripeInlineRoutes.ts`, audit everything except webhook

## Next Suggested Target After Claude Verification

`server/routes/stripeInlineRoutes.ts`

Rules:

- Do not touch `/webhook` unless absolutely necessary.
- Audit all non-webhook Stripe routes for frontend callers.
- Keep only active Stripe actions.
- Delete dead/non-called routes only after caller audit.

## Notes

This commit follows the current map/rules:

- no new runtime files
- caller audit first
- delete unused routes
- reduce line count
- stay in billing
