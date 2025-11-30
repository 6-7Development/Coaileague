/**
 * Universal Navigation Header - Works on ALL pages (mobile + desktop)
 * Provides hamburger menu access to navigation on every page
 * Matches Fortune 500 professional aesthetic with CoAIleague branding
 */

import { Menu, ChevronDown, ChevronRight, GraduationCap, Search, Monitor, AlertCircle, Calendar, Clock, MessageSquare, Sparkles, Check, X, ExternalLink, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { selectCondensedMobileFamilies, getDesktopOnlyRoutes } from "@/lib/osModules";
import { CoAIleagueLogo } from "@/components/coailleague-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTransition } from "@/contexts/transition-context";
import { showLogoutTransition } from "@/lib/transition-utils";
import { useToast } from "@/hooks/use-toast";
import { NotificationsCenter } from "@/components/notifications-center";
import { HelpDropdown } from "@/components/help-dropdown";
import { FeedbackWidget } from "@/components/feedback-widget";
import { WhatsNewBadge } from "@/components/whats-new-badge";
import { PlanBadge } from "@/components/plan-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { performLogout } from "@/lib/logoutHandler";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface PlatformUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'security' | 'announcement';
  badge?: string;
  version?: string;
  learnMoreUrl?: string;
  isNew?: boolean;
  hasViewed?: boolean;
}

interface UpdatesResponse {
  success: boolean;
  updates: PlatformUpdate[];
  count: number;
}

interface UnviewedCountResponse {
  success: boolean;
  count: number;
}

