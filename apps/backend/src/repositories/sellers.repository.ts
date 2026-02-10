import { eq, and, desc, inArray } from 'drizzle-orm';
import {
  db,
  sellerDetails,
  profiles,
  auctions,
  streams,
  streamProducts,
  bids,
  SellerDetails,
} from '../db';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/result';

/**
 * Sellers Repository
 * Data access layer for sellers
 */
export class SellersRepository {
  /**
   * Create a new seller (register user as seller)
   */
  async create(
    userId: string,
    data: { business_name: string; description?: string },
  ): Promise<AppResult<SellerDetails>> {
    try {
      // Check if user is already a seller
      const existing = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (existing) {
        return failure(new ConflictError('User is already a seller'));
      }

      // Create seller details record
      const [newSeller] = await db
        .insert(sellerDetails)
        .values({
          userId,
        })
        .returning();

      // Update the profile to mark as seller
      await db
        .update(profiles)
        .set({
          isSeller: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      return success(newSeller);
    } catch (error) {
      console.error('Error creating seller:', error);
      return failure(new ValidationError('Failed to create seller profile'));
    }
  }
  /**
   * Find seller details by user ID
   */
  async findByUserId(userId: string): Promise<AppResult<SellerDetails | null>> {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });
      return success(seller || null);
    } catch (error) {
      return failure(new NotFoundError('Seller'));
    }
  }

  /**
   * Get stats for a seller
   */
  async getDashboardStats(userId: string) {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (!seller) return null;

      // Count total streams for this seller
      const sellerStreams = await db.query.streams.findMany({
        where: (streams, { eq }) => eq(streams.sellerId, userId),
      });

      const activeStreamsCount = sellerStreams.filter(
        (s) => s.status === 'live',
      ).length;

      // Fetch IDs of all auctions linked to this seller's streams
      const streamIds = sellerStreams.map((s) => s.id);

      let totalBidsCount = 0;
      if (streamIds.length > 0) {
        const streamAuctions = await db.query.auctions.findMany({
          where: (auctions, { inArray }) =>
            inArray(auctions.streamId, streamIds),
        });

        const auctionIds = streamAuctions.map((a) => a.id);
        if (auctionIds.length > 0) {
          const bidsCount = await db.query.bids.findMany({
            where: (bids, { inArray }) => inArray(bids.auctionId, auctionIds),
          });
          totalBidsCount = bidsCount.length;
        }
      }

      return {
        total_sales: parseInt(seller.totalSales.toString()) || 0,
        total_revenue: parseFloat(seller.totalRevenue.toString()) || 0,
        rating: parseFloat(seller.rating.toString()) || 0,
        trust_score: seller.trustScore,
        total_streams: sellerStreams.length,
        total_auctions:
          sellerStreams.length > 0
            ? (
                await db.query.auctions.findMany({
                  where: (auctions, { inArray }) =>
                    inArray(auctions.streamId, streamIds),
                })
              ).length
            : 0,
        active_streams: activeStreamsCount,
        total_bids_received: totalBidsCount,
      };
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
      return null;
    }
  }

  /**
   * Get the current active (live) stream for a seller
   */
  async getActiveStream(userId: string) {
    return await db.query.streams.findFirst({
      where: and(eq(streams.sellerId, userId), eq(streams.status, 'live')),
      orderBy: [desc(streams.actualStart)],
    });
  }

  /**
   * Get comprehensive dashboard data for a specific stream
   */
  async getStreamDashboardData(streamId: string) {
    try {
      // 1. Get active auction for this stream
      const activeAuction = await db.query.auctions.findFirst({
        where: and(
          eq(auctions.streamId, streamId),
          eq(auctions.status, 'active'),
        ),
        with: {
          product: true,
        },
      });

      // 2. Get inventory queue (stream products)
      const inventory = await db.query.streamProducts.findMany({
        where: eq(streamProducts.streamId, streamId),
        with: {
          product: true,
        },
        orderBy: [streamProducts.displayOrder],
      });

      // 3. Get recent alerts/bids
      const recentBids = await db.query.bids.findMany({
        where: inArray(
          bids.auctionId,
          (
            await db.query.auctions.findMany({
              where: eq(auctions.streamId, streamId),
              columns: { id: true },
            })
          ).map((a) => a.id),
        ),
        with: {
          bidder: true,
        },
        orderBy: [desc(bids.createdAt)],
        limit: 10,
      });

      return {
        activeAuction,
        inventory,
        recentBids,
      };
    } catch (error) {
      console.error('Error fetching stream dashboard data:', error);
      return null;
    }
  }
}
