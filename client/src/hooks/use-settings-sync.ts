import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useWebSocketBus } from "@/providers/WebSocketProvider";

/**
 * Settings WS Sync Hook
 * =====================
 * Listens for `settings_updated` events broadcast by the server-side
 * settingsSyncBroadcaster (server/services/settingsSyncBroadcaster.ts) and
 * invalidates the matching react-query keys so co-admins editing settings in
 * parallel (or a sub-tenant inheriting from a freshly-edited parent) see the
 * change immediately without a manual refresh.
 *
 * The server broadcasts:
 *   { type: 'settings_updated', scope, workspaceId, changedFields, updatedAt,
 *     inheritedFrom?: <parentWorkspaceId> }
 *
 * Mount once near the top of the authenticated app tree.
 */

const SCOPE_TO_QUERY_KEYS: Record<string, string[][]> = {
  workspace_billing_settings: [
    ["/api/billing-settings/workspace"],
    ["/api/billing-settings/clients"],
  ],
  subscription_seat_cap: [
    ["/api/billing-settings/seat-hard-cap"],
    ["/api/subscriptions"],
  ],
  auditor_settings: [
    ["/api/auditor/settings"],
  ],
};

export interface SettingsUpdatedPayload {
  type: "settings_updated";
  scope: string;
  workspaceId: string;
  changedFields?: string[];
  updatedAt?: string;
  inheritedFrom?: string;
}

export function useSettingsSync(): void {
  const bus = useWebSocketBus();

  useEffect(() => {
    const handler = (raw: unknown) => {
      const data = raw as SettingsUpdatedPayload;
      if (!data || data.type !== "settings_updated") return;

      const keys = SCOPE_TO_QUERY_KEYS[data.scope];
      if (keys && keys.length) {
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/billing-settings/workspace"] });
      }

      window.dispatchEvent(
        new CustomEvent("settings_updated", { detail: data }),
      );
    };

    return bus.subscribe("settings_updated", handler);
  }, [bus]);
}
