import { eq, and, desc, sql } from 'drizzle-orm';
import { db, userWatchlist, UserWatchlist } from '../db';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

export class WatchlistRepository {
  /**
   * Add a stream or product to watchlist
   */
  async addToWatchlist(data: {
    userId: string;
    streamId?: string;
    productId?: string;
    notificationEnabled?: boolean;
  }): Promise<AppResult<UserWatchlist>> {
    try {
      if (!data.streamId && !data.productId) {
        return failure(
          new ValidationError('Must provide either streamId or productId'),
        );
      }

      // Check if already in watchlist
      const existing = await db.query.userWatchlist.findFirst({
        where: and(
          eq(userWatchlist.userId, data.userId),
          data.streamId
            ? eq(userWatchlist.streamId, data.streamId)
            : sql`stream_id IS NULL`,
          data.productId
            ? eq(userWatchlist.productId, data.productId)
            : sql`product_id IS NULL`,
        ),
      });

      if (existing) {
        return success(existing);
      }

      const [newWatchlistItem] = await db
        .insert(userWatchlist)
        .values({
          userId: data.userId,
          streamId: data.streamId,
          productId: data.productId,
          notificationEnabled: data.notificationEnabled ?? true,
          addedAt: new Date(),
          createdAt: new Date(),
        })
        .returning();

      return success(newWatchlistItem);
    } catch (error) {
      console.error('WatchlistRepository.addToWatchlist', error);
      return failure(new ValidationError('Failed to add to watchlist'));
    }
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(
    userId: string,
    itemId: string,
  ): Promise<AppResult<boolean>> {
    try {
      const result = await db
        .delete(userWatchlist)
        .where(
          and(eq(userWatchlist.id, itemId), eq(userWatchlist.userId, userId)),
        )
        .returning();

      return success(result.length > 0);
    } catch (error) {
      return failure(new ValidationError('Failed to remove from watchlist'));
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(userId: string): Promise<AppResult<any[]>> {
    try {
      const results = await db.query.userWatchlist.findMany({
        where: eq(userWatchlist.userId, userId),
        with: {
          product: true,
          stream: true,
        },
        orderBy: [desc(userWatchlist.addedAt)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch watchlist'));
    }
  }

  /**
   * Update notification settings for a watchlist item
   */
  async updateNotification(
    userId: string,
    itemId: string,
    enabled: boolean,
  ): Promise<AppResult<UserWatchlist>> {
    try {
      const [updated] = await db
        .update(userWatchlist)
        .set({ notificationEnabled: enabled })
        .where(
          and(eq(userWatchlist.id, itemId), eq(userWatchlist.userId, userId)),
        )
        .returning();

      if (!updated)
        return failure(new NotFoundError('Watchlist item not found'));

      return success(updated);
    } catch (error) {
      return failure(
        new ValidationError('Failed to update notification settings'),
      );
    }
  }
}
