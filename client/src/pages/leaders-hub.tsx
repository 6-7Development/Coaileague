import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Shield,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw,
  UserCog,
  Calendar,
  Mail,
  FileText,
  ArrowUpRight,
  Lock,
  Unlock,
  UserX,
  ListTodo
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderStats {
  headcount: {
    total: number;
    active: number;
    onLeave: number;
    pendingOnboarding: number;
  };
  compliance: {
    compliant: number;
    expiringSoon: number;
    overdue: number;
  };
  pendingApprovals: {
    scheduleSwaps: number;
    timeAdjustments: number;
    ptoRequests: number;
  };
  recentActivity: {
    actionCount: number;
    escalationCount: number;
  };
}

interface PendingTask {
  id: string;
  type: 'schedule_swap' | 'time_adjustment' | 'pto_request' | 'compliance_review';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  employee: {
    id: string;
    name: string;
  };
  requestedAt: string;
}

interface RecentAction {
  id: string;
  action: string;
  targetEmployee: string;
  performedBy: string;
  performedAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function LeadersHub() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch leader dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<LeaderStats>({
    queryKey: ['/api/leaders/stats', refreshKey],
  });

  // Fetch pending tasks
  const { data: pendingTasks = [], isLoading: tasksLoading } = useQuery<PendingTask[]>({
    queryKey: ['/api/leaders/pending-tasks', refreshKey],
  });

  // Fetch recent actions
  const { data: recentActions = [], isLoading: actionsLoading } = useQuery<RecentAction[]>({
    queryKey: ['/api/leaders/recent-actions', refreshKey],
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'schedule_swap': return Calendar;
      case 'time_adjustment': return Clock;
      case 'pto_request': return FileCheck;
      case 'compliance_review': return Shield;
      default: return ListTodo;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <UserCog className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-leaders-hub-title">Leaders Hub</h1>
            <p className="text-sm text-muted-foreground">
              Self-service employee management · Approvals · Support escalation
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setRefreshKey(prev => prev + 1)}
          data-testid="button-refresh-leaders"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Headcount</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-headcount-total">
              {statsLoading ? "..." : stats?.headcount.total || 0}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <div>
                <span className="font-medium text-emerald-600">{stats?.headcount.active || 0}</span> active
              </div>
              <div>
                <span className="font-medium text-amber-600">{stats?.headcount.onLeave || 0}</span> on leave
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-compliance-total">
              {statsLoading ? "..." : `${stats?.compliance.compliant || 0}/${stats?.headcount.total || 0}`}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              {stats?.compliance.expiringSoon ? (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.compliance.expiringSoon} expiring soon
                </div>
              ) : null}
              {stats?.compliance.overdue ? (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {stats.compliance.overdue} overdue
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-approvals">
              {statsLoading ? "..." : (
                (stats?.pendingApprovals.scheduleSwaps || 0) +
                (stats?.pendingApprovals.timeAdjustments || 0) +
                (stats?.pendingApprovals.ptoRequests || 0)
              )}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-2">
              <div>{stats?.pendingApprovals.scheduleSwaps || 0} swaps</div>
              <div>{stats?.pendingApprovals.timeAdjustments || 0} time</div>
              <div>{stats?.pendingApprovals.ptoRequests || 0} PTO</div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-recent-actions">
              {statsLoading ? "..." : stats?.recentActivity.actionCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.recentActivity.escalationCount || 0} escalations to support
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common leader tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" data-testid="button-manage-employees">
              <Users className="h-4 w-4 mr-2" />
              Manage Employees
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-reset-password">
              <Lock className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-unlock-account">
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Account
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-view-reports">
              <FileText className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Separator className="my-2" />
            <Button variant="default" className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600" data-testid="button-escalate-support">
              <Mail className="h-4 w-4 mr-2" />
              Escalate to Support
            </Button>
          </CardContent>
        </Card>

        {/* Pending Tasks Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Items requiring your attention</CardDescription>
              </div>
              {pendingTasks.length > 0 && (
                <Badge variant="secondary" data-testid="badge-pending-count">
                  {pendingTasks.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {tasksLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 text-emerald-500" />
                  <p>All caught up! No pending tasks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => {
                    const TaskIcon = getTaskIcon(task.type);
                    return (
                      <Card
                        key={task.id}
                        className="hover-elevate cursor-pointer"
                        data-testid={`card-task-${task.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <TaskIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold truncate">{task.title}</h4>
                                  <Badge variant={getPriorityColor(task.priority) as any} className="shrink-0">
                                    {task.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <UserX className="h-3 w-3" />
                                    {task.employee.name}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.requestedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" data-testid={`button-view-task-${task.id}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
          <CardDescription>Your recent leader activities and audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-actions">All Actions</TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed-actions">Completed</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending-actions">Pending</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 mt-4">
              {actionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : recentActions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent actions to display
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover-elevate"
                        data-testid={`action-item-${action.id}`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          action.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                          action.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {action.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                          {action.status === 'pending' && <Clock className="h-4 w-4" />}
                          {action.status === 'failed' && <AlertCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{action.action}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {action.targetEmployee}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(action.performedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {action.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            <TabsContent value="completed">
              <div className="text-center text-muted-foreground py-8">
                Filter: Completed actions only
              </div>
            </TabsContent>
            <TabsContent value="pending">
              <div className="text-center text-muted-foreground py-8">
                Filter: Pending actions only
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
