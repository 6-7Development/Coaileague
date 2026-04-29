/**
 * Credits Ledger Service — higher-level ledger with workspace credit tracking
 */
import { creditLedger } from './creditLedger';
import { creditBalanceService } from './creditBalanceService';

export const creditsLedgerService = {
  async debit(workspaceId: string, userId: string | null, feature: string, tokens: number, credits: number) {
    await creditLedger.record(workspaceId, userId, feature, tokens, credits);
    await creditBalanceService.deductCredits(workspaceId, credits);
  },
  async credit(workspaceId: string, amount: number, type: 'subscription' | 'purchased' | 'carryover' = 'subscription') {
    await creditBalanceService.addCredits(workspaceId, amount, type);
  },
  async getBalance(workspaceId: string) {
    return creditBalanceService.getBalance(workspaceId);
  },
};
