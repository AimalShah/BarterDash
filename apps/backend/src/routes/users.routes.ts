import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import { updateProfileSchema, idParamSchema } from '../schemas/users.schemas';
import { UsersService } from '../services/users.service';

const router = Router();
const usersService = new UsersService();

/**
 * GET /users/me
 * Get current user profile
 * Protected - requires JWT
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await usersService.getProfile(userId);

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
 * GET /users/:id
 * Get public profile by ID
 * Public route
 */
router.get(
  '/:id',
  validateParams(idParamSchema.shape.params),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.getProfile(req.params.id as string);

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
 * PUT /users/profile
 * Update current user profile
 * Protected - requires JWT
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await usersService.updateProfile(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Profile updated successfully',
    });
  }),
);

export default router;
