/**
 * Analytics AI Service — uses seeded data for AI-powered insights
 */
import { analyticsStats } from './analyticsStats';
import { createLogger } from '../lib/logger';
const log = createLogger('AnalyticsAIService');

export const analyticsAIService = {
  async analyze(workspaceId: string): Promise<{ insights: string[]; anomalies: string[]; recommendations: string[] }> {
    const stats = await analyticsStats.get(workspaceId);
    const insights: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    const s = stats.summary;
    if (s.open_shifts > 5) anomalies.push(`${s.open_shifts} open shifts need coverage`);
    if (s.overdue_amount > 0) anomalies.push(`$${Number(s.overdue_amount).toFixed(0)} in overdue invoices`);

    const c = stats.coverage;
    if (c.total > 0) {
      const rate = (c.completed / c.total * 100).toFixed(0);
      insights.push(`${rate}% shift completion rate in last 30 days`);
    }
    if (c.open > 0) recommendations.push(`Fill ${c.open} open shifts to maximize client coverage`);
    if (s.active_employees > 0) insights.push(`${s.active_employees} active employees across ${s.active_clients} clients`);

    return { insights, anomalies, recommendations };
  },
};
