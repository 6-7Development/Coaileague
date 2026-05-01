# DEFERRED WORK — DOCUMENT / PDF / FORMS DOMAIN

**Companion to `MERGE_NOTES_DOCUMENT_SYSTEM.md`.**

These are concrete deferred items the architect (or a future lane) can pick up. Each item lists what was flagged, why it wasn't done in this sprint, the acceptance criteria, and the rough effort. Sorted by impact descending.

---

## P0 — security / compliance gaps that should land soon

### D1. `drawStatusWatermark` is shipped but no PDF generator calls it

**Status:** helper in `pdfTemplateBase.ts`, zero consumers.
**Why deferred:** every generator's call site needs a status lookup (where does the doc's lifecycle status live for THIS PDF?). Different for tax forms vs vault docs vs DAR.
**Acceptance:**
- `submissionPdfService` calls `drawStatusWatermark(doc, 'EXECUTED')` when the submission row is `status='completed'`.
- `taxFormGeneratorService` stamps `'DRAFT'` for unfiled, `'COPY'` for re-pulls.
- `documentViewRoutes /pdf/:docId` stamps `'COPY'` (those are read-time renders, not the legally binding original).
- DAR/contract generators wire `'EXECUTED'` once `executedAt` is set.
**Effort:** 1–2 hours.

### D2. Image embedding in DAR / incident / site-survey PDFs

**Status:** `darPdfService` and `clientReportService` reference `photo_manifest` but no `embedJpeg`/`embedPng`/`drawImage` call exists.
**Why deferred:** flagged in original audit but out of scope for the document-system branch (RMS domain).
**Acceptance:**
- New helper `embedRemotePhoto(doc, url, opts)` in `pdfTemplateBase` that fetches the GCS signed URL, validates `image/jpeg|png`, downsamples to 144 dpi for body / 300 dpi for evidence, and draws with caption + GPS.
- `darPdfService.generateDarPdf` calls it for each entry in `photo_manifest` in a 2×3 grid evidence section.
- `incidentPipelineRoutes` PDF generator does the same.
- EXIF strip on every embedded image (use `sharp({ failOn: 'truncated' }).withMetadata({})`).
**Effort:** 4–6 hours.

### D3. Multi-signer support in form submissions

**Status:** `documentFormRoutes /submit` only stores the FIRST signature found (`primarySignatureData` loop). Forms with co-signers (HR + Employee + Witness) lose signatures 2..n.
**Why deferred:** flagged in grade-A audit but the immediate ship was end-cycle handshake correctness.
**Acceptance:**
- Iterate every `signature`/`initials` field, build `signatureData: { fields: [{ fieldId, data, signerName, signedAt, ip, ua, geo, hash }, …] }`.
- `submissionPdfService.renderSignatureBlock` already loops, so PDF rendering already works — only the DB write needs fixing.
- Store one row per signature in `formSignatures` table (already exists in schema).
**Effort:** 2–3 hours.

### D4. Idempotency keys missing on other vault writes

**Status:** Idempotency landed on `/api/document-forms/submit`. Other write endpoints (POST `/api/document-vault`, POST `/api/document-vault/:id/auditor-token`, POST `/api/document-vault/:id/restore`) have no replay protection.
**Why deferred:** the user-flow most likely to double-submit is the form post. The vault writes are admin-side and lower volume.
**Acceptance:**
- Wrap each in a 5-minute dedup-key check using the same SHA-256 pattern.
- POST `/api/document-vault/:id/auditor-token` should return the SAME token on replay rather than issuing a new one (otherwise an accidental double-tap creates two valid tokens).
**Effort:** 1–2 hours.

### D5. SPS forms still use legacy AES-CBC for SSN/account encryption

**Status:** `server/routes/spsFormsRoutes.ts:73` has its own `encrypt()` using AES-CBC (no auth tag). Vulnerable to chosen-ciphertext attacks; older format than the new GCM envelope.
**Why deferred:** changing the algorithm in place would break decrypt of existing rows; needs a parallel rollout (read both old + new, write new only).
**Acceptance:**
- Add a `decryptLegacyCbc()` that handles the existing CBC envelope.
- All new writes go through `fieldEncryption.encryptField` (GCM `pf1:` envelope).
- All reads try GCM first, fall back to CBC.
- Add a migration script to walk SPS submissions and re-encrypt CBC values as GCM.
**Effort:** 4–5 hours plus migration window.

---

## P1 — UX / wiring gaps that polish the user experience

### D6. Mobile sheets exist but pages don't use them yet

