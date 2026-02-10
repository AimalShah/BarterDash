import { AutoBidsRepository } from '../repositories/auto-bids.repository';
import { BidsRepository } from '../repositories/bids.repository';
import { AppResult, failure, ValidationError } from '../utils/result';
import { db, auctions } from '../db';
import { eq } from 'drizzle-orm';

/**
 * AutoBids Service
 * Orchestrates automated bidding logic
 */
export class AutoBidsService {
  private autoBidsRepo: AutoBidsRepository;
  private bidsRepo: BidsRepository;

  constructor() {
    this.autoBidsRepo = new AutoBidsRepository();
    this.bidsRepo = new BidsRepository();
  }

  /**
   * Process auto bids for an auction after a new bid is placed
   */
  async processAutoBids(
    auctionId: string,
    currentBidderId: string,
    currentAmount: number,
  ): Promise<void> {
    try {
      const auctionResult = await db.query.auctions.findFirst({
        where: eq(auctions.id, auctionId),
      });
      if (!auctionResult) return;

      const increment = parseFloat(auctionResult.minimumBidIncrement || '1.00');
      const autoBidsResult =
        await this.autoBidsRepo.getActiveForAuction(auctionId);
      if (autoBidsResult.isErr() || autoBidsResult.value.length === 0) return;

      const activeAutoBids = autoBidsResult.value;
      // Get all auto-bids except from the current bidder
      const competingAutoBids = activeAutoBids.filter(
        (ab) => ab.userId !== currentBidderId,
      );
      if (competingAutoBids.length === 0) return;

      // Sort by max amount descending
      competingAutoBids.sort(
        (a, b) => parseFloat(b.maxAmount) - parseFloat(a.maxAmount),
      );

      const topAutoBid = competingAutoBids[0];
      const topMax = parseFloat(topAutoBid.maxAmount);

      // If there's only one auto-bid competing or it's the highest by far
      let nextHighestMax = currentAmount;
      if (competingAutoBids.length > 1) {
        nextHighestMax = parseFloat(competingAutoBids[1].maxAmount);
      }

      let newBidAmount = 0;
      if (topMax > nextHighestMax) {
        // Outbid next highest auto-bid or current manual bid
        newBidAmount = Math.min(topMax, nextHighestMax + increment);
      } else if (topMax === nextHighestMax && competingAutoBids.length > 1) {
        // Tie scenario - usually first one wins OR both keep bidding until max
        newBidAmount = topMax;
      }

      if (newBidAmount > currentAmount && newBidAmount <= topMax) {
        await this.bidsRepo.placeBid(topAutoBid.userId, {
          auction_id: auctionId,
          amount: newBidAmount,
        });

        // Update current proxy bid state
        await this.autoBidsRepo.upsert({
          userId: topAutoBid.userId,
          auctionId: auctionId,
          maxAmount: topAutoBid.maxAmount,
          currentProxyBid: newBidAmount.toString(),
        } as any);
      }
    } catch (error) {
      console.error('Error processing auto bids:', error);
    }
  }

  /**
   * Configure an auto bid for a user
   */
  async configureAutoBid(
    userId: string,
    auctionId: string,
    maxAmount: number,
  ): Promise<AppResult<any>> {
    const auction = await db.query.auctions.findFirst({
      where: eq(auctions.id, auctionId),
    });

    if (!auction) return failure(new ValidationError('Auction not found'));

    const currentPrice = parseFloat(
      auction.currentBid || auction.startingBid || '0',
    );
    const increment = parseFloat(auction.minimumBidIncrement || '1.00');

    if (maxAmount < currentPrice + increment) {
      return failure(
        new ValidationError(
          `Auto-bid must be at least ${currentPrice + increment}`,
        ),
      );
    }

    return this.autoBidsRepo.upsert({
      userId,
      auctionId,
      maxAmount: maxAmount.toString(),
    });
  }
}
