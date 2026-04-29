/**
 * Credit Balance Service — real implementation using credit_balances table
 */
import { db } from '../../db';
import { creditBalances } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';
const log = createLogger('CreditBalanceService');

export const creditBalanceService = {
  async getBalance(workspaceId: string) {
    const [row] = await db.select().from(creditBalances)
      .where(eq(creditBalances.workspaceId, workspaceId)).limit(1);
    if (!row) return { total: 0, subscription: 0, carryover: 0, purchased: 0 };
    return {
      total: (row.subscriptionCredits ?? 0) + (row.carryoverCredits ?? 0) + (row.purchasedCredits ?? 0),
      subscription: row.subscriptionCredits ?? 0,
      carryover: row.carryoverCredits ?? 0,
      purchased: row.purchasedCredits ?? 0,
      lastResetAt: row.lastResetAt,
      nextResetAt: row.nextResetAt,
    };
  },

  async deductCredits(workspaceId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(workspaceId);
    if (balance.total < amount) return false;
    // Deduct from subscription first, then carryover, then purchased
    let remaining = amount;
    const updates: Partial<typeof creditBalances.$inferInsert> = {};
    if (remaining > 0 && balance.subscription > 0) {
      const deduct = Math.min(remaining, balance.subscription);
      updates.subscriptionCredits = balance.subscription - deduct;
      remaining -= deduct;
    }
    if (remaining > 0 && balance.carryover > 0) {
      const deduct = Math.min(remaining, balance.carryover);
      updates.carryoverCredits = balance.carryover - deduct;
      remaining -= deduct;
    }
    if (remaining > 0 && balance.purchased > 0) {
      const deduct = Math.min(remaining, balance.purchased);
      updates.purchasedCredits = balance.purchased - deduct;
    }
    await db.update(creditBalances).set(updates).where(eq(creditBalances.workspaceId, workspaceId));
    return true;
  },

  async addCredits(workspaceId: string, amount: number, type: 'subscription' | 'purchased' | 'carryover' = 'subscription') {
    const existing = await db.select().from(creditBalances)
      .where(eq(creditBalances.workspaceId, workspaceId)).limit(1);
    if (existing.length === 0) {
      await db.insert(creditBalances).values({
        workspaceId,
        subscriptionCredits: type === 'subscription' ? amount : 0,
        purchasedCredits: type === 'purchased' ? amount : 0,
        carryoverCredits: type === 'carryover' ? amount : 0,
      }).onConflictDoNothing();
    } else {
      const col = type === 'subscription' ? { subscriptionCredits: (existing[0].subscriptionCredits ?? 0) + amount }
        : type === 'purchased' ? { purchasedCredits: (existing[0].purchasedCredits ?? 0) + amount }
        : { carryoverCredits: (existing[0].carryoverCredits ?? 0) + amount };
      await db.update(creditBalances).set(col).where(eq(creditBalances.workspaceId, workspaceId));
    }
    log.info(`[Credits] Added ${amount} ${type} credits to ${workspaceId}`);
  },
};
