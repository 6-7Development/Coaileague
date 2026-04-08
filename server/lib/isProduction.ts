/**
 * Canonical production-environment detection.
 *
 * Railway-only as of 2026-04-08. The legacy Replit deployment signal
 * (`REPLIT_DEPLOYMENT === '1'`) has been removed — CoAIleague no longer
 * ships on Replit. The helper now unifies:
 *   - NODE_ENV === 'production' (the Node.js convention, also set by Railway)
 *   - RAILWAY_ENVIRONMENT === 'production' (explicit Railway signal)
 *   - K_SERVICE / K_REVISION present (Google Cloud Run, kept for future)
 *
 * Use isProduction() instead of any inline env check. New hosting
 * environments only need to be added here.
 */

export function isProduction(): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.RAILWAY_ENVIRONMENT === 'production') return true;
  if (process.env.K_SERVICE || process.env.K_REVISION) return true;
  return false;
}

/** Inverse of isProduction — readability helper. */
export function isDevelopment(): boolean {
  return !isProduction();
}

/**
 * Returns true only when running on a real customer-facing deploy.
 * Use this for the strictest gates (writes to production tenants,
 * destructive cleanup, dev-data seeding refusal).
 */
export function isProductionDeploy(): boolean {
  return isProduction();
}
