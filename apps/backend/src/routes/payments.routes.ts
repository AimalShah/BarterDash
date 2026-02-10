import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  createPaymentIntentSchema,
  createCheckoutSessionSchema,
  savePaymentMethodSchema,
  setDefaultPaymentMethodSchema,
  deletePaymentMethodSchema,
  createPaymentIntentWithMethodSchema,
  createPaymentSheetSchema,
  createSetupIntentSchema,
  confirmPaymentIntentSchema,
} from '../schemas/payments.schemas';
import { PaymentsService } from '../services/payments.service';

const router = Router();
const paymentsService = new PaymentsService();

/**
 * POST /payments/create-intent
 * Create a Stripe Payment Intent
 * Protected - requires JWT
 */
router.post(
  '/create-intent',
  authenticate,
  validate(createPaymentIntentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.createPaymentIntent(userId, req.body);

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
 * POST /payments/create-checkout-session
 * Create a Stripe Checkout Session for an order
 * Protected - requires JWT
 */
router.post(
  '/create-checkout-session',
  authenticate,
  validate(createCheckoutSessionSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.body;
    const result = await paymentsService.createCheckoutSession(userId, orderId);

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
 * POST /payments/webhooks/stripe
 * Stripe Webhook Handler
 * Public - Signature Verified
 */
router.post(
  '/webhooks/stripe',
  asyncHandler(async (req: any, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      res
        .status(400)
        .json({ success: false, message: 'Missing stripe-signature' });
      return;
    }

    if (!req.rawBody) {
      res.status(400).json({ success: false, message: 'Raw body missing' });
      return;
    }

    const eventResult = await paymentsService.constructEvent(
      signature as string,
      req.rawBody,
    );

    if (eventResult.isErr()) {
      throw eventResult.error;
    }

    await paymentsService.handleWebhook(eventResult.value);

    res.status(200).json({ received: true });
  }),
);

// ============================================
// PAYMENT METHOD MANAGEMENT ROUTES
// ============================================

/**
 * POST /payments/methods
 * Save a payment method for future use
 * Protected - requires JWT
 */
router.post(
  '/methods',
  authenticate,
  validate(savePaymentMethodSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.savePaymentMethod(userId, req.body);

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
 * GET /payments/methods
 * Get all saved payment methods for user
 * Protected - requires JWT
 */
router.get(
  '/methods',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.getPaymentMethods(userId);

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
 * PUT /payments/methods/:paymentMethodId/default
 * Set a payment method as default
 * Protected - requires JWT
 */
router.put(
  '/methods/:paymentMethodId/default',
  authenticate,
  validate(setDefaultPaymentMethodSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { paymentMethodId } = req.params;
    const result = await paymentsService.setDefaultPaymentMethod(userId, paymentMethodId as string);

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
 * DELETE /payments/methods/:paymentMethodId
 * Delete a saved payment method
 * Protected - requires JWT
 */
router.delete(
  '/methods/:paymentMethodId',
  authenticate,
  validate(deletePaymentMethodSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { paymentMethodId } = req.params;
    const result = await paymentsService.deletePaymentMethod(userId, paymentMethodId as string);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  }),
);

/**
 * POST /payments/create-intent-with-method
 * Create payment intent with saved payment method
 * Protected - requires JWT
 */
router.post(
  '/create-intent-with-method',
  authenticate,
  validate(createPaymentIntentWithMethodSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.createPaymentIntentWithMethod(userId, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }),
);

// ============================================
// PAYMENT SHEET ROUTES
// ============================================

/**
 * POST /payments/payment-sheet
 * Create Payment Sheet setup for mobile
 * Protected - requires JWT
 */
router.post(
  '/payment-sheet',
  authenticate,
  validate(createPaymentSheetSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.createPaymentSheet(userId, req.body);

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
 * POST /payments/setup-intent
 * Create Setup Intent for saving payment methods
 * Protected - requires JWT
 */
router.post(
  '/setup-intent',
  authenticate,
  validate(createSetupIntentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.createSetupIntent(userId, req.body);

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
 * POST /payments/confirm-intent
 * Confirm payment intent (manual confirmation)
 * Protected - requires JWT
 */
router.post(
  '/confirm-intent',
  authenticate,
  validate(confirmPaymentIntentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await paymentsService.confirmPaymentIntent(userId, req.body);

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
