import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /analytics/seller
 * Get seller analytics (requires seller permissions)
 */
router.get('/seller', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const period = (req.query.period as '7d' | '30d' | '90d') || '30d';

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Not authenticated' });
    }

    // Check if user is a seller
    const isSeller = req.user?.role === 'SELLER';
    if (!isSeller) {
      return res
        .status(403)
        .json({ success: false, error: 'Seller access required' });
    }

    const analytics = await analyticsService.getSellerAnalytics(userId, period);
    return res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/account-health
 * Get seller account health metrics
 */
router.get('/account-health', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Not authenticated' });
    }

    const health = await analyticsService.getAccountHealth(userId);
    return res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /analytics/products/:productId
 * Get product performance metrics
 */
router.get('/products/:productId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const productId = req.params.productId as string;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Not authenticated' });
    }

    const metrics = await analyticsService.getProductPerformance(
      productId,
      userId,
    );
    return res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

export default router;
