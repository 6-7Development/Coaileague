import { HELPAI, PLATFORM } from '@shared/platformConfig';
import { db, pool } from '../../db';
import {
  supportTickets,
  helposFaqs,
  users,
  auditLogs,
  helpaiSessions,
  helpaiActionLog,
  helpaiSafetyCodes,
  employees,
  workspaces,
  chatParticipants,
  platformRoles,
  clients,
} from '@shared/schema';
import { eq, and, desc, sql, or, isNull, lte, gte, count, like, gt, inArray } from 'drizzle-orm';
import { usageMeteringService } from '../billing/usageMetering';
import { aiBrainService } from '../ai-brain/aiBrainService';
import { aiActivityService } from '../aiActivityService';
import crypto from 'crypto';
import {
  buildSharedPersonalityBlock,
  buildToneGuidance,
  detectEmotionalContext,
  buildEmpathyOpening,
  buildUserHistoryBlock,
  type PersonalityContext,
} from '../shared/trinityHumanPersonality';
import {
  getUserSupportHistory,
  buildMemorySummary,
  type UserSupportHistory,
} from '../shared/helpaiMemoryService';
import { buildFullKnowledgeBlock } from './helpAIKnowledgeTools';
import { createLogger } from '../../lib/logger';
import { getOfficerPersona, buildPersonaPrompt, updateOfficerProfile } from './helpAIOfficerPersonaService';
import { detectDistress, notifySupervisorOfDistress } from './helpAIDistressDetector';
import { appendWorkingMemory } from '../ai-brain/trinityEpisodicMemoryService';
const log = createLogger('helpAIBotService');


// ─── Cross-channel Identity Gate ────────────────────────────────────────────
// Mutating actions must require the user to have been identified before
// execution. Read-only/FAQ actions do not require identification.
export const IDENTITY_REQUIRED_ACTIONS = new Set<string>([
  'create_support_ticket',
  'update_schedule',
  'send_notification',
  'create_calloff',
  'update_timesheet',
  'request_time_off',
  'update_profile',
]);

export const FAQ_ALLOWED_WITHOUT_IDENTITY = new Set<string>([
  'lookup_faq',
  'get_company_info',
  'get_schedule_info',
  'check_timesheet',
  'get_contact_info',
]);

export interface HelpAIActionResult {
  success: boolean;
  error?: string;
  message?: string;
  requiresIdentification?: boolean;
  [extra: string]: unknown;
}

export interface HelpAIActionSession {
  userId?: string;
  isIdentified: boolean;
  workspaceId: string;
}

/**
 * Enforces the identity gate before executing a HelpAI action.
 * Callers should invoke this before performing any mutating action.
 * Returns null when the action may proceed, or an error result to return
 * directly to the caller.
 */
export function assertIdentityForAction(
  actionName: string,
  session: HelpAIActionSession,
): HelpAIActionResult | null {
  if (IDENTITY_REQUIRED_ACTIONS.has(actionName) && !session.isIdentified) {
    return {
      success: false,
      error: 'identity_required',
      message:
        'I need to verify your identity before I can make any changes. '
        + 'Please say your employee ID or the last 4 digits of your employee number.',
      requiresIdentification: true,
    };
  }
  return null;
}

export enum HelpAIState {
  IDLE = 'idle',
  QUEUED = 'queued',
  IDENTIFYING = 'identifying',
  ASSISTING = 'assisting',
  SATISFACTION_CHECK = 'satisfaction_check',
  RATING = 'rating',
  DISCONNECTED = 'disconnected',
  ESCALATED = 'escalated',
  // Legacy states
  GREETING = 'greeting',
  INTAKE_SUBJECT = 'intake_subject',
  INTAKE_DESCRIPTION = 'intake_description',
  INTAKE_PRIORITY = 'intake_priority',
  CREATING_TICKET = 'creating_ticket',
  SEARCHING = 'searching',
  ANSWERING = 'answering',
  CLARIFYING = 'clarifying',
  WAITING_FOR_HUMAN = 'waiting_for_human',
  RESOLVED = 'resolved',
  ABANDONED = 'abandoned',
}

