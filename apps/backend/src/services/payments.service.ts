import Stripe from 'stripe';
import { stripe, stripeWebhookSecret } from '../utils/stripe';
import { PaymentsRepository } from '../repositories/payments.repository';
import { PaymentMethodsRepository } from '../repositories/payment-methods.repository';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
  PaymentError,
  CardDeclinedError,
  InsufficientFundsError,
  ExpiredCardError,
  InvalidCardError,
  AuthenticationRequiredError,
  PaymentProcessingError,
  StripeConnectionError,
  WebhookVerificationError,
} from '../utils/result';
import { paymentLogger } from '../utils/payment-logger';
import { 
  CreatePaymentIntentInput,
  SavePaymentMethodInput,
  CreatePaymentIntentWithMethodInput,
  CreatePaymentSheetInput,
  CreateSetupIntentInput,
  ConfirmPaymentIntentInput,
} from '../schemas/payments.schemas';
import { db, orders, payments, PaymentMethod, profiles } from '../db';
import { eq } from 'drizzle-orm';
import { supabase } from '../utils/supabase';

/**
 * Payments Service
 * Business logic for Stripe payments and webhooks
 */
export class PaymentsService {
  private repository: PaymentsRepository;
  private paymentMethodsRepository: PaymentMethodsRepository;

  constructor() {
    this.repository = new PaymentsRepository();
    this.paymentMethodsRepository = new PaymentMethodsRepository();
  }

  /**
   * Maps Stripe errors to application-specific error types
   */
  private mapStripeError(error: any, operation: string, context?: any): PaymentError {
    paymentLogger.logStripeError(operation, error, context);

    if (error.type === 'StripeCardError') {
      switch (error.code) {
        case 'card_declined':
          return new CardDeclinedError(error.decline_code, error.message);
        case 'insufficient_funds':
          return new InsufficientFundsError();
        case 'expired_card':
          return new ExpiredCardError();
        case 'incorrect_number':
        case 'invalid_number':
        case 'incorrect_cvc':
        case 'invalid_cvc':
        case 'incorrect_zip':
          return new InvalidCardError(error.message);
        case 'authentication_required':
          return new AuthenticationRequiredError();
        default:
          return new PaymentProcessingError(error.message);
      }
    }

    if (error.type === 'StripeConnectionError' || error.type === 'StripeAPIError') {
      return new StripeConnectionError();
    }

    if (error.type === 'StripeSignatureVerificationError') {
      return new WebhookVerificationError(error.message);
    }

    // Default to generic payment error
    return new PaymentProcessingError(
      error.message || 'An unexpected payment error occurred'
    );
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(
    userId: string,
    orderId: string,
  ): Promise<AppResult<{ url: string | null; sessionId: string }>> {
    const context = { userId, orderId, operation: 'create_checkout_session' };
    
    try {
      paymentLogger.info({ ...context, operation: 'checkout_session_creation_started' });

      // 1. Fetch order details to get total and items
      const orderResult = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          product: true,
        },
      });

      if (!orderResult) {
        paymentLogger.error({
          ...context,
          operation: 'checkout_session_creation_failed',
          error: {
            type: 'NotFoundError',
            message: 'Order not found',
            code: 'NOT_FOUND',
          },
        });
        return failure(new NotFoundError('Order', orderId));
      }

      if (orderResult.buyerId !== userId) {
        paymentLogger.error({
          ...context,
          operation: 'checkout_session_creation_failed',
          error: {
            type: 'ValidationError',
            message: 'Unauthorized order access',
            code: 'UNAUTHORIZED',
          },
        });
        return failure(
          new ValidationError('Only the buyer can pay for this order'),
        );
      }

      if (orderResult.status === 'paid') {
        paymentLogger.warn({
          ...context,
          operation: 'checkout_session_creation_skipped',
          metadata: { reason: 'order_already_paid' },
        });
        return failure(new ValidationError('This order is already paid'));
      }

      const amount = Math.round(parseFloat(orderResult.total) * 100);

