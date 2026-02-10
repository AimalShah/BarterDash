import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { createBidSchema, auctionIdParamSchema } from '../schemas/bids.schemas';
import { BidsService } from '../services/bids.service';

const router = Router();
const bidsService = new BidsService();

/**
 * POST /bids
 * Place a bid on a live auction
 * Protected - requires JWT
 */
router.post(
  '/',
  authenticate,
  validate(createBidSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await bidsService.placeBid(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Bid placed successfully',
    });
  }),
);

/**
 * GET /bids/auction/:id
 * Get bid history for a specific auction
 * Public route
 */
router.get(
  '/auction/:id',
  validateParams(auctionIdParamSchema.shape.params),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await bidsService.getAuctionBids(id);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

/**
 * GET /bids/my-bids
 * Get current user's bid history
 * Protected - requires JWT
 */
router.get(
  '/my-bids',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await bidsService.getMyBids(userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

export default router;
