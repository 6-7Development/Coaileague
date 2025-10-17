/**
 * MOBILE CHAT PAGE (Help360.5) - /mobilechat or /mobile-chat
 * Dedicated mobile-optimized chat experience with touch-first UX
 * Separate from desktop /live-chat route
 * 
 * Version: Help360.5 (Mobile Edition)
 * Desktop version: Help360 at /helpdesk-cab or /live-chat
 */

import HelpDesk5 from "./HelpDesk5";

export default function MobileChatPage() {
  console.log("✅ MobileChatPage component is rendering");
  return <HelpDesk5 />;
}
