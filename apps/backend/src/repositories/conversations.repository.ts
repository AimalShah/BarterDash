import { eq, desc, sql } from 'drizzle-orm';
import { db, conversations } from '../db';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

export class ConversationsRepository {
  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    participantIds: string[],
  ): Promise<AppResult<any>> {
    try {
      if (participantIds.length !== 2) {
        return failure(
          new ValidationError('Conversations must have exactly 2 participants'),
        );
      }

      // Order IDs to ensure consistency
      const sortedIds = [...participantIds].sort();

      // Check if conversation already exists
      // Use array comparison - check if both participants are in the array
      const existing = await db.query.conversations.findFirst({
        where: sql`${sortedIds[0]} = ANY(${conversations.participantIds}) AND ${sortedIds[1]} = ANY(${conversations.participantIds})`,
      });

      if (existing) {
        return success(existing);
      }

      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          participantIds: sortedIds,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return success(newConversation);
    } catch (error) {
      console.error('ConversationsRepository.getOrCreateConversation', error);
      return failure(
        new ValidationError('Failed to get or create conversation'),
      );
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<AppResult<any[]>> {
    try {
      const results = await db.query.conversations.findMany({
        where: sql`${userId} = ANY(${conversations.participantIds})`,
        orderBy: [desc(conversations.lastMessageAt)],
        with: {
          messages: {
            limit: 1,
            orderBy: [desc(sql`created_at`) as any], // Type casting for relations ordering if needed
          },
        },
      });

      return success(results);
    } catch (error) {
      console.error('ConversationsRepository.getUserConversations', error);
      return failure(new ValidationError('Failed to fetch conversations'));
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<AppResult<any>> {
    try {
      const result = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!result) {
        return failure(new NotFoundError('Conversation not found'));
      }

      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch conversation'));
    }
  }

  /**
   * Update conversation last message info
   */
  async updateLastMessage(
    conversationId: string,
    messageId: string,
  ): Promise<AppResult<void>> {
    try {
      await db
        .update(conversations)
        .set({
          lastMessageId: messageId,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      return success(undefined);
    } catch (error) {
      return failure(new ValidationError('Failed to update conversation'));
    }
  }
}
