import Stripe from 'stripe';
import { stripe } from '../utils/stripe';
import {
  EscrowRepository,
  EscrowTransaction,
} from '../repositories/escrow.repository';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';
import { db, orders, sellerDetails } from '../db';
import { eq } from 'drizzle-orm';

// Platform fee percentage (8%)
const PLATFORM_FEE_PERCENT = 8;

// Auto-release period in days
const AUTO_RELEASE_DAYS = 7;

/**
 * Escrow Service
 * Handles escrow payment creation, holding, releasing, and refunding
 */
export class EscrowService {
  private repository: EscrowRepository;

  constructor() {
    this.repository = new EscrowRepository();
  }

  /**
   * Create an escrow payment intent for an order
   * Funds are NOT captured yet - just creates the intent
   */
  async createEscrowPayment(
    orderId: string,
    userId: string,
  ): Promise<
    AppResult<{
      clientSecret: string | null;
      paymentIntentId: string;
      escrowId: string;
    }>
  > {
    try {
      // 1. Get order details with seller info
      const orderData = await this.repository.getOrderWithSeller(orderId);

      if (!orderData) {
        return failure(new NotFoundError('Order', orderId));
      }

      const { order, seller } = orderData;

      // 2. Verify buyer
      if (order.buyerId !== userId) {
        return failure(
          new ValidationError('Only the buyer can pay for this order'),
        );
      }

      // 3. Check order status
      if (order.status !== 'pending') {
        return failure(new ValidationError(`Order is already ${order.status}`));
      }

      // 4. Check if seller has connected Stripe account
      if (!seller?.stripeAccountId) {
        return failure(
          new ValidationError(
            'Seller has not connected their Stripe account for payouts',
          ),
        );
      }

      if (!seller.stripePayoutsEnabled) {
        return failure(
          new ValidationError(
            'Seller Stripe account is not fully set up for payouts',
          ),
        );
      }

      // 5. Check for existing escrow
      const existingEscrow = await this.repository.findByOrderId(orderId);
      if (existingEscrow && existingEscrow.status !== 'cancelled') {
        return failure(
          new ValidationError('Escrow already exists for this order'),
        );
      }

      // 6. Calculate amounts
      const totalAmount = parseFloat(order.total);
      const platformFee = parseFloat(
        (totalAmount * (PLATFORM_FEE_PERCENT / 100)).toFixed(2),
      );
      const sellerAmount = parseFloat((totalAmount - platformFee).toFixed(2));

      // 7. Create Stripe Payment Intent with manual capture
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        capture_method: 'manual', // Don't capture immediately - hold for escrow
        metadata: {
          orderId: orderId,
          buyerId: userId,
          sellerId: order.sellerId,
          type: 'escrow',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // 8. Create escrow transaction record
      const escrow = await this.repository.create({
        orderId: orderId,
        buyerId: userId,
        sellerId: order.sellerId,
        amount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        sellerAmount: sellerAmount.toString(),
        currency: 'usd',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        releaseScheduledAt: new Date(
          Date.now() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000,
        ),
        metadata: {
          orderNumber: order.orderNumber,
          productTitle: order.product?.title,
        },
      });

      return success({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        escrowId: escrow.id,
      });
    } catch (error) {
      console.error('Escrow payment creation error:', error);
      return failure(
        new ValidationError(
          error instanceof Error
            ? error.message
            : 'Failed to create escrow payment',
        ),
      );
    }
  }

  /**
   * Capture payment and hold funds in escrow
   * Called after payment succeeds (webhook or manual)
   */
  async captureToEscrow(
    paymentIntentId: string,
  ): Promise<AppResult<EscrowTransaction>> {
    try {
      // 1. Find escrow by payment intent
      const escrow =
        await this.repository.findByPaymentIntentId(paymentIntentId);

      if (!escrow) {
        return failure(new NotFoundError('Escrow', paymentIntentId));
      }

      if (escrow.status !== 'pending') {
        return failure(
          new ValidationError(`Escrow is already ${escrow.status}`),
        );
      }

      // 2. Capture the payment
      const paymentIntent =
        await stripe.paymentIntents.capture(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return failure(
          new ValidationError(
            `Payment capture failed: ${paymentIntent.status}`,
          ),
        );
      }

      // 3. Update escrow status to held
      const updatedEscrow = await this.repository.update(escrow.id, {
        status: 'held',
        heldAt: new Date(),
      });

      // 4. Update order status to paid
      await db
        .update(orders)
        .set({
          status: 'paid',
          stripePaymentIntentId: paymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, escrow.orderId));

      console.log(
        `Escrow ${escrow.id} captured and held for order ${escrow.orderId}`,
      );

      return success(updatedEscrow);
    } catch (error) {
      console.error('Escrow capture error:', error);
      return failure(
        new ValidationError(
          error instanceof Error ? error.message : 'Failed to capture escrow',
        ),
      );
    }
  }

  /**
   * Release escrow funds to seller
   * Creates a transfer to the seller's connected account
   */
  async releaseToSeller(
    escrowId: string,
    reason: string,
  ): Promise<
    AppResult<{ transfer: Stripe.Transfer; escrow: EscrowTransaction }>
  > {
    try {
      // 1. Get escrow
      const escrow = await this.repository.findById(escrowId);

      if (!escrow) {
        return failure(new NotFoundError('Escrow', escrowId));
      }

      if (escrow.status !== 'held') {
        return failure(
          new ValidationError(
            `Cannot release escrow in status: ${escrow.status}`,
          ),
        );
      }

      // 2. Get seller's Stripe account
      const seller = await this.repository.getSellerDetails(escrow.sellerId);

      if (!seller?.stripeAccountId) {
        return failure(
          new ValidationError('Seller has no connected Stripe account'),
        );
      }

      // 3. Update status to releasing
      await this.repository.update(escrowId, {
        status: 'releasing',
      });

      // 4. Create transfer to seller
      const sellerAmountCents = Math.round(
        parseFloat(escrow.sellerAmount) * 100,
      );

      const transfer = await stripe.transfers.create({
        amount: sellerAmountCents,
        currency: escrow.currency,
        destination: seller.stripeAccountId,
        source_transaction: escrow.stripePaymentIntentId
          ? undefined
          : undefined,
        metadata: {
          escrowId: escrowId,
          orderId: escrow.orderId,
          releaseReason: reason,
        },
      });

      // 5. Update escrow as released
      const updatedEscrow = await this.repository.update(escrowId, {
        status: 'released',
        stripeTransferId: transfer.id,
        releasedAt: new Date(),
        releaseReason: reason,
      });

      // 6. Update order status
      await db
        .update(orders)
        .set({
          status: 'delivered',
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, escrow.orderId));

      // 7. Update seller stats
      await db
        .update(sellerDetails)
        .set({
          totalRevenue: `${parseFloat(seller.totalRevenue) + parseFloat(escrow.sellerAmount)}`,
          updatedAt: new Date(),
        })
        .where(eq(sellerDetails.userId, escrow.sellerId));

      console.log(
        `Escrow ${escrowId} released to seller. Transfer: ${transfer.id}`,
      );

      return success({ transfer, escrow: updatedEscrow });
    } catch (error) {
      console.error('Escrow release error:', error);

      // Revert status if transfer failed
      await this.repository.update(escrowId, { status: 'held' });

      return failure(
        new ValidationError(
          error instanceof Error ? error.message : 'Failed to release escrow',
        ),
      );
    }
  }

  /**
   * Refund escrow to buyer
   */
  async refundToBuyer(
    escrowId: string,
    reason: string,
  ): Promise<AppResult<{ refund: Stripe.Refund; escrow: EscrowTransaction }>> {
    try {
      // 1. Get escrow
      const escrow = await this.repository.findById(escrowId);

      if (!escrow) {
        return failure(new NotFoundError('Escrow', escrowId));
      }

      if (escrow.status !== 'held' && escrow.status !== 'disputed') {
        return failure(
          new ValidationError(
            `Cannot refund escrow in status: ${escrow.status}`,
          ),
        );
      }

      if (!escrow.stripePaymentIntentId) {
        return failure(
          new ValidationError('No payment intent found for escrow'),
        );
      }

      // 2. Update status to refunding
      await this.repository.update(escrowId, {
        status: 'refunding',
      });

      // 3. Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: escrow.stripePaymentIntentId,
        metadata: {
          escrowId: escrowId,
          orderId: escrow.orderId,
          refundReason: reason,
        },
      });

      // 4. Update escrow as refunded
      const updatedEscrow = await this.repository.update(escrowId, {
        status: 'refunded',
        stripeRefundId: refund.id,
        refundedAt: new Date(),
        refundReason: reason,
      });

      // 5. Update order status
      await db
        .update(orders)
        .set({
          status: 'refunded',
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, escrow.orderId));

      console.log(`Escrow ${escrowId} refunded to buyer. Refund: ${refund.id}`);

      return success({ refund, escrow: updatedEscrow });
    } catch (error) {
      console.error('Escrow refund error:', error);

      // Revert status if refund failed
      await this.repository.update(escrowId, { status: 'held' });

      return failure(
        new ValidationError(
          error instanceof Error ? error.message : 'Failed to refund escrow',
        ),
      );
    }
  }

  /**
   * Cancel a pending escrow (before capture)
   */
  async cancelEscrow(escrowId: string): Promise<AppResult<EscrowTransaction>> {
    try {
      const escrow = await this.repository.findById(escrowId);

      if (!escrow) {
        return failure(new NotFoundError('Escrow', escrowId));
      }

      if (escrow.status !== 'pending') {
        return failure(
          new ValidationError(
            `Cannot cancel escrow in status: ${escrow.status}`,
          ),
        );
      }

      // Cancel payment intent in Stripe
      if (escrow.stripePaymentIntentId) {
        await stripe.paymentIntents.cancel(escrow.stripePaymentIntentId);
      }

      // Update escrow status
      const updatedEscrow = await this.repository.update(escrowId, {
        status: 'cancelled',
      });

      return success(updatedEscrow);
    } catch (error) {
      console.error('Escrow cancellation error:', error);
      return failure(
        new ValidationError(
          error instanceof Error ? error.message : 'Failed to cancel escrow',
        ),
      );
    }
  }

  /**
   * Get escrow by ID
   */
  async getEscrow(escrowId: string): Promise<AppResult<EscrowTransaction>> {
    const escrow = await this.repository.findById(escrowId);
    if (!escrow) {
      return failure(new NotFoundError('Escrow', escrowId));
    }
    return success(escrow);
  }

  /**
   * Get escrow by order ID
   */
  async getEscrowByOrder(
    orderId: string,
  ): Promise<AppResult<EscrowTransaction>> {
    const escrow = await this.repository.findByOrderId(orderId);
    if (!escrow) {
      return failure(new NotFoundError('Escrow for order', orderId));
    }
    return success(escrow);
  }

  /**
   * Process auto-release for escrows past their scheduled date
   * Called by background job
   */
  async processAutoRelease(): Promise<number> {
    const pendingEscrows = await this.repository.findPendingAutoRelease();
    let released = 0;

    for (const escrow of pendingEscrows) {
      try {
        const result = await this.releaseToSeller(escrow.id, 'auto_release');
        if (result.isOk()) {
          released++;
        }
      } catch (error) {
        console.error(`Auto-release failed for escrow ${escrow.id}:`, error);
      }
    }

    console.log(`Auto-released ${released} escrows`);
    return released;
  }

  /**
   * Handle dispute created webhook
   */
  async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const paymentIntentId = dispute.payment_intent as string;
    const escrow = await this.repository.findByPaymentIntentId(paymentIntentId);

    if (!escrow) {
      console.warn(
        `No escrow found for disputed payment intent: ${paymentIntentId}`,
      );
      return;
    }

    await this.repository.update(escrow.id, {
      status: 'disputed',
      disputeId: dispute.id,
    });

    console.log(
      `Escrow ${escrow.id} marked as disputed. Dispute: ${dispute.id}`,
    );
  }
}
