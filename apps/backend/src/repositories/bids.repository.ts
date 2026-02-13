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

export class BidsRepository {
  private readonly TIMER_EXTENSION_THRESHOLD_MS = 10 * 1000;
  private readonly TIMER_EXTENSION_DURATION_MS = 10 * 1000;
  private readonly DEFAULT_MAX_TIMER_EXTENSIONS = 10;

  async getAuctionForBid(auctionId: string): Promise<AppResult<any>> {
    try {
      const result = await db.execute(sql`
        SELECT
          a.id,
          a.status,
          a.current_bid,
          a.starting_bid,
          a.ends_at,
          a.minimum_bid_increment,
          a.mode,
          p.seller_id
        FROM auctions a
        JOIN products p ON p.id = a.product_id
        WHERE a.id = ${auctionId}
      `);

      const rows = (result as any)?.rows;
      if (!rows || rows.length === 0) {
        return failure(new NotFoundError('Auction', auctionId));
      }

      return success(rows[0]);
    } catch (error) {
      console.error('[BidsRepository] Failed to get auction:', error);
      return failure(new InternalError('Failed to get auction'));
    }
  }

  async placeBid(userId: string, data: CreateBidInput): Promise<AppResult<any>> {
    try {
      console.log('[BidsRepository] Placing bid:', { auction: data.auction_id, user: userId, amount: data.amount });

      const auctionCheck = await db.execute(sql`
        SELECT
          a.id,
          a.status,
          a.current_bid,
          a.starting_bid,
          a.ends_at,
          a.mode,
          a.timer_extensions,
          a.max_timer_extensions,
          p.seller_id
        FROM auctions a
        JOIN products p ON p.id = a.product_id
        WHERE a.id = ${data.auction_id}
        AND a.status IN ('active', 'live')
      `);

      const auctionRows = (auctionCheck as any)?.rows;
      if (!auctionRows || auctionRows.length === 0) {
        return failure(new NotFoundError('Active auction', data.auction_id));
      }

      const auction = auctionRows[0];
      const now = new Date();
      const endsAt = auction.ends_at ? new Date(auction.ends_at) : null;

      if (auction.seller_id === userId) {
        return failure(
          new ValidationError('Sellers cannot bid on their own auctions'),
        );
      }

      if (endsAt && endsAt.getTime() < now.getTime()) {
        return failure(new ValidationError('Auction has ended'));
      }

      const result = await db.transaction(async (tx) => {
        const lockResult = await tx.execute(sql`
          SELECT
            a.id,
            a.current_bid,
            a.starting_bid,
            a.minimum_bid_increment,
            a.status,
            a.ends_at,
            a.bid_count,
            a.mode,
            a.timer_extensions,
            a.max_timer_extensions,
            a.original_ends_at,
            p.seller_id
          FROM auctions a
          JOIN products p ON p.id = a.product_id
          WHERE a.id = ${data.auction_id}
          AND a.status IN ('active', 'live')
          AND (a.ends_at IS NULL OR a.ends_at > NOW())
          FOR UPDATE
        `);

        const lockedAuction = (lockResult as any)?.rows?.[0];
        if (!lockedAuction) {
          return failure(new NotFoundError('Auction', data.auction_id));
        }

        const auctionStatus = lockedAuction.status as string;
        if (!['active', 'live'].includes(auctionStatus)) {
          return failure(new ValidationError('Auction is not active'));
        }

        if (lockedAuction.seller_id === userId) {
          return failure(
            new ValidationError('Sellers cannot bid on their own auctions'),
          );
        }

        const auctionEndsAt = lockedAuction.ends_at ? new Date(lockedAuction.ends_at) : null;
        if (auctionEndsAt && auctionEndsAt.getTime() < now.getTime()) {
          return failure(new ValidationError('Auction has ended'));
        }

        const currentBid = Number(lockedAuction.current_bid ?? lockedAuction.starting_bid ?? 0);
        const minIncrement = Number(lockedAuction.minimum_bid_increment ?? 1);
        const minimumBid = currentBid + minIncrement;

        if (data.amount < minimumBid) {
          return failure(new ValidationError(`Bid must be at least $${minimumBid}`));
        }

        let newEndsAt = auctionEndsAt;
        let timerExtended = false;
        let newTimerExtensions = Number(lockedAuction.timer_extensions ?? 0);
        const maxTimerExtensions = Number(lockedAuction.max_timer_extensions ?? this.DEFAULT_MAX_TIMER_EXTENSIONS);
        const isSuddenDeath = lockedAuction.mode === 'sudden_death';

        if (auctionEndsAt && !isSuddenDeath) {
          const remainingTime = auctionEndsAt.getTime() - now.getTime();

          if (remainingTime < this.TIMER_EXTENSION_THRESHOLD_MS && newTimerExtensions < maxTimerExtensions) {
            newEndsAt = new Date(auctionEndsAt.getTime() + this.TIMER_EXTENSION_DURATION_MS);
            timerExtended = true;
            newTimerExtensions += 1;

            console.log(`[BidsRepository] Timer extended: +10s (extension ${newTimerExtensions}/${maxTimerExtensions})`);
          }
        }

        await tx
          .update(bids)
          .set({ isWinning: false })
          .where(eq(bids.auctionId, data.auction_id));

        const [bid] = await tx
          .insert(bids)
          .values({
            auctionId: data.auction_id,
            bidderId: userId,
            amount: data.amount.toString(),
            isWinning: true,
          })
          .returning();

        const bidCount = Number(lockedAuction.bid_count ?? 0) + 1;

        const updateData: any = {
          currentBid: data.amount.toString(),
          currentBidderId: userId,
          bidCount,
          updatedAt: now,
        };

        if (timerExtended) {
          if (!lockedAuction.original_ends_at) {
            updateData.originalEndsAt = auctionEndsAt;
          }
          updateData.timerExtensions = newTimerExtensions;
          updateData.endsAt = newEndsAt;
        }

        await tx
          .update(auctions)
          .set(updateData)
          .where(eq(auctions.id, data.auction_id));

        if (timerExtended && newEndsAt) {
          try {
            const existingJob = await auctionQueue.getJob(data.auction_id);
            if (existingJob) {
              await existingJob.remove();
            }

            const delay = newEndsAt.getTime() - Date.now();
            await auctionQueue.add(
              'end-auction',
              { auctionId: data.auction_id },
              {
                delay: delay > 0 ? delay : 0,
                removeOnComplete: true,
                jobId: data.auction_id,
              }
            );
          } catch (queueError) {
            console.error('[BidsRepository] Failed to reschedule auction job:', queueError);
          }
        }

        return success({
          id: bid.id,
          auction_id: data.auction_id,
          bidder_id: userId,
          amount: data.amount,
          created_at: bid.createdAt,
          is_winning: true,
          bid_count: bidCount,
          timer_extended: timerExtended,
          new_ends_at: newEndsAt?.toISOString(),
          timer_extensions: newTimerExtensions,
        });
      });

      return result;
    } catch (error) {
      console.error('[BidsRepository] Failed to place bid:', error);
      return failure(new InternalError('Failed to place bid'));
    }
  }

  async findByAuction(auctionId: string): Promise<AppResult<Bid[]>> {
    try {
      const results = await db.query.bids.findMany({
        where: eq(bids.auctionId, auctionId),
        with: { bidder: true },
        orderBy: desc(bids.createdAt),
      });

      return success(results);
    } catch (error) {
      console.error('[BidsRepository] Failed to find bids:', error);
      return failure(new NotFoundError('Bids for auction'));
    }
  }

  async findByUser(userId: string): Promise<AppResult<Bid[]>> {
    try {
      const results = await db.query.bids.findMany({
        where: eq(bids.bidderId, userId),
        with: {
          auction: {
            with: { product: true },
          },
        },
        orderBy: desc(bids.createdAt),
      });

      return success(results);
    } catch (error) {
      console.error('[BidsRepository] Failed to find user bids:', error);
      return failure(new NotFoundError('Bids for user'));
    }
  }
}
