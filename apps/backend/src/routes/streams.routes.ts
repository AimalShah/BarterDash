import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { StreamsService } from '../services/streams.service';
import { NotificationsService } from '../services/notifications.service';
import { z } from 'zod';
import { handleResult } from '../utils/result-handler';

const router = Router();
const streamsService = new StreamsService();
const notificationsService = new NotificationsService();

// Helper function to transform stream data to match frontend expectations
const transformStream = (stream: any) => {
  if (!stream) return null;

  return {
    id: stream.id,
    sellerId: stream.sellerId,
    title: stream.title,
    description: stream.description,
    categoryId: stream.categoryId,
    thumbnailUrl: stream.thumbnailUrl,
    status: stream.status,
    scheduledStart: stream.scheduledStart,
    startedAt: stream.actualStart,
    endedAt: stream.actualEnd,
    agoraChannelName: stream.agoraChannelName,
    streamKey: stream.streamKey,
    viewerCount: stream.viewerCount,
    peakViewerCount: stream.peakViewerCount,
    totalSales: stream.totalSales,
    chatEnabled: stream.chatEnabled,
    createdAt: stream.createdAt,
    updatedAt: stream.updatedAt,
    seller: stream.seller,
    category: stream.category,
    products: stream.products,
  };
};

// Validation schemas
const createStreamSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(1000).optional().default(''),
    category_id: z.string().uuid('Invalid category ID'),
    schedule_start: z.string().datetime('Invalid datetime format').optional(),
    thumbnail_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
});

const getStreamsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['live', 'scheduled', 'ended', 'all']).optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    search: z.string().optional(),
    limit: z.string().transform(Number).optional().default('20'),
    offset: z.string().transform(Number).optional().default('0'),
  }),
});

const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid stream ID'),
  }),
});

const updateStreamSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    category_id: z.string().uuid('Invalid category ID').optional(),
    schedule_start: z.string().datetime('Invalid datetime format').optional(),
    thumbnail_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
});

const addProductSchema = z.object({
  body: z.object({
    product_id: z.string().uuid('Invalid product ID'),
    display_order: z.number().int().min(0).optional().nullable(),
  }),
});

const updateStreamProductSchema = z.object({
  body: z.object({
    status: z.enum(['upcoming', 'active', 'sold', 'passed']).optional(),
    display_order: z.number().int().min(0).optional(),
  }),
});

const streamProductParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid stream ID'),
    productId: z.string().uuid('Invalid stream product ID'),
  }),
});

// Get all streams
router.get(
  '/',
  validate(getStreamsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, category_id, search, limit, offset } = req.query as any;

    const result = await streamsService.getStreams({
      status: status === 'all' ? undefined : status,
      categoryId: category_id,
      search,
      limit: Number(limit) || 20,
      offset: Number(offset) || 0,
    });

    handleResult(result, res, (data) => ({
      success: true,
      data: data.items.map(transformStream),
      meta: {
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
      },
    }));
  }),
);

// Get my streams
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await streamsService.getStreamsBySeller(user.id);

    handleResult(result, res, (data) => ({
      success: true,
      data: data.map(transformStream),
    }));
  }),
);

// Get stream by ID
router.get(
  '/:id',
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await streamsService.getStreamById(id);

    handleResult(result, res, (data) => ({
      success: true,
      data: transformStream(data),
    }));
  }),
);

// Create stream
router.post(
  '/create',
  authenticate,
  validate(createStreamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { title, description, category_id, schedule_start, thumbnail_url } =
      req.body;

    const scheduledStartDate = schedule_start
      ? new Date(schedule_start)
      : new Date();

    if (isNaN(scheduledStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid schedule_start date',
      });
    }

    const result = await streamsService.createStream({
      sellerId: user.id,
      title,
      description,
      categoryId: category_id,
      scheduledStart: scheduledStartDate,
      thumbnailUrl: thumbnail_url,
    });

    handleResult(
      result,
      res,
      (data) => ({
        success: true,
        data: transformStream(data),
      }),
      201,
    );
  }),
);

// Start stream
router.post(
  '/start',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { stream_id, conference_room_id } = req.body;
    const user = (req as any).user;

    const result = await streamsService.startStream(
      stream_id,
      user.id,
      conference_room_id,
    );

    handleResult(result, res, (data) => {
      // Notify followers that seller is now live (don't await)
      notificationsService
        .notifyFollowersOfLiveStream(user.id, stream_id)
        .catch((err) => {
          console.error('Failed to notify followers:', err);
        });

      return {
        success: true,
        data: {
          stream: transformStream(data.stream),
          sellerToken: data.sellerToken ?? null,
        },
      };
    });
  }),
);

// Get Stream host token
router.post(
  '/:id/host-token',
  authenticate,
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    const streamResult = await streamsService.getStreamById(id);
    if (streamResult.isErr()) throw streamResult.error;

    if (streamResult.value.sellerId !== user.id) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    const result = await streamsService.getStreamVideoToken(id, user.id);
    handleResult(result, res, (data) => ({
      success: true,
      data,
    }));
  }),
);

