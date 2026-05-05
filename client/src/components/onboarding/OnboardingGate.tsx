/**
 * OnboardingGate — blocks dashboard until mandatory setup is complete.
 * Wraps protected routes. If setup incomplete, shows SetupChecklist instead.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SetupChecklist from "@/pages/onboarding/SetupChecklist";

interface OnboardingStep {
  step_key: string;
  step_number: number;
  label: string;
  required: boolean;
  status: "pending" | "in_progress" | "completed" | "skipped";
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isOwnerOrAdmin = ["owner", "super_admin", "admin"].includes(
    (user as { role?: string })?.role || ""
  );

  const { data, isLoading } = useQuery<{ steps: OnboardingStep[]; complete: boolean }>({
    queryKey: ["/api/smart-onboarding/tenant"],
    enabled: isOwnerOrAdmin,
    staleTime: 30000,
  });

  // Non-owners always pass through
  if (!isOwnerOrAdmin) return <>{children}</>;
  if (isLoading) return <>{children}</>;

  // If all required steps complete → pass through
  const incomplete = (data?.steps || []).filter(
    s => s.required && s.status !== "completed" && s.status !== "skipped"
  );
  if (incomplete.length === 0) return <>{children}</>;

  // Show setup checklist instead of dashboard
  return <SetupChecklist steps={data?.steps || []} />;
}
