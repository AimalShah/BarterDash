import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { createReviewSchema } from '../schemas/reviews.schemas';
import { ReviewsService } from '../services/reviews.service';

const router = Router();
const reviewsService = new ReviewsService();

/**
 * GET /reviews/seller/:sellerId
 * Get reviews for a specific seller
 */
router.get(
  '/seller/:sellerId',
  asyncHandler(async (req, res: Response) => {
    const result = await reviewsService.getSellerReviews(
      req.params.sellerId as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

/**
 * POST /reviews
 * Create a new review
 * Protected - requires JWT
 */
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await reviewsService.createReview({
      ...req.body,
      reviewerId: userId,
    });

    if (result.isErr()) throw result.error;

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Review created successfully',
    });
  }),
);

export default router;
