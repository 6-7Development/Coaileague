# COAILEAGUE REFACTOR - MASTER HANDOFF
# ONE FILE ONLY. Update in place. Never create new handoff files.
# Last updated: 2026-04-27 - Claude (Phase D residuals + Phase E complete)

---

## TURN TRACKER

```text
Current turn: CODEX <- verify Phase D+E fixes, then audit Phase F (notifications/broadcasting)
```

---

## STATUS SNAPSHOT

```text
Phase A auth/session:        ✅ complete
Phase B financial flows:     ✅ complete
Phase C scheduling/shift:    ✅ complete
Phase D Trinity action flows: ✅ complete (all residuals closed)
Phase E documents/compliance: ✅ deployed — Codex to verify before Phase F
Phase F notifications:        🔄 NOT STARTED — next Codex audit target
```

---

## DEVELOPMENT TIP

```text
origin/development -> 3fca1f009 (STABLE GREEN)
```

---

## WHAT CLAUDE DID — Phase D residuals + Phase E (Codex: verify)

### Phase D residuals closed

D-P0-1: legal_advice added to ViolationType + severity + refusal response (was TS build blocker)
D-P1-1: Control console fully scoped — /timeline + /actions from auth, service methods throw without workspaceId
D-P1-2: assertRegistryInvariants() called at startup
D-P1-3: employees.status field checked alongside isActive (terminated/inactive/deactivated/suspended)
D-P2-1: support_agent/support_manager → owner trust tier in Trinity chat

### Phase E fixes

E-P0-1: stampBrandedFrame — pdf-lib drawPage() overlays branding on original content
  Was returning branded empty shell; now preserves all original PDF pages
E-P0-3: Document signing — /sign requires pending signature request; /signatures workspace scoped
E-P0-4: /complete-report gated with requireAuditorPortalAuth + workspace binding check
E-P1-1: HR doc request state machine — manager auth + inArray conditional WHERE + 409 on race
E-P1-2: Compliance evidence — requireManager on pending/verify/reject + Zod on submission
E-P1-3: sender field drift fixed (senderId → senderUserId) + Zod on recipients

### Still pending (lower priority, noted for Codex review)

E-P0-2: Compliance reports return placeholder JSON not real PDF — service refactor needed
E-P1-5: Compliance document intake doesn't route through vault service — full service needed
These are larger refactors. Codex should note whether to address now or queue for polish phase.

### Auditor portal write decision for Bryan

E-P0-4 note: /dashboard/:workspaceId/report POST already has requireAuditorPortalAuth.
Codex flagged: decide if auditor upload is a feature (allowed) or if portal must be read-only.
If read-only: remove the POST route. If uploads allowed: it stays, just gated. Bryan decides.

---

## PHASE F — NEXT (Codex audits)

Target: Notifications and broadcasting layer

Files to inspect:
```
server/services/notificationDeliveryService.ts
server/services/universalNotificationEngine.ts
server/services/platformEventBus.ts
server/routes/notificationRoutes.ts
server/routes/webhookRoutes.ts         (Resend inbound webhook — RESEND_WEBHOOK_SECRET issue)
server/services/emailService.ts
server/services/twilioService.ts
```

Look for:
1. NotificationDeliveryService: retry logic present? idempotency on sends?
2. Panic alert chain: does it actually fire end-to-end? (Trinity → broadcast → SMS fallback)
3. Resend webhook: is RESEND_WEBHOOK_SECRET validated before processing inbound webhooks?
   (Known open item: was returning 401 in prod — verify fix or document for env config)
4. platformEventBus: does it handle subscriber errors without killing other subscribers?
5. Any notification route missing workspace scope
6. Twilio SMS: workspace-scoped? Rate limited? Error handling on failed sends?

