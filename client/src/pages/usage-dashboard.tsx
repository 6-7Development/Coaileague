import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import { useQuery } from "@tanstack/react-query";
import { CanvasHubPage, type CanvasPageConfig } from "@/components/canvas-hub";
import { ResponsiveLoading } from "@/components/loading-indicators";
import { DashboardLoadError } from "@/components/dashboard/DashboardLoadError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Cpu,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  History,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTokenMonitor } from "@/hooks/use-token-monitor";

interface CreditBalance {
  currentBalance: number;
  monthlyAllocation: number;
  totalTokensUsed?: number;
  lastResetAt: string;
  nextResetAt: string;
  subscriptionTier: string;
  unlimited?: boolean;
  creditsUsedThisPeriod?: number;
  tokensUsed?: number;
  tokensAllowance?: number | null;
  overageTokens?: number;
  overageAmountCents?: number;
}

interface CreditUsageBreakdown {
  featureKey: string;
  featureName: string;
  totalCredits?: number;
  tokensUsed?: number;
  operationCount: number;
}

interface CreditTransaction {
  id: string;
  actionType?: string | null;
  transactionType?: string | null;
  tokensUsed?: number | null;
  amount?: number | null;
  balanceAfter?: number | null;
  featureKey: string | null;
  featureName: string | null;
  description?: string | null;
  modelUsed?: string | null;
  createdAt: string;
}

const FEATURE_LABELS: Record<string, string> = {
  trinity_action: "Trinity AI",
  ai_scheduling: "Smart Scheduling",
  ai_general: "General AI Assistant",
  ai_notification: "Smart Notifications",
  ai_email_classification: "Email Sorting",
  ai_shift_extraction: "Shift Detection",
  dynamic_motd: "Daily Briefing",
  usage_metering: "Usage Tracking",
  trinity_chat: "Trinity Chat",
  trinity_thought: "Trinity Thinking",
  trinity_insight: "Trinity Insight",
  ai_invoicing: "Smart Invoicing",
  ai_payroll: "Payroll Processing",
  ai_analytics: "Analytics & Reports",
  ai_sentiment: "Team Sentiment",
  ai_onboarding: "Employee Onboarding",
  ai_compliance: "Compliance Check",
  ai_dispute: "Dispute Resolution",
  ai_document_extraction: "Document Reading",
  ai_issue_detection: "Issue Detection",
  ai_quick_insight: "Quick Insight",
  ai_chat_query: "AI Chat",
  ai_vision: "Image Analysis",
  email_classification: "Email Classification",
  voice: "Voice Interaction",
  ai_assist: "AI Assist",
};

