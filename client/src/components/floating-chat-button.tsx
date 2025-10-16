import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export function FloatingChatButton() {
  const [location, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Don't show on the live chat page itself
  if (location === "/live-chat") {
    return null;
  }

  return (
    <button
      onClick={() => setLocation("/live-chat")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="button-floating-chat"
      className="fixed bottom-6 right-6 z-50"
      aria-label="Open Live Support"
    >
      <div 
        className="relative flex items-center overflow-hidden bg-[hsl(var(--cad-surface-elevated))] border border-[hsl(var(--cad-border-strong))] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover-elevate"
        style={{ width: isHovered ? '16rem' : '4rem' }}
      >
        {/* Icon - always visible */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
        </div>
        
        {/* Text Label - only visible on hover */}
        <div 
          className={`flex flex-col items-start pr-4 transition-opacity duration-300 whitespace-nowrap ${
            isHovered ? 'opacity-100 delay-100' : 'opacity-0'
          }`}
        >
          <span className="text-xs font-semibold text-[hsl(var(--cad-text-primary))]">Live Support</span>
          <span className="text-[10px] text-[hsl(var(--cad-text-tertiary))]">We're here to help</span>
        </div>
        
        {/* Online indicator */}
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
      </div>
    </button>
  );
}
