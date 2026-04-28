// ============================================================================
// CANONICAL ROLE DEFINITIONS — Single Source of Truth
// ============================================================================
// ARCHITECTURE:
//
//  PLATFORM-WIDE ROLES (cross-tenant operations):
//    root_admin (7) → Platform root — cannot be impersonated
//    deputy_admin (6) → Delegated platform rights
//    sysop (5) → Platform technician
//    TRINITY/system (93 in actionHub, 4.5 here) → Orchestrator & gate
//      • Below root/sysop only
//      • Within tenant: full owner-level authority
//      • Face for: owners, Trinity Voice, support agents
//    support_manager (4) → Leads support team
//    support_agent (3) → Support agent
//    HELPAI (2.5 here) → Trinity's end-user face (officers/field workers)
//      • Always below Trinity
//      • Above support_agent tier
//      • Cannot override Trinity or access platform tools
//    compliance_officer (2) → Regulatory compliance access
//    Bot (generic bot role, maps to HelpAI tier)
//
//  WORKSPACE ROLES (tenant-scoped):
//    org_owner (7) → Tenant owner — full tenant control
//    co_owner (6) → Co-owner
//    org_admin (5) → Office administrator
//    org_manager (4) → Org-wide manager
//    manager (4) → Operations/shift manager
//    department_manager (4) → Department manager
//    supervisor (3) → Shift supervisor
//    staff (2) → General staff
//    employee (2) → Security officer / field employee
//    auditor (1.5) → Regulatory auditor — read-only compliance access
//    contractor (1) → Contract worker — limited access
//    client (0.5) → Client — view their own data only
// ============================================================================

// ── Workspace Role Types ──────────────────────────────────────────────────────

export type WorkspaceRole =
  | 'org_owner'
  | 'co_owner'
  | 'org_admin'
  | 'org_manager'
  | 'manager'
  | 'department_manager'
  | 'supervisor'
  | 'staff'
  | 'employee'
  | 'auditor'       // Regulatory auditor — read-only compliance/audit
  | 'contractor'
  | 'client';       // Client org — views their own incidents/invoices/coverage

// ── Platform Role Types ───────────────────────────────────────────────────────

export type PlatformRole =
  | 'root_admin'
  | 'deputy_admin'
  | 'sysop'
  | 'system'              // Trinity — primary orchestrator role
  | 'trinity-brain'       // Trinity brain context
  | 'automation'          // Generic automation actor (Trinity tier)
  | 'support_manager'
  | 'support_agent'
  | 'helpai'              // HelpAI — end-user face of Trinity
  | 'compliance_officer'
  | 'Bot'                 // Generic bot role (maps to HelpAI tier)
  | 'none';

// ── Workspace Role Hierarchy ──────────────────────────────────────────────────
// Higher number = higher authority.

export const WORKSPACE_ROLE_HIERARCHY: Record<string, number> = {
  'client':             0,   // Client — view-only own data (no workspace member status)
  'contractor':         1,   // Contract worker — limited workspace access
  'auditor':            1.5, // Regulatory auditor — read-only compliance (above contractor)
  'employee':           2,   // Security officer / field employee
  'staff':              2,   // General staff (alias)
  'supervisor':         3,   // Shift supervisor
  'manager':            4,   // Operations / shift manager
  'department_manager': 4,   // Department-level manager
  'dept_manager':       4,   // Alias
  'org_manager':        4,   // Org-wide manager
  'org_admin':          5,   // Office administrator (above org_manager, below co_owner)
  'co_owner':           6,   // Deputy chief / co-owner
  'org_owner':          7,   // Primary tenant owner
};

// ── Platform Role Hierarchy ───────────────────────────────────────────────────

export const PLATFORM_ROLE_HIERARCHY: Record<string, number> = {
  'none':               0,
  'Bot':                2.5,  // Generic bot — HelpAI tier
  'compliance_officer': 2,
  'helpai':             2.5,  // HelpAI — end-user face of Trinity (always below Trinity)
  'support_agent':      3,
  'support_manager':    4,
  'automation':         4.5,  // Trinity automation tier
  'system':             4.5,  // Trinity primary role
  'trinity-brain':      4.5,  // Trinity brain context
  'sysop':              5,
  'deputy_admin':       6,
  'root_admin':         7,
};

