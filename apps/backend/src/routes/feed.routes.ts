import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { recommendationService } from '../services/recommendation.service';

const router = Router();

/**
 * GET /api/feed/for-you
 * Personalized feed for authenticated users, trending for guests
 */
router.get(
  '/for-you',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    if (!userId) {
      // Return trending for non-authenticated users
      const trending = await recommendationService.getTrendingProducts(
        limit,
        offset,
      );
      if (trending.isErr()) throw trending.error;
      return res.json({ success: true, data: trending.value });
    }

    const feed = await recommendationService.getForYouFeed(
      userId,
      limit,
      offset,
    );
    if (feed.isErr()) throw feed.error;

    return res.json({ success: true, data: feed.value });
  }),
);

/**
 * GET /api/feed/trending
 * Trending products for everyone
 */
router.get(
  '/trending',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const trending = await recommendationService.getTrendingProducts(
      limit,
      offset,
    );
    if (trending.isErr()) throw trending.error;

    return res.json({ success: true, data: trending.value });
  }),
);

/**
 * POST /api/feed/track-click
 * Track when user clicks a recommendation
 */
router.post(
  '/track-click',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;
    const userId = req.user!.id;

    const result = await recommendationService.trackClick(userId, productId);
    if (result.isErr()) throw result.error;

    res.json({ success: true, data: result.value });
  }),
);

export default router;
