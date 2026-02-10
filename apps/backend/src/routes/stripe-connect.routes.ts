import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { StripeConnectService } from '../services/stripe-connect.service';

const router = Router();
const stripeConnectService = new StripeConnectService();

/**
 * POST /sellers/stripe/connect
 * Create a Stripe Connect account for the seller
 * Protected - requires JWT (seller)
 */
router.post(
  '/connect',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const email = req.user!.email;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required to create a Stripe Connect account',
      });
      return;
    }

    const result = await stripeConnectService.createConnectAccount(
      userId,
      email,
    );

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      message: 'Stripe Connect account created',
      data: result.value,
    });
  }),
);

/**
 * GET /sellers/stripe/onboarding-link
 * Get a new onboarding link for the seller's Connect account
 * Protected - requires JWT (seller)
 */
router.get(
  '/onboarding-link',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await stripeConnectService.getOnboardingLink(userId);

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
 * GET /sellers/stripe/account-status
 * Get the status of the seller's Connect account
 * Protected - requires JWT (seller)
 */
router.get(
  '/account-status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await stripeConnectService.getAccountStatus(userId);

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
 * GET /sellers/stripe/dashboard-link
 * Get a link to the seller's Express Dashboard
 * Protected - requires JWT (seller with connected account)
 */
router.get(
  '/dashboard-link',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await stripeConnectService.getDashboardLink(userId);

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
