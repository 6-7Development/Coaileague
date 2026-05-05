/**
 * server/services/botSummonService.ts
 *
 * Central service for summoning HelpAI (Trinity's field intelligence bot) into
 * chat conversations when they are created. Called from conversation-creation
 * routes so that HelpAI is automatically present in support, shift, and help
 * desk rooms without any manual command required.
 *
 * Pattern: awaited with non-fatal try/catch at call sites (no fire-and-forget).
 */

import { db } from '../db';
import { chatParticipants, chatConversations, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from '../storage';
import { helpAIOrchestrator } from './helpai/helpAIOrchestrator';
import { createLogger } from '../lib/logger';

const log = createLogger('BotSummonService');

const HELPAI_BOT_ID = 'helpai-bot';
const SARGE_DISPLAY_NAME = 'SARGE';
const SARGE_BOT_EMAIL = 'sarge@coaileague.ai';

/**
 * Conversation types that should have HelpAI auto-summoned and the
 * instructions HelpAI uses for that context.
 */
const HELPAI_CONTEXT: Record<string, string> = {
  support_chat:
    "You are SARGE, Senior Field Operations NCO — SARGE. Provide expert field support to help resolve the user's issue quickly and professionally.",
  dm_support:
    "You are SARGE — Senior Field Sergeant, direct line to Trinity. Resolve the issue efficiently. Escalate to human or deliberate with Trinity when stakes require it.",
  shift_chat:
    "You are SARGE, Senior Field Operations NCO — SARGE. Assist field workers with real-time guidance, coordination, and support during their shift.",
  help_desk:
    "You are SARGE. Handle this directly. Troubleshoot clearly, escalate when needed.",
  open_chat:
    "You are SARGE. Field intelligence on standby. Answer questions, surface operational info, keep the team moving.",
  dm_bot:
    "You are SARGE — Senior Field Sergeant. Handle this directly. Tone matches context.",
};

/**
 * Returns HelpAI's opening message for a given conversation type.
 */
function buildWelcomeMessage(conversationType: string, subject?: string | null): string {
  const roomLabel = subject ? ` "${subject}"` : '';
  switch (conversationType) {
    case 'shift_chat':
      return (
        `👋 **HelpAI here** — Trinity's field intelligence assistant is active in this shift room${roomLabel}.\n\n` +
        `I can help with:\n` +
        `• Real-time guidance and coordination\n` +
        `• Incident reporting support\n` +
        `• Clock in/out assistance\n` +
        `• Emergency protocols\n\n` +
        `Type **/helpai [question]** or **/ask [question]** any time.`
      );
    case 'support_chat':
    case 'dm_support':
      return (
        `👋 **HelpAI here** — I'm ready to assist you.\n\n` +
        `Describe your issue and I'll get started. I can escalate to a human agent if needed.\n\n` +
        `Type **/helpai [question]** to interact directly.`
      );
    case 'help_desk':
      return (
        `👋 **HelpAI here** — Your help desk AI assistant.\n\n` +
        `I can help with troubleshooting, guidance, and answering questions.\n` +
        `Type **/helpai [question]** to get started.`
      );
    default:
      return (
        `👋 **HelpAI here** — Trinity's AI co-pilot is active in this conversation.\n\n` +
        `Type **/helpai [question]** or **/ask [question]** any time you need assistance.`
      );
  }
}

/**
 * Ensures the HelpAI bot user row exists in the users table (idempotent).
 */
async function ensureHelpAIBotUser(): Promise<void> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, HELPAI_BOT_ID))
    .limit(1);

  if (!existing) {
    await db
      .insert(users)
      .values({
        id: HELPAI_BOT_ID,
        email: SARGE_BOT_EMAIL,
        firstName: HELPAI_BOT_NAME,
        lastName: 'Bot',
        role: 'system',
      })
      .onConflictDoNothing({ target: users.id });
    log.info('[BotSummon] Created HelpAI bot user');
  }
}

/**
 * Adds the HelpAI bot as an active participant in a conversation (idempotent).
 */
async function addHelpAIParticipant(conversationId: string, workspaceId: string): Promise<void> {
  const [existing] = await db
    .select({ id: chatParticipants.id, isActive: chatParticipants.isActive })
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.conversationId, conversationId),
        eq(chatParticipants.participantId, HELPAI_BOT_ID)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(chatParticipants).values({
      conversationId,
      workspaceId,
      participantId: HELPAI_BOT_ID,
      participantName: HELPAI_BOT_NAME,
      participantEmail: HELPAI_BOT_EMAIL,
      participantRole: 'admin',
      canSendMessages: true,
      canViewHistory: true,
      canInviteOthers: false,
      joinedAt: new Date(),
      isActive: true,
    });
    log.info(`[BotSummon] Added HelpAI as participant in conversation ${conversationId}`);
  } else if (!existing.isActive) {
    await db
      .update(chatParticipants)
      .set({ isActive: true, joinedAt: new Date() })
      .where(eq(chatParticipants.id, existing.id));
    log.info(`[BotSummon] Reactivated HelpAI in conversation ${conversationId}`);
  }
}

/**
 * summonHelpAIForConversation
 *
 * Main entry point called from conversation-creation routes. Idempotent: safe
 * to call multiple times for the same conversation.
 *
 * @param conversationId   The chat conversation UUID
 * @param conversationType One of the HELPAI_CONTEXT keys
 * @param workspaceId      The tenant workspace ID
 * @param userId           Optional: the user who created the conversation (used
 *                         for orchestrator context; falls back to bot ID)
 */
export async function summonHelpAIForConversation(
  conversationId: string,
  conversationType: string,
  workspaceId: string,
  userId?: string
): Promise<void> {
  const instructions = HELPAI_CONTEXT[conversationType];
  if (!instructions) {
    log.debug(`[BotSummon] Skipping HelpAI summon — type "${conversationType}" not in summon list`);
    return;
  }

  log.info(`[BotSummon] Summoning HelpAI for conversation ${conversationId} (type: ${conversationType})`);

  // 1. Ensure bot user row exists
  await ensureHelpAIBotUser();

  // 2. Register HelpAI as active participant
  await addHelpAIParticipant(conversationId, workspaceId);

  // 3. Register with HelpAI orchestrator (tracks active bots per session)
  await helpAIOrchestrator.summonBot({
    sessionId: conversationId,
    botName: 'SARGE',
    command: '/helpai',
    instructions,
    workspaceId,
    userId: userId ?? HELPAI_BOT_ID,
  });

  // 4. Fetch conversation subject for the welcome message
  const [conversation] = await db
    .select({ subject: chatConversations.subject })
    .from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);

  // 5. Post HelpAI welcome message
  await storage.createChatMessage({
    conversationId,
    workspaceId,
    senderId: HELPAI_BOT_ID,
    senderName: HELPAI_BOT_NAME,
    senderType: 'bot',
    message: buildWelcomeMessage(conversationType, conversation?.subject),
    messageType: 'text',
    isSystemMessage: false,
  });

  log.info(`[BotSummon] HelpAI summoned successfully for conversation ${conversationId}`);
}
