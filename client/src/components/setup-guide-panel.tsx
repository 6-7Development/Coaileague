import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Circle,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Building2,
  CreditCard,
  Users,
  Settings,
  Calendar,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTrinityContext } from "@/hooks/use-trinity-context";
import { Link } from "wouter";

interface SetupTask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  href?: string;
  requiredRole?: string;
  points?: number;
}

interface SetupSection {
  id: string;
  title: string;
  icon: keyof typeof sectionIcons;
  tasks: SetupTask[];
  trinityTip?: string;
}

interface SetupGuideData {
  sections: SetupSection[];
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  trinityGreeting?: string;
}

const sectionIcons = {
  organization: Building2,
  billing: CreditCard,
  team: Users,
  settings: Settings,
  scheduling: Calendar,
  compliance: Shield,
  automation: Zap,
} as const;

function getIconForSection(iconKey: keyof typeof sectionIcons) {
  return sectionIcons[iconKey] || Settings;
}

interface SetupGuidePanelProps {
  className?: string;
  defaultExpanded?: boolean;
  onClose?: () => void;
}

export function SetupGuidePanel({
  className,
  defaultExpanded = true,
  onClose,
}: SetupGuidePanelProps) {
  const [isMinimized, setIsMinimized] = useState(!defaultExpanded);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { user } = useAuth();
  const workspaceId = (user as any)?.activeWorkspaceId || (user as any)?.workspaceId;
  const { context: trinityContext } = useTrinityContext(workspaceId);

  const { data: guideData, isLoading } = useQuery<SetupGuideData>({
    queryKey: ["/api/onboarding/setup-guide"],
    enabled: !!workspaceId && !!user,
    staleTime: 30000,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("POST", `/api/onboarding/complete-task/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/setup-guide"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trinity/context"] });
    },
  });

  if (isLoading) {
    return (
      <Card className={cn("w-80 shadow-lg", className)} data-testid="setup-guide-loading">
        <CardHeader className="py-3 px-4">
          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="py-2 px-4">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!guideData || guideData.completionPercent >= 100) {
    return null;
  }

  const incompleteSections = guideData.sections.filter(
    (s) => s.tasks.some((t) => !t.isCompleted)
  );

  if (incompleteSections.length === 0) {
    return null;
  }

  if (isMinimized) {
    return (
      <Card
        className={cn(
          "w-80 shadow-lg cursor-pointer hover-elevate transition-all",
          className
        )}
        onClick={() => setIsMinimized(false)}
        data-testid="setup-guide-minimized"
      >
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Setup guide</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {guideData.completedTasks}/{guideData.totalTasks}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              data-testid="button-expand-guide"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                data-testid="button-close-guide"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn("w-80 shadow-lg max-h-[70vh] flex flex-col", className)}
      data-testid="setup-guide-panel"
    >
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b shrink-0">
        <CardTitle className="text-sm font-medium">Setup guide</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
            data-testid="button-minimize-guide"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
              data-testid="button-close-guide"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-0 px-0 overflow-y-auto flex-1">
        {trinityContext?.trinityMode === "guru" && guideData.trinityGreeting && (
          <div className="px-4 py-2 bg-primary/5 border-b text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>{guideData.trinityGreeting}</span>
          </div>
        )}

        <Accordion
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="w-full"
        >
          {guideData.sections.map((section) => {
            const completedCount = section.tasks.filter((t) => t.isCompleted).length;
            const totalCount = section.tasks.length;
            const isFullyComplete = completedCount === totalCount;
            const SectionIcon = getIconForSection(section.icon);

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border-b last:border-b-0"
                data-testid={`setup-section-${section.id}`}
              >
                <AccordionTrigger
                  className={cn(
                    "px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm",
                    isFullyComplete && "text-muted-foreground"
                  )}
                  data-testid={`trigger-section-${section.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <SectionIcon className={cn(
                      "h-4 w-4 shrink-0",
                      isFullyComplete ? "text-green-500" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "font-medium text-left",
                      isFullyComplete && "line-through"
                    )}>
                      {section.title}
                    </span>
                    {!isFullyComplete && (
                      <Badge variant="secondary" className="ml-auto mr-2 text-[10px] px-1.5 py-0">
                        {completedCount}/{totalCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-0">
                  {section.trinityTip && trinityContext?.trinityMode === "guru" && (
                    <div className="mx-4 mb-2 p-2 rounded bg-primary/5 text-xs text-muted-foreground flex items-start gap-2">
                      <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <span>{section.trinityTip}</span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {section.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onComplete={() => completeTaskMutation.mutate(task.id)}
                        isCompleting={completeTaskMutation.isPending}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function TaskItem({
  task,
  onComplete,
  isCompleting,
}: {
  task: SetupTask;
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/30 transition-colors cursor-pointer",
        task.isCompleted && "opacity-60"
      )}
      onClick={() => !task.isCompleted && !isCompleting && onComplete()}
      data-testid={`task-item-${task.id}`}
    >
      {task.isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span
        className={cn(
          "flex-1 text-left",
          task.isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
      {task.points && !task.isCompleted && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
          +{task.points}
        </Badge>
      )}
    </div>
  );

  if (task.href && !task.isCompleted) {
    return (
      <Link href={task.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default SetupGuidePanel;