// Get Stream viewer token
router.post(
  '/:id/viewer-token',
  authenticate,
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    const result = await streamsService.getStreamVideoToken(id, user.id);
    handleResult(result, res, (data) => ({
      success: true,
      data,
    }));
  }),
);

// End stream
router.post(
  '/end',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { stream_id } = req.body;
    const user = (req as any).user;

    const result = await streamsService.endStream(stream_id, user.id);

    handleResult(result, res, (data) => ({
      success: true,
      data: transformStream(data),
    }));
  }),
);

// Cancel stream (scheduled streams only)
router.delete(
  '/:id',
  authenticate,
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    const result = await streamsService.cancelStream(id, user.id);

    handleResult(result, res, (data) => ({
      success: true,
      data: transformStream(data),
      message: 'Stream cancelled successfully',
    }));
  }),
);

// Join stream - increment viewer count
router.post(
  '/:id/join',
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await streamsService.joinStream(id);

    handleResult(result, res, (data) => ({
      success: true,
      data: {
        stream: transformStream(data.stream),
        viewerCount: data.viewerCount,
      },
    }));
  }),
);

// Leave stream - decrement viewer count
router.post(
  '/:id/leave',
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await streamsService.leaveStream(id);

    handleResult(result, res, (data) => ({
      success: true,
      data: { viewerCount: data.viewerCount },
    }));
  }),
);

// Subscribe to stream notifications (Notify Me feature)
router.post(
  '/:id/subscribe',
  authenticate,
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    const result = await streamsService.subscribeToStream(id, user.id);

    handleResult(result, res, () => ({
      success: true,
      message:
        'Subscribed successfully. You will be notified when the stream goes live.',
    }));
  }),
);

// Update stream details
router.put(
  '/:id',
  authenticate,
  validate(updateStreamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    const { title, description, category_id, schedule_start, thumbnail_url } =
      req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.categoryId = category_id;
    if (schedule_start !== undefined)
      updateData.scheduledStart = new Date(schedule_start);
    if (thumbnail_url !== undefined) updateData.thumbnailUrl = thumbnail_url;

    const result = await streamsService.updateStream(id, user.id, updateData);

    handleResult(result, res, (data) => ({
      success: true,
      data: transformStream(data),
      message: 'Stream updated successfully',
    }));
  }),
);

// Get products in stream
router.get(
  '/:id/products',
  validate(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await streamsService.getStreamProducts(id);

    handleResult(result, res, (data) => ({
      success: true,
      data,
    }));
  }),
);

// Add product to stream
router.post(
  '/:id/products',
  authenticate,
  validate(addProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const user = (req as any).user;
    const { product_id, display_order } = req.body;

    console.log('[StreamsRoute] Add product to stream:', {
      streamId: id,
      userId: user.id,
      product_id,
      display_order,
      body: req.body,
    });

    const result = await streamsService.addProductToStream(id, user.id, {
      streamId: id,
      productId: product_id,
      displayOrder: display_order,
    });

    handleResult(
      result,
      res,
      (data) => ({
        success: true,
        data,
        message: 'Product added to stream successfully',
      }),
      201,
    );
  }),
);

// Remove product from stream
router.delete(
  '/:id/products/:productId',
  authenticate,
  validate(streamProductParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = req.params as { id: string; productId: string };
    const user = (req as any).user;

    const result = await streamsService.removeProductFromStream(
      id,
      productId,
      user.id,
    );

    handleResult(result, res, () => ({
      success: true,
      message: 'Product removed from stream successfully',
    }));
  }),
);

// Update stream product
router.put(
  '/:id/products/:productId',
  authenticate,
  validate(updateStreamProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = req.params as { id: string; productId: string };
    const user = (req as any).user;
    const { status, display_order } = req.body;

    const result = await streamsService.updateStreamProduct(
      id,
      productId,
      user.id,
      {
        status,
        displayOrder: display_order,
      },
    );

    handleResult(result, res, (data) => ({
      success: true,
      data,
      message: 'Stream product updated successfully',
    }));
  }),
);

// Mark stream product as active
router.put(
  '/:id/products/:productId/active',
  authenticate,
  validate(streamProductParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = req.params as { id: string; productId: string };
    const user = (req as any).user;

    const result = await streamsService.markProductAsActive(
      id,
      productId,
      user.id,
    );

    handleResult(result, res, (data) => ({
      success: true,
      data,
      message: 'Product marked as active',
    }));
  }),
);

// Mark stream product as sold
router.put(
  '/:id/products/:productId/sold',
  authenticate,
  validate(streamProductParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = req.params as { id: string; productId: string };
    const user = (req as any).user;

    const result = await streamsService.markProductAsSold(
      id,
      productId,
      user.id,
    );

    handleResult(result, res, (data) => ({
      success: true,
      data,
      message: 'Product marked as sold',
    }));
  }),
);

export default router;
