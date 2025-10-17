/**
 * MOBILE CHAT PAGE - /mobilechat
 * Dedicated mobile-optimized chat experience
 * Separate from desktop /live-chat route
 * 
 * This route forces mobile layout regardless of device size
 * Desktop chat is at /helpdesk-cab or /live-chat
 */

import { useEffect } from "react";

export default function MobileChatPage() {
  useEffect(() => {
    // Add mobile indicator to body for debugging/analytics
    document.body.setAttribute('data-chat-type', 'mobile');
    return () => {
      document.body.removeAttribute('data-chat-type');
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
          Mobile Chat
        </h1>
        <p className="text-slate-400 max-w-md">
          Mobile-optimized chat interface coming soon. 
          <br />
          For now, please use the desktop chat at <a href="/helpdesk-cab" className="text-blue-500 hover:underline">/helpdesk-cab</a>
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <a 
            href="/helpdesk-cab" 
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
          >
            Go to Desktop Chat
          </a>
        </div>
      </div>
    </div>
  );
}
