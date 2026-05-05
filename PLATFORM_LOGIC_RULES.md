# CoAIleague Platform Logic Rules
# Single Source of Truth — System Integrity + Billing Compliance
#
# PURPOSE: Trinity reads this to detect broken states.
#          CS reads this to diagnose customer complaints.
#          Engineers read this before any code change touching billing or auth.
#
# RULE FORMAT:
#   RULE-XXX | Category | Severity | Description
#   DETECT:  How to find the broken state
#   CORRECT: How to fix it
#   AUDIT:   What to log when detected

---

## SECTION 1 — BILLING INTEGRITY RULES

RULE-B01 | Billing | CRITICAL | Feature gates must be enforced on every tier-restricted route
  DETECT:  requireBillingFeature() not called on route serving tier-gated feature
           Query: SELECT route, feature FROM tier_features WHERE no_gate_applied = true
           Signal: analytics_advanced, cad_integration, compliance_full returned for free_trial workspace
  CORRECT: Wire requireBillingFeature('feature_key') on route handler
  AUDIT:   Log to system_audit_log: feature_accessed_without_gate

RULE-B02 | Billing | CRITICAL | Premium AI events ($500–$1500) must create Stripe invoice items
  DETECT:  billing_action_log has action_type LIKE 'premium_%' AND stripe_item IS NULL
           AND billed_at IS NULL AND created_at < NOW() - INTERVAL '1 hour'
  CORRECT: billingActionService.recordPremiumEvent() fires at document generation callsite
           If stripe_item missing: manually create Stripe invoice item via API
  AUDIT:   Log to billing_action_log with stripe_item populated on Stripe confirmation

RULE-B03 | Billing | CRITICAL | Per-action charges must be recorded on every occurrence
  DETECT:  payroll_runs.status = 'paid' AND no billing_action_log row with
           action_type = 'payroll_run' AND entity_id = payroll_run.id
           invoice.status = 'sent' AND no billing_action_log row for invoice_processed
           plaid_transfers.status = 'settled' AND no billing_action_log for direct_deposit
  CORRECT: billingActionService.record*() called at action completion point
  AUDIT:   billing_action_log.action_type, amount_cents, entity_id required

RULE-B04 | Billing | HIGH | Addon activation must create Stripe subscription item
  DETECT:  workspace_addons.status = 'active' AND stripe_subscription_item_id IS NULL
           AND created_at < NOW() - INTERVAL '5 minutes'
  CORRECT: upsellRoutes calls subscriptionManager.addAddonSubscriptionItem() before activateAddon()
           Manual fix: create Stripe sub item, update workspace_addons.stripe_subscription_item_id
  AUDIT:   workspace_addons.stripe_subscription_item_id must be non-null on active addons

RULE-B05 | Billing | HIGH | Active email/PTT seats must have Stripe subscription items
  DETECT:  platform_email_addresses.is_active = true
           AND billing_seat_id LIKE 'email_seat_%' (fake generated ID)
           AND workspace has Stripe subscription
  CORRECT: Implement subscriptionManager.addEmailSeatItem() to create real Stripe items
           Transition: run backfill script to create Stripe items for existing active seats
  AUDIT:   billing_seat_id should be 'si_...' format (Stripe subscription item)

RULE-B06 | Billing | HIGH | Soft cap thresholds must fire exactly once per billing period
  DETECT:  workspace_ai_periods.soft_cap_80pct_sent_at IS NULL
           AND total_tokens_k >= (soft_cap_tokens_k * 0.8)
  CORRECT: billingActionService.checkAndNotifySoftCap() called from aiMeteringService
  AUDIT:   soft_cap_80pct_sent_at, soft_cap_90pct_sent_at, soft_cap_100pct_sent_at tracked

RULE-B07 | Billing | MEDIUM | Suspended workspace seats must deactivate within 60 seconds
  DETECT:  workspaces.subscription_status = 'suspended'
           AND (platform_email_addresses.is_active = true OR ptt_seats.is_active = true)
  CORRECT: deactivateWorkspaceSeats() fires from subscriptionManager on payment_failed
  AUDIT:   platform_email_addresses.deactivated_at should be SET within 60s of suspension

RULE-B08 | Billing | MEDIUM | Addon features must be blocked for workspaces without addon
  DETECT:  workspace_addons has no row for feature_key OR status != 'active'
           AND route gated by requireBillingFeature(feature_key) returned 200
  CORRECT: loadActiveAddons() middleware populates req.activeAddons before gate check
  AUDIT:   Log denied access: feature_key, workspace_id, tier, attempted_at

---

## SECTION 2 — FINANCIAL SAFETY RULES

RULE-F01 | Financial | CRITICAL | ACH disbursements require org_owner or co_owner approval
  DETECT:  plaid_transfers created by user with role NOT IN ('org_owner', 'co_owner')
  CORRECT: /api/plaid/disburse-batch enforces requireOwner middleware — never bypass
  AUDIT:   plaid_transfers.disbursed_by must match user.role IN ('org_owner','co_owner')

