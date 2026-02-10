import { eq, desc, sql } from 'drizzle-orm';
import { db, bids, auctions, Bid } from '../db';
import { auctionQueue } from '../jobs/auction.processor';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
  InternalError,
} from '../utils/result';
import { CreateBidInput } from '../schemas/bids.schemas';

/**
 * Bids Repository
 * Data access layer for bids
 */
export class BidsRepository {
  /**
   * Timer extension threshold in milliseconds (10 seconds)
   */
  private readonly TIMER_EXTENSION_THRESHOLD = 10 * 1000;
  
  /**
   * Timer extension duration in milliseconds (10 seconds)
   */
  private readonly TIMER_EXTENSION_DURATION = 10 * 1000;

  /**
   * Place a bid - uses direct database transaction (RPC removed due to table mismatch)
   */
  async placeBid(
    userId: string,
    data: CreateBidInput,
  ): Promise<AppResult<any>> {
    // Skip RPC and use direct database transaction
    // The RPC function was querying wrong table (live_auctions instead of auctions)
    return await this.placeBidWithDb(userId, data);
  }

  private async placeBidWithDb(
    userId: string,
    data: CreateBidInput,
  ): Promise<AppResult<any>> {
    try {
      console.log('[BidsRepository] Placing bid for auction:', data.auction_id, 'User:', userId);
      
      // First check if auction exists without transaction
      const checkResult = await db.execute(sql`
        SELECT id, status, current_bid, starting_bid, ends_at, mode, timer_extensions, max_timer_extensions
        FROM auctions 
        WHERE id = ${data.auction_id}
      `);
      
      console.log('[BidsRepository] Auction check result:', JSON.stringify(checkResult));
      const rows = (checkResult as any)?.rows;
      console.log('[BidsRepository] Rows found:', rows?.length || 0);
      
      if (!rows || rows.length === 0) {
        console.error('[BidsRepository] Auction not found in DB:', data.auction_id);
        // List some auctions to debug
        const sample = await db.execute(sql`SELECT id, status FROM auctions LIMIT 3`);
        console.log('[BidsRepository] Sample auctions:', (sample as any)?.rows);
        return failure(new NotFoundError('Auction', data.auction_id));
      }
      
      // Check if auction is active
      const auctionStatus = rows[0]?.status;
      const auctionEndsAt = rows[0]?.ends_at;
      const hasEnded = auctionEndsAt ? new Date(auctionEndsAt) <= new Date() : false;
      
      if (!['active', 'live'].includes(auctionStatus)) {
        return failure(new ValidationError(`Auction is not active (status: ${auctionStatus})`));
      }
      
      if (hasEnded) {
        return failure(new ValidationError('Auction has ended'));
      }
      
      const result = await db.transaction(async (tx) => {
        // Lock and fetch auction
        const auctionResult = await tx.execute(sql`
          select id, current_bid, starting_bid, minimum_bid_increment, status, ends_at, bid_count, mode, timer_extensions, max_timer_extensions, original_ends_at
          from auctions
          where id = ${data.auction_id}
          for update
        `);

        const auction = (auctionResult as any)?.rows?.[0];
        if (!auction) {
          console.error('[BidsRepository] Auction not found in transaction:', data.auction_id);
          return failure(new NotFoundError('Auction', data.auction_id));
        }

        console.log('[BidsRepository] Found auction:', { id: auction.id, status: auction.status, mode: auction.mode });

        const status = auction.status as string;
        if (!['active', 'live'].includes(status)) {
          return failure(new ValidationError('Auction is not live'));
        }

        const endsAt = auction.ends_at ? new Date(auction.ends_at) : null;
        const now = new Date();
        
        if (endsAt && endsAt.getTime() < now.getTime()) {
          return failure(new ValidationError('Auction has ended'));
        }

        const currentBid = Number(auction.current_bid ?? auction.starting_bid ?? 0);
        const minIncrement = Number(auction.minimum_bid_increment ?? 1);
        const minimumBid = currentBid + minIncrement;
        if (data.amount < minimumBid) {
          return failure(new ValidationError(`Bid must be at least ${minimumBid}`));
        }

        // Check for timer extension (Normal mode only)
        let newEndsAt = endsAt;
        let timerExtended = false;
        let newTimerExtensions = Number(auction.timer_extensions ?? 0);
        const maxTimerExtensions = Number(auction.max_timer_extensions ?? 10);
        
        if (endsAt && auction.mode === 'normal') {
          const remainingTime = endsAt.getTime() - now.getTime();
          
          // If less than 10 seconds remaining and haven't exceeded max extensions
          if (remainingTime < this.TIMER_EXTENSION_THRESHOLD && newTimerExtensions < maxTimerExtensions) {
            // Extend by 10 seconds
            newEndsAt = new Date(endsAt.getTime() + this.TIMER_EXTENSION_DURATION);
            timerExtended = true;
            newTimerExtensions += 1;
            
            console.log(`[BidsRepository] Timer extended for auction ${data.auction_id}: +10s (extension ${newTimerExtensions}/${maxTimerExtensions})`);
          }
        }

        // Mark previous bids as not winning
        await tx
          .update(bids)
          .set({ isWinning: false })
          .where(eq(bids.auctionId, data.auction_id));

        // Insert new bid
        const [bid] = await tx
          .insert(bids)
          .values({
            auctionId: data.auction_id,
            bidderId: userId,
            amount: data.amount.toString(),
            isWinning: true,
          })
          .returning();

        // Update auction
        const bidCount = Number(auction.bid_count ?? 0) + 1;
        const updateData: any = {
          currentBid: data.amount.toString(),
          currentBidderId: userId,
          bidCount,
          updatedAt: now,
        };
        
        // Store original end time if this is the first extension
        if (timerExtended && !auction.original_ends_at) {
          updateData.originalEndsAt = endsAt;
        }
        
        // Update timer extension count
        if (timerExtended) {
          updateData.timerExtensions = newTimerExtensions;
          updateData.endsAt = newEndsAt;
        }
        
        await tx
          .update(auctions)
          .set(updateData)
          .where(eq(auctions.id, data.auction_id));

        console.log('[BidsRepository] Bid placed successfully:', bid.id);

        // If timer was extended, reschedule the end-auction job
        if (timerExtended && newEndsAt) {
          try {
            // Get existing job by ID and remove it
            const job = await auctionQueue.getJob(data.auction_id);
            if (job) {
              await job.remove();
              console.log(`[BidsRepository] Removed existing end-auction job for ${data.auction_id}`);
            }
            
            // Schedule new end-auction job
            const delay = newEndsAt.getTime() - Date.now();
            await auctionQueue.add(
              'end-auction',
              { auctionId: data.auction_id },
              { 
                delay: delay > 0 ? delay : 0, 
                removeOnComplete: true,
                jobId: data.auction_id, // Use auction ID as job ID for easy identification
              },
            );
            
            console.log(`[BidsRepository] Rescheduled end-auction job for ${data.auction_id} at ${newEndsAt.toISOString()}`);
          } catch (queueError) {
            console.error('[BidsRepository] Failed to reschedule end-auction job:', queueError);
            // Don't fail the bid if rescheduling fails
          }
        }

        return success({
          bid_id: bid.id,
          new_price: data.amount,
          bid_count: bidCount,
          timer_extended: timerExtended,
          new_ends_at: newEndsAt?.toISOString(),
          timer_extensions: newTimerExtensions,
        });
      });

      return result;
    } catch (error) {
      console.error('Failed to place bid (fallback):', error);
      return failure(new InternalError('Failed to place bid'));
    }
  }

  /**
   * Find bids by auction ID
   */
  async findByAuction(auctionId: string): Promise<AppResult<Bid[]>> {
    try {
      const results = await db.query.bids.findMany({
        where: eq(bids.auctionId, auctionId),
        with: {
          bidder: true,
        },
        orderBy: desc(bids.createdAt),
      });

      return success(results);
    } catch (error) {
      return failure(new NotFoundError('Bids for auction'));
    }
  }

  /**
   * Find bids by user ID
   */
  async findByUser(userId: string): Promise<AppResult<Bid[]>> {
    try {
      const results = await db.query.bids.findMany({
        where: eq(bids.bidderId, userId),
        with: {
          auction: {
            with: {
              product: true,
            },
          },
        },
        orderBy: desc(bids.createdAt),
      });

      return success(results);
    } catch (error) {
      return failure(new NotFoundError('Bids for user'));
    }
  }
}
