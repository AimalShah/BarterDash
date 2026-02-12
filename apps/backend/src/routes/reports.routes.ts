import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { z } from 'zod';
import { ReportsService } from '../services/reports.service';

const router = Router();
const reportsService = new ReportsService();

const createReportSchema = z.object({
  body: z.object({
    reported_user_id: z.string().uuid().optional(),
    reported_product_id: z.string().uuid().optional(),
    reported_stream_id: z.string().uuid().optional(),
    report_type: z.string().min(1, 'Report type is required'),
    description: z.string().min(1, 'Description is required'),
  }),
});

const resolveReportSchema = z.object({
  body: z.object({
    status: z.enum(['resolved', 'dismissed']),
    review_notes: z.string().optional(),
    action_taken: z.string().optional(),
  }),
});

router.post(
  '/',
  authenticate,
  validate(createReportSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { reported_user_id, reported_product_id, reported_stream_id, report_type, description } = req.body;

    const result = await reportsService.submitReport(userId, {
      reportedUserId: reported_user_id,
      reportedProductId: reported_product_id,
      reportedStreamId: reported_stream_id,
      reportType: report_type,
      description,
    });

    if (result.isErr()) throw result.error;

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Report submitted successfully',
    });
  }),
);

router.get(
  '/my-reports',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await reportsService.getReportsByReporter(userId);

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
    const reportId = req.params.id as string;
    const result = await reportsService.getReport(reportId);

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
    });
  }),
);

router.patch(
  '/:id/resolve',
  authenticate,
  requireRoles('ADMIN'),
  validate(resolveReportSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.id;
    const reportId = req.params.id as string;
    const { status, review_notes, action_taken } = req.body;

    const result = await reportsService.resolveReport(
      reportId,
      adminId,
      status,
      review_notes,
      action_taken,
    );

    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
      message: 'Report resolved successfully',
    });
  }),
);

export default router;
