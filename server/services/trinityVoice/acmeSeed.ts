/**
 * ACME Sandbox Voice Seed — Phase 56 / 57
 * =========================================
 * Directive 2: workspace_phone_numbers table eliminated.
 * Tenant phone numbers are now stored in workspaces.twilio_phone_number.
 * This seed is a no-op — update workspaces.twilio_phone_number directly
 * via the workspace settings API or a DB migration script.
 */

import { createLogger } from '../../lib/logger';
const log = createLogger('acmeSeed');

export async function seedAcmeVoice(): Promise<void> {
  // No-op: workspace_phone_numbers table removed (Directive 2).
  // Set workspaces.twilio_phone_number via workspace settings instead.
  log.info('[AcmeSeed] voice seed skipped — phone numbers on workspaces table');
}
