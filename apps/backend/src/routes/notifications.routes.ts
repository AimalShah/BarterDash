import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { NotificationsService } from '../services/notifications.service';

const router = Router();
const notificationsService = new NotificationsService();

/**
 * GET /notifications
 * Get all notifications for the current user
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limitStr = req.query.limit;
    const offsetStr = req.query.offset;
    const limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 50;
    const offset = typeof offsetStr === 'string' ? parseInt(offsetStr, 10) : 0;

    const result = await notificationsService.getNotifications(
      req.user!.id,
      limit,
      offset,
    );
    if (result.isErr()) throw result.error;

    res.json({ success: true, data: result.value });
  }),
);

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await notificationsService.getUnreadCount(req.user!.id);
    if (result.isErr()) throw result.error;

    res.json({ success: true, data: { count: result.value } });
  }),
);

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read
 */
router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await notificationsService.markAsRead(
      req.params.id as string,
    );
    if (result.isErr()) throw result.error;

    res.json({ success: true, message: 'Notification marked as read' });
  }),
);

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read
 */
router.patch(
  '/read-all',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await notificationsService.markAllAsRead(req.user!.id);
    if (result.isErr()) throw result.error;

    res.json({ success: true, message: 'All notifications marked as read' });
  }),
);

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await notificationsService.deleteNotification(
      req.params.id as string,
    );
    if (result.isErr()) throw result.error;

    res.json({ success: true, message: 'Notification deleted' });
  }),
);

/**
 * POST /notifications/push-token
 * Register a push token for the current user
 */
router.post(
  '/push-token',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, platform } = req.body;

    if (!token || !platform) {
      res.status(400).json({
        success: false,
        error: { message: 'Token and platform are required' },
      });
      return;
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      res.status(400).json({
        success: false,
        error: { message: 'Platform must be ios, android, or web' },
      });
      return;
    }

    const result = await notificationsService.registerPushToken(
      req.user!.id,
      token,
      platform,
    );
    if (result.isErr()) throw result.error;

    res.json({
      success: true,
      data: result.value,
      message: 'Push token registered',
    });
  }),
);

/**
 * DELETE /notifications/push-token
 * Unregister a push token
 */
router.delete(
  '/push-token',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: { message: 'Token is required' },
      });
      return;
    }

    const result = await notificationsService.unregisterPushToken(
      req.user!.id,
      token,
    );
    if (result.isErr()) throw result.error;

    res.json({ success: true, message: 'Push token unregistered' });
  }),
);

export default router;
