/**
 * Admin Ticket Reviews Dashboard
 * For training and quality assurance
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Calendar, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasHubPage, type CanvasPageConfig } from "@/components/canvas-hub";
import { DashboardLoadError } from "@/components/dashboard/DashboardLoadError";
import type { ChatConversation } from "@shared/schema";

export default function AdminTicketReviews() {
  const { data: reviews, isLoading, isError, error, refetch } = useQuery<ChatConversation[]>({
    queryKey: ['/api/helpdesk/reviews'],
  });

  const pageConfig: CanvasPageConfig = {
    id: 'admin-ticket-reviews',
    title: 'Support Ticket Reviews',
    subtitle: 'Quality assurance and training material from closed tickets',
    category: 'admin',
  };

  if (isError) {
    return (
      <CanvasHubPage config={pageConfig}>
        <DashboardLoadError
          message={error instanceof Error ? error.message : "We couldn't load closed ticket feedback right now."}
          onRetry={() => void refetch()}
        />
      </CanvasHubPage>
    );
  }

  if (isLoading) {
    return (
      <CanvasHubPage config={pageConfig}>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            We're gathering closed ticket feedback and QA signals for the support team.
          </CardContent>
        </Card>
      </CanvasHubPage>
    );
  }

  const reviewsWithRating = reviews?.filter(r => r.rating !== null) || [];
  const avgRating = reviewsWithRating.length > 0
    ? (reviewsWithRating.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsWithRating.length).toFixed(1)
    : "N/A";

  return (
    <CanvasHubPage config={pageConfig}>
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="font-semibold">Review queue health</p>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Closed ticket reviews help support leads coach quality, confirm resolution tone, and catch recurring service gaps. A quiet queue can be normal if few tickets have been rated yet.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[28rem]">
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rated tickets</p>
                <p className="mt-1 text-sm font-medium">{reviewsWithRating.length}</p>
              </div>
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Average rating</p>
                <p className="mt-1 text-sm font-medium">{avgRating}</p>
              </div>
              <div className="rounded-lg border bg-background/80 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Unrated tickets</p>
                <p className="mt-1 text-sm font-medium">{Math.max((reviews?.length ?? 0) - reviewsWithRating.length, 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Card>
          <CardContent className="p-3 sm:pt-4 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold truncate">{reviewsWithRating.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-4 sm:px-6">
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-2xl font-bold truncate">{avgRating}</span>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400 shrink-0" />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Avg Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-4 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold truncate">
              {reviewsWithRating.filter(r => r.rating === 5).length}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">5-Star</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>All Closed Tickets with Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] sm:h-[600px]">
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="hover-elevate" data-testid={`review-${review.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{review.customerName || 'Anonymous'}</span>
                        </div>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating!
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">{review.closedAt ? new Date(review.closedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <Badge variant={review.status === 'closed' ? 'secondary' : 'default'}>
                          {review.status}
                        </Badge>
                      </div>

                      {review.feedback && (
                        <div className="bg-muted/50 rounded-md p-3 mt-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{review.feedback}</p>
                          </div>
                        </div>
                      )}

                      {!review.rating && (
                        <p className="text-sm text-muted-foreground italic">
                          No rating or feedback provided
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No reviewed tickets yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Once support conversations are closed and rated, they'll appear here for coaching and QA review.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </CanvasHubPage>
  );
}
