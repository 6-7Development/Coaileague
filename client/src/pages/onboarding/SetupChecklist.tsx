/**
 * SetupChecklist — mandatory 5-step org setup before dashboard unlocks.
 * Shows when new org hasn't completed required configuration.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, ArrowRight, Shield, Hash, MapPin, DollarSign, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TrinityOrbitalAvatar } from "@/components/ui/trinity-animated-logo";

const US_STATES = [
  { code: "TX", name: "Texas" }, { code: "CA", name: "California" },
  { code: "FL", name: "Florida" }, { code: "NY", name: "New York" },
  { code: "NV", name: "Nevada" }, { code: "AZ", name: "Arizona" },
  { code: "CO", name: "Colorado" }, { code: "WA", name: "Washington" },
  { code: "GA", name: "Georgia" }, { code: "IL", name: "Illinois" },
  { code: "TX", name: "Texas" },
];

const STEP_META: Record<string, { icon: React.ElementType; hint: string; placeholder?: string }> = {
  state_selection: { icon: MapPin, hint: "The state where your company is licensed to operate.", placeholder: "e.g. Texas" },
  org_code:        { icon: Hash, hint: "A short unique code for your org (3–8 chars). Example: STATEWIDE, ACME, APEX. Officers and SARGE use this to identify your company.", placeholder: "e.g. STATEWIDE" },
  license_number:  { icon: Shield, hint: "Your state PSB/security company license number. Texas: C-xxxxxxx format.", placeholder: "e.g. C11608501" },
  overage_limits:  { icon: DollarSign, hint: "Maximum AI usage overage per month in dollars. Default $50. Prevents unexpected charges.", placeholder: "e.g. 50" },
  import_data:     { icon: Database, hint: "Optional: import officers from Excel, GetSling, or another system using Trinity's migration engine.", placeholder: "" },
};

interface SetupChecklistProps {
  steps: Array<{ step_key: string; step_number: number; label: string; required: boolean; status: string }>;
}

export default function SetupChecklist({ steps }: SetupChecklistProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedState, setSelectedState] = useState("");

  const completedCount = steps.filter(s => s.status === "completed" || s.status === "skipped").length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const complete = useMutation({
    mutationFn: async ({ stepKey, value }: { stepKey: string; value?: string }) => {
      return apiRequest("POST", `/api/smart-onboarding/tenant/steps/${stepKey}/complete`, { value });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/smart-onboarding/tenant"] });
      toast({ title: "Step complete!", description: "Moving to the next step." });
    },
    onError: () => toast({ title: "Error", description: "Could not complete step. Try again.", variant: "destructive" }),
  });

  const currentStep = steps.find(s => s.status === "pending" || s.status === "in_progress");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <TrinityOrbitalAvatar size={64} state="idle" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to CoAIleague</h1>
          <p className="text-muted-foreground text-sm">
            Complete your organization setup to unlock the full platform.
            SARGE is standing by to help once you're ready.
          </p>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{completedCount} of {steps.length} steps complete</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const meta = STEP_META[step.step_key] || { icon: Circle, hint: "" };
            const Icon = meta.icon;
            const isCurrent = step.step_key === currentStep?.step_key;
            const isDone = step.status === "completed" || step.status === "skipped";

            return (
              <Card key={step.step_key}
                className={`transition-all ${isCurrent ? "border-primary shadow-sm" : isDone ? "opacity-70" : "opacity-50"}`}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isDone
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : isCurrent
                      ? <Icon className="h-4 w-4 text-primary shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    {step.label}
                    {step.required && !isDone && (
                      <Badge variant="outline" className="text-[10px] ml-auto">Required</Badge>
                    )}
                    {!step.required && (
                      <Badge variant="secondary" className="text-[10px] ml-auto">Optional</Badge>
                    )}
                  </CardTitle>
                </CardHeader>

                {isCurrent && (
                  <CardContent className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>

                    {step.step_key === "state_selection" && (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                      >
                        <option value="">Select state...</option>
                        {US_STATES.map(s => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                      </select>
                    )}

                    {step.step_key !== "state_selection" && step.step_key !== "import_data" && (
                      <Input
                        placeholder={meta.placeholder}
                        value={values[step.step_key] || ""}
                        onChange={e => setValues(v => ({ ...v, [step.step_key]: e.target.value }))}
                        className="text-sm"
                      />
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={complete.isPending}
                        onClick={() => complete.mutate({
                          stepKey: step.step_key,
                          value: step.step_key === "state_selection"
                            ? selectedState
                            : values[step.step_key],
                        })}
                        className="gap-1.5"
                      >
                        {complete.isPending ? "Saving..." : "Complete Step"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      {!step.required && (
                        <Button size="sm" variant="ghost"
                          onClick={() => complete.mutate({ stepKey: step.step_key })}>
                          Skip
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
