import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  BarChart3, Users, Calendar, Clock, FileText, 
  DollarSign, Shield, Headphones, TrendingUp, Building2,
  CheckCircle, Receipt, ShieldCheck, Book, MessageSquare,
  Truck, HelpCircle, ArrowRight, Activity
} from "lucide-react";
import { CoAIleagueLoader } from "@/components/coaileague-loader";
import type { WorkspaceFeature } from "@shared/workspaceFeatures";

const iconMap: Record<string, any> = {
  BarChart3, Users, Calendar, Clock, FileText,
  DollarSign, Shield, Headphones, TrendingUp, Building2,
  CheckCircle, Receipt, ShieldCheck, Book, MessageSquare,
  Truck, HelpCircle, Activity
};

export default function Workspace() {
  const { user, isLoading } = useAuth();

  // ✅ SECURE: Fetch features from backend (server-side validation)
  const { data: featuresData, isLoading: featuresLoading } = useQuery<{
    features: WorkspaceFeature[];
    platformRole: string;
    workspaceRole: string | null;
  }>({
    queryKey: ['/api/me/workspace-features'],
    enabled: !!user,
  });

  // Fetch workspace stats
  const { data: stats } = useQuery<{
    totalEmployees: number;
    totalClients: number;
    activeShifts: number;
    pendingApprovals: number;
    totalRevenue: number;
  }>({
    queryKey: ['/api/analytics/stats'],
    enabled: !!user,
  });

  const availableFeatures = featuresData?.features || [];
  const platformRole = featuresData?.platformRole;
  const workspaceRole = featuresData?.workspaceRole;

  // Only show loader if actually loading AND not on a public route
  // CoAIleagueLoader internally checks universal gate anyway
  if (isLoading || featuresLoading) {
    return <CoAIleagueLoader isVisible={true} scenario="workspace" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="workspace-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-workspace-title">
          Welcome to your Workspace
        </h1>
        <p className="text-muted-foreground" data-testid="text-user-role">
          {platformRole && platformRole !== 'none' 
            ? `Platform Role: ${platformRole.replace(/_/g, ' ')}`
            : workspaceRole 
              ? `Workspace Role: ${workspaceRole.replace(/_/g, ' ')}`
              : 'Select a tool to get started'
          }
        </p>
      </div>

      {/* Quick Stats (for managers and owners) */}
      {stats && (workspaceRole === 'org_owner' || workspaceRole === 'department_manager') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold" data-testid="stat-employees">{stats.totalEmployees || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold" data-testid="stat-clients">{stats.totalClients || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Shifts</p>
                  <p className="text-2xl font-bold" data-testid="stat-shifts">{stats.activeShifts || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pendingApprovals || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CoAI Buddy Info Card */}
      <Card className="mb-8 bg-gradient-to-r from-cyan-50 to-purple-50 dark:from-cyan-950/20 dark:to-purple-950/20 border-cyan-200 dark:border-cyan-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-amber-500 shrink-0">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1" data-testid="text-coai-buddy-title">Meet Your CoAI Buddy</h3>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-coai-buddy-desc">
                Look for the three floating stars (Co/cyan, AI/purple, LE/gold) on every page. CoAI offers helpful tips, 
                answers questions, learns from your usage patterns, and provides contextual guidance. It monitors platform 
                health and celebrates holidays with seasonal themes!
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">Proactive Tips</span>
                <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Learns Your Patterns</span>
                <span className="px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Seasonal Themes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] || Activity;
            return (
              <Link key={feature.id} href={feature.path}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-feature-${feature.id}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{feature.label}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  {feature.description && (
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {availableFeatures.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tools Available</h3>
              <p className="text-muted-foreground mb-4">
                Contact your administrator to get access to workspace tools.
              </p>
              <Link href="/chat">
                <Button variant="outline">
                  <Headphones className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
