# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Codex (Phase F verification + Phase G audit complete)

---

## TURN TRACKER

```text
Current turn: CLAUDE <- execute Codex Phase F residuals + Phase G integration fixes on development
```

---

## CURRENT COMMIT

```text
origin/development            -> 3f868caef (Railway STABLE GREEN)
origin/refactor/service-layer -> Codex handoff/audit commit after this file update
```

---

## STATUS SNAPSHOT

```text
Phases 1-6 broad refactor:             complete (~97k lines removed)
Phase A auth/session:                  complete
Phase B financial flows:               complete
Phase C scheduling/shift:              complete (Grade A)
Phase D Trinity action flows:          complete
Phase E documents/compliance:          complete (2 larger items queued)
Phase F notifications/broadcasting:    complete with Codex residuals below
Phase G integrations (QB/Stripe/Plaid): audited by Codex; Claude fixes next
```

---

## PHASE F VERIFICATION - CODEX RESULT

Verified good:
- `server/services/notificationDeliveryService.ts:331-368` now has insert-on-conflict delivery dedupe plus a conditional `UPDATE ... WHERE status IN ('pending','retrying') RETURNING` claim. This matches Codex's intent.
- `server/services/notificationDeliveryService.ts:707-720` and `server/routes/notifications.ts:1647-1653` now scope notification ack by `notificationId + recipientUserId + workspaceId`.
- `server/services/panicAlertService.ts:191-231` now has expected-status conditional guards for acknowledge/resolve.
- `server/services/notificationPreferenceService.ts:176-180` makes `panic_alert`, `duress_alert`, `incident_alert`, and `security_threat` bypass quiet hours/channel opt-outs. This is good enough for current panic paths because panic alerts still emit `incident_alert`; canonical `panic_alert` naming can be cleaned up later.
- `server/routes/stripeInlineRoutes.ts:517-570` shows the Stripe webhook route now uses DB-backed `stripeWebhookService.handleEvent()` dedupe before the AI bridge, so local memory cache is only a fast path.

Residuals Claude should carry while in this area:

### F-RESIDUAL-P0 - SMS send path still mismatches IDs vs phone numbers

- Files:
  - `server/services/notificationDeliveryService.ts:540-559`
  - `server/routes/smsRoutes.ts:61-74`, `86-97`, `130-140`, `169-179`, `214-224`, `248-259`
- Problem: `deliverSMS()` picks `sendSMSToUser()` whenever `record.recipientUserId` is set. Existing SMS routes pass employee IDs, client phone strings, or direct target phones through fields that land in NDS as `recipientUserId` or payload phone. Result: employee/client/direct SMS can fail lookup or send to the requester instead of the intended target phone.
- Exact fix: Normalize NDS recipient addressing before send. Use explicit mutually exclusive fields: `recipientUserId`, `recipientEmployeeId`, and `phone`. In `deliverSMS()`, route user IDs to `sendSMSToUser()`, employee IDs to `sendSMSToEmployee()`, and direct phone numbers to consent/log-aware `sendSMS()`. Update `smsRoutes.ts` call sites so direct phone sends never masquerade as user IDs. Add targeted tests for direct phone, employee, and user recipients.

### F-RESIDUAL-P1 - Manager notification send route is gated but still not Grade A

- File: `server/routes/notifications.ts:1662-1674`
- Problem: `/api/notifications/send` is now `requireManager`, but it still trusts free-form body fields and does not verify the target recipient belongs to the same workspace before enqueueing.
- Exact fix: Add Zod validation for recipient, channel/type/priority, and payload shape. Verify target user/employee/client membership in `workspaceId` before calling NDS. Fail closed on unknown recipient kind.

### F-RESIDUAL-P1 - Broadcast/role notification targets can include inactive employees

- File: `server/services/universalNotificationEngine.ts:520-522`, `603-605`
- Problem: Role-target lookups still filter `employees.isActive = true` but not canonical employee status. Terminated/suspended employees can still be selected if `isActive` is stale.
- Exact fix: Add `employees.status` exclusion/allowlist matching the scheduling hardening standard, preferably a shared helper for "deliverable employee".

---

## PHASE G - CODEX AUDIT FINDINGS (CLAUDE EXECUTE)

Integrations audited: QuickBooks, Stripe, Plaid.

