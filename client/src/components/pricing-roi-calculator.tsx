import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PRICING_TIERS, calculateOverage, type SubscriptionTier } from "@/config/pricing";
import { Calculator, TrendingUp, DollarSign, Clock, Shield, Users } from "lucide-react";
import { useLocation } from "wouter";

interface ROIBreakdown {
  adminTimeSaved: number;
  timesheetFraudPrevented: number;
  profitOptimization: number;
  complianceProtection: number;
  totalSavings: number;
}

function calculateROI(employees: number, avgPayRate: number): ROIBreakdown {
  const monthlyPayroll = employees * avgPayRate * 160;
  const adminTimeSaved = 35 * 25;
  const timesheetFraudPrevented = monthlyPayroll * 0.03;
  const profitOptimization = monthlyPayroll * 1.15 * 0.02;
  const complianceProtection = 2000 / 12;
  
  return {
    adminTimeSaved,
    timesheetFraudPrevented: Math.round(timesheetFraudPrevented),
    profitOptimization: Math.round(profitOptimization),
    complianceProtection: Math.round(complianceProtection),
    totalSavings: Math.round(adminTimeSaved + timesheetFraudPrevented + profitOptimization + complianceProtection),
  };
}

function recommendTier(employees: number): SubscriptionTier {
  if (employees <= 20) return 'starter';
  if (employees <= 100) return 'professional';
  return 'enterprise';
}

export function PricingROICalculator() {
  const [, setLocation] = useLocation();
  const [employees, setEmployees] = useState(50);
  const [avgPayRate, setAvgPayRate] = useState(18);
  
  const recommendedTier = recommendTier(employees);
  const tierConfig = PRICING_TIERS[recommendedTier];
  const roi = calculateROI(employees, avgPayRate);
  
  const { overageEmployees, overageCharge } = calculateOverage(recommendedTier, employees);
  const basePrice = tierConfig.price || 3500;
  const totalCost = basePrice + overageCharge;
  const netSavings = roi.totalSavings - totalCost;
  const roiPercent = totalCost > 0 ? Math.round((netSavings / totalCost) * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/20">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calculator className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Calculate Your ROI</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">See how much Trinity AI can save your business</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Employees
              </Label>
              <Badge variant="secondary" className="text-lg font-bold">{employees}</Badge>
            </div>
            <Slider
              value={[employees]}
              onValueChange={([v]) => setEmployees(v)}
              min={5}
              max={200}
              step={5}
              className="w-full"
              data-testid="slider-employees"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>200+</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Average Hourly Pay Rate
              </Label>
              <Badge variant="secondary" className="text-lg font-bold">${avgPayRate}/hr</Badge>
            </div>
            <Slider
              value={[avgPayRate]}
              onValueChange={([v]) => setAvgPayRate(v)}
              min={12}
              max={35}
              step={1}
              className="w-full"
              data-testid="slider-payrate"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$12/hr</span>
              <span>$35/hr</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Your Monthly Savings with Trinity AI:
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Admin time saved (35 hrs/mo)
              </span>
              <span className="font-semibold text-green-600">{formatCurrency(roi.adminTimeSaved)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                Timesheet fraud prevented
              </span>
              <span className="font-semibold text-green-600">{formatCurrency(roi.timesheetFraudPrevented)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Profit optimization
              </span>
              <span className="font-semibold text-green-600">{formatCurrency(roi.profitOptimization)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                Compliance protection
              </span>
              <span className="font-semibold text-green-600">{formatCurrency(roi.complianceProtection)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Monthly Savings</span>
              <span className="text-green-600">{formatCurrency(roi.totalSavings)}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">
                Recommended: {tierConfig.displayName}
              </span>
              <Badge className="bg-primary">{formatCurrency(basePrice)}/mo</Badge>
            </div>
            {overageEmployees > 0 && (
              <div className="text-sm text-muted-foreground">
                + {overageEmployees} employees x ${tierConfig.overagePrice} = {formatCurrency(overageCharge)}/mo overage
              </div>
            )}
            <div className="text-sm font-medium mt-1">
              Total: {formatCurrency(totalCost)}/month
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(netSavings)}</div>
            <div className="text-sm text-muted-foreground">Net Monthly Profit</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {roiPercent}% ROI
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(netSavings * 12)}/year
              </span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full" 
            onClick={() => setLocation(`/register?tier=${recommendedTier}`)}
            data-testid="button-start-trial"
          >
            Start Free Trial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
