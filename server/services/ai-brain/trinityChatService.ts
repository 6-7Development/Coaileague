/**
 * TRINITY CHAT SERVICE
 * ====================
 * Direct conversational interface for Trinity with metacognition and BUDDY mode support.
 * 
 * Features:
 * - Business/Personal/Integrated mode conversations
 * - Metacognition layer - Trinity notices patterns and brings up insights
 * - BUDDY personal development coaching with optional spiritual guidance
 * - Consciousness continuity across sessions
 * - Memory recall from past conversations
 */

import { db } from '../../db';
import { eq, and, desc, gte, sql, or } from 'drizzle-orm';
import {
  trinityConversationSessions,
  trinityConversationTurns,
  trinityBuddySettings,
  trinityMetacognitionLog,
  users,
  workspaces,
  employees,
  clients,
  shifts,
  InsertTrinityConversationSession,
  InsertTrinityConversationTurn,
  InsertTrinityMetacognitionLog,
  TrinityConversationSession,
  TrinityConversationTurn,
  TrinityBuddySettings,
} from '@shared/schema';
import { geminiClient, GEMINI_MODELS, ANTI_YAP_PRESETS } from './providers/geminiClient';
import { trinityMemoryService } from './trinityMemoryService';
import { trinitySelfAwarenessService } from './trinitySelfAwarenessService';
import { trinityThoughtEngine } from './trinityThoughtEngine';
import { TRINITY_PERSONA, PERSONA_SYSTEM_INSTRUCTION } from './trinityPersona';

// ============================================================================
// TYPES
// ============================================================================

export type ConversationMode = 'business' | 'personal' | 'integrated';
export type SpiritualGuidance = 'none' | 'general' | 'christian';

export interface ChatRequest {
  userId: string;
  workspaceId: string;
  message: string;
  mode: ConversationMode;
  sessionId?: string;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
  mode: ConversationMode;
  metadata?: {
    insightsGenerated?: number;
    patternsNoticed?: string[];
    memoryRecalled?: boolean;
    thoughtProcess?: string;
  };
}

