import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function ReenableChatButton() {
  const [isChatClosed, setIsChatClosed] = useState(false);

  useEffect(() => {
    // Check if chat button is closed
    const checkChatStatus = () => {
      const closedState = localStorage.getItem('chat-button-closed');
      setIsChatClosed(closedState === 'true');
    };

    checkChatStatus();

    // Listen for changes to localStorage (cross-tab sync)
    window.addEventListener('storage', checkChatStatus);
    
    // Listen for custom event when chat is closed (same-tab)
    window.addEventListener('chat-button-closed', checkChatStatus);
    
    return () => {
      window.removeEventListener('storage', checkChatStatus);
      window.removeEventListener('chat-button-closed', checkChatStatus);
    };
  }, []);

  const handleReenableChat = () => {
    // Dispatch custom event to re-enable chat button
    window.dispatchEvent(new Event('reenable-chat-button'));
    setIsChatClosed(false);
  };

  // Only show if chat is closed
  if (!isChatClosed) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span>Chat support hidden?</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReenableChat}
        className="min-h-[36px]"
        data-testid="button-reenable-chat"
      >
        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
        Show Chat Support
      </Button>
    </div>
  );
}
