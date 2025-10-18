// EngagementOS™ Calculation Engine
// Calculates employee health scores and employer benchmarks from engagement data

import { db } from "../db";
import { 
  pulseSurveyResponses,
  employerRatings,
  anonymousSuggestions,
  employeeRecognition,
  employeeHealthScores,
  employerBenchmarkScores,
  employees
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface HealthScoreCalculationInput {
  workspaceId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
}

interface BenchmarkCalculationInput {
  workspaceId: string;
  benchmarkType: 'organization' | 'department' | 'manager' | 'location';
  targetId?: string;
  targetName?: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Calculate Employee Health Score for a single employee
 * Combines pulse survey responses, employer ratings participation, and sentiment analysis
 */
export async function calculateEmployeeHealthScore(input: HealthScoreCalculationInput) {
  const { workspaceId, employeeId, periodStart, periodEnd } = input;
  
  try {
    // 1. Get pulse survey responses for period
    const surveyResponses = await db
      .select()
      .from(pulseSurveyResponses)
      .where(and(
        eq(pulseSurveyResponses.workspaceId, workspaceId),
        eq(pulseSurveyResponses.employeeId, employeeId),
        gte(pulseSurveyResponses.submittedAt, periodStart),
        lte(pulseSurveyResponses.submittedAt, periodEnd)
      ));
    
    // 2. Get employer ratings submitted by employee for period
    const ratingsSubmitted = await db
      .select()
      .from(employerRatings)
      .where(and(
        eq(employerRatings.workspaceId, workspaceId),
        eq(employerRatings.employeeId, employeeId),
        gte(employerRatings.submittedAt, periodStart),
        lte(employerRatings.submittedAt, periodEnd)
      ));
    
    // 3. Get anonymous suggestions (negative sentiment indicator)
    const suggestions = await db
      .select()
      .from(anonymousSuggestions)
      .where(and(
        eq(anonymousSuggestions.workspaceId, workspaceId),
        eq(anonymousSuggestions.employeeId, employeeId),
        gte(anonymousSuggestions.submittedAt, periodStart),
        lte(anonymousSuggestions.submittedAt, periodEnd)
      ));
    
    // 4. Calculate participation rate (did they respond to surveys?)
    const totalSurveysSent = 4; // Assuming monthly surveys = 4 for a quarter
    const surveyParticipationRate = surveyResponses.length > 0 
      ? (surveyResponses.length / totalSurveysSent) * 100 
      : 0;
    
    // 5. Calculate average sentiment score from pulse surveys
    const avgSentimentScore = surveyResponses.length > 0
      ? surveyResponses.reduce((sum, r) => sum + (parseFloat(r.sentimentScore || '0')), 0) / surveyResponses.length
      : 50; // Neutral if no responses
    
    // 6. Calculate average engagement score from pulse surveys
    const avgEngagementScore = surveyResponses.length > 0
      ? surveyResponses.reduce((sum, r) => sum + (parseFloat(r.engagementScore || '0')), 0) / surveyResponses.length
      : 50; // Neutral if no responses
    
    // 7. Extract satisfaction metrics from employer ratings
    const avgManagementSatisfaction = ratingsSubmitted.length > 0
      ? ratingsSubmitted.reduce((sum, r) => sum + (r.managementQuality || 0), 0) / ratingsSubmitted.length * 20
      : 50;
    
    const avgWorkloadSatisfaction = ratingsSubmitted.length > 0
      ? ratingsSubmitted.reduce((sum, r) => sum + (r.workLifeBalance || 0), 0) / ratingsSubmitted.length * 20
      : 50;
    
    const avgGrowthSatisfaction = ratingsSubmitted.length > 0
      ? ratingsSubmitted.reduce((sum, r) => sum + (r.growthOpportunities || 0), 0) / ratingsSubmitted.length * 20
      : 50;
    
    const avgCompensationSatisfaction = ratingsSubmitted.length > 0
      ? ratingsSubmitted.reduce((sum, r) => sum + (r.compensationFairness || 0), 0) / ratingsSubmitted.length * 20
      : 50;
    
    const avgCultureSatisfaction = ratingsSubmitted.length > 0
      ? ratingsSubmitted.reduce((sum, r) => sum + (r.workEnvironment || 0), 0) / ratingsSubmitted.length * 20
      : 50;
    
    // 8. Calculate turnover risk score (PredictionOS™ integration point)
    // Lower engagement + negative sentiment + suggestions = higher risk
    const turnoverRiskScore = calculateTurnoverRisk({
      engagementScore: avgEngagementScore,
      sentimentScore: avgSentimentScore,
      managementSatisfaction: avgManagementSatisfaction,
      workloadSatisfaction: avgWorkloadSatisfaction,
      suggestionCount: suggestions.length,
      urgentSuggestionCount: suggestions.filter(s => s.urgencyLevel === 'high' || s.urgencyLevel === 'urgent').length
    });
    
    // 9. Determine risk level and required actions
    const { riskLevel, requiresManagerAction, actionPriority, suggestedActions, riskFactors } = 
      determineRiskLevel(turnoverRiskScore, {
        engagementScore: avgEngagementScore,
        managementSatisfaction: avgManagementSatisfaction,
        workloadSatisfaction: avgWorkloadSatisfaction,
        suggestionCount: suggestions.length
      });
    
    // 10. Insert or update health score record
    const healthScoreData = {
      workspaceId,
      employeeId,
      periodStart,
      periodEnd,
      overallEngagementScore: avgEngagementScore.toFixed(2),
      surveyParticipationRate: surveyParticipationRate.toFixed(2),
      averageSentimentScore: avgSentimentScore.toFixed(2),
      workloadSatisfaction: avgWorkloadSatisfaction.toFixed(2),
      managementSatisfaction: avgManagementSatisfaction.toFixed(2),
      growthSatisfaction: avgGrowthSatisfaction.toFixed(2),
      compensationSatisfaction: avgCompensationSatisfaction.toFixed(2),
      cultureSatisfaction: avgCultureSatisfaction.toFixed(2),
      turnoverRiskScore: turnoverRiskScore.toFixed(2),
      riskLevel,
      riskFactors,
      requiresManagerAction,
      actionPriority,
      suggestedActions,
      managerNotified: false
    };
    
    const [healthScore] = await db
      .insert(employeeHealthScores)
      .values(healthScoreData)
      .returning();
    
    return healthScore;
  } catch (error) {
    console.error('[EngagementOS™] Error calculating employee health score:', error);
    throw error;
  }
}

/**
 * Calculate turnover risk score (0-100, higher = more likely to leave)
 */
function calculateTurnoverRisk(factors: {
  engagementScore: number;
  sentimentScore: number;
  managementSatisfaction: number;
  workloadSatisfaction: number;
  suggestionCount: number;
  urgentSuggestionCount: number;
}): number {
  // Invert positive metrics (low engagement = high risk)
  const engagementRisk = 100 - factors.engagementScore;
  const sentimentRisk = 100 - factors.sentimentScore;
  const managementRisk = 100 - factors.managementSatisfaction;
  const workloadRisk = 100 - factors.workloadSatisfaction;
  
  // Suggestion count as risk indicator (capped at 20 points)
  const suggestionRisk = Math.min(factors.suggestionCount * 2, 20);
  const urgentSuggestionRisk = factors.urgentSuggestionCount * 5;
  
  // Weighted average
  const turnoverRisk = (
    engagementRisk * 0.30 +      // 30% weight on engagement
    sentimentRisk * 0.25 +        // 25% weight on sentiment
    managementRisk * 0.20 +       // 20% weight on management
    workloadRisk * 0.15 +         // 15% weight on workload
    suggestionRisk * 0.05 +       // 5% weight on suggestion count
    urgentSuggestionRisk * 0.05   // 5% weight on urgent suggestions
  );
  
  return Math.min(Math.max(turnoverRisk, 0), 100);
}

/**
 * Determine risk level and recommended actions
 */
function determineRiskLevel(
  turnoverRiskScore: number,
  context: {
    engagementScore: number;
    managementSatisfaction: number;
    workloadSatisfaction: number;
    suggestionCount: number;
  }
) {
  const riskFactors: string[] = [];
  const suggestedActions: Array<{
    action: string;
    conversationStarter: string;
    expectedImpact: string;
  }> = [];
  
  // Identify risk factors
  if (context.engagementScore < 40) {
    riskFactors.push('Low overall engagement');
    suggestedActions.push({
      action: 'Schedule 1-on-1 check-in',
      conversationStarter: "I've noticed you haven't been as engaged lately. Is everything okay? How can I support you better?",
      expectedImpact: 'Improved trust and communication'
    });
  }
  
  if (context.managementSatisfaction < 40) {
    riskFactors.push('Management relationship concerns');
    suggestedActions.push({
      action: 'Request manager feedback survey',
      conversationStarter: "I want to make sure I'm supporting you effectively. What's one thing I could do differently as your manager?",
      expectedImpact: 'Better manager-employee relationship'
    });
  }
  
  if (context.workloadSatisfaction < 40) {
    riskFactors.push('Work-life balance issues');
    suggestedActions.push({
      action: 'Review workload and priorities',
      conversationStarter: "Let's review your current workload. What projects are taking up most of your time, and is anything feeling overwhelming?",
      expectedImpact: 'Reduced burnout risk'
    });
  }
  
  if (context.suggestionCount >= 3) {
    riskFactors.push('Multiple improvement suggestions submitted');
    suggestedActions.push({
      action: 'Follow up on submitted suggestions',
      conversationStarter: "I see you've shared some suggestions for improvement. Let's discuss which ones we can act on together.",
      expectedImpact: 'Increased feeling of being heard'
    });
  }
  
  // Determine risk level and action priority
  let riskLevel: string;
  let requiresManagerAction: boolean;
  let actionPriority: string;
  
  if (turnoverRiskScore >= 75) {
    riskLevel = 'critical';
    requiresManagerAction = true;
    actionPriority = 'urgent';
    suggestedActions.unshift({
      action: 'URGENT: Immediate intervention required',
      conversationStarter: "Can we schedule time to talk today? I want to make sure you're supported and address any concerns you might have.",
      expectedImpact: 'Prevent voluntary termination'
    });
  } else if (turnoverRiskScore >= 60) {
    riskLevel = 'high';
    requiresManagerAction = true;
    actionPriority = 'high';
  } else if (turnoverRiskScore >= 40) {
    riskLevel = 'medium';
    requiresManagerAction = true;
    actionPriority = 'medium';
  } else if (turnoverRiskScore >= 20) {
    riskLevel = 'low';
    requiresManagerAction = false;
    actionPriority = 'low';
  } else {
    riskLevel = 'minimal';
    requiresManagerAction = false;
    actionPriority = 'low';
  }
  
  return {
    riskLevel,
    requiresManagerAction,
    actionPriority,
    suggestedActions,
    riskFactors
  };
}

/**
 * Calculate Employer Benchmark Score for organization/department/manager
 * Aggregates all employer ratings for a target and compares to industry averages
 */
export async function calculateEmployerBenchmark(input: BenchmarkCalculationInput) {
  const { workspaceId, benchmarkType, targetId, targetName, periodStart, periodEnd } = input;
  
  try {
    // 1. Get all employer ratings for the target in the period
    const whereConditions = [
      eq(employerRatings.workspaceId, workspaceId),
      gte(employerRatings.submittedAt, periodStart),
      lte(employerRatings.submittedAt, periodEnd)
    ];
    
    // Filter by target if specified (department, manager, etc.)
    if (targetId) {
      whereConditions.push(eq(employerRatings.targetId, targetId));
    }
    
    const ratings = await db
      .select()
      .from(employerRatings)
      .where(and(...whereConditions));
    
    if (ratings.length === 0) {
      console.log(`[EngagementOS™] No ratings found for ${benchmarkType} ${targetId} in period`);
      return null;
    }
    
    // 2. Calculate averages for each rating dimension (1-5 scale)
    const avgManagementQuality = ratings.reduce((sum, r) => sum + (r.managementQuality || 0), 0) / ratings.length;
    const avgWorkEnvironment = ratings.reduce((sum, r) => sum + (r.workEnvironment || 0), 0) / ratings.length;
    const avgCompensationFairness = ratings.reduce((sum, r) => sum + (r.compensationFairness || 0), 0) / ratings.length;
    const avgGrowthOpportunities = ratings.reduce((sum, r) => sum + (r.growthOpportunities || 0), 0) / ratings.length;
    const avgWorkLifeBalance = ratings.reduce((sum, r) => sum + (r.workLifeBalance || 0), 0) / ratings.length;
    const avgEquipmentResources = ratings.reduce((sum, r) => sum + (r.equipmentResources || 0), 0) / ratings.length;
    const avgCommunicationClarity = ratings.reduce((sum, r) => sum + (r.communicationClarity || 0), 0) / ratings.length;
    const avgRecognitionAppreciation = ratings.reduce((sum, r) => sum + (r.recognitionAppreciation || 0), 0) / ratings.length;
    
    // 3. Calculate overall score (average of all dimensions)
    const overallScore = (
      avgManagementQuality +
      avgWorkEnvironment +
      avgCompensationFairness +
      avgGrowthOpportunities +
      avgWorkLifeBalance +
      avgEquipmentResources +
      avgCommunicationClarity +
      avgRecognitionAppreciation
    ) / 8;
    
    // 4. Calculate response rate (how many employees rated vs total employees)
    const totalEmployees = await db
      .select({ count: sql`count(*)` })
      .from(employees)
      .where(eq(employees.workspaceId, workspaceId));
    
    const responseRate = (ratings.length / parseInt(totalEmployees[0].count as string)) * 100;
    
    // 5. Identify critical issues (ratings < 2.5 out of 5)
    const criticalIssues = [];
    const highRiskFlags = [];
    
    if (avgManagementQuality < 2.5) {
      criticalIssues.push('Management Quality');
      highRiskFlags.push('Poor management ratings - high turnover risk');
    }
    if (avgWorkEnvironment < 2.5) {
      criticalIssues.push('Work Environment');
      highRiskFlags.push('Toxic work environment reported');
    }
    if (avgCompensationFairness < 2.5) {
      criticalIssues.push('Compensation Fairness');
      highRiskFlags.push('Compensation concerns - employees may seek higher pay elsewhere');
    }
    if (avgWorkLifeBalance < 2.5) {
      criticalIssues.push('Work-Life Balance');
      highRiskFlags.push('Burnout risk - unsustainable workload');
    }
    
    // 6. Calculate trend vs previous period (simplified - would need historical data)
    // For now, we'll mark as 'stable' - in production would compare to previous benchmark
    const scoreTrend = 'stable';
    const monthOverMonthChange = 0;
    
    // 7. Industry benchmarking (monopolistic cross-platform data)
    // In production, this would query anonymized aggregate data across ALL WorkforceOS customers
    // For now, using industry averages (3.5 out of 5 = 70th percentile)
    const industryAverageScore = 3.5;
    const percentileRank = overallScore >= industryAverageScore ? 75 : 50; // Simplified
    
    // 8. Insert benchmark record
    const benchmarkData = {
      workspaceId,
      benchmarkType,
      targetId: targetId || null,
      targetName: targetName || 'Organization-wide',
      periodStart,
      periodEnd,
      managementQualityAvg: avgManagementQuality.toFixed(2),
      workEnvironmentAvg: avgWorkEnvironment.toFixed(2),
      compensationFairnessAvg: avgCompensationFairness.toFixed(2),
      growthOpportunitiesAvg: avgGrowthOpportunities.toFixed(2),
      workLifeBalanceAvg: avgWorkLifeBalance.toFixed(2),
      equipmentResourcesAvg: avgEquipmentResources.toFixed(2),
      communicationClarityAvg: avgCommunicationClarity.toFixed(2),
      recognitionAppreciationAvg: avgRecognitionAppreciation.toFixed(2),
      overallScore: overallScore.toFixed(2),
      industryAverageScore: industryAverageScore.toFixed(2),
      percentileRank,
      scoreTrend,
      monthOverMonthChange: monthOverMonthChange.toFixed(2),
      totalResponses: ratings.length,
      responseRate: responseRate.toFixed(2),
      criticalIssuesCount: criticalIssues.length,
      highRiskFlags
    };
    
    const [benchmark] = await db
      .insert(employerBenchmarkScores)
      .values(benchmarkData)
      .returning();
    
    return benchmark;
  } catch (error) {
    console.error('[EngagementOS™] Error calculating employer benchmark:', error);
    throw error;
  }
}

/**
 * Batch calculate health scores for all employees in a workspace
 */
export async function batchCalculateHealthScores(workspaceId: string, periodStart: Date, periodEnd: Date) {
  try {
    // Get all employees in workspace
    const allEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.workspaceId, workspaceId));
    
    console.log(`[EngagementOS™] Calculating health scores for ${allEmployees.length} employees`);
    
    const results = [];
    for (const employee of allEmployees) {
      try {
        const healthScore = await calculateEmployeeHealthScore({
          workspaceId,
          employeeId: employee.id,
          periodStart,
          periodEnd
        });
        results.push(healthScore);
      } catch (error) {
        console.error(`[EngagementOS™] Failed to calculate health score for employee ${employee.id}:`, error);
      }
    }
    
    console.log(`[EngagementOS™] Successfully calculated ${results.length} health scores`);
    return results;
  } catch (error) {
    console.error('[EngagementOS™] Error in batch health score calculation:', error);
    throw error;
  }
}