function humanizeRawName(raw: string): string {
  const cleaned = raw
    .replace(/^AI operation:\s*/i, "")
    .replace(/^scheduleos_/i, "Schedule ")
    .replace(/_/g, " ")
    .replace(/\bai\b/gi, "AI")
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function humanizeFeatureName(featureKey: string | null, featureName?: string | null): string {
  if (featureKey && FEATURE_LABELS[featureKey]) return FEATURE_LABELS[featureKey];
  if (featureName) return humanizeRawName(featureName);
  if (featureKey) return humanizeRawName(featureKey);
  return "System Activity";
}

function humanizeTransactionDescription(tx: CreditTransaction): string {
  if (tx.featureKey && FEATURE_LABELS[tx.featureKey]) return FEATURE_LABELS[tx.featureKey];
  if (tx.description) return humanizeRawName(tx.description);
  if (tx.featureName) return humanizeRawName(tx.featureName);
  if (tx.actionType) return humanizeRawName(tx.actionType);
  if (tx.transactionType) return humanizeRawName(tx.transactionType);
  return humanizeFeatureName(tx.featureKey, tx.featureName);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown time";

  const parsedDate = new Date(dateStr);
  if (Number.isNaN(parsedDate.getTime())) return "Unknown time";

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTokens(value: number | null | undefined): string {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(1)}M`;
  if (safeValue >= 1_000) return `${(safeValue / 1_000).toFixed(0)}K`;
  return safeValue.toLocaleString();
}

export default function UsageDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { workspaceRole, isLoading: accessLoading } = useWorkspaceAccess();
  const { balance: liveBalance, isUnlimited, daysUntilReset } = useTokenMonitor();
  const [txPage, setTxPage] = useState(0);
  const txLimit = 15;

  const {
    data: balance,
    isError: balanceIsError,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery<CreditBalance>({
    queryKey: ["/api/usage/tokens"],
    enabled: isAuthenticated,
  });

  const {
    data: usage,
    isError: usageIsError,
    error: usageError,
    refetch: refetchUsage,
  } = useQuery<CreditUsageBreakdown[]>({
    queryKey: ["/api/usage/token-breakdown"],
    enabled: isAuthenticated,
  });

  const {
    data: transactions,
    isLoading: txLoading,
    isError: transactionsIsError,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/usage/token-log", { limit: txLimit, offset: txPage * txLimit }],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated || accessLoading) {
    return <ResponsiveLoading message="Loading Usage Dashboard..." />;
  }

  if (workspaceRole !== "org_owner" && workspaceRole !== "co_owner") {
    const accessDeniedConfig: CanvasPageConfig = {
      id: "usage-dashboard-denied",
      title: "Access Denied",
      subtitle: "",
      category: "error",
    };

    return (
      <CanvasHubPage config={accessDeniedConfig}>
        <div className="flex items-center justify-center h-full">
          <Alert variant="destructive" className="max-w-md" data-testid="alert-permission-denied">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Only organization owners and administrators can view usage data.
            </AlertDescription>
          </Alert>
        </div>
      </CanvasHubPage>
    );
  }

  if (balanceIsError || usageIsError || transactionsIsError) {
    const dashboardError = balanceError || usageError || transactionsError;
    return (
      <CanvasHubPage
        config={{
          id: "usage-dashboard",
          title: "Usage Dashboard",
          subtitle: "Monitor your monthly AI token usage and allowance",
          category: "admin",
        }}
      >
        <DashboardLoadError
          message={
            dashboardError instanceof Error
              ? dashboardError.message
              : "Usage data could not be loaded"
          }
          onRetry={() => {
            void Promise.allSettled([
              refetchBalance(),
              refetchUsage(),
              refetchTransactions(),
            ]);
          }}
        />
      </CanvasHubPage>
    );
  }

  const effectiveBalance = liveBalance || balance;
  const isUnlimitedUser = isUnlimited || effectiveBalance?.unlimited === true;
  const tokensUsed = effectiveBalance?.tokensUsed ?? effectiveBalance?.creditsUsedThisPeriod ?? 0;
  const tokensAllowance =
    effectiveBalance?.tokensAllowance ??
    (effectiveBalance?.monthlyAllocation !== -1 ? effectiveBalance?.monthlyAllocation : null) ??
    null;
  const usagePercent =
    !isUnlimitedUser && tokensAllowance ? Math.min(100, (tokensUsed / tokensAllowance) * 100) : 0;

  const pageConfig: CanvasPageConfig = {
    id: "usage-dashboard",
    title: "Usage Dashboard",
    subtitle: "Monitor your monthly AI token usage and allowance",
    category: "admin",
  };

  return (
    <CanvasHubPage config={pageConfig}>
      <div className="space-y-6" data-testid="page-usage-dashboard">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    {isUnlimitedUser ? "Unlimited plan" : tokensUsed > 0 ? "Usage active this period" : "Quiet billing period"}
                  </Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">AI usage is being tracked live</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This page is most helpful when it explains whether your workspace is actively spending tokens, waiting on real usage, or approaching overage. Sparse periods should feel calm, not broken.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracked actions</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{usage?.length ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Categories using tokens</p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent events</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{transactions?.length ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Rows in the current log page</p>
                </div>
                <div className="rounded-lg border border-border/80 bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Next move</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {tokensUsed > 0 ? "Review high-cost actions below" : "Run Trinity or automation flows to start generating usage"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-subscription-tier">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscription Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge data-testid="badge-tier">
                {(effectiveBalance?.subscriptionTier || "standard").toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          <Card data-testid="card-current-balance">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Tokens Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUnlimitedUser ? (
                <div className="text-2xl font-bold text-foreground" data-testid="text-balance">
                  Unlimited
                </div>
              ) : (
                <div className="text-2xl font-bold text-foreground" data-testid="text-balance">
                  {formatTokens(tokensUsed)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isUnlimitedUser
                  ? "Tracked monthly for review"
                  : tokensAllowance
                    ? `of ${formatTokens(tokensAllowance)} monthly allowance`
                    : "this billing period"}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-credits-spent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Overage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-spent">
                {formatTokens(effectiveBalance?.overageTokens ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(effectiveBalance?.overageAmountCents ?? 0) > 0
                  ? `~$${((effectiveBalance?.overageAmountCents ?? 0) / 100).toFixed(2)} billed at month-end`
                  : "No overage this period"}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-reset-info">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Period Resets In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-reset-days">
                {daysUntilReset} days
              </div>
              <p className="text-xs text-muted-foreground mt-1">Monthly usage period</p>
            </CardContent>
          </Card>
        </div>

        {!isUnlimitedUser && tokensAllowance && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium">Monthly Token Usage</span>
                <span className="text-sm text-muted-foreground">{Math.round(usagePercent)}% used</span>
              </div>
              <Progress value={usagePercent} className="h-2" data-testid="progress-monthly-usage" />
              <div className="flex items-center justify-between gap-1 mt-2 text-xs text-muted-foreground">
                <span>{formatTokens(tokensUsed)} used</span>
                <span>{formatTokens(tokensAllowance)} allowance</span>
              </div>
            </CardContent>
          </Card>
        )}

        {usage && usage.length > 0 ? (
          <Card data-testid="card-ai-usage">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Token Usage by Action
                  </CardTitle>
                  <CardDescription>How your token usage is distributed this month</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usage.map((item) => {
                  const itemTokens = item.tokensUsed ?? item.totalCredits ?? 0;
                  const total = usage.reduce((sum, usageItem) => {
                    return sum + (usageItem.tokensUsed ?? usageItem.totalCredits ?? 0);
                  }, 0);
                  const pct = total > 0 ? (itemTokens / total) * 100 : 0;

                  return (
                    <div key={item.featureKey} data-testid={`row-feature-${item.featureKey}`}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {humanizeFeatureName(item.featureKey, item.featureName)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTokens(itemTokens)} tokens · {item.operationCount ?? 0} calls
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-ai-usage-empty">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Token Usage by Action
              </CardTitle>
              <CardDescription>No token-heavy workflows have reported usage yet this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-5 text-sm">
                <p className="font-medium text-foreground">No usage breakdown yet</p>
                <p className="mt-1 text-muted-foreground">
                  Once Trinity, scheduling, billing, or AI-assisted workflows start running, their token footprint will appear here with a clear per-action breakdown.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-recent-transactions">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Token Usage
                </CardTitle>
                <CardDescription>Latest AI token consumption events</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={txPage === 0}
                  onClick={() => setTxPage((page) => Math.max(0, page - 1))}
                  data-testid="button-tx-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Page {txPage + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!transactions || transactions.length < txLimit}
                  onClick={() => setTxPage((page) => page + 1)}
                  data-testid="button-tx-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-12 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-center text-muted-foreground">
                <History className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm font-medium text-foreground">No token usage recorded yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The usage log will populate after real AI actions run. This is normal for a new tenant or a quiet billing period.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx) => {
                  const txTokens = tx.tokensUsed ?? tx.amount ?? 0;

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-md hover-elevate"
                      data-testid={`row-tx-${tx.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {humanizeTransactionDescription(tx)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                      <span className="text-sm font-mono font-medium text-foreground flex-shrink-0">
                        +{formatTokens(txTokens)} tokens
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Alert data-testid="alert-info">
          <Cpu className="h-4 w-4" />
          <AlertTitle>About AI Tokens</AlertTitle>
          <AlertDescription>
            Tokens are the unit of AI computation. Every Trinity action, scheduling optimization,
            payroll analysis, and automation consumes tokens. Your plan includes a monthly token
            allowance. Usage above your allowance is tracked and billed at $2.00 per 100,000
            tokens at month-end.
          </AlertDescription>
        </Alert>
      </div>
    </CanvasHubPage>
  );
}
