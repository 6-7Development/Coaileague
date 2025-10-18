// Admin Support Dashboard - Read-only troubleshooting interface
// SupportOS™ Master View - org-wide read-only view for troubleshooting

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { WFLogoCompact } from "@/components/wf-logo";

interface CustomerSearchResult {
  workspace: {
    id: string;
    name: string;
    companyName?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
    organizationId?: string;
  };
  owner: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  subscription?: {
    plan: string;
    status: string;
  };
  stats: {
    employeeCount: number;
    clientCount: number;
    invoiceCount: number;
    activeTickets: number;
  };
}

interface WorkspaceDetail {
  workspace: any;
  owner: any;
  subscription?: any;
  users: Array<{ user: any; employee?: any }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  billing: {
    totalRevenue: string;
    paidInvoices: number;
    pendingInvoices: number;
    stripeConnected: boolean;
  };
  tickets: any[];
  businessCategory: {
    category: string;
    availableTemplates: string[];
    installedTemplates: Array<{ name: string; category: string; isActive: boolean }>;
  };
}

export default function AdminSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  // Debounce search query
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  });

  // Fetch platform stats
  const { data: platformStats } = useQuery({
    queryKey: ["/api/admin/support/stats"],
    enabled: true,
  });

  // Search customers
  const { data: searchResults, isLoading: searchLoading } = useQuery<CustomerSearchResult[]>({
    queryKey: ["/api/admin/support/search", debouncedQuery],
    enabled: debouncedQuery.length >= 2,
  });

  // Get workspace detail
  const { data: workspaceDetail } = useQuery<WorkspaceDetail>({
    queryKey: ["/api/admin/support/workspace", selectedWorkspace],
    enabled: !!selectedWorkspace,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-900/30 p-2">
            <WFLogoCompact size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">SupportOS™ Master View</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Read-only org-wide view for troubleshooting
            </p>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-workspaces">
              {(platformStats as any)?.totalWorkspaces || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-subscriptions">
              {(platformStats as any)?.activeSubscriptions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-tickets">
              {(platformStats as any)?.openTickets || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-revenue">
              ${(platformStats as any)?.totalRevenue || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
          <CardDescription>
            Search by email, workspace name, or company name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>

          {/* Search Results */}
          {searchLoading && (
            <div className="mt-4 text-center text-muted-foreground">
              Searching...
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <Card
                  key={result.workspace.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedWorkspace(result.workspace.id)}
                  data-testid={`card-customer-${result.workspace.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{result.workspace.name}</h3>
                          <Badge variant="outline">
                            {result.subscription?.plan || "free"}
                          </Badge>
                        </div>
                        {result.workspace.organizationId && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-mono text-xs">
                              {result.workspace.organizationId}
                            </Badge>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {result.owner.email}
                        </p>
                        {result.workspace.companyName && (
                          <p className="text-sm text-muted-foreground">
                            {result.workspace.companyName}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{result.stats.employeeCount}</div>
                          <div className="text-muted-foreground">Employees</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{result.stats.clientCount}</div>
                          <div className="text-muted-foreground">Clients</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{result.stats.activeTickets}</div>
                          <div className="text-muted-foreground">Tickets</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && debouncedQuery.length >= 2 && (
            <div className="mt-4 text-center text-muted-foreground">
              No customers found matching "{debouncedQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspace Detail */}
      {selectedWorkspace && workspaceDetail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle>{workspaceDetail.workspace.name}</CardTitle>
                  {workspaceDetail.workspace.organizationId && (
                    <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-mono">
                      {workspaceDetail.workspace.organizationId}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {workspaceDetail.owner.email}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedWorkspace(null)}
                data-testid="button-close-detail"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
                <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
                <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge>{workspaceDetail.subscription?.plan || "free"}</Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Status: {workspaceDetail.subscription?.status || "active"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Business Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">
                        {workspaceDetail.businessCategory.category}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {workspaceDetail.businessCategory.installedTemplates.length} / {workspaceDetail.businessCategory.availableTemplates.length} templates installed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Stripe</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {workspaceDetail.billing.stripeConnected ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Not Connected</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workspaceDetail.recentActivity.slice(0, 5).map((activity, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                          <span>{activity.description}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Form Templates & Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Available Templates ({workspaceDetail.businessCategory.availableTemplates.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {workspaceDetail.businessCategory.availableTemplates.map((template, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {template}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {workspaceDetail.businessCategory.installedTemplates.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Installed & Active ({workspaceDetail.businessCategory.installedTemplates.filter(t => t.isActive).length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {workspaceDetail.businessCategory.installedTemplates
                              .filter(t => t.isActive)
                              .map((template, i) => (
                                <Badge key={i} className="text-xs">
                                  {template.name}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status Display (Read-only) */}
                {(workspaceDetail.workspace.isSuspended || workspaceDetail.workspace.isFrozen || workspaceDetail.workspace.isLocked) && (
                  <Card className="border-red-500/50 bg-red-500/5">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold text-red-500">Account Restrictions Active</h4>
                      {workspaceDetail.workspace.isSuspended && (
                        <div className="text-sm">
                          <Badge variant="destructive" className="mb-2">Suspended</Badge>
                          <p className="text-muted-foreground">{workspaceDetail.workspace.suspendedReason}</p>
                        </div>
                      )}
                      {workspaceDetail.workspace.isFrozen && (
                        <div className="text-sm">
                          <Badge variant="destructive" className="mb-2">Frozen</Badge>
                          <p className="text-muted-foreground">{workspaceDetail.workspace.frozenReason}</p>
                        </div>
                      )}
                      {workspaceDetail.workspace.isLocked && (
                        <div className="text-sm">
                          <Badge variant="destructive" className="mb-2">Locked</Badge>
                          <p className="text-muted-foreground">{workspaceDetail.workspace.lockedReason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                {workspaceDetail.users.map((userEntry, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {userEntry.user.firstName} {userEntry.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {userEntry.user.email}
                          </p>
                          {userEntry.employee && (
                            <Badge variant="outline" className="mt-1">
                              {userEntry.employee.workspaceRole}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${workspaceDetail.billing.totalRevenue}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Paid Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {workspaceDetail.billing.paidInvoices}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pending Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {workspaceDetail.billing.pendingInvoices}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets" className="space-y-4">
                {workspaceDetail.tickets.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No support tickets
                  </div>
                ) : (
                  workspaceDetail.tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{ticket.subject}</p>
                              <Badge>{ticket.status}</Badge>
                              <Badge variant="outline">{ticket.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {ticket.ticketNumber}
                            </p>
                            <p className="text-sm mt-2">{ticket.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
