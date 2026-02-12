import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  updateProfileSchema,
  idParamSchema,
  ageVerificationSchema,
} from '../schemas/users.schemas';
import { UsersService } from '../services/users.service';

const exportDataLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'You can only request one data export per 24 hours',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

/**
 * PUT /users/age-verification
 * Verify user age (18+ required)
 * Protected - requires JWT
 */
router.put(
  '/age-verification',
  authenticate,
  validate(ageVerificationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { dateOfBirth, guardianConsent } = req.body;

    const existingProfile = await usersService.getProfile(userId);
    if (existingProfile.isOk() && existingProfile.value?.ageVerified) {
      return res.status(200).json({
        success: true,
        data: existingProfile.value,
        message: 'Age already verified',
      });
    }

    const result = await usersService.verifyAge(userId, dateOfBirth);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Age verified successfully',
    });
  }),
);

/**
 * POST /users/me/export
 * Request a data export
 * Protected - requires JWT
 * Rate limited: 1 per 24 hours
 */
router.post(
  '/me/export',
  authenticate,
  exportDataLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await usersService.exportUserData(userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Your data export is ready for download',
    });
  }),
);

export default router;
