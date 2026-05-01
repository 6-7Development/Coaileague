# DUPLICATE / COMPETING SERVICES AUDIT — 2026-05-01

Branch: `claude/unify-duplicate-services-7ZzYF`
Base: `438cca2 feat(simulation): hard-persist ACME simulation + branded PDFs + guard cards`
Author: Claude (architect — unification sweep)

> Goal: One Source of Truth (TRINITY law). Every duplicate/competing
> service, route cluster, payload schema, and action registry is mapped
> here so future agents can finish the consolidation without re-discovering.

---

## ✅ DONE THIS PASS (this commit)

### 1. AI Scheduling Trigger — collapsed three paths into one

**Before:** 3 entrypoints, one of them a broken stub.

| File | Status | Behavior |
|---|---|---|
| `server/services/aiSchedulingTriggerService.ts` | **REMOVED** | Stub: returned hardcoded `confidence: 95, shiftsGenerated: 1`. Called `scheduleSmartAI(workspaceId)` with the wrong signature (`@ts-expect-error`). |
| `server/services/scheduleSmartAI.ts` | KEPT | Real Gemini AI engine — needs `{ openShifts, availableEmployees, workspaceId }`. |
| `server/services/scheduling/autonomousSchedulingDaemon.ts` | KEPT — **canonical trigger** | Exposes `triggerManualRun(workspaceId, mode)` which delegates to `trinityAutonomousScheduler.executeAutonomousScheduling`. |

**After:** `aiBrainMasterOrchestrator` action `scheduling.generate_ai_schedule`
now imports `autonomousSchedulingDaemon` directly. Dead unused import in
`automationInlineRoutes.ts` removed. `DOMAIN_CONTRACT.ts` updated.

One source of truth for AI schedule triggering: `autonomousSchedulingDaemon.triggerManualRun`.

---

## 🟥 DUPLICATE CLUSTERS — STILL TO UNIFY

### 2. Notification stack — 13 services, 2 competing engines

| File | LOC | Role | Verdict |
|---|---|---|---|
| `notificationService.ts` | 947 | Per-user `createNotification()` — 30+ callers | **KEEP — canonical user notif** |
| `universalNotificationEngine.ts` | 1,282 | RBAC role-routed broadcasts — 12 callers | **KEEP — canonical broadcast** |
| `aiNotificationService.ts` | 1,291 | AI enrichment of payloads | **KEEP — internal helper to engine** |
| `notificationDeliveryService.ts` | 757 | Channel dispatch (email/push/SMS) | KEEP |
| `notificationPreferenceService.ts` | 340 | User mute/preference | KEEP |
| `notificationRuleEngine.ts` | 347 | Rule-based filtering | **AUDIT — likely subsumes throttle** |
| `notificationStateManager.ts` | 449 | Read/seen state | KEEP |
| `notificationThrottleService.ts` | 283 | Rate-limit duplicates | **MERGE into ruleEngine** |
| `notificationCleanupService.ts` | 227 | TTL/cleanup | KEEP |
| `notificationInit.ts` | 232 | Boot wiring | KEEP |
| `entityCreationNotifier.ts` | 197 | Entity-create hooks | **MERGE into notificationService** |
| `scheduleLiveNotifier.ts` | 423 | Live shift updates | KEEP (domain-specific) |
| `pushNotificationService.ts` | 393 | Web Push handler | KEEP |

**Action plan:**
1. Document API contract: `createNotification` for personal, `universalNotificationEngine.send*` for role-routed, `NotificationDeliveryService` for raw channel dispatch.
2. Merge `notificationThrottleService` into `notificationRuleEngine`.
3. Inline `entityCreationNotifier` into `notificationService` as a helper.

---

### 3. Email stack — overlap between core and service

| File | LOC | Role | Verdict |
|---|---|---|---|
| `emailCore.ts` | 2,263 | Resend client + 30+ typed senders (CAN-SPAM) | **KEEP — canonical low-level** |
| `emailService.ts` | 3,119 | `EmailService` class + automation-flavor senders | **KEEP — high-level orchestrator** |
| `emailTemplateBase.ts` | 477 | Shared template helpers | KEEP |
| `emailIntelligenceService.ts` | 426 | Sentiment/intent on inbound | KEEP (separate domain) |
| `emailAutomation.ts` | 299 | Trigger emails on automation events | **AUDIT — many overlap with emailService** |
| `email/emailProvisioningService.ts` | 376 | Subdomain/inbox provisioning | KEEP |

