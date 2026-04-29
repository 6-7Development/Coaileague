/**
 * AI Credit Gateway — pre-authorize and post-charge AI feature usage
 */
import { creditBalanceService } from './creditBalanceService';
import { createLogger } from '../../lib/logger';
const log = createLogger('AICreditGateway');

const FEATURE_COSTS: Record<string, number> = {
  ai_notification: 2,
  trinity_action_reason_scheduling_fill: 0,
  ai_general: 1,
  health_check: 0,
  platform_change_summary: 3,
  default: 1,
};

export const aiCreditGateway = {
  async check(workspaceId: string, feature: string): Promise<boolean> {
    if (!workspaceId || workspaceId === 'undefined') return true; // system calls always pass
    const cost = FEATURE_COSTS[feature] ?? FEATURE_COSTS.default;
    if (cost === 0) return true;
    const balance = await creditBalanceService.getBalance(workspaceId);
    return balance.total >= cost;
  },

  async charge(workspaceId: string, feature: string, tokensUsed: number): Promise<void> {
    if (!workspaceId || workspaceId === 'undefined') return;
    const cost = FEATURE_COSTS[feature] ?? FEATURE_COSTS.default;
    if (cost > 0) {
      await creditBalanceService.deductCredits(workspaceId, cost).catch(e =>
        log.debug(`[AICreditGateway] Deduct failed for ${workspaceId}/${feature}: ${e?.message}`)
      );
    }
  },
};
