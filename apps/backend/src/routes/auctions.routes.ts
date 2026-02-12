import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  createAuctionSchema,
  startStreamAuctionSchema,
  auctionFiltersSchema,
  uuidParamSchema,
} from '../schemas/auctions.schemas';
import { AuctionsService } from '../services/auctions.service';

const router = Router();
const auctionsService = new AuctionsService();

/**
 * POST /auctions
 * Create standalone/pre-bidding auction (not tied to live stream)
 * Protected - SELLER role required
 */
router.post(
  '/',
  authenticate,
  requireRoles('SELLER'),
  validate(createAuctionSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await auctionsService.create(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Auction created successfully',
    });
  }),
);

/**
 * POST /auctions/stream
 * Start auction for a product during a live stream
 * Protected - SELLER role required
 */
router.post(
  '/stream',
  authenticate,
  requireRoles('SELLER'),
  validate(startStreamAuctionSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await auctionsService.startStreamAuction(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Live auction started',
    });
  }),
);

/**
 * GET /auctions
 * Get all auctions with optional filters
 * Public route
 */
router.get(
  '/',
  validate(auctionFiltersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await auctionsService.findAll(req.query as any);

    if (result.isErr()) {
      throw result.error;
    }

    const data = result.value;
    res.status(200).json({
      success: true,
      data: data.items || data,
      meta: {
        totalCount: data.totalCount || (Array.isArray(data) ? data.length : 0),
        totalPages: data.totalPages || 1,
      },
    });
  }),
);

/**
 * GET /auctions/stream/:streamId
 * Get all auctions for a specific stream
 * Public route
 */
router.get(
  '/stream/:streamId',
  asyncHandler(async (req: Request, res: Response) => {
    const streamId = req.params.streamId as string;
    const result = await auctionsService.findByStream(streamId);

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
 * GET /auctions/:id
 * Get auction by ID
 * Public route
 */
router.get(
  '/:id',
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await auctionsService.findById(id);

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
 * DELETE /auctions/:id
 * Cancel an auction (only if no bids)
 * Protected - SELLER role required and must own auction
 */
router.delete(
  '/:id',
  authenticate,
  requireRoles('SELLER'),
  validate(uuidParamSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const auctionId = req.params.id as string;
    const result = await auctionsService.cancel(auctionId, userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Auction cancelled',
    });
  }),
);

/**
 * POST /auctions/:id/extend
 * Extend auction duration (seller only, during active auction)
 * Protected - SELLER role required
 */
router.post(
  '/:id/extend',
  authenticate,
  requireRoles('SELLER'),
  validate(uuidParamSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const auctionId = req.params.id as string;
    const { extension_seconds = 30 } = req.body;

    const result = await auctionsService.extendAuction(
      auctionId,
      userId,
      extension_seconds,
    );

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: `Auction extended by ${extension_seconds} seconds`,
    });
  }),
);

export default router;
