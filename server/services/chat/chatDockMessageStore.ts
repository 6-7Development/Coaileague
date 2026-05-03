import { and, asc, desc, eq, lt, sql } from 'drizzle-orm';
import { chatConversations, chatMessages, messageReadReceipts, roomSequenceNumbers } from '@shared/schema';
import { gt } from 'drizzle-orm';
import type {
  ChatDockActorType,
  ChatDockAttachment,
  ChatDockMessageEnvelope,
  ChatDockMessageType,
} from './chatDockEventProtocol';

export interface ChatDockMessageDraft {
  workspaceId?: string | null;
  conversationId: string;
  senderId?: string | null;
  senderName: string;
  senderType: ChatDockActorType | string;
  message: string;
  messageType?: ChatDockMessageType | string;
  recipientId?: string | null;
  parentMessageId?: string | null;
  threadId?: string | null;
  mentions?: string[];
  attachment?: ChatDockAttachment | null;
  isPrivateMessage?: boolean;
  isSystemMessage?: boolean;
  visibleToStaffOnly?: boolean;
  uiComponent?: {
    type: string;
    props: Record<string, unknown>;
    version: number;
  } | null;
}

export interface ChatDockMessageQuery {
  workspaceId?: string | null;
  conversationId: string;
  before?: Date;
  limit?: number;
  includeDeleted?: boolean;
  sort?: 'asc' | 'desc';
  afterSeqNum?: number; // Wave 5: reconnect replay — fetch messages after this seq
}

export interface ChatDockReadReceiptInput {
  messageId: string;
  conversationId: string;
  readerId: string;
  readAt?: Date;
}

export interface ChatDockMessageStore {
  appendMessage(draft: ChatDockMessageDraft): Promise<ChatDockMessageEnvelope>;
  listMessages(query: ChatDockMessageQuery): Promise<ChatDockMessageEnvelope[]>;
  markMessageRead(input: ChatDockReadReceiptInput): Promise<void>;
  softDeleteForEveryone(messageId: string, actorId: string, deletedAt?: Date): Promise<void>;
}

export type ChatDockDrizzleDb = {
  insert: (table: unknown) => any;
  select: (fields?: unknown) => any;
  update: (table: unknown) => any;
};

const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 200;

export class DrizzleChatDockMessageStore implements ChatDockMessageStore {
  constructor(private readonly db: ChatDockDrizzleDb) {}

  async appendMessage(draft: ChatDockMessageDraft): Promise<ChatDockMessageEnvelope> {
    const [row] = await this.db
      .insert(chatMessages)
      .values({
        workspaceId: draft.workspaceId ?? null,
        conversationId: draft.conversationId,
        senderId: draft.senderId ?? null,
        senderName: draft.senderName,
        senderType: draft.senderType,
        message: draft.message,
        messageType: draft.messageType ?? 'text',
        recipientId: draft.recipientId ?? null,
        parentMessageId: draft.parentMessageId ?? null,
        threadId: draft.threadId ?? draft.parentMessageId ?? null,
        mentions: draft.mentions ?? [],
        attachmentUrl: draft.attachment?.url ?? null,
        attachmentName: draft.attachment?.name ?? null,
        uiComponent: draft.uiComponent ?? null,
        attachmentType: draft.attachment?.type ?? null,
        attachmentSize: draft.attachment?.size ?? null,
        attachmentThumbnail: draft.attachment?.thumbnailUrl ?? null,
        isPrivateMessage: draft.isPrivateMessage ?? false,
        isSystemMessage: draft.isSystemMessage ?? false,
        visibleToStaffOnly: draft.visibleToStaffOnly ?? false,
      })
      .returning();

    await this.db
      .update(chatConversations)
      .set({
        lastMessageAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(chatConversations.id, draft.conversationId));

    return toChatDockMessageEnvelope(row);
  }

  async listMessages(query: ChatDockMessageQuery): Promise<ChatDockMessageEnvelope[]> {
    const limit = normalizeLimit(query.limit);
    const conditions = [eq(chatMessages.conversationId, query.conversationId)];

    if (query.workspaceId) {
      conditions.push(eq(chatMessages.workspaceId, query.workspaceId));
    }
    if (query.before) {
      conditions.push(lt(chatMessages.createdAt, query.before));
    }
    if (!query.includeDeleted) {
      conditions.push(eq(chatMessages.isDeletedForEveryone, false));
    }

    const orderBy = query.sort === 'asc'
      ? asc(chatMessages.createdAt)
      : desc(chatMessages.createdAt);

    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit);

    return rows.map(toChatDockMessageEnvelope);
  }

  async markMessageRead(input: ChatDockReadReceiptInput): Promise<void> {
    const readAt = input.readAt ?? new Date();

    await this.db
      .insert(messageReadReceipts)
      .values({
        messageId: input.messageId,
        userId: input.readerId,
        readAt,
      })
      .onConflictDoUpdate({
        target: [messageReadReceipts.messageId, messageReadReceipts.userId],
        set: { readAt },
      });

    await this.db
      .update(chatMessages)
      .set({
        isRead: true,
        readAt,
        updatedAt: sql`now()`,
      })
      .where(and(
        eq(chatMessages.id, input.messageId),
        eq(chatMessages.conversationId, input.conversationId),
      ));
  }