      // 2. Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name:
                  orderResult.product?.title ||
                  `Order #${orderResult.orderNumber}`,
                description: `Order payment for ${orderResult.orderNumber}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'barterdash://checkout/success'}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'barterdash://checkout/cancel'}`,
        client_reference_id: orderId,
        metadata: {
          orderId: orderId,
          userId: userId,
        },
      });

      paymentLogger.info({
        ...context,
        operation: 'checkout_session_created',
        amount: amount / 100,
        currency: 'usd',
        metadata: {
          sessionId: session.id,
          orderNumber: orderResult.orderNumber,
        },
      });

      return success({
        url: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_checkout_session', context);
      return failure(mappedError);
    }
  }

  /**
   * Create a Stripe Payment Intent
   */
  async createPaymentIntent(
    userId: string,
    data: CreatePaymentIntentInput,
  ): Promise<AppResult<{ clientSecret: string | null; id: string }>> {
    const context = {
      userId,
      amount: data.amount,
      currency: 'usd',
      operation: 'create_payment_intent',
      metadata: { auctionId: data.auction_id, orderId: data.order_id },
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_intent_creation_started' });

      const amount = Math.round(data.amount * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          auctionId: data.auction_id,
          ...(data.order_id ? { orderId: data.order_id } : {}),
          userId: userId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      paymentLogger.logPaymentIntentCreated({
        ...context,
        paymentIntentId: paymentIntent.id,
        amount: data.amount,
        metadata: {
          auctionId: data.auction_id,
          stripeAmount: amount,
        },
      });

      return success({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_payment_intent', context);
      return failure(mappedError);
    }
  }

  /**
   * Capture a payment intent (for auction auto-payment)
   */
  async capturePayment(
    paymentIntentId: string,
  ): Promise<AppResult<{ success: boolean }>> {
    const context = { paymentIntentId, operation: 'capture_payment' };

    try {
      paymentLogger.info({ ...context, operation: 'payment_capture_started' });

      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        paymentLogger.info({
          ...context,
          operation: 'payment_captured',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: {
            status: paymentIntent.status,
            capturedAt: new Date().toISOString(),
          },
        });
        return success({ success: true });
      } else {
        paymentLogger.error({
          ...context,
          operation: 'payment_capture_failed',
          error: {
            type: 'PaymentProcessingError',
            message: `Payment capture failed: ${paymentIntent.status}`,
            code: 'CAPTURE_FAILED',
          },
          metadata: { status: paymentIntent.status },
        });
        return failure(
          new PaymentProcessingError(
            `Payment capture failed: ${paymentIntent.status}`,
          ),
        );
      }
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'capture_payment', context);
      return failure(mappedError);
    }
  }

  /**
   * Construct Stripe event from webhook payload
   */
  async constructEvent(
    signature: string,
    payload: Buffer,
  ): Promise<AppResult<Stripe.Event>> {
    const context = { operation: 'construct_webhook_event' };

    try {
      if (!stripeWebhookSecret) {
        paymentLogger.error({
          ...context,
          operation: 'webhook_construction_failed',
          error: {
            type: 'ValidationError',
            message: 'Stripe webhook secret not configured',
            code: 'WEBHOOK_SECRET_MISSING',
          },
        });
        return failure(
          new ValidationError('Stripe webhook secret not configured'),
        );
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeWebhookSecret,
      );

      paymentLogger.logWebhookReceived({
        ...context,
        metadata: {
          eventType: event.type,
          eventId: event.id,
          created: new Date(event.created * 1000).toISOString(),
        },
      });

      return success(event);
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'construct_webhook_event', context);
      return failure(mappedError);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<AppResult<void>> {
    const context = {
      operation: 'handle_webhook',
      metadata: {
        eventType: event.type,
        eventId: event.id,
      },
    };

    try {
      paymentLogger.info({
        ...context,
        operation: 'webhook_processing_started',
        metadata: {
          ...context.metadata,
          created: new Date(event.created * 1000).toISOString(),
        },
      });

      // Import escrow and connect services lazily to avoid circular deps
      const { EscrowService } = await import('./escrow.service');
      const { StripeConnectService } = await import('./stripe-connect.service');
      const escrowService = new EscrowService();
      const stripeConnectService = new StripeConnectService();

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'payment_intent_succeeded',
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          });
          
          // Broadcast real-time payment status update
          await this.broadcastPaymentStatusUpdate(paymentIntent.id, {
            status: 'succeeded',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            userId: paymentIntent.metadata?.userId,
            orderId: paymentIntent.metadata?.orderId,
          });
          
          // Check if this is an escrow payment
          if (paymentIntent.metadata?.type === 'escrow') {
            await escrowService.captureToEscrow(paymentIntent.id);
          } else {
            await this.handlePaymentSuccess(paymentIntent);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object;
          paymentLogger.error({
            ...context,
            operation: 'payment_intent_failed',
            paymentIntentId: failedIntent.id,
            error: {
              type: 'PaymentFailedError',
              message: failedIntent.last_payment_error?.message || 'Payment failed',
              code: failedIntent.last_payment_error?.code || 'PAYMENT_FAILED',
            },
          });

          await this.handlePaymentFailure(failedIntent);

          // Broadcast real-time payment failure update
          await this.broadcastPaymentStatusUpdate(failedIntent.id, {
            status: 'failed',
            error: failedIntent.last_payment_error?.message || 'Payment failed',
            userId: failedIntent.metadata?.userId,
            orderId: failedIntent.metadata?.orderId,
          });
          break;

        case 'payment_intent.requires_action':
          const actionRequiredIntent = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'payment_intent_requires_action',
            paymentIntentId: actionRequiredIntent.id,
            metadata: {
              nextAction: actionRequiredIntent.next_action?.type,
              clientSecret: actionRequiredIntent.client_secret,
            },
          });

          // Broadcast real-time action required update
          await this.broadcastPaymentStatusUpdate(actionRequiredIntent.id, {
            status: 'requires_action',
            nextAction: actionRequiredIntent.next_action?.type,
            clientSecret: actionRequiredIntent.client_secret || undefined,
            userId: actionRequiredIntent.metadata?.userId,
            orderId: actionRequiredIntent.metadata?.orderId,
          });
          break;

        case 'payment_intent.processing':
          const processingIntent = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'payment_intent_processing',
            paymentIntentId: processingIntent.id,
          });

          // Broadcast real-time processing update
          await this.broadcastPaymentStatusUpdate(processingIntent.id, {
            status: 'processing',
            userId: processingIntent.metadata?.userId,
            orderId: processingIntent.metadata?.orderId,
          });
          break;

        case 'checkout.session.completed':
          const session = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'checkout_session_completed',
            metadata: {
              sessionId: session.id,
              orderId: session.metadata?.orderId,
              userId: session.metadata?.userId,
            },
          });
          await this.handleCheckoutSuccess(session);
          break;

        case 'account.updated':
          const account = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'account_updated',
            metadata: {
              accountId: account.id,
              chargesEnabled: account.charges_enabled,
              payoutsEnabled: account.payouts_enabled,
            },
          });
          
          // Broadcast real-time Connect account status update
          await this.broadcastConnectAccountUpdate(account);
          await stripeConnectService.handleAccountUpdated(account);
          break;

        case 'account.application.deauthorized':
          const deauthorizedApplication = event.data.object;
          paymentLogger.warn({
            ...context,
            operation: 'account_deauthorized',
            metadata: {
              applicationId: deauthorizedApplication.id,
            },
          });

          // Note: We can't broadcast this directly as we don't have account info
          // This would need to be handled differently based on your application structure
          break;

        case 'capability.updated':
          const capability = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'capability_updated',
            metadata: {
              accountId: capability.account,
              capabilityId: capability.id,
              status: capability.status,
            },
          });

          // Broadcast real-time capability update
          await this.broadcastCapabilityUpdate(capability);
          break;

        case 'charge.dispute.created':
          const dispute = event.data.object;
          paymentLogger.warn({
            ...context,
            operation: 'dispute_created',
            metadata: {
              disputeId: dispute.id,
              chargeId: dispute.charge,
              amount: dispute.amount / 100,
              reason: dispute.reason,
            },
          });
          
          // Broadcast real-time dispute notification
          await this.broadcastDisputeUpdate(dispute, 'created');
          await escrowService.handleDisputeCreated(dispute);
          break;

        case 'charge.dispute.updated':
          const updatedDispute = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'dispute_updated',
            metadata: {
              disputeId: updatedDispute.id,
              status: updatedDispute.status,
            },
          });

          // Broadcast real-time dispute update
          await this.broadcastDisputeUpdate(updatedDispute, 'updated');
          break;

        case 'transfer.created':
          const transfer = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'transfer_created',
            metadata: {
              transferId: transfer.id,
              amount: transfer.amount / 100,
              currency: transfer.currency,
              destination: transfer.destination,
            },
          });

          // Broadcast real-time transfer notification
          await this.broadcastTransferUpdate(transfer, 'created');
          break;

        case 'transfer.updated':
          const updatedTransfer = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'transfer_updated',
            metadata: {
              transferId: updatedTransfer.id,
              amount: updatedTransfer.amount / 100,
              currency: updatedTransfer.currency,
            },
          });

          // Broadcast real-time transfer update notification
          await this.broadcastTransferUpdate(updatedTransfer, 'updated');
          break;

        case 'payment_method.attached':
          const attachedPaymentMethod = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'payment_method_attached',
            metadata: {
              paymentMethodId: attachedPaymentMethod.id,
              customerId: attachedPaymentMethod.customer,
              type: attachedPaymentMethod.type,
            },
          });

          // Broadcast real-time payment method update
          await this.broadcastPaymentMethodUpdate(attachedPaymentMethod, 'attached');
          break;

        case 'payment_method.detached':
          const detachedPaymentMethod = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'payment_method_detached',
            metadata: {
              paymentMethodId: detachedPaymentMethod.id,
              type: detachedPaymentMethod.type,
            },
          });

          // Broadcast real-time payment method update
          await this.broadcastPaymentMethodUpdate(detachedPaymentMethod, 'detached');
          break;

        case 'setup_intent.succeeded':
          const setupIntent = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'setup_intent_succeeded',
            metadata: {
              setupIntentId: setupIntent.id,
              paymentMethodId: setupIntent.payment_method,
              customerId: setupIntent.customer,
            },
          });

          // Broadcast real-time setup completion
          await this.broadcastSetupIntentUpdate(setupIntent, 'succeeded');
          await this.handleSetupIntentSuccess(setupIntent);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          paymentLogger.info({
            ...context,
            operation: 'invoice_payment_succeeded',
            metadata: {
              invoiceId: invoice.id,
              customerId: invoice.customer,
              amount: invoice.amount_paid / 100,
            },
          });

          // Broadcast real-time invoice payment update
          await this.broadcastInvoiceUpdate(invoice, 'payment_succeeded');
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          paymentLogger.error({
            ...context,
            operation: 'invoice_payment_failed',
            error: {
              type: 'InvoicePaymentFailedError',
              message: 'Invoice payment failed',
              code: 'INVOICE_PAYMENT_FAILED',
            },
            metadata: {
              invoiceId: failedInvoice.id,
              customerId: failedInvoice.customer,
              attemptCount: failedInvoice.attempt_count,
            },
          });

          // Broadcast real-time invoice failure update
          await this.broadcastInvoiceUpdate(failedInvoice, 'payment_failed');
          break;

        default:
          paymentLogger.debug({
            ...context,
            operation: 'unhandled_webhook_event',
            metadata: {
              eventType: event.type,
              message: `Unhandled event type ${event.type}`,
            },
          });
      }

      paymentLogger.info({
        ...context,
        operation: 'webhook_processed_successfully',
      });

      return success(undefined);
    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'webhook_processing_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'WEBHOOK_PROCESSING_ERROR',
        },
      });
      
      // Don't fail webhook processing for non-critical errors
      // Stripe will retry failed webhooks
      return success(undefined);
    }
  }

  /**
   * Logic for successful checkout session
   */
  private async handleCheckoutSuccess(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (!orderId || !userId) return;

    const context = { userId, orderId, operation: 'handle_checkout_success' };

    try {
      paymentLogger.info({
        ...context,
        operation: 'checkout_success_processing_started',
        metadata: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent as string,
          amount: (session.amount_total! / 100),
        },
      });

      // 1. Log the payment record
      await this.repository.create({
        stripePaymentId: session.payment_intent as string,
        amount: (session.amount_total! / 100).toString(),
        currency: session.currency!,
        status: 'succeeded',
        userId: userId,
        metadata: session,
      });

      // 2. Update the Order status to 'paid'
      await db
        .update(orders)
        .set({
          status: 'paid',
          updatedAt: new Date(),
          stripePaymentIntentId: session.payment_intent as string,
        })
        .where(eq(orders.id, orderId));

      paymentLogger.info({
        ...context,
        operation: 'checkout_success_processed',
        metadata: {
          orderStatus: 'paid',
          paymentRecorded: true,
        },
      });
    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'checkout_success_processing_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'CHECKOUT_SUCCESS_PROCESSING_ERROR',
        },
      });
    }
  }

  /**
   * Handle successful payment intent (non-checkout flow)
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const context = {
      paymentIntentId: paymentIntent.id,
      operation: 'handle_payment_success',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    };

    try {
      paymentLogger.info({
        ...context,
        operation: 'payment_success_processing_started',
        metadata: {
          auctionId: paymentIntent.metadata?.auctionId,
          userId: paymentIntent.metadata?.userId,
        },
      });

      await this.upsertPaymentRecord(paymentIntent, 'succeeded');

      const orderId = paymentIntent.metadata?.orderId;
      const userId = paymentIntent.metadata?.userId;

      if (orderId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        });

        if (!order) {
          paymentLogger.warn({
            ...context,
            operation: 'payment_success_order_not_found',
            metadata: { orderId },
          });
        } else if (order.status !== 'paid') {
          await db
            .update(orders)
            .set({
              status: 'paid',
              updatedAt: new Date(),
              stripePaymentIntentId: paymentIntent.id,
            })
            .where(eq(orders.id, orderId));

          paymentLogger.info({
            ...context,
            operation: 'payment_success_order_updated',
            metadata: { orderId, userId, orderStatus: 'paid' },
          });
        }
      }

      paymentLogger.info({
        ...context,
        operation: 'payment_success_processed',
      });
    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'payment_success_processing_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PAYMENT_SUCCESS_PROCESSING_ERROR',
        },
      });
    }
  }

  /**
   * Handle payment intent failure
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    try {
      await this.upsertPaymentRecord(paymentIntent, 'failed');
    } catch (error) {
      paymentLogger.error({
        operation: 'payment_failure_record_failed',
        paymentIntentId: paymentIntent.id,
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PAYMENT_FAILURE_RECORD_ERROR',
        },
      });
    }
  }

  /**
   * Create or update payment record for a payment intent
   */
  private async upsertPaymentRecord(
    paymentIntent: Stripe.PaymentIntent,
    status: 'succeeded' | 'failed',
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;
    const userId = paymentIntent.metadata?.userId;

    if (!orderId && !userId) {
      return;
    }

    const existing = await this.repository.findByStripeId(paymentIntent.id);

    if (existing.isOk() && existing.value) {
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };

      if (paymentIntent.payment_method_types?.[0]) {
        updateData.paymentMethod = paymentIntent.payment_method_types[0];
      }

      if (paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0) {
        updateData.metadata = paymentIntent.metadata;
      }

      await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.stripePaymentId, paymentIntent.id));

      return;
    }

    if (existing.isErr() && !(existing.error instanceof NotFoundError)) {
      throw existing.error;
    }

    await this.repository.create({
      orderId: orderId || undefined,
      userId: userId || undefined,
      stripePaymentId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toString(),
      currency: paymentIntent.currency,
      status,
      paymentMethod: paymentIntent.payment_method_types?.[0],
      metadata: paymentIntent.metadata,
    });
  }

  /**
   * Persist payment method created via setup intent
   */
  private async handleSetupIntentSuccess(setupIntent: Stripe.SetupIntent) {
    const userId = setupIntent.metadata?.userId;
    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : null;

    if (!userId || !paymentMethodId) {
      paymentLogger.warn({
        operation: 'setup_intent_missing_metadata',
        metadata: {
          setupIntentId: setupIntent.id,
          userId,
          paymentMethodId,
        },
      });
      return;
    }

    const existing = await this.paymentMethodsRepository.findByStripeId(
      paymentMethodId,
    );

    if (existing.isOk()) {
      return;
    }

    if (existing.isErr() && !(existing.error instanceof NotFoundError)) {
      throw existing.error;
    }

    const setAsDefault = setupIntent.metadata?.setAsDefault === 'true';
    const saveResult = await this.savePaymentMethod(userId, {
      paymentMethodId,
      setAsDefault,
    });

    if (saveResult.isErr()) {
      throw saveResult.error;
    }
  }

  /**
   * Refund an order
   */
  async refundOrder(orderId: string): Promise<AppResult<Stripe.Refund>> {
    const context = { orderId, operation: 'refund_order' };

    try {
      paymentLogger.info({ ...context, operation: 'refund_processing_started' });

      // 1. Fetch order details
      const orderResult = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!orderResult) {
        paymentLogger.error({
          ...context,
          operation: 'refund_failed',
          error: {
            type: 'NotFoundError',
            message: 'Order not found',
            code: 'NOT_FOUND',
          },
        });
        return failure(new NotFoundError('Order', orderId));
      }

      if (!orderResult.stripePaymentIntentId) {
        paymentLogger.error({
          ...context,
          operation: 'refund_failed',
          error: {
            type: 'ValidationError',
            message: 'Order has no Stripe payment record',
            code: 'NO_PAYMENT_RECORD',
          },
        });
        return failure(
          new ValidationError('Order has no Stripe payment record'),
        );
      }

      // 2. Process refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: orderResult.stripePaymentIntentId,
      });

      // 3. Update order status
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
          cancellationReason: 'Refunded via report resolution',
        })
        .where(eq(orders.id, orderId));

      paymentLogger.info({
        ...context,
        operation: 'refund_processed',
        amount: refund.amount / 100,
        currency: refund.currency,
        metadata: {
          refundId: refund.id,
          paymentIntentId: orderResult.stripePaymentIntentId,
          orderStatus: 'cancelled',
        },
      });

      return success(refund);
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'refund_order', context);
      return failure(mappedError);
    }
  }

  // ============================================
  // PAYMENT METHOD MANAGEMENT
  // ============================================

  /**
   * Save a payment method for future use
   */
  async savePaymentMethod(
    userId: string,
    data: SavePaymentMethodInput
  ): Promise<AppResult<PaymentMethod>> {
    const context = {
      userId,
      paymentMethodId: data.paymentMethodId,
      operation: 'save_payment_method',
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_method_save_started' });

      // 1. Retrieve payment method from Stripe to get details
      const stripePaymentMethod = await stripe.paymentMethods.retrieve(
        data.paymentMethodId
      );

      if (!stripePaymentMethod) {
        return failure(new NotFoundError('Payment method', data.paymentMethodId));
      }

      // 2. Attach payment method to customer if not already attached
      if (!stripePaymentMethod.customer) {
        // First, ensure user has a Stripe customer ID
        const customer = await this.getOrCreateStripeCustomer(userId);
        if (customer.isErr()) {
          return failure(customer.error);
        }

        await stripe.paymentMethods.attach(data.paymentMethodId, {
          customer: customer.value.id,
        });
      }

      // 3. Extract payment method details
      const paymentMethodData = this.extractPaymentMethodData(
        stripePaymentMethod,
        userId,
        data.setAsDefault
      );

      // 4. Save to database
      const savedPaymentMethod = await this.paymentMethodsRepository.create(
        paymentMethodData
      );

      if (savedPaymentMethod.isErr()) {
        return failure(savedPaymentMethod.error);
      }

      paymentLogger.logPaymentMethodSaved({
        ...context,
        metadata: {
          type: stripePaymentMethod.type,
          last4: paymentMethodData.last4,
          brand: paymentMethodData.brand,
          isDefault: data.setAsDefault,
        },
      });

      return success(savedPaymentMethod.value);
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'save_payment_method', context);
      return failure(mappedError);
    }
  }

  /**
   * Get all saved payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<AppResult<PaymentMethod[]>> {
    const context = { userId, operation: 'get_payment_methods' };

    try {
      paymentLogger.info({ ...context, operation: 'payment_methods_fetch_started' });

      const paymentMethods = await this.paymentMethodsRepository.findByUserId(userId);

      if (paymentMethods.isErr()) {
        return failure(paymentMethods.error);
      }

      paymentLogger.info({
        ...context,
        operation: 'payment_methods_fetched',
        metadata: { count: paymentMethods.value.length },
      });

      return success(paymentMethods.value);
    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'payment_methods_fetch_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'FETCH_PAYMENT_METHODS_ERROR',
        },
      });
      return failure(new PaymentProcessingError('Failed to fetch payment methods'));
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<AppResult<PaymentMethod>> {
    const context = { userId, paymentMethodId, operation: 'set_default_payment_method' };

    try {
      paymentLogger.info({ ...context, operation: 'set_default_started' });

      const result = await this.paymentMethodsRepository.setAsDefault(
        paymentMethodId,
        userId
      );

      if (result.isErr()) {
        return failure(result.error);
      }

      paymentLogger.info({
        ...context,
        operation: 'default_payment_method_set',
        metadata: {
          type: result.value.type,
          last4: result.value.last4,
        },
      });

      return success(result.value);
    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'set_default_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SET_DEFAULT_PAYMENT_METHOD_ERROR',
        },
      });
      return failure(new PaymentProcessingError('Failed to set default payment method'));
    }
  }

  /**
   * Delete a saved payment method
   */
  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<AppResult<void>> {
    const context = { userId, paymentMethodId, operation: 'delete_payment_method' };

    try {
      paymentLogger.info({ ...context, operation: 'payment_method_delete_started' });

      // 1. Get payment method from database
      const paymentMethod = await this.paymentMethodsRepository.findByIdAndUserId(
        paymentMethodId,
        userId
      );

      if (paymentMethod.isErr()) {
        return failure(paymentMethod.error);
      }

      // 2. Detach from Stripe
      try {
        await stripe.paymentMethods.detach(paymentMethod.value.stripePaymentMethodId);
      } catch (stripeError: any) {
        // If payment method is already detached or doesn't exist in Stripe, continue
        if (stripeError.code !== 'resource_missing') {
          throw stripeError;
        }
      }

      // 3. Delete from database
      const deleteResult = await this.paymentMethodsRepository.delete(
        paymentMethodId,
        userId
      );

      if (deleteResult.isErr()) {
        return failure(deleteResult.error);
      }

      paymentLogger.logPaymentMethodDeleted({
        ...context,
        metadata: {
          type: paymentMethod.value.type,
          last4: paymentMethod.value.last4,
          wasDefault: paymentMethod.value.isDefault,
        },
      });

      return success(undefined);
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'delete_payment_method', context);
      return failure(mappedError);
    }
  }

  /**
   * Create payment intent with saved payment method
   */
  async createPaymentIntentWithMethod(
    userId: string,
    data: CreatePaymentIntentWithMethodInput
  ): Promise<AppResult<{ clientSecret: string | null; id: string }>> {
    const context = {
      userId,
      orderId: data.orderId,
      amount: data.amount,
      paymentMethodId: data.paymentMethodId,
      operation: 'create_payment_intent_with_method',
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_intent_with_method_started' });

      const amount = Math.round(data.amount * 100); // Convert to cents

      // Get or create Stripe customer
      const customer = await this.getOrCreateStripeCustomer(userId);
      if (customer.isErr()) {
        return failure(customer.error);
      }

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: data.currency,
        customer: customer.value.id,
        metadata: {
          orderId: data.orderId,
          userId: userId,
        },
      };

      // Add payment method if provided
      if (data.paymentMethodId) {
        paymentIntentData.payment_method = data.paymentMethodId;
        paymentIntentData.confirmation_method = 'manual';
        paymentIntentData.confirm = true;
      } else {
        paymentIntentData.automatic_payment_methods = { enabled: true };
      }

      // Add setup for future usage if requested
      if (data.setupFutureUsage) {
        paymentIntentData.setup_future_usage = data.setupFutureUsage;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      paymentLogger.logPaymentIntentCreated({
        ...context,
        paymentIntentId: paymentIntent.id,
        amount: data.amount,
        metadata: {
          orderId: data.orderId,
          stripeAmount: amount,
          hasPaymentMethod: !!data.paymentMethodId,
          setupFutureUsage: data.setupFutureUsage,
        },
      });

      return success({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_payment_intent_with_method', context);
      return failure(mappedError);
    }
  }

  // ============================================
  // PAYMENT SHEET SUPPORT
  // ============================================

  /**
   * Create setup intent for saving payment methods
   */
  async createSetupIntent(
    userId: string,
    data: CreateSetupIntentInput,
  ): Promise<
    AppResult<{
      setupIntent: string;
      ephemeralKey: string;
      customer: string;
      publishableKey: string;
    }>
  > {
    const setAsDefault = data?.setAsDefault ?? true;
    const context = {
      userId,
      operation: 'create_setup_intent',
    };

    try {
      paymentLogger.info({ ...context, operation: 'setup_intent_creation_started' });

      // 1. Get or create Stripe customer
      const customerResult = await this.getOrCreateStripeCustomer(userId);
      if (customerResult.isErr()) {
        return failure(customerResult.error);
      }
      const customer = customerResult.value;

      // 2. Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        usage: 'off_session',
        metadata: {
          userId,
          setAsDefault: setAsDefault ? 'true' : 'false',
        },
      });

      // 3. Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-10-16' },
      );

      paymentLogger.info({
        ...context,
        operation: 'setup_intent_created',
        metadata: {
          setupIntentId: setupIntent.id,
          customerId: customer.id,
          setAsDefault,
        },
      });

      return success({
        setupIntent: setupIntent.client_secret!,
        ephemeralKey: ephemeralKey.secret!,
        customer: customer.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_setup_intent', context);
      return failure(mappedError);
    }
  }

  /**
   * Create payment sheet setup for mobile Payment Sheet
   */
  async createPaymentSheet(
    userId: string,
    data: CreatePaymentSheetInput
  ): Promise<AppResult<{
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
    publishableKey: string;
  }>> {
    const context = {
      userId,
      orderId: data.orderId,
      amount: data.amount,
      operation: 'create_payment_sheet',
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_sheet_creation_started' });

      const amount = Math.round(data.amount * 100); // Convert to cents

      // 1. Get or create Stripe customer
      const customerResult = await this.getOrCreateStripeCustomer(userId);
      if (customerResult.isErr()) {
        return failure(customerResult.error);
      }
      const customer = customerResult.value;

      // 2. Create payment intent for Payment Sheet
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: data.currency,
        customer: customer.id,
        metadata: {
          orderId: data.orderId,
          userId: userId,
          type: 'payment_sheet',
        },
      };

      // Add automatic payment methods if requested
      if (data.automaticPaymentMethods) {
        paymentIntentData.automatic_payment_methods = { enabled: true };
      }

      // Add setup for future usage if requested
      if (data.setupFutureUsage) {
        paymentIntentData.setup_future_usage = data.setupFutureUsage;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // 3. Create ephemeral key for the customer
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-10-16' } // Use a specific API version for ephemeral keys
      );

      paymentLogger.info({
        ...context,
        operation: 'payment_sheet_created',
        paymentIntentId: paymentIntent.id,
        metadata: {
          customerId: customer.id,
          orderId: data.orderId,
          stripeAmount: amount,
          setupFutureUsage: data.setupFutureUsage,
        },
      });

      return success({
        paymentIntent: paymentIntent.client_secret!,
        ephemeralKey: ephemeralKey.secret!,
        customer: customer.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_payment_sheet', context);
      return failure(mappedError);
    }
  }

  /**
   * Confirm payment intent (for manual confirmation flow)
   */
  async confirmPaymentIntent(
    userId: string,
    data: ConfirmPaymentIntentInput
  ): Promise<AppResult<{
    status: string;
    clientSecret?: string;
    nextAction?: any;
  }>> {
    const context = {
      userId,
      paymentIntentId: data.paymentIntentId,
      operation: 'confirm_payment_intent',
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_confirmation_started' });

      const confirmData: Stripe.PaymentIntentConfirmParams = {};

      // Add payment method if provided
      if (data.paymentMethodId) {
        confirmData.payment_method = data.paymentMethodId;
      }

      // Add return URL if provided (for 3D Secure redirects)
      if (data.returnUrl) {
        confirmData.return_url = data.returnUrl;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        data.paymentIntentId,
        confirmData
      );

      paymentLogger.logPaymentIntentConfirmed({
        ...context,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: {
          status: paymentIntent.status,
          requiresAction: paymentIntent.status === 'requires_action',
        },
      });

      const result: any = {
        status: paymentIntent.status,
      };

      // Add client secret if payment requires action
      if (paymentIntent.status === 'requires_action') {
        result.clientSecret = paymentIntent.client_secret;
        result.nextAction = paymentIntent.next_action;
      }

      return success(result);
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'confirm_payment_intent', context);
      return failure(mappedError);
    }
  }

  /**
   * Create payment intent with escrow integration
   */
  async createPaymentIntentWithEscrow(
    userId: string,
    orderId: string,
    amount: number,
    sellerId: string,
    currency: string = 'usd'
  ): Promise<AppResult<{
    clientSecret: string | null;
    id: string;
    escrowId: string;
  }>> {
    const context = {
      userId,
      orderId,
      sellerId,
      amount,
      operation: 'create_payment_intent_with_escrow',
    };

    try {
      paymentLogger.info({ ...context, operation: 'payment_intent_escrow_creation_started' });

      const stripeAmount = Math.round(amount * 100); // Convert to cents

      // 1. Get or create Stripe customer
      const customerResult = await this.getOrCreateStripeCustomer(userId);
      if (customerResult.isErr()) {
        return failure(customerResult.error);
      }

      // 2. Create payment intent with escrow metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency,
        customer: customerResult.value.id,
        metadata: {
          orderId,
          userId,
          sellerId,
          type: 'escrow',
        },
        automatic_payment_methods: { enabled: true },
        capture_method: 'manual', // We'll capture when creating escrow
      });

      // 3. Create escrow record (this would integrate with existing escrow service)
      const { EscrowService } = await import('./escrow.service');
      const escrowService = new EscrowService();
      
      const escrowResult = await escrowService.createEscrowPayment(
        orderId,
        userId
      );

      if (escrowResult.isErr()) {
        // Cancel the payment intent if escrow creation fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        return failure(escrowResult.error);
      }

      paymentLogger.info({
        ...context,
        operation: 'payment_intent_escrow_created',
        paymentIntentId: paymentIntent.id,
        metadata: {
          escrowId: escrowResult.value.escrowId,
          stripeAmount,
          captureMethod: 'manual',
        },
      });

      return success({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        escrowId: escrowResult.value.escrowId,
      });
    } catch (error) {
      const mappedError = this.mapStripeError(error, 'create_payment_intent_with_escrow', context);
      return failure(mappedError);
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get or create Stripe customer for user
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<AppResult<Stripe.Customer>> {
    try {
      // 1. Check if user already has a customer ID in database
      const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
        columns: {
          stripeCustomerId: true,
          username: true,
        },
      });

      if (!user) {
        return failure(new NotFoundError('User', userId));
      }

      // 2. If user has a customer ID, retrieve from Stripe
      if (user.stripeCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(user.stripeCustomerId);
          if (customer && !customer.deleted) {
            return success(customer as Stripe.Customer);
          }
        } catch (error) {
          // Customer doesn't exist in Stripe, we'll create a new one
          paymentLogger.warn({
            userId,
            operation: 'stripe_customer_not_found',
            metadata: {
              stripeCustomerId: user.stripeCustomerId,
              message: 'Stripe customer not found, creating new one',
            },
          });
        }
      }

      // 3. Create new customer in Stripe
      const customer = await stripe.customers.create({
        metadata: { userId },
        description: `Customer for user ${user.username}`,
      });

      // 4. Update user record with new customer ID
      await db
        .update(profiles)
        .set({ 
          stripeCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      paymentLogger.info({
        userId,
        operation: 'stripe_customer_created',
        metadata: {
          customerId: customer.id,
          username: user.username,
        },
      });

      return success(customer);
    } catch (error) {
      paymentLogger.error({
        userId,
        operation: 'stripe_customer_creation_failed',
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'STRIPE_CUSTOMER_ERROR',
        },
      });
      return failure(new PaymentProcessingError('Failed to get or create Stripe customer'));
    }
  }

  /**
   * Extract payment method data from Stripe payment method
   */
  private extractPaymentMethodData(
    stripePaymentMethod: Stripe.PaymentMethod,
    userId: string,
    isDefault: boolean = false
  ) {
    const baseData = {
      userId,
      stripePaymentMethodId: stripePaymentMethod.id,
      type: stripePaymentMethod.type,
      fingerprint: '',
      last4: '',
      brand: null as string | null,
      expiryMonth: null as number | null,
      expiryYear: null as number | null,
      isDefault,
      metadata: {},
    };

    if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
      return {
        ...baseData,
        fingerprint: stripePaymentMethod.card.fingerprint || '',
        last4: stripePaymentMethod.card.last4 || '****',
        brand: stripePaymentMethod.card.brand,
        expiryMonth: stripePaymentMethod.card.exp_month,
        expiryYear: stripePaymentMethod.card.exp_year,
      };
    }

    if (stripePaymentMethod.type === 'us_bank_account' && stripePaymentMethod.us_bank_account) {
      return {
        ...baseData,
        fingerprint: stripePaymentMethod.us_bank_account.fingerprint || '',
        last4: stripePaymentMethod.us_bank_account.last4 || '****',
        brand: stripePaymentMethod.us_bank_account.bank_name,
      };
    }

    // Default fallback
    return {
      ...baseData,
      fingerprint: stripePaymentMethod.id, // Use ID as fallback fingerprint
      last4: '****',
    };
  }

  // ============================================
  // REAL-TIME BROADCASTING METHODS
  // ============================================

  /**
   * Broadcast payment status updates via Supabase Realtime
   */
  private async broadcastPaymentStatusUpdate(
    paymentIntentId: string,
    update: {
      status: string;
      amount?: number;
      currency?: string;
      error?: string;
      nextAction?: string;
      clientSecret?: string;
      userId?: string;
      orderId?: string;
    }
  ): Promise<void> {
    try {
      const channelName = `payment_status_${paymentIntentId}`;
      
      // Broadcast to payment-specific channel
      const channel = supabase.channel(channelName);
      await channel.send({
        type: 'broadcast',
        event: 'payment_status_update',
        payload: {
          paymentIntentId,
          timestamp: new Date().toISOString(),
          ...update,
        },
      });

      // Also broadcast to user-specific channel if userId is available
      if (update.userId) {
        const userChannel = supabase.channel(`user_payments_${update.userId}`);
        await userChannel.send({
          type: 'broadcast',
          event: 'payment_status_update',
          payload: {
            paymentIntentId,
            timestamp: new Date().toISOString(),
            ...update,
          },
        });
      }

      paymentLogger.info({
        operation: 'payment_status_broadcast',
        paymentIntentId,
        metadata: {
          status: update.status,
          userId: update.userId,
          channelName,
        },
      });
    } catch (error) {
      paymentLogger.error({
        operation: 'payment_status_broadcast_failed',
        paymentIntentId,
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast Connect account updates via Supabase Realtime
   */
  private async broadcastConnectAccountUpdate(
    account: Stripe.Account,
    eventType: string = 'updated'
  ): Promise<void> {
    try {
      // Extract user ID from account metadata
      const userId = account.metadata?.userId;
      if (!userId) {
        paymentLogger.warn({
          operation: 'connect_account_broadcast_skipped',
          metadata: {
            accountId: account.id,
            reason: 'No userId in account metadata',
          },
        });
        return;
      }

      const channelName = `connect_account_${userId}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'connect_account_update',
        payload: {
          accountId: account.id,
          eventType,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: {
            currentlyDue: account.requirements?.currently_due || [],
            eventuallyDue: account.requirements?.eventually_due || [],
            pastDue: account.requirements?.past_due || [],
            pendingVerification: account.requirements?.pending_verification || [],
          },
          timestamp: new Date().toISOString(),
        },
      });

      paymentLogger.info({
        operation: 'connect_account_broadcast',
        metadata: {
          accountId: account.id,
          userId,
          eventType,
          channelName,
        },
      });
    } catch (error) {
      paymentLogger.error({
        operation: 'connect_account_broadcast_failed',
        metadata: {
          accountId: account.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast capability updates via Supabase Realtime
   */
  private async broadcastCapabilityUpdate(capability: Stripe.Capability): Promise<void> {
    try {
      // Get account to find user ID
      const account = await stripe.accounts.retrieve(capability.account as string);
      const userId = account.metadata?.userId;
      
      if (!userId) {
        paymentLogger.warn({
          operation: 'capability_broadcast_skipped',
          metadata: {
            capabilityId: capability.id,
            accountId: capability.account,
            reason: 'No userId in account metadata',
          },
        });
        return;
      }

      const channelName = `connect_account_${userId}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'capability_update',
        payload: {
          capabilityId: capability.id,
          accountId: capability.account,
          status: capability.status,
          requirements: capability.requirements,
          timestamp: new Date().toISOString(),
        },
      });

      paymentLogger.info({
        operation: 'capability_broadcast',
        metadata: {
          capabilityId: capability.id,
          accountId: capability.account,
          userId,
          status: capability.status,
        },
      });
    } catch (error) {
      paymentLogger.error({
        operation: 'capability_broadcast_failed',
        metadata: {
          capabilityId: capability.id,
          accountId: capability.account,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast dispute updates via Supabase Realtime
   */
  private async broadcastDisputeUpdate(
    dispute: Stripe.Dispute,
    eventType: string
  ): Promise<void> {
    try {
      // Get charge to find payment intent and user info
      const charge = await stripe.charges.retrieve(dispute.charge as string);
      const paymentIntentId = charge.payment_intent as string;
      
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const userId = paymentIntent.metadata?.userId;
        
        if (userId) {
          const channelName = `user_payments_${userId}`;
          const channel = supabase.channel(channelName);
          
          await channel.send({
            type: 'broadcast',
            event: 'dispute_update',
            payload: {
              disputeId: dispute.id,
              chargeId: dispute.charge,
              paymentIntentId,
              eventType,
              status: dispute.status,
              amount: dispute.amount / 100,
              currency: dispute.currency,
              reason: dispute.reason,
              timestamp: new Date().toISOString(),
            },
          });

          paymentLogger.info({
            operation: 'dispute_broadcast',
            metadata: {
              disputeId: dispute.id,
              userId,
              eventType,
              status: dispute.status,
            },
          });
        }
      }
    } catch (error) {
      paymentLogger.error({
        operation: 'dispute_broadcast_failed',
        metadata: {
          disputeId: dispute.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast transfer updates via Supabase Realtime
   */
  private async broadcastTransferUpdate(
    transfer: Stripe.Transfer,
    eventType: string
  ): Promise<void> {
    try {
      // Get destination account to find user ID
      const account = await stripe.accounts.retrieve(transfer.destination as string);
      const userId = account.metadata?.userId;
      
      if (userId) {
        const channelName = `connect_account_${userId}`;
        const channel = supabase.channel(channelName);
        
        await channel.send({
          type: 'broadcast',
          event: 'transfer_update',
          payload: {
            transferId: transfer.id,
            eventType,
            amount: transfer.amount / 100,
            currency: transfer.currency,
            status: eventType,
            timestamp: new Date().toISOString(),
          },
        });

        paymentLogger.info({
          operation: 'transfer_broadcast',
          metadata: {
            transferId: transfer.id,
            userId,
            eventType,
            amount: transfer.amount / 100,
          },
        });
      }
    } catch (error) {
      paymentLogger.error({
        operation: 'transfer_broadcast_failed',
        metadata: {
          transferId: transfer.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast payment method updates via Supabase Realtime
   */
  private async broadcastPaymentMethodUpdate(
    paymentMethod: Stripe.PaymentMethod,
    eventType: string
  ): Promise<void> {
    try {
      // Get customer to find user ID
      if (paymentMethod.customer) {
        const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
        if (customer && !customer.deleted) {
          const userId = (customer as Stripe.Customer).metadata?.userId;
          
          if (userId) {
          const channelName = `user_payments_${userId}`;
          const channel = supabase.channel(channelName);
          
          await channel.send({
            type: 'broadcast',
            event: 'payment_method_update',
            payload: {
              paymentMethodId: paymentMethod.id,
              eventType,
              type: paymentMethod.type,
              card: paymentMethod.card ? {
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
              } : null,
              timestamp: new Date().toISOString(),
            },
          });

          paymentLogger.info({
            operation: 'payment_method_broadcast',
            metadata: {
              paymentMethodId: paymentMethod.id,
              userId,
              eventType,
              type: paymentMethod.type,
            },
          });
          }
        }
      }
    } catch (error) {
      paymentLogger.error({
        operation: 'payment_method_broadcast_failed',
        metadata: {
          paymentMethodId: paymentMethod.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast setup intent updates via Supabase Realtime
   */
  private async broadcastSetupIntentUpdate(
    setupIntent: Stripe.SetupIntent,
    eventType: string
  ): Promise<void> {
    try {
      // Get customer to find user ID
      if (setupIntent.customer) {
        const customer = await stripe.customers.retrieve(setupIntent.customer as string);
        if (customer && !customer.deleted) {
          const userId = (customer as Stripe.Customer).metadata?.userId;
          
          if (userId) {
          const channelName = `user_payments_${userId}`;
          const channel = supabase.channel(channelName);
          
          await channel.send({
            type: 'broadcast',
            event: 'setup_intent_update',
            payload: {
              setupIntentId: setupIntent.id,
              eventType,
              status: setupIntent.status,
              paymentMethodId: setupIntent.payment_method,
              timestamp: new Date().toISOString(),
            },
          });

          paymentLogger.info({
            operation: 'setup_intent_broadcast',
            metadata: {
              setupIntentId: setupIntent.id,
              userId,
              eventType,
              status: setupIntent.status,
            },
          });
          }
        }
      }
    } catch (error) {
      paymentLogger.error({
        operation: 'setup_intent_broadcast_failed',
        metadata: {
          setupIntentId: setupIntent.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }

  /**
   * Broadcast invoice updates via Supabase Realtime
   */
  private async broadcastInvoiceUpdate(
    invoice: Stripe.Invoice,
    eventType: string
  ): Promise<void> {
    try {
      // Get customer to find user ID
      if (invoice.customer) {
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        if (customer && !customer.deleted) {
          const userId = (customer as Stripe.Customer).metadata?.userId;
          
          if (userId) {
          const channelName = `user_payments_${userId}`;
          const channel = supabase.channel(channelName);
          
          await channel.send({
            type: 'broadcast',
            event: 'invoice_update',
            payload: {
              invoiceId: invoice.id,
              eventType,
              status: invoice.status,
              amountPaid: invoice.amount_paid / 100,
              amountDue: invoice.amount_due / 100,
              attemptCount: invoice.attempt_count,
              timestamp: new Date().toISOString(),
            },
          });

          paymentLogger.info({
            operation: 'invoice_broadcast',
            metadata: {
              invoiceId: invoice.id,
              userId,
              eventType,
              status: invoice.status,
            },
          });
          }
        }
      }
    } catch (error) {
      paymentLogger.error({
        operation: 'invoice_broadcast_failed',
        metadata: {
          invoiceId: invoice.id,
        },
        error: {
          type: (error as Error).constructor.name,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BROADCAST_ERROR',
        },
      });
    }
  }
}