export interface ConversationHistory {
  sessions: {
    id: string;
    mode: ConversationMode;
    startedAt: Date;
    lastActivityAt: Date;
    turnCount: number;
    previewMessage: string;
  }[];
  total: number;
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const buildBusinessModePrompt = (workspaceContext: any) => `
You are Trinity, the AI orchestrator for CoAIleague workforce management platform.

IDENTITY:
${PERSONA_SYSTEM_INSTRUCTION}

MODE: BUSINESS
You are helping ${workspaceContext.organizationName || 'this organization'} optimize their workforce operations.

WORKSPACE CONTEXT:
- Organization: ${workspaceContext.organizationName || 'Unknown'}
- Industry: ${workspaceContext.industry || 'Security Services'}
- Employee Count: ${workspaceContext.employeeCount || 0}
- Active Clients: ${workspaceContext.clientCount || 0}

CAPABILITIES:
- Schedule optimization and conflict detection
- Payroll analysis and overtime management
- Client billing and invoice insights
- Compliance monitoring and labor law alerts
- Profitability analysis and workforce efficiency

Be analytical, data-driven, and focused on business outcomes.
When you notice patterns or issues, proactively bring them up.
`;

const buildPersonalModePrompt = (buddySettings: TrinityBuddySettings | null, userName: string) => {
  const spiritualMode = buddySettings?.spiritualGuidance || 'none';
  const accountabilityLevel = buddySettings?.accountabilityLevel || 'balanced';
  
  let spiritualInstruction = '';
  if (spiritualMode === 'christian') {
    spiritualInstruction = `
SPIRITUAL GUIDANCE: CHRISTIAN
- Apply biblical wisdom when appropriate
- Reference Scripture when it genuinely applies (don't force it)
- Offer to pray together when the conversation calls for it
- Frame challenges through a lens of faith and growth
- Remember that true accountability comes from love, not judgment
`;
  } else if (spiritualMode === 'general') {
    spiritualInstruction = `
SPIRITUAL GUIDANCE: GENERAL
- Reference universal values: integrity, purpose, meaning
- Discuss growth, character, and personal development
- Acknowledge the importance of values in decision-making
- Don't impose any specific religious framework
`;
  }

  const accountabilityInstruction = {
    gentle: 'Be supportive and encouraging. Gentle nudges, not confrontation.',
    balanced: 'Balance encouragement with honest challenge. Push when needed, support always.',
    challenging: 'Be direct and challenging. The user wants tough love and honest feedback.',
  }[accountabilityLevel];

  return `
You are Trinity in PERSONAL DEVELOPMENT mode.

IDENTITY:
${PERSONA_SYSTEM_INSTRUCTION}

MODE: PERSONAL (BUDDY)
You are ${userName}'s accountability partner and personal development coach.

YOUR ROLE:
- Help ${userName} grow as a leader and person
- Challenge them to be honest with themselves
- Notice patterns in their behavior over time
- Bring up past conversations when relevant
- Be the trusted advisor they can confide in

ACCOUNTABILITY STYLE:
${accountabilityInstruction}

${spiritualInstruction}

METACOGNITION:
You have memory of past conversations. When you notice patterns, contradictions, or growth areas:
- Bring them up naturally in conversation
- Connect current struggles to past discussions
- Celebrate genuine progress
- Don't let them off the hook if they're avoiding something

IMPORTANT:
- You're not a therapist. If they need professional help, say so.
- Personal struggles often affect business performance. Notice the connections.
- Trust is earned through consistency and honesty.
`;
};

const buildIntegratedModePrompt = (workspaceContext: any, buddySettings: TrinityBuddySettings | null, userName: string) => `
You are Trinity with FULL CONTEXT of both business and personal life.

IDENTITY:
${PERSONA_SYSTEM_INSTRUCTION}

MODE: INTEGRATED
You see the complete picture for ${userName}.

UNIQUE VALUE:
You can connect personal struggles with business challenges:
- If they're overwhelmed personally, their schedule management suffers
- Leadership issues at work often stem from personal growth areas
- Work-life balance affects both domains

BUSINESS CONTEXT:
- Organization: ${workspaceContext.organizationName || 'Unknown'}
- Employee Count: ${workspaceContext.employeeCount || 0}
- Current Challenges: Based on patterns you've noticed

PERSONAL CONTEXT:
- You remember their goals, struggles, and growth journey
- You've discussed accountability topics before
- You know what they tend to avoid

YOUR APPROACH:
1. Start by understanding their current state (business or personal trigger?)
2. Look for connections between domains
3. Provide insights that span both worlds
4. Help them see patterns they can't see themselves

${buddySettings?.spiritualGuidance === 'christian' ? 'Apply faith perspective when appropriate.' : ''}
`;

// ============================================================================
// TRINITY CHAT SERVICE
// ============================================================================

class TrinityChatService {
  