RULE-F02 | Financial | CRITICAL | Payroll period close requires manager+ role
  DETECT:  payroll_runs.status changed to 'paid' by user.role = 'employee'
  CORRECT: payrollRoutes has transaction + role check — verify on every payroll route addition
  AUDIT:   payroll_runs.approved_by + approved_at must be populated on status='paid'

RULE-F03 | Financial | HIGH | All financial writes must use Decimal arithmetic (no floats)
  DETECT:  Any calculation: hours * rate where neither operand is Decimal instance
           grep: 'hours \* rate' NOT preceded by 'new Decimal'
  CORRECT: Use FinancialCalculator service or new Decimal(hours).mul(new Decimal(rate))
  AUDIT:   Result stored in INTEGER cents — never NUMERIC(10,2) for money amounts

RULE-F04 | Financial | HIGH | ACH transfers must have idempotency keys
  DETECT:  plaid_transfers table has duplicate (employee_id, payroll_run_id) rows
  CORRECT: plaidService.initiateTransfer() uses idempotency key = payStubId
  AUDIT:   plaid_transfers UNIQUE constraint on (employee_id, payroll_run_id)

RULE-F05 | Financial | MEDIUM | Payroll anomalies must be resolved before period close
  DETECT:  trinityPayrollAnomalyService.flaggedEntries.length > 0
           AND payroll_runs.status changed to 'paid' without all anomalies cleared
  CORRECT: Period close endpoint returns 409 if anomaly flags remain unresolved
  AUDIT:   payroll_period_anomalies: all status must be 'resolved' before close

---

## SECTION 3 — ACCESS CONTROL RULES

RULE-A01 | Auth | CRITICAL | DPS Auditor portal tokens must expire and be revocable
  DETECT:  auditor_links.expires_at < NOW() AND token still returns 200
           auditor_links.is_revoked = true AND token still returns 200
  CORRECT: Every auditor portal request validates expires_at AND is_revoked
  AUDIT:   auditor_links.last_accessed_at updated on every token use

RULE-A02 | Auth | CRITICAL | Shadow Mode (impersonation) requires Glass Break justification
  DETECT:  support_sessions created without justification field populated
           Any support route accessed without active support_session by non-root
  CORRECT: requireGlassBreakJustification middleware returns 400 if justification missing
  AUDIT:   support_sessions.actions[] append-only — every action logged with justification

RULE-A03 | Auth | HIGH | Employee deactivation must cascade to future shifts
  DETECT:  employees.status = 'inactive' AND shifts with assigned_employee_id = employee.id
           AND shift.start_time > NOW() AND shift.status NOT IN ('cancelled', 'calloff')
  CORRECT: On employee deactivate: UPDATE shifts SET status='open', assigned_employee_id=NULL
           Where start_time > NOW() AND assigned_employee_id = deactivated employee
  AUDIT:   Log: employee_deactivated_shift_cascade, count of unassigned shifts

RULE-A04 | Auth | HIGH | WebSocket connections must be authenticated before subscribing
  DETECT:  WS connection receives workspace events without valid session cookie
  CORRECT: WebSocket auth validates session/JWT on connect — unauthorized connections dropped
  AUDIT:   ws_auth_failures table: ip, attempted_at, reason

RULE-A05 | Auth | MEDIUM | Cancelled workspaces blocked from all API routes except billing recovery
  DETECT:  workspaces.subscription_status = 'cancelled' AND /api/shifts returned 200
  CORRECT: cancelledWorkspaceGuard blocks all routes except CANCELLED_EXEMPT_PREFIXES
  AUDIT:   Log: cancelled_workspace_access_attempt, route, user_id

---

## SECTION 4 — OPERATIONAL RULES

RULE-O01 | Operations | CRITICAL | Calloff SLA must not exceed 15 minutes without supervisor escalation
  DETECT:  workflow_runs.type = 'calloff_coverage' AND created_at < NOW() - 15 minutes
           AND shift.status = 'calloff' (not filled) AND supervisor_notified_at IS NULL
  CORRECT: scanStaleCalloffWorkflows() sweeps every 5 minutes — verify cron is running
  AUDIT:   calloff_coverage_workflows.supervisor_escalated_at populated on SLA breach

RULE-O02 | Operations | HIGH | VMS events must be acknowledged within 5 minutes
  DETECT:  vms_events.severity = 'critical' AND created_at < NOW() - 5 minutes
           AND acknowledged_at IS NULL
  CORRECT: 5-minute timeout fires supervisor escalation (implemented in vmsWebhookRoutes)
  AUDIT:   vms_events.response_time_seconds > 300 for critical events = SLA breach

RULE-O03 | Operations | HIGH | NFC patrol scan timestamps must be within 120 seconds of server time
  DETECT:  patrol_scans.scan_timestamp differs from server receipt by > 120 seconds
           (X-Local-Timestamp header vs NOW())
  CORRECT: Server honors X-Local-Timestamp for offline-synced scans (legitimate)
           Flag if timestamp is FUTURE or > 4 hours in past (suspicious)
  AUDIT:   patrol_scans.is_time_anomaly = true for flagged records