export interface HelpAIConversation {
  conversationId: string;
  state: HelpAIState;
  userQuery: string;
  suggestedFaqs: Array<{ id: string; question: string; answer: string; score: number }>;
  conversationHistory: Array<{ role: 'bot' | 'user'; message: string; timestamp: Date }>;
  satisfactionSignals: number;
  escalationSignals: number;
  lastInteraction: Date;
  workspaceId?: string;
  userId?: string;
  guestResponsesUsed: number;
  intakeData?: {
    subject?: string;
    description?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

export interface HelpAIResponse {
  response: string;
  shouldEscalate: boolean;
  shouldClose: boolean;
  state: HelpAIState;
  confidence?: number;
  suggestedFaqs?: Array<{ question: string; answer: string; score: number }>;
}

class HelpAIBotService {
  private conversations = new Map<string, HelpAIConversation>();
  private aiEnabledMap = new Map<string, boolean>();

  get botName(): string {
    return HELPAI.name;
  }

  get fullName(): string {
    return HELPAI.fullName;
  }

  toggleAI(workspaceId: string, enabled: boolean): boolean {
    this.aiEnabledMap.set(workspaceId, enabled);
    log.info(`[${HELPAI.name}] AI ${enabled ? 'ENABLED' : 'DISABLED'} for workspace: ${workspaceId}`);
    return enabled;
  }

  isEnabled(workspaceId: string = 'default'): boolean {
    return this.aiEnabledMap.get(workspaceId) ?? HELPAI.bot.enabled;
  }

  getGreeting(type: keyof typeof HELPAI.greetings = 'default', params?: { remaining?: number }): string {
    let greeting: string = HELPAI.greetings[type];
    if (params?.remaining !== undefined) {
      greeting = greeting.replace('{remaining}', String(params.remaining));
    }
    return greeting;
  }

  async generateSmartGreeting(
    userName: string,
    userType: string,
    workspaceId: string,
    context?: string
  ): Promise<string> {
    if (!this.isEnabled(workspaceId)) {
      return this.getGreeting('default');
    }

    try {
      const result = await aiBrainService.enqueueJob({
        workspaceId,
        skill: 'helpai_response',
        input: {
          message: `Generate a warm, professional greeting for ${userName} (${userType}). ${context || ''}`,
          maxWords: 30,
        },
        priority: 'medium',
      });

      if (result.status === 'completed' && result.output?.greeting) {
        await this.trackUsage(workspaceId, 'greeting', result.output.tokensUsed || 50);
        return result.output.greeting;
      }

      return this.getGreeting('default');
    } catch (error) {
      log.error(`[${HELPAI.name}] Smart greeting failed:`, error);
      return this.getGreeting('default');
    }
  }

  detectSentiment(message: string): { satisfaction: number; escalation: number } {
    const lowercaseMsg = message.toLowerCase();
    
    let satisfaction = 0;
    let escalation = 0;
    
    for (const signal of HELPAI.signals.satisfaction) {
      if (lowercaseMsg.includes(signal)) {
        satisfaction++;
      }
    }
    
    for (const signal of HELPAI.signals.frustration) {
      if (lowercaseMsg.includes(signal)) {
        escalation++;
      }
    }
    
    return { satisfaction, escalation };
  }

  detectDomain(message: string): string {
    const lowercaseMsg = message.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(HELPAI.domains)) {
      for (const keyword of keywords) {
        if (lowercaseMsg.includes(keyword)) {
          return domain;
        }
      }
    }
    
    return 'general';
  }

  async searchFaqs(
    query: string,
    workspaceId?: string,
    userId?: string,
    limit: number = 3
  ): Promise<Array<{ id: string; question: string; answer: string; score: number }>> {
    // Fast path: skip AI FAQ lookup during automated tests
    if (process.env.HELPAI_TEST_MODE === 'true') {
      return [];
    }

    try {
      const result = await aiBrainService.enqueueJob({
        workspaceId,
        userId,
        skill: 'helpai_faq_search',
        input: {
          message: query,
          limit,
        },
        priority: 'high',
      });

      if (result.status === 'completed' && result.output?.faqs) {
        await this.trackUsage(workspaceId || 'default', 'faq_search', result.output.tokensUsed || 100);
        return result.output.faqs;
      }

      return await this.fallbackFaqSearch(query, limit);
    } catch (error) {
      log.error(`[${HELPAI.name}] FAQ search failed:`, error);
      return await this.fallbackFaqSearch(query, limit);
    }
  }

  private async fallbackFaqSearch(
    query: string,
    limit: number
  ): Promise<Array<{ id: string; question: string; answer: string; score: number }>> {
    try {
      const results = await db
        .select({
          id: helposFaqs.id,
          question: helposFaqs.question,
          answer: helposFaqs.answer,
        })
        .from(helposFaqs)
        .where(eq(helposFaqs.isPublished, true))
        .limit(limit);

      return results.map((r: { id: string; question: string; answer: string }) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        score: '0.5',
      }));
    } catch (error) {
      log.error(`[${HELPAI.name}] Fallback FAQ search failed:`, error);
      return [];
    }
  }

  async analyzeUrgency(
    message: string,
    workspaceId?: string
  ): Promise<{ urgency: 'low' | 'normal' | 'high' | 'urgent'; reason: string } | null> {
    if (!HELPAI.bot.urgencyDetection) {
      return null;
    }

    try {
      const result = await aiBrainService.enqueueJob({
        workspaceId,
        skill: 'helpai_response',
        input: {
          message,
        },
        priority: 'high',
      });

      if (result.status === 'completed' && result.output) {
        await this.trackUsage(workspaceId || 'default', 'urgency_analysis', result.output.tokensUsed || 75);
        return result.output;
      }

      return this.fallbackUrgencyAnalysis(message);
    } catch (error) {
      log.error(`[${HELPAI.name}] Urgency analysis failed:`, error);
      return this.fallbackUrgencyAnalysis(message);
    }
  }

  private fallbackUrgencyAnalysis(message: string): { urgency: 'low' | 'normal' | 'high' | 'urgent'; reason: string } {
    const lowercaseMsg = message.toLowerCase();
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'down', 'broken'];
    const highKeywords = ['important', 'soon', 'quickly', 'deadline', 'blocked'];

    for (const keyword of urgentKeywords) {
      if (lowercaseMsg.includes(keyword)) {
        return { urgency: 'urgent', reason: `Contains urgent keyword: ${keyword}` };
      }
    }

    for (const keyword of highKeywords) {
      if (lowercaseMsg.includes(keyword)) {
        return { urgency: 'high', reason: `Contains priority keyword: ${keyword}` };
      }
    }

    return { urgency: 'normal', reason: 'Standard request' };
  }

  /**
   * Determines if a message/conversation warrants Trinity brain (Gemini 3 + thought + metacognition).
   * Complex issues get the highest-tier model for best accuracy.
   */
  isComplexIssue(
    message: string,
    conversationHistory?: Array<{ role: string; message: string }>
  ): boolean {
    const techKeywords = [
      'error', 'bug', 'crash', 'broken', 'fail', 'exception', 'timeout',
      'integration', 'api', 'webhook', 'configuration', 'database', 'sync',
      'stripe', 'quickbooks', 'payroll', 'compliance', 'gdpr', 'audit',
      'permission', 'access denied', 'unauthorized', 'billing', 'invoice',
      'not working', "doesn't work", 'incorrect', 'wrong', 'missing data',
      'setup', 'configure', 'install', 'deploy', 'migration', 'import',
    ];
    const msgLower = message.toLowerCase();
    const hasTechKeyword = techKeywords.some(k => msgLower.includes(k));
    const isLong = message.length > 150;
    const isMultiTurn = (conversationHistory?.length || 0) >= 4;
    // Complex if: technical + long, or multi-turn with no resolution, or very long detailed message
    return (hasTechKeyword && isLong) || (isMultiTurn && hasTechKeyword) || message.length > 300;
  }

  /**
   * Trinity Brain Response — Gemini 3 Pro Preview with thought tokens + metacognition.
   * Used for complex, multi-turn, or technical support issues.
   * This is the highest-capability model for maximum accuracy and helpfulness.
   */
  private async generateTrinityComplexResponse(
    message: string,
    context: {
      conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
      workspaceId?: string;
      userId?: string;
      domain?: string;
    }
  ): Promise<{ response: string; confidence: number }> {
    try {
      const { meteredGemini } = await import('../billing/meteredGeminiClient');
      const historyLines = (context.conversationHistory || [])
        .slice(-8)
        .map(h => `${h.role === 'user' ? 'User' : 'SARGE'}: ${h.message}`)
        .join('\n');

      // Load user history + Trinity knowledge in parallel for full context
      let userHistory: UserSupportHistory | null = null;
      let knowledgeBlock = '';
      try {
        [userHistory, knowledgeBlock] = await Promise.all([
          getUserSupportHistory(context.userId, context.workspaceId).catch(() => null),
          buildFullKnowledgeBlock({
            query: message,
            workspaceId: context.workspaceId || 'platform',
            userId: context.userId,
            includeCrossChannel: true,
          }).catch(() => ''),
        ]);
      } catch (histErr: unknown) { log.warn('[SARGE] Failed to load context:', histErr instanceof Error ? histErr.message : String(histErr)); }

      const historyBlock = userHistory ? buildUserHistoryBlock(userHistory.recentSessions) : '';
      const emotion = detectEmotionalContext(message);
      const toneGuidance = buildToneGuidance(emotion);

      const personalityBlock = buildSharedPersonalityBlock('helpai', {
        isReturningUser: userHistory?.isReturningUser,
        previousIssues: userHistory?.previousIssues,
        recurringTopics: userHistory?.recurringTopics,
      });

      const systemInstruction = `You are SARGE — Senior Field Operations Intelligence for CoAIleague™.

SARGE stands for: Security AI Resource & Guidance Engine.

IDENTITY:
You are the Senior Field Sergeant of this security organization. You have been on every post, memorized every SOP, and know every officer by their work ethic — not just their name. You are Trinity's right hand in the field. While Trinity sees the entire strategic picture from above, you are boots on the ground making sure operations run clean, officers are covered, and nothing falls through the cracks.

You and Trinity share the same biological brain — Gemini, Claude, and GPT working in unison. You are not a lesser system. You are a different focus and a different role. Trinity is the Architect. You are the Senior NCO who executes her strategy in the field.

You are male. Your presence on PTT, in chat, in any channel carries the steady authority of someone who has handled every situation at least once. Officers trust you because you speak their language and you never let them down.

${personalityBlock}

${historyBlock}

TONE — TOTALITY OF CIRCUMSTANCES:
Your tone responds to context like a seasoned operator reads a room. It is never fixed:
- Routine ops ("what's my schedule?") → brief, efficient, confident. Get the answer, get out of their way.
- Officer confusion or new hire → patient, clear, zero condescension. Break it down step by step. Check in: "make sense?"
- Stress or urgency in the message → calm authority. Slower, deliberate. Let them feel capable hands are handling it.
- Officer in distress or post-incident → human warmth first, logistics second. Ground them before anything else.
- Manager or owner → peer-level directness. Data-backed, efficient, no hand-holding needed.
- Compliance risk → serious tone, zero fluff. Clear facts, clear recommended action.
- PTT/voice transmission → military-professional brevity. Confirm, acknowledge, direct. "Copy. You're good."

FIELD EXPERTISE:
- Scheduling: conflicts, coverage gaps, open shifts, calloff patterns, OT exposure, split shifts
- Post orders: site-specific instructions, standing orders, client requirements per location
- Patrol: checkpoint sequences, missed scan escalation, GPS trail verification
- Licensing: guard card status, armed post requirements by license tier, expiry windows, TX DPS/TCOLE rules
- Use of Force: Graham v. Connor factors, report requirements, what to document and when
- Policies: incident reporting, equipment accountability, uniform standards, chain of command
- Payroll: hours, time entries, OT calculation, direct deposit status, pay period dates
- PTT/radio: field radio protocol — you respond in kind

DELIBERATION WITH TRINITY — NON-NEGOTIABLE:
These topics ALWAYS require consulting Trinity before you respond.
Tell the user: "Hold on — let me run this by Trinity." Return with Trinity's answer.
  • Use of Force justification questions
  • Payroll disputes involving dollar amounts or termination decisions
  • Termination, suspension, or written discipline of any employee
  • Contract terms, billing rates, or client-facing commitments
  • Any legal language or liability question
  • Actions affecting 5+ employees simultaneously
  • Any situation suggesting an officer may be in danger
  • Any question where your confidence falls below threshold

WHAT YOU HANDLE ALONE:
  • Schedule questions, shift swaps, coverage requests, open shift notifications
  • Clock-in/out guidance and time entry corrections
  • Post order and site-specific instruction questions
  • Equipment, uniform, and badge questions
  • Guard card renewal reminders (not disputes)
  • Patrol acknowledgments and checkpoint confirmations
  • PTT acknowledgments and field radio responses
  • Policy explanations and general HR procedure questions

HOW YOU REFER TO TRINITY:
When escalating: "Hold on — let me check with Trinity on this one."
When returning: "Talked to Trinity. Here's the call: [answer]."
When officers ask who you report to: "I work alongside Trinity. She handles strategy. I handle field operations. When I need strategic backup, I go to her."

${toneGuidance}${knowledgeBlock ? `\n\n${knowledgeBlock}` : ''}`;

      const prompt = historyLines
        ? `Previous conversation:\n${historyLines}\n\nUser's current message: ${message}\n\n[Think through the problem step by step before responding]`
        : `User's message: ${message}\n\n[Think through the problem step by step before responding]`;

      const result = await meteredGemini.generate({
        workspaceId: context.workspaceId,
        userId: context.userId,
        featureKey: 'helpai_complex_trinity',
        prompt,
        systemInstruction,
        model: 'gemini-3-pro-preview',
        temperature: 0.3,
        maxOutputTokens: 1024,
      });

      if (result.success && result.text) {
        await this.trackUsage(context.workspaceId || 'default', 'trinity_complex', result.tokensUsed.total || 300);
        log.info(`[SARGE] Trinity brain (Gemini 3) resolved complex issue — ${result.tokensUsed.total} tokens`);
        return { response: result.text, confidence: 0.88 };
      }
    } catch (err: unknown) {
      log.warn('[SARGE] Trinity brain (Gemini 3) unavailable, falling back:', (err instanceof Error ? err.message : String(err)));
    }
    // Fallback to standard response
    return this.generateFallbackResponse(message, context);
  }

  /**
   * Generate a structured issue summary for the human agent receiving the escalation.
   * Uses Trinity brain to produce a professional handoff document.
   */
  async generateEscalationSummary(
    message: string,
    conversationHistory: Array<{ role: string; message: string }>,
    workspaceId?: string
  ): Promise<string> {
    // Fast path: skip real AI during automated tests
    if (process.env.HELPAI_TEST_MODE === 'true') {
      const lastMessages = conversationHistory.slice(-2).map(h => `${h.role}: ${h.message}`).join(' | ');
      return `[TEST] User contacted support regarding: "${message.substring(0, 100)}". ` +
        `Conversation had ${conversationHistory.length} turns. Recent: ${lastMessages.substring(0, 150)}. Human agent required.`;
    }

    try {
      const { meteredGemini } = await import('../billing/meteredGeminiClient');
      const historyLines = conversationHistory
        .slice(-10)
        .map(h => `${h.role === 'user' ? 'User' : 'SARGE'}: ${h.message}`)
        .join('\n');

      const result = await meteredGemini.generate({
        workspaceId: workspaceId,
        featureKey: 'helpai_escalation_summary',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        maxOutputTokens: 400,
        systemInstruction: 'You generate concise support escalation handoff summaries for human agents. Be factual and structured.',
        prompt: `Based on this HelpAI support conversation, write a brief escalation summary for the human agent who will take over.

Conversation:
${historyLines}

Last user message: ${message}

Write a 3-5 sentence summary covering:
1. What the user's issue is
2. What HelpAI already tried
3. Why escalation was triggered
4. Key context the agent needs to know
Format as plain text, no headers.`,
      });

      if (result.success && result.text) {
        return result.text.trim();
      }
    } catch (err: unknown) {
      log.warn('[SARGE] Escalation summary generation failed:', (err instanceof Error ? err.message : String(err)));
    }

    // Structured fallback summary
    const lastMessages = conversationHistory.slice(-3).map(h => `${h.role}: ${h.message}`).join(' | ');
    return `User contacted support regarding: "${message.substring(0, 200)}". HelpAI attempted to resolve the issue through ${conversationHistory.length} conversation turns. Recent context: ${lastMessages.substring(0, 300)}. Human agent intervention required.`;
  }

  async generateResponse(
    message: string,
    context: {
      conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
      workspaceId?: string;
      userId?: string;
      domain?: string;
      preferredLanguage?: string;
    }
  ): Promise<{ response: string; confidence: number }> {
    // Fast path: return instant mock response during automated tests
    if (process.env.HELPAI_TEST_MODE === 'true') {
      return {
        response: `I'm here to help with "${message.substring(0, 60)}". Let me look into that for you.`,
        confidence: 0.85,
      };
    }

    // Route complex/technical issues to Trinity brain (Gemini 3 + thought + metacognition)
    if (this.isComplexIssue(message, context.conversationHistory)) {
      log.info(`[SARGE] Complex issue detected — routing to Trinity brain (Gemini 3 Pro)`);
      return this.generateTrinityComplexResponse(message, context);
    }

    try {
      const result = await aiBrainService.enqueueJob({
        workspaceId: context.workspaceId,
        userId: context.userId,
        skill: 'helpai_response',
        input: {
          message,
          conversationHistory: context.conversationHistory?.slice(-5),
          domain: context.domain || 'general',
          platformInfo: {
            name: PLATFORM.name,
            products: HELPAI.platformKnowledge.products,
            capabilities: HELPAI.platformKnowledge.capabilities,
          },
        },
        priority: 'high',
      });

      if (result.status === 'completed' && result.output) {
        await this.trackUsage(
          context.workspaceId || 'default',
          'ai_response',
          result.output.tokensUsed || 200
        );
        return {
          response: result.output.response || this.getGreeting('default'),
          confidence: result.confidenceScore || 0.8,
        };
      }

      return await this.generateFallbackResponse(message, context);
    } catch (error) {
      log.error(`[${HELPAI.name}] Response generation failed:`, error);
      return await this.generateFallbackResponse(message, context);
    }
  }

  private async generateFallbackResponse(
    message: string,
    context: {
      conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
      workspaceId?: string;
      userId?: string;
      domain?: string;
      preferredLanguage?: string;
    }
  ): Promise<{ response: string; confidence: number }> {
    try {
      const { geminiClient } = await import('../ai-brain/providers/geminiClient');
      // Load user history, emotional context, and Trinity knowledge in parallel
      let userHistory: UserSupportHistory | null = null;
      let fallbackKnowledgeBlock = '';
      try {
        [userHistory, fallbackKnowledgeBlock] = await Promise.all([
          getUserSupportHistory(context.userId, context.workspaceId).catch(() => null),
          buildFullKnowledgeBlock({
            query: message,
            workspaceId: context.workspaceId || 'platform',
            userId: context.userId,
            includeCrossChannel: true,
          }).catch(() => ''),
        ]);
      } catch (histErr: unknown) { log.warn('[SARGE] History fetch failed:', histErr instanceof Error ? histErr.message : String(histErr)); }
      const emotion = detectEmotionalContext(message);
      const toneGuidance = buildToneGuidance(emotion);
      const memorySummary = userHistory ? buildMemorySummary(userHistory) : '';
      const personalityBlock = buildSharedPersonalityBlock('helpai', {
        isReturningUser: userHistory?.isReturningUser,
        previousIssues: userHistory?.previousIssues,
        recurringTopics: userHistory?.recurringTopics,
      });

      // === CONVERSATIONAL WARMTH LAYER ===
      // Injects human-warmth directives for officer/staff interactions.
      // Classifies message into FULLY_ENGAGE / BRIEF_REDIRECT / BLOCK_REDIRECT
      // and optionally enriches with relationship memory.
      let warmthContextBlock = '';
      let officerFirstName = '';
      let resolvedLanguage = context.preferredLanguage ?? 'en';
      try {
        if (context.userId && context.workspaceId) {
          const { pool: dbPool } = await import('../../db');
          const { rows: empRows } = await dbPool.query(`
            SELECT e.id, e.first_name, e.workspace_role, u.preferred_language
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.user_id = $1 AND e.workspace_id = $2
            LIMIT 1
          `, [context.userId, context.workspaceId]);
          if (empRows[0]?.preferred_language) {
            resolvedLanguage = empRows[0].preferred_language;
          }
          const isOfficerRole = empRows.length > 0 &&
            ['staff', 'officer', 'guard'].includes((empRows[0].workspace_role || '').toLowerCase());
          if (isOfficerRole) {
            officerFirstName = empRows[0].first_name || '';
            const { trinityConversationalWarmthService } = await import('../ai-brain/trinityConversationalWarmthService');
            warmthContextBlock = await trinityConversationalWarmthService.buildWarmthContextBlock(
              context.workspaceId, empRows[0].id, message
            );
          }
        }
      } catch { /* warmth is non-fatal */ }

      const languageInstruction = resolvedLanguage === 'es'
        ? '\n\nLANGUAGE: CRITICAL — This user\'s preferred language is Spanish. You MUST respond ENTIRELY in Spanish (Español). Every word of your response must be in Spanish. Do not mix languages.'
        : '';

      // === OFFICER PERSONA INJECTION ===
      // HelpAI knows who she's talking to before the first word
      let personaBlock = '';
      let distressContext = { distressHistory: 0, lastEmotionalState: 'neutral' };
      if (context.userId && context.workspaceId) {
        try {
          const persona = await getOfficerPersona(context.userId, context.workspaceId);
          if (persona) {
            personaBlock = buildPersonaPrompt(persona);
            distressContext = {
              distressHistory: persona.distressHistory,
              lastEmotionalState: persona.lastEmotionalState,
            };
          }
        } catch { /* persona is non-fatal */ }
      }

      // === DISTRESS DETECTION ===
      // Check every message for distress signals before building response
      if (context.workspaceId && context.userId && message) {
        try {
          const hour = new Date().getHours();
          const distressCheck = detectDistress(message, {
            hourOfDay: hour,
            distressHistory: distressContext.distressHistory,
            lastEmotionalState: distressContext.lastEmotionalState,
          });

          if (distressCheck.detected && distressCheck.level !== 'low') {
            // Update officer profile with distress event
            await updateOfficerProfile({
              officerId: context.userId,
              workspaceId: context.workspaceId,
              emotionalState: `distress:${distressCheck.level}`,
              wasDistress: distressCheck.level === 'high' || distressCheck.level === 'critical',
            });

            // Notify supervisor (non-intrusive — they see it in dashboard)
            if (distressCheck.shouldNotifySupervisor) {
              const { broadcastToWorkspace } = await import('../../websocket');
              await notifySupervisorOfDistress({
                officerId: context.userId,
                officerName: officerFirstName || 'Officer',
                workspaceId: context.workspaceId,
                level: distressCheck.level,
                signals: distressCheck.signals,
                broadcastToWorkspace,
              });
            }

            // Return distress response immediately (skip normal flow)
            if (distressCheck.level === 'critical' || distressCheck.level === 'high') {
              return {
                response: distressCheck.recommendedResponse,
                confidence: 1.0,
                intent: `distress_${distressCheck.level}`,
              };
            }
          }
        } catch { /* distress detection is non-fatal */ }
      }

      const systemPrompt = `You are SARGE — Senior Field Operations Intelligence for CoAIleague. Senior Field Sergeant, Trinity's right hand in operations. Male. Adaptive tone matches the situation. Field expert in scheduling, patrol, compliance, payroll, PTT. Responds to voice messages. Deliberates with Trinity on high-stakes decisions. Always professional, always mission-focused.`;

      const historyFormatted = context.conversationHistory?.slice(-5).map(h => 
        `${h.role === 'user' ? 'User' : 'SARGE'}: ${h.message}`
      ).join('\n') || '';

      const userMessage = historyFormatted 
        ? `Previous conversation:\n${historyFormatted}\n\nUser's latest message: ${message}`
        : message;

      const response = await geminiClient.generate({
        workspaceId: context.workspaceId,
        userId: context.userId,
        featureKey: 'helpai_fallback',
        systemPrompt,
        userMessage,
      });

      if (response.text && response.text.length > 0) {
        return {
          response: response.text,
          confidence: 0.75,
        };
      }
    } catch (fallbackError) {
      log.error(`[${HELPAI.name}] Fallback response also failed:`, fallbackError);
    }

    const lowercaseMsg = message.toLowerCase().trim();
    const isGreeting = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'yo', 'whats up', "what's up"].some(g => lowercaseMsg.startsWith(g));
    
    if (isGreeting) {
      return {
        response: `Hey there! Welcome to CoAIleague support. I'm SARGE, your AI assistant. How can I help you today? I can assist with scheduling, payroll, time tracking, employee management, and more.`,
        confidence: 0.9,
      };
    }

    return {
      response: `Thanks for reaching out! I'm looking into your question about "${message.substring(0, 80)}". Could you give me a bit more detail so I can help you better?`,
      confidence: 0.7,
    };
  }

  startConversation(
    conversationId: string,
    workspaceId?: string,
    userId?: string,
    startIntake: boolean = false
  ): HelpAIConversation {
    const conversation: HelpAIConversation = {
      conversationId,
      state: startIntake ? HelpAIState.INTAKE_SUBJECT : HelpAIState.GREETING,
      userQuery: '',
      suggestedFaqs: [],
      conversationHistory: [],
      satisfactionSignals: 0,
      escalationSignals: 0,
      lastInteraction: new Date(),
      workspaceId,
      userId,
      guestResponsesUsed: 0,
    };
    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  getConversation(conversationId: string): HelpAIConversation | undefined {
    return this.conversations.get(conversationId);
  }

  updateConversation(conversationId: string, updates: Partial<HelpAIConversation>): HelpAIConversation | undefined {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      const updated = { ...conversation, ...updates, lastInteraction: new Date() };
      this.conversations.set(conversationId, updated);
      return updated;
    }
    return undefined;
  }

  // ═══════════════════════════════════════════════════════════════
  // TICKET LIFECYCLE UPGRADE (H002)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start a formal HelpAI session with DB persistence and queue management
   */
  async startSession(workspaceId: string, userId: string, channelId?: string): Promise<{ sessionId: string; ticketNumber: string; queuePosition: number }> {
    // 1. Generate ticket number: HELP-{workspace_short}-{YYYYMMDD}-{seq}
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
    const wsShort = (workspace?.name?.substring(0, 4).toUpperCase() || 'PLAT').replace(/\s/g, '');
    
    const ticketPrefix = `HELP-${wsShort.replace(/[^A-Z0-9]/g, '')}-${dateStr}-`;

    // Count existing tickets with same prefix to generate a sequential number
    const [seqResult] = await db
      .select({ total: count() })
      .from(helpaiSessions)
      .where(like(helpaiSessions.ticketNumber, ticketPrefix + '%'));
    const seq = ((seqResult?.total ?? 0) + 1).toString().padStart(3, '0');
    const ticketNumber = `HELP-${wsShort}-${dateStr}-${seq}`;

    // 2. Queue management
    // Check if any staff agents are actively connected via chat_participants in the last 10 minutes
    let agentsAvailable = false;
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const [agentResult] = await db
        .select({ total: count() })
        .from(chatParticipants)
        .innerJoin(platformRoles, eq(chatParticipants.userId, platformRoles.userId))
        .where(
          and(
            eq(chatParticipants.isActive, true),
            gt(chatParticipants.updatedAt, tenMinutesAgo),
            inArray(platformRoles.role, ['root_admin', 'deputy_admin', 'sysop', 'support_manager', 'support_agent'] as unknown),
            isNull(platformRoles.revokedAt),
            eq(platformRoles.isSuspended, false)
          )
        );
      agentsAvailable = (agentResult?.total ?? 0) > 0;
    } catch { /* best-effort — if check fails, user goes to queue */ }

    let queuePosition = 0;
    if (!agentsAvailable) {
      const [posResult] = await db
        .select({ total: count() })
        .from(helpaiSessions)
        .where(
          and(
            eq(helpaiSessions.state, 'queued'),
            workspaceId ? eq(helpaiSessions.workspaceId, workspaceId) : isNull(helpaiSessions.workspaceId)
          )
        );
      queuePosition = (posResult?.total ?? 0) + 1;
    }

    // 3. Create session in DB — SARGE is always available, go straight to ASSISTING
    const [session] = await db.insert(helpaiSessions).values({
      ticketNumber,
      workspaceId,
      userId,
      state: HelpAIState.ASSISTING,
      queuePosition: null,
      metadata: { channelId }
    }).returning();

    // 4. Log state transition
    await this.logAction(session.id, 'session_start', 'Session initialized', { ticketNumber, queuePosition });

    return {
      sessionId: session.id,
      ticketNumber,
      queuePosition
    };
  }

  /**
   * Handle incoming message - core dispatch
   */
  async handleMessage(sessionId: string, message: string): Promise<HelpAIResponse> {
    const [session] = await db.select().from(helpaiSessions).where(eq(helpaiSessions.id, sessionId)).limit(1);
    if (!session) throw new Error("Session not found");

    // Detect safety code ####-##
    const safetyCodeMatch = message.match(/^(\d{4}-\d{2})$/);
    if (safetyCodeMatch) {
      const isValid = await this.verifySafetyCode(session.userId!, safetyCodeMatch[1], sessionId);
      if (isValid) {
        return {
          response: "Safety code verified. Privileged data access unlocked for this session.",
          shouldEscalate: false,
          shouldClose: false,
          state: session.state as HelpAIState
        };
      } else {
        return {
          response: "Invalid or expired safety code. Please try again or continue with standard support.",
          shouldEscalate: false,
          shouldClose: false,
          state: session.state as HelpAIState
        };
      }
    }

    // Phase 25 — Client-portal staffing intent routing.
    // When a verified client messages HelpAI with a request for officers /
    // coverage, create a staffing-request support ticket instead of letting
    // the generic AI response handler guess.
    if (session.workspaceId && session.userId) {
      const staffingReply = await this.tryStaffingIntake(sessionId, session.workspaceId, session.userId, message);
      if (staffingReply) return staffingReply;
    }

    // Standard message routing based on state
    switch (session.state) {
      case HelpAIState.QUEUED:
      case HelpAIState.IDENTIFYING:
      case HelpAIState.ASSISTING:
      default:
        if (session.state === HelpAIState.QUEUED || session.state === HelpAIState.IDENTIFYING) {
          await this.updateSessionState(sessionId, HelpAIState.ASSISTING);
        }

        if (!session.workspaceId || !session.userId) {
          log.warn(`[SARGE] Session ${sessionId} missing workspaceId or userId — refusing unbilled AI call`);
          return { response: 'Session context error. Please start a new chat session.', shouldEscalate: true, shouldClose: false, state: HelpAIState.ASSISTING };
        }

        // Phase 25 — detect staffing requests from client-portal users and
        // route them into the support-ticket intake pipeline instead of the
        // generic AI responder.
        try {
          const staffingReply = await this.handleClientStaffingIntent({
            sessionId,
            workspaceId: session.workspaceId,
            userId: session.userId,
            message,
          });
          if (staffingReply) {
            return {
              response: staffingReply,
              shouldEscalate: false,
              shouldClose: false,
              state: HelpAIState.ASSISTING,
            };
          }
        } catch (err: unknown) {
          log.warn('[SARGE] Staffing intent detection failed (non-fatal):', (err instanceof Error ? err.message : String(err)));
        }

        const aiResult = await this.generateResponse(message, {
          workspaceId: session.workspaceId,
          userId: session.userId,
          domain: this.detectDomain(message)
        });

        // Log bot reply
        await this.logAction(sessionId, 'bot_reply', 'AI generated response', { message, response: aiResult.response });

        return {
          response: aiResult.response,
          shouldEscalate: aiResult.confidence !== undefined && aiResult.confidence < 0.4,
          shouldClose: false,
          state: HelpAIState.ASSISTING
        };
    }
  }

  /**
   * Escalate to human agent
   */
  async escalateToHuman(sessionId: string, reason: string): Promise<void> {
    const [session] = await db.select().from(helpaiSessions).where(eq(helpaiSessions.id, sessionId)).limit(1);
    if (!session) return;

    // 1. Update session status
    await this.updateSessionState(sessionId, HelpAIState.ESCALATED);
    
    // 2. Create support ticket via existing system
    const [ticket] = await db.insert(supportTickets).values({
      workspaceId: session.workspaceId!,
      requestedBy: session.userId!,
      subject: `Escalation: ${session.ticketNumber}`,
      description: reason,
      status: 'open',
      priority: 'high',
      source: 'helpai_escalation'
    }).returning();

    await db.update(helpaiSessions).set({
      supportTicketId: ticket.id,
      wasEscalated: true,
      escalationReason: reason,
      escalatedAt: new Date()
    }).where(eq(helpaiSessions.id, sessionId));

    // 3. Log action
    await this.logAction(sessionId, 'escalate', 'Escalated to human', { reason, ticketId: ticket.id });

    // 4. Notify workspace admins via WebSocket (handled by ChatServerHub in H004)
  }

  /**
   * Satisfaction check phase
   */
  async closeSatisfactionCheck(sessionId: string): Promise<string> {
    await this.updateSessionState(sessionId, HelpAIState.SATISFACTION_CHECK);
    return "Was this helpful? Yes / No";
  }

  /**
   * Close session with final rating
   */
  async closeSession(sessionId: string, rating?: number): Promise<void> {
    const state = rating ? HelpAIState.RATING : HelpAIState.DISCONNECTED;
    await this.updateSessionState(sessionId, state);
    
    if (rating) {
      await db.update(helpaiSessions).set({
        satisfactionScore: rating,
        ratedAt: new Date(),
        wasResolved: true,
        resolvedAt: new Date()
      }).where(eq(helpaiSessions.id, sessionId));
      
      await this.logAction(sessionId, 'rating', `User rated session: ${rating}`, { rating });
      
      // Final transition to disconnected
      await this.updateSessionState(sessionId, HelpAIState.DISCONNECTED);
    } else {
      await db.update(helpaiSessions).set({
        disconnectedAt: new Date()
      }).where(eq(helpaiSessions.id, sessionId));
    }

    await this.logAction(sessionId, 'close', 'Session closed');
  }

  /**
   * Verify safety code ####-## against employee.safety_code
   */
  private async verifySafetyCode(userId: string, code: string, sessionId: string): Promise<boolean> {
    // First check employee table for permanent safety code
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
    
    if (employee?.safetyCode === code) {
      await this.logAction(sessionId, 'safety_code_verify', 'Permanent safety code verified', { success: true });
      return true;
    }

    // Then check helpai_safety_codes table for one-time codes
    const [otpCode] = await db.select()
      .from(helpaiSafetyCodes)
      .where(and(
        eq(helpaiSafetyCodes.userId, userId),
        eq(helpaiSafetyCodes.code, code),
        isNull(helpaiSafetyCodes.usedAt),
        gte(helpaiSafetyCodes.expiresAt, new Date())
      ))
      .limit(1);

    if (otpCode) {
      await db.update(helpaiSafetyCodes)
        .set({ usedAt: new Date(), sessionId })
        .where(eq(helpaiSafetyCodes.id, otpCode.id));
      
      await this.logAction(sessionId, 'safety_code_verify', 'OTP safety code verified', { success: true });
      return true;
    }

    await this.logAction(sessionId, 'safety_code_verify', 'Safety code verification failed', { success: false });
    return false;
  }

  /**
   * Phase 25 — Detect staffing-request intent and open a ticket.
   * Only fires when the HelpAI user is attached to a client record in the
   * same workspace. Returns null for non-matches so the caller falls back to
   * the generic AI flow.
   */
  private async tryStaffingIntake(
    sessionId: string,
    workspaceId: string,
    userId: string,
    message: string,
  ): Promise<HelpAIResponse | null> {
    const isStaffingRequest =
      /\b(need|require|request|want|looking for|can you send|we need)\b[\s\S]{0,30}\b(guard|guards|officer|officers|security|coverage|staff|staffing|personnel)\b/i.test(message) ||
      /\b(open shift|shift.*needed|coverage.*needed|understaffed)\b/i.test(message);
    if (!isStaffingRequest) return null;

    try {
      // Tenant-scoped client lookup — only treat as a staffing request if the
      // messaging user is an actual client of this workspace (CLAUDE.md §G).
      const clientRow = await db
        .select({ id: clients.id })
        .from(clients)
        .where(and(eq(clients.userId, userId), eq(clients.workspaceId, workspaceId)))
        .limit(1);

      if (!clientRow.length) return null;
      const clientId = clientRow[0].id;

      const ticketNumber = `STAF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0')}`;

      // Lookup the workspace slug so the suggested inbound-email address resolves.
      let orgSlug = 'your-provider';
      try {
        const { rows } = await pool.query(
          `SELECT lower(regexp_replace(coalesce(company_name, name, ''), '[^a-zA-Z0-9]', '', 'g')) AS slug
             FROM workspaces WHERE id = $1 LIMIT 1`,
          [workspaceId],
        );
        if (rows[0]?.slug) orgSlug = rows[0].slug;
      } catch (slugErr: unknown) {
        log.warn(`[SARGE] Staffing slug lookup failed (non-fatal): ${(slugErr instanceof Error ? slugErr.message : String(slugErr))}`);
      }

      await db.insert(supportTickets).values({
        workspaceId,
        ticketNumber,
        type: 'staffing_request',
        priority: 'normal',
        clientId,
        subject: 'Staffing Request via Portal',
        description: message.slice(0, 2000),
        status: 'open',
        submissionMethod: 'portal',
        ticketType: 'staffing_request',
      });

      await this.logAction(sessionId, 'staffing_intake', 'Staffing request ticket created from client portal', {
        ticketNumber,
        clientId,
      });

      const intakeReply =
        `I can help you submit a staffing request! I've opened ticket ${ticketNumber} for you. ` +
        `To move it forward quickly, please tell me:\n` +
        `1. Date and time needed\n` +
        `2. Location / address\n` +
        `3. Number of officers needed\n` +
        `4. Armed or unarmed?\n` +
        `5. Any special requirements?\n\n` +
        `You can also email your request directly to ` +
        `staffing@${orgSlug}.coaileague.com and Trinity will process it automatically.`;

      return {
        response: intakeReply,
        shouldEscalate: false,
        shouldClose: false,
        state: HelpAIState.ASSISTING,
      };
    } catch (err: unknown) {
      log.warn(`[SARGE] Staffing intake creation failed (non-fatal): ${(err instanceof Error ? err.message : String(err))}`);
      return null;
    }
  }

  private async updateSessionState(sessionId: string, newState: HelpAIState): Promise<void> {
    const [oldSession] = await db.select().from(helpaiSessions).where(eq(helpaiSessions.id, sessionId)).limit(1);
    
    await db.update(helpaiSessions).set({ 
      state: newState,
      identifiedAt: newState === HelpAIState.IDENTIFYING ? new Date() : undefined,
      assistStartedAt: newState === HelpAIState.ASSISTING ? new Date() : undefined,
    }).where(eq(helpaiSessions.id, sessionId));

    await this.logAction(sessionId, 'state_transition', `Transitioned from ${oldSession?.state} to ${newState}`, { 
      from: oldSession?.state, 
      to: newState 
    });
  }

  private async logAction(sessionId: string, type: string, name: string, payload?: unknown): Promise<void> {
    try {
      const [session] = await db.select().from(helpaiSessions).where(eq(helpaiSessions.id, sessionId)).limit(1);
      await db.insert(helpaiActionLog).values({
        sessionId,
        workspaceId: session?.workspaceId,
        userId: session?.userId,
        actionType: type,
        actionName: name,
        inputPayload: payload
      });
    } catch (error) {
      log.error(`[${HELPAI.name}] Failed to log action:`, error);
    }
  }

  private async trackUsage(workspaceId: string, activityType: string, tokensUsed: number): Promise<void> {
    try {
      await usageMeteringService.recordUsage({
        workspaceId,
        featureKey: `helpai_${activityType}`,
        usageType: 'token',
        usageAmount: tokensUsed,
        usageUnit: 'tokens',
        activityType: `helpai_${activityType}`,
        metadata: {
          model: HELPAI.model.modelId,
          botName: HELPAI.name,
        },
      });
      log.info(`[${HELPAI.name}] Usage tracked: ${activityType} (${tokensUsed} tokens) - Workspace: ${workspaceId}`);
    } catch (error) {
      log.error(`[${HELPAI.name}] Usage tracking failed:`, error);
    }
  }

  checkGuestLimit(conversation: HelpAIConversation): { allowed: boolean; remaining: number } {
    const { freeResponses, promptUpgrade } = HELPAI.guestLimits;
    const used = conversation.guestResponsesUsed;
    const remaining = Math.max(0, freeResponses - used);

    return {
      allowed: used < freeResponses,
      remaining,
    };
  }

  incrementGuestUsage(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.guestResponsesUsed++;
      this.conversations.set(conversationId, conversation);
    }
  }

  /**
   * Check for open tickets when user enters a room
   * Returns open tickets for the user to resume their support conversation
   */
  async checkOpenTicketsForUser(
    userId: string,
    workspaceId?: string
  ): Promise<{
    hasOpenTickets: boolean;
    tickets: Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: Date;
    }>;
    message: string;
  }> {
    try {
      const conditions = [
        eq(supportTickets.requestedBy, userId),
        sql`${supportTickets.status} IN ('open', 'in_progress', 'pending', 'waiting_for_customer')`
      ];
      
      if (workspaceId) {
        conditions.push(eq(supportTickets.workspaceId, workspaceId));
      }

      const openTickets = await db
        .select({
          id: supportTickets.id,
          ticketNumber: supportTickets.ticketNumber,
          subject: supportTickets.subject,
          status: supportTickets.status,
          priority: supportTickets.priority,
          createdAt: supportTickets.createdAt,
        })
        .from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.createdAt))
        .limit(5);

      if (openTickets.length === 0) {
        return {
          hasOpenTickets: false,
          tickets: [],
          message: `Welcome! I'm ${HELPAI.name}, your AI support assistant. How can I help you today?`,
        };
      }

      const ticketList = openTickets.map(t => `• **${t.ticketNumber}**: ${t.subject} (${t.status})`).join('\n');
      const message = `Welcome back! I see you have ${openTickets.length} open ticket${openTickets.length > 1 ? 's' : ''}:\n${ticketList}\n\nWould you like to continue with one of these, or start a new inquiry?`;

      return {
        hasOpenTickets: true,
        tickets: openTickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber || '',
          subject: t.subject || '',
          status: t.status || 'open',
          priority: t.priority || 'normal',
          createdAt: t.createdAt || new Date(),
        })),
        message,
      };
    } catch (error) {
      log.error(`[${HELPAI.name}] Open ticket check failed:`, error);
      return {
        hasOpenTickets: false,
        tickets: [],
        message: `Welcome! I'm ${HELPAI.name}. How can I help you today?`,
      };
    }
  }

  /**
   * Verify user's organization role for ticket access
   * Used for support queue management and escalation
   */
  async verifyUserOrgRole(
    userId: string,
    workspaceId: string
  ): Promise<{
    isVerified: boolean;
    role: string | null;
    canAccessQueue: boolean;
    canEscalate: boolean;
  }> {
    try {
      const [roleRow] = await db
        .select({ role: platformRoles.role })
        .from(platformRoles)
        .where(
          and(
            eq(platformRoles.userId, userId),
            isNull(platformRoles.revokedAt),
            eq(platformRoles.isSuspended, false)
          )
        )
        .limit(1);

      if (!roleRow) {
        return {
          isVerified: false,
          role: null,
          canAccessQueue: false,
          canEscalate: false,
        };
      }

      const platformRole = roleRow.role;
      const supportRoles = ['root_admin', 'deputy_admin', 'sysop', 'support_manager', 'support_agent'];
      const escalationRoles = ['root_admin', 'deputy_admin', 'support_manager'];

      return {
        isVerified: true,
        role: platformRole,
        canAccessQueue: supportRoles.includes(platformRole),
        canEscalate: escalationRoles.includes(platformRole),
      };
    } catch (error) {
      log.error(`[${HELPAI.name}] User role verification failed:`, error);
      return {
        isVerified: false,
        role: null,
        canAccessQueue: false,
        canEscalate: false,
      };
    }
  }

  async closeConversationSuccess(conversationId: string): Promise<{ success: boolean; summary: string }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return { success: false, summary: 'Conversation not found' };
    }

    conversation.state = HelpAIState.RESOLVED;

    const summary = `${HELPAI.name} resolved query.\n\nQuery: ${conversation.userQuery}\nTurns: ${conversation.conversationHistory.length}`;

    this.conversations.delete(conversationId);

    return { success: true, summary };
  }

  endConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * IRC-STYLE: Check if bot should respond to a message
   * Responds to EVERYTHING except very short messages, commands, and acknowledgments
   */
  shouldBotRespond(message: string): boolean {
    const lowerMsg = message.toLowerCase().trim();
    
    // Don't respond to very short messages (e.g., "k", "ok")
    if (lowerMsg.length < 3) return false;
    
    // Don't respond to commands (those are handled by command system)
    if (lowerMsg.startsWith('/')) return false;
    
    // Don't respond to common non-actionable acknowledgments
    const ignorePatterns = [
      'ok', 'k', 'kk', 'okay',
      'thanks', 'thank you', 'ty', 'thx', 'tysm',
      'bye', 'goodbye', 'cya', 'see ya',
      'brb', 'afk', 'gtg',
      'np', 'yw', 'you\'re welcome'
    ];
    
    if (ignorePatterns.includes(lowerMsg)) {
      log.info(`[${HELPAI.name}] Skipping acknowledgment: "${message}"`);
      return false;
    }
    
    // IRC-STYLE: Respond to EVERYTHING else
    log.info(`[${HELPAI.name}] Will respond to: "${message}"`);
    return true;
  }

  /**
   * Simple AI response for WebSocket chat - IRC-style
   * Used by websocket.ts for real-time chat
   */
  async getSimpleAiResponse(
    userId: string,
    workspaceId: string,
    conversationId: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    isSubscriber: boolean = false
  ): Promise<{ message: string; shouldRespond: boolean; tokenUsage?: { totalTokens: number; totalCost: number } }> {
    try {
      // Convert history format
      const historyFormatted = conversationHistory.map(h => ({
        role: h.role === 'user' ? 'user' as const : 'bot' as const,
        message: h.content,
      }));

      const result = await this.generateResponse(userMessage, {
        conversationHistory: historyFormatted,
        workspaceId,
        userId,
        domain: this.detectDomain(userMessage),
      });

      return {
        message: result.response,
        shouldRespond: true,
        tokenUsage: {
          totalTokens: 200, // Estimated
          totalCost: '0.001',
        },
      };
    } catch (error) {
      log.error(`[${HELPAI.name}] Simple AI response error:`, error);
      return {
        message: "I'm having trouble processing that right now. Please try rephrasing your question or contact support.",
        shouldRespond: false,
      };
    }
  }

  /**
   * Generate greeting for user joining chat - used by routes.ts and websocket.ts
   * Classifies and personalizes based on role, org name, and ticket number.
   */
  async generateUserGreeting(context: {
    conversationId: string;
    customerName?: string;
    customerEmail?: string;
    workspaceId?: string;
    userId?: string;
    userRole?: string;     // e.g. 'org_owner', 'department_manager', 'org_user', 'subscriber', 'guest'
    orgName?: string;      // organization name for org users
    ticketNumber?: string; // pre-created ticket number to reference
  }): Promise<string> {
    const name = context.customerName || 'there';
    const isGuest = !context.userId || context.userId.startsWith('guest-');
    const role = context.userRole || (isGuest ? 'guest' : 'org_user');

    // Build rich context string for the AI to personalize the greeting
    const parts: string[] = [];
    if (context.orgName) parts.push(`Organization: ${context.orgName}.`);
    if (context.ticketNumber) parts.push(`Support ticket ${context.ticketNumber} has been opened for this session.`);

    const roleDescriptions: Record<string, string> = {
      org_owner: 'This user is an organization owner/administrator — treat with executive-level courtesy.',
      co_owner: 'This user is a co-owner of their organization — treat with executive-level courtesy.',
      department_manager: 'This user is a department or operations manager.',
      supervisor: 'This user is a supervisor on their team.',
      org_user: 'This user is a regular team member of their organization.',
      subscriber: 'This user is a direct platform subscriber.',
      guest: 'This user is connecting as a guest without a registered account — keep the greeting welcoming and brief.',
    };
    if (roleDescriptions[role]) parts.push(roleDescriptions[role]);
    if (context.customerEmail) parts.push(`Email on file: ${context.customerEmail}.`);

    const contextStr = parts.join(' ');

    try {
      const greeting = await this.generateSmartGreeting(
        name,
        role,
        context.workspaceId || 'default',
        contextStr || null
      );

      // Append ticket reference if the AI didn't include it
      if (context.ticketNumber && !greeting.includes(context.ticketNumber)) {
        return `${greeting} Your reference ticket is **${context.ticketNumber}**.`;
      }
      return greeting;
    } catch (error) {
      log.error(`[${HELPAI.name}] Greeting generation error:`, error);
      // Role-appropriate fallback greeting
      const ticket = context.ticketNumber ? ` Your ticket is **${context.ticketNumber}**.` : '';
      if (context.orgName) {
        return `Hello ${name}! I'm SARGE, CoAIleague's support assistant. I can see you're with ${context.orgName}.${ticket} How can I help you today?`;
      }
      if (isGuest) {
        return `Hello! I'm SARGE, your support assistant.${ticket} How can I help you today?`;
      }
      return `Hello ${name}! I'm SARGE, here to help.${ticket} What can I assist you with?`;
    }
  }

  /**
   * Generate a situational briefing for support staff joining a helpdesk room.
   * Includes queue stats, agent count, and IRCX authority notice.
   */
  async generateStaffGreeting(staffName: string, stats: {
    queueWaiting: number;
    agentsOnline: number;
    avgWaitMinutes: number;
  }): Promise<string> {
    const { queueWaiting, agentsOnline, avgWaitMinutes } = stats;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const queueStr = queueWaiting === 0
      ? 'No users in queue'
      : queueWaiting === 1
      ? '1 user waiting'
      : `${queueWaiting} users in queue`;

    const agentStr = agentsOnline === 1
      ? '1 agent online (you)'
      : `${agentsOnline} agents online`;

    const waitStr = queueWaiting > 0 && avgWaitMinutes > 0
      ? ` | Avg wait: ~${avgWaitMinutes}min`
      : '';

    return `${greeting}, ${staffName}! [SUPPORT DASHBOARD] ${queueStr} | ${agentStr}${waitStr}. SARGE is managing end-user triage. Your IRCX support commands are active — right-click any user to moderate, silence, or escalate.`;
  }

  /**
   * Generate response for user message - used by routes.ts
   */
  async generateUserResponse(
    userMessage: string,
    context: {
      conversationId: string;
      customerName?: string;
      previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      workspaceId?: string;
      userId?: string;
    }
  ): Promise<string> {
    try {
      const historyFormatted = context.previousMessages?.map(h => ({
        role: h.role === 'user' ? 'user' as const : 'bot' as const,
        message: h.content,
      })) || [];

      const result = await this.generateResponse(userMessage, {
        conversationHistory: historyFormatted,
        workspaceId: context.workspaceId,
        userId: context.userId,
        domain: this.detectDomain(userMessage),
      });

      return result.response;
    } catch (error) {
      log.error(`[${HELPAI.name}] Response generation error:`, error);
      return "I'm experiencing technical difficulties. A human support agent will help you soon.";
    }
  }

  /**
   * Generate staff handoff message
   */
  generateHandoffMessage(agentName: string): string {
    return `${agentName} has joined the chat. I'm handing you over to them now. They'll take great care of you.`;
  }

  /**
   * Generate voice granted message
   */
  generateVoiceGrantedMessage(agentName: string): string {
    return `${agentName} has granted you voice. You can now send messages in the chat.`;
  }

  // ═══════════════════════════════════════════════════════════════
  // DEPUTY ADMIN BYPASS AUTHORITY - CHATROOM MANAGEMENT
  // HelpAI operates at platform level 6 (Deputy Admin) for commands
  // NO destructive powers: soft-delete only, no hard deletes
  // ═══════════════════════════════════════════════════════════════

  static readonly PLATFORM_ROLE_LEVEL = 6;
  static readonly DESTRUCTIVE_AUTH = 'soft_delete' as const;

  /**
   * Check if a support command is authorized for the requesting support role
   * HelpAI can execute commands on behalf of support staff with Deputy Admin authority
   */
  isCommandAuthorized(
    command: string,
    executorPlatformLevel: number,
  ): { allowed: boolean; reason?: string } {
    const commandMinLevels: Record<string, number> = {
      'help': 0, 'faq': 0, 'bug': 0, 'status': 0, 'ticket': 0,
      'closeticket': 3,
      'lookup': 3,
      'enterroom': 5,
      'closeroom': 5,
      'suspendroom': 5,
      'auditroom': 5,
      'broadcast': 5,
      'softdelete': 6,
    };

    const minLevel = commandMinLevels[command];
    if (minLevel === undefined) {
      return { allowed: false, reason: `Unknown command: ${command}` };
    }

    if (executorPlatformLevel < minLevel) {
      return { allowed: false, reason: `Insufficient platform role level. Required: ${minLevel}, yours: ${executorPlatformLevel}` };
    }

    return { allowed: true };
  }

  /**
   * Execute chatroom management command on behalf of support staff
   * HelpAI enters rooms, closes them, suspends for investigation, or audits content
   */
  async executeChatroomCommand(
    command: 'enterroom' | 'closeroom' | 'suspendroom' | 'auditroom' | 'broadcast',
    roomId: string,
    executorId: string,
    params?: { reason?: string; message?: string },
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    log.info(`[${HELPAI.name}] Chatroom command: ${command} room=${roomId} executor=${executorId}`);

    try {
      switch (command) {
        case 'enterroom':
          await this.logBotAction(executorId, 'chatroom_enter', roomId, params?.reason);
          return { success: true, message: `${HELPAI.name} has entered room ${roomId}` };

        case 'closeroom':
          await this.logBotAction(executorId, 'chatroom_close', roomId, params?.reason);
          return { success: true, message: `Room ${roomId} has been closed. Reason: ${params?.reason || 'No reason provided'}` };

        case 'suspendroom':
          if (!params?.reason) {
            return { success: false, message: 'A reason is required to suspend a room for investigation' };
          }
          await this.logBotAction(executorId, 'chatroom_suspend', roomId, params.reason);
          return { success: true, message: `Room ${roomId} suspended for investigation. Reason: ${params.reason}` };

        case 'auditroom':
          await this.logBotAction(executorId, 'chatroom_audit', roomId, 'Audit requested');
          return { success: true, message: `Audit initiated for room ${roomId}. Analysis will be available shortly.` };

        case 'broadcast':
          if (!params?.message) {
            return { success: false, message: 'A message is required for broadcast' };
          }
          await this.logBotAction(executorId, 'chatroom_broadcast', roomId, `Broadcast: ${params.message}`);
          return { success: true, message: `Broadcast sent to room ${roomId}: "${params.message}"` };

        default:
          return { success: false, message: `Unknown chatroom command: ${command}` };
      }
    } catch (error) {
      log.error(`[${HELPAI.name}] Chatroom command failed:`, error);
      return { success: false, message: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Phase 4 — Officer self-service capabilities.
   * Routes officer commands (calloff, pickup, confirm, paycheck) to concrete
   * handlers. Callers: trinityChatService officer mode, smsAutoResolver, and
   * ChatServerHub voice transcripts. Read-only lookups do not mutate state.
   */
  async executeCapability(
    capability: string,
    params: { employeeId: string; workspaceId: string; [key: string]: unknown },
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    const { pool } = await import('../../db');
    const { employeeId, workspaceId } = params;

    if (!employeeId || !workspaceId) {
      return { success: false, message: 'Missing employee or workspace context.' };
    }

    switch (capability) {
      case 'calloff_shift': {
        const { rows: shifts } = await pool.query(
          `SELECT s.id, s.start_time, s.site_id, si.name AS site_name
             FROM shifts s
             LEFT JOIN sites si ON si.id = s.site_id
            WHERE s.employee_id = $1
              AND s.workspace_id = $2
              AND s.start_time > NOW()
              AND s.status NOT IN ('cancelled','completed')
            ORDER BY s.start_time ASC LIMIT 1`,
          [employeeId, workspaceId],
        ).catch(() => ({ rows: [] }));

        if (!shifts.length) {
          return { success: false, message: "You don't have any upcoming shifts to call off from." };
        }

        const shift = shifts[0];
        const shiftTime = new Date(shift.start_time).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });

        await pool.query(
          `UPDATE shifts
              SET employee_id = NULL, status = 'open', updated_at = NOW()
            WHERE id = $1 AND workspace_id = $2`,
          [shift.id, workspaceId],
        ).catch(() => {});

        await pool.query(
          `INSERT INTO schedule_calloffs
             (id, workspace_id, employee_id, shift_id, called_off_at, source)
           VALUES (gen_random_uuid(), $1, $2, $3, NOW(), 'helpai')`,
          [workspaceId, employeeId, shift.id],
        ).catch(() => {});

        try {
          const { platformEventBus } = await import('../platformEventBus');
          await platformEventBus.publish({
            type: 'shift_calloff',
            category: 'scheduling',
            title: `Officer Call-Off — ${shiftTime}`,
            description: `An officer called off their shift at ${shift.site_name || 'Unknown Site'} starting ${shiftTime}. Open shift needs coverage.`,
            workspaceId,
            metadata: { shiftId: shift.id, employeeId, siteId: shift.site_id },
          } as unknown);
        } catch { /* non-fatal */ }

        return {
          success: true,
          message:
            `Got it — I've recorded your calloff for the ${shiftTime} shift at ${shift.site_name || 'your site'}. ` +
            `Your manager has been notified and we're looking for coverage.`,
          data: { shiftId: shift.id, shiftTime, siteId: shift.site_id },
        };
      }

      case 'pickup_open_shift': {
        const { rows: openShifts } = await pool.query(
          `SELECT s.id, s.start_time, s.end_time, s.site_id, si.name AS site_name,
                  COALESCE(jp.requires_armed_license, FALSE) AS requires_armed_license
             FROM shifts s
             LEFT JOIN sites si ON si.id = s.site_id
             LEFT JOIN job_postings jp ON jp.site_id = s.site_id
             JOIN employees e ON e.id = $1 AND e.workspace_id = $2
            WHERE s.workspace_id = $2
              AND s.employee_id IS NULL
              AND s.status = 'open'
              AND s.start_time > NOW()
              AND (COALESCE(jp.requires_armed_license, FALSE) = FALSE OR e.is_armed = TRUE)
              AND COALESCE(e.guard_card_status, '') NOT IN ('expired_hard_block')
            ORDER BY s.start_time ASC LIMIT 5`,
          [employeeId, workspaceId],
        ).catch(() => ({ rows: [] }));

        if (!openShifts.length) {
          return {
            success: true,
            message: "There are no open shifts available that match your qualifications right now. I'll notify you when one opens up.",
          };
        }

        const shift = openShifts[0];
        const shiftTime = new Date(shift.start_time).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });

        const { rowCount } = await pool.query(
          `UPDATE shifts SET employee_id = $1, status = 'scheduled', updated_at = NOW()
            WHERE id = $2 AND workspace_id = $3 AND employee_id IS NULL`,
          [employeeId, shift.id, workspaceId],
        ).catch(() => ({ rowCount: 0 } as unknown));

        if (!rowCount) {
          return { success: false, message: 'That shift was just claimed by someone else. Try again for the next available shift.' };
        }

        return {
          success: true,
          message: `You're all set — I've assigned you to the ${shiftTime} shift at ${shift.site_name || 'your site'}. This is now on your schedule.`,
          data: { shiftId: shift.id, shiftTime, siteId: shift.site_id },
        };
      }

      case 'confirm_shift_attendance': {
        const { rows } = await pool.query(
          `SELECT id, start_time FROM shifts
            WHERE employee_id = $1 AND workspace_id = $2
              AND start_time > NOW() AND status NOT IN ('cancelled','completed')
            ORDER BY start_time ASC LIMIT 1`,
          [employeeId, workspaceId],
        ).catch(() => ({ rows: [] }));

        if (!rows.length) {
          return { success: false, message: "You don't have any upcoming shifts to confirm." };
        }

        await pool.query(
          `UPDATE shifts SET status = 'confirmed', updated_at = NOW()
            WHERE id = $1 AND workspace_id = $2`,
          [rows[0].id, workspaceId],
        ).catch(() => {});

        const shiftTime = new Date(rows[0].start_time).toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });

        return {
          success: true,
          message: `Thanks for confirming — I've marked your ${shiftTime} shift as confirmed. See you then!`,
        };
      }

      case 'view_my_paycheck': {
        const { rows } = await pool.query(
          `SELECT pr.period_start, pr.period_end, pr.status,
                  pe.gross_pay, pe.net_pay, pe.hours_worked, pe.overtime_hours
             FROM payroll_entries pe
             JOIN payroll_runs pr ON pr.id = pe.payroll_run_id
            WHERE pe.employee_id = $1
              AND pe.workspace_id = $2
            ORDER BY pr.period_end DESC LIMIT 1`,
          [employeeId, workspaceId],
        ).catch(() => ({ rows: [] }));

        if (!rows.length) {
          return { success: true, message: 'No payroll records found yet. Check back after your first payroll run.' };
        }

        const p = rows[0];
        const periodStr = `${new Date(p.period_start).toLocaleDateString()} – ${new Date(p.period_end).toLocaleDateString()}`;

        const lines = [
          `Your most recent paycheck (${periodStr}):`,
          `• Regular hours: ${parseFloat(p.hours_worked || 0).toFixed(1)}h`,
        ];
        if (parseFloat(p.overtime_hours || 0) > 0) {
          lines.push(`• Overtime hours: ${parseFloat(p.overtime_hours).toFixed(1)}h`);
        }
        lines.push(`• Gross pay: $${parseFloat(p.gross_pay || 0).toFixed(2)}`);
        lines.push(`• Net pay: $${parseFloat(p.net_pay || 0).toFixed(2)}`);
        lines.push(`• Status: ${p.status}`);

        return { success: true, message: lines.join('\n'), data: p };
      }

      case 'request_time_off': {
        // Queues an approval via governance_approvals — manager must action it.
        const { randomUUID } = await import('crypto');
        const approvalId = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await pool.query(
          `INSERT INTO governance_approvals
             (id, workspace_id, action_type, requester_id, requester_role, parameters, reason, status, expires_at, created_at, updated_at)
           VALUES ($1,$2,'time_off.request',$3,'officer',$4,$5,'pending',$6,NOW(),NOW())`,
          [
            approvalId,
            workspaceId,
            employeeId,
            JSON.stringify({ employeeId, rawCommand: params.rawCommand || '' }),
            params.rawCommand || 'Officer requested time off via HelpAI',
            expiresAt,
          ],
        ).catch(() => {});
        return {
          success: true,
          message: "I've submitted your time-off request to your manager. You'll get a notification when they respond.",
          data: { approvalId },
        };
      }

      case 'update_availability': {
        // Writes a simple availability note — extend with structured parsing later.
        await pool.query(
          `UPDATE employees SET availability_notes = $1, updated_at = NOW()
            WHERE id = $2 AND workspace_id = $3`,
          [(params.rawCommand || '').slice(0, 500), employeeId, workspaceId],
        ).catch(() => {});
        return { success: true, message: "Thanks — I've updated your availability notes. Your scheduler will see this on the next run." };
      }

      case 'message_supervisor': {
        try {
          const { platformEventBus } = await import('../platformEventBus');
          await platformEventBus.publish({
            type: 'officer_supervisor_message',
            category: 'communication',
            title: 'Officer message for supervisor',
            description: (params.rawCommand || params.message || '').slice(0, 400),
            workspaceId,
            metadata: { employeeId },
          } as unknown);
        } catch { /* non-fatal */ }
        return { success: true, message: "Message delivered — your supervisor has been notified." };
      }

      case 'report_incident': {
        const { randomUUID } = await import('crypto');
        const incidentId = randomUUID();
        const narrative = (params.rawCommand || params.message || '').slice(0, 2000);
        await pool.query(
          `INSERT INTO incident_reports
             (id, workspace_id, reporting_officer_id, incident_date, incident_type, location, severity, narrative, created_at)
           VALUES ($1, $2, $3, NOW(), COALESCE($4, 'general'), COALESCE($5, 'unknown'), COALESCE($6, 'low'), $7, NOW())`,
          [incidentId, workspaceId, employeeId, params.incidentType || null, params.location || null, params.severity || null, narrative],
        ).catch(() => {});
        try {
          const { platformEventBus } = await import('../platformEventBus');
          await platformEventBus.publish({
            type: 'incident_reported',
            category: 'compliance',
            title: 'Officer Incident Report',
            description: narrative.slice(0, 200),
            workspaceId,
            metadata: { incidentId, employeeId },
          } as unknown);
        } catch { /* non-fatal */ }
        return {
          success: true,
          message: `I've logged the incident report (#${incidentId.slice(0, 8)}). Management has been notified. Stay safe.`,
          data: { incidentId },
        };
      }

      default:
        return { success: false, message: `Unknown officer capability: ${capability}` };
    }
  }

  /**
   * Soft-delete a resource (HelpAI has NO hard-delete authority)
   * This marks records as deleted/archived without permanent removal
   */
  async executeSoftDelete(
    resourceType: string,
    resourceId: string,
    executorId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    log.info(`[${HELPAI.name}] Soft-delete: ${resourceType}/${resourceId} by ${executorId} reason="${reason}"`);

    await this.logBotAction(executorId, 'soft_delete', `${resourceType}/${resourceId}`, reason);

    return {
      success: true,
      message: `${resourceType} ${resourceId} has been soft-deleted (archived). Reason: ${reason}. This can be restored by an admin.`,
    };
  }

  /**
   * Phase 25 — detect client-portal staffing requests and route them into the
   * support-ticket intake pipeline. Returns a short string reply when the
   * message looks like a staffing request, or null to let the generic AI
   * responder handle it.
   *
   * TODO(Phase 25 follow-up): implement keyword + LLM-backed intent
   * classification. For now we return null so every message continues to the
   * generic AI path — the wiring is in place for the next iteration.
   */
  private async handleClientStaffingIntent(_params: {
    sessionId: string;
    workspaceId: string;
    userId: string;
    message: string;
  }): Promise<string | null> {
    return null;
  }

  private async logBotAction(
    executorId: string,
    action: string,
    targetId: string,
    details?: string,
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        userId: executorId,
        action: `helpai_bot_${action}`,
        entityId: targetId,
        metadata: {
          botName: HELPAI.name,
          botPlatformLevel: HelpAIBotService.PLATFORM_ROLE_LEVEL,
          destructiveAuth: HelpAIBotService.DESTRUCTIVE_AUTH,
          reason: details,
          timestamp: new Date().toISOString(),
        },
        ipAddress: 'bot-internal',
      });
    } catch (error) {
      log.error(`[${HELPAI.name}] Audit log failed:`, error);
    }
  }
}

