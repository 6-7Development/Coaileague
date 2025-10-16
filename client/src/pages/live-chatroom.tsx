import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useChatroomWebSocket } from "@/hooks/use-chatroom-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageSquare, Send, Users, Circle, Shield, 
  Headphones, User, Bot, Sparkles, Wifi, WifiOff,
  Lock, Unlock, Settings, AlertCircle, CheckCircle
} from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface OnlineUser {
  id: string;
  name: string;
  role: 'admin' | 'support' | 'customer' | 'bot';
  status: 'online';
}

export default function LiveChatroomPage() {
  const [messageText, setMessageText] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showStaffControls, setShowStaffControls] = useState(false);
  const [roomStatusControl, setRoomStatusControl] = useState<"open" | "closed" | "maintenance">("open");
  const [roomStatusMessage, setRoomStatusMessage] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get current user data
  const { data: currentUser } = useQuery<{ user: { id: string; email: string; platformRole?: string } }>({
    queryKey: ["/api/auth/me"],
  });
  
  const userId = currentUser?.user?.id;
  const userName = currentUser?.user?.email || 'User';
  const isStaff = currentUser?.user?.platformRole && 
    ['platform_admin', 'deputy_admin', 'deputy_assistant', 'sysop'].includes(currentUser.user.platformRole);
  
  // Fetch HelpDesk room info
  const { data: helpDeskRoom } = useQuery({
    queryKey: ['/api/helpdesk/room/helpdesk'],
    enabled: !!userId,
  });
  
  // Use WebSocket for real-time messaging
  const { 
    messages, sendMessage, isConnected, error, reconnect,
    requiresTicket, roomStatus, statusMessage: wsStatusMessage, temporaryError, clearAccessError
  } = useChatroomWebSocket(userId, userName);

  // Ticket verification mutation
  const verifyTicketMutation = useMutation({
    mutationFn: async (ticketNum: string) => {
      const result = await apiRequest('/api/helpdesk/verify-ticket', {
        method: 'POST',
        body: JSON.stringify({
          ticketNumber: ticketNum,
          roomSlug: 'helpdesk',
        }),
      });
      return result;
    },
    onSuccess: () => {
      // Invalidate room data to refresh status
      queryClient.invalidateQueries({ queryKey: ['/api/helpdesk/room/helpdesk'] });
      clearAccessError();
      setShowTicketDialog(false);
      setTicketNumber("");
      toast({
        title: "Access Granted",
        description: "You can now join the HelpDesk chatroom",
      });
      reconnect(); // Reconnect to apply new access
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid ticket number",
        variant: "destructive",
      });
    },
  });

  // Room status toggle mutation (staff only)
  const toggleRoomStatusMutation = useMutation({
    mutationFn: async ({ status, message }: { status: string; message: string }) => {
      const result = await apiRequest(`/api/helpdesk/room/helpdesk/status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          statusMessage: message || null,
        }),
      });
      return result;
    },
    onSuccess: () => {
      // Invalidate room data to refresh status indicators
      queryClient.invalidateQueries({ queryKey: ['/api/helpdesk/room/helpdesk'] });
      setShowStaffControls(false);
      toast({
        title: "Room Status Updated",
        description: "HelpDesk room status has been changed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update room status",
        variant: "destructive",
      });
    },
  });

  // Static online users (would be WebSocket-based in production)
  const [onlineUsers] = useState<OnlineUser[]>([
    { id: 'bot-1', name: 'help_bot', role: 'bot', status: 'online' },
    { id: userId || '1', name: userName, role: 'admin', status: 'online' },
    { id: '2', name: 'Support Mike', role: 'support', status: 'online' },
    { id: '3', name: 'Support Lisa', role: 'support', status: 'online' },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to chat server. Reconnecting...",
        variant: "destructive",
      });
      reconnect();
      return;
    }

    sendMessage(messageText.trim(), userName, 'support');
    setMessageText("");
  };

  // Sync staff controls state with server data when room data loads
  useEffect(() => {
    if (helpDeskRoom) {
      setRoomStatusControl(helpDeskRoom.status as "open" | "closed" | "maintenance");
      setRoomStatusMessage(helpDeskRoom.statusMessage || "");
    }
  }, [helpDeskRoom]);

  // Show ticket verification dialog when access is denied
  useEffect(() => {
    if (requiresTicket && !isStaff) {
      setShowTicketDialog(true);
    }
  }, [requiresTicket, isStaff]);

  // Show error toast when connection issues occur (but not for access errors - those use dialog)
  useEffect(() => {
    if (error && !requiresTicket) {
      toast({
        title: temporaryError ? "Temporary Error" : "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, requiresTicket, temporaryError, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRoleIcon = (senderType: string) => {
    switch (senderType) {
      case 'support':
        if (senderType.includes('Admin')) {
          return <Shield className="w-3 h-3 text-red-500" />;
        }
        return <Headphones className="w-3 h-3 text-blue-500" />;
      case 'bot':
      case 'system':
        return <Bot className="w-3 h-3 text-purple-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">WorkforceOS HelpDesk</h1>
                    {helpDeskRoom && (
                      <Badge 
                        variant={helpDeskRoom.status === 'open' ? 'default' : 'destructive'}
                        className="gap-1"
                        data-testid="badge-room-status"
                      >
                        {helpDeskRoom.status === 'open' ? (
                          <>
                            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                            Open
                          </>
                        ) : helpDeskRoom.status === 'closed' ? (
                          <>
                            <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                            Closed
                          </>
                        ) : (
                          <>
                            <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />
                            Maintenance
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {helpDeskRoom?.statusMessage || "Live Support • IRC/MSN-style instant messaging"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                <span className="text-sm font-medium">{onlineUsers.length} Online</span>
              </div>
              {isStaff && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStaffControls(true)}
                  data-testid="button-staff-controls"
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Staff Controls
                </Button>
              )}
              <Badge 
                variant={isConnected ? "default" : "destructive"} 
                className="gap-1"
                data-testid="badge-connection-status"
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Welcome to the chatroom!</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Start the conversation - messages appear <strong>instantly</strong> for all users
                </p>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Real-time WebSocket messaging
                </Badge>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === userId;
                const isSystemMessage = msg.senderType === 'system';
                
                if (isSystemMessage) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div className="flex flex-col items-center gap-1 min-w-[60px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        msg.senderType === 'support' ? 'bg-blue-500/10' :
                        msg.senderType === 'bot' ? 'bg-purple-500/10' :
                        'bg-muted'
                      }`}>
                        {getRoleIcon(msg.senderType)}
                      </div>
                      <span className="text-xs text-muted-foreground text-center leading-tight">
                        {msg.senderName}
                      </span>
                    </div>
                    
                    <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`rounded-lg px-4 py-2 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              className="flex-1"
              data-testid="input-chat-message"
              autoFocus
              disabled={!isConnected}
            />
            <Button 
              type="submit" 
              disabled={!messageText.trim() || !isConnected}
              data-testid="button-send-message"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            <strong>Instant delivery</strong> via WebSocket • IRC/MSN-style live messaging
          </p>
        </div>
      </div>

      {/* Right Sidebar - Online Users */}
      <div className="w-64 border-l bg-card p-4 hidden md:block">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Online ({onlineUsers.length})
            </h3>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover-elevate"
                  data-testid={`user-${user.id}`}
                >
                  <Circle className="w-2 h-2 fill-green-500 text-green-500 flex-shrink-0" />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    {user.role === 'support' && <Headphones className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    {user.role === 'bot' && <Bot className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                    <span className="text-sm font-medium truncate">{user.name}</span>
                  </div>
                  {user.role === 'bot' && (
                    <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-3">
              <CardTitle className="text-xs flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground">
                help_bot is powered by GPT-4 and can assist with common questions instantly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Verification Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent data-testid="dialog-ticket-verification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              HelpDesk Access Required
            </DialogTitle>
            <DialogDescription>
              This HelpDesk room requires a verified support ticket. Please enter your ticket number to gain access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-number">Support Ticket Number</Label>
              <Input
                id="ticket-number"
                placeholder="e.g., TKT-123456"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                data-testid="input-ticket-number"
              />
              <p className="text-xs text-muted-foreground">
                Your support ticket must be verified by staff before you can join.
              </p>
            </div>
            {wsStatusMessage && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{wsStatusMessage}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTicketDialog(false)}
                data-testid="button-cancel-ticket"
              >
                Cancel
              </Button>
              <Button
                onClick={() => verifyTicketMutation.mutate(ticketNumber)}
                disabled={!ticketNumber.trim() || verifyTicketMutation.isPending}
                data-testid="button-verify-ticket"
                className="gap-2"
              >
                {verifyTicketMutation.isPending ? (
                  <>Verifying...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verify & Join
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Controls Dialog */}
      <Dialog open={showStaffControls} onOpenChange={setShowStaffControls}>
        <DialogContent data-testid="dialog-staff-controls">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              HelpDesk Staff Controls
            </DialogTitle>
            <DialogDescription>
              Manage HelpDesk room status and access control. Changes apply immediately to all users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-status">Room Status</Label>
              <Select
                value={roomStatusControl}
                onValueChange={(value: any) => setRoomStatusControl(value)}
              >
                <SelectTrigger id="room-status" data-testid="select-room-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      Open - Everyone can join
                    </div>
                  </SelectItem>
                  <SelectItem value="closed">
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                      Closed - No new access
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />
                      Maintenance - Staff only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-message">Status Message (Optional)</Label>
              <Textarea
                id="status-message"
                placeholder="e.g., 'Closed for the weekend' or 'System maintenance in progress'"
                value={roomStatusMessage}
                onChange={(e) => setRoomStatusMessage(e.target.value)}
                rows={3}
                data-testid="textarea-status-message"
              />
              <p className="text-xs text-muted-foreground">
                This message will be shown to users trying to access the room.
              </p>
            </div>
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Staff Bypass</p>
                    <p className="text-muted-foreground">
                      Platform staff can always access the room, even when closed or under maintenance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStaffControls(false)}
                data-testid="button-cancel-controls"
              >
                Cancel
              </Button>
              <Button
                onClick={() => toggleRoomStatusMutation.mutate({ 
                  status: roomStatusControl, 
                  message: roomStatusMessage 
                })}
                disabled={toggleRoomStatusMutation.isPending}
                data-testid="button-apply-controls"
                className="gap-2"
              >
                {toggleRoomStatusMutation.isPending ? (
                  <>Applying...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