**Sender split:** 90 callers use `emailService`, 31 use `emailCore`. Several import both
in the same file (e.g., `billingAutomation.ts`). Some callers use `emailCore.sendXxxEmail`
helpers for canonical, CAN-SPAM-safe senders, and others use `emailService.send*` which
internally calls `sendCanSpamCompliantEmail` from emailCore. Functional overlap but
not strict duplication.

**Action plan:** keep both layers but enforce a contract — `emailCore` = transport +
typed senders, `emailService` = orchestration + automation flavor. Audit `emailAutomation.ts`
for bypass paths that skip CAN-SPAM filtering.

---

### 4. Trinity / scheduling services — three autonomous schedulers

| File | LOC | Role | Verdict |
|---|---|---|---|
| `autonomousScheduler.ts` (root) | 4,896 | Cron-based job runner; `startAutonomousScheduler()` | **KEEP — platform-wide cron** |
| `scheduling/autonomousSchedulingDaemon.ts` | 571 | Manual + per-workspace run trigger | **KEEP — canonical daemon** |
| `scheduling/trinityAutonomousScheduler.ts` | 3,280 | Trinity AI scheduling engine | **KEEP — canonical engine** |
| `scheduling/trinityShiftGenerator.ts` | 345 | Shift instance materializer | KEEP |
| `scheduling/trinityOrchestrationBridge.ts` | 45 | Tiny shim | **MERGE into daemon or delete** |
| `scheduleSmartAI.ts` | 307 | Gemini engine for shift assignment | KEEP |
| `scheduleMigration.ts` | 225 | One-shot migration helper | **AUDIT for deletion** |
| `scheduleRollbackService.ts` | 245 | Rollback failed AI runs | KEEP |
| `advancedSchedulingService.ts` | 1,011 | Older "advanced" feature surface | **AUDIT — likely superseded by trinity** |

**Boundaries (proposed contract):**
- `autonomousScheduler` (root) = the cron driver, owns timing + jobs
- `autonomousSchedulingDaemon` = workspace-scoped trigger surface
- `trinityAutonomousScheduler` = AI decision engine
- `scheduleSmartAI` = Gemini sub-engine for shift→employee assignment
- `trinityShiftGenerator` = template-instance fanout

**Action plan:** delete `trinityOrchestrationBridge.ts` (45 LOC shim), audit `advancedSchedulingService.ts` for surviving callers, then either delete or fold into `trinityAutonomousScheduler`.

---

### 5. Action registries — NOT actually duplicates

After inspection these are **layered, not duplicated**:

| File | LOC | Layer |
|---|---|---|
| `services/helpai/platformActionHub.ts` | 3,367 | **Hub (infrastructure)** — `helpaiOrchestrator` |
| `services/helpai/actionCatalogPolicy.ts` | 273 | Classification policy |
| `services/helpai/supportActionRegistry.ts` | 565 | 14 human-support corrective actions |
| `services/ai-brain/actionRegistry.ts` | 5,079 | Trinity AI action handlers (registers into hub) |
| `services/bots/shiftBotActionRegistry.ts` | 167 | Shift bot specific actions |

**Verdict: KEEP all** — each owns a distinct surface. No work needed.

---

### 6. Automation engine cluster

| File | LOC |
|---|---|
| `automation-engine.ts` | ? |
| `automation-schemas.ts` | ? |
| `automationEventsService.ts` | ? |
| `automationMetrics.ts` | ? |
| `automationRollbackService.ts` | ? |
| `billingAutomation.ts` | ? |
| `payrollAutomation.ts` | ? |
| `emailAutomation.ts` | ? |
| `onboardingAutomation.ts` | ? |
| `pulseSurveyAutomation.ts` | ? |
| `automation/` (dir) | many |

**Action plan:** verify `automation-engine.ts` is the canonical orchestrator and
`automation/` directory holds domain-specific pipelines. Audit for two engines.

---

## 🟥 ROUTE-LEVEL DUPLICATES — `server/routes/`

### AI Brain routes — 8 files for one domain
```
ai-brain-capabilities.ts
ai-brain-console.ts
ai-brain-routes.ts
aiBrainControlRoutes.ts
aiBrainInlineRoutes.ts
aiBrainMemoryRoutes.ts
aiOrchestraRoutes.ts
aiOrchestratorRoutes.ts
```
**Action:** consolidate to ≤3 (control / memory / orchestrator) once mounts are mapped.

### Chat routes — 6 files
```
chat-export.ts  chat-management.ts  chat-rooms.ts  chat-uploads.ts
chat.ts         chatInlineRoutes.ts  chatPollRoutes.ts  chatSearchRoutes.ts
```
**Action:** merge `chat-*.ts` into `chatInlineRoutes.ts` + `chatRoomsRoutes.ts`.

