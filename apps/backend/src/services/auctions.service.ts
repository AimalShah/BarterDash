import { AuctionsRepository } from '../repositories/auctions.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../utils/result';
import {
  Auction,
  products,
  streams,
  streamProducts,
  orders,
} from '../db/schema';
import { OrdersService } from './orders.service';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { supabase } from '../utils/supabase';
import { auctionQueue } from '../jobs/auction.processor';
import {
  CreateAuctionInput,
  StartStreamAuctionInput,
} from '../schemas/auctions.schemas';

/**
 * Auctions Service
 * Business logic for auctions - supports both live stream and pre-bidding auctions
 */
export class AuctionsService {
  private repository: AuctionsRepository;
  private ordersService: OrdersService;
  private emailService: EmailService;
  private notificationsService: NotificationsService;

  constructor() {
    this.repository = new AuctionsRepository();
    this.ordersService = new OrdersService();
    this.emailService = new EmailService();
    this.notificationsService = new NotificationsService();
  }

  /**
   * Create standalone/pre-bidding auction (not tied to a live stream)
   * Can be scheduled to start later or start immediately
   */
  async create(
    userId: string,
    data: CreateAuctionInput,
  ): Promise<AppResult<Auction>> {
    // Verify seller
    const sellerResult = await this.repository.getSellerByUserId(userId);
    if (sellerResult.isErr()) return failure(sellerResult.error);
    if (!sellerResult.value?.isSeller) {
      return failure(new ValidationError('User is not a seller'));
    }

    // Verify product belongs to seller
    const product = await db.query.products.findFirst({
      where: eq(products.id, data.product_id),
    });

    if (!product) {
      return failure(new NotFoundError('Product', data.product_id));
    }

    if (product.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this product'));
    }

    if (product.status !== 'active') {
      return failure(new ValidationError('Product is not active'));
    }

    // Calculate auction timing
    const now = new Date();
    const scheduledStart = data.scheduled_start
      ? new Date(data.scheduled_start)
      : now;
    const isScheduled = scheduledStart > now;
    const endsAt = new Date(
      scheduledStart.getTime() + data.duration_minutes * 60 * 1000,
    );

    // Create auction
    const auctionResult = await this.repository.create({
      productId: data.product_id,
      startingBid: data.starting_bid.toString(),
      reservePrice: data.reserve_price?.toString(),
      minimumBidIncrement: data.minimum_bid_increment.toString(),
      status: isScheduled ? 'pending' : 'active',
      startedAt: isScheduled ? null : now,
      endsAt: endsAt,
      mode: data.mode || 'normal',
      maxTimerExtensions: data.max_timer_extensions || 10,
    });

    if (auctionResult.isErr()) return auctionResult;

    const auction = auctionResult.value;

    // Schedule auction end job
    const delay = endsAt.getTime() - Date.now();
    await auctionQueue.add(
      'end-auction',
      { auctionId: auction.id },
      { delay, removeOnComplete: true },
    );

    // If scheduled for later, also schedule the start
    if (isScheduled) {
      const startDelay = scheduledStart.getTime() - Date.now();
      await auctionQueue.add(
        'start-auction',
        { auctionId: auction.id },
        { delay: startDelay, removeOnComplete: true },
      );
    }

    return success(auction);
  }

  /**
   * Start auction for a product during a live stream
   */
  async startStreamAuction(
    userId: string,
    data: StartStreamAuctionInput,
  ): Promise<AppResult<Auction>> {
    // Verify stream exists and is live
    const stream = await db.query.streams.findFirst({
      where: eq(streams.id, data.stream_id),
    });

    if (!stream) {
      return failure(new NotFoundError('Stream', data.stream_id));
    }

    if (stream.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this stream'));
    }

    if (stream.status !== 'live') {
      return failure(
        new ValidationError('Stream is not live. Start the stream first.'),
      );
    }

    // Verify product exists and belongs to seller
    const product = await db.query.products.findFirst({
      where: eq(products.id, data.product_id),
    });

    if (!product) {
      return failure(new NotFoundError('Product', data.product_id));
    }

    if (product.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this product'));
    }

    // Check if product is linked to stream
    const streamProduct = await db.query.streamProducts.findFirst({
      where: and(
        eq(streamProducts.streamId, data.stream_id),
        eq(streamProducts.productId, data.product_id),
      ),
    });

    // If not linked, add it
    if (!streamProduct) {
      await db.insert(streamProducts).values({
        streamId: data.stream_id,
        productId: data.product_id,
        status: 'active',
        startedAt: new Date(),
      });
    } else {
      // Update status to active
      await db
        .update(streamProducts)
        .set({ status: 'active', startedAt: new Date() })
        .where(eq(streamProducts.id, streamProduct.id));
    }

    // Calculate end time
    const now = new Date();
    const endsAt = new Date(now.getTime() + data.duration_minutes * 60 * 1000);

    // Create the auction
    const auctionResult = await this.repository.create({
      productId: data.product_id,
      streamId: data.stream_id,
      startingBid: data.starting_bid.toString(),
      reservePrice: data.reserve_price?.toString(),
      minimumBidIncrement: data.minimum_bid_increment.toString(),
      status: 'active',
      startedAt: now,
      endsAt: endsAt,
      mode: data.mode || 'normal',
      maxTimerExtensions: data.max_timer_extensions || 10,
    });

    if (auctionResult.isErr()) return auctionResult;

    const auction = auctionResult.value;

    // Schedule auction end job
    const delay = data.duration_minutes * 60 * 1000;
    await auctionQueue.add(
      'end-auction',
      { auctionId: auction.id, streamId: data.stream_id },
      { delay, removeOnComplete: true },
    );

    return success(auction);
  }

