import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, Suspense, lazy } from "react";
import { TrinityArrowMark } from "@/components/trinity-logo";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceAccess } from "@/hooks/useWorkspaceAccess";
import { useLocation } from "wouter";
import { DashboardLoadError } from "@/components/dashboard/DashboardLoadError";
import { EmployeeBlockingBanner } from "@/components/onboarding/employee-blocking-banner";

// Platform role dashboards (lazy-loaded)
const RootAdminDashboard     = lazy(() => import("./dashboards/RootAdminDashboard"));
const DeputyAdminDashboard   = lazy(() => import("./dashboards/DeputyAdminDashboard"));
const SupportManagerDashboard = lazy(() => import("./dashboards/SupportManagerDashboard"));
const SupportAgentDashboard  = lazy(() => import("./dashboards/SupportAgentDashboard"));
const SysopDashboard         = lazy(() => import("./dashboards/SysopDashboard"));
const ComplianceOfficerDashboard = lazy(() => import("./dashboards/ComplianceOfficerDashboard"));

// Workspace role dashboards (lazy-loaded)
const OrgOwnerDashboard   = lazy(() => import("./dashboards/OrgOwnerDashboard"));
const OrgManagerDashboard = lazy(() => import("./dashboards/OrgManagerDashboard"));
const ManagerDashboard    = lazy(() => import("./dashboards/ManagerDashboard"));
const SupervisorDashboard = lazy(() => import("./dashboards/SupervisorDashboard"));
const WorkerDashboard     = lazy(() => import("./dashboards/WorkerDashboard"));
const ContractorDashboard = lazy(() => import("./dashboards/ContractorDashboard"));
const AuditorDashboard    = lazy(() => import("./dashboards/AuditorDashboard"));

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4">
      <Suspense fallback={<div className="w-20 h-20" />}>
        <TrinityArrowMark size={80} />
      </Suspense>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Loading your dashboard</p>
        <p className="text-xs text-muted-foreground">
          We are checking your workspace access, role, and starting view.
        </p>
      </div>
    </div>
  );
}

function selectDashboard(
  isPlatformStaff: boolean,
  platformRole: string,
  workspaceRole: string,
): React.ComponentType {
  if (isPlatformStaff) {
    switch (platformRole) {
      case "root_admin":          return RootAdminDashboard;
      case "deputy_admin":        return DeputyAdminDashboard;
      case "support_manager":     return SupportManagerDashboard;
      case "support_agent":       return SupportAgentDashboard;
      case "sysop":               return SysopDashboard;
      case "compliance_officer":  return ComplianceOfficerDashboard;
      default:                    return SupportAgentDashboard;
    }
  }

  switch (workspaceRole) {
    case "org_owner":
    case "co_owner":              return OrgOwnerDashboard;
    case "org_admin":
    case "org_manager":           return OrgManagerDashboard;
    case "manager":
    case "department_manager":    return ManagerDashboard;
    case "supervisor":
    case "shift_leader":          return SupervisorDashboard;
    case "auditor":               return AuditorDashboard;
    case "contractor":            return ContractorDashboard;
    default:                      return WorkerDashboard;
  }
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const {
    workspaceRole,
    isPlatformStaff,
    platformRole,
    isLoading: accessLoading,
    error: accessError,
  } = useWorkspaceAccess();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
    if (!isLoading && isAuthenticated && user && !user.currentWorkspaceId) {
      setLocation("/onboarding/start");
    }
    // Resume mid-onboarding tenants. /api/auth/me now returns
    // user.onboardingState; if the workspace exists but onboarding isn't
    // fully complete, route the org owner to the next incomplete step
    // instead of dropping them into a half-configured dashboard. Other
    // roles see the OnboardingProgressBanner instead — they don't own the
    // setup, so we don't force them to the wizard.
    const isOwnerLike = (workspaceRole || "") === "org_owner" || (workspaceRole || "") === "co_owner";
    const onboardingState = (user as any)?.onboardingState;
    if (
      !isLoading &&
      isAuthenticated &&
      isOwnerLike &&
      onboardingState &&
      onboardingState.fullyComplete === false &&
      typeof window !== "undefined" &&
      window.location.pathname === "/dashboard" &&
      !window.location.search.includes("welcome=trinity_unlocked") &&
      !window.location.search.includes("skipResume=1")
    ) {
      const nextKey = (onboardingState.requiredKeys || []).find?.(
        (k: string) => onboardingState.stepsCompleted?.[k] !== true,
      );
      setLocation(nextKey ? `/onboarding-tasks?focus=${nextKey}` : "/onboarding-tasks");
    }
  }, [isAuthenticated, isLoading, user, workspaceRole, setLocation]);

  if (isLoading || !isAuthenticated) {
    return <LoadingSpinner />;
  }

  if (accessLoading) {
    return <LoadingSpinner />;
  }

  if (accessError) {
    return (
      <div className="p-6">
        <DashboardLoadError
          message={accessError instanceof Error ? accessError.message : "Failed to load workspace access"}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const DashboardComponent = selectDashboard(
    isPlatformStaff,
    platformRole ?? "none",
    workspaceRole,
  );

  // Surface work-eligibility blockers for worker-class roles. Managers /
  // owners / admins shouldn't see this — they're not the ones with
  // missing personal documents.
  const showEmployeeBanner =
    !isPlatformStaff &&
    (workspaceRole === "" ||
      workspaceRole === "employee" ||
      workspaceRole === "staff" ||
      workspaceRole === "contractor");

  return (
    <ErrorBoundary componentName="Dashboard">
      <Suspense fallback={<LoadingSpinner />}>
        <>
          {showEmployeeBanner && (
            <div className="px-4 pt-4">
              <EmployeeBlockingBanner />
            </div>
          )}
          <DashboardComponent />
        </>
      </Suspense>
    </ErrorBoundary>
  );
}
