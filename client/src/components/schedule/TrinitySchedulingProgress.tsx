import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2, Loader2, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTrinitySchedulingProgress, type SchedulingProgressStep } from '@/hooks/use-trinity-scheduling-progress';

interface TrinitySchedulingProgressProps {
  workspaceId?: string;
}

function ProgressItem({ progress }: { progress: SchedulingProgressStep }) {
  const stepIcons = {
    analyzing: <Loader2 className="h-4 w-4 animate-spin text-purple-500" />,
    matching: <Bot className="h-4 w-4 animate-pulse text-blue-500" />,
    assigning: <UserCheck className="h-4 w-4 text-teal-500" />,
    complete: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    no_match: <AlertCircle className="h-4 w-4 text-orange-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  const stepColors = {
    analyzing: 'bg-purple-500',
    matching: 'bg-blue-500',
    assigning: 'bg-teal-500',
    complete: 'bg-green-500',
    no_match: 'bg-orange-500',
    error: 'bg-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-3 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-teal-50/50 dark:from-purple-900/20 dark:to-teal-900/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {progress.step !== 'complete' && progress.step !== 'no_match' && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {stepIcons[progress.step]}
              <span className="text-sm font-medium truncate">{progress.message}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Progress 
                value={progress.progress} 
                className="h-1.5 flex-1"
              />
              <Badge variant="outline" size="sm" className="text-xs">
                {progress.progress}%
              </Badge>
            </div>
            
            {progress.assignedEmployee && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <UserCheck className="h-3 w-3 text-teal-500" />
                <span>{progress.assignedEmployee.name}</span>
                <Badge variant="secondary" size="sm">
                  Score: {progress.assignedEmployee.score.toFixed(0)}
                </Badge>
              </motion.div>
            )}
            
            {progress.businessMetrics && progress.step === 'complete' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center gap-3 text-xs"
              >
                <span className="text-green-600 dark:text-green-400">
                  +${progress.businessMetrics.totalProfit.toFixed(2)} profit
                </span>
                <span className="text-muted-foreground">
                  {(progress.businessMetrics.avgProfitMargin * 100).toFixed(0)}% margin
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function TrinitySchedulingProgress({ workspaceId }: TrinitySchedulingProgressProps) {
  const { activeProgress, hasActiveProgress } = useTrinitySchedulingProgress(workspaceId);

  if (!hasActiveProgress) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      <AnimatePresence mode="popLayout">
        {activeProgress.map((progress) => (
          <ProgressItem key={progress.shiftId} progress={progress} />
        ))}
      </AnimatePresence>
    </div>
  );
}
