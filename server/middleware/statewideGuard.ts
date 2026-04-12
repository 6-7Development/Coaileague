/**
 * statewideGuard — REMOVED (kept as no-op for import compatibility)
 *
 * History: This file previously contained a `statewideWriteGuard` that blocked
 * ALL POST/PUT/PATCH/DELETE mutations on the GRANDFATHERED_TENANT_ID workspace,
 * returning 403 TENANT_PROTECTED.
 *
 * Why it was removed:
 *   "Protected status" means billing-exempt + permanent enterprise tier access ONLY.
 *   It must NOT restrict any features, workflows, automations, pipelines, or Trinity
 *   orchestration. The write-block directly prevented those orgs from using the platform.
 *
 * What "protected" actually means (enforced elsewhere):
 *   - Billing exempt: server/services/billing/founderExemption.ts
 *   - Enterprise tier: server/tierGuards.ts (GRANDFATHERED_TENANT_ID bypass)
 *   - No suspension/cancellation: server/middleware/subscriptionGuard.ts
 *   - Support org (coaileague-platform-workspace): server/services/billing/billingConstants.ts NON_BILLING_WORKSPACE_IDS
 */

import type { Request, Response, NextFunction } from 'express';

/** @deprecated No-op. Write guard was removed — protected orgs are fully functional. */
export function statewideWriteGuard(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next();
}
