/**
 * TRINITY CHAT ROUTES
 * ===================
 * API endpoints for Trinity conversational interface with BUDDY mode support.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { trinityChatService, ConversationMode } from '../services/ai-brain/trinityChatService';

const router = Router();

// Request schemas
const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  mode: z.enum(['business', 'personal', 'integrated']).default('business'),
  sessionId: z.string().optional(),
});

const updateSettingsSchema = z.object({
  personalDevelopmentEnabled: z.boolean().optional(),
  spiritualGuidance: z.enum(['none', 'general', 'christian']).optional(),
  accountabilityLevel: z.enum(['gentle', 'balanced', 'challenging']).optional(),
  weeklyCheckInEnabled: z.boolean().optional(),
  checkInDay: z.string().optional(),
  checkInTime: z.string().optional(),
  showThoughtProcess: z.boolean().optional(),
  proactiveInsights: z.boolean().optional(),
  memoryRecallDepth: z.enum(['minimal', 'moderate', 'deep']).optional(),
  preferredCommunicationStyle: z.enum(['direct', 'supportive', 'challenging']).optional(),
  allowPersonalQuestions: z.boolean().optional(),
});

/**
 * POST /api/trinity/chat
 * Send a message to Trinity and get a response
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { message, mode, sessionId } = parsed.data;
    const userId = (req.user as any).id;
    const workspaceId = (req.user as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context required' });
    }

    const response = await trinityChatService.chat({
      userId,
      workspaceId,
      message,
      mode: mode as ConversationMode,
      sessionId,
    });

    return res.json(response);
  } catch (error: any) {
    console.error('[TrinityChat] Error:', error);
    return res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

/**
 * GET /api/trinity/history
 * Get user's conversation history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    const workspaceId = (req.user as any).workspaceId;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context required' });
    }

    const history = await trinityChatService.getUserConversationHistory(userId, workspaceId, limit);
    return res.json(history);
  } catch (error: any) {
    console.error('[TrinityChat] History error:', error);
    return res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * GET /api/trinity/session/:sessionId/messages
 * Get messages for a specific session
 */
router.get('/session/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sessionId } = req.params;
    const messages = await trinityChatService.getSessionMessages(sessionId);
    return res.json({ messages });
  } catch (error: any) {
    console.error('[TrinityChat] Session messages error:', error);
    return res.status(500).json({ error: 'Failed to get session messages' });
  }
});

/**
 * POST /api/trinity/mode
 * Switch conversation mode
 */
router.post('/mode', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { mode } = req.body;
    if (!['business', 'personal', 'integrated'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const userId = (req.user as any).id;
    const workspaceId = (req.user as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context required' });
    }

    const session = await trinityChatService.switchMode(userId, workspaceId, mode as ConversationMode);
    return res.json({ session, mode });
  } catch (error: any) {
    console.error('[TrinityChat] Mode switch error:', error);
    return res.status(500).json({ error: 'Failed to switch mode' });
  }
});

/**
 * GET /api/trinity/settings
 * Get BUDDY settings for current user
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = (req.user as any).id;
    const workspaceId = (req.user as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context required' });
    }

    const settings = await trinityChatService.getOrCreateBuddySettings(userId, workspaceId);
    return res.json(settings);
  } catch (error: any) {
    console.error('[TrinityChat] Settings error:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PATCH /api/trinity/settings
 * Update BUDDY settings
 */
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid settings', details: parsed.error.issues });
    }

    const userId = (req.user as any).id;
    const workspaceId = (req.user as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace context required' });
    }

    const settings = await trinityChatService.updateBuddySettings(userId, workspaceId, parsed.data as any);
    return res.json(settings);
  } catch (error: any) {
    console.error('[TrinityChat] Settings update error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
