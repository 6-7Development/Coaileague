/**
 * TrinityBrainStatusPanel — Shows Trinity's live brain status
 * Displays active cognitive layers, last action, emotional state
 */
import { useQuery } from '@tanstack/react-query';
import { Brain, Zap, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';

export function TrinityBrainStatusPanel() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['/api/ai-brain/status'],
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
        </div>
      </div>
    );
  }

  const isActive   = data?.isActive ?? true;
  const lastAction = data?.lastAction ?? 'Monitoring workspace';
  const emotional  = data?.emotionalState ?? 'focused';
  const uptime     = data?.uptimeHours ?? 0;

  const layers = [
    { label: 'Limbic (emotional detection)', active: true },
    { label: 'ThoughtEngine (deliberation)', active: isActive },
    { label: 'Episodic memory', active: true },
    { label: 'Hebbian learning', active: isActive },
    { label: 'Org intelligence', active: true },
  ];

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3 trinity-insight-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Trinity Brain Status</span>
        </div>
        <StatusBadge
          variant={isActive ? 'success' : 'warning'}
          label={isActive ? 'Active' : 'Standby'}
          size="xs"
          pulse={isActive}
        />
      </div>

      <div className="space-y-1.5">
        {layers.map(layer => (
          <div key={layer.label} className="flex items-center gap-2">
            {layer.active
              ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              : <AlertCircle  className="w-3 h-3 text-muted-foreground shrink-0" />
            }
            <span className={`text-xs ${layer.active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {layer.label}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t pt-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-purple-400" />
          <span className="truncate">{lastAction}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" />
          <span>Emotional state: <span className="text-foreground capitalize">{emotional}</span></span>
        </div>
        {uptime > 0 && (
          <p className="text-[10px] text-muted-foreground">Uptime: {uptime}h</p>
        )}
      </div>
    </div>
  );
}
