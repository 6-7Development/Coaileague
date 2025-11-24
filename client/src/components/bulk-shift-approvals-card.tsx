import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckSquare, AlertCircle, Loader2, X } from "lucide-react";

interface BulkShiftApprovalsCardProps {
  selectedCount: number;
  onApproveAll: () => void;
  onClearSelection: () => void;
  isPending: boolean;
}

export function BulkShiftApprovalsCard({
  selectedCount,
  onApproveAll,
  onClearSelection,
  isPending,
}: BulkShiftApprovalsCardProps) {
  return (
    <Alert className="bg-blue-50 border-blue-200 text-blue-900">
      <CheckSquare className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? 'action' : 'actions'} selected for bulk approval
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isPending}
            data-testid="button-clear-selection"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={onApproveAll}
            disabled={isPending}
            data-testid="button-bulk-approve-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-1" />
                Approve All
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