Target file map correction:
- The handoff's old paths `server/routes/quickbooksRoutes.ts`, `server/routes/stripeRoutes.ts`, `server/routes/stripeWebhooks.ts`, `server/services/billing/quickbooksService.ts`, and `server/services/plaidService.ts` do not exist on this branch.
- Actual paths audited:
  - `server/routes/quickbooks-sync.ts`
  - `server/services/partners/quickbooksSyncService.ts`
  - `server/services/integrations/quickbooksWebhookService.ts`
  - `server/services/oauth/quickbooks.ts`
  - `server/routes/stripeInlineRoutes.ts`
  - `server/services/billing/stripeWebhooks.ts`
  - `server/services/billing/stripeEventBridge.ts`
  - `server/services/billing/stripeClient.ts`
  - `server/routes/billing-api.ts`
  - `server/routes/plaidRoutes.ts`
  - `server/routes/plaidWebhookRoute.ts`
  - `server/services/partners/plaidService.ts`
  - `server/services/payroll/achTransferService.ts`

### G-P0-1 - Plaid employee direct-deposit linking lets any workspace user alter any employee bank account

- Files:
  - `server/routes/plaidRoutes.ts:198-216`
  - `server/routes/plaidRoutes.ts:223-294`
- Problem: Employee link-token and exchange endpoints use `requireAuth` only. They verify that `employeeId` belongs to the current workspace, but not that the requester is that employee or a manager/owner with payroll authority. Any authenticated workspace user who knows an employee ID can create/exchange a Plaid public token and overwrite that employee's primary direct-deposit account, with `isVerified=true`.
- Exact fix:
  1. Add an employee ownership guard: field employees can only link their own employee record; managers/owners need explicit payroll/HR authority.
  2. Add server-side Plaid link session state: persist `linkToken`, `workspaceId`, `employeeId`, `userId`, `purpose`, and expiry when creating the token; require the exchange to match that session before writing a bank account.
  3. Write an audit event for every org/employee bank add/update/disconnect, including actor, target employee, workspace, institution, and last4.
  4. Add tests for employee self-link allowed, employee linking another employee denied, manager allowed, cross-workspace denied, and mismatched link-token session denied.

### G-P0-2 - Plaid payroll ACH initiation has no funding balance check and still uses raw money math/state writes

- Files:
  - `server/services/payroll/achTransferService.ts:57-155`
  - `server/services/payroll/achTransferService.ts:157-188`
  - `server/services/partners/plaidService.ts:197-271`
- Problem: `initiatePayrollAchTransfer()` accepts `amount: number`, writes `amount.toFixed(2)`, and sends the same raw number string to Plaid. It checks that the org funding bank exists, but never decrypts/uses the org funding account for a balance/funds check before creating the employee transfer. It also creates the transfer-attempt row and then updates payroll/pay-stub state in separate non-transactional statements, with no expected-status guard and no local idempotency record keyed by `idempotencyKey`.
- Exact fix:
  1. Accept amount as string/Decimal-safe value and format via `FinancialCalculator`/decimal helper only. Reject `<= 0`.
  2. Decrypt org funding token and call `getAccountBalance()` for `orgFinance.plaidAccountId`; fail closed to `payment_held` when available/current funds are insufficient or unavailable in production.
  3. Store `idempotencyKey` on `plaidTransferAttempts` with a unique constraint or `onConflictDoNothing`; return the existing transfer/attempt on duplicate.
  4. Wrap local DB state changes in `db.transaction()` after the Plaid API call returns, and update `payrollEntries`/`payStubs` only from an expected prior state such as approved/ready/pending-ach.
  5. Keep external Plaid call outside the transaction, but record a compensating failed/held attempt if DB update fails.

### G-P1-1 - QuickBooks manual-review resolution is workspace-IDOR and can link entities across tenants

- Files:
  - `server/routes/quickbooks-sync.ts:232-248`
  - `server/services/partners/quickbooksSyncService.ts:2150-2200`
- Problem: The list route scopes by `workspaceId`, but the resolve route only passes `itemId` into `resolveManualReview()`. The service fetches by `partnerManualReviewQueue.id` only, then inserts a mapping using `item.workspaceId`. A user from workspace B who can guess a review item ID from workspace A can resolve/link it.
- Exact fix: Pass `workspaceId` into `resolveManualReview()`. Fetch the review item with `id + workspaceId + status='pending'`. Verify `selectedCoaileagueEntityId` belongs to that same workspace and entity type before creating a mapping. Wrap mapping insert + queue update in one `db.transaction()`, and use an expected-status guard on the queue update.

