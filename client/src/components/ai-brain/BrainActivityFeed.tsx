/**
 * BrainActivityFeed — Live stream of Trinity's recent actions
 * Shows what Trinity has done in the last hour across the workspace
 */
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

export function BrainActivityFeed() {
  const { data, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['/api/ai-brain/activity-feed'],
    refetchInterval: 15_000,
    initialData: [],
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-4 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  const entries = data ?? [];

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium">Brain Activity Feed</span>
        <span className="text-[10px] text-muted-foreground ml-auto">live</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Waiting for Trinity activity…</p>
        </div>
      ) : (
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-2">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`rounded-lg border p-2.5 text-xs ${
                  entry.status === 'success' ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' :
                  entry.status === 'error'   ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' :
                  'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{entry.action}</span>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="text-[10px]">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {entry.detail && (
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">{entry.detail}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
