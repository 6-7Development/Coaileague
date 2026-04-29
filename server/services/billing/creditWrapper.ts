/**
 * Credit Wrapper — gates AI calls behind credit balance checks
 */
import { creditBalanceService } from './creditBalanceService';
import { createLogger } from '../../lib/logger';
const log = createLogger('CreditWrapper');

export async function withCredits<T>(
  workspaceId: string,
  cost: number,
  fn: () => Promise<T>,
  options?: { skipIfInsufficient?: boolean }
): Promise<T> {
  const balance = await creditBalanceService.getBalance(workspaceId);
  if (balance.total < cost) {
    if (options?.skipIfInsufficient) {
      log.warn(`[CreditWrapper] Insufficient credits (${balance.total}/${cost}) for ${workspaceId} — skipping`);
      return null as T;
    }
    throw new Error(`Insufficient AI credits: ${balance.total} available, ${cost} required`);
  }
  const result = await fn();
  await creditBalanceService.deductCredits(workspaceId, cost).catch(e => log.warn('[CreditWrapper] Deduct failed:', e?.message));
  return result;
}
