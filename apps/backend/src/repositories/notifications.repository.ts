import { eq, desc, and } from 'drizzle-orm';
import { db, notifications } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

export class NotificationsRepository {
  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit,
        offset,
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch notifications'));
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<AppResult<number>> {
    try {
      const result = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      });
      return success(result.length);
    } catch (error) {
      return failure(new ValidationError('Failed to get unread count'));
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<AppResult<boolean>> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
      return success(true);
    } catch (error) {
      return failure(
        new ValidationError('Failed to mark notification as read'),
      );
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<AppResult<boolean>> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to mark all as read'));
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<AppResult<boolean>> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId));
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to delete notification'));
    }
  }

  /**
   * Create a notification
   */
  async create(
    userId: string,
    type: string,
    message: string,
    title?: string,
    data?: Record<string, any>,
    actionUrl?: string,
  ): Promise<AppResult<any>> {
    try {
      const [result] = await db
        .insert(notifications)
        .values({
          userId,
          type,
          message,
          title,
          data: data || {},
          actionUrl,
        })
        .returning();
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to create notification'));
    }
  }
}
