/**
 * AICreditBalancePanel — Shows token/credit usage for the workspace
 * Displays real data from /api/ai-brain/usage summary
 */
import { useQuery } from '@tanstack/react-query';
import { Cpu, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

interface Props {
  canRefresh?: boolean;
  showDashboardLinks?: boolean;
}

export function AICreditBalancePanel({ canRefresh = true, showDashboardLinks = true }: Props) {
  const [, setLocation] = useLocation();

  const { data, isLoading, refetch, isRefetching } = useQuery<any>({
    queryKey: ['/api/ai-brain/usage/summary'],
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  const tokensUsed   = data?.tokensUsed   ?? data?.totalTokens   ?? 0;
  const tokensLimit  = data?.tokensLimit  ?? data?.tokenLimit    ?? 100000;
  const pctUsed      = Math.min(100, Math.round((tokensUsed / Math.max(tokensLimit, 1)) * 100));
  const remaining    = tokensLimit - tokensUsed;

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">AI Credit Balance</span>
        </div>
        <div className="flex items-center gap-1">
          {canRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {showDashboardLinks && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setLocation('/ai-usage-dashboard')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-semibold tabular-nums">
            {remaining.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">tokens remaining</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pctUsed > 80 ? 'bg-red-500' : pctUsed > 60 ? 'bg-amber-500' : 'bg-purple-500'
            }`}
            style={{ width: `${pctUsed}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{pctUsed}% used</span>
          <span className="text-[10px] text-muted-foreground">
            {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()}
          </span>
        </div>
      </div>

      {pctUsed > 80 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <TrendingDown className="w-3 h-3" />
          Usage elevated — consider optimizing AI call frequency
        </div>
      )}
    </div>
  );
}
