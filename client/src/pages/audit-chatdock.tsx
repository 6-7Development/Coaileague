/**
 * Audit ChatDock — folded into universal ChatDock with audit filter
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuditChatDock() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/chatrooms?filter=audit"); }, [setLocation]);
  return null;
}