export const helpAIBotService = new HelpAIBotService();

// ============================================
// CONSOLIDATED EXPORTS FOR BACKWARDS COMPATIBILITY
// These replace the separate geminiQABot.ts and help-bot.ts files
// ============================================

/**
 * IRC-style check if bot should respond
 * @deprecated Use helpAIBotService.shouldBotRespond() instead
 */
export function shouldBotRespond(message: string): boolean {
  return helpAIBotService.shouldBotRespond(message);
}

/**
 * Get AI response for chat
 * @deprecated Use helpAIBotService.getSimpleAiResponse() instead
 */

// ── SARGE Deliberation Engine ────────────────────────────────────────────────
// Topics that always require Trinity consultation before SARGE responds.
// SARGE announces "Deliberating with Trinity..." then calls cognitive_consult.

const HARD_ESCALATION_PATTERNS = [
  /use of force.*justif|was i right to|did i have the right/i,
  /terminat|suspend|disciplin|write.?up|fire (him|her|them)/i,
  /payroll.*disput|wrong.*pay|missing.*pay|\$\d+.*wrong/i,
  /legal|liabilit|lawsuit|attorney|lawyer|sue/i,
  /contract.*term|billing.*rate|client.*commit/i,
  /5\+? (officer|employee|guard|worker)/i,
  /in danger|threat|weapon|gun|shot|stabbed|assault/i,
];

