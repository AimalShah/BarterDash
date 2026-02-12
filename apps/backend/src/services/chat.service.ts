import {
  ChatMessagesRepository,
  ChatMessageWithUser,
} from '../repositories/chat-messages.repository';
import { StreamSessionsRepository } from '../repositories/stream-sessions.repository';
import { supabase } from '../utils/supabase';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  InternalError,
} from '../utils/result';
import {
  RealtimeChannel,
  RealtimeChannelSendResponse,
} from '@supabase/supabase-js';

/**
 * Chat Service
 * Business logic for realtime chat messages and synchronization for live auction streams
 * Implements Requirements 4.1, 4.3, 9.1, 9.3, 9.5
 */

export interface SendMessageInput {
  sessionId: string;
  userId: string;
  content: string;
  messageType?: 'user_message' | 'system_message' | 'auction_update';
  metadata?: Record<string, any>;
}

export interface MessageHistoryInput {
  sessionId: string;
  limit?: number;
  offset?: number;
  beforeId?: string;
  afterId?: string;
}

export interface Subscription {
  id: string;
  sessionId: string;
  userId: string;
  channel: string;
  isActive: boolean;
  realtimeChannel?: RealtimeChannel;
  lastMessageId?: string;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  retryCount: number;
  lastRetryAt?: Date;
}