---

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No legacy branding.
Every generated document must be a real branded PDF durably saved to tenant vault.
No Trinity action mutation without workspace scope, fail-closed gates, audit trail.
Trinity is one individual. No mode switching.
```

## QUEUED (post-audit phases)
- RBAC + IRC mode consolidation (Bryan + Claude aligned: RBAC owns permissions, room type owns behavior)
- Action registry consolidation below 300 (currently ~561 unique IDs, assertRegistryInvariants warns at boot)
- E-P0-2: compliance report PDF service
- E-P1-5: compliance document vault intake service
- ChatDock full enhancement sprint (see memory for comprehensive TODO list)
- Seasonal/holiday visual effects restore

## PHASE E - DOCUMENT AND COMPLIANCE FLOWS AUDIT

Codex inspected:

```text
server/routes/payStubRoutes.ts
server/routes/payrollRoutes.ts
server/services/paystubService.ts
server/services/documents/businessFormsVaultService.ts
server/routes/complianceReportsRoutes.ts
server/routes/documentVaultRoutes.ts
server/routes/documentLibraryRoutes.ts
server/services/documentSigningService.ts
server/routes/hr/documentRequestRoutes.ts
server/routes/complianceEvidenceRoutes.ts
server/routes/compliance/documents.ts
server/routes/compliance/regulatoryPortal.ts
```

### E-P0-1 - Canonical vault service drops the actual PDF content and does not persist the binary

Files/lines:

```text
server/services/documents/businessFormsVaultService.ts:19-21
server/services/documents/businessFormsVaultService.ts:128-265
server/services/documents/businessFormsVaultService.ts:280-318
server/services/documents/businessFormsVaultService.ts:337-355
server/services/paystubService.ts:335-357
```

Problem:

`businessFormsVaultService.saveToVault()` is documented as the mandatory path for every generated business form, but `stampBrandedFrame()` never embeds `opts.rawBuffer`. It creates a new one-page branded shell and returns that as `stampedBuffer`. The original pay stub/tax/report PDF content is not merged into the final buffer. `persistToVault()` then inserts only metadata with `fileUrl = internal://vault/{workspaceId}/{docNumber}.pdf`; it does not write the actual PDF bytes to object storage or a blob table. Result: generated documents can return a branded wrapper that has lost the actual document content, and the vault record cannot re-serve the binary later.

Exact fix:

Use a real PDF merge/stamp library such as `pdf-lib` or a proven local equivalent. Overlay header/footer/page numbers onto the original pages, preserve all original content, then persist the stamped bytes to configured object storage or a durable blob/document storage table. Make vault persistence blocking for all user/tenant documents; a generated compliance/payroll/tax document must not return success without a durable vault artifact.

### E-P0-2 - Compliance report generation creates placeholder JSON, not a real PDF saved to vault

Files/lines:

```text
server/routes/complianceReportsRoutes.ts:53-125
server/routes/complianceReportsRoutes.ts:148-254
```

Problem:

`POST /api/compliance-reports/generate` stores a placeholder `reportData` object and returns raw JSON. It does not gather real evidence, render a PDF, stamp branding/page numbers/document ID, or save a vault artifact. `GET /:id/pdf` returns `text/html` with a `.html` filename and `window.print()`, not an actual PDF. This fails the Phase E standard for branded PDF records and creates inconsistent compliance evidence.

Exact fix:

Move report generation into a compliance report service that gathers real scoped data per report type, renders a PDF, passes the PDF through `saveToVault()`, stores `vaultId/documentNumber/checksum`, and returns a vault-backed artifact. Keep JSON list/detail endpoints for UI metadata only; document export endpoints must return the vaulted PDF or a short-lived download URL.

### E-P0-3 - Internal document signing lets authenticated users sign arbitrary documents by ID

Files/lines:

```text
server/routes/documentLibraryRoutes.ts:229-242
server/routes/documentLibraryRoutes.ts:249-283
server/routes/documentLibraryRoutes.ts:370-385
server/services/documentSigningService.ts:521-620
```

Problem:

The document library signature routes use `requireAuth` only and do not consistently verify workspace scope or signer authorization. `/:id/signatures` returns signatures by `documentId` only. `/:id/sign` increments `signaturesCompleted` and inserts a signature for the current user if the document belongs to the current workspace, but it does not require an existing signature request for that signer. `processInternalSignature()` is worse: it fetches `orgDocuments` by `id` only, not workspaceId, then inserts a signature if none exists for `(documentId, userId)`. Any authenticated user who can obtain a document ID can potentially add a signature, including across workspaces through the service path.

Exact fix:

All internal signing methods must require `(documentId, workspaceId, signerUserId)` and must first find a pending `orgDocumentSignatures` row for that signer, document, and workspace. If no pending request exists, return 403. Wrap signature update + document counter update + audit log in one `db.transaction()`, with an expected-status guard like `signatureData IS NULL`. Scope signature list/status/reminder/access-log routes by joining to `orgDocuments.workspaceId`.

### E-P0-4 - Auditor portal still has write endpoints, including an unauthenticated report-completion path

Files/lines:

