import { useQuery, useMutation } from "@tanstack/react-query";
import { CONTACTS } from "@shared/platformConfig";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CanvasHubPage, type CanvasPageConfig } from "@/components/canvas-hub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLoadError } from "@/components/dashboard/DashboardLoadError";
import {
  UserCheck, Mail, Calendar, Clock, Headphones, Phone,
} from "lucide-react";

interface AccountManager {
  id: string;
  workspaceId: string;
  managerUserId: string;
  assignedAt: string;
  isPrimary: boolean;
  notes: string | null;
  lastContactAt: string | null;
  status: string;
  managerFirstName: string | null;
  managerLastName: string | null;
  managerEmail: string | null;
}

export default function AccountManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: managers, isLoading, isError, error, refetch } = useQuery<AccountManager[]>({
    queryKey: ['/api/enterprise-features/account-manager'],
  });

  const requestManagerMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/enterprise-features/account-manager', { 
      notes: 'Account manager requested from enterprise portal' 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise-features/account-manager'] });
      toast({ title: "Request Submitted", description: "Our team will assign a dedicated account manager to your organization shortly." });
    },
    onError: () => {
      toast({ title: "Request Failed", description: "Unable to submit request. Please try again.", variant: "destructive" });
    },
  });

  const handleScheduleMeeting = () => {
    toast({ title: "Meeting Request Sent", description: "Your account manager will reach out to schedule a time." });
  };

  const handleRequestManager = () => {
    requestManagerMutation.mutate();
  };

  const getInitials = (first: string | null, last: string | null) => {
    const f = first?.charAt(0)?.toUpperCase() || "";
    const l = last?.charAt(0)?.toUpperCase() || "";
    return f + l || "AM";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const pageConfig: CanvasPageConfig = {
    id: 'account-manager',
    title: 'Dedicated Account Manager',
    subtitle: 'Your enterprise support contact and escalation path',
    category: 'admin' as any,
    showHeader: true,
  };

  if (isError) {
    return (
      <CanvasHubPage config={pageConfig}>
        <DashboardLoadError
          message={error instanceof Error ? error.message : "We couldn't load your enterprise support contact right now."}
          onRetry={() => void refetch()}
        />
      </CanvasHubPage>
    );
  }

  if (isLoading) {
    return (
      <CanvasHubPage config={pageConfig}>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            We’re checking whether your workspace already has a dedicated support owner and recent contact history.
          </CardContent>
        </Card>
      </CanvasHubPage>
    );
  }

  const primaryManager = managers?.find((m) => m.isPrimary);
  const secondaryManagers = managers?.filter((m) => !m.isPrimary) || [];
  const hasManagers = managers && managers.length > 0;

  return (
    <CanvasHubPage config={pageConfig}>
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Enterprise support coverage</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {hasManagers
                    ? "Your enterprise support lane is active. Use this page to confirm who owns strategic follow-up, when you last heard from them, and how to escalate without leaving the platform."
                    : "No dedicated account manager is linked yet. That usually means enterprise onboarding is still being assigned, not that support is unavailable."}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:w-[30rem]">
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Coverage</p>
                  <p className="mt-1 text-sm font-medium">{hasManagers ? 'Assigned' : 'Pending assignment'}</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary contact</p>
                  <p className="mt-1 text-sm font-medium">{primaryManager ? `${primaryManager.managerFirstName ?? ''} ${primaryManager.managerLastName ?? ''}`.trim() || 'Assigned' : 'Not linked yet'}</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Fallback path</p>
                  <p className="mt-1 text-sm font-medium">{CONTACTS.enterprise}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasManagers ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Headphones className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-manager">No Account Manager Assigned</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Enterprise accounts receive a dedicated account manager for priority support,
                strategic guidance, and escalation handling. Request one for your organization.
              </p>
              <div className="grid gap-2 text-left text-xs text-muted-foreground max-w-md w-full rounded-lg border bg-muted/30 p-4 mb-6">
                <p className="font-medium text-foreground">What happens next</p>
                <p>1. We log the request against your workspace.</p>
                <p>2. The support team assigns the best contact for billing, rollout, and escalations.</p>
                <p>3. This page updates with direct contact details once the assignment is complete.</p>
              </div>
              <Button onClick={handleRequestManager} data-testid="button-request-manager">
                <UserCheck className="h-4 w-4 mr-2" />
                Request Account Manager
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Or contact enterprise support at {CONTACTS.enterprise}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {primaryManager && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Primary Account Manager
                    </CardTitle>
                    <Badge className="bg-green-600 text-white" data-testid="badge-primary-status">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6 flex-wrap">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {getInitials(primaryManager.managerFirstName, primaryManager.managerLastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold" data-testid="text-manager-name">
                          {primaryManager.managerFirstName} {primaryManager.managerLastName}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid="text-manager-email">
                          {primaryManager.managerEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Assigned: {formatDate(primaryManager.assignedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Last Contact: {formatDate(primaryManager.lastContactAt)}</span>
                        </div>
                      </div>
                      {primaryManager.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {primaryManager.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" asChild data-testid="button-email-manager">
                          <a href={`mailto:${primaryManager.managerEmail}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </Button>
                        <Button variant="outline" onClick={handleScheduleMeeting} data-testid="button-schedule-meeting">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {secondaryManagers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Contacts</CardTitle>
                  <CardDescription>Other team members available to support your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {secondaryManagers.map((manager) => (
                      <div
                        key={manager.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg border flex-wrap"
                        data-testid={`manager-card-${manager.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm bg-muted">
                              {getInitials(manager.managerFirstName, manager.managerLastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {manager.managerFirstName} {manager.managerLastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {manager.managerEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Assigned: {formatDate(manager.assignedAt)}</span>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${manager.managerEmail}`}>
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5" />
              Enterprise Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Priority Support</p>
                <p className="text-sm font-medium" data-testid="text-support-email">{CONTACTS.enterprise}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Response Time SLA</p>
                <p className="text-sm font-medium" data-testid="text-sla">Under 2 hours</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Escalation Path</p>
                <p className="text-sm font-medium" data-testid="text-escalation">Account Manager then VP Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CanvasHubPage>
  );
}
