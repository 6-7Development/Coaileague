import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, Clock, Calendar, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";

interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  requestType: string;
  totalDays: number | null;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export default function TimeOffApprovals() {
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['/api/time-off-requests/pending'],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ requestId, status, reviewNotes }: { requestId: string; status: string; reviewNotes?: string }) => {
      return await apiRequest(`/api/time-off-requests/${requestId}/status`, 'PUT', { status, reviewNotes });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-off-requests/pending'] });
      toast({
        title: variables.status === 'approved' ? "Request Approved" : "Request Denied",
        description: variables.status === 'approved'
          ? "The time-off request has been approved"
          : "The time-off request has been denied",
      });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: TimeOffRequest) => {
    statusMutation.mutate({ requestId: request.id, status: 'approved' });
  };

  const handleDeny = (request: TimeOffRequest) => {
    if (!reviewNotes.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for denying this request",
        variant: "destructive",
      });
      return;
    }
    statusMutation.mutate({ requestId: request.id, status: 'denied', reviewNotes: reviewNotes.trim() });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getRequestTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      vacation: { label: 'Vacation', variant: 'default' },
      sick: { label: 'Sick Leave', variant: 'secondary' },
      personal: { label: 'Personal', variant: 'outline' },
      unpaid: { label: 'Unpaid', variant: 'destructive' },
    };
    
    const config = typeMap[type] || { label: type, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = requests?.length || 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Time-Off Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve time-off requests from employees
        </p>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold" data-testid="text-pending-count">
              {pendingCount}
            </span>
            <span className="text-muted-foreground">
              {pendingCount === 1 ? 'request' : 'requests'} awaiting review
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {pendingCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              There are no pending time-off requests to review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop View */}
          <div className="hidden md:block space-y-4">
            {requests?.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                selected={selectedRequest?.id === request.id}
                onSelect={setSelectedRequest}
                onApprove={handleApprove}
                onDeny={() => setSelectedRequest(request)}
                reviewNotes={reviewNotes}
                setReviewNotes={setReviewNotes}
                handleDenySubmit={handleDeny}
                isProcessing={statusMutation.isPending}
                formatDate={formatDate}
                getRequestTypeBadge={getRequestTypeBadge}
              />
            ))}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {requests?.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {request.employeeName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Requested {format(new Date(request.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    {getRequestTypeBadge(request.requestType)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RequestCard
                    key={request.id}
                    request={request}
                    selected={selectedRequest?.id === request.id}
                    onSelect={setSelectedRequest}
                    onApprove={handleApprove}
                    onDeny={() => setSelectedRequest(request)}
                    reviewNotes={reviewNotes}
                    setReviewNotes={setReviewNotes}
                    handleDenySubmit={handleDeny}
                    isProcessing={statusMutation.isPending}
                    formatDate={formatDate}
                    getRequestTypeBadge={getRequestTypeBadge}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RequestCardProps {
  request: TimeOffRequest;
  selected: boolean;
  onSelect: (request: TimeOffRequest | null) => void;
  onApprove: (request: TimeOffRequest) => void;
  onDeny: () => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  handleDenySubmit: (request: TimeOffRequest) => void;
  isProcessing: boolean;
  formatDate: (dateString: string) => string;
  getRequestTypeBadge: (type: string) => JSX.Element;
}

function RequestCard({
  request,
  selected,
  onSelect,
  onApprove,
  onDeny,
  reviewNotes,
  setReviewNotes,
  handleDenySubmit,
  isProcessing,
  formatDate,
  getRequestTypeBadge,
}: RequestCardProps) {
  const calculateDays = () => {
    if (request.totalDays) return request.totalDays;
    try {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      return differenceInDays(end, start) + 1;
    } catch {
      return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {request.employeeName}
            </CardTitle>
            <CardDescription>
              Requested {format(new Date(request.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {getRequestTypeBadge(request.requestType)}
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Off Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Duration</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium" data-testid={`text-start-date-${request.id}`}>
                  {formatDate(request.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium" data-testid={`text-end-date-${request.id}`}>
                  {formatDate(request.endDate)}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Total Days</p>
                <p className="text-lg font-bold text-primary" data-testid={`text-total-days-${request.id}`}>
                  {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {(request.reason || request.notes) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  {request.reason && (
                    <div className="mb-3">
                      <p className="font-medium text-sm mb-1">Reason</p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                  )}
                  {request.notes && (
                    <div>
                      <p className="font-medium text-sm mb-1">Additional Notes</p>
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!selected ? (
          <div className="flex gap-2">
            <Button
              onClick={() => onApprove(request)}
              disabled={isProcessing}
              data-testid={`button-approve-${request.id}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={onDeny}
              disabled={isProcessing}
              data-testid={`button-deny-${request.id}`}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deny
            </Button>
          </div>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="review-notes">Reason for Denial</Label>
              <Textarea
                id="review-notes"
                placeholder="Explain why this request is being denied..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                data-testid="input-review-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDenySubmit(request)}
                disabled={isProcessing || !reviewNotes.trim()}
                data-testid="button-submit-denial"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Denying...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Confirm Denial
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onSelect(null);
                  setReviewNotes("");
                }}
                disabled={isProcessing}
                data-testid="button-cancel-denial"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
