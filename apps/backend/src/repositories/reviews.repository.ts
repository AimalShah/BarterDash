import { db, reviews } from '../db';
import { eq, desc } from 'drizzle-orm';
import { AppResult, success, failure, ValidationError } from '../utils/result';
import { Review, NewReview } from '../db/schema';

export class ReviewsRepository {
  /**
   * Get all reviews for a specific seller
   */
  async findBySellerId(sellerId: string): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.reviews.findMany({
        where: eq(reviews.sellerId, sellerId),
        orderBy: [desc(reviews.createdAt)],
        with: {
          reviewer: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch reviews'));
    }
  }

  /**
   * Create a new review
   */
  async create(data: NewReview): Promise<AppResult<Review>> {
    try {
      const [newReview] = await db.insert(reviews).values(data).returning();
      return success(newReview);
    } catch (error) {
      return failure(new ValidationError('Failed to create review'));
    }
  }
}
