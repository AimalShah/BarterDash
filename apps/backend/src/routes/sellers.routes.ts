import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { registerSellerSchema } from '../schemas/sellers.schemas';
import { SellersService } from '../services/sellers.service';

const router = Router();
const sellersService = new SellersService();

/**
 * POST /sellers/register
 * Register current user as a seller
 * Protected - requires JWT
 */
router.post(
  '/register',
  authenticate,
  validate(registerSellerSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    console.log('USER ID :', userId);
    console.log('SELLER REQUEST BODY : ', req.body);
    const result = await sellersService.register(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Seller profile created and role updated',
    });
  }),
);

/**
 * GET /sellers/dashboard
 * Get seller dashboard stats
 * Protected - requires SELLER or ADMIN role
 */
router.get(
  '/dashboard',
  authenticate,
  requireRoles('SELLER', 'ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await sellersService.getDashboard(userId);

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
 * GET /sellers/active-dashboard
 * Get real-time dashboard data for current live stream
 * Protected - requires SELLER or ADMIN role
 */
router.get(
  '/active-dashboard',
  authenticate,
  requireRoles('SELLER', 'ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await sellersService.getActiveStreamDashboard(userId);

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