### G-P1-2 - QuickBooks invoice creation uses raw money math and non-atomic idempotency claim

- Files:
  - `server/routes/quickbooks-sync.ts:65-74`
  - `server/routes/quickbooks-sync.ts:124-150`
  - `server/services/partners/quickbooksSyncService.ts:1715-1728`
  - `server/services/partners/quickbooksSyncService.ts:1761-1896`
- Problem: API validation accepts `amount: z.number().positive()`, then the service hashes raw numbers, sums with `reduce((sum, l) => sum + l.amount, 0)`, sends `Amount: item.amount`, and computes `UnitPrice: item.amount / item.hours`. The idempotency check is SELECT then INSERT, so concurrent identical requests can both pass before either inserts unless a DB constraint saves it.
- Exact fix: Use string/decimal input at the API boundary, format QBO amount/unit price through FinancialCalculator helpers, and remove unused `totalAmount`. Claim idempotency with atomic insert-on-conflict returning by `(partnerConnectionId, requestId)` before any QBO call. Include workspace in idempotency lookup. Add a concurrency test that two identical invoice requests create one QBO invoice/idempotency row.

### G-P1-3 - QuickBooks webhook dedupe is memory-only in the processing service

- Files:
  - `server/routes/quickbooks-sync.ts:256-334`
  - `server/services/integrations/quickbooksWebhookService.ts:134-148`
  - `server/services/integrations/quickbooksWebhookService.ts:218-232`
- Problem: Route-level HMAC verification is present and uses raw body. However `QuickBooksWebhookService` dedupes CloudEvent/entity keys in `processedEventIds: Set`, which is lost on restart and not safe across Railway multi-replica. Duplicate QBO webhooks after restart can re-run partner data changes and emit duplicate platform events.
- Exact fix: Replace in-memory dedupe with the shared DB webhook idempotency table/service (`tryClaimWebhookEvent('quickbooks', eventKey, ...)`) before `processEntityChange()`. Keep the Set only as a fast-path after DB claim, matching the Stripe pattern.

### G-P1-4 - Plaid webhook route acknowledges before signature verification and has a production bypass edge

- Files:
  - `server/routes/plaidWebhookRoute.ts:31-50`
  - `server/services/partners/plaidService.ts:337-347`
  - `server/index.ts:399-409`
- Problem: The Plaid route returns 200 before verifying `Plaid-Verification`. If credentials/header/config are wrong, a real Plaid event is lost because Plaid sees success. `verifyPlaidWebhookJwt()` also returns true whenever Plaid credentials are missing, regardless `NODE_ENV`. The route does not need raw-body capture for JWT verification, so absence from `webhookPathsNeedingRawBody` is not the problem.
- Exact fix: Verify JWT before acknowledging when credentials are configured. In production, missing Plaid credentials or missing verification header must return non-2xx and log critical. Keep application-level processing errors 200 after successful signature/idempotency claim to avoid retry storms.

### G-P1-5 - Stripe webhook processing is durable, but raw money math remains in billing/integration paths

- Files:
  - `server/services/billing/stripeWebhooks.ts:500-580`
  - `server/services/billing/stripeWebhooks.ts:627-735`
  - `server/services/billing/stripeWebhooks.ts:774-833`
  - `server/services/billing/stripeWebhooks.ts:1312-1325`
  - `server/services/billing/stripeWebhooks.ts:1391-1444`
  - `server/services/billing/stripeWebhooks.ts:1491-1495`
  - `server/services/billing/stripeWebhooks.ts:1893-1935`
  - `server/services/billing/stripeEventBridge.ts:148-174`, `191-207`
  - `server/routes/billing-api.ts:188-210`, `963-974`, `1141`
