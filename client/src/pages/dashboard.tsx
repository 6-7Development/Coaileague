import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, CheckCircle, Target, Activity, DollarSign, 
  FileText, Calendar, Clock, ArrowRight 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import ModernLayout from "@/components/ModernLayout";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Fetch workspace stats
  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/stats'],
    enabled: isAuthenticated,
  });

  // Fetch employees to determine user's workspace role
  const { data: allEmployees } = useQuery<any[]>({
    queryKey: ['/api/employees'],
    enabled: isAuthenticated,
  });

  // Determine current user's workspace role
  const currentEmployee = allEmployees?.find((emp: any) => emp.userId === user?.id);
  const workspaceRole = currentEmployee?.workspaceRole || 'employee';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/api/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[hsl(var(--cad-background))] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[hsl(var(--cad-blue))] border-t-transparent rounded-full" />
      </div>
    );
  }

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'User';
  const totalEmployees = (stats as any)?.totalEmployees || 24;
  const activeToday = (stats as any)?.activeToday || 18;
  const totalRevenue = (stats as any)?.totalRevenue || 284000;
  const efficiency = 96.3;
  const completedToday = 8934;
  const uptime = 99.8;

  const recentActivities = [
    { time: '2m ago', user: 'Sarah Chen', action: 'Clocked in for morning shift', status: 'success' },
    { time: '5m ago', user: 'Mike Torres', action: 'Completed invoice for ACME Corp', status: 'success' },
    { time: '12m ago', user: 'Emily Davis', action: 'Approved 3 time entries', status: 'success' },
    { time: '18m ago', user: 'System', action: 'Generated weekly payroll report', status: 'info' },
    { time: '23m ago', user: 'John Smith', action: 'Updated employee schedule', status: 'success' },
  ];

  return (
    <ModernLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" data-testid="text-welcome">
              Welcome back, {firstName}
            </h2>
            <p className="text-sm sm:text-base text-[hsl(var(--cad-text-secondary))]">
              {workspaceRole === 'owner' ? 'Manage your entire workforce' : 
               workspaceRole === 'manager' ? 'Oversee your team performance' :
               'Track your time and tasks'}
            </p>
          </div>

            {/* Metrics Grid - Indigo/Purple Gradient Theme */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up" data-testid="card-employees">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+12%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Total Employees</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{totalEmployees}</p>
              </div>

              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }} data-testid="card-active">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+8%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Active Today</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{activeToday}</p>
              </div>

              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }} data-testid="card-completed">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+23%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Tasks Completed</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{completedToday.toLocaleString()}</p>
              </div>

              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up" style={{ animationDelay: '0.3s' }} data-testid="card-efficiency">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+2%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Efficiency</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{efficiency}%</p>
              </div>

              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up" style={{ animationDelay: '0.4s' }} data-testid="card-revenue">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+18%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">${(totalRevenue / 1000).toFixed(1)}K</p>
              </div>

              <div className="card-interactive p-4 sm:p-6 hover-lift animate-slide-up" style={{ animationDelay: '0.5s' }} data-testid="card-uptime">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+0.2%</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-1">Uptime</p>
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{uptime}%</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-interactive p-4 sm:p-6 hover-lift" data-testid="card-activity">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                </div>
                <span className="gradient-text">Recent Activity</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-900/30 rounded-lg hover-elevate">
                    <div className={`w-2 h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 animate-pulse-glow ${
                      activity.status === 'success' ? 'bg-emerald-400' : 
                      activity.status === 'info' ? 'bg-indigo-400' : 'bg-amber-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center justify-between gap-2 mb-1 flex-col sm:flex-row">
                        <span className="font-semibold text-sm sm:text-base text-indigo-400 truncate">{activity.user}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 flex-shrink-0">{activity.time}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400">{activity.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Link href="/employees">
                <button className="w-full bg-[hsl(var(--cad-surface))] border border-[hsl(var(--cad-border))] rounded-xl p-4 text-left hover-elevate active-elevate-2 transition-all" data-testid="button-manage-employees">
                  <Users className="w-8 h-8 text-[hsl(var(--cad-blue))] mb-3" />
                  <h4 className="font-bold mb-1">Manage Employees</h4>
                  <p className="text-sm text-[hsl(var(--cad-text-secondary))] mb-2">View and edit employee records</p>
                  <div className="flex items-center text-[hsl(var(--cad-blue))] text-sm font-semibold">
                    View all <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </Link>

              <Link href="/schedule">
                <button className="w-full bg-[hsl(var(--cad-surface))] border border-[hsl(var(--cad-border))] rounded-xl p-4 text-left hover-elevate active-elevate-2 transition-all" data-testid="button-schedule">
                  <Calendar className="w-8 h-8 text-[hsl(var(--cad-blue))] mb-3" />
                  <h4 className="font-bold mb-1">Schedule</h4>
                  <p className="text-sm text-[hsl(var(--cad-text-secondary))] mb-2">Manage shifts and assignments</p>
                  <div className="flex items-center text-[hsl(var(--cad-blue))] text-sm font-semibold">
                    Open <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </Link>

              <Link href="/time-tracking">
                <button className="w-full bg-[hsl(var(--cad-surface))] border border-[hsl(var(--cad-border))] rounded-xl p-4 text-left hover-elevate active-elevate-2 transition-all" data-testid="button-time-tracking">
                  <Clock className="w-8 h-8 text-[hsl(var(--cad-blue))] mb-3" />
                  <h4 className="font-bold mb-1">Time Tracking</h4>
                  <p className="text-sm text-[hsl(var(--cad-text-secondary))] mb-2">Review and approve time entries</p>
                  <div className="flex items-center text-[hsl(var(--cad-blue))] text-sm font-semibold">
                    Review <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </Link>

              <Link href="/invoices">
                <button className="w-full bg-[hsl(var(--cad-surface))] border border-[hsl(var(--cad-border))] rounded-xl p-4 text-left hover-elevate active-elevate-2 transition-all" data-testid="button-invoices">
                  <FileText className="w-8 h-8 text-[hsl(var(--cad-blue))] mb-3" />
                  <h4 className="font-bold mb-1">Invoices</h4>
                  <p className="text-sm text-[hsl(var(--cad-text-secondary))] mb-2">Generate and send invoices</p>
                  <div className="flex items-center text-[hsl(var(--cad-blue))] text-sm font-semibold">
                    Create <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }
