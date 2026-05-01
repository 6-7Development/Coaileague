# SYSTEM_MANIFEST.md
## CoAIleague — Single Source of Truth

> **This is the canonical platform map.** All other documentation (1,074 files) has been consolidated here.
> Updated after every hardening phase. Used for audits, refactoring, go-live verification, and future AI sessions.

**Last updated:** 2026-05-01 | **Phase 2 complete, Phase 3 in progress**

```
PLATFORM STACK
  Frontend:    React 18 + Vite + TypeScript + Tailwind + shadcn/ui
  Backend:     Express + TypeScript + Drizzle ORM
  Database:    Neon PostgreSQL (production) + Railway (dev)
  AI Brain:    Trinity = Gemini + Claude + GPT triad (ONE unified identity)
  Auth:        Session-based + MFA + PIN + Auditor/SRA portals
  Deploy:      Railway development branch → Railway main/production
  Compliance:  Texas Occupations Code Chapter 1702 (Private Security Act)
  SMS/Voice:   Twilio (RCS/SMS/voice)
  Email:       Resend (outbound + inbound webhook routing)
  Payments:    Stripe (invoices) + Plaid (ACH payroll)
  PDF Vault:   All docs = branded PDF with header/footer/docId/page numbers
```

---

## CONTENTS
1. [Platform Census](#1-platform-census)
2. [D1: Auth & Onboarding](#d1-auth--onboarding)
3. [D2: Scheduling](#d2-scheduling)
4. [D3: Finance & Billing](#d3-finance--billing)
5. [D4: Compliance & Licensing (OC §1702)](#d4-compliance--licensing)
6. [D5: Workforce & HR](#d5-workforce--hr)
7. [D6: Messaging & ChatDock](#d6-messaging--chatdock)
8. [D7: Client Portal](#d7-client-portal)
9. [D8: Trinity AI](#d8-trinity-ai)
10. [D9: Platform Admin](#d9-platform-admin)
11. [Dead Ends & Ghost Routes](#dead-ends--ghost-routes)
12. [Phase Hardening Log](#phase-hardening-log)
13. [Known Issues Tracker](#known-issues-tracker)
14. [Deployment & Infrastructure](#deployment--infrastructure)

---

## 1. Platform Census

| Metric | Count |
|--------|-------|
| Client pages | 338 |
| Server route files | 363 |
| Total API endpoints | 2,793 |
| DB tables (pgTable) | 748 |
| Schema domains | 22 |
| React components | 265 |
| React hooks | 61 |
| OC §1702 enforcement files | 22 |
| Docs (after consolidation) | 8 |

**DB Tables by Domain:**
| Schema Domain | Tables | Core Tables |
|---------------|--------|-------------|
| `trinity` | 103 | decision_log, ai_brain_memory, action_registry, autonomous_runs |
| `billing` | 75 | invoices, invoice_items, payments, stripe_events, plaid_transfers |
| `audit` | 58 | audit_log, compliance_records, trinity_decision_log |
| `compliance` | 57 | guard_cards, licenses, psych_evals, certifications |
| `comms` | 60 | chat_rooms, messages, broadcasts, sms_logs, websocket_sessions |
| `workforce` | 68 | employees, positions, departments, documents |
| `ops` | 57 | work_orders, sites, incidents, post_orders |
| `orgs` | 41 | organizations, workspaces, workspace_members |
| `scheduling` | 42 | shifts, shift_assignments, staffing_requests, swap_requests |
| `clients` | 34 | clients, client_contacts, contracts, proposals |
| `support` | 41 | support_tickets, support_agents, escalations |
| `payroll` | 21 | payroll_runs, payroll_entries, direct_deposits, pay_stubs |
| `auth` | 25 | users, sessions, mfa_tokens, device_trust_tokens |
| `time` | 12 | time_entries, clock_events, timesheets |
| `sps` | 19 | sps_workspaces, sub_tenants, regulatory_mappings |
| `sales` | 16 | proposals, contracts, revenue_records |
| `training` | 9 | training_courses, completions, certifications |
| `recruitment` | 4 | applicants, job_postings |
| `voice` | 6 | voice_calls, transcripts, voice_commands |
| `storage` | 2 | documents, document_vault |
| `notifications-delivery` | 1 | notification_deliveries |
| `onboarding-tasks` | 2 | onboarding_tasks, task_completions |

---

## D1: AUTH & ONBOARDING
> **Identity, session, workspace provisioning, MFA, PIN, auditor/SRA portals**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `accept-invite.tsx` | 378 | useMutation | `/api/onboarding/workspace-invite/`<br>`/api/onboarding/invite/` | button-go-to-login, button-create-a | ✅ |
| `auditor-login.tsx` | 155 | useMutation | `/api/enforcement/auditor/login` | button-toggle-password, button-audi | ✅ |
| `co-auditor-login.tsx` | 69 | — | `/api/auditor/login` | — | ✅ |
| `custom-login.tsx` | 644 | — | `/api/auth/capabilities`<br>`/api/auth/login` | button-logo-login, button-resend-ve | ✅ |
| `custom-register.tsx` | 305 | — | — | button-toggle-password, button-togg | ✅ |
| `employee-onboarding-wizard.tsx` | 1238 | useQuery+useMutation | `/api/onboarding/invite/`<br>`/api/onboarding/application/` | button-connect-plaid, button-back | ✅ |
| `onboarding-start.tsx` | 280 | useMutation | `/api/invites/accept`<br>`/api/auth/me` | button-accept-invite, button-back-t | ✅ |
| `reset-password.tsx` | 338 | — | `/api/auth/reset-password-confirm` | button-request-new-link, button-go- | ✅ |
| `sps-onboarding-wizard.tsx` | 443 | useQuery+useMutation | `/api/sps/forms/` | — | ✅ |
| `verify-email.tsx` | 84 | — | `/api/auth/verify-email`<br>`/api/auth/resend-verification` | — | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `POST` | `/api/auth/register` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `POST` | `/api/auth/verify-email` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `GET` | `/api/auth/verify-email/:token` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `POST` | `/api/auth/resend-verification` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `POST` | `/api/auth/login` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `POST` | `/api/auth/mfa/verify` | `requireAuth` | `authCoreRoutes.ts` | ✅ |
| `GET` | `/csrf-token` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/csrf-token` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/logout-all` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/forgot-password` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/reset-password` | `PUBLIC` | `authRoutes.ts` | ✅ |
| `POST` | `/magic-link` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `GET` | `/portal/setup/:token` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `POST` | `/portal/setup/:token` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `POST` | `/:id/invite` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `DELETE` | `/portal/invite/:inviteId/revoke` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `GET` | `/portal/invite/status` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
**Texas OC §1702 enforcement:**
- `server/services/employeeDocumentOnboardingService.ts` enforces `§1702.163, §1702.230`

**Key services:**
- `server/services/**/assistedOnboardingService.ts`
- `server/services/**/authService.ts`
- `server/services/**/employeeDocumentOnboardingService.ts`
- `server/services/**/employeeOnboardingPipelineService.ts`
- `server/services/**/enterpriseOnboardingOrchestrator.ts`

### 💾  Persistence Layer — DB Tables
**`auth`** (23 tables): `api_keys` (via `apiKeys`) · `platform_roles` (via `platformRoles`) · `role_templates` (via `roleTemplates`) · `integration_api_keys` (via `integrationApiKeys`) · `idempotency_keys` (via `idempotencyKeys`) · `oauth_states` (via `oauthStates`) · `external_identifiers` (via `externalIdentifiers`) · `id_sequences` (via `idSequences`)
  *...+15 more in `auth` domain*
**`orgs`** (39 tables): `celebration_templates` (via `celebrationTemplates`) · `milestone_tracker` (via `milestoneTracker`) · `org_creation_progress` (via `orgCreationProgress`) · `tenant_onboarding_progress` (via `tenantOnboardingProgress`) · `tenant_onboarding_steps` (via `tenantOnboardingSteps`) · `workspace_cost_summary` (via `workspaceCostSummary`) · `workspace_credit_balance` (via `workspaceCreditBalance`) · `user_onboarding` (via `userOnboarding`)
  *...+31 more in `orgs` domain*
**`onboarding-tasks`** (2 tables): `onboarding_task_templates` (via `onboardingTaskTemplates`) · `employee_onboarding_completions` (via `employeeOnboardingCompletions`)

---

## D2: SCHEDULING
> **Shift creation/publication, coverage, swaps, Trinity auto-scheduling, TX OC 1702 gate**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `schedule-mobile-first.tsx` | 1453 | useQuery+useMutation | `/api/shifts/`<br>`/api/shifts?weekStart=` | button-prev-week, button-next-week | ✅ |
| `shift-marketplace.tsx` | 928 | useQuery+useMutation | `/api/shifts/`<br>`/api/scheduling/swap-requests/` | button-post-new-shift, button-post- | ✅ |
| `team-schedule.tsx` | 5 | — | — | — | ✅ |
| `universal-schedule.tsx` | 3254 | useQuery+useMutation | `/api/shifts?workspaceId=`<br>`/api/shifts/` | button-discard-pending, button-save | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/contractors` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `POST` | `/contractors` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `PATCH` | `/contractors/:id` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `GET` | `/availability/:contractorId` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `POST` | `/availability` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `DELETE` | `/availability/:id` | `requireAuth` | `flexStaffingRoutes.ts` | ✅ |
| `GET` | `/status` | `requireAuth` | `orchestratedScheduleRoutes.ts` | ✅ |
| `POST` | `/ai/fill-shift` | `requireAuth` | `orchestratedScheduleRoutes.ts` | ✅ |
| `POST` | `/ai/trigger-session` | `requireAuth` | `orchestratedScheduleRoutes.ts` | ✅ |
| `GET` | `/executions` | `requireAuth` | `orchestratedScheduleRoutes.ts` | 👻 |
| `GET` | `/executions/:executionId` | `requireAuth` | `orchestratedScheduleRoutes.ts` | 👻 |
| `GET` | `/orchestration/:orchestrationId/steps` | `requireAuth` | `orchestratedScheduleRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
*No OC §1702 references in this domain.*

**Key services:**
- `server/services/**/autonomousScheduler.ts`
- `server/services/**/developmentSeedShifts.ts`
- `server/services/**/scheduleLiveNotifier.ts`
- `server/services/**/scheduleMigration.ts`
- `server/services/**/scheduleRollbackService.ts`

### 💾  Persistence Layer — DB Tables
**`scheduling`** (42 tables): `schedules` (via `schedules`) · `shift_requests` (via `shiftRequests`) · `shift_offers` (via `shiftOffers`) · `shifts` (via `shifts`) · `custom_scheduler_intervals` (via `customSchedulerIntervals`) · `recurring_shift_patterns` (via `recurringShiftPatterns`) · `shift_swap_requests` (via `shiftSwapRequests`) · `schedule_templates` (via `scheduleTemplates`)
  *...+34 more in `scheduling` domain*
**`time`** (12 tables): `pto_requests` (via `ptoRequests`) · `time_entries` (via `timeEntries`) · `time_entry_audit_events` (via `timeEntryAuditEvents`) · `gps_locations` (via `gpsLocations`) · `scheduled_breaks` (via `scheduledBreaks`) · `evv_visit_records` (via `evvVisitRecords`) · `manual_clockin_overrides` (via `manualClockinOverrides`) · `time_entry_breaks` (via `timeEntryBreaks`)
  *...+4 more in `time` domain*

---

## D3: FINANCE & BILLING
> **Invoice generation, payroll runs, ACH/Stripe/Plaid, QuickBooks sync, pay stubs**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `billing.tsx` | 2025 | useQuery+useMutation | `/api/workspace`<br>`/api/billing/subscription` | button-resolve-account, button-upgr | ✅ |
| `budgeting.tsx` | 628 | useQuery+useMutation | — | button-create-budget, dialog-create | ✅ |
| `cash-flow-dashboard.tsx` | 305 | useQuery | `/api/invoices/cash-flow-summary` | — | ✅ |
| `disputes.tsx` | 562 | useQuery+useMutation | `/api/disputes/` | button-create-dispute, button-cance | ✅ |
| `financial/pl-dashboard.tsx` | 726 | useQuery | `/api/finance/recognition/summary`<br>`/api/finance/forecast` | — | ✅ |
| `invoices.tsx` | 1904 | useQuery+useMutation | `/api/invoices/`<br>`/api/invoices` | button-bulk-resend, button-send-all | ✅ |
| `payroll-dashboard.tsx` | 987 | useQuery+useMutation | `/api/payroll/runs/` | button-run-pto-accrual, button-crea | ✅ |
| `quickbooks-import.tsx` | 1996 | useQuery+useMutation | `/api/integrations/connections?workspaceId=`<br>`/api/integrations/quickbooks/preview?workspac` | button-resume-wizard, button-start- | ✅ |
| `review-disputes.tsx` | 490 | useQuery+useMutation | `/api/disputes/` | button-approve, button-reject | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/workspace` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `POST` | `/workspace` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `PATCH` | `/workspace` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `GET` | `/clients` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `GET` | `/clients/:clientId` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `POST` | `/clients/:clientId` | `requireManager` | `billingSettingsRoutes.ts` | ✅ |
| `POST` | `/upload` | `requireAuth` | `email-attachments.ts` | ✅ |
| `POST` | `/billing/adjust-invoice/credit` | `requireManager` | `financeInlineRoutes.ts` | ✅ |
| `POST` | `/billing/adjust-invoice/discount` | `requireManager` | `financeInlineRoutes.ts` | ✅ |
| `POST` | `/billing/adjust-invoice/refund` | `requireManager` | `financeInlineRoutes.ts` | ✅ |
| `POST` | `/billing/adjust-invoice/correct-line-item` | `requireManager` | `financeInlineRoutes.ts` | 👻 |
| `GET` | `/billing/adjust-invoice/:invoiceId/history` | `requireManager` | `financeInlineRoutes.ts` | ✅ |
| `POST` | `/billing/adjust-invoice/bulk-credit` | `requireManager` | `financeInlineRoutes.ts` | 👻 |

### 🧠  Logic Layer — Guards & Compliance
*No OC §1702 references in this domain.*

**Key services:**
- `server/services/**/billingAutomation.ts`
- `server/services/**/invoiceAdjustmentService.ts`
- `server/services/**/payrollAutomation.ts`
- `server/services/**/payrollDeductionService.ts`
- `server/services/**/payrollTransferMonitor.ts`

### 💾  Persistence Layer — DB Tables
**`billing`** (75 tables): `revenue_recognition_schedule` (via `revenueRecognitionSchedule`) · `deferred_revenue` (via `deferredRevenue`) · `processed_revenue_events` (via `processedRevenueEvents`) · `contract_revenue_mapping` (via `contractRevenueMapping`) · `external_cost_log` (via `externalCostLog`) · `labor_cost_forecast` (via `laborCostForecast`) · `platform_ai_provider_budgets` (via `platformAiProviderBudgets`) · `platform_cost_rates` (via `platformCostRates`)
  *...+67 more in `billing` domain*
**`payroll`** (21 tables): `employee_benefits` (via `employeeBenefits`) · `payroll_settings` (via `payrollSettings`) · `payroll_proposals` (via `payrollProposals`) · `off_cycle_payroll_runs` (via `offCyclePayrollRuns`) · `payroll_runs` (via `payrollRuns`) · `payroll_entries` (via `payrollEntries`) · `employee_payroll_info` (via `employeePayrollInfo`) · `employee_rate_history` (via `employeeRateHistory`)
  *...+13 more in `payroll` domain*
**`sales`** (16 tables): `bid_analytics` (via `bidAnalytics`) · `contract_health_scores` (via `contractHealthScores`) · `contract_renewal_tasks` (via `contractRenewalTasks`) · `leads` (via `leads`) · `deals` (via `deals`) · `rfps` (via `rfps`) · `proposals` (via `proposals`) · `deal_tasks` (via `dealTasks`)
  *...+8 more in `sales` domain*

---

## D4: COMPLIANCE & LICENSING
> **TX OC §1702.161/163/201/323 enforcement, guard cards, psych eval, auditor/SRA**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `applicant-visual-compliance.tsx` | 279 | useQuery+useMutation | `/api/audit-suite/visual-compliance/` | — | ✅ |
| `armory-compliance.tsx` | 657 | useQuery+useMutation | `/api/armory/inspections`<br>`/api/armory/summary` | submit-inspection, submit-qualifica | ✅ |
| `auditor-portal.tsx` | 569 | useQuery | `/api/invoices`<br>`/api/time-entries` | button-export-invoices, button-expo | ✅ |
| `compliance-evidence.tsx` | 258 | useQuery+useMutation | `/api/compliance-evidence/pending`<br>`/api/compliance-evidence/expiring` | button-submit-evidence | ✅ |
| `compliance-matrix.tsx` | 467 | useQuery | `/api/security-compliance/matrix` | — | ✅ |
| `compliance-reports.tsx` | 361 | useQuery+useMutation | `/api/compliance-reports/` | tab-generate, button-generate-repor | ✅ |
| `compliance-scenarios.tsx` | 341 | useQuery | `/api/compliance/acme-scenarios` | button-run-scenarios, button-run-sc | ✅ |
| `compliance/approvals.tsx` | 453 | useQuery+useMutation | `/api/security-compliance/approvals/` | card-approved-count, button-needs-r | ✅ |
| `compliance/audit-readiness.tsx` | 436 | useQuery | `/api/compliance/regulatory-portal/audit-readi`<br>`/api/compliance/regulatory-portal/upload-docu` | button-refresh-readiness, button-di | ✅ |
| `compliance/auditor-portal.tsx` | 472 | useQuery | — | — | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/` | `requireAuth` | `compliance/regulator.ts` | ✅ |
| `POST` | `/` | `requireAuth` | `compliance/regulator.ts` | ✅ |
| `POST` | `/:id/revoke` | `requireAuth` | `compliance/regulator.ts` | ✅ |
| `GET` | `/portal/:token` | `requireAuth` | `compliance/regulator.ts` | ✅ |
| `GET` | `/portal/:token/employee/:employeeId/documents` | `requireAuth` | `compliance/regulator.ts` | ✅ |
| `GET` | `/status` | `requireAuth` | `compliance/regulatoryEnrollment.ts` | ✅ |
| `GET` | `/workspace` | `requireAuth` | `compliance/regulatoryEnrollment.ts` | ✅ |
| `POST` | `/submit` | `requireAuth` | `compliance/regulatoryEnrollment.ts` | ✅ |
| `PATCH` | `/:employeeId/review` | `requireAuth` | `compliance/regulatoryEnrollment.ts` | ✅ |
| `POST` | `/lookup` | `requireAuth` | `compliance/regulatoryPortal.ts` | ✅ |
| `POST` | `/request` | `requireAuth` | `compliance/regulatoryPortal.ts` | ✅ |
| `GET` | `/request/:id/status` | `requireAuth` | `compliance/regulatoryPortal.ts` | ✅ |
| `POST` | `/request/:id/dispute` | `requireAuth` | `compliance/regulatoryPortal.ts` | ✅ |
| `POST` | `/request/:id/grant` | `requireAuth` | `compliance/regulatoryPortal.ts` | 👻 |
| `GET` | `/dashboard/:workspaceId/overview` | `requireAuth` | `compliance/regulatoryPortal.ts` | ✅ |
| `GET` | `/incidents` | `requireAuth` | `complianceRoutes.ts` | ✅ |
| `GET` | `/policies` | `requireAuth` | `complianceRoutes.ts` | ✅ |
| `GET` | `/signatures` | `requireAuth` | `complianceRoutes.ts` | ✅ |
| `GET` | `/approvals` | `requireAuth` | `complianceRoutes.ts` | ✅ |
| `GET` | `/summary` | `requireAuth` | `complianceRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
**Texas OC §1702 enforcement:**
- `server/services/compliance/regulatoryViolationService.ts` enforces `1702.323, 1702.161, 1702.163`
- `server/services/compliance/stateRegulatoryKnowledgeBase.ts` enforces `1702.163`
- `server/services/compliance/texasGatekeeper.ts` enforces `§1702.161, OC §1702.163, §1702.201, §1702.323, OC §1702.201, §1702.163, OC §1702.323, OC §1702.161`

**Key services:**
- `server/services/**/aiGuardRails.ts`
- `server/services/**/complianceAlertService.ts`
- `server/services/**/complianceMonitoring.ts`
- `server/services/**/complianceReports.ts`
- `server/services/**/complianceScoreMonitor.ts`

### 💾  Persistence Layer — DB Tables
**`compliance`** (57 tables): `regulatory_rules` (via `regulatoryRules`) · `regulatory_updates` (via `regulatoryUpdates`) · `employee_i9_records` (via `employeeI9Records`) · `security_incidents` (via `securityIncidents`) · `document_signatures` (via `documentSignatures`) · `company_policies` (via `companyPolicies`) · `policy_acknowledgments` (via `policyAcknowledgments`) · `document_access_logs` (via `documentAccessLogs`)
  *...+49 more in `compliance` domain*
**`audit`** (58 tables): `automation_triggers` (via `automationTriggers`) · `leader_actions` (via `leaderActions`) · `audit_logs` (via `auditLogs`) · `report_templates` (via `reportTemplates`) · `report_submissions` (via `reportSubmissions`) · `report_workflow_configs` (via `reportWorkflowConfigs`) · `report_approval_steps` (via `reportApprovalSteps`) · `locked_report_records` (via `lockedReportRecords`)
  *...+50 more in `audit` domain*

---

## D5: WORKFORCE & HR
> **Employee lifecycle, HRIS, documents, training, performance, positions, time-off**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `assisted-onboarding.tsx` | 367 | useQuery+useMutation | `/api/support/assisted-onboarding/list`<br>`/api/support/assisted-onboarding/create` | button-create-new, button-cancel-cr | ✅ |
| `communications-onboarding.tsx` | 384 | useMutation | — | button-add-channel, button-back | ✅ |
| `employee-profile.tsx` | 1159 | useQuery+useMutation | `/api/employees?workspaceId=`<br>`/api/hr/manager-assignments/employee/` | button-go-to-settings, button-go-to | ✅ |
| `employees.tsx` | 1622 | useQuery+useMutation | `/api/manager-assignments?workspaceId=`<br>`/api/login` | button-retry-employees, button-impo | ✅ |
| `onboarding.tsx` | 501 | useQuery+useMutation | `/api/onboarding/tasks/` | button-apply-reward, button-start-o | ✅ |
| `performance.tsx` | 1345 | useQuery+useMutation | `/api/performance/disciplinary/`<br>`/api/performance/reviews/` | button-submit-appeal, button-submit | ✅ |
| `training.tsx` | 1155 | useQuery+useMutation | `/api/training/sessions/` | button-qr-checkin, button-start-ses | ✅ |
| `workspace-onboarding.tsx` | 495 | useQuery+useMutation | `/api/quickbooks/flow/` | button-retry-flow | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/csrf-token` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/csrf-token` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/logout-all` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/forgot-password` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `POST` | `/reset-password` | `PUBLIC` | `authRoutes.ts` | ✅ |
| `POST` | `/magic-link` | `PUBLIC` | `authRoutes.ts` | 👻 |
| `GET` | `/search` | `requireAuth` | `chatSearchRoutes.ts` | ✅ |
| `GET` | `/` | `requireAuth` | `compliance/documentTypes.ts` | ✅ |
| `GET` | `/:typeCode` | `requireAuth` | `compliance/documentTypes.ts` | ✅ |
| `GET` | `/employee/:employeeId` | `requireAuth` | `compliance/documents.ts` | ✅ |
| `GET` | `/record/:recordId` | `requireAuth` | `compliance/documents.ts` | ✅ |
| `GET` | `/:documentId` | `requireAuth` | `compliance/documents.ts` | ✅ |
| `POST` | `/` | `requireAuth` | `compliance/documents.ts` | ✅ |
| `POST` | `/:documentId/lock` | `requireAuth` | `compliance/documents.ts` | ✅ |
| `PATCH` | `/:documentId` | `requireAuth` | `compliance/documents.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
**Texas OC §1702 enforcement:**
- `server/services/employeeDocumentOnboardingService.ts` enforces `§1702.163, §1702.230`
- `server/services/trinity/trinityDisciplinaryWorkflow.ts` enforces `OC §1702.163, OC §1702.3615`

**Key services:**
- `server/services/**/breachResponseSOP.ts`
- `server/services/**/employeeBehaviorScoring.ts`
- `server/services/**/employeeDocumentOnboardingService.ts`
- `server/services/**/employeeOnboardingPipelineService.ts`
- `server/services/**/employeePatternService.ts`

### 💾  Persistence Layer — DB Tables
**`workforce`** (67 tables): `applicant_interviews` (via `applicantInterviews`) · `applicants` (via `applicants`) · `employee_onboarding_progress` (via `employeeOnboardingProgress`) · `employee_onboarding_steps` (via `employeeOnboardingSteps`) · `employee_training_records` (via `employeeTrainingRecords`) · `interview_question_sets` (via `interviewQuestionSets`) · `interview_sessions` (via `interviewSessions`) · `job_postings` (via `jobPostings`)
  *...+59 more in `workforce` domain*
**`training`** (9 tables): `training_modules` (via `trainingModules`) · `training_sections` (via `trainingSections`) · `training_questions` (via `trainingQuestions`) · `training_attempts` (via `officerTrainingAttempts`) · `training_certificates` (via `officerTrainingCertificates`) · `training_interventions` (via `trainingInterventions`) · `training_providers` (via `trainingProviders`) · `training_sessions` (via `trainingSessions`)
  *...+1 more in `training` domain*
**`recruitment`** (4 tables): `interview_candidates` (via `interviewCandidates`) · `candidate_interview_sessions` (via `candidateInterviewSessions`) · `interview_questions_bank` (via `interviewQuestionsBank`) · `interview_scorecards` (via `interviewScorecards`)

---

## D6: MESSAGING & CHATDOCK
> **ChatDock rooms, broadcasts, HelpAI, Trinity voice, SMS/Twilio, WebSocket pub/sub**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `audit-chatdock.tsx` | 262 | useQuery+useMutation | `/api/audit-suite/audits/` | — | ✅ |
| `briefing-channel.tsx` | 385 | useQuery | `/api/voice/tts`<br>`/api/broadcasts/briefing` | button-briefing-ask-trinity, button | ✅ |
| `broadcasts.tsx` | 195 | — | — | button-send-broadcast | ✅ |
| `incident-pipeline.tsx` | 587 | useQuery+useMutation | `/api/incident-reports`<br>`/api/incident-reports/` | button-back-loading, button-retry-i | ✅ |
| `worker-incidents.tsx` | 419 | useQuery+useMutation | — | button-new-incident, button-voice-i | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/rooms` | `requireManager` | `dockChatRoutes.ts` | ✅ |
| `POST` | `/rooms` | `requireManager` | `dockChatRoutes.ts` | ✅ |
| `GET` | `/rooms/:roomId/messages` | `requireManager` | `dockChatRoutes.ts` | ✅ |
| `POST` | `/rooms/:roomId/messages` | `requireManager` | `dockChatRoutes.ts` | ✅ |
| `POST` | `/rooms/:roomId/broadcast` | `requireManager` | `dockChatRoutes.ts` | ✅ |
| `GET` | `/direct/:targetUserId` | `requireManager` | `dockChatRoutes.ts` | 👻 |
| `POST` | `/feedback` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `GET` | `/faq/entries` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `POST` | `/session/start` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `POST` | `/session/:sessionId/message` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `POST` | `/session/:sessionId/escalate` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `POST` | `/session/:sessionId/close` | `requirePlatformStaff` | `helpdeskRoutes.ts` | ✅ |
| `POST` | `/chatrooms` | `requireAuth` | `interviewChatroomRoutes.ts` | 👻 |
| `POST` | `/chatrooms/:id/start` | `requireAuth` | `interviewChatroomRoutes.ts` | ✅ |
| `GET` | `/chatrooms` | `requireAuth` | `interviewChatroomRoutes.ts` | 👻 |
| `GET` | `/chatrooms/:id` | `requireAuth` | `interviewChatroomRoutes.ts` | 👻 |
| `PATCH` | `/chatrooms/:id/decision` | `requireAuth` | `interviewChatroomRoutes.ts` | ✅ |
| `GET` | `/room/:token` | `requireAuth` | `interviewChatroomRoutes.ts` | ✅ |
| `GET` | `/active` | `PUBLIC` | `shiftChatroomRoutes.ts` | ✅ |
| `GET` | `/by-shift/:shiftId` | `PUBLIC` | `shiftChatroomRoutes.ts` | 👻 |
| `GET` | `/:chatroomId/premium-status` | `PUBLIC` | `shiftChatroomRoutes.ts` | 👻 |
| `GET` | `/dar/:darId` | `PUBLIC` | `shiftChatroomRoutes.ts` | ✅ |
| `GET` | `/:shiftId/:timeEntryId` | `PUBLIC` | `shiftChatroomRoutes.ts` | ✅ |
| `POST` | `/:conversationId/messages` | `PUBLIC` | `shiftChatroomRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
*No OC §1702 references in this domain.*

**Key services:**
- `server/services/**/ChatServerHub.ts`
- `server/services/**/MessageBridgeService.ts`
- `server/services/**/broadcastService.ts`
- `server/services/**/chatParityService.ts`
- `server/services/**/chatSentimentService.ts`

### 💾  Persistence Layer — DB Tables
**`comms`** (60 tables): `user_mascot_preferences` (via `userMascotPreferences`) · `chat_conversations` (via `chatConversations`) · `chat_messages` (via `chatMessages`) · `message_reactions` (via `messageReactions`) · `message_read_receipts` (via `messageReadReceipts`) · `chat_macros` (via `chatMacros`) · `typing_indicators` (via `typingIndicators`) · `chat_uploads` (via `chatUploads`)
  *...+52 more in `comms` domain*
**`notifications-delivery`** (1 tables): `notification_deliveries` (via `notificationDeliveries`)

---

## D7: CLIENT PORTAL
> **Client-facing portal, work orders, site management, contracts, proposals**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `client-communications.tsx` | 639 | useQuery+useMutation | `/api/clients/lookup`<br>`/api/client-comms/threads` | button-cancel-thread, button-create | ✅ |
| `client-portal.tsx` | 2289 | useQuery+useMutation | `/api/clients/coi-request`<br>`/api/clients/contract-renewal-request` | button-submit-coi-request, button-s | ✅ |
| `client-portal/setup.tsx` | 285 | useMutation | `/api/clients/portal/setup/` | button-cp-create-account | ✅ |
| `client-profitability.tsx` | 610 | useQuery | `/api/analytics/client-profitability` | button-toggle-inactive, button-sort | ✅ |
| `client-satisfaction.tsx` | 292 | useQuery+useMutation | `/api/client-satisfaction/dashboard`<br>`/api/clients/lookup` | button-back-clients, button-add-che | ✅ |
| `client-signup.tsx` | 398 | useQuery+useMutation | `/api/client-status/` | button-lookup-status, button-lookup | ✅ |
| `client-status-lookup.tsx` | 316 | useQuery | `/api/client-status/` | button-search-status, button-create | ✅ |
| `clients.tsx` | 1120 | useQuery+useMutation | `/api/clients/deactivated?workspaceId=`<br>`/api/clients/` | button-add-client, switch-client-au | ✅ |
| `pay-invoice.tsx` | 572 | useQuery+useMutation | `/api/invoices/` | button-complete-payment, button-ini | ✅ |
| `sps-client-pipeline.tsx` | 998 | useQuery+useMutation | `/api/sps/documents`<br>`/api/sps/negotiations` | button-new-proposal, button-send-pr | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/portal/setup/:token` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `POST` | `/portal/setup/:token` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `POST` | `/:id/invite` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `DELETE` | `/portal/invite/:inviteId/revoke` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `GET` | `/portal/invite/status` | `requireManager` | `clientPortalInviteRoutes.ts` | ✅ |
| `GET` | `/` | `requireManager` | `clientRoutes.ts` | ✅ |
| `GET` | `/lookup` | `requireManager` | `clientRoutes.ts` | ✅ |
| `POST` | `/` | `requireManager` | `clientRoutes.ts` | ✅ |
| `PATCH` | `/:id` | `requireManager` | `clientRoutes.ts` | ✅ |
| `GET` | `/deactivated` | `requireManager` | `clientRoutes.ts` | ✅ |
| `POST` | `/:id/deactivate` | `requireManager` | `clientRoutes.ts` | ✅ |
| `POST` | `/templates` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `PATCH` | `/templates/:id` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `GET` | `/` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `POST` | `/` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `GET` | `/access` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `GET` | `/stats` | `requireAuth` | `contractPipelineRoutes.ts` | ✅ |
| `GET` | `/contracts` | `requireAuth` | `contractRenewalRoutes.ts` | ✅ |
| `GET` | `/contracts/:id` | `requireAuth` | `contractRenewalRoutes.ts` | ✅ |
| `PATCH` | `/contracts/:id/renewal` | `requireAuth` | `contractRenewalRoutes.ts` | ✅ |
| `POST` | `/contracts/:id/tasks` | `requireAuth` | `contractRenewalRoutes.ts` | ✅ |
| `PATCH` | `/tasks/:taskId/complete` | `requireAuth` | `contractRenewalRoutes.ts` | ✅ |
| `POST` | `/run-check` | `requireAuth` | `contractRenewalRoutes.ts` | 👻 |
| `GET` | `/keys` | `requireAuth` | `developerPortalRoutes.ts` | ✅ |
| `POST` | `/keys` | `requireAuth` | `developerPortalRoutes.ts` | ✅ |
| `DELETE` | `/keys/:id` | `requireAuth` | `developerPortalRoutes.ts` | ✅ |
| `GET` | `/keys/:id/usage` | `requireAuth` | `developerPortalRoutes.ts` | ✅ |
| `GET` | `/status` | `requireAuth` | `developerPortalRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
*No OC §1702 references in this domain.*

**Key services:**
- `server/services/**/clientCollectionsService.ts`
- `server/services/**/clientCommsMigration.ts`
- `server/services/**/clientProspectService.ts`
- `server/services/**/compositeScoresService.ts`
- `server/services/**/quickbooksClientBillingSync.ts`

### 💾  Persistence Layer — DB Tables
**`clients`** (34 tables): `client_concerns` (via `clientConcerns`) · `client_satisfaction_records` (via `clientSatisfactionRecords`) · `post_order_version_acknowledgments` (via `postOrderVersionAcknowledgments`) · `post_order_versions` (via `postOrderVersions`) · `site_margin_scores` (via `siteMarginScores`) · `subcontractor_companies` (via `subcontractorCompanies`) · `client_message_threads` (via `clientMessageThreads`) · `client_messages` (via `clientMessages`)
  *...+26 more in `clients` domain*
**`sales`** (16 tables): `bid_analytics` (via `bidAnalytics`) · `contract_health_scores` (via `contractHealthScores`) · `contract_renewal_tasks` (via `contractRenewalTasks`) · `leads` (via `leads`) · `deals` (via `deals`) · `rfps` (via `rfps`) · `proposals` (via `proposals`) · `deal_tasks` (via `dealTasks`)
  *...+8 more in `sales` domain*

---

## D8: TRINITY AI
> **Trinity biological brain (Gemini+Claude+GPT), autonomous scheduler, OC 1702 gatekeeper**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `trinity-agent-dashboard.tsx` | 860 | useQuery+useMutation | `/api/trinity/agent-dashboard/reasoning/` | — | ✅ |
| `trinity-chat.tsx` | 369 | useQuery+useMutation | `/api/trinity/chat/session/` | button-history, button-settings | ✅ |
| `trinity-features.tsx` | 988 | — | — | button-teaser-see-pricing, button-t | ✅ |
| `trinity-insights.tsx` | 343 | useQuery+useMutation | `/api/trinity/insights/` | button-scan | ✅ |
| `trinity-transparency-dashboard.tsx` | 915 | useQuery | `/api/trinity/transparency/cost-breakdown?mont`<br>`/api/trinity/transparency/actions?limit=20&of` | — | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `GET` | `/health` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | ✅ |
| `GET` | `/services` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | 👻 |
| `GET` | `/services/:serviceName` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | 👻 |
| `POST` | `/services/:serviceName/pause` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | ✅ |
| `POST` | `/services/:serviceName/resume` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | ✅ |
| `GET` | `/workflows` | `requirePlatformStaff` | `aiBrainControlRoutes.ts` | ✅ |
| `POST` | `/detect-issues` | `requireManager` | `aiBrainInlineRoutes.ts` | 👻 |
| `GET` | `/guardrails/config` | `requireManager` | `aiBrainInlineRoutes.ts` | ✅ |
| `GET` | `/knowledge/diagnostics` | `requireManager` | `aiBrainInlineRoutes.ts` | ✅ |
| `GET` | `/fast-mode/tiers` | `requireManager` | `aiBrainInlineRoutes.ts` | ✅ |
| `POST` | `/work-orders/execute` | `requireManager` | `aiBrainInlineRoutes.ts` | ✅ |
| `GET` | `/work-orders/batch/:batchId` | `requireManager` | `aiBrainInlineRoutes.ts` | ✅ |
| `POST` | `/chat` | `PUBLIC` | `sra/sraTrinityRoutes.ts` | ✅ |
| `GET` | `/sections` | `PUBLIC` | `sra/sraTrinityRoutes.ts` | ✅ |
| `PATCH` | `/sections/:index/verify` | `PUBLIC` | `sra/sraTrinityRoutes.ts` | ✅ |
| `POST` | `/generate-pdf` | `PUBLIC` | `sra/sraTrinityRoutes.ts` | ✅ |
| `GET` | `/download/:docId` | `PUBLIC` | `sra/sraTrinityRoutes.ts` | ✅ |
| `GET` | `/insights` | `requireManager` | `trinitySchedulingRoutes.ts` | ✅ |
| `POST` | `/auto-fill` | `requireManager` | `trinitySchedulingRoutes.ts` | 👻 |
| `POST` | `/ask` | `requireManager` | `trinitySchedulingRoutes.ts` | ✅ |
| `POST` | `/schedule-shift` | `requireManager` | `trinitySchedulingRoutes.ts` | 👻 |
| `GET` | `/pending-approvals` | `requireManager` | `trinitySchedulingRoutes.ts` | ✅ |
| `POST` | `/pending-approvals/:id/approve` | `requireManager` | `trinitySchedulingRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
**Texas OC §1702 enforcement:**
- `server/services/autonomousScheduler.ts` enforces `OC §1702.201`
- `server/services/ai-brain/trinityPersona.ts` enforces `§1702.161, 1702.201, OC §1702.163, OC §1702.102, §1702.201, §1702.323, OC §1702.201, §1702.163, OC §1702.323, OC §1702.161`
- `server/services/compliance/texasGatekeeper.ts` enforces `§1702.161, OC §1702.163, §1702.201, §1702.323, OC §1702.201, §1702.163, OC §1702.323, OC §1702.161`
- `server/services/scheduling/trinityAutonomousScheduler.ts` enforces `§1702.161, texasGatekeeper, §1702.201, §1702.323, §1702.163`

**Key services:**
- `server/services/**/aiActivityService.ts`
- `server/services/**/aiBot.ts`
- `server/services/**/aiGuardRails.ts`
- `server/services/**/aiNotificationService.ts`
- `server/services/**/aiSchedulingTriggerService.ts`

### 💾  Persistence Layer — DB Tables
**`trinity`** (103 tables): `agent_registry` (via `agentRegistry`) · `agent_task_logs` (via `agentTaskLogs`) · `agent_tasks` (via `agentTasks`) · `ai_cost_config` (via `aiCostConfig`) · `ai_usage_log` (via `aiUsageLog`) · `counterfactual_simulations` (via `counterfactualSimulations`) · `curiosity_queue` (via `curiosityQueue`) · `incubation_queue` (via `incubationQueue`)
  *...+95 more in `trinity` domain*
**`ops`** (57 tables): `incident_patterns` (via `incidentPatterns`) · `assets` (via `assets`) · `asset_schedules` (via `assetSchedules`) · `asset_usage_logs` (via `assetUsageLogs`) · `maintenance_alerts` (via `maintenanceAlerts`) · `maintenance_acknowledgments` (via `maintenanceAcknowledgments`) · `dispatch_incidents` (via `dispatchIncidents`) · `dispatch_assignments` (via `dispatchAssignments`)
  *...+49 more in `ops` domain*

---

## D9: PLATFORM ADMIN
> **Root admin, tenant management, support agents, platform health, subscriptions**

### 🖥️  UI Layer — Pages
| Page | Lines | Hooks | Key API Calls | Actions (testids) | Status |
|------|-------|-------|---------------|-------------------|--------|
| `admin-banners.tsx` | 294 | useQuery+useMutation | `/api/promotional-banners/` | button-new-banner, button-save-bann | ✅ |
| `admin-custom-forms.tsx` | 1311 | useQuery+useMutation | `/api/form-builder/forms/`<br>`/api/form-builder/submissions/` | button-save-form, select-approver-r | ✅ |
| `admin-helpai.tsx` | 1099 | useQuery+useMutation | `/api/clients/dockchat/reports`<br>`/api/helpai/admin/stats` | button-close-session, button-refres | ✅ |
| `admin-permission-matrix.tsx` | 546 | useQuery+useMutation | `/api/admin/permissions/workspaces`<br>`/api/admin/permissions/meta` | button-refresh-admin-matrix | ✅ |
| `admin-security.tsx` | 258 | — | `/api/security-admin/overrides`<br>`/api/security-admin/auditor-allowlist` | — | ✅ |
| `admin-ticket-reviews.tsx` | 186 | useQuery | — | — | ✅ |
| `admin-usage.tsx` | 439 | useQuery | — | button-prev-page, button-next-page | ✅ |
| `admin/support-console-tickets.tsx` | 314 | useQuery | `/api/support/escalated`<br>`/api/support/priority-queue` | button-back-console, button-refresh | ✅ |
| `admin/support-console-workspace.tsx` | 533 | useQuery+useMutation | `/api/admin/workspaces`<br>`/api/admin/workspaces/` | button-back-no-ws, button-back-work | ✅ |
| `admin/support-console.tsx` | 635 | useQuery+useMutation | `/api/support/escalated`<br>`/api/support/priority-queue` | button-execute-action, button-refre | ✅ |

### 🔌  API Layer — Routes
| Method | Path | Middleware Guard | Route File | UI Caller |
|--------|------|-----------------|------------|-----------|
| `POST` | `/dev-execute` | `requirePlatformStaff` | `adminRoutes.ts` | 👻 |
| `PATCH` | `/workspace/:workspaceId` | `requirePlatformStaff` | `adminRoutes.ts` | ✅ |
| `GET` | `/support/search` | `requirePlatformStaff` | `adminRoutes.ts` | ✅ |
| `GET` | `/support/workspace/:id` | `requirePlatformStaff` | `adminRoutes.ts` | ✅ |
| `GET` | `/support/stats` | `requirePlatformStaff` | `adminRoutes.ts` | ✅ |
| `GET` | `/identity/resolve` | `requirePlatformStaff` | `adminRoutes.ts` | ✅ |
| `GET` | `/stats` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `GET` | `/personal-data` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `GET` | `/workspaces/search` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `GET` | `/workspaces/:workspaceId` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `GET` | `/master-keys/organizations` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `GET` | `/master-keys/organizations/:id` | `requirePlatformStaff` | `platformRoutes.ts` | ✅ |
| `POST` | `/escalate` | `requirePlatformStaff` | `supportRoutes.ts` | ✅ |
| `POST` | `/create-ticket` | `requirePlatformStaff` | `supportRoutes.ts` | ✅ |
| `POST` | `/helpos-chat` | `requirePlatformStaff` | `supportRoutes.ts` | ✅ |
| `POST` | `/helpos-copilot` | `requirePlatformStaff` | `supportRoutes.ts` | 👻 |
| `POST` | `/tickets` | `requirePlatformStaff` | `supportRoutes.ts` | ✅ |
| `GET` | `/tickets` | `requirePlatformStaff` | `supportRoutes.ts` | ✅ |

### 🧠  Logic Layer — Guards & Compliance
*No OC §1702 references in this domain.*

**Key services:**
- `server/services/**/platformEventBus.ts`
- `server/services/**/platformMaintenanceService.ts`
- `server/services/**/supportActionEmails.ts`
- `server/services/**/supportActionsService.ts`
- `server/services/**/supportSessionService.ts`

### 💾  Persistence Layer — DB Tables
**`support`** (41 tables): `faq_entries` (via `faqEntries`) · `faq_notifications` (via `faqNotifications`) · `faq_version_history` (via `faqVersionHistory`) · `escalation_tickets` (via `escalationTickets`) · `support_sessions` (via `supportSessions`) · `support_tickets` (via `supportTickets`) · `helpos_faqs` (via `helposFaqs`) · `faq_versions` (via `faqVersions`)
  *...+33 more in `support` domain*
**`sps`** (19 tables): `sps_documents` (via `spsDocuments`) · `sps_negotiation_threads` (via `spsNegotiationThreads`) · `sps_negotiation_messages` (via `spsNegotiationMessages`) · `sps_document_safe` (via `spsDocumentSafe`) · `sps_state_requirements` (via `spsStateRequirements`) · `sps_onboarding` (via `spsOnboarding`) · `sps_form_1_checklist` (via `spsForm1Checklist`) · `sps_form_2_offer_letter` (via `spsForm2OfferLetter`)
  *...+11 more in `sps` domain*

---


---

## Dead Ends & Ghost Routes

### ⚡ Dead Ends — UI calls with no backend route
*0 dead ends found*

✅ **Zero dead ends** — all UI API calls have corresponding backend routes.

### 👻 Ghost Routes — backend endpoints with no UI caller
*28 real ghost routes (not counting webhooks/internal)*

| Domain | Endpoint | Route File | Action |
|--------|----------|------------|--------|
| `D1` | `GET /csrf-token` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D1` | `POST /csrf-token` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D1` | `POST /logout-all` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D1` | `POST /forgot-password` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D1` | `POST /magic-link` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D2` | `GET /executions` | `orchestratedScheduleRoutes.ts` | 🔲 Needs UI widget |
| `D2` | `GET /executions/:executionId` | `orchestratedScheduleRoutes.ts` | 🔲 Needs UI widget |
| `D3` | `POST /billing/adjust-invoice/correct-line-item` | `financeInlineRoutes.ts` | 🔲 Needs UI widget |
| `D3` | `POST /billing/adjust-invoice/bulk-credit` | `financeInlineRoutes.ts` | 🔲 Needs UI widget |
| `D4` | `POST /request/:id/grant` | `compliance/regulatoryPortal.ts` | 🔲 Needs UI widget |
| `D5` | `GET /csrf-token` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D5` | `POST /csrf-token` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D5` | `POST /logout-all` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D5` | `POST /forgot-password` | `authRoutes.ts` | 🔲 Needs UI widget |
| `D5` | `POST /magic-link` | `authRoutes.ts` | 🔲 Needs UI widget |

---

## Phase Hardening Log

### Phase 1 — System Map (2026-05-01)
- ✅ 338 pages × 9 domains mapped (UI→Hook→Route→Logic→DB)
- ✅ 2,793 endpoints catalogued across 363 route files
- ✅ 748 DB tables across 22 schema domains indexed
- ✅ 22 OC §1702 enforcement files identified
- ✅ 0 dead ends found
- ✅ 26 ghost routes catalogued

### Phase 2 — TypeScript Hardening (2026-05-01)
| Wave | Fix | Files | Before | After |
|------|-----|-------|--------|-------|
| 1 | `req: any` → `AuthenticatedRequest` | 103 | 750 | 1 |
| 2 | `catch(e: any)` → `catch(e: unknown)` | 227 | 227 | 0 |
| 3 | `console.log` → `log.info` (server) | 21 | 955 | 340* |
| 4 | `@ts-ignore` → `@ts-expect-error` + docs | 8 | 282 | 0 |
| 5 | Event handler `any` types removed | multiple | 321 | cleaned |
| 7 | TODO/FIXME → PLANNED with paths | 5 | 7 | 0 |

*340 remaining in services/scripts/logger.ts (intentional or script-level)

**esbuild: 0 server + 0 client errors ✅**

### Phase 3 — Doc Consolidation + Service Logging (Complete)
- ✅ 1,074 stale/duplicate docs deleted
- ✅ SYSTEM_MANIFEST.md is now single source of truth
- ✅ `console.log` → `log.info` in server/services (19 more files fixed)
- 🔲 `useState<any>` → proper generic types (~50 instances)
- ✅ Non-null `!.` → `?.` safe ref patterns fixed; 217 remain (assignment-side intentional)
- 🔲 `as any` casts in client pages → domain interfaces (~200 instances)
- 🔲 4 ghost routes → UI widgets (platform activities, invitations, metrics)

### Remaining Known Debt
| Category | Count | Location | Phase |
|----------|-------|----------|-------|
| `console.log` in services | 340 | `server/services/**` | 3 |
| `useState<any>` | ~50 | `client/src/components/**` | 3 |
| Non-null `!.` assertions | 212 | Mixed | 3 |
| `as any` casts | ~200 | `client/src/pages/**` | 3 |
| Ghost routes needing UI | 4 | Admin pages | 3 |


---

## Known Issues Tracker

| ID | Domain | Issue | Severity | Status | File |
|----|--------|-------|----------|--------|------|
| KI-001 | D6 Messaging | WebSocket multi-replica pub/sub not using Redis | HIGH | 🔲 Open | `server/services/redisPubSubAdapter.ts` |
| KI-002 | D2 Scheduling | `requireAnyAuth` still uses `req: any` (intentional) | LOW | ✅ Documented | `server/auth.ts:887` |
| KI-003 | D1 Auth | OTP implementation is a stub (no email/SMS send) | MEDIUM | 🔲 Open | `server/routes/authCoreRoutes.ts:271` |
| KI-004 | D1 Auth | Device trust cookie not yet implemented | MEDIUM | 🔲 Open | `server/routes/authCoreRoutes.ts:302` |
| KI-005 | D9 Admin | `/api/platform/activities` ghost — no UI widget | LOW | 🔲 Open | `server/routes/adminRoutes.ts` |
| KI-006 | D9 Admin | `/api/platform/invitations` ghost — no UI widget | LOW | 🔲 Open | `server/routes/adminRoutes.ts` |
| KI-007 | D6 Messaging | FCM push notifications not implemented | HIGH | 🔲 Open | Resend/Twilio fallback active |
| KI-009 | Platform | Hollowed files from logger migration — 15 files stripped of exports | CRITICAL | ✅ Fixed f9bb50f8 | `server/routes/integrations-status.ts` + 18 others |
| KI-008 | D3 Finance | ChatDock durable message store missing (Redis Streams) | HIGH | 🔲 Open | ChatDock reliability foundation |
| KI-009 | D1/D8 | server/index.ts GCS bootstrap used `log` before `createLogger` defined (TDZ crash) | CRITICAL | ✅ Fixed `a42b9d24` | `server/index.ts` L7-18 → `console.log/error` |
| KI-010 | All | Phase 3 logger migration hollowed 15 files (no exports) causing build failures | CRITICAL | ✅ Fixed `f9bb50f8` | Restored from git baseline |


---

## Deployment & Infrastructure

### Railway Configuration
| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | `development` | `coaileague-development.up.railway.app` | Testing |
| Production | `main` | Production URL | Live (Bryan authorizes merges) |

### Build Pipeline
```
npm run build
  → vite build (client → dist/public)
  → node build.mjs (server bundle → dist/server.js)

Railway start: node dist/server.js
Health check: GET /health → 200
Port mapping: Railway 80 → app 5000
```

### Key Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection | ✅ |
| `RESEND_API_KEY` | Email delivery | ✅ |
| `RESEND_WEBHOOK_SECRET` | Inbound email verification | ✅ |
| `TWILIO_ACCOUNT_SID` | SMS/voice | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio auth | ✅ |
| `STRIPE_SECRET_KEY` | Payment processing | ✅ |
| `PLAID_CLIENT_ID` | ACH/bank transfers | ✅ |
| `SESSION_SECRET` | Express session signing | ✅ |
| `GEMINI_API_KEY` | Trinity brain - Gemini | ✅ |
| `OPENAI_API_KEY` | Trinity brain - GPT | ✅ |
| `ANTHROPIC_API_KEY` | Trinity brain - Claude | ✅ |

### Workflow Rule (PERMANENT)
```
feature branch → development (test here) → main (production, Bryan authorizes)
Never merge to main without Bryan's explicit authorization.
```

### First Production Tenant
- **Statewide Protective Services** — Texas PSB License #C11608501
- SDVOSB-certified, San Antonio TX
- Founder exemption: permanent enterprise tier access


---
*SYSTEM_MANIFEST.md — Living document. Updated every hardening phase.*
*Single source of truth — all 1,074 competing docs have been deleted.*

---

## ✅ PHASE 3: FULL SWEEP — COMPLETE

### Claude Code Branches Merged (2 new)
| Branch | Content | Action |
|--------|---------|--------|
| `claude/fix-bell-icon-modal-SoqPW` | Root cause fix: ProgressiveHeader had `onClick={() => setLocation('/')}` on wrapper div — all bell/avatar taps routed to dashboard. Also proper Sheet with `e.stopPropagation()` | ✅ MERGED |
| `claude/texas-licensing-framework-CXrDv` | `TexasSecurityLevel` enum + `TEXAS_LICENSE_PROFILES` map + helpers — typed bridge over raw DB strings for OC §1702 compliance logic | ✅ MERGED |
| 5 previously-merged branches | Already in development — verified | ⏭ SKIPPED |

### Phase 3 Waves

| Wave | Category | Before | After | Notes |
|------|----------|--------|-------|-------|
| 3A | `console.log` → logger (services with existing logger) | 340 | 89 | 74% reduction |
| 3B | `useState<any>` → proper types | 50 | 1 | 98% fixed |
| 3C | `ref.current!.` → optional chaining | 212 | ~200 | Safe patterns only |
| 3D | `as any` casts → typed alternatives | ~200 | fixed | HTMLInputElement, Error casts |
| 3F | Ghost routes → UI wiring | 4 uncalled | 2 wired | platform/activities + invitations |

### Cumulative Results (Phase 1 → Phase 3)
| Issue | Original | After Ph2 | After Ph3 |
|-------|----------|-----------|-----------|
| `req: any` server routes | 750 | 1 | **1** (intentional) |
| `catch(e: any)` | 227 | 0 | **0** |
| `@ts-ignore` suppressed | 282 | 0 | **0** |
| `useState<any>` | ~50 | ~50 | **1** |
| `console.log` server | 955 | 340 | **89** |
| Ghost routes | 26 | 26 | **24** (2 wired) |

### esbuild: 0 server + 0 client errors ✅

### Texas Licensing Bridge (new)
`shared/licenseTypes.ts` now exports:
- `TexasSecurityLevel` enum (LEVEL_II_UNARMED, LEVEL_III_ARMED, LEVEL_IV_PPO)  
- `TEXAS_LICENSE_PROFILES` — full OC §1702 profiles per level
- Helpers: `parseTexasSecurityLevel`, `requiresPsychEval`, `requiresArmedCommission`
- No DB migration needed — values match existing `employees.licenseType` varchar


---

## CANONICAL WORKFLOW: Employee Invite → Register → Persist → Schedule

### Overview
Two parallel invite systems coexist. The primary employee flow (from employees.tsx) uses the **Onboarding Invite** system.

```
MANAGER ACTION               SERVER                          DATABASE
─────────────────────────────────────────────────────────────────────
employees.tsx                                                
  ⋮ menu → Send Invite       POST /api/onboarding/invite     onboarding_invites ← INSERT
  inviteMutation fires       (onboardingInlineRoutes.ts)     ├── id (UUID)
  Payload: {                 requireManager guard            ├── workspaceId
    email,                   Role gate: no org_owner/co_owner├── email
    firstName,               Allowlist: staff + mgr tiers    ├── firstName, lastName
    lastName,                                                 ├── workspaceRole
    role,                    ── generates inviteToken ──      ├── inviteToken (32B hex)
    workspaceRole,           crypto.randomBytes(32)          ├── expiresAt (+7 days)
    workspaceId              ── stores invite in DB ──       └── status: 'pending'
  }                          storage.createOnboardingInvite

                             ── builds invite URL ──          EMAIL SENT
                             APP_URL || req.protocol+host     From: Resend
                             /onboarding/{inviteToken}         Template: employeeInvitation
                             ── sends email ──                CTA: "Complete Your Setup"
                             sendOnboardingInviteEmail()       URL: /onboarding/{token}
                               inviteUrl: onboardingUrl ✅ FIXED

EMPLOYEE ACTION
─────────────────────────────────────────────────────────────────────
Employee receives email
  Clicks "Complete Your Setup"
  → Browser opens /onboarding/{token}
  → App.tsx Route: /onboarding/:token
  → <OnboardingWizard> component loads

OnboardingWizard             GET /api/onboarding/invite/:token
  reads token from URL        publicOnboardingRoutes.ts
                              storage.getOnboardingInviteByToken(token)
                              validates: !isUsed, !expired
                              returns: invite details (pre-fills form)

Employee completes wizard:
  ── Step 1: Personal info   POST /api/onboarding/application  onboarding_applications ← INSERT
  ── Step 2: Documents       PATCH /api/onboarding/application/:id
  ── Step 3: Signatures      POST /api/onboarding/signatures   document_signatures ← INSERT

REGISTRATION/COMPLETION
─────────────────────────────────────────────────────────────────────
  Already has account?       ── EXISTING USER PATH ──
    → POST /api/onboarding/workspace-invite/accept-existing
      Sets session.workspaceId, links employee record

  New user?                  ── NEW USER REGISTRATION ──
    → POST /api/onboarding/workspace-invite/register
      Payload: { code, email, password, firstName, lastName }
      
      db.transaction():
        INSERT users {          users table
          id (UUID),            ├── id, email, passwordHash
          email (normalized),   ├── firstName, lastName
          passwordHash,         ├── currentWorkspaceId ← invite.workspaceId
          emailVerified: true,  └── authProvider: 'email'
          currentWorkspaceId
        }
        INSERT employees {      employees table
          workspaceId,          ├── workspaceId (tenant-scoped)
          userId,               ├── userId (linked to user)
          firstName, lastName,  ├── firstName, lastName, email
          workspaceRole,        ├── workspaceRole (from invite)
          isActive: true,       ├── isActive: true
          onboardingStatus:     └── onboardingStatus: 'in_progress'
            'in_progress',      
          hireDate: new Date()
        }
        UPDATE workspace_invites SET status='accepted'
        UPDATE users SET currentWorkspaceId

      ── Non-blocking (fire-and-forget) ──
        platformEventBus.publish({ type: 'member_joined', ... })
        audit_log INSERT: action='member_joined'
        NotificationDeliveryService → notify workspace owner (in-app)
        Cross-tenant score lookup (async, non-blocking)

      ── Session set ──
        req.session.userId = userId
        req.session.workspaceId = workspaceId
        req.session.workspaceRole = role

      Response: { userId, workspaceId, role, landingPage, firstLogin: true }
      → Client redirects to landingPage (role-based)

ONBOARDING COMPLETION (wizard finish)
─────────────────────────────────────────────────────────────────────
  → POST /api/onboarding/complete
    Updates user_onboarding table (progress tracking)
    ✅ FIXED: Also updates employees.onboardingStatus = 'completed'
    Response: updated user_onboarding row

POST-REGISTRATION PERSISTENCE & SYNC
─────────────────────────────────────────────────────────────────────
  Employee now in system:
    ✅ users table — account for login
    ✅ employees table — workspace member (workspaceId-scoped)
    ✅ session — authenticated, workspace bound
    ✅ onboarding_invites — status='accepted'/'used'
    ✅ audit_log — invite_created + member_joined entries
    ✅ Trinity notified via member_joined event

  Immediately available for:
    ✅ /api/employees?workspaceId= — appears in employee list
    ✅ Scheduling — employees queried by workspaceId (scoped)
    ✅ Time tracking — clockIn/clockOut via employee record
    ✅ Payroll — employee.payType, hourlyRate set at invite or onboarding
    ✅ Compliance — licenseTypes from invite seed onboarding_checklists

  QueryClient invalidation (client-side sync):
    inviteMutation.onSuccess:
      queryClient.invalidateQueries(['/api/employees', workspaceId])
      → employees list refetches and shows new member

DUAL INVITE SYSTEM (quick reference)
─────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│ System 1: Onboarding Invite (PRIMARY — used by employees.tsx)   │
│  Route:   POST /api/onboarding/invite                           │
│  Table:   onboarding_invites                                     │
│  URL:     /onboarding/{token}                                    │
│  Flow:    Full onboarding wizard                                 │
├─────────────────────────────────────────────────────────────────┤
│ System 2: Workspace Invite (hrInlineRoutes)                     │
│  Route:   POST /api/hr/invites/create → /api/invites/create     │
│  Table:   workspace_invites                                      │
│  URL:     /accept-invite?code={CODE}                             │
│  Flow:    Quick accept (existing users) or register page         │
└─────────────────────────────────────────────────────────────────┘

KNOWN ISSUES FIXED IN PHASE 4
─────────────────────────────────────────────────────────────────────
| KI-011 | Invite email had broken CTA — field name mismatch      |
|         | Template expected 'inviteUrl', code passed 'onboardingUrl'|
|         | Fixed: onboardingInlineRoutes.ts line ~250            |
| KI-012 | Invite URL used req.protocol not APP_URL in production  |
|         | Fixed: APP_URL env var used first, req fallback second |
| KI-013 | POST /complete didn't update employee.onboardingStatus  |
|         | Fixed: Added employees table update in /complete handler|

---

## Phase 4 — Mobile UI Polish + Invite Workflow Audit (2026-05-01)

### Mobile UI Polish
**employees.tsx — EmployeeCard rebuilt:**
- Contact-list layout: full-bleed rows, no card shadows, border-b separators
- Avatar: 44px with AvatarImage (profile photo) + purple gradient fallback
- Name hierarchy: 15px semibold → role + status badge → email sub-line
- Actions: DropdownMenu (⋮) + ChevronRight → right cluster
- Count header: mobile shows "N Employees / All employees"
- Checkboxes: animate in (w-0→w-10) only in bulk-select mode, no layout crowding

**private-messages.tsx — conversation list polished:**
- Avatar: 48px with AvatarImage + purple gradient fallback
- Date-aware timestamps: today→HH:MM, yesterday→"Yesterday", week→"Mon", older→date
- Unread: pill with min-width, purple-600, bold name+message when unread
- Online dot: solid span with ring-2 ring-background halo
- Full-bleed rows, border-b, no rounded corners — pure contact-list style

### Invite Workflow Audit — Bugs Fixed
| ID | Bug | Fix |
|----|-----|-----|
| KI-011 | Email CTA broken — `onboardingUrl` passed where `inviteUrl` expected | Field renamed in call site |
| KI-012 | Invite URL used `req.protocol` not `APP_URL` (wrong in Railway prod) | APP_URL env var used first |
| KI-013 | POST /complete didn't update `employee.onboardingStatus` | Added employees table update |

### Full Workflow Verified
✅ UI trigger → POST /api/onboarding/invite → DB insert → email sent  
✅ Email CTA URL → /onboarding/:token → OnboardingWizard  
✅ Registration → transaction(users INSERT + employees INSERT + invite UPDATE)  
✅ Session set → employee immediately available in workspace  
✅ QueryClient invalidation → employee list refreshes  
✅ Schedule system uses workspaceId-scoped employee queries  
✅ Onboarding completion → employee.onboardingStatus = 'completed'  

---

## Phase 5 — Bug Fixes: Notifications, Splash Loop, Swipe Sensitivity (2026-05-01)

### ISSUE 1: Notification Bell — Buttons Dead on Mobile (KI-014)
**Root cause:** Mobile notification SheetContent was rendering `<UNSCommandCenter>` 
(a search/command palette component) instead of the actual notification list.
The "Mark All Read", "Clear All", individual dismiss buttons — none of them rendered.
Users saw a blank command center panel when opening notifications on mobile.

**Fix:** `client/src/components/notifications-popover.tsx`
- SheetContent now renders `renderNotificationsContent({ skipHeader: true })` 
- Added inline header with: Bell icon, unread count badge, Mark All Read button, Close button
- Mark All Read calls `POST /api/notifications/mark-all-read` with full QueryClient invalidation
- Sheet changed: side="right" → side="bottom", explicit height: 82dvh
- All notification actions (dismiss, clear, mark read) now work on mobile

### ISSUE 2: Splash Screen Loop / Double Splash (KI-015)
**Root cause:** HTML pre-React splash (index.html) runs for 1200ms minimum,
then React mounts. If auth is still loading (`authLoading=true`), App.tsx renders 
`<LoadingScreen>` — creating a second visible loading state. Users saw two different
loading screens back-to-back.

**Fix 1:** `client/src/App.tsx`
- LoadingScreen now skipped if `sessionStorage.coai_html_splash_done` is set
- HTML splash sets this flag when it hides → seamless handoff, no double-screen
- Flow: HTML splash (1200ms) → hides → React auth already resolved → app renders

**Fix 2:** `client/index.html` — Trifecta arm animation
- SMIL `animateTransform` on the trifecta `<g>` replaced with CSS `animation`
- CSS animations are more reliable in Chrome Android than SMIL on grouped elements
- Added `@keyframes hl-spin-trifecta` with `transform-origin: 60px 60px`
- Arms now definitively spin at 6s/cycle on all browsers

### ISSUE 3: Employee List Swipe Too Sensitive (KI-016)
**Root cause:** `SwipeToDelete` component had `lockThreshold = 8px` 
(direction lock fires after just 8px of movement). Normal vertical scroll
easily exceeds 8px horizontally → swipe triggers during scroll.

**Fixes:** `client/src/components/swipe-to-delete.tsx`
- `lockThreshold`: 8px → 20px (must move 20px horizontally to lock)
- `verticalCancelThreshold`: new — 12px vertical before horizontal lock = immediately go vertical
- `minVisualDistance`: 5px → 15px (visual feedback doesn't show on tiny movements)  
- Direction ratio: `deltaY > absDeltaX * 0.8` → `deltaY > absDeltaX * 0.6` (stricter horizontal requirement)
- Added early-exit: if `deltaY > 12 && absDeltaX < 20` → lock vertical immediately, return

**Result:** Swipe only activates on clear, deliberate left swipes. Normal up/down 
scrolling through the employee list is completely unaffected.

| KI | Issue | Fixed |
|----|-------|-------|
| KI-014 | Mobile notification buttons dead — UNSCommandCenter rendered instead of list | ✅ |
| KI-015 | Double splash screen / loading loop on reload | ✅ |
| KI-016 | Employee list swipe fires during vertical scroll | ✅ |

---

## Phase 6 — Full Platform Audit: Dead Ends, Silent Failures, Route Fixes (2026-05-01)

### Methodology
Indexed all 2,448 server endpoints × 2,872 client API references.
Classified 155 unmatched calls into: false positives, wrong URLs, missing routes, ghost calls.

### Findings Summary

| Category | Count | Action |
|----------|-------|--------|
| False positives (route exists, scanner missed) | 5 | No action |
| Ghost calls (try/catch, analytics only) | 1 | No action |
| Wrong client URL (route exists elsewhere) | 2 | Fixed |
| Missing routes (unbuilt feature, page 404s) | 38 | Stubbed with 503 |
| Silent .catch(()=>null) in server code | 436 | Phase 7 target |
| Unguarded fetch() in client | 10 | Phase 7 target |

### Bugs Fixed This Phase

**NEW-3: GET /api/onboarding/setup-guide — 404 (setup-guide-panel showed nothing)**
- Root cause: No route existed. Panel rendered empty with no error shown to user.
- Fix: Added stub endpoint to `onboardingInlineRoutes.ts` returning workspace completion data.

**NEW-4: GET /api/ai-brain/system-status — wrong URL**
- Root cause: Client called `/api/ai-brain/system-status`, server has `/api/ai-brain/status`.
- Fix: `ai-system-status.tsx` URL corrected.

**NEW-5: POST /api/trinity/import-schedule — missing route**
- Root cause: `ScheduleUploadPanel.tsx` called `/api/trinity/import-schedule`, no handler existed.
  Schedule upload was completely broken — FormData posted to 404.
- Fix: Added `POST /import-schedule` to `trinitySchedulingRoutes.ts`.
  Client URL updated to `/api/trinity/scheduling/import-schedule`.

**NEW-6: POST /api/tos/sign — wrong URL**
- Root cause: `tos-agreement-step.tsx` called `/api/tos/sign` which never existed.
  Legal consent/TOS signing silently failed on every new-user onboarding.
- Fix: URL corrected to `/api/legal/accept-agreements` (existing endpoint).

**NEW-7: Compile error in onboardingInlineRoutes.ts**
- Root cause: Unescaped apostrophe in `'You're making...'` template string.
- Fix: Changed to double-quoted string.

### False Positives Confirmed (not bugs)
- `/api/safety/panic` → `safetyRoutes.ts` mounted at `/api/safety` — EXISTS ✅
- `/api/broadcasts` + `/api/broadcasts/my` → `broadcasts.ts` at `/api/broadcasts` — EXISTS ✅
- `/api/time-entries/clock-in` → `time-entry-routes.ts` at `/api/time-entries` — EXISTS ✅
- `/api/search/log-click` → wrapped in `try/catch(() => {})`, analytics-only ghost call — SAFE ✅
- `/api/hr/document-requests/gaps` → `documentRequestRoutes.ts` at `/api/hr/document-requests` — EXISTS ✅

### Graceful Stub Layer Added
`server/routes/featureStubRoutes.ts` — 40+ stubs for planned-but-unbuilt features.
Returns `{ available: false, feature, message }` with HTTP 503 instead of silent 404.
Each stub fires a `feature_accessed_stub` Trinity event for demand tracking.

Stubbed features:
- Budgeting (`/api/budgets`)
- CAD Console (`/api/cad`, `/api/cad/calls`)
- Bid Analytics (`/api/bid-analytics`)
- Invoice Preview (`/api/billing/invoice-preview`)
- Subscription Change (`/api/billing/subscription/change`)
- Automation Events (`/api/automation-events`)
- Audit Suite (`/api/audit-suite/*`)
- Auditor Portal (`/api/auditor/*`)
- Accept Handoff (`/api/accept-handoff`)
- Admin Controls (`/api/admin/end-users/*`, `/api/admin/financial/provider-topoff`)
- Bridge Channels (`/api/bridges/send`)
- Armory (`/api/armory/ammo`)
- RMS (`/api/rms/trespass`)
- AI Extras (`/api/ai-brain/sentiment`, `/api/ai-brain/patterns`, etc.)

### Known Issues Remaining (Phase 7 targets)
| ID | Issue | Priority |
|----|-------|----------|
| SF-1 | 436 `.catch(()=>null)` in server — hides real errors | HIGH |
| SF-2 | 10 unguarded `fetch()` in client — no `.ok` check | MEDIUM |
| UNBUILT | 12+ feature pages (CAD, budgets, bid-analytics, audit-suite) show stub 503 | BACKLOG |

---

## Phase 7 — Deep Audit: Workflow Semantics, TypeScript Hardening, Route Fixes (2026-05-01)

### Methodology
Five-pass deep scan across all 2,244 TypeScript files:
- Pass A: Response shape mismatches (server sends X, client reads Y)
- Pass B: TypeScript escape hatch audit (: any, as any per file)
- Pass C: WorkspaceId scope leaks on sensitive table writes
- Pass D: Auth guard mismatches (sensitive routes without requireAuth)
- Pass E: Workflow chain integrity (5 critical chains traced end-to-end)

### Auth Guard False Positives Resolved
23 routes flagged as "unguarded" were all confirmed safe:
- `adminRoutes.ts`, `deactivateRoutes.ts`, `importRoutes.ts` — auth applied at domain mount level
  (`app.use("/api/import", requireAuth, ensureWorkspaceAccess, importRouter)`)
- `payrollRoutes.ts` bank-accounts — auth at domain: `app.use("/api/payroll", requireAuth, ...)`
- All 23 flagged routes inherit requireAuth from their domain-level mount ✅

### WorkspaceId Scope — Confirmed Intentional
`controlTowerRoutes.ts` queries without workspaceId — this is a platform-admin root view
showing data across all workspaces. Not a bug. Protected by `requirePlatformStaff`.

### Real Bugs Fixed

**WORKFLOW-1: Shift creation — employee not notified (single employeeId)**
- Root cause: notification block only iterated `assignedEmployeeIds[]` array.
  When a shift used the scalar `employeeId` field (most common case),
  zero notifications were sent to the assigned employee.
- Fix: `shiftRoutes.ts` — builds `allAssignedIds = Set([employeeId, ...assignedEmployeeIds])`
  and notifies all of them. Both in-app (createNotification) and push (NotificationDeliveryService).

**TYPESCRIPT-1: 246 catch(e: any) → catch(e: unknown)**
- Root cause: 246 catch blocks across server code used `catch(e: any)`,
  bypassing TypeScript's type system and hiding potential property access errors.
- Fix: Converted all to `catch(e: unknown)` — now TypeScript enforces that
  `e.message` cannot be accessed without an `instanceof Error` guard.
- Impact: Zero new compile errors — the codebase already used safe access patterns.

**TYPESCRIPT-2: 10 (req as any).workspaceId → req.workspaceId**
- Root cause: AuthenticatedRequest already has `workspaceId: string | undefined`,
  but 10 handlers cast req to any to access it unnecessarily.
- Fix: Removed the cast. Type is correct without any coercion.

### Workflow Chain Integrity (All 5 Verified ✅)
| Chain | Flow | Status |
|-------|------|--------|
| 1 | Clock-in → time_entries INSERT → payroll reads entries | ✅ Full chain |
| 2 | Shift POST → notification → employee alerted | ✅ Fixed (WORKFLOW-1) |
| 3 | Invoice created → audit log + event bus + notification | ✅ Full chain |
| 4 | Onboarding /complete → onboardingStatus=completed, isActive=true | ✅ Fixed Phase 5 |
| 5 | Invite register → tx(users+employees) → session → member_joined | ✅ Full chain |

### Metrics Before/After
| Metric | Before | After |
|--------|--------|-------|
| catch(e: any) patterns | 246 | **0** |
| (req as any).workspaceId | 10 | **0** |
| .catch(()=>null) swallows | 436 | 380 (-56) |
| Unguarded auth routes (real) | 0 | 0 |
| Broken workflows confirmed | 1 (shift notify) | 0 |

### Phase 8 Targets
- Reduce remaining 380 `.catch(()=>null)` to proper error logging (Phase 8)
- Reduce 7,334 remaining `as any` usages — focus on core financial routes (Phase 8)
- Add missing worker notification when shift is EDITED (not just created)
- Add client email notification on invoice creation (requires client email lookup)

---

## CANONICAL ROUTE MAP — Single Source of Truth (Updated Phase 8)

**Platform totals:** 2,448 server endpoints · 253 mount prefixes · 15 domains · 2,872 client API refs

### Domain → Mount Prefix Index

```
DOMAIN       KEY PREFIXES (partial — full list in domains/*.ts)
───────────────────────────────────────────────────────────────
AUTH         /api/auth/*             Login, register, OAuth, session, password
             /api/dev                Dev seed routes (non-prod only)
             /api/admin/end-users    Platform staff: user management

ORGS         /api/workspace          Workspace settings, members, features
             /api/onboarding         Employee invite, wizard, setup-guide
             /api/import             Bulk CSV import (employees, clients, shifts)
             /api/integrations       QuickBooks, third-party connections
             /api/enterprise         Enterprise features, multi-company

WORKFORCE    /api/employees          Employee CRUD, profile, payroll-info
             /api/hr/document-requests  Document gap tracking
             /api/hris               HRIS sync
             /api/ats                Applicant tracking
             /api/hiring             Hiring pipeline
             /api/availability       Shift availability
             /api/onboarding-tasks   Onboarding checklist items
             /api/identity           PIN management (clock-in PIN)
             /api/recognition        Employee recognition

SCHEDULING   /api/shifts             Shift CRUD, assignment, overlap guard
             /api/schedules          Schedule read/export views
             /api/scheduleos         ScheduleOS AI import
             /api/trinity/scheduling AI-assisted scheduling (fill, insights)
             /api/shift-trading      Shift swap requests
             /api/shift-chatrooms    Per-shift chat rooms
             /api/approvals          Shift/time-off approval queue
             /api/calendar           ICS exports

TIME         /api/time-entries       Clock in/out, GPS, photo
             /api/breaks             Break tracking
             /api/timesheet-reports  Manager timesheet review
             /api/mileage            Mileage tracking

PAYROLL      /api/payroll            Payroll runs, proposals, deductions
             /api/timesheets         Timesheet review for payroll
             /api/expenses           Expense management
             /api/plaid              ACH/direct deposit via Plaid

BILLING      /api/invoices           Invoice CRUD, send, mark-paid
             /api/stripe             Stripe payment intents, webhooks
             /api/billing            Workspace billing, subscription
             /api/finance            Financial admin, ledger
             /api/usage              Token/AI usage tracking

CLIENTS      /api/clients            Client CRUD, contacts, coverage
             /api/contracts          Contract pipeline, signing
             /api/client-comms       Client communications
             /api/service-requests   Client service requests
             /api/surveys            Client satisfaction surveys

COMMS        /api/broadcasts         Workspace-wide broadcasts
             /api/private-messages   Direct messages (DM threads)
             /api/chat               Chat rooms, dock chat
             /api/chat/dock          ChatDock WebSocket chat
             /api/sms                SMS/Twilio outbound
             /api/email              Email management
             /api/announcements      Manager announcements

COMPLIANCE   /api/compliance/*       Compliance checks, reports, matrix
             /api/compliance/regulatory-portal  External auditor access
             /api/training-compliance  Training + certification tracking
             /api/document-vault     Employee document storage
             /api/files              File upload/download
             /api/credentials        License/credential tracking

OPS          /api/safety             Panic alerts, safety incidents
             /api/incidents          Incident reports
             /api/rms                Records management (trespass etc)
             /api/armory             Armory compliance (stub)
             /api/cad                CAD console (stub)
             /api/guard-tours        Guard tour verification
             /api/post-orders        Post order management
             /api/vehicles           Vehicle tracking

SALES        /api/sales              Sales pipeline
             /api/proposals          Proposal creation, RFP
             /api/bid-analytics      Bid analytics (stub)

SUPPORT      /api/support            Support tickets, escalation
             /api/helpai             HelpAI bot interactions
             /api/helpdesk           Helpdesk room management
             /api/support/command    Support command console (platform staff)

TRINITY      /api/ai-brain           AI brain status, actions, capabilities
             /api/ai-brain/console   Admin console (platform staff)
             /api/trinity            Trinity orchestration, routing
             /api/trinity/scheduling Trinity-assisted scheduling
             /api/trinity/chat       Trinity chat interface
             /api/trinity/staffing   Trinity staffing orchestrator
             /api/trinity/crisis     Crisis management
             /api/trinity/intelligence  Trinity intelligence dashboard
             /api/automation         Automation triggers, events
             /api/control-tower      Root admin platform view

AUDIT        /api/analytics          Platform analytics
             /api/dashboard          Dashboard data aggregation
             /api/sandbox            ACME test sandbox
             /api/platform           Platform health, flags
             /api/admin/*            Platform admin operations
```

### Stub Routes (Unbuilt Features — Return 503)
Added in Phase 6 via `featureStubRoutes.ts`:
`/api/budgets`, `/api/cad`, `/api/bid-analytics`, `/api/billing/invoice-preview`,
`/api/billing/subscription/change`, `/api/automation-events`, `/api/audit-suite/*`,
`/api/auditor/*`, `/api/accept-handoff`, `/api/bridges/send`, `/api/armory/ammo`,
`/api/rms/trespass`, `/api/admin/end-users/*`, `/api/ai-brain/sentiment`

### Public Routes (No Auth)
`/api/onboarding/*` — Onboarding wizard, workspace-invite/register (public signup)
`/api/public/*` — Job board, hiring, training certs, trinity staffing webhooks
`/api/safety/panic` — Officer panic button (auth via session, no requireAuth gate)
`/api/auth/login`, `/api/auth/register` — Authentication entry points
`/api/legal/*` — Legal consent, TOS, opt-out (TCPA compliance)

---

## Phase 8 — Error Visibility, Accessibility, UI Polish (2026-05-01)

### Fixes Applied

**CATCH-NULL-1: 28 critical .catch(()=>null) → log.warn()**
Route files converted (chatInlineRoutes, publicOnboardingRoutes, shiftTradingRoutes,
dockChatRoutes, twilioWebhooks, documents, regulatoryPortal, hrInlineRoutes, rmsRoutes,
authCoreRoutes, bootstrapRoutes, dashboardRoutes, importRoutes, shiftBotSimulationRoutes).
Fire-and-forget catches (event bus, audit log, notifications) intentionally left as-is.

**ARIA-1: aria-label added to 41 component files (144 icon buttons)**
Icon-only `<Button size="icon">` elements with `data-testid` but no `aria-label`
now have machine-readable labels derived from their testid (e.g., `button-edit-employee`
→ `aria-label="Edit Employee"`). Improves screen reader UX and accessibility compliance.

**TS-CLEANUP: Continued TypeScript hardening**
- catch(e: any) → catch(e: unknown): 246 conversions (Phase 7, confirmed 0 remaining)
- (req as any).workspaceId → req.workspaceId: 10 occurrences removed

### Remaining Targets (Phase 9)
| Target | Count | Priority |
|--------|-------|----------|
| Remaining .catch(()=>null) in services | ~352 | MEDIUM — mostly fire-and-forget |
| 'as any' in financial routes | ~150 | HIGH — payroll, invoices |
| Missing empty states in 76 pages | 76 | LOW — admin pages |
| Console.log in client code | 1 (main.tsx) | LOW |
| TODO/FIXME comments | 3 files | LOW |

### Canonical Route Map
See "CANONICAL ROUTE MAP" section above — full domain → prefix index added.
253 mount prefixes across 15 domains, all documented.

### Metrics Snapshot (after Phase 8)
| Metric | Value |
|--------|-------|
| Server endpoints | 2,448 |
| Client API references | 2,872 |
| Domain mounts | 253 |
| Broken client→server wires | 0 (all fixed or stubbed) |
| catch(e: any) remaining | 0 |
| .catch(()=>null) remaining | ~380 (352 fire-and-forget, 28 fixed) |
| aria-label gaps fixed | 144 icon buttons across 41 files |
| TypeScript 'as any' remaining | ~7,300 (Phase 9 target) |

---

## Phase 9 — Claude Code Merge Check + TS Financial Cleanup (2026-05-01)

### Claude Code Branch Audit
Checked all remote branches for unmerged work:
- `claude/fix-bell-icon-modal-SoqPW` — Bell/notification fix. Our Phase 5 fix is SUPERIOR
  (side=bottom, 82dvh, real notification list). Their version still had UNSCommandCenter.
  No merge needed — we're ahead.
- `claude/texas-licensing-framework-CXrDv` — TexasSecurityLevel enum + helpers.
  **Already in our codebase** (absorbed in prior commit). No action needed.
- All codex audit branches already merged into development via previous PRs.

**Status: development branch is the most advanced — no merge action needed.**

### TypeScript Cleanup — Financial Routes
Removed unnecessary `as any` casts from three critical financial files:

| File | Casts Removed | Pattern |
|------|--------------|---------|
| shiftRoutes.ts | 2 | `(shift as any).employeeId/.clientId` → `shift.employeeId/.clientId` |
| payrollRoutes.ts | 7 | `(payrollRun as any).id/.status` → `payrollRun?.id/.status` |
| time-entry-routes.ts | + | `(employee as any).status === 'X'` → typed narrowing |
| shiftRoutes.ts | + | `(emp as any).status === 'X'` → typed narrowing |

Fields that legitimately need `as any` (joined/computed, not in base schema):
- `shift.assignedEmployeeIds` — array joined from shift_assignments table
- `shift.siteName`, `shift.jobSiteName` — from client/site JOIN
- `shift.requiredSkills` — from shift_requirements JOIN

These are documented — the `as any` is intentional for JOIN result shapes.

### Cumulative TypeScript Metrics (Phase 7-9)
| Metric | Phase 7 | Phase 8 | Phase 9 |
|--------|---------|---------|---------|
| catch(e: any) | 246→0 | 0 | 0 |
| .catch(()=>null) critical | 436 | 408 | 380 |
| (req as any).workspaceId | 10→0 | 0 | 0 |
| (shift as any) casts | ~11 | ~11 | **9** |
| (payrollRun as any) casts | ~7 | ~7 | **0** |
| aria-label gaps | — | 144→0 | 0 |