### Trinity routes — 25+ files
Many overlap (`trinityChatRoutes`, `trinitySessionRoutes`, `trinityThoughtStatusRoutes`,
`trinityDecisionRoutes`, `trinityIntelligenceRoutes`, `trinityInsightsRoutes`,
`trinityLimbicRoutes`, `trinityCrisisRoutes`, ...). Recommend consolidation
into:
- `trinityCoreRoutes.ts` (decision/thought/limbic/intelligence)
- `trinityChatRoutes.ts` (chat/session)
- `trinityOpsRoutes.ts` (alerts/escalation/maintenance/audit/transparency)
- `trinityStaffingRoutes.ts` (kept)

### Schedule routes — 4 files
```
scheduleosRoutes.ts  schedulerRoutes.ts  schedulesRoutes.ts  schedulingInlineRoutes.ts
```
**Action:** investigate which are mounted; merge to one canonical `scheduleRoutes.ts`.

### Automation routes — 4 files
```
automation-events.ts  automation.ts
automationGovernanceRoutes.ts  automationInlineRoutes.ts
```
**Action:** merge `automation.ts` + `automation-events.ts` into one.

### Notification routes — 2 files
```
notificationPreferenceRoutes.ts  notifications.ts
```
**Action:** consolidate.

### Email routes — 4 files
```
email-attachments.ts  emailEntityContextRoute.ts
emailUnsubscribe.ts   emails.ts
email/ (dir)
```
**Action:** consolidate to 2.

---

## 🟥 PAYLOAD / SCHEMA DUPLICATES (high-suspicion list)

- `automation-schemas.ts` (services) vs Zod schemas inline in `routes/automation*.ts` — verify canonical home.
- `notificationService.VALID_NOTIFICATION_TYPES` (947-line set) duplicates DB enum in `shared/schema`. Move to `shared/schema` and `import` into the runtime guard.
- `aiBrainGuardrails` config in `shared/config` vs runtime checks scattered across
  `aiGuardRails.ts`, `aiBrainAuthorizationService.ts` — consolidate constants.

---

## CONSOLIDATION ROADMAP (proposed phases)

**Phase 1 — landed**
- ✅ Remove `aiSchedulingTriggerService` stub; route to single source (`autonomousSchedulingDaemon`).

**Phase 2 — small mechanical (LANDED in second commit)**
- ✅ Delete `server/services/scheduling/trinityOrchestrationBridge.ts` — 45-LOC shim, zero callers.
- ✅ Delete `server/services/notificationThrottleService.ts` — 283-LOC service, zero callers (full dead code).
- ✅ Drop dead `getSchedulableClients` / `getSchedulableEmployees` helpers from `entityCreationNotifier.ts` — zero callers.
- 🔁 **Decision:** keep `entityCreationNotifier` as-is (not a notification duplicate; it's a domain orchestrator that fires notifications + creates onboarding tasks + drafts contracts).
- 🔁 **Decision:** keep `notificationRuleEngine` separate from any throttle logic; throttle service was dead anyway.
- ⏳ Move `VALID_NOTIFICATION_TYPES` to `shared/schema` (deferred — needs DB enum cross-check).

**Phase 3 — route consolidation**
- Chat routes 8 → 2.
- AI Brain routes 8 → 3.
- Schedule routes 4 → 1.
- Automation routes 4 → 2.
- Trinity routes 25+ → 4.

**Phase 4 — legacy audit & deletion**
- `advancedSchedulingService.ts` — confirm zero callers, delete.
- `scheduleMigration.ts` — confirm completed migration, delete.
- `emailAutomation.ts` — audit overlap with `emailService`.

**Phase 5 — boundaries enforced**
- Lint rule: no service may import another service of its own domain
  except via a single named entry point.
- DOMAIN_CONTRACT updated to reflect new file map.

---

## METRICS

- Services in `server/services/` — **311** → **308** after both passes (3 deleted)
- Routes in `server/routes/` — **329** (no route file deletions yet)
- Files removed across phases — **3** (`aiSchedulingTriggerService.ts`, `trinityOrchestrationBridge.ts`, `notificationThrottleService.ts`)
- Total LOC of pure dead code removed — **~470 LOC**

### Per-phase totals

| Phase | Files Δ | LOC Δ |
|---|---|---|
| 1 | -1 file, +3 mod | -118 stub, +38 wiring |
| 2 | -2 files, +2 mod | -328 dead, -47 dead helpers |
