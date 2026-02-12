import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { z } from 'zod';
import { WatchlistService } from '../services/watchlist.service';

const router = Router();
const watchlistService = new WatchlistService();

const addToWatchlistSchema = z.object({
  body: z.object({
    stream_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
    notification_enabled: z.boolean().optional().default(true),
  }),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await watchlistService.getWatchlist(userId);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
    });
  }),
);

router.post(
  '/',
  authenticate,
  validate(addToWatchlistSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { stream_id, product_id, notification_enabled } = req.body;

    const result = await watchlistService.addToWatchlist(userId, {
      streamId: stream_id,
      productId: product_id,
      notificationEnabled: notification_enabled,
    } as any);

    if (result.isErr()) throw result.error;

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Added to watchlist',
    });
  }),
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const itemId = req.params.id as string;

    const result = await watchlistService.removeFromWatchlist(userId, itemId);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      message: 'Removed from watchlist',
    });
  }),
);

router.patch(
  '/:id/notifications',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const itemId = req.params.id as string;
    const { enabled } = req.body;

    const result = await watchlistService.toggleNotifications(userId, itemId, enabled);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  }),
);

export default router;