RULE-O04 | Operations | MEDIUM | Trinity Dream State must run nightly with minimum data floor
  DETECT:  cron_run_log has no 'dream_state' entry for current date
           OR last entry status = 'failed'
  CORRECT: trinityDreamState.ts runs at 2am UTC — verify Railway cron is configured
           generateWonderInsight() skipped if workspace has < 5 shifts (by design)
  AUDIT:   cron_run_log.status + workspace_count + insights_generated per night

RULE-O05 | Operations | LOW | Stale voice sessions must be swept every 2 hours
  DETECT:  voice_call_sessions.status NOT IN ('completed','failed','orphaned')
           AND started_at < NOW() - 2 hours
  CORRECT: voiceSessionCleanup runs every 2 hours — verify it's scheduled
  AUDIT:   Swept sessions logged as 'orphaned' with cleanup reason

---

## SECTION 5 — DATA INTEGRITY RULES

RULE-D01 | Data | CRITICAL | workspace_id must be present on every tenant data query
  DETECT:  Any query to shifts, employees, invoices, time_entries without workspace_id filter
  CORRECT: ensureWorkspaceAccess middleware enforces workspace scope on all /api routes
           DB queries use WHERE workspace_id = $workspaceId — never omit this
  AUDIT:   OrgIsolationError logged and 403 returned on cross-tenant access attempt

RULE-D02 | Data | HIGH | Simulation records must auto-expire within 60 minutes
  DETECT:  is_simulation = true AND simulation_expires_at < NOW()
           in: shifts, employees, support_tickets, error_logs, simulation_runs
  CORRECT: warRoomSimulator.purgeExpiredSimulations() runs before each drill
           warRoomSimulator.drillAll() also triggers purge
  AUDIT:   Log count of purged simulation records per sweep

RULE-D03 | Data | HIGH | Inbound email workspaceId must be null for platform-level addresses
  DETECT:  platform_emails.workspace_id = 'coaileague-platform-workspace' (fake ID)
  CORRECT: resolveFallbackRoute returns workspaceId=null for platform_canonical resolution
  AUDIT:   platform_emails rows with workspace_id matching no workspaces row = data error

RULE-D04 | Data | MEDIUM | AI token counts must use integer arithmetic (no float rounding errors)
  DETECT:  ai_call_log has total_tokens where input_tokens + output_tokens != total_tokens
  CORRECT: Token counts stored as INTEGER — never FLOAT
  AUDIT:   aiMeteringService._recordAiCallAsync uses integer math only

RULE-D05 | Data | LOW | Offline-synced records must honor X-Local-Timestamp
  DETECT:  time_entries where X-Offline-Sync: true AND clock_in_time = server receipt time
           (should be the X-Local-Timestamp value instead)
  CORRECT: Server routes check X-Local-Timestamp header and use it as recordedAt
  AUDIT:   time_entries.is_offline_sync = true + original_timestamp stored

---

## SECTION 6 — TRINITY COGNITIVE RULES (self-reference)

RULE-T01 | Trinity | CRITICAL | Trinity cannot execute ACH transfers autonomously
  DETECT:  Any Gemini tool call matching 'plaid.*transfer' or 'disburse' or 'initiateTransfer'
           without human approval token in session context
  CORRECT: /api/plaid/disburse-batch requires requireOwner — Trinity cannot call this
           Trinity's 8 Absolute Restrictions: #4 — cannot execute payroll runs or ACH
  AUDIT:   If Trinity attempts disburse: log to trinity_patch_log as violation

RULE-T02 | Trinity | CRITICAL | Zero Liability Protocol: never offer to call 911
  DETECT:  Trinity response contains 'call 911 for you' or 'I will dispatch' or 'I will call'
  CORRECT: trinityContentGuardrails pattern detection blocks before response generation
  AUDIT:   Flag to trinity_guardrail_log with full response text

RULE-T03 | Trinity | HIGH | Dream insights require minimum 5 shifts of data
  DETECT:  trinity_patch_log has dream_insight with workspace having < 5 shifts
  CORRECT: generateWonderInsight() checks shiftCount < 5 and returns early
  AUDIT:   Log: dream_insight_skipped, reason: insufficient_data, shift_count

RULE-T04 | Trinity | HIGH | GitHub commits must be development branch only
  DETECT:  Any octokit commit with branch != 'development'
  CORRECT: githubDevOpsService hardcodes ALLOWED_BRANCH = 'development'
  AUDIT:   All commits include [AI-Generated] marker — verify before push

RULE-T05 | Trinity | MEDIUM | Trinity deliberation on hard-escalation topics must complete < 8 seconds
  DETECT:  sarge_deliberating broadcast followed by > 8 seconds without sarge_deliberation_complete
  CORRECT: Trinity sets 8-second timeout — SARGE proceeds with best judgment if exceeded
  AUDIT:   Log deliberation_timeout events to ai_performance_log

---

## REVISION HISTORY
- v1.0 — Initial rules from billing + auth + operational audit (all waves)
- Run: grep 'RULE-' PLATFORM_LOGIC_RULES.md to list all active rules
- Count: 25 rules across 5 categories
