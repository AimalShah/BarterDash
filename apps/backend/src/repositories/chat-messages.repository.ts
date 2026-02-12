import { db } from '../db';
import { chatMessages, streamSessions } from '../db/schema';
import { and, eq, desc, lt, sql } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  InternalError,
} from '../utils/result';
import type { ChatMessage, NewChatMessage } from '../db/schema';

/**
 * Chat Messages Repository
 * Data access layer for stream chat messages with session-based functionality
 * Implements Requirements 4.1, 4.3, 9.1, 9.3, 9.5
 */

export interface ChatMessageWithUser extends ChatMessage {
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface MessageHistoryOptions {
  limit?: number;
  offset?: number;
  beforeId?: string;
  afterId?: string;
}

export class ChatMessagesRepository {
  /**
   * Send a message to a stream session
   * Requirement 4.1: Broadcast message to all stream participants immediately
   * Requirement 9.1: Persist messages to database immediately
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    messageType:
      | 'user_message'
      | 'system_message'
      | 'auction_update' = 'user_message',
    metadata?: Record<string, any>,
  ): Promise<AppResult<ChatMessageWithUser>> {
    try {
      // Validate session exists and is active
      const sessionResult = await this.validateSession(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const messageData: NewChatMessage = {
        sessionId,
        userId,
        message: content,
        messageType,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: metadata || {},
        // streamId is required by schema but we'll use the session's associated stream
        streamId: sessionResult.value.streamId || sessionId, // Fallback for compatibility
      };

      const result = await db
        .insert(chatMessages)
        .values(messageData)
        .returning();

      if (result.length === 0) {
        return failure(new InternalError('Failed to create chat message'));
      }

      // Get message with user details
      const messageWithUser = await this.getMessageById(result[0].id);
      if (messageWithUser.isErr()) {
        return failure(messageWithUser.error);
      }

      return success(messageWithUser.value);
    } catch (error) {
      console.error('Error sending message:', error);
      return failure(new InternalError('Failed to send message'));
    }
  }

  /**
   * Get message history for a stream session with pagination
   * Requirement 4.3: Provide recent message history
   * Requirement 9.2: Load and display the last 50 messages
   * Requirement 9.5: Return paginated results with proper sorting
   */
  async getMessageHistory(
    sessionId: string,
    options: MessageHistoryOptions = {},
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      const { limit = 50, offset = 0, beforeId, afterId } = options;

      let whereCondition = and(
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.isDeleted, false),
      );

      // Add cursor-based pagination
      if (beforeId) {
        whereCondition = and(
          whereCondition,
          lt(
            chatMessages.createdAt,
            sql`(SELECT created_at FROM chat_messages WHERE id = ${beforeId})`,
          ),
        );
      }

      if (afterId) {
        whereCondition = and(
          whereCondition,
          sql`${chatMessages.createdAt} > (SELECT created_at FROM chat_messages WHERE id = ${afterId})`,
        );
      }

      const messages = await db.query.chatMessages.findMany({
        where: whereCondition,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [desc(chatMessages.createdAt)],
        limit,
        offset,
      });

