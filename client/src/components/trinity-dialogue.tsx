/**
 * TRINITY DIALOGUE - Floating Chat Interface
 * ===========================================
 * Universal AI conversation interface accessible from anywhere in the app.
 * Part of Phase 1D: Floating Trinity Dialogue UI
 * See: docs/trinity-platform-consciousness-roadmap.md
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Brain,
  Sparkles,
  Loader2,
  ChevronDown,
  User,
  Bot,
  Zap,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidenceScore?: number;
  mode?: 'demo' | 'pro' | 'guru';
}

interface TrinityDialogueProps {
  workspaceId?: string;
  userId?: string;
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export function TrinityDialogue({
  workspaceId,
  userId,
  defaultOpen = false,
  position = 'bottom-right',
}: TrinityDialogueProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'demo' | 'pro' | 'guru'>('pro');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: userTrustLevel } = useQuery({
    queryKey: ['/api/trinity/trust-level', userId, workspaceId],
    enabled: !!userId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/helpai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          workspaceId,
          source: 'trinity-dialogue',
          mode,
        }),
      });
      return response;
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply || response.message || 'I understand. How can I help further?',
        timestamp: new Date(),
        confidenceScore: response.confidenceScore,
        mode: response.mode || mode,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Message failed',
        description: error.message || 'Could not reach Trinity. Please try again.',
        variant: 'destructive',
      });
      setIsTyping(false);
    },
  });

  const handleSend = useCallback(() => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    sendMessageMutation.mutate(trimmedInput);
  }, [inputValue, sendMessageMutation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  if (!isOpen) {
    return (
      <Button
        data-testid="button-trinity-dialogue-open"
        onClick={() => setIsOpen(true)}
        size="icon"
        className={`fixed bottom-20 ${positionClasses} z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover-elevate`}
      >
        <Brain className="h-6 w-6" />
        <span className="sr-only">Open Trinity Chat</span>
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 animate-pulse" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card
        data-testid="card-trinity-dialogue-minimized"
        className={`fixed bottom-20 ${positionClasses} z-50 w-64 shadow-lg cursor-pointer hover-elevate`}
        onClick={() => setIsMinimized(false)}
      >
        <CardHeader className="p-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Trinity AI</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {mode}
            </Badge>
            <Button
              data-testid="button-trinity-maximize"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      data-testid="card-trinity-dialogue"
      className={`fixed bottom-20 ${positionClasses} z-50 w-80 sm:w-96 h-[500px] max-h-[70vh] shadow-xl flex flex-col`}
    >
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="h-5 w-5 text-primary" />
            <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Trinity AI</CardTitle>
            <p className="text-xs text-muted-foreground">
              {userTrustLevel?.trustLevel ? `Trust: ${userTrustLevel.trustLevel}` : 'Platform Copilot'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge 
            variant={mode === 'guru' ? 'default' : 'outline'} 
            className="text-xs cursor-pointer"
            onClick={() => setMode(mode === 'guru' ? 'pro' : 'guru')}
            data-testid="badge-trinity-mode"
          >
            {mode === 'guru' && <Zap className="h-3 w-3 mr-1" />}
            {mode}
          </Badge>
          <Button
            data-testid="button-trinity-minimize"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            data-testid="button-trinity-close"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Brain className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Hi! I'm Trinity, your platform copilot.
            </p>
            <p className="text-xs text-muted-foreground">
              Ask me anything about scheduling, time tracking, billing, or platform features.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`message-${msg.role}-${msg.id}`}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.confidenceScore !== undefined && (
                    <p className="text-xs opacity-70 mt-1">
                      Confidence: {msg.confidenceScore}%
                    </p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-3 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            data-testid="input-trinity-message"
            placeholder="Ask Trinity anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            data-testid="button-trinity-send"
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default TrinityDialogue;
