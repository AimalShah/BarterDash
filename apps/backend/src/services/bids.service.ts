import { BidsRepository } from '../repositories/bids.repository';
import { AutoBidsRepository } from '../repositories/auto-bids.repository';
import { AuthService } from './auth.service';
import { AppResult, success, failure } from '../utils/result';
import { Bid } from '../db/schema';
import { CreateBidInput, CreateMaxBidInput } from '../schemas/bids.schemas';
import { ValidationError, NotFoundError } from '../utils/result';

export class BidsService {
  private repository: BidsRepository;
  private autoBidsRepository: AutoBidsRepository;
  private authService: AuthService;

  constructor() {
    this.repository = new BidsRepository();
    this.autoBidsRepository = new AutoBidsRepository();
    this.authService = new AuthService();
  }

  async placeBid(userId: string, data: CreateBidInput): Promise<AppResult<any>> {
    const profileResult = await this.authService.getProfile(userId);
    if (profileResult.isErr()) {
      return failure(profileResult.error);
    }

    const result = await this.repository.placeBid(userId, data);

    if (result.isOk() && data.is_max_bid) {
      await this.autoBidsRepository.createOrUpdate({
        auction_id: data.auction_id,
        bidder_id: userId,
        max_amount: data.amount,
      });
    }

    return result;
  }

  async placeMaxBid(userId: string, data: CreateMaxBidInput): Promise<AppResult<any>> {
    const profileResult = await this.authService.getProfile(userId);
    if (profileResult.isErr()) {
      return failure(profileResult.error);
    }

    const auctionResult = await this.repository.getAuctionForBid(data.auction_id);
    if (auctionResult.isErr()) {
      return failure(auctionResult.error);
    }

    const auction = auctionResult.value;
    const currentBid = Number(auction.current_bid ?? auction.starting_bid ?? 0);

    if (data.max_amount <= currentBid) {
      return failure(new ValidationError('Max bid must be higher than current bid'));
    }

    const bidPayload: CreateBidInput = {
      auction_id: data.auction_id,
      amount: data.max_amount,
      is_max_bid: true,
    };

    return await this.placeBid(userId, bidPayload);
  }

  async getAuctionBids(auctionId: string): Promise<AppResult<Bid[]>> {
    return await this.repository.findByAuction(auctionId);
  }

  async getMyBids(userId: string): Promise<AppResult<Bid[]>> {
    return await this.repository.findByUser(userId);
  }

  async getMyMaxBids(userId: string): Promise<AppResult<any[]>> {
    return await this.autoBidsRepository.findByUser(userId);
  }

  async cancelMaxBid(userId: string, maxBidId: string): Promise<AppResult<void>> {
    const maxBid = await this.autoBidsRepository.findById(maxBidId);

    if (!maxBid) {
      return failure(new NotFoundError('Max bid', maxBidId));
    }

    if (maxBid.userId !== userId) {
      return failure(new ValidationError("Cannot cancel another user's max bid"));
    }

    await this.autoBidsRepository.delete(maxBidId);
    return success(undefined);
  }
}
