import { ConversationsRepository } from '../repositories/conversations.repository';
import { DirectMessagesRepository } from '../repositories/direct-messages.repository';
import { AppResult } from '../utils/result';

export class MessagingService {
  private conversationsRepository: ConversationsRepository;
  private directMessagesRepository: DirectMessagesRepository;

  constructor() {
    this.conversationsRepository = new ConversationsRepository();
    this.directMessagesRepository = new DirectMessagesRepository();
  }

  /**
   * Start a new conversation with a user
   */
  async startConversation(
    currentUserId: string,
    targetUserId: string,
  ): Promise<AppResult<any>> {
    return await this.conversationsRepository.getOrCreateConversation([
      currentUserId,
      targetUserId,
    ]);
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(userId: string): Promise<AppResult<any[]>> {
    return await this.conversationsRepository.getUserConversations(userId);
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    limit?: number,
    offset?: number,
  ): Promise<AppResult<any[]>> {
    return await this.directMessagesRepository.getMessages(
      conversationId,
      limit,
      offset,
    );
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    data: {
      messageType?: 'text' | 'image' | 'product_link';
      attachmentUrl?: string;
      productId?: string;
    } = {},
  ): Promise<AppResult<any>> {
    const result = await this.directMessagesRepository.sendMessage(
      conversationId,
      senderId,
      {
        content,
        ...data,
      },
    );

    if (result.isOk()) {
      // Update conversation last message info
      await this.conversationsRepository.updateLastMessage(
        conversationId,
        result.value.id,
      );
    }

    return result;
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<AppResult<boolean>> {
    return await this.directMessagesRepository.markAsRead(
      conversationId,
      userId,
    );
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<AppResult<number>> {
    return await this.directMessagesRepository.getUnreadCount(userId);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<AppResult<any>> {
    return await this.conversationsRepository.getConversationById(
      conversationId,
    );
  }
}
