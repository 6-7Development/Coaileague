/**
 * Gamification Service — Real implementation using employee_points table
 * Domain: Workforce / Engagement
 */
import { db } from '../../db';
import { createLogger } from '../../lib/logger';
import { employeePoints, employeeAchievements } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { GAMIFICATION_EVENTS, levelFromPoints, type GamificationEventId } from './gamificationEvents';

const log = createLogger('GamificationService');

export const gamificationService = {
  /**
   * Award points to an employee for an event
   */
  async award(workspaceId: string, employeeId: string, eventId: GamificationEventId): Promise<{ newTotal: number; newLevel: number }> {
    const event = GAMIFICATION_EVENTS[eventId];
    if (!event) throw new Error(`Unknown gamification event: ${eventId}`);

    const [existing] = await db.select().from(employeePoints)
      .where(and(eq(employeePoints.workspaceId, workspaceId), eq(employeePoints.employeeId, employeeId)))
      .limit(1);

    const now = new Date();
    const newTotal = (existing?.totalPoints ?? 0) + event.points;
    const newLevel = levelFromPoints(newTotal);

    if (existing) {
      await db.update(employeePoints)
        .set({
          totalPoints: newTotal,
          lifetimePoints: sql`${employeePoints.lifetimePoints} + ${event.points}`,
          weeklyPoints: sql`${employeePoints.weeklyPoints} + ${event.points}`,
          monthlyPoints: sql`${employeePoints.monthlyPoints} + ${event.points}`,
          currentLevel: newLevel,
          achievementsEarned: sql`${employeePoints.achievementsEarned} + 1`,
          lastActivityAt: now,
          updatedAt: now,
        })
        .where(and(eq(employeePoints.workspaceId, workspaceId), eq(employeePoints.employeeId, employeeId)));
    } else {
      await db.insert(employeePoints).values({
        workspaceId, employeeId,
        totalPoints: event.points,
        lifetimePoints: event.points,
        weeklyPoints: event.points,
        monthlyPoints: event.points,
        currentLevel: newLevel,
        achievementsEarned: 1,
        lastActivityAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }

    // Record achievement
    try {
      await db.insert(employeeAchievements).values({
        workspaceId, employeeId,
        achievementId: event.id,
        pointsAwarded: event.points,
        reason: event.label,
        earnedAt: now,
      }).onConflictDoNothing();
    } catch { /* achievement already recorded */ }

    log.info(`[Gamification] Awarded ${event.points}pts (${eventId}) to ${employeeId} → total=${newTotal} level=${newLevel}`);
    return { newTotal, newLevel };
  },

  /**
   * Get employee points and level
   */
  async getPoints(workspaceId: string, employeeId: string) {
    const [row] = await db.select().from(employeePoints)
      .where(and(eq(employeePoints.workspaceId, workspaceId), eq(employeePoints.employeeId, employeeId)))
      .limit(1);
    return row ?? { totalPoints: 0, currentLevel: 1, weeklyPoints: 0, monthlyPoints: 0, streakDays: 0 };
  },

  /**
   * Get workspace leaderboard (top 10 by total points)
   */
  async getLeaderboard(workspaceId: string, period: 'weekly' | 'monthly' | 'all_time' = 'all_time') {
    const scoreCol = period === 'weekly' ? employeePoints.weeklyPoints
      : period === 'monthly' ? employeePoints.monthlyPoints
      : employeePoints.totalPoints;

    return db.select().from(employeePoints)
      .where(eq(employeePoints.workspaceId, workspaceId))
      .orderBy(desc(scoreCol))
      .limit(10);
  },

  /**
   * Reset weekly/monthly points (called by cron)
   */
  async resetPeriodPoints(workspaceId: string, period: 'weekly' | 'monthly') {
    const col = period === 'weekly' ? { weeklyPoints: 0 } : { monthlyPoints: 0 };
    const count = await db.update(employeePoints).set(col).where(eq(employeePoints.workspaceId, workspaceId));
    log.info(`[Gamification] Reset ${period} points for workspace ${workspaceId}`);
    return count;
  },
};