// ── Org Management Action Minimum Platform-Role Levels ───────────────────────
export const ORG_ACTION_MIN_LEVELS: Record<string, number> = {
  'suspend':     5,   // sysop+
  'deactivate':  5,
  'maintenance': 5,
  'freeze':      4,   // support_manager+
  'lock':        4,
  'unsuspend':   3,   // support_agent+
  'unfreeze':    3,
  'unlock':      3,
  'activate':    3,
};

// ── Platform-Wide Access Roles ────────────────────────────────────────────────
// These platform roles bypass workspace-level role requirements.

export const PLATFORM_WIDE_ROLES: PlatformRole[] = [
  'root_admin',
  'deputy_admin',
  'sysop',
  'system',           // Trinity — platform-wide orchestrator
  'trinity-brain',    // Trinity brain
  'automation',       // Automation actor
  'support_manager',
  'support_agent',
  'helpai',           // HelpAI — end-user support bot
  'compliance_officer',
  'Bot',
];

// ── Guard Role Lists ──────────────────────────────────────────────────────────

/** Tier 0: Ownership only */
export const OWNER_ROLES: WorkspaceRole[] = ['org_owner', 'co_owner'];

/** Tier 0.5: Admin+ */
export const ADMIN_ROLES: WorkspaceRole[] = ['org_owner', 'co_owner', 'org_admin'];

/** Tier 1: Manager+ (all management tiers including supervisor) */
export const MANAGER_ROLES: WorkspaceRole[] = [
  'org_owner', 'co_owner', 'org_admin', 'org_manager', 'manager', 'department_manager', 'supervisor',
];

/** Tier 1 (alias): Supervisor+ — same as MANAGER_ROLES */
export const SUPERVISOR_ROLES: WorkspaceRole[] = MANAGER_ROLES;

/** Leaders Hub: same as MANAGER_ROLES */
export const LEADER_ROLES: WorkspaceRole[] = MANAGER_ROLES;

/** Tier 3: All active workspace members (excludes auditor, contractor, client) */
export const EMPLOYEE_ROLES: WorkspaceRole[] = [
  'org_owner', 'co_owner', 'org_admin', 'org_manager', 'manager', 'department_manager', 'supervisor', 'staff', 'employee',
];

/**
 * Auditor access: regulatory auditors get read-only compliance/audit access.
 * They can view reports, audit trails, compliance records — NOT write/mutate.
 * Management roles also included (they have their own access anyway).
 */
export const AUDITOR_ROLES: WorkspaceRole[] = [
  'org_owner', 'co_owner', 'org_manager', 'manager', 'department_manager', 'auditor',
];

/** Regulatory auditor ONLY — for strictest read-only views */
export const REGULATORY_AUDITOR_ONLY: WorkspaceRole[] = ['auditor'];

/** Contractor access: all active workspace members including contractors */
export const CONTRACTOR_ROLES: WorkspaceRole[] = [
  'org_owner', 'co_owner', 'org_manager', 'manager', 'department_manager', 'supervisor', 'staff', 'employee', 'contractor',
];

/**
 * Finance access — owners only.
 * Billing, payroll disbursement, subscription actions require ownership.
 */
export const FINANCE_ROLES: WorkspaceRole[] = ['org_owner', 'co_owner'];

/**
 * Client portal access — clients see their own org's data only.
 * Workspace-scoped queries MUST include client workspace_id filter.
 */
export const CLIENT_ROLES: WorkspaceRole[] = ['client', 'org_owner', 'co_owner'];

// ── Role Capabilities Registry ────────────────────────────────────────────────
// What each role CAN do. Used by UI to show/hide features and by guards.