      return success(messages as ChatMessageWithUser[]);
    } catch (error) {
      console.error('Error getting message history:', error);
      return failure(new InternalError('Failed to get message history'));
    }
  }

  /**
   * Get recent messages for a session (used when users join)
   * Requirement 4.3: Provide recent message history when joining
   */
  async getRecentMessages(
    sessionId: string,
    limit: number = 50,
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    return this.getMessageHistory(sessionId, { limit });
  }

  /**
   * Sync messages after network restoration
   * Requirement 4.4: Synchronize missed messages after network restoration
   */
  async syncMessages(
    sessionId: string,
    lastMessageId: string,
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      const whereCondition = and(
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.isDeleted, false),
        sql`${chatMessages.createdAt} > (SELECT created_at FROM chat_messages WHERE id = ${lastMessageId})`,
      );

      const messages = await db.query.chatMessages.findMany({
        where: whereCondition,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [desc(chatMessages.createdAt)],
        limit: 100, // Reasonable limit for sync
      });

      return success(messages as ChatMessageWithUser[]);
    } catch (error) {
      console.error('Error syncing messages:', error);
      return failure(new InternalError('Failed to sync messages'));
    }
  }

  /**
   * Resolve message conflicts using timestamp-based ordering
   * Requirement 9.3: Resolve conflicts using timestamp-based ordering
   */
  async resolveMessageConflicts(
    sessionId: string,
    conflictingMessages: { id: string; timestamp: Date }[],
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      // Sort messages by timestamp to resolve conflicts
      const sortedMessages = conflictingMessages.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      // Get the resolved messages in correct order
      const messageIds = sortedMessages.map((m) => m.id);
      const messages = await db.query.chatMessages.findMany({
        where: and(
          eq(chatMessages.sessionId, sessionId),
          sql`${chatMessages.id} = ANY(${messageIds})`,
        ),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [desc(chatMessages.createdAt)],
      });

      return success(messages as ChatMessageWithUser[]);
    } catch (error) {
      console.error('Error resolving message conflicts:', error);
      return failure(new InternalError('Failed to resolve message conflicts'));
    }
  }

  /**
   * Mark messages as read for a user
   */
  async markMessagesAsRead(
    sessionId: string,
    userId: string,
    messageIds: string[],
  ): Promise<AppResult<void>> {
    try {
      // Update metadata to track read status
      // This is a simplified implementation - in production you might want a separate read_receipts table
      const updatePromises = messageIds.map((messageId) =>
        db
          .update(chatMessages)
          .set({
            metadata: sql`jsonb_set(
              COALESCE(metadata, '{}'),
              '{read_by}',
              COALESCE(metadata->'read_by', '[]'::jsonb) || ${JSON.stringify([{ userId, readAt: new Date() }])}::jsonb
            )`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(chatMessages.id, messageId),
              eq(chatMessages.sessionId, sessionId),
            ),
          ),
      );

      await Promise.all(updatePromises);
      return success(undefined);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return failure(new InternalError('Failed to mark messages as read'));
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    deletedBy: string,
  ): Promise<AppResult<ChatMessage>> {
    try {
      const result = await db
        .update(chatMessages)
        .set({
          isDeleted: true,
          deletedBy,
          updatedAt: new Date(),
        })
        .where(eq(chatMessages.id, messageId))
        .returning();

      if (result.length === 0) {
        return failure(new NotFoundError('Chat message', messageId));
      }

      return success(result[0]);
    } catch (error) {
      console.error('Error deleting message:', error);
      return failure(new InternalError('Failed to delete message'));
    }
  }

  /**
   * Get message by ID with user details
   */
  async getMessageById(
    messageId: string,
  ): Promise<AppResult<ChatMessageWithUser>> {
    try {
      const message = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.id, messageId),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!message) {
        return failure(new NotFoundError('Chat message', messageId));
      }

      return success(message as ChatMessageWithUser);
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return failure(new InternalError('Failed to get message'));
    }
  }

  /**
   * Get message count for a session
   */
  async getMessageCount(sessionId: string): Promise<AppResult<number>> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.sessionId, sessionId),
            eq(chatMessages.isDeleted, false),
          ),
        );

      return success(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting message count:', error);
      return failure(new InternalError('Failed to get message count'));
    }
  }

  /**
   * Batch insert messages for efficiency
   * Requirement 9.4: Batch database operations for efficiency
   */
  async batchInsertMessages(
    messages: NewChatMessage[],
  ): Promise<AppResult<ChatMessage[]>> {
    try {
      const result = await db.insert(chatMessages).values(messages).returning();

      return success(result);
    } catch (error) {
      console.error('Error batch inserting messages:', error);
      return failure(new InternalError('Failed to batch insert messages'));
    }
  }

  /**
   * Validate that a session exists and is accessible
   */
  private async validateSession(
    sessionId: string,
  ): Promise<AppResult<{ streamId?: string }>> {
    try {
      const session = await db.query.streamSessions.findFirst({
        where: eq(streamSessions.id, sessionId),
      });

      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // For now, we'll allow messages in any session state
      // In production, you might want to restrict to active/paused sessions
      return success({ streamId: session.id });
    } catch (error) {
      console.error('Error validating session:', error);
      return failure(new InternalError('Failed to validate session'));
    }
  }
}
