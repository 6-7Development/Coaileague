/**
 * Credit Purchase — handles one-time credit purchases via Stripe
 */
import { creditBalanceService } from './creditBalanceService';
import { createLogger } from '../../lib/logger';
const log = createLogger('CreditPurchase');

export const creditPurchase = {
  async purchase(workspaceId: string, creditAmount: number, stripePaymentIntentId?: string): Promise<{ success: boolean; newBalance: number }> {
    await creditBalanceService.addCredits(workspaceId, creditAmount, 'purchased');
    const balance = await creditBalanceService.getBalance(workspaceId);
    log.info(`[CreditPurchase] ${workspaceId} purchased ${creditAmount} credits via ${stripePaymentIntentId ?? 'manual'}. New total: ${balance.total}`);
    return { success: true, newBalance: balance.total };
  },
};
