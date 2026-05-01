/**
 * CHAT INTERVIEW SERVICE
 * Phase 58 — Trinity Interview Pipeline
 *
 * Stub helpers for chat-interview / voice-interview endpoints.
 * Real DockChat copilot integration lives in `dockChatRouter` + websocket layer;
 * these helpers persist sessions, derive room metadata, and return the
 * minimum payload the routes contract on. Expand here when adding deep
 * Trinity-driven analysis or voice transcription.
 */

import { db } from '../../db';
import { candidateInterviewSessions, interviewCandidates, type InterviewCandidate } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';

const log = createLogger('ChatInterviewService');

export interface ChatInterviewRoomResult {
  sessionId: string;
  chatRoomId: string;
  recruiterUserIds: string[];
}

export async function createChatInterviewRoom(
  candidate: InterviewCandidate,
  workspaceId: string,
  recruiterUserIds: string[],
): Promise<ChatInterviewRoomResult> {
  // Reuse existing chatRoomId or mint a fresh one keyed off the candidate
  const chatRoomId = candidate.chatRoomId || `interview-room-${candidate.id}`;

  const [session] = await db.insert(candidateInterviewSessions).values({
    workspaceId,
    candidateId: candidate.id,
    sessionType: 'chat_interview',
    chatRoomId,
    status: 'in_progress',
    startedAt: new Date(),
  }).returning();

  if (!candidate.chatRoomId) {
    await db.update(interviewCandidates)
      .set({ chatRoomId, updatedAt: new Date() })
      .where(and(
        eq(interviewCandidates.id, candidate.id),
        eq(interviewCandidates.workspaceId, workspaceId),
      ));
  }

  log.info(`[ChatInterview] Room ready candidate=${candidate.id} room=${chatRoomId} session=${session.id}`);
  return { sessionId: session.id, chatRoomId, recruiterUserIds };
}

export async function getCopilotEvents(_chatRoomId: string, _workspaceId: string): Promise<unknown[]> {
  // Real implementation will tail DockChat copilot events; return empty array
  // so the UI renders a clean empty state until that pipeline is online.
  return [];
}

export async function analyzeChatResponse(
  sessionId: string,
  workspaceId: string,
  candidateId: string,
  _chatRoomId: string,
  _messageContent: string,
): Promise<void> {
  // Persist a heartbeat on the session so the UI sees activity. Trinity
  // sentiment / scoring runs out-of-band — this keeps the API contract
  // stable without blocking the request on AI latency.
  await db.update(candidateInterviewSessions)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(candidateInterviewSessions.id, sessionId),
      eq(candidateInterviewSessions.workspaceId, workspaceId),
      eq(candidateInterviewSessions.candidateId, candidateId),
    ));
}

export async function closeChatInterviewSession(
  sessionId: string,
  workspaceId: string,
): Promise<{ sessionId: string; status: 'completed' }> {
  await db.update(candidateInterviewSessions)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(candidateInterviewSessions.id, sessionId),
      eq(candidateInterviewSessions.workspaceId, workspaceId),
    ));
  return { sessionId, status: 'completed' };
}

export interface VoiceInterviewSessionResult {
  sessionId: string;
  candidateId: string;
}

export async function createVoiceInterviewSession(
  candidate: InterviewCandidate,
  workspaceId: string,
): Promise<VoiceInterviewSessionResult> {
  const [session] = await db.insert(candidateInterviewSessions).values({
    workspaceId,
    candidateId: candidate.id,
    sessionType: 'voice_interview',
    status: 'in_progress',
    startedAt: new Date(),
  }).returning();
  return { sessionId: session.id, candidateId: candidate.id };
}