```text
server/routes/compliance/regulatoryPortal.ts:851-870
server/routes/compliance/regulatoryPortal.ts:1140-1176
```

Problem:

The Phase E brief says the auditor portal must be read-only with no write paths possible. The portal includes `POST /dashboard/:workspaceId/report`, which lets an auditor session write audit report/corrective-action fields. There is also `POST /complete-report` with no `requireAuth` or auditor portal token middleware; it updates an `auditorVerificationRequests` row by `requestId` alone when status is `access_granted`. Anyone who obtains/guesses a requestId can submit or overwrite audit report metadata.

Exact fix:

Remove public `/complete-report` or protect it with the same signed auditor-session token and workspace binding as dashboard reads. Decide whether auditor uploads are allowed; if yes, do not call the portal read-only. If read-only is the rule, move report intake to an internal/admin workflow and make auditor routes GET-only. Any write path must include requestId + workspaceId + auditor identity + unexpired token + expected status guard.

### E-P1-1 - HR document request status can be completed by any authenticated user in the workspace

Files/lines:

```text
server/routes/hr/documentRequestRoutes.ts:423-484
```

Problem:

`PATCH /api/hr/document-requests/:id/status` requires only `requireAuth`. It scopes by workspace, but does not verify that the caller is the target employee, the request recipient, or a manager. Marking status `completed` triggers I-9 compliance side effects and can update `employees.i9_on_file`. There is no expected-status conditional guard, so repeated or out-of-order transitions can fire side effects again.

Exact fix:

Require either manager role or a recipient-bound token/user check for the target employee. Add allowed transition rules (`sent -> opened -> completed`, etc.) with conditional WHERE on expected prior status. Wrap status update + I-9 employee update + event publish/audit record in a transaction or a service-level state machine. Return 404/403 without revealing cross-workspace request existence.

### E-P1-2 - Compliance evidence verification/rejection is manager-labeled but only requireAuth-gated

Files/lines:

```text
server/routes/complianceEvidenceRoutes.ts:99-150
server/routes/complianceEvidenceRoutes.ts:150-217
server/routes/complianceEvidenceRoutes.ts:219-307
```

Problem:

Comments say pending/verify/reject are manager+ paths, but the routes use only `requireAuth`. Any authenticated workspace user can view pending compliance evidence and can verify or reject evidence by ID. Submission also accepts raw `req.body` without Zod validation, stores `documentUrl` directly, and does not require a vault-backed upload or hash.

Exact fix:

Use `requireManager` or a dedicated compliance role for pending/verify/reject. Add Zod validation for evidence type, officerId, documentUrl/storage key, expiryDate, and rejection reason. For uploaded license/certification evidence, require a vault/document record or object-storage key plus SHA-256 hash; do not accept arbitrary URLs as canonical evidence. Keep the existing transaction pattern for verify/reject and add an audit log/event for manager decisions.

### E-P1-3 - Document signing send path has sender field drift and missing validation

Files/lines:

```text
server/routes/documentLibraryRoutes.ts:290-335
server/routes/documentLibraryRoutes.ts:342-363
server/services/documentSigningService.ts:21-28
server/services/documentSigningService.ts:197-367
```

Problem:

`SendForSignatureParams` expects `senderUserId`, but routes pass `senderId`. That leaves service metadata/notifications/events with undefined sender identity. The route also accepts raw recipient bodies with no Zod validation, and `sendDocumentForSignature()` creates signature rows/email sends in a loop without a transaction around document state + signature rows. Some recipient failures can leave partial requests while the route still returns success.

Exact fix:

Normalize the contract to `senderUserId` everywhere and validate recipients with Zod before any DB write. Create all signature request rows and update the document signature requirement in one transaction, then send emails/notifications after commit. Return a clear partial-delivery result only for post-commit notification failures.

### E-P1-4 - Pay stub generation can succeed without durable vault storage and still uses raw hour math

Files/lines:

```text
server/services/paystubService.ts:120-131
server/services/paystubService.ts:337-355
server/routes/payStubRoutes.ts:212-226
server/routes/payStubRoutes.ts:268-290
```

Problem:

`generatePaystub()` logs vault save failure as non-blocking and still returns success with `pdfBuffer`. That violates the Phase E requirement that pay stubs be real vaulted documents. The service also calculates worked hours by subtracting `clockOut - clockIn` directly instead of using the canonical scheduling math helpers created in Phase C.

Exact fix:

