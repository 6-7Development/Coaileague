/**
 * Unread Message Service - Optimized unread message counting
 * Caches unread counts to avoid expensive queries
 */

import { db } from "../db";
import { chatMessages } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

const unreadCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get unread message count for a conversation (optimized with caching)
 */
export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const cacheKey = `${conversationId}:${userId}`;
  const cached = unreadCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count;
  }

  const unreadCount = await db
    .select()
    .from(chatMessages)
    .where(and(
      eq(chatMessages.conversationId, conversationId),
      isNull(chatMessages.readAt),
      // Exclude user's own messages from unread count
      (db) => db.sql`sender_id != ${userId}`
    ));

  const count = unreadCount.length;

  // Cache the result
  unreadCache.set(cacheKey, { count, timestamp: Date.now() });

  return count;
}

/**
 * Get total unread messages across all conversations for a user
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  // Check cache first for total
  const cacheKey = `total:${userId}`;
  const cached = unreadCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count;
  }

  const unreadMessages = await db
    .select()
    .from(chatMessages)
    .where(and(
      isNull(chatMessages.readAt),
      (db) => db.sql`sender_id != ${userId}`
    ));

  const count = unreadMessages.length;
  unreadCache.set(cacheKey, { count, timestamp: Date.now() });

  return count;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  await db
    .update(chatMessages)
    .set({ readAt: new Date() })
    .where(and(
      eq(chatMessages.conversationId, conversationId),
      isNull(chatMessages.readAt)
    ));

  // Invalidate cache
  const cacheKey = `${conversationId}:${userId}`;
  unreadCache.delete(cacheKey);
  unreadCache.delete(`total:${userId}`);
}

/**
 * Invalidate cache for a conversation (call after sending/receiving messages)
 */
export function invalidateCache(conversationId: string, userId?: string): void {
  if (userId) {
    unreadCache.delete(`${conversationId}:${userId}`);
    unreadCache.delete(`total:${userId}`);
  } else {
    // Invalidate all entries for this conversation
    const keysToDelete: string[] = [];
    unreadCache.forEach((_, key) => {
      if (key.startsWith(conversationId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => unreadCache.delete(key));
  }
}

export const unreadMessageService = {
  getUnreadCount,
  getTotalUnreadCount,
  markMessagesAsRead,
  invalidateCache,
};
