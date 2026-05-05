/**
 * Trinity Chat — redirected to ChatDock
 * All chat (SARGE + Trinity) now lives in the universal ChatDock.
 * This page redirects managers to the appropriate channel.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function TrinityChat() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Trinity direct access requires manager+
    const role = (user as { role?: string })?.role;
    const isManager = ["manager", "owner", "admin", "super_admin"].includes(role || "");
    if (isManager) {
      setLocation("/chatrooms?room=trinity-command");
    } else {
      setLocation("/chatrooms");
    }
  }, [user, setLocation]);

  return null;
}