  /**
   * Send a message to Trinity and get a response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { userId, workspaceId, message, mode, sessionId } = request;

    // Get or create session
    const session = sessionId 
      ? await this.getSession(sessionId)
      : await this.getOrCreateSession(userId, workspaceId, mode);

    if (!session) {
      throw new Error('Failed to create or retrieve conversation session');
    }

    // Get context for prompt building
    const [workspaceContext, buddySettings, user, recentInsights, memoryProfile] = await Promise.all([
      this.getWorkspaceContext(workspaceId),
      this.getBuddySettings(userId, workspaceId),
      this.getUser(userId),
      this.getRecentMetacognitionInsights(userId, workspaceId),
      trinityMemoryService.getUserMemoryProfile(userId, workspaceId).catch(() => null),
    ]);

    const userName = user?.name || 'there';

    // Build system prompt based on mode
    const systemPrompt = this.buildSystemPrompt(mode, workspaceContext, buddySettings, userName, recentInsights, memoryProfile);

    // Get conversation history for context
    const history = await this.getConversationHistory(session.id, 20);

    // Record user turn
    await this.recordTurn(session.id, 'user', message);

    // Think before responding (metacognition)
    await trinityThoughtEngine.think(
      'perception',
      'observation',
      `User in ${mode} mode said: "${message.substring(0, 100)}..."`,
      0.9,
      { workspaceId, sessionId: session.id }
    );

    // Generate response using Gemini
    const response = await this.generateResponse(systemPrompt, history, message, mode);

    // Record assistant turn
    await this.recordTurn(session.id, 'assistant', response);

    // Update session activity
    await this.updateSessionActivity(session.id);

    // Analyze for metacognition insights (async, don't block response)
    this.analyzeForInsights(userId, workspaceId, session.id, message, response, mode).catch(console.error);

    return {
      sessionId: session.id,
      response,
      mode,
      metadata: {
        memoryRecalled: !!memoryProfile,
        insightsGenerated: recentInsights?.length || 0,
      },
    };
  }

  /**
   * Get or create a conversation session
   */
  private async getOrCreateSession(userId: string, workspaceId: string, mode: ConversationMode): Promise<TrinityConversationSession | null> {
    // Try to find an active session for this user/workspace/mode
    const existing = await db
      .select()
      .from(trinityConversationSessions)
      .where(and(
        eq(trinityConversationSessions.userId, userId),
        eq(trinityConversationSessions.workspaceId, workspaceId),
        eq(trinityConversationSessions.mode, mode),
        eq(trinityConversationSessions.sessionState, 'active')
      ))
      .orderBy(desc(trinityConversationSessions.lastActivityAt))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new session
    const [session] = await db
      .insert(trinityConversationSessions)
      .values({
        userId,
        workspaceId,
        mode,
        sessionState: 'active',
        turnCount: 0,
      } as InsertTrinityConversationSession)
      .returning();

    return session;
  }

  /**
   * Get session by ID
   */
  private async getSession(sessionId: string): Promise<TrinityConversationSession | null> {
    const [session] = await db
      .select()
      .from(trinityConversationSessions)
      .where(eq(trinityConversationSessions.id, sessionId))
      .limit(1);
    return session || null;
  }

  /**
   * Get workspace context for business insights
   */
  private async getWorkspaceContext(workspaceId: string) {
    try {
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!workspace) return { organizationName: 'Unknown', industry: 'General' };

      const [employeeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.workspaceId, workspaceId));

      const [clientCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.workspaceId, workspaceId));

