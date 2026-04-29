/**
 * AI Brain notifier for gamification events — broadcasts level-ups to Trinity
 */
import { createLogger } from '../../lib/logger';
const log = createLogger('GamificationAINotifier');

interface GamificationNotification {
  workspaceId: string;
  employeeId: string;
  eventType: string;
  points: number;
  newLevel?: number;
}

export async function notifyGamification(event: GamificationNotification): Promise<void> {
  if (!event.workspaceId) return;
  try {
    const { platformEventBus } = await import('../../services/platformEventBus');
    platformEventBus.publish({
      type: 'gamification_award',
      workspaceId: event.workspaceId,
      payload: { employeeId: event.employeeId, points: event.points, newLevel: event.newLevel, eventType: event.eventType },
      metadata: { source: 'GamificationService' },
    }).catch(() => {});
    if (event.newLevel && event.newLevel > 1) {
      log.info(`[GamificationAI] Level up! Employee ${event.employeeId} → Level ${event.newLevel}`);
    }
  } catch { /* non-fatal */ }
}
