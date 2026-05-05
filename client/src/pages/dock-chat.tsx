/**
 * Dock Chat — redirected to universal ChatDock
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function DockChat() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/chatrooms"); }, [setLocation]);
  return null;
}
