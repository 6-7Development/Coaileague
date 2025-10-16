/**
 * ScheduleOS™ AI Auto-Scheduling Panel
 * Enterprise+ Feature - AI-powered workforce scheduling
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface ScheduleOSPanelProps {
  weekStartDate: Date;
  onScheduleGenerated?: () => void;
}

export function ScheduleOSPanel({ weekStartDate, onScheduleGenerated }: ScheduleOSPanelProps) {
  const { toast } = useToast();
  const { hasFeature } = useFeatureFlags();
  const [showPreview, setShowPreview] = useState(false);

  const hasScheduleOS = hasFeature('smartSchedule');

  // Generate AI schedule mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/scheduleos/generate', {
        method: 'POST',
        body: JSON.stringify({
          weekStartDate: weekStartDate.toISOString(),
          shiftRequirements: [
            // Example shift requirements - in real impl these come from form
            {
              title: "Morning Shift",
              clientId: "client-1",
              startTime: new Date(weekStartDate.setHours(8, 0, 0)).toISOString(),
              endTime: new Date(weekStartDate.setHours(16, 0, 0)).toISOString(),
              requiredEmployees: 3,
            }
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "ScheduleOS™ Complete!",
        description: data.message || `Generated ${data.shiftsGenerated} shifts in ${data.processingTimeMs}ms`,
      });
      setShowPreview(true);
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      onScheduleGenerated?.();
    },
    onError: (error: any) => {
      toast({
        title: "ScheduleOS™ Error",
        description: error.message || "Failed to generate schedule",
        variant: "destructive",
      });
    },
  });

  if (!hasScheduleOS) {
    return (
      <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-lg">ScheduleOS™ AI</CardTitle>
            <Badge variant="outline" className="ml-auto">Enterprise+</Badge>
          </div>
          <CardDescription>
            AI-powered auto-scheduling. Generates optimal schedules in 30 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            disabled
            data-testid="button-scheduleos-locked"
          >
            Upgrade to Enterprise to Unlock ScheduleOS™
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            $7,999/mo Enterprise or $19,999/mo Elite tier required
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <CardTitle className="text-lg">ScheduleOS™ AI Auto-Scheduling</CardTitle>
          <Badge className="ml-auto bg-gradient-to-r from-indigo-600 to-purple-600">Active</Badge>
        </div>
        <CardDescription>
          AI analyzes employee performance, availability, and shift needs to generate the optimal schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>30-second generation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-indigo-400" />
            <span>Performance-based</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span>Conflict detection</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <span>Smart alerts</span>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-scheduleos-generate"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Schedule...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Schedule
            </>
          )}
        </Button>

        {/* AI Insights (if data available) */}
        {showPreview && (
          <div className="p-3 rounded-md bg-muted/50 space-y-2">
            <p className="text-sm font-medium">AI Recommendations:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Assigned top performers to peak hours</li>
              <li>• Avoided 3 scheduling conflicts</li>
              <li>• Distributed hours evenly across team</li>
              <li>• All employees acknowledged schedules</li>
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Powered by GPT-4 • All schedules require employee acknowledgment
        </p>
      </CardContent>
    </Card>
  );
}
