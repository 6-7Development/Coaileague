/**
 * Live Updates Ticker
 * Modern clickable notification area with system status
 * Click to view notifications and latest updates
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export function LiveUpdatesTicker() {
  const [open, setOpen] = useState(false);

  // Always fetch notifications to show live unread counts
  const { data: notifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => apiRequest('/api/notifications/mark-all-read', 'POST'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
  });

  const statusText = isError 
    ? 'Connection Error' 
    : unreadCount > 0 
      ? `${unreadCount} New Update${unreadCount > 1 ? 's' : ''}` 
      : 'All Systems Operational';

  const ariaLabel = `Notifications: ${statusText}. Click to view details.`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-gradient/10 border border-primary/20 hover-elevate active-elevate-2 cursor-pointer transition-all overflow-visible"
          data-testid="button-live-updates"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!open);
            }
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-success-gradient text-white shrink-0 relative">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-destructive text-[8px] font-semibold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">
              {statusText}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-0.5 shrink-0 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Live</span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-destructive">
              Failed to load notifications. Please try again.
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                // Safely parse the createdAt date
                const createdDate = notification.createdAt 
                  ? new Date(notification.createdAt)
                  : new Date();
                
                const timeAgo = isNaN(createdDate.getTime())
                  ? 'Recently'
                  : formatDistanceToNow(createdDate, { addSuffix: true });

                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 overflow-visible hover-elevate cursor-pointer ${!notification.isRead ? 'bg-accent/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Bell className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {timeAgo}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