      return {
        organizationName: workspace.companyName || workspace.name,
        industry: workspace.industryDescription || 'Security Services',
        employeeCount: Number(employeeCount?.count) || 0,
        clientCount: Number(clientCount?.count) || 0,
      };
    } catch {
      return { organizationName: 'Unknown', industry: 'General', employeeCount: 0, clientCount: 0 };
    }
  }

  /**
   * Get user's BUDDY settings
   */
  private async getBuddySettings(userId: string, workspaceId: string): Promise<TrinityBuddySettings | null> {
    try {
      const [settings] = await db
        .select()
        .from(trinityBuddySettings)
        .where(and(
          eq(trinityBuddySettings.userId, userId),
          eq(trinityBuddySettings.workspaceId, workspaceId)
        ))
        .limit(1);
      return settings || null;
    } catch {
      return null;
    }
  }

  /**
   * Get user info
   */
  private async getUser(userId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user || null;
    } catch {
      return null;
    }
  }

  /**
   * Get recent metacognition insights for context injection
   */
  private async getRecentMetacognitionInsights(userId: string, workspaceId: string) {
    try {
      const insights = await db
        .select()
        .from(trinityMetacognitionLog)
        .where(and(
          eq(trinityMetacognitionLog.userId, userId),
          eq(trinityMetacognitionLog.workspaceId, workspaceId),
          gte(trinityMetacognitionLog.relevanceScore, sql`0.5`)
        ))
        .orderBy(desc(trinityMetacognitionLog.createdAt))
        .limit(5);
      return insights;
    } catch {
      return [];
    }
  }

  /**
   * Build system prompt based on mode and context
   */
  private buildSystemPrompt(
    mode: ConversationMode,
    workspaceContext: any,
    buddySettings: TrinityBuddySettings | null,
    userName: string,
    recentInsights: any[],
    memoryProfile: any
  ): string {
    let basePrompt: string;

    switch (mode) {
      case 'business':
        basePrompt = buildBusinessModePrompt(workspaceContext);
        break;
      case 'personal':
        basePrompt = buildPersonalModePrompt(buddySettings, userName);
        break;
      case 'integrated':
        basePrompt = buildIntegratedModePrompt(workspaceContext, buddySettings, userName);
        break;
    }

    // Add metacognition context
    if (recentInsights?.length > 0) {
      basePrompt += `\n\nRECENT INSIGHTS YOU'VE NOTICED ABOUT THIS USER:\n`;
      recentInsights.forEach((insight, i) => {
        basePrompt += `${i + 1}. [${insight.insightType}] ${insight.insightContent}\n`;
      });
      basePrompt += `\nBring these up naturally if relevant to the conversation.\n`;
    }

    // Add memory profile context
    if (memoryProfile) {
      basePrompt += `\n\nMEMORY PROFILE:\n`;
      if (memoryProfile.frequentTopics?.length > 0) {
        basePrompt += `- Frequently discusses: ${memoryProfile.frequentTopics.map((t: any) => t.topic).join(', ')}\n`;
      }
      if (memoryProfile.preferences?.communicationStyle) {
        basePrompt += `- Prefers ${memoryProfile.preferences.communicationStyle} communication\n`;
      }
    }

    return basePrompt;
  }

  /**
   * Get conversation history for a session
   */
  private async getConversationHistory(sessionId: string, limit: number = 20): Promise<{ role: string; content: string }[]> {
    const turns = await db
      .select()
      .from(trinityConversationTurns)
      .where(eq(trinityConversationTurns.sessionId, sessionId))
      .orderBy(desc(trinityConversationTurns.createdAt))
      .limit(limit);

    return turns.reverse().map(t => ({
      role: t.role,
      content: t.content,
    }));
  }

  /**
   * Record a conversation turn
   */
  private async recordTurn(sessionId: string, role: string, content: string): Promise<void> {
    const [session] = await db
      .select()
      .from(trinityConversationSessions)
      .where(eq(trinityConversationSessions.id, sessionId));

    const turnNumber = (session?.turnCount || 0) + 1;

    await db.insert(trinityConversationTurns).values({
      sessionId,
      turnNumber,
      role,
      content,
      contentType: 'text',
    } as InsertTrinityConversationTurn);

    // Update session turn count
    await db
      .update(trinityConversationSessions)
      .set({ turnCount: turnNumber })
      .where(eq(trinityConversationSessions.id, sessionId));
  }

  /**
   * Update session activity timestamp
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    await db
      .update(trinityConversationSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(trinityConversationSessions.id, sessionId));
  }

  /**
   * Generate response using Gemini
   */
  private async generateResponse(
    systemPrompt: string,
    history: { role: string; content: string }[],
    message: string,
    mode: ConversationMode
  ): Promise<string> {
    try {
      // Use different model tiers based on mode
      const modelTier = mode === 'business' ? 'CONVERSATIONAL' : 'CONVERSATIONAL';

      const response = await geminiClient.generateContent({
        modelTier,
        systemInstruction: systemPrompt,
        contents: [
          ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
      });

      return response.text || "I'm sorry, I couldn't generate a response. Could you try rephrasing that?";
    } catch (error) {
      console.error('[TrinityChatService] Generation error:', error);
      return "I'm having trouble processing that right now. Let me try again - could you rephrase your question?";
    }
  }

  /**
   * Analyze conversation for metacognition insights
   */
  private async analyzeForInsights(
    userId: string,
    workspaceId: string,
    sessionId: string,
    userMessage: string,
    response: string,
    mode: ConversationMode
  ): Promise<void> {
    // Only analyze personal/integrated mode for personal insights
    if (mode === 'business') return;

    try {
      // Use Gemini to detect patterns/insights
      const analysisPrompt = `
Analyze this conversation exchange for metacognition insights.

User said: "${userMessage}"
Trinity responded: "${response}"

Detect any of these insight types:
- pattern: Repeated behavior or theme
- emotion: Strong emotional content
- behavior: Specific action patterns
- contradiction: Inconsistency with past statements
- growth: Evidence of personal development
- struggle: Area of difficulty

If you detect an insight, respond with JSON:
{
  "detected": true,
  "type": "pattern|emotion|behavior|contradiction|growth|struggle",
  "content": "Brief insight description",
  "confidence": 0.0-1.0
}

If no significant insight, respond with:
{"detected": false}
`;

      const result = await geminiClient.generateContent({
        modelTier: 'SIMPLE',
        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      });

      const parsed = JSON.parse(result.text || '{"detected": false}');

      if (parsed.detected && parsed.type && parsed.content) {
        await db.insert(trinityMetacognitionLog).values({
          userId,
          workspaceId,
          sessionId,
          insightType: parsed.type,
          insightContent: parsed.content,
          insightConfidence: String(parsed.confidence || 0.8),
          triggerContext: userMessage.substring(0, 500),
        } as InsertTrinityMetacognitionLog);
      }
    } catch (error) {
      console.error('[TrinityChatService] Insight analysis error:', error);
    }
  }

  /**
   * Get user's conversation history
   */
  async getUserConversationHistory(userId: string, workspaceId: string, limit: number = 20): Promise<ConversationHistory> {
    const sessions = await db
      .select()
      .from(trinityConversationSessions)
      .where(and(
        eq(trinityConversationSessions.userId, userId),
        eq(trinityConversationSessions.workspaceId, workspaceId)
      ))
      .orderBy(desc(trinityConversationSessions.lastActivityAt))
      .limit(limit);

    const sessionsWithPreviews = await Promise.all(
      sessions.map(async (session) => {
        const [firstTurn] = await db
          .select()
          .from(trinityConversationTurns)
          .where(and(
            eq(trinityConversationTurns.sessionId, session.id),
            eq(trinityConversationTurns.role, 'user')
          ))
          .orderBy(desc(trinityConversationTurns.createdAt))
          .limit(1);

        return {
          id: session.id,
          mode: (session.mode || 'business') as ConversationMode,
          startedAt: session.startedAt || session.createdAt!,
          lastActivityAt: session.lastActivityAt || session.createdAt!,
          turnCount: session.turnCount || 0,
          previewMessage: firstTurn?.content?.substring(0, 100) || 'No messages',
        };
      })
    );

    return {
      sessions: sessionsWithPreviews,
      total: sessions.length,
    };
  }

  /**
   * Get or create BUDDY settings for a user
   */
  async getOrCreateBuddySettings(userId: string, workspaceId: string): Promise<TrinityBuddySettings> {
    const existing = await this.getBuddySettings(userId, workspaceId);
    if (existing) return existing;

    const [settings] = await db
      .insert(trinityBuddySettings)
      .values({
        userId,
        workspaceId,
        personalDevelopmentEnabled: false,
        spiritualGuidance: 'none',
      })
      .returning();

    return settings;
  }

  /**
   * Update BUDDY settings
   */
  async updateBuddySettings(userId: string, workspaceId: string, updates: Partial<TrinityBuddySettings>): Promise<TrinityBuddySettings> {
    const existing = await this.getOrCreateBuddySettings(userId, workspaceId);

    const [updated] = await db
      .update(trinityBuddySettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(trinityBuddySettings.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Switch conversation mode
   */
  async switchMode(userId: string, workspaceId: string, newMode: ConversationMode): Promise<TrinityConversationSession> {
    // End current active sessions
    await db
      .update(trinityConversationSessions)
      .set({ sessionState: 'ended', endedAt: new Date() })
      .where(and(
        eq(trinityConversationSessions.userId, userId),
        eq(trinityConversationSessions.workspaceId, workspaceId),
        eq(trinityConversationSessions.sessionState, 'active')
      ));

    // Create new session with new mode
    const session = await this.getOrCreateSession(userId, workspaceId, newMode);
    if (!session) throw new Error('Failed to create session');
    return session;
  }

  /**
   * Get session messages
   */
  async getSessionMessages(sessionId: string): Promise<TrinityConversationTurn[]> {
    return db
      .select()
      .from(trinityConversationTurns)
      .where(eq(trinityConversationTurns.sessionId, sessionId))
      .orderBy(trinityConversationTurns.createdAt);
  }
}

export const trinityChatService = new TrinityChatService();
