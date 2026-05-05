/**
 * DEPRECATED — redirects to ChatDock.
 * CoAIleague uses ONE universal ChatDock for all chat surfaces.
 * SARGE and Trinity both live in ChatDock.
 * @deprecated Use ChatDock directly.
 */
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function UniversalChatLayout() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate('/chatrooms'); }, [navigate]);
  return null;
}

export default UniversalChatLayout;
