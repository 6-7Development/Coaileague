import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * EmployeeBlockingBanner
 * ======================
 * Surfaces work-eligibility blockers on the employee dashboard so the
 * employee actually sees WHY their schedule is empty / shifts are
 * un-claimable. Reads /api/employee-onboarding/me; if the employee's
 * onboarding is incomplete OR they're blocked from work eligibility, we
 * render an actionable banner with deep-links to the missing artifacts.
 *
 * Render at the top of WorkerDashboard / ContractorDashboard.
 */

interface OnboardingMe {
  completionPercentage?: number;
  isWorkEligible?: boolean;
  blockingReason?: string | null;
  missingCritical?: string[];
}

export function EmployeeBlockingBanner(): JSX.Element | null {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<OnboardingMe>({
    queryKey: ["/api/employee-onboarding/me"],
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) return null;

  const incomplete = (data.completionPercentage ?? 100) < 100;
  const blocked = data.isWorkEligible === false;
  if (!incomplete && !blocked) return null;

  const missing = data.missingCritical || [];

  return (
    <div
      className="mb-4 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3"
      data-testid="banner-employee-blocking"
    >
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          {blocked ? "You can't accept shifts yet" : "Finish your onboarding"}
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-200/90">
          {data.blockingReason ||
            (blocked
              ? "Critical onboarding documents are missing. Complete them to become work-eligible."
              : `You're ${data.completionPercentage ?? 0}% done with onboarding.`)}
        </p>
        {missing.length > 0 && (
          <ul className="text-xs text-amber-800/80 dark:text-amber-200/80 list-disc list-inside">
            {missing.slice(0, 5).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/40 text-amber-900 dark:text-amber-100"
        onClick={() => setLocation("/employee-portal#onboarding")}
        data-testid="button-fix-blocking"
      >
        Fix it <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}
