import { ReviewsRepository } from '../repositories/reviews.repository';
import { AppResult } from '../utils/result';
import { NewReview, Review } from '../db/schema';

export class ReviewsService {
  private repository: ReviewsRepository;

  constructor() {
    this.repository = new ReviewsRepository();
  }

  /**
   * Get reviews for a seller
   */
  async getSellerReviews(sellerId: string): Promise<AppResult<any[]>> {
    return await this.repository.findBySellerId(sellerId);
  }

  /**
   * Create a new review
   */
  async createReview(data: NewReview): Promise<AppResult<Review>> {
    // Here you could add logic to verify the user actually bought the item
    return await this.repository.create(data);
  }
}
