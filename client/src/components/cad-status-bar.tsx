import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface StatusIndicator {
  label: string;
  value: string | number;
  status?: "success" | "warning" | "error" | "info";
  testId?: string;
}

export function CADStatusBar() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { data: workspace } = useQuery<{ name: string; subscriptionTier: string }>({
    queryKey: ["/api/workspaces/current"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{
    activeEmployees: number;
    clockedIn: number;
    conflicts: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const indicators: StatusIndicator[] = [
    {
      label: "Workspace",
      value: workspace?.name || "Loading...",
      testId: "status-workspace",
    },
    {
      label: "Active",
      value: stats?.activeEmployees || 0,
      status: (stats?.activeEmployees || 0) > 0 ? "success" : undefined,
      testId: "status-active",
    },
    {
      label: "Clocked In",
      value: stats?.clockedIn || 0,
      status: (stats?.clockedIn || 0) > 0 ? "info" : undefined,
      testId: "status-clocked-in",
    },
    {
      label: "Conflicts",
      value: stats?.conflicts || 0,
      status: (stats?.conflicts || 0) > 0 ? "error" : "success",
      testId: "status-conflicts",
    },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "text-[hsl(var(--cad-green))]";
      case "warning":
        return "text-[hsl(var(--cad-orange))]";
      case "error":
        return "text-[hsl(var(--cad-red))]";
      case "info":
        return "text-[hsl(var(--cad-cyan))]";
      default:
        return "text-[hsl(var(--cad-text-secondary))]";
    }
  };

  return (
    <div className="hidden lg:flex h-8 bg-[hsl(var(--cad-chrome))] border-t border-[hsl(var(--cad-border))] items-center px-3 gap-6 text-xs font-medium">
      {/* Left section - Workspace info */}
      <div className="flex items-center gap-6">
        {indicators.map((indicator) => (
          <div
            key={indicator.label}
            className="flex items-center gap-2"
            data-testid={indicator.testId}
          >
            {indicator.status && (
              <div
                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(indicator.status)}`}
              />
            )}
            <span className="text-[hsl(var(--cad-text-tertiary))]">
              {indicator.label}:
            </span>
            <span className={indicator.status ? getStatusColor(indicator.status) : ""}>
              {indicator.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/* Right section - System status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2" data-testid="status-connection">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--cad-green))]" />
          <span className="text-[hsl(var(--cad-text-tertiary))]">Server:</span>
          <span>Connected</span>
        </div>

        <div className="text-[hsl(var(--cad-text-secondary))] font-mono" data-testid="status-clock">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