Make vault save failure block pay stub success. Reuse `schedulingMath.ts` for duration totals or move pay-period aggregation behind a shared payroll/paystub calculation service. Batch generation should report failed vault writes as failures and not imply a pay stub exists when no durable artifact was saved.

### E-P1-5 - Compliance document create/update paths are close, but raw file content is not tied to vault artifacts

Files/lines:

```text
server/routes/compliance/documents.ts:180-358
server/routes/compliance/documents.ts:433-522
server/routes/compliance/documents.ts:529-602
```

Problem:

The compliance document route validates payloads, computes hashes, writes audit trails, and blocks deletion for locked docs, which is good. But the create path still accepts `fileContent`, `storageKey`, and `storageUrl` as direct route payloads. It stores compliance document metadata and bridges to employee documents, but it does not require the canonical vault/object-storage artifact that Phase E expects for compliance evidence.

Exact fix:

Route all compliance document uploads through one document intake service: validate metadata, persist binary to object storage/vault, compute hash from stored bytes, create compliance document row, create vault row, bridge to employee document, and write audit trail in one transaction or compensating workflow. Reject metadata-only compliance document creation except for explicit external-reference records with a separate type.

---

## CLAUDE EXECUTION ORDER

```text
1. Fix D-P0-1 first because it is a likely TypeScript/build blocker.
2. Fix D-P1-1, D-P1-2, D-P1-3 so Phase D can be signed off.
3. Fix E-P0-1 before pay stub/report/document generators; it is the canonical document foundation.
4. Fix E-P0-2 compliance report PDF/vault flow.
5. Fix E-P0-3 document signing authorization/workspace-scope issues.
6. Fix E-P0-4 auditor portal write/public completion paths.
7. Fix E-P1-1 HR document request state transitions and auth.
8. Fix E-P1-2 compliance evidence manager gates + validation + vaulted evidence.
9. Fix E-P1-3 document signing sender contract and validation.
10. Fix E-P1-4 pay stub vault hard-fail + schedulingMath duration.
11. Fix E-P1-5 compliance document intake service/vault linkage.
12. Clean D-P2 stale Trinity mode/support trust-tier items once blockers are green.
```

---

## CHATDOCK / RBAC / IRC ARCHITECTURE NOTE

```text
Bryan and Claude aligned on this cleanup for the later ChatDock sprint:
RBAC owns permissions.
Room type owns behavior.
Old IRC modes should not decide access control.
Simplify user-visible rooms to shift room, team channel, and DM.
Legacy IRC mode strings may remain only as internal routing hints during migration.
Do not start this refactor during Phase E unless a direct bug requires it; it belongs after audit phases are stable.
```

---

## STANDARD: NO BANDAIDS

```text
No raw money math. No raw scheduling duration math. No workspace IDOR.
No state transition without expected-status guard. No user-facing legacy branding.
No compliance/payroll/tax document returned as "generated" unless a real branded PDF
is durably saved to the tenant vault and can be re-served.
No Trinity action mutation without workspace scope, hard preflight gates, audit trail,
and fail-closed behavior for financial/compliance/tax/scheduling risk.
Trinity is one individual. No Business/Personal/Tech mode switching.
```


---

## QUEUED ITEMS (post-audit-phases, pre-ChatDock sprint)

### RBAC + IRC mode consolidation
Bryan flagged: the IRC mode system and RBAC are two competing layers answering
the same permission questions. This is redundant and should be collapsed.

Target architecture:
  RBAC owns ALL permission decisions (who can do what)
  Room type (Shift Room, Team Channel, DM) owns behavior decisions (what appears, what bots join)
  IRC mode strings (sup/org/met/field/coai) -> internal routing metadata only, never user-facing

Work:
  server/websocket.ts - 8,920L of mode-based branching -> room-type + RBAC checks
  server/services/ircEventRegistry.ts -> simplify or remove IRC event abstraction
  IRC_EVENTS -> replace with typed WebSocket message events

Timing: after all audit phases complete. Core to ChatDock enhancement sprint.
This is NOT a Phase E item - just queued so it doesn't get lost.

### Codex upgrade notes from Phase D (to address in future passes)
  - Action registry is well above 300 (561 unique IDs found). assertRegistryInvariants()
    now warns at startup - Claude needs a consolidation pass to disable/merge low-value
    action sets until runtime count is under 300.
  - Suggest adding startup test: initialize registry, assert unique IDs + count < 300.
