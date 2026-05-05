/**
 * Workspace Provisioning Service — Wave 23
 * ─────────────────────────────────────────────────────────────────────────────
 * Everything that needs to happen when a new org subscribes.
 * Triggered by Stripe subscription.created webhook.
 *
 * Idempotent — safe to call multiple times (ON CONFLICT DO NOTHING).
 *
 * Provisions:
 *   1. Tenant onboarding checklist record (5 mandatory steps)
 *   2. #general, #ops, #trinity-command rooms
 *   3. SARGE auto-joined to all rooms
 *   4. Welcome notification to owner via SARGE
 *   5. workspace.onboardingStatus = 'pending_setup'
 */

import { pool } from "../db";
import { createLogger } from "../lib/logger";
import { broadcastToWorkspace } from "../websocket";

const log = createLogger("WorkspaceProvisioning");

const SARGE_BOT_ID = "helpai-bot";
const TRINITY_COMMAND_ROOM_NAME = "trinity-command";

export const workspaceProvisioningService = {
  async provisionNewTenant(workspaceId: string, companyName: string): Promise<void> {
    log.info(`[Provisioning] Starting for workspace ${workspaceId} (${companyName})`);

    // 1. Mark workspace as pending setup
    await pool.query(
      `UPDATE workspaces SET onboarding_status = 'pending_setup', updated_at = NOW()
       WHERE id = $1`,
      [workspaceId]
    ).catch(() => {}); // onboarding_status column may not exist yet — non-fatal

    // 2. Create mandatory onboarding checklist (5 steps) — idempotent
    await pool.query(`
      INSERT INTO tenant_onboarding_steps
        (workspace_id, step_key, step_number, label, required, status)
      VALUES
        ($1, 'state_selection',    1, 'Select your operating state',           true,  'pending'),
        ($1, 'org_code',           2, 'Choose your organization code',          true,  'pending'),
        ($1, 'license_number',     3, 'Enter your company license number',      true,  'pending'),
        ($1, 'overage_limits',     4, 'Set AI usage overage limits',            true,  'pending'),
        ($1, 'import_data',        5, 'Import existing employee data (optional)',false, 'skipped')
      ON CONFLICT (workspace_id, step_key) DO NOTHING`,
      [workspaceId]
    ).catch(err => {
      log.warn("[Provisioning] Onboarding steps insert (non-fatal):", err.message);
    });

    // 3. Create default chat rooms including #trinity-command
    const defaultRooms = [
      { id: `${workspaceId}-general`,         name: "General",         slug: "general",          desc: "Company-wide announcements" },
      { id: `${workspaceId}-ops`,              name: "Operations",      slug: "ops",              desc: "Field operations and dispatch" },
      { id: `${workspaceId}-trinity-command`,  name: "trinity-command", slug: TRINITY_COMMAND_ROOM_NAME, desc: "Trinity strategic command — managers and owners only" },
    ];

    for (const room of defaultRooms) {
      await pool.query(`
        INSERT INTO conversations
          (id, workspace_id, name, slug, description, conversation_type,
           is_private, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'channel', $6, NOW(), NOW())
        ON CONFLICT (workspace_id, slug) DO NOTHING`,
        [room.id, workspaceId, room.name, room.slug, room.desc,
         room.slug === TRINITY_COMMAND_ROOM_NAME] // trinity-command is private
      ).catch(err => log.warn("[Provisioning] Room creation (non-fatal):", err.message));
    }

    // 4. Auto-join SARGE to all rooms
    for (const room of defaultRooms) {
      await pool.query(`
        INSERT INTO conversation_participants (conversation_id, user_id, workspace_id, joined_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [room.id, SARGE_BOT_ID, workspaceId]
      ).catch(err => log.warn("[Provisioning] SARGE join room (non-fatal):", err.message));
    }

    // 5. Welcome notification to owner
    await pool.query(`
      INSERT INTO notifications
        (workspace_id, user_id, title, message, notification_type, priority, created_at)
      SELECT $1, id, 'Welcome to CoAIleague!',
        'Your workspace is ready. Complete the 5-step setup to unlock your dashboard. SARGE is online and ready to help.',
        'system', 'high', NOW()
      FROM users WHERE workspace_id = $1 AND role IN ('owner','super_admin')
      LIMIT 1
      ON CONFLICT DO NOTHING`,
      [workspaceId]
    ).catch(err => log.warn("[Provisioning] Welcome notification (non-fatal):", err.message));

    // 6. Broadcast to workspace so dashboard refreshes
    await broadcastToWorkspace(workspaceId, {
      type: "workspace_provisioned",
      data: { workspaceId, companyName, requiresSetup: true },
    }).catch(() => {});

    log.info(`[Provisioning] Complete for ${workspaceId}`);
  },
};