  /**
   * Start a pending auction (called by scheduler or manually)
   */
  async startAuction(auctionId: string): Promise<AppResult<any>> {
    const auctionResult = await this.repository.findById(auctionId);
    if (auctionResult.isErr()) return failure(auctionResult.error);

    const auction: any = auctionResult.value;
    if (!auction) return failure(new NotFoundError('Auction', auctionId));

    if (auction.status !== 'pending') {
      return failure(new ValidationError('Auction is not pending'));
    }

    return await this.repository.update(auctionId, {
      status: 'active',
      startedAt: new Date(),
    });
  }

  /**
   * Finalize an auction (called when duration expires)
   */
  async finalize(id: string): Promise<AppResult<any>> {
    const auctionResult = await this.repository.findById(id);
    if (auctionResult.isErr()) return failure(auctionResult.error);

    const auction: any = auctionResult.value;
    if (!auction) return failure(new NotFoundError('Auction', id));

    if (auction.status !== 'active') {
      return failure(new ValidationError('Auction is not active'));
    }

    // Check if reserve was met
    const reserveMet =
      !auction.reservePrice ||
      (auction.currentBid &&
        parseFloat(auction.currentBid) >= parseFloat(auction.reservePrice));

    // Identify if there's a winner
    if (auction.currentBid && auction.currentBidderId && reserveMet) {
      // 1. Mark auction as ended
      await this.repository.update(id, {
        status: 'ended',
        reserveMet: true,
        winnerNotified: true,
      });

      // 2. Update stream product status if applicable
      if (auction.streamId) {
        await db
          .update(streamProducts)
          .set({ status: 'sold', endedAt: new Date() })
          .where(
            and(
              eq(streamProducts.streamId, auction.streamId),
              eq(streamProducts.productId, auction.productId),
            ),
          );
      }

      // 3. Create Order
      const orderNumber = `BD-${Date.now().toString(36).toUpperCase()}`;
      const shippingCost = parseFloat(auction.product?.shippingCost || '0');
      const itemPrice = parseFloat(auction.currentBid);

      const orderResult = await this.ordersService.createOrder({
        orderNumber,
        buyerId: auction.currentBidderId,
        sellerId: auction.product.sellerId,
        productId: auction.productId,
        streamId: auction.streamId || undefined,
        orderType: 'auction',
        itemPrice: itemPrice.toString(),
        shippingCost: shippingCost.toString(),
        total: (itemPrice + shippingCost).toString(),
        status: 'pending',
      });

      if (orderResult.isOk()) {
        const order = orderResult.value;

        // 4. Create payment intent for automatic charging
        const { PaymentsService } = await import('./payments.service');
        const paymentService = new PaymentsService();

        try {
          // Create payment intent for the winning bid amount
          const paymentResult = await paymentService.createPaymentIntent(
            auction.currentBidderId,
            {
              amount: itemPrice + shippingCost,
              auction_id: id,
              order_id: order.id,
            },
          );

          if (paymentResult.isOk()) {
            // Capture payment immediately
            const captureResult = await paymentService.capturePayment(
              paymentResult.value.id,
            );

            // Always store the payment intent ID, even if capture fails
            await db
              .update(orders)
              .set({
                stripePaymentIntentId: paymentResult.value.id,
              })
              .where(eq(orders.id, order.id));

            if (captureResult.isOk() && captureResult.value.success) {
              await db
                .update(orders)
                .set({
                  status: 'paid',
                })
                .where(eq(orders.id, order.id));
            }
          }
        } catch (paymentError) {
          console.error('Auto-payment failed:', paymentError);
          // Order remains in pending state, user can pay manually
        }

        // 5. Mark product as sold
        await db
          .update(products)
          .set({
            status: 'sold',
            soldQuantity: (auction.product?.soldQuantity || 0) + 1,
          })
          .where(eq(products.id, auction.productId));

        // 6. Send notifications
        try {
          await this.notificationsService.create({
            userId: auction.currentBidderId,
            type: 'auction_won',
            title: 'Congratulations! You won!',
            message: `You won the auction for "${auction.product?.title}" at $${itemPrice.toFixed(2)}`,
            data: { orderId: order.id, auctionId: id },
          });

          // Send email
          const {
            data: { user: supabaseUser },
          } = await supabase.auth.admin.getUserById(auction.currentBidderId);
          if (supabaseUser?.email) {
            await this.emailService.sendWinnerNotification(
              supabaseUser.email,
              auction.product?.title || 'Product',
              itemPrice.toString(),
              order.id,
            );
          }
        } catch (notifyError) {
          console.error('Failed to send winner notification:', notifyError);
        }

        return success({
          winner: auction.currentBidderId,
          order,
          reserveMet: true,
        });
      }

      return orderResult;
    } else {
      // No winner or reserve not met
      await this.repository.update(id, { status: 'ended', reserveMet: false });

      // Update stream product if applicable
      if (auction.streamId) {
        await db
          .update(streamProducts)
          .set({ status: 'passed', endedAt: new Date() })
          .where(
            and(
              eq(streamProducts.streamId, auction.streamId),
              eq(streamProducts.productId, auction.productId),
            ),
          );
      }

      return success({
        winner: null,
        message: reserveMet
          ? 'Auction ended with no bids'
          : 'Reserve price not met',
        reserveMet,
      });
    }
  }

