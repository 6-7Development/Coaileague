import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Send, Users, AlertCircle, Shield, 
  Headphones, User, Circle, Settings, Info
} from "lucide-react";
import type { ChatConversation, ChatMessage } from "@shared/schema";

interface OnlineUser {
  id: string;
  name: string;
  role: 'admin' | 'support' | 'customer';
  status: 'online' | 'away' | 'busy';
  avatar?: string;
}

export default function HelpdeskChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [onlineUsers] = useState<OnlineUser[]>([
    { id: '1', name: 'Admin Sarah', role: 'admin', status: 'online' },
    { id: '2', name: 'Support Mike', role: 'support', status: 'online' },
    { id: '3', name: 'Support Lisa', role: 'support', status: 'away' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Poll for conversations every 3 seconds
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
    refetchInterval: 3000,
  });

  // Poll for messages when conversation is selected
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 2000,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return await apiRequest(`/api/chat/conversations/${data.conversationId}/messages`, "POST", { 
        message: data.content,
        messageType: "text",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation, "messages"] });
      setMessageText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;

    sendMessage.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3 text-red-500" />;
      case 'support':
        return <Headphones className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'support':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen flex flex-col bg-[#2b2b2b]">
      {/* Classic IRC Header */}
      <div className="bg-[#1a1a1a] border-b border-[#3a3a3a] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white" data-testid="text-chat-title">
                WorkforceOS Support Chat
              </h1>
              <p className="text-xs text-gray-400">Live Support Helpdesk</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Circle className="w-2 h-2 fill-green-500 mr-1" />
            {onlineUsers.filter(u => u.status === 'online').length} Online
          </Badge>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Column: User List */}
        <div className="w-64 bg-[#1e1e1e] border-r border-[#3a3a3a] flex flex-col">
          <div className="px-3 py-2 bg-[#252525] border-b border-[#3a3a3a]">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Online Users ({onlineUsers.length})</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] transition-colors"
                  data-testid={`user-${user.id}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1e1e] ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{user.name}</p>
                    <Badge className={`text-[10px] h-4 px-1 ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Column: Messages */}
        <div className="flex-1 flex flex-col bg-[#2b2b2b] min-w-0">
          {/* Conversation Selector */}
          <div className="px-4 py-2 bg-[#252525] border-b border-[#3a3a3a] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <select
              value={selectedConversation || ""}
              onChange={(e) => setSelectedConversation(e.target.value || null)}
              className="flex-1 bg-[#1e1e1e] text-white text-sm border border-[#3a3a3a] rounded px-2 py-1"
              data-testid="select-conversation"
            >
              <option value="">Select a conversation...</option>
              {conversations.map((conv) => (
                <option key={conv.id} value={conv.id}>
                  Conversation #{conv.id.slice(0, 8)} - {conv.status}
                </option>
              ))}
            </select>
            {selectedConv && (
              <Badge variant="outline" className={
                selectedConv.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                selectedConv.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }>
                {selectedConv.priority}
              </Badge>
            )}
          </div>

          {/* Messages Area - Classic IRC Style */}
          <ScrollArea className="flex-1 p-4">
            {!selectedConversation ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            ) : messagesLoading ? (
              <div className="text-gray-500 text-center py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</div>
            ) : (
              <div className="space-y-1 font-mono text-sm" data-testid="messages-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.senderType === 'system' ? 'text-yellow-500 italic' : 'text-gray-300'}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <span className="text-gray-500 text-xs">
                      [{formatTime(msg.createdAt)}]
                    </span>
                    <span className={
                      msg.senderType === 'support' ? 'text-blue-400 font-semibold' :
                      msg.senderType === 'customer' ? 'text-green-400 font-semibold' :
                      'text-gray-400'
                    }>
                      {msg.senderType === 'support' && <Headphones className="w-3 h-3 inline mr-1" />}
                      {msg.senderType === 'system' && '***'}
                      {msg.senderName}:
                    </span>
                    <span className="text-white">{msg.message}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input - Classic IRC Style */}
          {selectedConversation && (
            <div className="p-3 bg-[#1e1e1e] border-t border-[#3a3a3a]">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#2b2b2b] border-[#3a3a3a] text-white placeholder:text-gray-500 font-mono"
                  disabled={sendMessage.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessage.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Info Panel */}
        <div className="w-80 bg-[#1e1e1e] border-l border-[#3a3a3a] flex flex-col">
          <div className="px-3 py-2 bg-[#252525] border-b border-[#3a3a3a]">
            <div className="flex items-center gap-2 text-gray-300">
              <Info className="w-4 h-4" />
              <span className="text-sm font-semibold">Conversation Info</span>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            {selectedConv ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <Badge variant="outline" className={
                    selectedConv.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    selectedConv.status === 'resolved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  }>
                    {selectedConv.status}
                  </Badge>
                </div>
                
                <Separator className="bg-[#3a3a3a]" />
                
                <div>
                  <p className="text-gray-400 mb-1">Priority</p>
                  <Badge variant="outline" className={
                    selectedConv.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    selectedConv.priority === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }>
                    {selectedConv.priority}
                  </Badge>
                </div>

                <Separator className="bg-[#3a3a3a]" />

                <div>
                  <p className="text-gray-400 mb-1">Created</p>
                  <p className="text-white">
                    {selectedConv.createdAt ? new Date(selectedConv.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                {selectedConv.lastMessageAt && (
                  <>
                    <Separator className="bg-[#3a3a3a]" />
                    <div>
                      <p className="text-gray-400 mb-1">Last Message</p>
                      <p className="text-white">
                        {new Date(selectedConv.lastMessageAt as Date).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}

                <Separator className="bg-[#3a3a3a]" />

                <div>
                  <p className="text-gray-400 mb-1">Workspace ID</p>
                  <p className="text-white font-mono text-xs break-all">
                    {selectedConv.workspaceId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a conversation to view details</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Classic IRC Status Bar */}
      <div className="bg-[#1a1a1a] border-t border-[#3a3a3a] px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4 text-gray-400">
          <span>WorkforceOS IRC v2.0</span>
          <span>•</span>
          <span>{conversations.length} conversations</span>
          <span>•</span>
          <span>{messages.length} messages</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={`w-2 h-2 fill-green-500`} />
          <span className="text-green-500">Connected</span>
        </div>
      </div>
    </div>
  );
}
