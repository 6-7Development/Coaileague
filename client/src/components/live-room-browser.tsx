import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Users,
  LogIn,
  LogOut,
  UserPlus,
  Volume2,
  VolumeX,
  Settings,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColorfulCelticKnot } from "@/components/ui/colorful-celtic-knot";
import { Loader2 } from "lucide-react";

interface RoomMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'busy';
  isStaff?: boolean;
}

interface LiveRoom {
  id: string;
  roomName: string;
  slug: string;
  workspaceId: string;
  status: 'active' | 'suspended' | 'archived';
  maxMembers: number;
  currentMembers: number;
  onlineMembers: RoomMember[];
  isJoined: boolean;
  unreadCount: number;
  lastActivity: string;
}

interface LiveRoomBrowserProps {
  onRoomSelect?: (roomId: string, roomName: string) => void;
  filterByOrg?: boolean; // For end users - show only org rooms
  compact?: boolean; // Compact mode for mobile
  title?: string; // Custom title for the room list header
  subtitle?: string; // Custom subtitle
}

export function LiveRoomBrowser({ onRoomSelect, filterByOrg = false, compact = false, title = "Active Rooms", subtitle }: LiveRoomBrowserProps) {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Fetch live rooms with user counts - enabled once auth is resolved and user is authenticated
  const { data: rooms, isLoading: isRoomsLoading, isError } = useQuery<LiveRoom[]>({
    queryKey: ['/api/comm-os/rooms/live'],
    enabled: isAuthenticated && !isAuthLoading,
    refetchInterval: 5000, // Poll every 5 seconds for live updates
    retry: 2, // Retry failed requests
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`/api/comm-os/rooms/${roomId}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comm-os/rooms/live'] });
      const room = rooms?.find(r => r.id === roomId);
      toast({
        title: "Joined Room",
        description: `You're now in ${room?.roomName || 'the room'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`/api/comm-os/rooms/${roomId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comm-os/rooms/live'] });
      const room = rooms?.find(r => r.id === roomId);
      toast({
        title: "Left Room",
        description: `You left ${room?.roomName || 'the room'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Leave Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-muted/30';
      case 'suspended': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserStatusColor = (status: 'online' | 'away' | 'busy') => {
    switch (status) {
      case 'online': return 'bg-muted/30';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Show loading state while auth is loading or rooms are fetching
  if (isAuthLoading || isRoomsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <ColorfulCelticKnot size="lg" state={isAuthLoading ? "focused" : "listening"} animated={true} animationSpeed="normal" />
        <p className="text-sm text-muted-foreground">
          {isAuthLoading ? 'Checking authentication...' : 'Loading rooms...'}
        </p>
      </div>
    );
  }

  // Show login prompt if not authenticated (after auth loading completes)
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="text-muted-foreground font-medium">Sign in to view chat rooms</p>
            <p className="text-sm text-muted-foreground mt-1">Authentication is required to access live chat</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="mt-4"
            data-testid="button-login-to-chat"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <p className="text-destructive font-medium">Failed to load chat rooms</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No chat rooms available</p>
          <p className="text-sm text-muted-foreground">Check back later or contact support</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {subtitle || `${rooms.length} room${rooms.length !== 1 ? 's' : ''} available`}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <div className="h-2 w-2 rounded-full bg-muted/30 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Card
            key={room.id}
            className={`hover-elevate cursor-pointer transition-all border-muted/60 ${
              selectedRoom === room.id ? 'ring-1 ring-primary border-primary/30' : ''
            }`}
            onClick={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)}
            data-testid={`room-card-${room.slug}`}
          >
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(room.status)} shrink-0`} />
                  <CardTitle className="text-sm font-medium truncate">{room.roomName}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-room-menu-${room.slug}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`button-settings-${room.slug}`}>
                      <Settings className="h-3.5 w-3.5 mr-2" />
                      Room Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <VolumeX className="h-3.5 w-3.5 mr-2" />
                      Mute Notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="flex items-center gap-1.5 text-[11px] mt-1">
                <Users className="h-3 w-3" />
                <span>{room.currentMembers} / {room.maxMembers}</span>
                {room.onlineMembers.length > 0 && (
                  <span className="text-primary font-medium">• {room.onlineMembers.length} online</span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 pb-3 px-4 space-y-2">
              {/* Online Members - Compact inline display */}
              {room.onlineMembers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {room.onlineMembers.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded text-[10px]"
                      data-testid={`member-${member.id}`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${getUserStatusColor(member.status)}`} />
                      <span className="truncate max-w-[60px]">{member.name.split(' ')[0]}</span>
                      {member.isStaff && <span className="text-primary font-medium">•</span>}
                    </div>
                  ))}
                  {room.onlineMembers.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{room.onlineMembers.length - 3}</span>
                  )}
                </div>
              )}

              {/* Unread + Action in single row */}
              <div className={compact ? "space-y-2" : "flex items-center gap-2"}>
                {room.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] gap-0.5">
                    <MessageSquare className="h-2.5 w-2.5" />
                    {room.unreadCount}
                  </Badge>
                )}
                {onRoomSelect && (
                  <Button
                    className={compact ? "w-full" : "flex-1"}
                    size="sm"
                    variant="default"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!room.isJoined) {
                        try {
                          await joinRoomMutation.mutateAsync(room.id);
                        } catch (error) {
                          toast({
                            title: "Failed to join room",
                            description: "Please try again",
                            variant: "destructive",
                          });
                          return;
                        }
                      }
                      onRoomSelect(room.id, room.roomName);
                    }}
                    disabled={joinRoomMutation.isPending}
                    data-testid={`button-enter-${room.slug}`}
                  >
                    {joinRoomMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {room.isJoined ? "Enter" : "Join"}
                  </Button>
                )}
                {!compact && room.isJoined && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      leaveRoomMutation.mutate(room.id);
                    }}
                    disabled={leaveRoomMutation.isPending}
                    data-testid={`button-leave-${room.slug}`}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
