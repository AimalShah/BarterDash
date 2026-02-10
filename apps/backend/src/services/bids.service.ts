import { BidsRepository } from '../repositories/bids.repository';
import { AutoBidsService } from './auto-bids.service';
import { AuthService } from './auth.service';
import { AppResult, failure } from '../utils/result';
import { Bid } from '../db/schema';
import { CreateBidInput } from '../schemas/bids.schemas';

/**
 * Bids Service
 * Business logic for bidding
 */
export class BidsService {
  private repository: BidsRepository;
  private autoBidsService: AutoBidsService;
  private authService: AuthService;

  constructor() {
    this.repository = new BidsRepository();
    this.autoBidsService = new AutoBidsService();
    this.authService = new AuthService();
  }

  /**
   * Place a bid
   */
  async placeBid(
    userId: string,
    data: CreateBidInput,
  ): Promise<AppResult<any>> {
    // Ensure the bidder has a profile record; create one if missing.
    const profileResult = await this.authService.getProfile(userId);
    if (profileResult.isErr()) {
      return failure(profileResult.error);
    }

    const result = await this.repository.placeBid(userId, data);

    if (result.isOk()) {
      // Trigger auto-bid processing in the background (don't await to keep response fast)
      this.autoBidsService
        .processAutoBids(data.auction_id, userId, data.amount)
        .catch((err: Error) =>
          console.error('Auto-bid processing failed:', err),
        );
    }

    return result;
  }

  /**
   * Get auction bid history
   */
  async getAuctionBids(auctionId: string): Promise<AppResult<Bid[]>> {
    return await this.repository.findByAuction(auctionId);
  }

  /**
   * Get user bid history
   */
  async getMyBids(userId: string): Promise<AppResult<Bid[]>> {
    return await this.repository.findByUser(userId);
  }
}
