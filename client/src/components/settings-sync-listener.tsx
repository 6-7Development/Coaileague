import { useSettingsSync } from "@/hooks/use-settings-sync";

/**
 * SettingsSyncListener
 * --------------------
 * Mounts useSettingsSync once inside the authenticated app tree so any
 * settings_updated WS broadcast (workspace billing, seat cap, auditor
 * settings, sub-tenant inheritance) invalidates the matching react-query
 * keys automatically — no manual refresh required by co-admins.
 *
 * Renders nothing. Must live inside <WebSocketProvider>.
 */
export function SettingsSyncListener() {
  useSettingsSync();
  return null;
}
