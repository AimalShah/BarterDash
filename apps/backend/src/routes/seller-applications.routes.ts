import { Router, Response } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  createApplicationSchema,
  uploadDocumentSchema,
  submitApplicationSchema,
} from '../schemas/seller-applications.schemas';
import { SellerApplicationsService } from '../services/seller-applications.service';
import { stripe } from '../utils/stripe';
import { config } from '../config';

const router = Router();
const applicationsService = new SellerApplicationsService();

/**
 * POST /sellers/apply
 * Start a new seller application
 */
router.post(
  '/apply',
  authenticate,
  validate(createApplicationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await applicationsService.startApplication(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Seller application started',
    });
  }),
);

/**
 * GET /sellers/apply/status
 * Get current application status
 */
router.get(
  '/apply/status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result =
      await applicationsService.getApplicationWithDocuments(userId);

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
 * POST /sellers/apply/documents
 * Upload a verification document
 */
router.post(
  '/apply/documents',
  authenticate,
  validate(uploadDocumentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await applicationsService.uploadDocument(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
      message: 'Document uploaded successfully',
    });
  }),
);

/**
 * POST /sellers/apply/submit
 * Submit application for review
 */
router.post(
  '/apply/submit',
  authenticate,
  validate(submitApplicationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await applicationsService.submitApplication(userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Application submitted successfully',
    });
  }),
);

/**
 * POST /sellers/verify/session
 * Create Stripe Identity verification session
 */
router.post(
  '/verify/session',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await applicationsService.createVerificationSession(userId);

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
 * POST /sellers/webhooks/stripe-identity
 * Handle Stripe Identity webhooks
 */
router.post(
  '/webhooks/stripe-identity',
  asyncHandler(async (req: any, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret =
      config.stripeIdentityWebhookSecret || config.stripeWebhookSecret;

    if (!webhookSecret) {
      console.warn('Missing STRIPE_IDENTITY_WEBHOOK_SECRET/STRIPE_WEBHOOK_SECRET');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    let event: Stripe.Event;

    try {
      if (req.rawBody) {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          sig as string,
          webhookSecret,
        );
      } else {
        // Fallback for dev/if rawBody not available
        event = req.body;
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const result = await applicationsService.handleStripeWebhook(event);

    if (result.isErr()) {
      res.status(400).send(result.error.message);
      return;
    }

    res.json({ received: true });
  }),
);

/**
 * ADMIN ROUTES
 */

/**
 * GET /sellers/applications/:id/identity
 * Admin: Get identity verification status for an application
 */
router.get(
  '/applications/:id/identity',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const applicationId = req.params.id as string;
    const result =
      await applicationsService.adminGetIdentityStatus(applicationId);

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
 * POST /sellers/applications/:id/approve
 * Admin approve application
 */
router.post(
  '/applications/:id/approve',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.id;
    const applicationId = req.params.id as string;
    const { adminNotes } = req.body;

    const result = await applicationsService.adminApprove(
      applicationId,
      adminId,
      adminNotes,
    );

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Application approved',
    });
  }),
);

/**
 * POST /sellers/applications/:id/reject
 * Admin reject application
 */
router.post(
  '/applications/:id/reject',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.id;
    const applicationId = req.params.id as string;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      res
        .status(400)
        .json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const result = await applicationsService.adminReject(
      applicationId,
      adminId,
      rejectionReason,
      adminNotes,
    );

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected',
    });
  }),
);

/**
 * POST /sellers/applications/:id/mock-approve
 * Mock approval for testing (Admin only)
 */
router.post(
  '/applications/:id/mock-approve',
  authenticate,
  requireRoles('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.id;
    const applicationId = req.params.id as string;

    const result = await applicationsService.mockApproveApplication(
      applicationId,
      adminId,
    );

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Application mock approved',
      data: result.value,
    });
  }),
);

export default router;