export const ROLE_CAPABILITIES: Record<string, {
  canRead: string[];      // what they can fetch/view
  canWrite: string[];     // what they can create/edit/save
  canDelete: string[];    // what they can delete
  canApprove: string[];   // what they can approve
  restrictions: string[]; // explicit restrictions
}> = {

  // ── Trinity (system) — The Orchestrator ───────────────────────────────────
  system: {
    canRead: ['ALL'],
    canWrite: ['ALL'],
    canDelete: ['shifts', 'coverage_requests', 'notifications', 'incidents'],
    canApprove: ['shifts', 'coverage', 'schedules', 'incidents', 'reports'],
    restrictions: ['platform_root_ops', 'sysop_platform_tools'], // cannot modify platform itself
  },

  // ── HelpAI — End-user face of Trinity ────────────────────────────────────
  helpai: {
    canRead: ['employees', 'shifts', 'schedules', 'incidents', 'post_orders', 'notifications', 'chat'],
    canWrite: ['chat_messages', 'notifications', 'support_tickets', 'incident_reports'],
    canDelete: [],
    canApprove: [],
    restrictions: ['financial', 'payroll', 'platform_tools', 'override_trinity'],
  },

  // ── Regulatory Auditor ────────────────────────────────────────────────────
  auditor: {
    canRead: [
      'audit_trails', 'compliance_reports', 'employee_certifications',
      'incidents', 'training_records', 'shift_logs', 'payroll_summaries',
      'guard_tour_logs', 'post_orders', 'regulatory_filings', 'documents',
    ],
    canWrite: ['audit_notes', 'regulatory_findings'],   // limited writes
    canDelete: [],                                       // NO deletes
    canApprove: [],                                      // NO approvals
    restrictions: [
      'employee_pii_edit', 'payroll_edit', 'schedule_edit',
      'delete_any', 'financial_write', 'client_data_write',
    ],
  },

  // ── Client ────────────────────────────────────────────────────────────────
  client: {
    canRead: [
      'their_incidents', 'their_invoices', 'their_contracts',
      'their_coverage_reports', 'their_post_orders', 'their_officer_logs',
      'their_compliance_status',
    ],
    canWrite: ['their_incident_comments', 'their_service_requests'],
    canDelete: [],
    canApprove: ['their_invoices'],  // clients can approve invoices
    restrictions: [
      'other_clients', 'employee_data', 'payroll', 'scheduling_write',
      'platform_tools', 'admin_functions',
    ],
  },

  // ── Support Agent ─────────────────────────────────────────────────────────
  support_agent: {
    canRead: [
      'workspace_summaries', 'support_tickets', 'user_accounts',
      'error_logs', 'platform_health', 'tenant_status',
    ],
    canWrite: ['support_tickets', 'knowledge_base_articles', 'user_notes'],
    canDelete: ['their_own_notes'],
    canApprove: ['support_ticket_resolution'],
    restrictions: [
      'financial_data', 'payroll', 'override_trinity', 'platform_admin',
      'delete_tenant_data',
    ],
  },

  // ── Owner ─────────────────────────────────────────────────────────────────
  org_owner: {
    canRead: ['ALL_TENANT'],
    canWrite: ['ALL_TENANT'],
    canDelete: ['ALL_TENANT'],
    canApprove: ['payroll', 'invoices', 'contracts', 'hires', 'terminations', 'trinity_actions'],
    restrictions: ['platform_admin', 'other_tenants'],
  },

  // ── Manager ───────────────────────────────────────────────────────────────
  manager: {
    canRead: [
      'employees', 'shifts', 'schedules', 'incidents', 'reports',
      'payroll_summaries', 'clients', 'post_orders', 'guard_tours',
      'training', 'certifications', 'attendance',
    ],
    canWrite: [
      'shifts', 'schedules', 'incidents', 'post_orders', 'employee_records',
      'coverage_requests', 'notifications', 'reports',
    ],
    canDelete: ['shifts', 'incidents_draft', 'their_own_notes'],
    canApprove: ['timesheets', 'coverage_requests', 'calloffs', 'training'],
    restrictions: ['payroll_disbursement', 'billing', 'subscription', 'hire_terminate_final'],
  },

  // ── Employee/Officer ──────────────────────────────────────────────────────
  employee: {
    canRead: [
      'their_schedule', 'their_shifts', 'their_payroll', 'their_incidents',
      'post_orders', 'their_training', 'their_certifications', 'chatdock',
    ],
    canWrite: [
      'clock_in_out', 'their_incident_reports', 'calloffs',
      'chatdock_messages', 'their_availability',
    ],
    canDelete: [],
    canApprove: [],
    restrictions: [
      'other_employees_data', 'payroll_write', 'schedule_write',
      'client_data', 'financial', 'admin_tools',
    ],
  },
};

// ── RBAC Helper Functions ─────────────────────────────────────────────────────

/** Check if a role is a Trinity/automation role */
export function isTrinityRole(role: string): boolean {
  return ['system', 'trinity-brain', 'automation'].includes(role);
}

/** Check if a role is HelpAI */
export function isHelpAIRole(role: string): boolean {
  return ['helpai', 'Bot'].includes(role);
}

/** Check if a role has client-level access only */
export function isClientRole(role: string): boolean {
  return role === 'client';
}

/** Check if a role is a regulatory auditor (read-only compliance) */
export function isAuditorRole(role: string): boolean {
  return role === 'auditor';
}

/** Get capabilities for a role */
export function getRoleCapabilities(role: string) {
  return ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES['employee'];
}
