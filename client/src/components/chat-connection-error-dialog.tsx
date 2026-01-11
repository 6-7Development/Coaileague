import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface ChatConnectionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onReportBug: () => void;
  onGoHome: () => void;
  attemptCount?: number;
}

export function ChatConnectionErrorDialog({
  open,
  onOpenChange,
  onRetry,
  onReportBug,
  onGoHome,
  attemptCount = 5,
}: ChatConnectionErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Connection Failed
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Unable to connect to the chat server after {attemptCount} attempts. 
              This could be due to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Server maintenance or downtime</li>
              <li>Network connectivity issues</li>
              <li>Firewall or security settings</li>
            </ul>
            <p className="text-sm font-medium text-foreground mt-4">
              What would you like to do?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onReportBug}
            className="w-full sm:w-auto"
            data-testid="button-report-bug"
          >
            <Bug className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
          
          <Button
            variant="outline"
            onClick={onGoHome}
            className="w-full sm:w-auto"
            data-testid="button-go-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          
          <Button
            onClick={onRetry}
            className="w-full sm:w-auto bg-primary"
            data-testid="button-retry-connection"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