function WhatsNewHeaderBadge() {
  const [open, setOpen] = useState(false);

  const { data: updatesData } = useQuery<UpdatesResponse>({
    queryKey: ['/api/whats-new/latest'],
    staleTime: 60000,
  });

  const { data: unviewedData } = useQuery<UnviewedCountResponse>({
    queryKey: ['/api/whats-new/unviewed-count'],
    staleTime: 30000,
  });

  const updates = updatesData?.updates || [];
  const unviewedCount = unviewedData?.count || 0;

  const markViewedMutation = useMutation({
    mutationFn: async (updateId: string) => {
      await apiRequest('POST', `/api/whats-new/${updateId}/viewed`, { source: 'header' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new/unviewed-count'] });
    },
  });

  const markAllViewedMutation = useMutation({
    mutationFn: async () => {
      for (const update of updates.filter(u => !u.hasViewed)) {
        await apiRequest('POST', `/api/whats-new/${update.id}/viewed`, { source: 'header-clear-all' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/whats-new/unviewed-count'] });
      setOpen(false);
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'bg-cyan-500/20 text-cyan-300';
      case 'improvement':
        return 'bg-blue-500/20 text-blue-300';
      case 'bugfix':
        return 'bg-orange-500/20 text-orange-300';
      case 'security':
        return 'bg-red-500/20 text-red-300';
      case 'announcement':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 relative"
          data-testid="button-whats-new-header"
          title="What's New"
        >
          <Sparkles className="h-4 w-4" />
          {unviewedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold">
              {unviewedCount > 9 ? '9+' : unviewedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-slate-900 border-slate-700" align="end" sideOffset={8}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">What's New</h3>
          </div>
          {unviewedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => markAllViewedMutation.mutate()}
              disabled={markAllViewedMutation.isPending}
              data-testid="button-clear-all-updates-header"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
        <Separator className="bg-slate-700" />
        <ScrollArea className="h-[320px]">
          {updates.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="text-sm text-slate-400">
                No new updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {updates.map((update) => (
                <div 
                  key={update.id} 
                  className={`p-4 space-y-2 relative group cursor-pointer ${!update.hasViewed ? 'bg-slate-800/50' : ''}`}
                  onClick={() => !update.hasViewed && markViewedMutation.mutate(update.id)}
                  data-testid={`update-header-${update.id}`}
                >
                  {!update.hasViewed && (
                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  )}
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <h4 className="font-medium text-sm text-white">{update.title}</h4>
                    {update.badge && (
                      <Badge variant="default" className="text-xs bg-primary">
                        {update.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getCategoryColor(update.category)}`}
                    >
                      {update.category}
                    </Badge>
                    {update.version && (
                      <span className="text-xs text-slate-500">v{update.version}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {update.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(update.date), { addSuffix: true })}
                    </p>
                    {update.learnMoreUrl && (
                      <a
                        href={update.learnMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`link-learn-more-header-${update.id}`}
                      >
                        Learn more
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator className="bg-slate-700" />
        <div className="p-3">
          <Link href="/updates">
            <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800" data-testid="button-view-all-updates-header">
              View All Updates
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function UniversalNavHeader() {
  const { workspaceRole, subscriptionTier, isPlatformStaff, isLoading } = useWorkspaceAccess();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const transition = useTransition();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get CONDENSED navigation items for mobile (essential features only)
  const families = isLoading 
    ? [] 
    : selectCondensedMobileFamilies(workspaceRole, subscriptionTier, isPlatformStaff);

  // Get desktop-only routes for "Use Desktop" prompt
  const desktopOnlyRoutes = isLoading
    ? []
    : getDesktopOnlyRoutes(workspaceRole, subscriptionTier, isPlatformStaff);

  // Track expanded sections - ALL expanded by default for easy access
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Update expanded sections when families data loads
  useEffect(() => {
    if (families.length > 0) {
      const allExpanded: Record<string, boolean> = {};
      families.forEach(family => {
        allExpanded[family.id] = true; // ALL sections expanded by default
      });
      setExpandedSections(allExpanded);
    }
  }, [families.length]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getRoleDisplay = () => {
    if (!workspaceRole) return "User";
    
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'manager': 'Manager',
      'employee': 'Employee',
      'owner': 'Owner',
      'leader': 'Leader',
    };
    
    return roleMap[workspaceRole] || workspaceRole;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleLogout = async () => {
    showLogoutTransition(transition);
    setSidebarOpen(false);
    await performLogout();
  };

  const handleNavigate = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900 text-white shadow-lg">
      <div className="flex items-center justify-between px-3 py-3 gap-2">
        {/* Left: Hamburger Menu + Role Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-slate-800 flex-shrink-0"
                data-testid="button-hamburger-menu"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px] overflow-y-auto bg-slate-900 border-slate-700">
              {/* Header - Using CoAIleagueLogo Component */}
              <div className="p-5 border-b border-slate-700/50">
                <Link href="/dashboard" onClick={handleNavigate} data-testid="link-dashboard-logo" className="flex items-center">
                  <CoAIleagueLogo 
                    width={180} 
                    height={50} 
                    showTagline={true} 
                    showWordmark={true}
                  />
                </Link>
              </div>

              {/* Use Desktop Notice */}
              {desktopOnlyRoutes.length > 0 && (
                <div className="px-4 pt-4">
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <Monitor className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    <AlertDescription className="text-xs text-foreground/80 mt-1">
                      <strong className="font-semibold block mb-1">Mobile Limitations</strong>
                      Major operations require desktop for best experience:
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                        {desktopOnlyRoutes.slice(0, 5).map(route => (
                          <li key={route.id}>{route.label}</li>
                        ))}
                        {desktopOnlyRoutes.length > 5 && (
                          <li className="font-semibold">+{desktopOnlyRoutes.length - 5} more features</li>
                        )}
                      </ul>
                      <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-600 font-medium">
                        📍 Use desktop for AI Scheduling, Invoicing, Payroll & Analytics
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Navigation Menu */}
              <div className="px-3 py-4 space-y-1">
                {families.map((family) => (
                  <div key={family.id} className="mb-2">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(family.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                      data-testid={`toggle-section-${family.id}`}
                    >
                      <span>{family.label}</span>
                      {expandedSections[family.id] ? 
                        <ChevronDown size={12} className="text-slate-500" /> : 
                        <ChevronRight size={12} className="text-slate-500" />
                      }
                    </button>

                    {/* Section Items */}
                    {expandedSections[family.id] && (
                      <div className="mt-1 space-y-0.5">
                        {family.routes.map((route) => {
                          const Icon = route.icon;
                          const isActive = location === route.href;
                          return (
                            <Link 
                              key={route.id}
                              href={route.href}
                              onClick={handleNavigate}
                              className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                isActive 
                                  ? 'bg-slate-800 text-white' 
                                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                              }`}
                              data-testid={`link-${route.id}`}
                            >
                              <Icon size={18} className={`shrink-0 ${
                                isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                              }`} />
                              <span className="flex-1 min-w-0 text-sm font-medium break-words">
                                {route.label}
                              </span>
                              {route.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  route.badge === 'Root' 
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                    : route.badge === 'Enterprise' 
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                  {route.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Tools Section - Only show when authenticated */}
              {user && !isLoading && (
                <div className="p-4 border-t border-slate-700/50 space-y-3">
                  {/* Plan Badge */}
                  <PlanBadge />

                  {/* Tutorial & Search - Grid Layout */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if ((window as any).setShowOnboarding) {
                          (window as any).setShowOnboarding(true);
                        }
                        setSidebarOpen(false);
                      }}
                      className="justify-start gap-2 h-9 text-slate-300 hover:text-white hover:bg-slate-800"
                      data-testid="button-mobile-tutorial"
                    >
                      <GraduationCap className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs">Tutorial</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if ((window as any).openCommandPalette) {
                          (window as any).openCommandPalette();
                        } else {
                          const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true });
                          document.dispatchEvent(event);
                        }
                        setSidebarOpen(false);
                      }}
                      className="justify-start gap-2 h-9 text-slate-300 hover:text-white hover:bg-slate-800"
                      data-testid="button-mobile-search"
                    >
                      <Search className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs">Search</span>
                    </Button>
                  </div>

                  {/* Help & Feedback - Grid Layout */}
                  <div className="grid grid-cols-2 gap-2" onClick={() => setSidebarOpen(false)}>
                    <HelpDropdown />
                    <FeedbackWidget />
                  </div>

                  {/* What's New - Full Width */}
                  <div className="w-full" onClick={() => setSidebarOpen(false)}>
                    <WhatsNewBadge />
                  </div>
                </div>
              )}

              {/* Footer: User Profile + Settings + Sign Out */}
              <div className="p-4 border-t border-slate-700/50 space-y-2">
                {/* User Info Display */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800">
                  <Avatar className="w-10 h-10 rounded-lg border-2 border-slate-600">
                    <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover rounded-lg" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.firstName || user?.lastName 
                        ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
                        : "User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>

                {/* Settings Button */}
                <Link
                  href="/settings"
                  onClick={() => setSidebarOpen(false)}
                  data-testid="link-settings-hamburger"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Settings
                  </Button>
                </Link>

                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleLogout}
                  data-testid="button-logout-hamburger"
                >
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Role Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
              <span className="text-xs font-bold text-cyan-400">{getRoleDisplay()[0]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{getRoleDisplay()}</p>
              {subscriptionTier && (
                <p className="text-xs text-slate-400 capitalize">{subscriptionTier}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: CoAIleague Branding */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <div className="flex items-baseline gap-1">
            <span className="hidden sm:inline text-base font-bold whitespace-nowrap">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Co</span>
              <span className="text-white">AI</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">league</span>
            </span>
            <span className="sm:hidden text-lg font-bold text-cyan-400">CO</span>
            <span className="text-[8px] sm:text-[10px] font-bold align-super">™</span>
          </div>
        </div>

        {/* Center-Right: Quick Menu Tabs (Desktop) */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <Link href="/schedule">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 text-xs ${location.startsWith('/schedule') ? 'text-cyan-400 bg-white/10' : 'text-slate-300 hover:text-white'}`}
              data-testid="button-header-schedule"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </Button>
          </Link>
          <Link href="/time-tracking">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 text-xs ${location.startsWith('/time') ? 'text-cyan-400 bg-white/10' : 'text-slate-300 hover:text-white'}`}
              data-testid="button-header-time"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Time</span>
            </Button>
          </Link>
          <Link href="/chat">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 text-xs ${location.startsWith('/chat') ? 'text-cyan-400 bg-white/10' : 'text-slate-300 hover:text-white'}`}
              data-testid="button-header-chat"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
          </Link>
        </div>

        {/* Right: What's New + Notifications + User Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* What's New Badge - All Screen Sizes */}
          <div className="[&_button]:text-white [&_button]:hover:bg-white/20 flex-shrink-0">
            <WhatsNewHeaderBadge />
          </div>
          
          {/* Notifications */}
          <div className="[&_button]:text-white [&_button]:hover:bg-white/20 flex-shrink-0">
            <NotificationsCenter />
          </div>

          {/* User Menu Dropdown - Desktop Only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex-shrink-0"
                data-testid="button-user-menu"
                title="User Menu"
              >
                <span className="text-sm font-bold">{getInitials(user?.firstName, user?.lastName)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleLogout}
                data-testid="button-logout-desktop-menu"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date indicator */}
      <div className="px-3 pb-2 text-center">
        <p className="text-sm font-medium">
          Today
        </p>
        <p className="text-xs opacity-90">
          {new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
