import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { requireRoles } from '../middleware/roles';
import { healthService } from '../services/health.service';
import { realtimeService } from '../services/realtime.service';

const router = Router();

/**
 * GET /health
 * Public health check endpoint
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/metrics
 * Detailed health metrics (admin only)
 */
router.get(
  '/metrics',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (_req, res: Response) => {
    const metrics = await healthService.getHealthMetrics();
    
    res.json({
      success: true,
      data: metrics,
    });
  }),
);

/**
 * GET /health/status
 * Service status overview (admin only)
 */
router.get(
  '/status',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (_req, res: Response) => {
    const status = await healthService.getServiceStatus();
    
    res.json({
      success: true,
      data: status,
    });
  }),
);

/**
 * GET /health/activity
 * Recent activity events (admin only)
 */
router.get(
  '/activity',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const events = realtimeService.getRecentEvents(limit);
    
    res.json({
      success: true,
      data: events,
    });
  }),
);

export default router;