- Problem: Stripe event idempotency is good (`processedStripeEvents` insert-on-conflict). But Stripe amount conversions still use raw `/ 100`, `parseFloat`, `Math.min`, arithmetic fee formulas, and `toFixed()` before ledger writes, notifications, and API pricing responses. This violates the project standard and risks rounding drift.
- Exact fix: Add Stripe cents-to-decimal helpers backed by FinancialCalculator, e.g. `centsToMoneyString()`, `formatMoney()`, `calculateStripeCardFee()`, `calculateStripeAchFee()`. Replace raw conversions and fee arithmetic in the files above. Keep integer cents in Stripe metadata where useful, but all ledger amounts/display strings should come from helpers.

### G-P2-1 - QuickBooks route authorization is tier-based, not role-based

- File: `server/routes/quickbooks-sync.ts:78-160`, `213-248`, `348-460`
- Problem: Mutating QuickBooks routes use `requireAuth, requireProfessional`. That appears to enforce subscription/tier, not finance/manager authority. If an employee in a Professional workspace can hit these routes, they can trigger syncs, create invoices, and resolve accounting mappings.
- Exact fix: Add `ensureWorkspaceAccess` where absent and require manager/owner/finance permission for sync, invoice creation, CDC, review resolution, and staffing-client sync. Keep `requireProfessional` as a subscription gate only.

### Phase G validation checklist for Claude

After fixes:
1. Run typecheck.
2. Add/adjust tests for Plaid employee direct-deposit ownership and link-token session binding.
3. Add tests for Plaid ACH duplicate idempotency key, insufficient org funds, and expected-status guard.
4. Add QuickBooks manual-review workspace IDOR regression test.
5. Add QuickBooks invoice duplicate/concurrency/idempotency test if harness allows.
6. Run the standard boot test before pushing to development.

---

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
Every generated document must be a real branded PDF durably saved to tenant vault.
No Trinity action mutation without workspace scope, fail-closed gates, audit trail.
Trinity is one individual. No mode switching. HelpAI is the only bot field workers see.
```

---

## QUEUED - POST-AUDIT PHASES (Pre-Go-Live Enhancement Sprint)

Bryan has locked these as the next phase after all audit phases complete:

### Core Infrastructure
- RBAC + IRC mode consolidation.
  RBAC owns permissions. Room type owns behavior. IRC modes = internal routing only.
  `server/websocket.ts` has heavy mode-based branching to collapse into room-type + RBAC checks.
- Action registry consolidation below 300.
- E-P0-2: compliance report PDF service (real PDF + vault, not placeholder JSON).
- E-P1-5: compliance document vault intake service.

### ChatDock Enhancement Sprint
Priority sequence:
1. Durable message store + Redis pub/sub.
2. FCM push + four-tier delivery pyramid (WS -> FCM -> RCS -> SMS).
3. Typed WebSocket event protocol for Trinity/HelpAI streaming.
4. Read receipts + acknowledgment receipts for post orders.
5. Message replies, pins, polls, media gallery, room archive, search.
6. Presence tied to shift status (connected/offline/NCNS).
7. HelpAI scheduled messages + shift close summary cards.
8. Content moderation pipeline + report queue + legal hold + evidence export.
9. Live call/radio button (WebRTC already wired).
10. Async voice messages + Whisper transcription.

KEEP: emoji reactions, basic emoticons, emoji picker, practical acknowledgments (Seen/Acknowledged/Reviewed), curated professional reaction set for client-visible rooms.
SKIP: stickers, games, themes, chat color customization, word effects, consumer gimmicks.

Architecture principle: Room type = behavior. RBAC = permission. Workspace/client settings = visibility.

### Holistic Enhancement Audit
- All services as unified whole: ChatDock, email, forms, PDF (tax/paychecks/ACH), workflows, automations, storage.
- Research best-in-class platforms, then match and exceed them.
- Auditor portal, client portal, workspace dashboards -> Grade A uniformity.
- Login/logout/session persistence verification.
- All buttons/icons that trigger actions -> verify correct workflow outcomes.
- Enhance, fix, and simplify holistically.

### Trinity Biological Brain
- Revisit Gemini+Claude+GPT triad wiring for best-in-class setup.
- Three agents genuinely inform each other's reasoning before Trinity speaks, not just routing.
- Enhance Trinity's proactive operating behavior, consciousness, personality depth.
- Goal: feels like one unified intelligent being.

### UI Polish
- Seasonal/holiday theming restored as public-page-only.
- Mobile offline-first (op-sqlite, optimistic sends, NetInfo sync).
- Client portal as separate read-only surface.
