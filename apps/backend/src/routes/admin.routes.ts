import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { AdminService } from '../services/admin.service';

const router = Router();
const adminService = new AdminService();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listActivitySchema = z.object({
  query: paginationSchema.extend({
    areas: z
      .preprocess((value) => {
        if (typeof value !== 'string') return undefined;
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }, z.array(z.enum(['applications', 'reports', 'refunds'])).optional())
      .optional(),
  }),
});

const analyticsOverviewSchema = z.object({
  query: z.object({
    lookback_days: z
      .preprocess((value) => {
        if (value === undefined) return undefined;
        return Number(value);
      }, z.number().int().min(1).max(365).optional()),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }).refine(
    (data) => {
      // Either lookback_days OR (start_date AND end_date) must be provided
      const hasLookback = data.lookback_days !== undefined;
      const hasDateRange = data.start_date !== undefined && data.end_date !== undefined;
      return hasLookback || hasDateRange;
    },
    {
      message: "Either lookback_days or both start_date and end_date must be provided",
    }
  ),
});

const listDisputesSchema = z.object({
  query: paginationSchema.extend({
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
          z.enum([
            'pending',
            'held',
            'releasing',
            'released',
            'refunding',
            'refunded',
            'disputed',
            'cancelled',
          ]),
        )
        .optional())
      .optional(),
  }),
});

const resolveDisputeSchema = z.object({
  body: z.object({
    resolution: z.enum(['release', 'refund']),
    reason: z.string().min(2).max(500),
  }),
  params: z.object({
    escrowId: z.string().uuid(),
  }),
});

const listUsersSchema = z.object({
  query: paginationSchema.extend({
    query: z.string().max(120).optional(),
    role: z.enum(['USER', 'SELLER', 'ADMIN']).optional(),
    account_status: z
      .enum(['active', 'suspended', 'banned', 'under_review'])
      .optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      account_status: z
        .enum(['active', 'suspended', 'banned', 'under_review'])
        .optional(),
      is_admin: z.boolean().optional(),
      is_seller: z.boolean().optional(),
    })
    .refine(
      (value) =>
        value.account_status !== undefined ||
        value.is_admin !== undefined ||
        value.is_seller !== undefined,
      {
        message: 'At least one field must be provided',
      },
    ),
});

const bulkUpdateUsersSchema = z.object({
  body: z.object({
    user_ids: z.array(z.string().uuid()).min(1).max(100),
    account_status: z
      .enum(['active', 'suspended', 'banned', 'under_review'])
      .optional(),
    is_admin: z.boolean().optional(),
    is_seller: z.boolean().optional(),
  }).refine(
    (value) =>
      value.account_status !== undefined ||
      value.is_admin !== undefined ||
      value.is_seller !== undefined,
    {
      message: 'At least one field must be provided',
    },
  ),
});

router.get(
  '/activity',
  authenticate,
  requireRoles('ADMIN'),
  validate(listActivitySchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = listActivitySchema.parse({ query: req.query });
    const { page, limit, areas } = parsed.query;

    const result = await adminService.listActivity({ page, limit, areas });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

router.get(
  '/analytics/overview',
  authenticate,
  requireRoles('ADMIN'),
  validate(analyticsOverviewSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = analyticsOverviewSchema.parse({ query: req.query });
    
    let result;
    if (parsed.query.start_date && parsed.query.end_date) {
      // Calculate lookback days from date range
      const start = new Date(parsed.query.start_date);
      const end = new Date(parsed.query.end_date);
      const lookbackDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      result = await adminService.getAnalyticsOverview(Math.max(1, lookbackDays), {
        startDate: start,
        endDate: end
      });
    } else {
      const lookbackDays = parsed.query.lookback_days || 30;
      result = await adminService.getAnalyticsOverview(lookbackDays);
    }
    
    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

router.get(
  '/disputes',
  authenticate,
  requireRoles('ADMIN'),
  validate(listDisputesSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = listDisputesSchema.parse({ query: req.query });
    const { page, limit, statuses } = parsed.query;

    const result = await adminService.listDisputes({
      page,
      limit,
      statuses,
    });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

router.post(
  '/disputes/:escrowId/resolve',
  authenticate,
  requireRoles('ADMIN'),
  validate(resolveDisputeSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = resolveDisputeSchema.parse({ body: req.body, params: req.params });

    const result = await adminService.resolveDispute({
      escrowId: parsed.params.escrowId,
      resolution: parsed.body.resolution,
      reason: parsed.body.reason,
    });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: `Dispute resolved via ${parsed.body.resolution}`,
      data: result.value,
    });
  }),
);

router.get(
  '/users',
  authenticate,
  requireRoles('ADMIN'),
  validate(listUsersSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = listUsersSchema.parse({ query: req.query });
    const { page, limit, query, role, account_status } = parsed.query;

    const result = await adminService.listUsers({
      page,
      limit,
      query,
      role,
      accountStatus: account_status,
    });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

router.patch(
  '/users/:id',
  authenticate,
  requireRoles('ADMIN'),
  validate(updateUserSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = updateUserSchema.parse({ body: req.body, params: req.params });

    const result = await adminService.updateUser({
      actorId: req.user!.id,
      userId: parsed.params.id,
      accountStatus: parsed.body.account_status,
      isAdmin: parsed.body.is_admin,
      isSeller: parsed.body.is_seller,
    });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: result.value,
    });
  }),
);

router.post(
  '/users/bulk-update',
  authenticate,
  requireRoles('ADMIN'),
  validate(bulkUpdateUsersSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = bulkUpdateUsersSchema.parse({ body: req.body });

    const result = await adminService.bulkUpdateUsers({
      actorId: req.user!.id,
      userIds: parsed.body.user_ids,
      accountStatus: parsed.body.account_status,
      isAdmin: parsed.body.is_admin,
      isSeller: parsed.body.is_seller,
    });

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: `${result.value.updatedCount} users updated successfully`,
      data: result.value,
    });
  }),
);

export default router;