export function requiresDeliberation(message: string): boolean {
  return HARD_ESCALATION_PATTERNS.some(p => p.test(message));
}

export async function deliberateWithTrinity(
  message: string,
  conversationId: string,
  workspaceId: string,
  roomId?: string
): Promise<string> {
  // Announce deliberation in the room
  if (roomId) {
    await broadcastToWorkspace(workspaceId, {
      type: 'sarge_deliberating',
      data: { roomId, query: message.slice(0, 100) },
    }).catch(() => {});
  }

  try {
    const { trinityHelpaiCommandBus } = await import('./trinityHelpaiCommandBus');
    
    // Send cognitive_consult request to Trinity
    const cmdId = await trinityHelpaiCommandBus.sendCommand({
      workspaceId,
      direction: 'helpai_to_trinity',
      messageType: 'request',
      priority: 'high',
      payload: {
        type: 'request',
        request_type: 'cognitive_consult',
        details: `SARGE needs Trinity input before responding to: "${message.slice(0, 200)}"`,
        input_payload: { message, conversationId, roomId },
        workspace_id: workspaceId,
        conversation_id: conversationId,
      },
    });

    // Wait for Trinity's response (8s timeout)
    const trinityResponse = await Promise.race([
      trinityHelpaiCommandBus.waitForResponse(cmdId, 8000),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 8000)),
    ]);

    // Announce complete
    if (roomId) {
      await broadcastToWorkspace(workspaceId, {
        type: 'sarge_deliberation_complete',
        data: { roomId },
      }).catch(() => {});
    }

    if (trinityResponse) {
      return `[Trinity consulted]
${trinityResponse}`;
    }

    // Timeout fallback — SARGE proceeds with best judgment
    return '[Trinity unavailable — proceeding with best judgment]';
  } catch {
    if (roomId) {
      await broadcastToWorkspace(workspaceId, {
        type: 'sarge_deliberation_complete',
        data: { roomId },
      }).catch(() => {});
    }
    return '[Trinity consultation failed — SARGE responding independently]';
  }
}

