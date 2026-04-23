/**
 * CANONICAL PUBLIC PATH REGISTRY
 * ================================
 * Single source of truth for all API paths that are:
 *   - PUBLIC: No authentication required, not subject to workspace guards
 *   - SEMI_PUBLIC: May require specific auth (e.g. key-based) but not session auth
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Previously every guard middleware (subscriptionGuard, cancelledWorkspaceGuard,
 * trinityGuard, terminatedEmployeeGuard, orgIsolation, CSRF) maintained its own
 * copy of exempt paths. Adding a new public endpoint required editing 5+ files.
 * One missed guard = 403 in production.
 *
 * Now: add your public path here once. All guards import this list.
 *
 * RULES
 * -----
 * - Paths are prefix-matched (startsWith)
 * - More specific paths first within each category
 * - Never add authenticated paths here
 * - Run: grep -r "isPublicPath\|PUBLIC_API_PATHS" server/ to find all usages
 */

/** Paths that require zero authentication — open to the internet */
export const PUBLIC_API_PATHS: string[] = [
  // ── Core auth flows (login, register, password reset, verification) ──────
  '/api/auth',
  '/api/tos',

  // ── Health + monitoring ──────────────────────────────────────────────────
  '/api/health',
  '/api/status',
  '/api/metrics',

  // ── CSRF token (must be public for frontend to bootstrap) ────────────────
  '/api/csrf-token',

  // ── Bootstrap (dev only — key-protected, not session-protected) ──────────
  '/api/bootstrap',

  // ── Webhooks (Stripe, Resend, Twilio, QuickBooks) — HMAC-verified ────────
  '/api/webhooks',
  '/api/webhook',
  '/api/stripe',
  '/api/billing/webhooks',
  '/api/voice',            // Twilio voice webhooks
  '/api/sms/inbound',      // Twilio inbound SMS
  '/api/sms/status',       // Twilio delivery status
  '/api/inbound',          // Resend inbound email

  // ── Public-facing pages (no account needed) ──────────────────────────────
  '/api/public',           // Job listings, public packets
  '/api/onboarding',       // Self-service employee onboarding
  '/api/platform-feedback', // Anonymous feedback

  // ── Platform status + legal docs ─────────────────────────────────────────
  '/api/legal',

  // ── Billing recovery (always available even for suspended/cancelled orgs) ─
  '/api/billing',
  '/api/platform',

  // ── Auditor portal (uses separate auditor session, not user session) ──────
  '/api/auditor',

  // ── Platform internal resets (key-protected) ─────────────────────────────
  '/api/internal-reset',

  // ── SPS public routes (public officer verification, job applications) ─────
  '/api/sps/public',

  // ── Client portal public token routes ────────────────────────────────────
  '/api/client-portal/public',

  // ── Public job/hiring portal ─────────────────────────────────────────────
  '/api/jobs',

  // ── Platform marketing / lead capture ────────────────────────────────────
  '/api/marketing',
];

/**
 * Returns true if the given request path is a public API path that should
 * bypass session authentication and workspace guards.
 */
export function isPublicPath(path: string): boolean {
  return PUBLIC_API_PATHS.some(prefix => path.startsWith(prefix));
}

/**
 * Paths exempt from subscription/billing guards specifically.
 * A superset of PUBLIC_API_PATHS — adds paths that need workspace auth
 * but should still work even for suspended/cancelled workspaces.
 */
export const BILLING_GUARD_EXEMPT_PATHS: string[] = [
  ...PUBLIC_API_PATHS,
  '/api/settings/billing',  // Let users see their billing status
  '/api/subscription',       // Subscription management
  '/api/payment',            // Payment methods
];

export function isBillingGuardExempt(path: string): boolean {
  return BILLING_GUARD_EXEMPT_PATHS.some(prefix => path.startsWith(prefix));
}
