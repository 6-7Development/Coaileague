/**
 * Analytics Stats — aggregates key metrics for dashboards
 */
import { analyticsDataService } from './analyticsDataService';

export const analyticsStats = {
  async get(workspaceId: string) {
    const [summary, coverage, revenue, payroll, time] = await Promise.all([
      analyticsDataService.getWorkspaceSummary(workspaceId),
      analyticsDataService.getShiftCoverage(workspaceId),
      analyticsDataService.getRevenueByClient(workspaceId),
      analyticsDataService.getPayrollSummary(workspaceId),
      analyticsDataService.getTimeEntrySummary(workspaceId),
    ]);
    return { summary, coverage, revenue, payroll, time, generatedAt: new Date().toISOString() };
  },
};
