import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db, directMessages, conversations } from '../db';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

export class DirectMessagesRepository {
  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.directMessages.findMany({
        where: eq(directMessages.conversationId, conversationId),
        with: {
          sender: true,
        },
        orderBy: [desc(directMessages.createdAt)],
        limit,
        offset,
      });

      return success(result.reverse()); // Return in chronological order
    } catch (error) {
      console.error('DirectMessagesRepository.getMessages', error);
      return failure(new ValidationError('Failed to fetch messages'));
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: {
      content: string;
      messageType?: 'text' | 'image' | 'product_link';
      attachmentUrl?: string;
      productId?: string;
    },
  ): Promise<AppResult<any>> {
    try {
      // Verify conversation exists
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation) {
        return failure(new NotFoundError('Conversation not found'));
      }

      // Verify sender is participant
      if (!conversation.participantIds.includes(senderId)) {
        return failure(
          new ValidationError('User is not part of this conversation'),
        );
      }

      // Insert message
      const [newMessage] = await db
        .insert(directMessages)
        .values({
          conversationId,
          senderId,
          content: data.content,
          messageType: data.messageType || 'text',
          attachmentUrl: data.attachmentUrl,
          productId: data.productId,
          createdAt: new Date(),
        })
        .returning();

      return success(newMessage);
    } catch (error) {
      console.error('DirectMessagesRepository.sendMessage', error);
      return failure(new ValidationError('Failed to send message'));
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<AppResult<boolean>> {
    try {
      await db
        .update(directMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(directMessages.conversationId, conversationId),
            sql`${directMessages.senderId} != ${userId}`,
            sql`${directMessages.readAt} IS NULL`,
          ),
        );

      return success(true);
    } catch (error) {
      console.error('DirectMessagesRepository.markAsRead', error);
      return failure(new ValidationError('Failed to mark messages as read'));
    }
  }

  /**
   * Get unread count for a user across all conversations
   */
  async getUnreadCount(userId: string): Promise<AppResult<number>> {
    try {
      // We need to find conversations the user is part of and sum unread messages from OTHERS
      const userConversations = await db.query.conversations.findMany({
        where: sql`${userId} = ANY(${conversations.participantIds})`,
      });

      if (userConversations.length === 0) return success(0);

      const conversationIds = userConversations.map((c) => c.id);

      // This is a bit complex for simple query, might need raw sql or multiple steps
      const result = await db
        .select({ count: sql`COUNT(*)` })
        .from(directMessages)
        .where(
          and(
            inArray(directMessages.conversationId, conversationIds),
            sql`${directMessages.senderId} != ${userId}`,
            sql`${directMessages.readAt} IS NULL`,
          ),
        );

      return success(Number((result[0] as any).count) || 0);
    } catch (error) {
      console.error('DirectMessagesRepository.getUnreadCount', error);
      return failure(new ValidationError('Failed to get unread count'));
    }
  }
}
