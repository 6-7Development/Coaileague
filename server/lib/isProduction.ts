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
  // RAILWAY_ENVIRONMENT_NAME is set by Railway to the exact environment name
  // ("production", "development", etc.) — use this as the primary signal.
  // This is more reliable than NODE_ENV which Railway always sets to "production"
  // even for non-production environments.
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME?.toLowerCase();
  if (railwayEnv && railwayEnv !== 'production') return false; // explicitly non-production
  if (railwayEnv === 'production') return true;

  // Fallback for non-Railway deploys
  if (process.env.RAILWAY_ENVIRONMENT === 'production') return true;
  if (process.env.K_SERVICE || process.env.K_REVISION) return true;

  // NODE_ENV fallback — but only if no Railway signal present
  if (!railwayEnv && process.env.NODE_ENV === 'production') return true;

  // Allow explicit override for Railway dev environments
  if (process.env.FORCE_DEVELOPMENT === 'true') return false;

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