  async softDeleteForEveryone(messageId: string, actorId: string, deletedAt: Date = new Date()): Promise<void> {
    await this.db
      .update(chatMessages)
      .set({
        isDeletedForEveryone: true,
        deletedForEveryoneAt: deletedAt,
        deletedForEveryoneBy: actorId,
        updatedAt: sql`now()`,
      })
      .where(eq(chatMessages.id, messageId));
  }
}

export class UnconfiguredChatDockMessageStore implements ChatDockMessageStore {
  async appendMessage(): Promise<ChatDockMessageEnvelope> {
    throw new Error('ChatDock message store is not configured with a durable database adapter.');
  }

  async listMessages(): Promise<ChatDockMessageEnvelope[]> {
    throw new Error('ChatDock message store is not configured with a durable database adapter.');
  }

  async markMessageRead(): Promise<void> {
    throw new Error('ChatDock message store is not configured with a durable database adapter.');
  }

  async softDeleteForEveryone(): Promise<void> {
    throw new Error('ChatDock message store is not configured with a durable database adapter.');
  }
}

export function createChatDockMessageStore(db: ChatDockDrizzleDb): ChatDockMessageStore {
  return new DrizzleChatDockMessageStore(db);
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_MESSAGE_LIMIT;
  return Math.max(1, Math.min(Math.trunc(limit as number), MAX_MESSAGE_LIMIT));
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toChatDockMessageEnvelope(row: typeof chatMessages.$inferSelect): ChatDockMessageEnvelope {
  const attachment = row.attachmentUrl
    ? {
        url: row.attachmentUrl,
        name: row.attachmentName,
        type: row.attachmentType,
        size: row.attachmentSize,
        thumbnailUrl: row.attachmentThumbnail,
      }
    : null;

  return {
    id: row.id,
    workspaceId: row.workspaceId ?? null,
    conversationId: row.conversationId,
    senderId: row.senderId ?? null,
    senderName: row.senderName,
    senderType: row.senderType,
    message: row.message,
    messageType: row.messageType ?? 'text',
    recipientId: row.recipientId ?? null,
    parentMessageId: row.parentMessageId ?? null,
    threadId: row.threadId ?? null,
    mentions: row.mentions ?? [],
    attachment,
    isPrivateMessage: row.isPrivateMessage ?? false,
    isSystemMessage: row.isSystemMessage ?? false,
    isEdited: row.isEdited ?? false,
    isDeletedForEveryone: row.isDeletedForEveryone ?? false,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt),
  };
}

// ── Wave 5 / Task 2: Sequence-number-based reconnect replay ──────────────────

/**
 * listMessagesSince — returns messages in a conversation with seqNum > afterSeqNum.
 * Used by ChatDock clients to catch up after a WebSocket reconnection (e.g.,
 * after a guard walks into an elevator and loses 5G for 30 seconds).
 *
 * The client stores its last-seen seqNum in localStorage. On reconnect it sends:
 *   { type: 'catch_up', conversationId, afterSeqNum: lastSeenSeqNum }
 * The server calls listMessagesSince() and delivers the gap.
 */
export async function listMessagesSince(
  db: ChatDockDrizzleDb,
  conversationId: string,
  afterSeqNum: number,
  limit = 200,
): Promise<import('@shared/schema').ChatMessage[]> {
  const { gt: gtFn, and: andFn, eq: eqFn, asc: ascFn } = await import('drizzle-orm');
  const { chatMessages: cm } = await import('@shared/schema');

  return db
    .select()
    .from(cm)
    .where(
      andFn(
        eqFn(cm.conversationId, conversationId),
        gtFn(cm.seqNum as unknown as import('drizzle-orm').Column, afterSeqNum),
        eqFn(cm.isDeletedForEveryone, false),
      )
    )
    .orderBy(ascFn(cm.seqNum as unknown as import('drizzle-orm').Column))
    .limit(limit) as unknown as Promise<import('@shared/schema').ChatMessage[]>;
}

/**
 * incrementRoomSeq — atomically increments the per-room sequence counter
 * and returns the new seqNum. Call this inside the same transaction as the
 * message insert, then stamp the returned value onto the message row.
 *
 * Uses Postgres upsert: INSERT ... ON CONFLICT (conversation_id) DO UPDATE
 * so the first message in a new room automatically creates the counter row.
 */
export async function incrementRoomSeq(
  db: ChatDockDrizzleDb,
  conversationId: string,
): Promise<number> {
  const { pool } = await import('../../db');
  const result = await pool.query<{ seq_num: string }>(
    `INSERT INTO room_sequence_numbers (conversation_id, seq_num, updated_at)
     VALUES ($1, 1, NOW())
     ON CONFLICT (conversation_id)
     DO UPDATE SET seq_num = room_sequence_numbers.seq_num + 1, updated_at = NOW()
     RETURNING seq_num`,
    [conversationId],
  );
  return parseInt(result.rows[0]?.seq_num ?? '1', 10);
}
