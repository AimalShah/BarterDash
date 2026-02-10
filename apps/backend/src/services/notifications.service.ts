import { NotificationsRepository } from '../repositories/notifications.repository';
import { AppResult, success, failure, ValidationError } from '../utils/result';
import { db, pushTokens, follows, profiles, streams } from '../db';
import { eq, and } from 'drizzle-orm';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title?: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export class NotificationsService {
  private notificationsRepository: NotificationsRepository;
  private expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor() {
    this.notificationsRepository = new NotificationsRepository();
  }

  async getNotifications(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<AppResult<any[]>> {
    return await this.notificationsRepository.getUserNotifications(
      userId,
      limit,
      offset,
    );
  }

  async getUnreadCount(userId: string): Promise<AppResult<number>> {
    return await this.notificationsRepository.getUnreadCount(userId);
  }

  async markAsRead(notificationId: string): Promise<AppResult<boolean>> {
    return await this.notificationsRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<AppResult<boolean>> {
    return await this.notificationsRepository.markAllAsRead(userId);
  }

  async deleteNotification(
    notificationId: string,
  ): Promise<AppResult<boolean>> {
    return await this.notificationsRepository.delete(notificationId);
  }

  /**
   * Create notification and send push notification
   */
  async create(input: CreateNotificationInput): Promise<AppResult<any>> {
    // 1. Save to database
    const dbResult = await this.notificationsRepository.create(
      input.userId,
      input.type,
      input.message,
      input.title,
      input.data,
      input.actionUrl,
    );

    if (dbResult.isErr()) return dbResult;

    // 2. Send push notification (don't await to keep response fast)
    this.sendPushNotification(input.userId, {
      title: input.title || 'BarterDash',
      body: input.message,
      data: input.data,
    }).catch((err) => console.error('Push notification failed:', err));

    return dbResult;
  }

  /**
   * Register a push token for a user
   */
  async registerPushToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<AppResult<any>> {
    try {
      // Check if token already exists
      const existing = await db.query.pushTokens.findFirst({
        where: and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)),
      });

      if (existing) {
        // Update to active
        await db
          .update(pushTokens)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(pushTokens.id, existing.id));
        return success(existing);
      }

      // Insert new token
      const [result] = await db
        .insert(pushTokens)
        .values({
          userId,
          token,
          platform,
          isActive: true,
        })
        .returning();

      return success(result);
    } catch (error) {
      console.error('Failed to register push token:', error);
      return failure(new ValidationError('Failed to register push token'));
    }
  }

  /**
   * Unregister a push token
   */
  async unregisterPushToken(
    userId: string,
    token: string,
  ): Promise<AppResult<boolean>> {
    try {
      await db
        .update(pushTokens)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to unregister push token'));
    }
  }

  /**
   * Send push notification to a user via Expo Push API
   */
  private async sendPushNotification(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, any> },
  ): Promise<void> {
    try {
      // Get user's active push tokens
      const tokens = await db.query.pushTokens.findMany({
        where: and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.isActive, true),
        ),
      });

      if (tokens.length === 0) {
        console.log(`No active push tokens for user ${userId}`);
        return;
      }

      // Build messages for each token
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
      }));

      // Send to Expo Push API
      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = (await response.json()) as {
        data?: Array<{ status: string; details?: { error?: string } }>;
      };

      // Handle invalid tokens
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            // Mark token as inactive
            await db
              .update(pushTokens)
              .set({ isActive: false })
              .where(eq(pushTokens.token, tokens[i].token));
          }
        }
      }

      console.log(
        `Sent push notification to ${tokens.length} devices for user ${userId}`,
      );
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      type: string;
    },
  ): Promise<void> {
    for (const userId of userIds) {
      await this.create({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.body,
        data: notification.data,
      });
    }
  }

  /**
   * Notify all followers when a seller goes live
   */
  async notifyFollowersOfLiveStream(
    sellerId: string,
    streamId: string,
  ): Promise<void> {
    try {
      // Get seller info
      const seller = await db.query.profiles.findFirst({
        where: eq(profiles.id, sellerId),
        columns: { username: true, fullName: true },
      });

      if (!seller) {
        console.error(`Seller ${sellerId} not found`);
        return;
      }

      // Get stream info
      const stream = await db.query.streams.findFirst({
        where: eq(streams.id, streamId),
        columns: { title: true, thumbnailUrl: true },
      });

      if (!stream) {
        console.error(`Stream ${streamId} not found`);
        return;
      }

      // Get all followers
      const followersList = await db.query.follows.findMany({
        where: eq(follows.followingId, sellerId),
        columns: { followerId: true },
      });

      if (followersList.length === 0) {
        console.log(`No followers for seller ${sellerId}`);
        return;
      }

      const followerIds = followersList.map((f) => f.followerId);

      const sellerName = seller.fullName || seller.username;
      const title = `${sellerName} is now LIVE!`;
      const body = stream.title || 'Join the stream now!';

      // Send notifications to all followers
      await this.sendBulkNotification(followerIds, {
        type: 'stream_live',
        title,
        body,
        data: {
          streamId,
          sellerId,
          sellerName,
          thumbnailUrl: stream.thumbnailUrl,
          type: 'stream_live',
        },
      });

      console.log(
        `Notified ${followerIds.length} followers of live stream ${streamId}`,
      );
    } catch (error) {
      console.error('Failed to notify followers of live stream:', error);
    }
  }
}
