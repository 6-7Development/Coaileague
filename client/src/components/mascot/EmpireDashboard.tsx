/**
 * Empire Dashboard - Trinity Pro CSO Upgrade
 * 
 * The central hub for Empire Mode featuring:
 * - GrowthStrategist Strategy Cards with 4 pillars
 * - Blue Dot Protocol status and maintenance windows
 * - Holistic Growth Engine business health insights
 * - CEO-level executive summaries
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap, 
  Target,
  Crown,
  BarChart3,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Briefcase,
  Building2,
  Wrench,
  Brain
} from 'lucide-react';
import { BlueDotStatusCard } from './BlueDotStatusCard';

interface StrategyCard {
  id: string;
  pillar: 'cashflow' | 'networking' | 'sales' | 'tools';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedROI: number;
  actionable: boolean;
  proposedActions: string[];
  metadata: Record<string, any>;
  createdAt: string;
}

interface HolisticReport {
  workspaceId: string;
  generatedAt: string;
  executiveSummary: {
    overallHealth: number;
    trend: 'improving' | 'stable' | 'declining';
    topPriority: string;
    quickWins: string[];
  };
  pillars: {
    goals: { score: number; insights: string[] };
    income: { score: number; insights: string[] };
    spending: { score: number; insights: string[] };
    manpower: { score: number; insights: string[] };
  };
  growthStrategies: string[];
  roiProjection: {
    currentMonthly: number;
    projectedMonthly: number;
    percentageGain: number;
  };
}

interface EmpireDashboardProps {
  workspaceId: string;
  isGuru?: boolean;
  className?: string;
}

const PILLAR_ICONS = {
  cashflow: DollarSign,
  networking: Building2,
  sales: TrendingUp,
  tools: Wrench,
};

const PILLAR_COLORS = {
  cashflow: 'text-emerald-400',
  networking: 'text-blue-400',
  sales: 'text-amber-400',
  tools: 'text-purple-400',
};

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  medium: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function StrategyCardItem({ card }: { card: StrategyCard }) {
  const Icon = PILLAR_ICONS[card.pillar];
  
  return (
    <Card className="hover-elevate" data-testid={`card-strategy-${card.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`p-2 rounded-lg bg-slate-800 ${PILLAR_COLORS[card.pillar]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <Badge className={PRIORITY_COLORS[card.priority]}>
            {card.priority}
          </Badge>
        </div>
        
        <h4 className="font-medium mt-3 text-sm">{card.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Est. ROI</span>
          <span className="text-sm font-mono text-emerald-400">
            +{card.estimatedROI.toFixed(1)}%
          </span>
        </div>
        
        {card.actionable && card.proposedActions.length > 0 && (
          <Button size="sm" variant="outline" className="w-full mt-3" data-testid={`button-action-${card.id}`}>
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Take Action
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function HealthScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {score}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

export function EmpireDashboard({ workspaceId, isGuru = false, className = "" }: EmpireDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: strategyData, isLoading: strategiesLoading } = useQuery<{ success: boolean; cards: StrategyCard[] }>({
    queryKey: ['/api/trinity/empire/scan', workspaceId],
    enabled: !!workspaceId,
  });

  const { data: holisticData, isLoading: holisticLoading } = useQuery<{ success: boolean; report: HolisticReport }>({
    queryKey: ['/api/trinity/empire/holistic', workspaceId],
    enabled: !!workspaceId,
  });

  const strategies = strategyData?.cards || [];
  const report = holisticData?.report;

  const criticalCards = strategies.filter(c => c.priority === 'critical');
  const highCards = strategies.filter(c => c.priority === 'high');

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30">
            <Crown className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Empire Mode
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">CSO</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">Strategic growth intelligence from Trinity</p>
          </div>
        </div>
        
        {report?.executiveSummary && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={
                report.executiveSummary.trend === 'improving' 
                  ? 'border-emerald-500/50 text-emerald-400'
                  : report.executiveSummary.trend === 'declining'
                  ? 'border-red-500/50 text-red-400'
                  : 'border-slate-500/50 text-slate-400'
              }
            >
              {report.executiveSummary.trend === 'improving' && <ArrowUpRight className="h-3 w-3 mr-1" />}
              {report.executiveSummary.trend.charAt(0).toUpperCase() + report.executiveSummary.trend.slice(1)}
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-empire-overview">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="strategies" data-testid="tab-empire-strategies">
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Strategies
          </TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-empire-health">
            <Brain className="h-4 w-4 mr-1.5" />
            Health
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-empire-maintenance">
            <Wrench className="h-4 w-4 mr-1.5" />
            Blue Dot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {report?.executiveSummary && (
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-amber-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Health</span>
                      <span className="font-mono text-lg">{report.executiveSummary.overallHealth}%</span>
                    </div>
                    <Progress value={report.executiveSummary.overallHealth} className="h-2" />
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-300 mb-1">Top Priority</p>
                  <p className="text-sm text-muted-foreground">{report.executiveSummary.topPriority}</p>
                </div>

                {report.executiveSummary.quickWins.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Quick Wins</p>
                    <ul className="space-y-1">
                      {report.executiveSummary.quickWins.slice(0, 3).map((win, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          {win}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(criticalCards.length > 0 || highCards.length > 0) && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                Priority Actions ({criticalCards.length + highCards.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...criticalCards, ...highCards].slice(0, 6).map(card => (
                  <StrategyCardItem key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}

          {report?.roiProjection && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ROI Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold font-mono">
                      ${(report.roiProjection.currentMonthly / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">Current Monthly</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-emerald-400">
                      ${(report.roiProjection.projectedMonthly / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">Projected</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-amber-400">
                      +{report.roiProjection.percentageGain.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Growth</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategies" className="mt-6">
          <div className="space-y-6">
            {Object.entries(PILLAR_ICONS).map(([pillar, Icon]) => {
              const pillarCards = strategies.filter(c => c.pillar === pillar);
              if (pillarCards.length === 0) return null;
              
              return (
                <div key={pillar}>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${PILLAR_COLORS[pillar as keyof typeof PILLAR_COLORS]}`} />
                    {pillar.charAt(0).toUpperCase() + pillar.slice(1)} Optimization
                    <Badge variant="secondary" className="ml-auto">{pillarCards.length}</Badge>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pillarCards.map(card => (
                      <StrategyCardItem key={card.id} card={card} />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {strategies.length === 0 && !strategiesLoading && (
              <Card className="text-center py-8">
                <CardContent>
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="font-medium">All Systems Optimized</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No strategic opportunities detected at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          {report?.pillars && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <HealthScoreRing score={report.pillars.goals.score} label="Goals" color="text-amber-400" />
                <HealthScoreRing score={report.pillars.income.score} label="Income" color="text-emerald-400" />
                <HealthScoreRing score={report.pillars.spending.score} label="Spending" color="text-blue-400" />
                <HealthScoreRing score={report.pillars.manpower.score} label="Manpower" color="text-purple-400" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(report.pillars).map(([key, data]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">{key} Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {data.insights.slice(0, 3).map((insight, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {report.growthStrategies.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Growth Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.growthStrategies.map((strategy, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-emerald-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                          {strategy}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BlueDotStatusCard isGuru={isGuru} workspaceId={workspaceId} />
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  Maintenance Philosophy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-sm italic text-cyan-200/80">
                    "I am performing open-heart surgery on the code. Each operation is cryptographically signed to ensure precision and accountability."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 text-right">— Trinity, Blue Dot Protocol</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>SHA-256 cryptographic signatures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>AI-calculated countdown timers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Transparent "God Mode" messaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Business hours respecting execution</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmpireDashboard;
