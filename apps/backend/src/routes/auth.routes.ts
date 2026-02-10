import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  syncProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schemas';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService();

/**
 * POST /auth/sync
 * Sync user profile after Supabase Auth
 * Protected route - requires JWT
 */
router.post(
  '/sync',
  authenticate,
  validate(syncProfileSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.syncProfile(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }),
);

/**
 * POST /auth/logout
 * Logout user (placeholder)
 * Protected route - requires JWT
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.logout();

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
 * GET /auth/me
 * Get current user profile
 * Protected route - requires JWT
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.getProfile(userId);

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
 * POST /auth/forgot-password
 * Send password reset email
 * Public route
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

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
 * POST /auth/reset-password
 * Reset password using token from email link
 * Requires access_token in Authorization header (from Supabase reset link)
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Missing or invalid authorization token' },
      });
      return;
    }

    const accessToken = authHeader.substring(7);
    const { password } = req.body;
    const result = await authService.resetPassword(password, accessToken);

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
