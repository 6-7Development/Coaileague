/**
 * ACTION COMPATIBILITY SHIMS — Trinity Action Consolidation
 * ==========================================================
 * Backward-compatible action ID redirects for renamed/merged/deleted actions.
 * Every shim forwards the old action ID to the new canonical action via executeAction.
 *
 * This file is intentionally data-driven so legacy action debt is visible,
 * countable, and removable without editing dozens of ad-hoc registrations.
 * Shims should be removed once all callers have been updated to canonical IDs.
 *
 * Registered AFTER all canonical actions so the new IDs exist first.
 */

import { helpaiOrchestrator, type ActionRequest, type ActionResult } from '../helpai/platformActionHub';
import { createLogger } from '../../lib/logger';
const log = createLogger('actionCompatibilityShims');

type ShimPhase =
  | 'phase_1_domain_merge'
  | 'phase_1_split_domain_merge'
  | 'phase_1_notify_merge'
  | 'phase_2_billing_merge'
  | 'phase_2_notify_merge'
  | 'phase_2_onboarding_merge';

interface ShimDefinition {
  oldId: string;
  newId: string;
  description: string;
  phase: ShimPhase;
}

const LEGACY_ACTION_SHIMS: readonly ShimDefinition[] = [
  // STEP 2 — Orphaned domain duplicate (Phase 26A — shim removed)
  // Previously: platform_roles.assign -> uacp.assign_platform_role. The target
  // was disabled as non-MVP, leaving the shim redirecting to a non-existent
  // action. platform_roles.assign is now registered directly in actionRegistry
  // (registerOnboardingActions) with withAuditWrap — no shim needed.

  // STEP 3 — Single-action orphan domain merges
  { oldId: 'employee.track_milestones', newId: 'employees.track_milestones', description: 'employee domain merged into employees', phase: 'phase_1_domain_merge' },
  { oldId: 'employee.flag_anniversary', newId: 'employees.flag_anniversary', description: 'employee domain merged into employees', phase: 'phase_1_domain_merge' },
  { oldId: 'employee.flag_promotion_eligibility', newId: 'employees.flag_promotion_eligibility', description: 'employee domain merged into employees', phase: 'phase_1_domain_merge' },
  { oldId: 'shift.execute_swap', newId: 'scheduling.execute_swap', description: 'shift domain merged into scheduling', phase: 'phase_1_domain_merge' },
  { oldId: 'external.flag_external_risk', newId: 'security.flag_external_risk', description: 'external risk flagging merged into security', phase: 'phase_1_domain_merge' },
  { oldId: 'system.monitoring_dashboard', newId: 'diagnostics.monitoring_dashboard', description: 'system monitoring merged into diagnostics', phase: 'phase_1_domain_merge' },

  // STEP 4 — Split domain merges
  { oldId: 'testing.schedule_drug_test', newId: 'test.schedule_drug_test', description: 'testing domain merged into test', phase: 'phase_1_split_domain_merge' },
  { oldId: 'testing.record_result', newId: 'test.record_result', description: 'testing domain merged into test', phase: 'phase_1_split_domain_merge' },
  { oldId: 'testing.flag_failed_test', newId: 'test.flag_failed_test', description: 'testing domain merged into test', phase: 'phase_1_split_domain_merge' },
  { oldId: 'testing.generate_random_selection', newId: 'test.generate_random_selection', description: 'testing domain merged into test', phase: 'phase_1_split_domain_merge' },
  { oldId: 'testing.check_client_requirements', newId: 'test.check_client_requirements', description: 'testing domain merged into test', phase: 'phase_1_split_domain_merge' },
  { oldId: 'time.watch_clock_ins', newId: 'time_tracking.watch_clock_ins', description: 'time domain merged into time_tracking', phase: 'phase_1_split_domain_merge' },
  { oldId: 'time.monitor_coverage', newId: 'time_tracking.monitor_coverage', description: 'time domain merged into time_tracking', phase: 'phase_1_split_domain_merge' },
  { oldId: 'time.alert_on_absence', newId: 'time_tracking.alert_on_absence', description: 'time domain merged into time_tracking', phase: 'phase_1_split_domain_merge' },
  { oldId: 'time.clock_out_officer', newId: 'time_tracking.clock_out_officer', description: 'time domain merged into time_tracking', phase: 'phase_1_split_domain_merge' },
  { oldId: 'bulk.import_employees', newId: 'employees.import', description: 'bulk domain merged into employees', phase: 'phase_1_split_domain_merge' },
  { oldId: 'bulk.export_employees', newId: 'employees.export', description: 'bulk domain merged into employees', phase: 'phase_1_split_domain_merge' },

  // STEP 5 — Scheduling notify actions (now -> notify.send after Phase 2)
  { oldId: 'scheduling.notify_shift_created', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },
  { oldId: 'scheduling.notify_shift_updated', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },
  { oldId: 'scheduling.notify_shift_deleted', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },
  { oldId: 'scheduling.notify_schedule_published', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },
  { oldId: 'scheduling.notify_shift_swap', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },
  { oldId: 'scheduling.notify_automation_change', newId: 'notify.send', description: 'Scheduling notify consolidated into notify.send', phase: 'phase_1_notify_merge' },

  // PHASE 2 — Billing domain consolidation (32 -> ~13)
  { oldId: 'billing.invoices_get', newId: 'billing.invoice', description: 'Billing invoices_get consolidated into billing.invoice', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.invoices_list', newId: 'billing.invoice', description: 'Billing invoices_list consolidated into billing.invoice', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.draft_invoices', newId: 'billing.invoice_generate', description: 'Billing draft_invoices renamed to invoice_generate', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.generate_invoice_pdf', newId: 'billing.invoice_pdf', description: 'Billing generate_invoice_pdf renamed to invoice_pdf', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.send_invoice', newId: 'billing.invoice_send', description: 'Billing send_invoice consolidated into invoice_send', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.send_invoice_email', newId: 'billing.invoice_send', description: 'Billing send_invoice_email consolidated into invoice_send', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.send_invoice_bulk', newId: 'billing.invoice_send', description: 'Billing send_invoice_bulk consolidated into invoice_send', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.mark_invoice_sent', newId: 'billing.invoice_send', description: 'Billing mark_invoice_sent consolidated into invoice_send', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.mark_invoice_paid', newId: 'billing.invoice_status', description: 'Billing mark_invoice_paid consolidated into invoice_status', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.check_invoices_overdue', newId: 'billing.invoice_status', description: 'Billing check_invoices_overdue consolidated into invoice_status', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.invoices_summary', newId: 'billing.invoice_summary', description: 'Billing invoices_summary renamed to invoice_summary', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_deep_analysis', newId: 'billing.analyze', description: 'Billing BI deep_analysis consolidated into analyze', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_learn_invoice_patterns', newId: 'billing.analyze', description: 'Billing BI consolidated into analyze', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_scan_payroll_patterns', newId: 'billing.analyze', description: 'Billing BI consolidated into analyze', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_scan_schedule_patterns', newId: 'billing.analyze', description: 'Billing BI consolidated into analyze', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_search_invoices', newId: 'billing.analyze', description: 'Billing BI consolidated into analyze', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.learn_preference', newId: 'billing.settings', description: 'Billing learn_preference consolidated into settings', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.push_to_qb', newId: 'billing.sync_qb', description: 'Billing push_to_qb consolidated into sync_qb', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.bi_prepare_for_qb', newId: 'billing.sync_qb', description: 'Billing bi_prepare_for_qb consolidated into sync_qb', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.qb_connection_status', newId: 'billing.sync_qb', description: 'Billing qb_connection_status consolidated into sync_qb', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.get_workspace_settings', newId: 'billing.settings', description: 'Billing settings consolidated', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.set_workspace_settings', newId: 'billing.settings', description: 'Billing settings consolidated', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.get_client_settings', newId: 'billing.settings', description: 'Billing settings consolidated', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.set_client_settings', newId: 'billing.settings', description: 'Billing settings consolidated', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.list_client_settings', newId: 'billing.settings', description: 'Billing settings consolidated', phase: 'phase_2_billing_merge' },
  { oldId: 'billing.draft_payroll', newId: 'payroll.draft', description: 'Billing draft_payroll moved to payroll.draft', phase: 'phase_2_billing_merge' },

  // PHASE 2 — Notify domain consolidation (9 -> 3)
  { oldId: 'notify.send_priority', newId: 'notify.send', description: 'Notify send_priority consolidated into notify.send', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.send_critical', newId: 'notify.send', description: 'Notify send_critical consolidated into notify.send', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.send_platform_update', newId: 'notify.send', description: 'Notify send_platform_update consolidated into notify.send', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.broadcast_message', newId: 'notify.broadcast', description: 'Notify broadcast_message renamed to notify.broadcast', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.bulk_by_role', newId: 'notify.broadcast', description: 'Notify bulk_by_role consolidated into notify.broadcast', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.clear_all', newId: 'notify.manage', description: 'Notify clear_all consolidated into notify.manage', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.mark_all_read', newId: 'notify.manage', description: 'Notify mark_all_read consolidated into notify.manage', phase: 'phase_2_notify_merge' },
  { oldId: 'notify.get_stats', newId: 'notify.manage', description: 'Notify get_stats consolidated into notify.manage', phase: 'phase_2_notify_merge' },

  // PHASE 2 — Onboarding domain consolidation (17 -> 7)
  { oldId: 'onboarding.send_invitation', newId: 'onboarding.invite', description: 'Onboarding send_invitation consolidated into invite', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.resend_invitation', newId: 'onboarding.invite', description: 'Onboarding resend consolidated into invite', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.revoke_invitation', newId: 'onboarding.invite', description: 'Onboarding revoke consolidated into invite', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.send_client_welcome', newId: 'onboarding.invite', description: 'Onboarding client_welcome consolidated into invite', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.provision_workspace', newId: 'onboarding.provision', description: 'Onboarding provision_workspace renamed', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.setup_defaults', newId: 'onboarding.provision', description: 'Onboarding setup_defaults consolidated into provision', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.get_routing_config', newId: 'onboarding.configure', description: 'Onboarding get_routing consolidated into configure', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.validate_routing', newId: 'onboarding.configure', description: 'Onboarding validate_routing consolidated into configure', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.connect_integration', newId: 'onboarding.configure', description: 'Onboarding connect_integration consolidated into configure', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.migrate_data', newId: 'onboarding.migrate', description: 'Onboarding migrate_data renamed', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.apply_auto_fixes', newId: 'onboarding.migrate', description: 'Onboarding apply_auto_fixes consolidated into migrate', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.track_progress', newId: 'onboarding.track', description: 'Onboarding track_progress renamed', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.get_checklist', newId: 'onboarding.track', description: 'Onboarding get_checklist consolidated into track', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.get_platform_status', newId: 'onboarding.track', description: 'Onboarding get_platform_status consolidated into track', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.recommend_features', newId: 'onboarding.recommend', description: 'Onboarding recommend_features renamed', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.gather_billing_preferences', newId: 'onboarding.recommend', description: 'Onboarding gather_billing_preferences consolidated into recommend', phase: 'phase_2_onboarding_merge' },
  { oldId: 'onboarding.run_diagnostics', newId: 'onboarding.diagnose', description: 'Onboarding run_diagnostics renamed to diagnose', phase: 'phase_2_onboarding_merge' },
];

function shimAction({ oldId, newId, description }: ShimDefinition): void {
  helpaiOrchestrator.registerAction({
    actionId: oldId,
    name: `[SHIM] ${oldId} -> ${newId}`,
    category: 'automation',
    description: `Compatibility shim: ${description}. Forwards to ${newId}.`,
    requiredRoles: [],
    handler: async (request: ActionRequest): Promise<ActionResult> => {
      const result = await helpaiOrchestrator.executeAction({
        ...request,
        actionId: newId,
        name: request.name || newId,
      });
      return {
        ...result,
        actionId: oldId, // Preserve original action ID in response
      };
    },
  });
}

export function registerActionCompatibilityShims(): void {
  for (const shim of LEGACY_ACTION_SHIMS) {
    shimAction(shim);
  }

  const countByPhase = LEGACY_ACTION_SHIMS.reduce<Record<ShimPhase, number>>((acc, shim) => {
    acc[shim.phase] = (acc[shim.phase] || 0) + 1;
    return acc;
  }, {
    phase_1_domain_merge: 0,
    phase_1_split_domain_merge: 0,
    phase_1_notify_merge: 0,
    phase_2_billing_merge: 0,
    phase_2_notify_merge: 0,
    phase_2_onboarding_merge: 0,
  });

  log.info(
    `[Action Compatibility Shims] Registered ${LEGACY_ACTION_SHIMS.length} backward-compatible action redirects`,
    countByPhase,
  );
}
