/**
 * MOBILE CHAT PAGE - /mobilechat
 * Dedicated mobile-optimized chat experience
 * Separate from desktop /live-chat route
 * 
 * This route forces mobile layout regardless of device size
 * Desktop chat is at /helpdesk-cab or /live-chat
 */

import HelpDesk5 from "./HelpDesk5";

export default function MobileChatPage() {
  console.log("✅ MobileChatPage component is rendering");
  return <HelpDesk5 />;
}
