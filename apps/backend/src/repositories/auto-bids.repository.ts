import { eq, and, desc } from 'drizzle-orm';
import { db, autoBids, AutoBid, NewAutoBid } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

/**
 * AutoBids Repository
 * Manages user-configured automatic bidding
 */
export class AutoBidsRepository {
  /**
   * Find active auto bid for a user on an auction
   */
  async findActive(
    userId: string,
    auctionId: string,
  ): Promise<AppResult<AutoBid | null>> {
    try {
      const result = await db.query.autoBids.findFirst({
        where: and(
          eq(autoBids.userId, userId),
          eq(autoBids.auctionId, auctionId),
          eq(autoBids.isActive, true),
        ),
      });
      return success(result || null);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch auto bid'));
    }
  }

  /**
   * Get all active auto bids for an auction, ordered by max amount
   */
  async getActiveForAuction(auctionId: string): Promise<AppResult<AutoBid[]>> {
    try {
      const results = await db.query.autoBids.findMany({
        where: and(
          eq(autoBids.auctionId, auctionId),
          eq(autoBids.isActive, true),
        ),
        orderBy: [desc(autoBids.maxAmount)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch auction auto bids'));
    }
  }

  /**
   * Create or update an auto bid
   */
  async upsert(data: NewAutoBid): Promise<AppResult<AutoBid>> {
    try {
      // 1. Check if one exists
      const existing = await this.findActive(data.userId, data.auctionId);
      if (existing.isOk() && existing.value) {
        const [updated] = await db
          .update(autoBids)
          .set({
            maxAmount: data.maxAmount,
            currentProxyBid:
              data.currentProxyBid || existing.value.currentProxyBid,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(autoBids.id, existing.value.id))
          .returning();
        return success(updated);
      }

      // 2. Create new
      const [newAutoBid] = await db
        .insert(autoBids)
        .values({
          ...data,
          currentProxyBid: data.currentProxyBid || data.maxAmount,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return success(newAutoBid);
    } catch (error) {
      return failure(new ValidationError('Failed to configure auto bid'));
    }
  }

  /**
   * Deactivate an auto bid
   */
  async deactivate(
    userId: string,
    auctionId: string,
  ): Promise<AppResult<void>> {
    try {
      await db
        .update(autoBids)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(eq(autoBids.userId, userId), eq(autoBids.auctionId, auctionId)),
        );
      return success(undefined);
    } catch (error) {
      return failure(new ValidationError('Failed to deactivate auto bid'));
    }
  }
}
