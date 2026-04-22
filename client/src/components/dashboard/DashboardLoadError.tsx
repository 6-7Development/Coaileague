import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLoadErrorProps {
  message?: string;
  onRetry: () => void;
}

export function DashboardLoadError({
  message = "An unexpected error occurred",
  onRetry,
}: DashboardLoadErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-6">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
