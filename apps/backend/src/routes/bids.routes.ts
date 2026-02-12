import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { createBidSchema, createMaxBidSchema, auctionIdParamSchema } from '../schemas/bids.schemas';
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

/**
 * POST /bids/max
 * Place a max bid (auto-bidding)
 * Protected - requires JWT
 */
router.post(
  '/max',
  authenticate,
  validate(createMaxBidSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await bidsService.placeMaxBid(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Max bid placed successfully',
    });
  }),
);

/**
 * GET /bids/my-max-bids
 * Get current user's active max bids
 * Protected - requires JWT
 */
router.get(
  '/my-max-bids',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await bidsService.getMyMaxBids(userId);

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
 * DELETE /bids/max/:id
 * Cancel a max bid
 * Protected - requires JWT
 */
router.delete(
  '/max/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const maxBidId = req.params.id as string;
    const result = await bidsService.cancelMaxBid(userId, maxBidId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Max bid cancelled successfully',
    });
  }),
);

export default router;