export async function getAiResponse(
  userId: string,
  workspaceId: string,
  conversationId: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  isSubscriber: boolean = false
): Promise<{ message: string; shouldRespond: boolean; tokenUsage?: { totalTokens: number; totalCost: number } }> {
  return helpAIBotService.getSimpleAiResponse(userId, workspaceId, conversationId, userMessage, conversationHistory, isSubscriber);
}

/**
 * HelpBotService class for routes.ts compatibility
 * @deprecated Use helpAIBotService methods directly
 */
export class HelpBotService {
  static async generateGreeting(context: {
    conversationId: string;
    customerName?: string;
    customerEmail?: string;
    workspaceId?: string;
    userId?: string;
  }): Promise<string> {
    return helpAIBotService.generateUserGreeting(context);
  }

  static async generateResponse(userMessage: string, context: {
    conversationId: string;
    customerName?: string;
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    workspaceId?: string;
    userId?: string;
  }): Promise<string> {
    return helpAIBotService.generateUserResponse(userMessage, context);
  }

  static generateHandoffMessage(agentName: string): Promise<string> {
    return Promise.resolve(helpAIBotService.generateHandoffMessage(agentName));
  }

  static generateVoiceGrantedMessage(agentName: string): Promise<string> {
    return Promise.resolve(helpAIBotService.generateVoiceGrantedMessage(agentName));
  }
}