**Status:** `MobileDocumentSafeSheet`, `MobilePayStubSheet`, `MobileFormPager` shipped. Zero call sites yet.
**Why deferred:** ship the components first; integration is its own cleanup pass.
**Acceptance:**
- `client/src/pages/sps-document-safe.tsx`: when `useIsMobile()` is true, replace the Sheet/Tabs layout with `<MobileDocumentSafeSheet open ...>`.
- `client/src/pages/pay-stub-detail.tsx`: when mobile, replace the desktop `CanvasHubPage` with `<MobilePayStubSheet payStubId={id} ...>`.
- `client/src/pages/document-form.tsx`: when mobile, swap `<UniversalFormRenderer>` for `<MobileFormPager>`.
- `client/src/pages/document-vault.tsx`: add a button/link that opens `<MobileDocumentSafeSheet>` on mobile.
- `client/src/pages/my-paychecks.tsx`: tap row → open `<MobilePayStubSheet>`.
**Effort:** 2 hours.

### D7. Auditor-token issuance UI

**Status:** Backend `POST /api/document-vault/:id/auditor-token` ships; no frontend button.
**Why deferred:** backend-first; UI affordance is a small PR.
**Acceptance:**
- Add an "Issue Regulator Link" button in the `document-vault.tsx` detail modal (manager-only).
- Modal collects `regulatorEmail`, `regulatorName`, `expiresInHours` (slider 1–720), `reason` (textarea, ≥8 chars).
- On success, show the URL in a copy-to-clipboard field with a "send via email" secondary action that calls the existing `sendCanSpamCompliantEmail` helper.
- Show a list of currently-issued tokens for the doc with "expires in X" + revoke (revocation requires a token-blocklist table — see D8).
**Effort:** 3–4 hours.

### D8. Auditor-token revocation list

**Status:** Tokens are stateless and time-bound. Revocation = wait for expiry or rotate `SESSION_SECRET` (nuclear).
**Why deferred:** stateless design was deliberate to avoid a new schema migration.
**Acceptance:**
- New table `auditor_token_revocations(token_hash, workspace_id, revoked_at, revoked_by, reason)`.
- Insert sha256 of token on revoke.
- `verifyAuditorToken` checks revocation list.
- "Revoke" button in D7's UI.
**Effort:** 3 hours including migration.

### D9. Year-end packet — bundle every W-2/1099/pay stub

