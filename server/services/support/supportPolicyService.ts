/**
 * supportPolicyService.ts — Platform Support Access Policy
 * ==========================================================
 * Single source of truth for support staff roles, HelpAI admin access,
 * and notification routing. Eliminates route-local role arrays across
 * supportRoutes, helpai-routes, helpdeskRoutes, and supportActionRoutes.
 *
 * Codex handoff 2026-04-23: sections 6-11
 */

// ── Role Groups (canonical — import instead of duplicating) ───────────────

/** Full platform staff access — can cross any workspace */
export const HELPAI_ADMIN_PLATFORM_ROLES = [
  'root_admin',
  'deputy_admin',
  'support_manager',
  'support_agent',
  'sysop',
  'compliance_officer',
] as const;

/** Roles that can manage support controls (higher bar than mere staff) */
export const SUPPORT_CONTROL_ROLES = [
  'root_admin',
  'deputy_admin',
  'support_manager',
  'sysop',
] as const;

/** Roles that can issue AI service elevation grants */
export const SUPPORT_AI_SERVICE_ELEVATION_ISSUER_ROLES = [
  'root_admin',
  'deputy_admin',
  'sysop',
] as const;

/** Roles that receive executive-level notifications */
export const NOTIFICATION_EXECUTIVE_ROLES = [
  'root_admin',
  'deputy_admin',
] as const;

/** Roles that receive management-level notifications */
export const NOTIFICATION_MANAGEMENT_ROLES = [
  'root_admin',
  'deputy_admin',
  'support_manager',
  'sysop',
  'org_owner',
  'co_owner',
  'manager',
] as const;

/** Roles that receive operations-level notifications */
export const NOTIFICATION_OPERATIONS_ROLES = [
  'root_admin',
  'deputy_admin',
  'support_manager',
  'support_agent',
  'sysop',
  'org_owner',
  'co_owner',
  'manager',
  'supervisor',
] as const;

/** Roles that receive shift-attention notifications (clock-in, coverage, etc.) */
export const NOTIFICATION_SHIFT_ATTENTION_ROLES = [
  'org_owner',
  'co_owner',
  'manager',
  'supervisor',
  'shift_leader',
] as const;

// ── Legacy alias normalization ────────────────────────────────────────────

/** Maps legacy/alias role names to their canonical equivalents */
const ROLE_ALIASES: Record<string, string> = {
  root: 'root_admin',
  support: 'support_agent',
  platform_staff: 'support_agent',
  support_staff: 'support_agent',
  deputy_assistant: 'support_manager',
};

/**
 * Normalizes a role string — converts legacy aliases to canonical form.
 * Use this at the ENTRY POINT of role checks so alias drift is handled once.
 */
export function normalizePlatformRoleAlias(role: string | null | undefined): string {
  if (!role) return '';
  return ROLE_ALIASES[role] ?? role;
}

// ── Access policy helpers ─────────────────────────────────────────────────

/**
 * True if the role is a platform support staff member (any tier).
 * Handles legacy aliases automatically.
 */
export function isPlatformSupportStaffRole(role: string | null | undefined): boolean {
  const normalized = normalizePlatformRoleAlias(role);
  return HELPAI_ADMIN_PLATFORM_ROLES.includes(normalized as any);
}

/**
 * True if the role can access HelpAI admin tooling (action logs, FAQ gaps, etc.)
 */
export function canAccessHelpAIAdmin(role: string | null | undefined): boolean {
  return isPlatformSupportStaffRole(role);
}

/**
 * True if the role can manage platform-wide support controls
 * (room status changes, MOTD creation, HelpAI toggle, etc.)
 */
export function canManageSupportControls(role: string | null | undefined): boolean {
  const normalized = normalizePlatformRoleAlias(role);
  return SUPPORT_CONTROL_ROLES.includes(normalized as any);
}

/**
 * True if the role can issue AI service elevation grants.
 * Higher bar than general support staff.
 */
export function canIssueSupportAIServiceElevation(role: string | null | undefined): boolean {
  const normalized = normalizePlatformRoleAlias(role);
  return SUPPORT_AI_SERVICE_ELEVATION_ISSUER_ROLES.includes(normalized as any);
}

/**
 * True if the role can execute support actions (general support execution).
 * This is the standard gate for support action routing.
 */
export function canExecuteSupportActions(role: string | null | undefined): boolean {
  return isPlatformSupportStaffRole(role);
}
