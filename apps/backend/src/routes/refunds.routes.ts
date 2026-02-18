import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { z } from 'zod';
import { RefundsService } from '../services/refunds.service';

const router = Router();
const refundsService = new RefundsService();

const requestRefundSchema = z.object({
  body: z.object({
    order_id: z.string().uuid('Invalid order ID'),
    reason: z.string().min(1, 'Reason is required'),
    amount: z.number().positive('Amount must be positive'),
  }),
});

const processRefundSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    notes: z.string().optional(),
  }),
});

const adminListRefundsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    statuses: z
      .preprocess((value) => {
        if (typeof value !== 'string') return undefined;
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      },
      z
        .array(
          z.enum(['pending', 'approved', 'rejected', 'processing', 'completed']),
        )
        .optional())
      .optional(),
  }),
});

router.get(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  validate(adminListRefundsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = adminListRefundsSchema.parse({ query: req.query });
    const { page, limit, statuses } = parsed.query;

    const result = await refundsService.listAdminRefunds({
      page,
      limit,
      statuses,
    });

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
  validate(requestRefundSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { order_id, reason, amount } = req.body;

    const result = await refundsService.requestRefund(userId, {
      orderId: order_id,
      reason,
      amount,
    });

    if (result.isErr()) throw result.error;

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Refund request submitted successfully',
    });
  }),
);

router.get(
  '/order/:orderId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await refundsService.getOrderRefunds(orderId);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
    });
  }),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const refundId = req.params.id as string;
    const result = await refundsService.getRefund(refundId);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
    });
  }),
);

router.patch(
  '/:id/process',
  authenticate,
  requireRoles('ADMIN'),
  validate(processRefundSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.id;
    const refundId = req.params.id as string;
    const { status, notes } = req.body;

    const result = await refundsService.processRefund(adminId, refundId, status, notes || '');

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
      message: `Refund ${status} successfully`,
    });
  }),
);

export default router;