**Status:** Mentioned in original audit; never built.
**Why deferred:** out of scope for the system-correctness work.
**Acceptance:**
- New endpoint `POST /api/me/documents/zip` (employee scope).
- Body: `{ year: number, types?: ('w2'|'1099'|'paystub')[] }`.
- Iterates the vault, downloads each PDF (in-process via `downloadFileFromObjectStorage`), zips with `archiver` (or whatever's available; no new dep ideal — fall back to streaming concatenation if `archiver` missing).
- Streams the zip back with hardened headers, Content-Type `application/zip`.
- Audit-logs `BULK_DOWNLOAD:YEAR_END_PACKET` with item count.
- Uses `exportLimiter` (cluster-wide rate limit).
**Effort:** 4–6 hours.

### D10. Auto-save debouncing + offline IndexedDB queue for forms

**Status:** Form auto-save is a blunt 30s `setInterval`. Online-only; offline drafts are silently lost.
**Why deferred:** flagged in audit; broader UX work that touches every form.
**Acceptance:**
- Replace `setInterval(triggerSave, 30000)` with `debounce(triggerSave, 4000)` keyed on field-blur + `visibilitychange === 'hidden'`.
- IndexedDB-backed queue (`idb-keyval` is small and tree-shakable; or hand-roll, no new dep).
- `navigator.onLine` listener flushes queue on reconnect.
- Show "Saved locally — will sync" toast when offline; "Synced" when reconnected.
**Effort:** 4–6 hours.

### D11. Signature fingerprint + alternative input methods

**Status:** Drawn signatures only; no hash for cross-doc comparison; no typed/uploaded fallback.
**Why deferred:** drawn signatures cover 95% of the use case; the alternates and fingerprint are nice-to-have for accessibility + audit defense.
**Acceptance:**
- `SignatureField` gets three tabs: "Draw / Type / Upload".
- All three produce the same `signatureData` envelope `{ data, kind, fingerprint }` where `fingerprint = sha256(data)`.
- Stored on the signature row so the auditor can confirm "this is the same hand that signed doc X".
**Effort:** 4 hours.

### D12. PDF/A asset bundle (Inter-Regular.ttf + sRGB.icc)

**Status:** Metadata harness ships in `pdfTemplateBase`; producer string flips automatically once `PDF_A_STATUS.pdfA1bReady = true`.
**Why deferred:** assets aren't in the repo yet.
**Acceptance:**
- Add `server/assets/pdf/Inter-Regular.ttf` (or Noto Sans) — must be license-compatible (Inter is OFL).
- Add `server/assets/pdf/sRGB.icc` (the public sRGB v4 ICC profile).
- Update every renderer to use `doc.font('server/assets/pdf/Inter-Regular.ttf')` instead of `doc.font('Helvetica')`.
- Attach the ICC profile via pdf-lib's `setGraphicsState` or post-process with `qpdf --linearize --object-streams=disable`.
- Set `PDF_A_STATUS.pdfA1bReady = true`.
- Verify with VeraPDF (`vera-pdf` CLI) — must report `PDF/A-1B compliant`.
**Effort:** 1–2 days. Assets + per-renderer migration + verification.

---

## P2 — completeness items that can be picked up at any time

### D13. CRUD button audit on remaining document pages

**Status:** Audited only `document-vault.tsx`. Other pages have buttons that may not be wired:
- `client/src/pages/hr-documents.tsx`
- `client/src/pages/hr-document-requests.tsx`
- `client/src/pages/document-library.tsx`
- `client/src/pages/document-templates.tsx`
- `client/src/pages/document-signing-portal.tsx`
- `client/src/pages/onboarding-forms.tsx`
- `client/src/pages/employee-onboarding-wizard.tsx`
- `client/src/pages/form-submissions.tsx`
**Acceptance:** for each page, verify every button either calls a backend endpoint or has a clear UI-only purpose; replace any dead buttons.
**Effort:** 1 day total, ~30 min per page.

### D14. PDF base consolidation

**Status:** Two base systems exist:
- `server/services/pdfTemplateBase.ts` (functional, navy `#0f2a4a`)
- `server/services/pdf/BrandedPdfService.ts` (class, navy `#0F1B35`)
**Why deferred:** they don't conflict at runtime; consolidation is hygienic.
**Acceptance:**
- Pick one (recommend functional `pdfTemplateBase` — more callers).
- Make `BrandedPdfService` a thin wrapper that delegates.
- Reconcile color tokens to a single value.
- Migrate the 1–2 callers of `BrandedPdfService` to the unified base.
**Effort:** 2 hours.

### D15. Document-status badges in vault list view

**Status:** Detail modal shows Signed/Unsigned. List view doesn't show the document-state-machine status (`draft / pending_signature / partially_signed / executed / expired / voided / archived`).
**Why deferred:** schema column on `documentVault` doesn't track full state — that lives on `documentInstances`. Need a join.
**Acceptance:**
- Server-side `GET /api/document-vault` joins `documentInstances` on `documentInstanceId` and surfaces `status`.
- Frontend list shows a status pill per row with category-appropriate colors.
- Filter by status in the list query.
**Effort:** 3–4 hours.

### D16. Vault audit-access-log UI

**Status:** Backend already records every read via `universalAudit.log({ action: 'DOCUMENT_VAULT:DOWNLOADED' })`. No frontend.
**Acceptance:**
- New tab in `document-vault.tsx` detail modal: "Access History".
- Calls `GET /api/audit-logs?entityType=document_vault&entityId=:id`.
- Shows a timeline: timestamp · actor · action (PREVIEWED/DOWNLOADED/UPDATED/etc.) · IP.
**Effort:** 2–3 hours.

### D17. Per-doc retention policy

**Status:** `documentVault.retentionUntil` column exists. `runDocumentExpiryCheck` only handles `documentInstances` not `documentVault`.
**Acceptance:**
- Sweep `documentVault` rows past `retentionUntil` and either soft-delete or move to a "long-term archive" bucket (cheaper GCS class).
- Default retentions per category: tax 7y, payroll 4y, incidents 5y, contracts 10y.
- Cron job (existing `node-cron` setup) runs nightly.
**Effort:** 4 hours.

### D18. `/v/<documentNumber>` integrity-verify public endpoint + QR code

**Status:** Mentioned in original audit; not built.
**Acceptance:**
- New public endpoint `GET /api/public/verify/:documentNumber` that returns `{ exists, integrityHashPrefix, signedAt, isVoided, workspaceName }` for any document number.
- QR code embedded on every PDF page-1 footer (use `qrcode` dep — already installed) pointing at `https://app.coaileague.com/v/<documentNumber>`.
- Frontend page `/v/:documentNumber` that pretty-renders the verify response.
**Effort:** 4–5 hours.

### D19. `triggerCompletionWebhook` is documented but never called

**Status:** UDTS `DocumentTemplate.completionWebhook` field exists in `templateRegistry.ts:80`. Nothing reads it.
**Acceptance:**
- After successful submit handshake, if `template.completionWebhook` is set, POST the submission summary to that URL with HMAC-SHA256 signature header.
- Retry with exponential backoff on 5xx.
- Audit-log every webhook attempt.
**Effort:** 3 hours.

### D20. Schema definition for `app_rate_limits`

**Status:** Auto-created lazily by `persistentRateLimitStore`; not in `shared/schema/domains/*`.
**Why deferred:** the table is intentionally ephemeral / system-internal; declaring it in drizzle would make it a regular table and lose the UNLOGGED + lazy-create properties.
**Acceptance:**
- Either add as a non-drizzle "system table" comment in `shared/schema/index.ts` listing it as known-but-unmanaged.
- Or migrate to a drizzle definition with `pgTable` + `mode: 'unlogged'` if drizzle supports it.
**Effort:** 30 minutes (just documentation).

### D21. Tests for the new services

**Status:** Zero unit/integration tests written this sprint despite repo's `tests/` + vitest setup.
**Acceptance:**
- `tests/unit/fieldEncryption.test.ts`: roundtrip encrypt→decrypt, idempotency, malformed-envelope rejection, length checks.
- `tests/unit/auditorToken.test.ts`: issue + verify happy path, expired rejection, signature tamper rejection, payload binding (wrong workspace fails verify).
- `tests/integration/persistentRateLimitStore.test.ts`: upsert under concurrency, expiry sweep correctness.
- `tests/integration/documents-vault.test.ts`: signed-doc PATCH/DELETE blocked, cross-tenant path defense, recycle-bin restore, dedup-key idempotency.
- `tests/integration/submissionPdfService.test.ts`: render every UDTS template type, PDF passes basic structure check.
**Effort:** 1–2 days.

### D22. SignatureField polish (mobile UX)

Already-flagged audit items NOT fully addressed:
- DateField iOS-native popover swap (still uses `<input type="date">`)
- `UploadField` max-size guard + image downsampling (no 10MB cap, no createImageBitmap downsample)
- BroadcastChannel for multi-tab draft conflicts
- Keyboard-aware bottom-nav lift (works via safe-area today; could be smarter)
**Effort:** 1 day total.

### D23. Bottom-nav badge for "Documents waiting your signature"

**Status:** Mobile bottom nav supports badges; nothing wired for documents.
**Acceptance:**
- Server endpoint `GET /api/me/documents/pending-signature/count`.
- `MobileBottomNav` reads it and shows a red badge on the Documents tab when > 0.
**Effort:** 1.5 hours.

### D24. Ratelimit with Redis when available

**Status:** Postgres-backed store ships now. Redis is faster but not installed.
**Why deferred:** adding `ioredis` + `rate-limit-redis` deps is a separate decision.
**Acceptance:**
- Detect `REDIS_URL`. If set, install `ioredis` + `rate-limit-redis` + use Redis store.
- Fall back to the Postgres store as today.
**Effort:** 2 hours after deps decision.

---

## P3 — items intentionally NOT deferred (verified out-of-scope)

For the architect's reference, these were considered and explicitly NOT included:

- **`documentViewRoutes` HTML deprecation** — the legacy `/download/:docId` HTML endpoint is intentionally retained for back-compat. The new `/pdf/:docId` parallel endpoint is what the frontend now uses. Full HTML removal is a separate deprecation sprint with consumer audit.
- **OAuth `tokenEncryption.ts` refactor** — that module already exists and works; the new `fieldEncryption.ts` is a separate envelope for PII columns. They share no code by design (different KDF tags).
- **Pay-stub `pdfStorageKey` write** — the existing paystub generator vaults via `saveToVault` (which now writes to GCS) but does NOT also stamp the `pay_stubs.pdfStorageKey` column. The fast-path in `/api/pay-stubs/:id/pdf` checks `pdfStorageKey` first; today it's empty so the slow regenerate path always runs. Wiring `paystubService.generatePaystub` to write `pdfStorageKey = vault.fileUrl` is a 5-line follow-up that makes the fast path real. Not done because it's a behavior change in the pay-stub generator that other callers depend on.

---

## Suggested next-sprint shape

If picking up half-day chunks:

| Day | Focus |
|---|---|
| 1 AM | D6 (mobile sheet wiring) + D7 (auditor token UI) |
| 1 PM | D1 (status watermark wiring) + D14 (PDF base consolidation) |
| 2 AM | D3 (multi-signer) + D4 (idempotency on remaining writes) |
| 2 PM | D9 (year-end packet) |
| 3 AM | D2 (image embedding in DAR/incident) |
| 3 PM | D18 (verify endpoint + QR) + D19 (completion webhook) |
| 4 | D21 (test coverage) |
| 5 | D5 (SPS legacy CBC migration) — careful, requires plaintext-readable backup |
| 6+ | D12 (PDF/A asset bundle) — own sprint |

Total ~2 weeks for full closeout. The platform is correct and shippable as-is; these items make it polished.

---

— Claude (lane), 2026-05-01