export interface RealtimeConnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ChatService {
  private chatRepository: ChatMessagesRepository;
  private streamRepository: StreamSessionsRepository;
  private activeSubscriptions: Map<string, Subscription> = new Map();
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();
  private connectionConfig: RealtimeConnectionConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
  };

  constructor() {
    this.chatRepository = new ChatMessagesRepository();
    this.streamRepository = new StreamSessionsRepository();
  }

  /**
   * Send a message to a stream session
   * Requirement 4.1: Broadcast message to all stream participants immediately
   * Requirement 9.1: Persist messages to database immediately
   */
  async sendMessage(
    input: SendMessageInput,
  ): Promise<AppResult<ChatMessageWithUser>> {
    try {
      const {
        sessionId,
        userId,
        content,
        messageType = 'user_message',
        metadata,
      } = input;

      // Validate input
      if (!content.trim()) {
        return failure(new ValidationError('Message content cannot be empty'));
      }

      if (content.length > 1000) {
        return failure(
          new ValidationError('Message content too long (max 1000 characters)'),
        );
      }

      // Verify user has access to the session
      const accessResult = await this.verifySessionAccess(sessionId, userId);
      if (accessResult.isErr()) {
        return failure(accessResult.error);
      }

      // Send message to database
      const messageResult = await this.chatRepository.sendMessage(
        sessionId,
        userId,
        content,
        messageType,
        metadata,
      );

      if (messageResult.isErr()) {
        return failure(messageResult.error);
      }

      const message = messageResult.value;

      // Broadcast message to all participants via Supabase Realtime
      await this.broadcastMessage(sessionId, message);

      return success(message);
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
    input: MessageHistoryInput,
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      const { sessionId, limit = 50, offset = 0, beforeId, afterId } = input;

      // Verify session exists
      const sessionResult = await this.streamRepository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      if (!sessionResult.value) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Get message history
      const historyResult = await this.chatRepository.getMessageHistory(
        sessionId,
        {
          limit,
          offset,
          beforeId,
          afterId,
        },
      );

      return historyResult;
    } catch (error) {
      console.error('Error getting message history:', error);
      return failure(new InternalError('Failed to get message history'));
    }
  }

  /**
   * Subscribe to chat updates for a stream session
   * Requirement 4.2: Display messages in chronological order for all users
   * Requirement 5.1: Authenticate users and subscribe to relevant channels
   * Requirement 5.2: Push updates to all subscribed clients within 100ms
   * Requirement 5.3: Attempt reconnection with exponential backoff
   */
  async subscribeToChat(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<Subscription>> {
    try {
      // Verify user has access to the session
      const accessResult = await this.verifySessionAccess(sessionId, userId);
      if (accessResult.isErr()) {
        return failure(accessResult.error);
      }

      const subscriptionId = `${userId}_${sessionId}`;
      const channelName = `chat:${sessionId}`;

      // Check if already subscribed
      if (this.activeSubscriptions.has(subscriptionId)) {
        const existingSubscription =
          this.activeSubscriptions.get(subscriptionId)!;
        if (
          existingSubscription.isActive &&
          existingSubscription.connectionState === 'connected'
        ) {
          return success(existingSubscription);
        }
      }

      // Create subscription
      const subscription: Subscription = {
        id: subscriptionId,
        sessionId,
        userId,
        channel: channelName,
        isActive: true,
        connectionState: 'connecting',
        retryCount: 0,
      };

      // Store subscription
      this.activeSubscriptions.set(subscriptionId, subscription);

      // Set up Supabase realtime subscription with retry logic
      const setupResult =
        await this.setupRealtimeSubscriptionWithRetry(subscription);
      if (setupResult.isErr()) {
        // Clean up failed subscription
        this.activeSubscriptions.delete(subscriptionId);
        return failure(setupResult.error);
      }

      return success(subscription);
    } catch (error) {
      console.error('Error subscribing to chat:', error);
      return failure(new InternalError('Failed to subscribe to chat'));
    }
  }

  /**
   * Unsubscribe from chat updates
   */
  async unsubscribeFromChat(subscriptionId: string): Promise<AppResult<void>> {
    try {
      const subscription = this.activeSubscriptions.get(subscriptionId);
      if (!subscription) {
        return success(undefined); // Already unsubscribed
      }

      // Mark as inactive
      subscription.isActive = false;
      subscription.connectionState = 'disconnected';

      // Clean up Supabase subscription
      await this.cleanupRealtimeSubscription(subscription);

      // Remove from active subscriptions
      this.activeSubscriptions.delete(subscriptionId);

      return success(undefined);
    } catch (error) {
      console.error('Error unsubscribing from chat:', error);
      return failure(new InternalError('Failed to unsubscribe from chat'));
    }
  }

  /**
   * Synchronize messages after network restoration
   * Requirement 4.4: Synchronize missed messages after network restoration
   * Requirement 5.4: Clean up subscriptions and notify other participants
   */
  async syncMessages(
    sessionId: string,
    lastMessageId: string,
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      // Verify session exists
      const sessionResult = await this.streamRepository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      if (!sessionResult.value) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Get messages since last known message
      const syncResult = await this.chatRepository.syncMessages(
        sessionId,
        lastMessageId,
      );
      if (syncResult.isErr()) {
        return failure(syncResult.error);
      }

      // Update subscription's last message ID for all active subscriptions
      for (const subscription of this.activeSubscriptions.values()) {
        if (subscription.sessionId === sessionId && subscription.isActive) {
          const messages = syncResult.value;
          if (messages.length > 0) {
            subscription.lastMessageId = messages[0].id; // Most recent message
          }
        }
      }

      return syncResult;
    } catch (error) {
      console.error('Error syncing messages:', error);
      return failure(new InternalError('Failed to sync messages'));
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
      // Verify user has access to the session
      const accessResult = await this.verifySessionAccess(sessionId, userId);
      if (accessResult.isErr()) {
        return failure(accessResult.error);
      }

      return await this.chatRepository.markMessagesAsRead(
        sessionId,
        userId,
        messageIds,
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return failure(new InternalError('Failed to mark messages as read'));
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
      return await this.chatRepository.resolveMessageConflicts(
        sessionId,
        conflictingMessages,
      );
    } catch (error) {
      console.error('Error resolving message conflicts:', error);
      return failure(new InternalError('Failed to resolve message conflicts'));
    }
  }

  /**
   * Get recent messages when user joins a stream
   * Requirement 4.3: Provide recent message history when joining
   */
  async getRecentMessages(
    sessionId: string,
    limit: number = 50,
  ): Promise<AppResult<ChatMessageWithUser[]>> {
    try {
      return await this.chatRepository.getRecentMessages(sessionId, limit);
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return failure(new InternalError('Failed to get recent messages'));
    }
  }

  /**
   * Send system message (for auction updates, user joins/leaves, etc.)
   */
  async sendSystemMessage(
    sessionId: string,
    content: string,
    messageType: 'system_message' | 'auction_update' = 'system_message',
    metadata?: Record<string, any>,
  ): Promise<AppResult<ChatMessageWithUser>> {
    try {
      // Use a system user ID (you might want to create a dedicated system user)
      const systemUserId = 'system'; // This should be a real user ID in production

      return await this.sendMessage({
        sessionId,
        userId: systemUserId,
        content,
        messageType,
        metadata,
      });
    } catch (error) {
      console.error('Error sending system message:', error);
      return failure(new InternalError('Failed to send system message'));
    }
  }

  /**
   * Get chat statistics for a session
   */
  async getChatStats(sessionId: string): Promise<
    AppResult<{
      messageCount: number;
      activeSubscriptions: number;
      recentActivity: boolean;
    }>
  > {
    try {
      const messageCountResult =
        await this.chatRepository.getMessageCount(sessionId);
      if (messageCountResult.isErr()) {
        return failure(messageCountResult.error);
      }

      const activeSubscriptions = Array.from(
        this.activeSubscriptions.values(),
      ).filter((sub) => sub.sessionId === sessionId && sub.isActive).length;

      // Check for recent activity (messages in last 5 minutes)
      const recentMessages = await this.chatRepository.getMessageHistory(
        sessionId,
        {
          limit: 1,
        },
      );

      const recentActivity =
        recentMessages.isOk() &&
        recentMessages.value.length > 0 &&
        new Date().getTime() -
          new Date(recentMessages.value[0].createdAt).getTime() <
          5 * 60 * 1000;

      return success({
        messageCount: messageCountResult.value,
        activeSubscriptions,
        recentActivity,
      });
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return failure(new InternalError('Failed to get chat statistics'));
    }
  }

  /**
   * Verify user has access to a stream session
   */
  private async verifySessionAccess(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<void>> {
    try {
      // Get session details
      const sessionResult = await this.streamRepository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Check if user is the seller
      if (session.sellerId === userId) {
        return success(undefined);
      }

      // Check if user is an active viewer
      const viewersResult =
        await this.streamRepository.getActiveViewers(sessionId);
      if (viewersResult.isOk()) {
        const isViewer = viewersResult.value.some(
          (viewer) => viewer.userId === userId && viewer.isActive,
        );
        if (isViewer) {
          return success(undefined);
        }
      }

      // For now, allow access to any authenticated user for active/paused sessions
      // In production, you might want stricter access control
      if (['active', 'paused'].includes(session.state)) {
        return success(undefined);
      }

      return failure(
        new ForbiddenError('You do not have access to this chat session'),
      );
    } catch (error) {
      console.error('Error verifying session access:', error);
      return failure(new InternalError('Failed to verify session access'));
    }
  }

  /**
   * Broadcast message to all participants via Supabase Realtime
   * Requirement 4.1: Broadcast message to all stream participants immediately
   * Requirement 5.2: Push updates to all subscribed clients within 100ms
   */
  private async broadcastMessage(
    sessionId: string,
    message: ChatMessageWithUser,
  ): Promise<void> {
    try {
      const channelName = `chat:${sessionId}`;

      // Get or create channel for this session
      let channel = this.realtimeChannels.get(channelName);
      if (!channel) {
        channel = supabase.channel(channelName);
        this.realtimeChannels.set(channelName, channel);
      }

      // Send via Supabase Realtime with timeout for 100ms requirement
      const broadcastPromise = channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          message,
          timestamp: new Date().toISOString(),
          sessionId,
        },
      });

      // Set timeout to ensure we meet the 100ms requirement
      const timeoutPromise = new Promise<RealtimeChannelSendResponse>(
        (_, reject) => {
          setTimeout(
            () => reject(new Error('Broadcast timeout after 100ms')),
            100,
          );
        },
      );

      await Promise.race([broadcastPromise, timeoutPromise]);

      console.log(`Message broadcasted to channel ${channelName}:`, message.id);

      // Update last message ID for all subscriptions to this session
      for (const subscription of this.activeSubscriptions.values()) {
        if (subscription.sessionId === sessionId && subscription.isActive) {
          subscription.lastMessageId = message.id;
        }
      }
    } catch (error) {
      console.error('Error broadcasting message:', error);
      // Don't fail the entire operation if broadcast fails
      // The message is already persisted to the database

      // If broadcast fails, attempt to reconnect subscriptions
      await this.handleBroadcastFailure(sessionId, error);
    }
  }

  /**
   * Set up Supabase realtime subscription for a chat channel with retry logic
   * Requirement 5.1: Authenticate users and subscribe to relevant channels
   * Requirement 5.3: Attempt reconnection with exponential backoff
   */
  private async setupRealtimeSubscriptionWithRetry(
    subscription: Subscription,
  ): Promise<AppResult<void>> {
    try {
      const result = await this.attemptRealtimeConnection(subscription);
      if (result.isOk()) {
        subscription.connectionState = 'connected';
        subscription.retryCount = 0;
        return success(undefined);
      }

      // If initial connection fails, start retry process
      return await this.retryRealtimeConnection(subscription, result.error);
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      subscription.connectionState = 'error';
      return failure(
        new InternalError('Failed to setup realtime subscription'),
      );
    }
  }

  /**
   * Attempt to establish realtime connection
   */
  private async attemptRealtimeConnection(
    subscription: Subscription,
  ): Promise<AppResult<void>> {
    try {
      // Create or get existing channel
      let channel = this.realtimeChannels.get(subscription.channel);
      if (!channel) {
        channel = supabase.channel(subscription.channel, {
          config: {
            broadcast: { self: true },
            presence: { key: subscription.userId },
          },
        });
        this.realtimeChannels.set(subscription.channel, channel);
      }

      // Set up event handlers
      channel
        .on('broadcast', { event: 'new_message' }, (payload) => {
          this.handleIncomingMessage(subscription.sessionId, payload);
        })
        .on('presence', { event: 'sync' }, () => {
          console.log(`Presence synced for channel: ${subscription.channel}`);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log(`User ${key} joined channel: ${subscription.channel}`);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log(`User ${key} left channel: ${subscription.channel}`);
        });

      // Subscribe to channel
      const subscribeResponse = await new Promise<string>((resolve) => {
        channel.subscribe((status) => {
          resolve(status);
        });

        // Timeout after 5 seconds
        setTimeout(() => resolve('TIMED_OUT'), 5000);
      });

      if (subscribeResponse !== 'SUBSCRIBED') {
        return failure(
          new InternalError(
            `Subscription failed with status: ${subscribeResponse}`,
          ),
        );
      }

      // Store channel reference in subscription
      subscription.realtimeChannel = channel;

      console.log(
        `Successfully subscribed to channel: ${subscription.channel}`,
      );
      return success(undefined);
    } catch (error) {
      console.error('Error attempting realtime connection:', error);
      return failure(new InternalError('Connection attempt failed'));
    }
  }

  /**
   * Retry realtime connection with exponential backoff
   * Requirement 5.3: Attempt reconnection with exponential backoff
   */
  private async retryRealtimeConnection(
    subscription: Subscription,
    lastError: Error,
  ): Promise<AppResult<void>> {
    if (subscription.retryCount >= this.connectionConfig.maxRetries) {
      subscription.connectionState = 'error';
      return failure(
        new InternalError(
          `Max retries (${this.connectionConfig.maxRetries}) exceeded: ${lastError.message}`,
        ),
      );
    }

    subscription.retryCount++;
    subscription.lastRetryAt = new Date();

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.connectionConfig.baseDelay *
        Math.pow(
          this.connectionConfig.backoffMultiplier,
          subscription.retryCount - 1,
        ),
      this.connectionConfig.maxDelay,
    );

    console.log(
      `Retrying connection for ${subscription.channel} in ${delay}ms (attempt ${subscription.retryCount}/${this.connectionConfig.maxRetries})`,
    );

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Attempt connection again
    const result = await this.attemptRealtimeConnection(subscription);
    if (result.isOk()) {
      subscription.connectionState = 'connected';
      console.log(
        `Successfully reconnected to ${subscription.channel} after ${subscription.retryCount} attempts`,
      );
      return success(undefined);
    }

    // Recursive retry
    return await this.retryRealtimeConnection(subscription, result.error);
  }

  /**
   * Handle incoming realtime messages
   */
  private handleIncomingMessage(sessionId: string, payload: any): void {
    try {
      const { message } = payload.payload;

      // Update last message ID for subscriptions
      for (const subscription of this.activeSubscriptions.values()) {
        if (subscription.sessionId === sessionId && subscription.isActive) {
          subscription.lastMessageId = message.id;
        }
      }

      console.log(
        `Received realtime message for session ${sessionId}:`,
        message.id,
      );
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  /**
   * Handle broadcast failure and attempt recovery
   */
  private async handleBroadcastFailure(
    sessionId: string,
    error: any,
  ): Promise<void> {
    try {
      console.log(
        `Broadcast failed for session ${sessionId}, attempting recovery:`,
        error.message,
      );

      // Find all subscriptions for this session and attempt reconnection
      const sessionSubscriptions = Array.from(
        this.activeSubscriptions.values(),
      ).filter((sub) => sub.sessionId === sessionId && sub.isActive);

      for (const subscription of sessionSubscriptions) {
        if (subscription.connectionState === 'connected') {
          subscription.connectionState = 'error';

          // Attempt to reconnect
          const reconnectResult =
            await this.setupRealtimeSubscriptionWithRetry(subscription);
          if (reconnectResult.isErr()) {
            console.error(
              `Failed to reconnect subscription ${subscription.id}:`,
              reconnectResult.error.message,
            );
          }
        }
      }
    } catch (error) {
      console.error('Error handling broadcast failure:', error);
    }
  }

  /**
   * Clean up Supabase realtime subscription
   * Requirement 5.4: Clean up subscriptions and notify other participants
   */
  private async cleanupRealtimeSubscription(
    subscription: Subscription,
  ): Promise<void> {
    try {
      console.log(
        `Cleaning up realtime subscription for channel: ${subscription.channel}`,
      );

      // Unsubscribe from the channel if it exists
      if (subscription.realtimeChannel) {
        await subscription.realtimeChannel.unsubscribe();
        subscription.realtimeChannel = undefined;
      }

      // Remove channel from cache if no other subscriptions use it
      const hasOtherSubscriptions = Array.from(
        this.activeSubscriptions.values(),
      ).some(
        (sub) =>
          sub.channel === subscription.channel &&
          sub.id !== subscription.id &&
          sub.isActive,
      );

      if (!hasOtherSubscriptions) {
        this.realtimeChannels.delete(subscription.channel);
        console.log(`Removed channel from cache: ${subscription.channel}`);
      }
    } catch (error) {
      console.error('Error cleaning up realtime subscription:', error);
    }
  }

  /**
   * Handle connection errors with retry logic
   * Requirement 5.3: Attempt reconnection with exponential backoff
   */
  async handleConnectionError(
    sessionId: string,
    userId: string,
    error: Error,
    retryCount: number = 0,
  ): Promise<AppResult<void>> {
    try {
      const subscriptionId = `${userId}_${sessionId}`;
      const subscription = this.activeSubscriptions.get(subscriptionId);

      if (!subscription) {
        return failure(new NotFoundError('Subscription', subscriptionId));
      }

      subscription.connectionState = 'error';

      if (retryCount >= this.connectionConfig.maxRetries) {
        return failure(
          new InternalError(
            `Connection failed after ${this.connectionConfig.maxRetries} attempts: ${error.message}`,
          ),
        );
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        this.connectionConfig.baseDelay *
          Math.pow(this.connectionConfig.backoffMultiplier, retryCount),
        this.connectionConfig.maxDelay,
      );

      console.log(
        `Connection error for session ${sessionId}, user ${userId}. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.connectionConfig.maxRetries})`,
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Clean up existing subscription
      await this.cleanupRealtimeSubscription(subscription);

      // Attempt to resubscribe
      const subscribeResult =
        await this.setupRealtimeSubscriptionWithRetry(subscription);
      if (subscribeResult.isErr()) {
        // Recursive retry
        return this.handleConnectionError(
          sessionId,
          userId,
          error,
          retryCount + 1,
        );
      }

      return success(undefined);
    } catch (retryError) {
      console.error('Error handling connection error:', retryError);
      return failure(new InternalError('Failed to handle connection error'));
    }
  }

  /**
   * Clean up inactive subscriptions (should be called periodically)
   * Requirement 5.4: Clean up subscriptions and notify other participants
   */
  async cleanupInactiveSubscriptions(): Promise<void> {
    try {
      const now = new Date();
      const inactivityThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [
        subscriptionId,
        subscription,
      ] of this.activeSubscriptions.entries()) {
        // Clean up inactive subscriptions
        if (!subscription.isActive) {
          this.activeSubscriptions.delete(subscriptionId);
          await this.cleanupRealtimeSubscription(subscription);
          continue;
        }

        // Clean up subscriptions that have been in error state for too long
        if (
          subscription.connectionState === 'error' &&
          subscription.lastRetryAt
        ) {
          const timeSinceLastRetry =
            now.getTime() - subscription.lastRetryAt.getTime();
          if (timeSinceLastRetry > inactivityThreshold) {
            console.log(
              `Cleaning up subscription ${subscriptionId} due to prolonged error state`,
            );
            subscription.isActive = false;
            this.activeSubscriptions.delete(subscriptionId);
            await this.cleanupRealtimeSubscription(subscription);
          }
        }
      }

      // Clean up unused channels
      const activeChannels = new Set(
        Array.from(this.activeSubscriptions.values())
          .filter((sub) => sub.isActive)
          .map((sub) => sub.channel),
      );

      for (const [channelName, channel] of this.realtimeChannels.entries()) {
        if (!activeChannels.has(channelName)) {
          console.log(`Cleaning up unused channel: ${channelName}`);
          await channel.unsubscribe();
          this.realtimeChannels.delete(channelName);
        }
      }
    } catch (error) {
      console.error('Error cleaning up inactive subscriptions:', error);
    }
  }

  /**
   * Get connection status for all subscriptions
   */
  getConnectionStatus(): {
    [sessionId: string]: {
      connected: number;
      total: number;
      channels: string[];
    };
  } {
    const status: {
      [sessionId: string]: {
        connected: number;
        total: number;
        channels: string[];
      };
    } = {};

    for (const subscription of this.activeSubscriptions.values()) {
      if (!status[subscription.sessionId]) {
        status[subscription.sessionId] = {
          connected: 0,
          total: 0,
          channels: [],
        };
      }

      status[subscription.sessionId].total++;
      status[subscription.sessionId].channels.push(subscription.channel);

      if (subscription.connectionState === 'connected') {
        status[subscription.sessionId].connected++;
      }
    }

    return status;
  }

  /**
   * Force reconnect all subscriptions for a session
   */
  async forceReconnectSession(sessionId: string): Promise<AppResult<void>> {
    try {
      const sessionSubscriptions = Array.from(
        this.activeSubscriptions.values(),
      ).filter((sub) => sub.sessionId === sessionId && sub.isActive);

      const reconnectPromises = sessionSubscriptions.map(
        async (subscription) => {
          console.log(`Force reconnecting subscription: ${subscription.id}`);

          // Clean up existing connection
          await this.cleanupRealtimeSubscription(subscription);

          // Reset retry count
          subscription.retryCount = 0;
          subscription.connectionState = 'connecting';

          // Attempt reconnection
          return await this.setupRealtimeSubscriptionWithRetry(subscription);
        },
      );

      const results = await Promise.allSettled(reconnectPromises);

      // Check if any reconnections failed
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        console.error(
          `${failures.length} reconnections failed for session ${sessionId}`,
        );
        return failure(
          new InternalError(
            `Failed to reconnect ${failures.length} subscriptions`,
          ),
        );
      }

      return success(undefined);
    } catch (error) {
      console.error('Error force reconnecting session:', error);
      return failure(new InternalError('Failed to force reconnect session'));
    }
  }
}
