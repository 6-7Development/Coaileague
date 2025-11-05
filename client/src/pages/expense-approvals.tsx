import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, DollarSign, Calendar, MapPin, FileText, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function ExpenseApprovalsPage() {
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses'],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return apiRequest(`/api/expenses/${id}/approve`, 'PATCH', { reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense approved successfully",
      });
      setReviewDialogOpen(false);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve expense",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest(`/api/expenses/${id}/reject`, 'PATCH', { reviewNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense rejected",
      });
      setReviewDialogOpen(false);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject expense",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiRequest(`/api/expenses/${id}/mark-paid`, 'PATCH', { paymentMethod: 'direct_deposit' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense marked as reimbursed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark expense as paid",
        variant: "destructive",
      });
    },
  });

  const handleReview = (expense: any, action: 'approve' | 'reject') => {
    setSelectedExpense(expense);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedExpense) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ id: selectedExpense.id, notes: reviewNotes });
    } else {
      if (!reviewNotes.trim()) {
        toast({
          title: "Error",
          description: "Please provide a reason for rejection",
          variant: "destructive",
        });
        return;
      }
      rejectMutation.mutate({ id: selectedExpense.id, notes: reviewNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'draft': 'secondary',
      'submitted': 'outline',
      'approved': 'default',
      'rejected': 'destructive',
      'reimbursed': 'default',
      'cancelled': 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const pendingExpenses = expenses.filter((e: any) => e.status === 'submitted');
  const approvedExpenses = expenses.filter((e: any) => e.status === 'approved');
  const reimbursedExpenses = expenses.filter((e: any) => e.status === 'reimbursed');

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="page-expense-approvals">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="heading-expense-approvals">Expense Approvals</h1>
        <p className="text-muted-foreground">Review and approve employee expense reimbursements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="count-pending">{pendingExpenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved (Unpaid)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="count-approved">{approvedExpenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reimbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="count-reimbursed">
              ${reimbursedExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingExpenses.length})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved ({approvedExpenses.length})</TabsTrigger>
          <TabsTrigger value="reimbursed" data-testid="tab-reimbursed">Reimbursed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No pending expenses to review
              </CardContent>
            </Card>
          ) : (
            pendingExpenses.map((expense: any) => (
              <Card key={expense.id} data-testid={`card-expense-${expense.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{expense.description}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                        </span>
                        {expense.merchant && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {expense.merchant}
                          </span>
                        )}
                        {expense.mileageDistance && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {parseFloat(expense.mileageDistance).toFixed(1)} miles @ ${parseFloat(expense.mileageRate).toFixed(3)}/mi
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold" data-testid={`text-amount-${expense.id}`}>
                        ${parseFloat(expense.amount).toFixed(2)}
                      </div>
                      {getStatusBadge(expense.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleReview(expense, 'reject')}
                      data-testid={`button-reject-${expense.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleReview(expense, 'approve')}
                      data-testid={`button-approve-${expense.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedExpenses.map((expense: any) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{expense.description}</CardTitle>
                    <CardDescription>{format(new Date(expense.expenseDate), "MMM dd, yyyy")}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold">${parseFloat(expense.amount).toFixed(2)}</div>
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => markPaidMutation.mutate({ id: expense.id })}
                    disabled={markPaidMutation.isPending}
                    data-testid={`button-mark-paid-${expense.id}`}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mark as Reimbursed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reimbursed" className="space-y-4">
          {reimbursedExpenses.map((expense: any) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{expense.description}</CardTitle>
                    <CardDescription>{format(new Date(expense.expenseDate), "MMM dd, yyyy")}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-green-600">${parseFloat(expense.amount).toFixed(2)}</div>
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Expense
            </DialogTitle>
            <DialogDescription>
              {selectedExpense && (
                <div className="mt-2">
                  <div className="font-medium">{selectedExpense.description}</div>
                  <div className="text-2xl font-bold mt-1">${parseFloat(selectedExpense.amount).toFixed(2)}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {reviewAction === 'approve' ? 'Review Notes (Optional)' : 'Reason for Rejection'}
              </label>
              <Textarea
                placeholder={reviewAction === 'approve' ? 'Add any notes...' : 'Please explain why this expense is being rejected...'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-2"
                rows={4}
                data-testid="textarea-review-notes"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleSubmitReview}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                data-testid="button-submit-review"
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