  /**
   * Find all auctions with filters
   */
  async findAll(filters: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AppResult<any>> {
    return await this.repository.findAll(filters);
  }

  /**
   * Find auction by ID
   */
  async findById(id: string): Promise<AppResult<any>> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      return failure(result.error);
    }

    if (!result.value) {
      return failure(new NotFoundError('Auction', id));
    }

    return success(result.value);
  }

  /**
   * Get auctions for a specific stream
   */
  async findByStream(streamId: string): Promise<AppResult<Auction[]>> {
    try {
      const { auctions } = await import('../db/schema');
      const results = await db.query.auctions.findMany({
        where: eq(auctions.streamId, streamId),
        with: {
          product: true,
          currentBidder: true,
        },
        orderBy: (a, { desc }) => [desc(a.createdAt)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch stream auctions'));
    }
  }

  /**
   * Cancel an auction (seller only, before any bids)
   */
  async cancel(auctionId: string, userId: string): Promise<AppResult<any>> {
    const auctionResult = await this.repository.findById(auctionId);
    if (auctionResult.isErr()) return failure(auctionResult.error);

    const auction: any = auctionResult.value;
    if (!auction) return failure(new NotFoundError('Auction', auctionId));

    // Verify ownership
    if (auction.product?.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this auction'));
    }

    // Can only cancel if no bids
    if (auction.bidCount > 0) {
      return failure(
        new ValidationError('Cannot cancel auction with existing bids'),
      );
    }

    return await this.repository.update(auctionId, { status: 'cancelled' });
  }

  /**
   * Extend auction duration
   * Used during live auctions when bids come in near the end (like Whatnot's 10s extension)
   */
  async extendAuction(
    auctionId: string,
    userId: string,
    extensionSeconds: number = 30,
  ): Promise<AppResult<any>> {
    const auctionResult = await this.repository.findById(auctionId);
    if (auctionResult.isErr()) return failure(auctionResult.error);

    const auction: any = auctionResult.value;
    if (!auction) return failure(new NotFoundError('Auction', auctionId));

    // Verify auction is active
    if (auction.status !== 'active') {
      return failure(new ValidationError('Can only extend active auctions'));
    }

    // Verify ownership (seller can extend, or system can extend automatically)
    if (auction.product?.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this auction'));
    }

    // Check if max extensions reached
    if (
      auction.maxTimerExtensions &&
      (auction.timerExtensions || 0) >= auction.maxTimerExtensions
    ) {
      return failure(new ValidationError('Maximum timer extensions reached'));
    }

    // Calculate new end time
    const currentEndsAt = new Date(auction.endsAt);
    const newEndsAt = new Date(
      currentEndsAt.getTime() + extensionSeconds * 1000,
    );

    // Update auction
    const updateResult = await this.repository.update(auctionId, {
      endsAt: newEndsAt,
      timerExtensions: (auction.timerExtensions || 0) + 1,
    });

    if (updateResult.isErr()) {
      return failure(updateResult.error);
    }

    // Re-schedule the end job
    const delay = newEndsAt.getTime() - Date.now();
    await auctionQueue.add(
      'end-auction',
      { auctionId: auction.id },
      { delay, removeOnComplete: true },
    );

    return success({
      ...updateResult.value,
      extensionSeconds,
      newEndsAt,
    });
  }
}
