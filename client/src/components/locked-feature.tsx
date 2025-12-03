import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Sparkles, ArrowRight, Gift } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { thoughtManager } from "@/lib/mascot/ThoughtManager";

interface OnboardingStatus {
  isCompleted: boolean;
  automationUnlocked: boolean;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  discountAvailable: boolean;
}

interface LockedFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  requiresOnboarding?: boolean;
  fallback?: React.ReactNode;
}

export function LockedFeature({
  children,
  featureName,
  description,
  requiresOnboarding = true,
  fallback,
}: LockedFeatureProps) {
  const { data: onboardingStatus, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ['/api/organization-onboarding/status'],
    select: (data: any) => ({
      isCompleted: data?.isCompleted ?? false,
      automationUnlocked: data?.automationUnlocked ?? false,
      completedSteps: Object.values(data?.steps || {}).filter(Boolean).length,
      totalSteps: 8,
      progressPercent: Math.round(
        (Object.values(data?.steps || {}).filter(Boolean).length / 8) * 100
      ),
      discountAvailable: data?.discountAvailable ?? false,
    }),
  });

  const isUnlocked = onboardingStatus?.automationUnlocked || onboardingStatus?.isCompleted;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <Card className="bg-muted/50">
          <CardContent className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requiresOnboarding || isUnlocked) {
    return <>{children}</>;
  }

  const handleUnlockClick = () => {
    thoughtManager.triggerAIInsight(
      `Complete your organization setup to unlock ${featureName}! You're ${onboardingStatus?.completedSteps || 0} of ${onboardingStatus?.totalSteps || 8} steps done.`,
      'high'
    );
  };

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card 
      className="relative overflow-hidden border-2 border-dashed border-muted-foreground/30"
      data-testid={`card-locked-feature-${featureName.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10" />
      
      <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4" data-testid="icon-locked">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h3 className="text-xl font-bold mb-2" data-testid="text-locked-title">{featureName} - Locked</h3>
          
          <p className="text-muted-foreground mb-4">
            {description || `Complete your organization setup to unlock ${featureName} and all automation features.`}
          </p>

          <div className="mb-4" data-testid="container-progress">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <Badge variant="outline" data-testid="badge-progress-count">
                {onboardingStatus?.completedSteps || 0}/{onboardingStatus?.totalSteps || 8}
              </Badge>
            </div>
            <Progress 
              value={onboardingStatus?.progressPercent || 0} 
              className="h-2 max-w-xs mx-auto"
              data-testid="progress-setup"
            />
          </div>

          {onboardingStatus?.discountAvailable && (
            <div className="flex items-center justify-center gap-2 mb-4 text-sm">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                10% discount waiting for you!
              </span>
            </div>
          )}

          <Link href="/dashboard">
            <Button 
              onClick={handleUnlockClick}
              className="group"
              data-testid="button-unlock-feature"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Complete Setup
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="pointer-events-none select-none opacity-20">
        {children}
      </div>
    </Card>
  );
}

export function useOnboardingStatus() {
  const { data, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ['/api/organization-onboarding/status'],
    select: (data: any) => ({
      isCompleted: data?.isCompleted ?? false,
      automationUnlocked: data?.automationUnlocked ?? false,
      completedSteps: Object.values(data?.steps || {}).filter(Boolean).length,
      totalSteps: 8,
      progressPercent: Math.round(
        (Object.values(data?.steps || {}).filter(Boolean).length / 8) * 100
      ),
      discountAvailable: data?.discountAvailable ?? false,
    }),
  });

  return {
    isCompleted: data?.isCompleted ?? false,
    automationUnlocked: data?.automationUnlocked ?? false,
    completedSteps: data?.completedSteps ?? 0,
    totalSteps: data?.totalSteps ?? 8,
    progressPercent: data?.progressPercent ?? 0,
    discountAvailable: data?.discountAvailable ?? false,
    isLoading,
  };
}
