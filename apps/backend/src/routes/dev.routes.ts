import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { config } from '../config';
import { db, products, streams, streamProducts, auctions } from '../db';
import { eq, and } from 'drizzle-orm';
import { BidsRepository } from '../repositories/bids.repository';
import { OrdersService } from '../services/orders.service';
import { NotificationsService } from '../services/notifications.service';

const router = Router();

const DEFAULT_BUYER_ID = '878cdb21-ac5c-463f-8fbf-1bf152bd7a47';
const DEFAULT_SELLER_ID = '47d220db-95c8-4365-9ec9-530431bab107';

router.post(
  '/mock-auction-win',
  asyncHandler(async (req, res: Response) => {
    if (config.nodeEnv !== 'development') {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }

    const buyerId =
      (req.body?.buyerId as string | undefined) || DEFAULT_BUYER_ID;
    const sellerId =
      (req.body?.sellerId as string | undefined) || DEFAULT_SELLER_ID;
    const bidAmountRaw = req.body?.bidAmount ?? 25;
    const bidAmount = Number(bidAmountRaw);

    if (!buyerId || !sellerId || Number.isNaN(bidAmount)) {
      res.status(400).json({
        success: false,
        message: 'buyerId, sellerId, and bidAmount are required',
      });
      return;
    }

    const now = new Date();
    const auctionsEndsAt = new Date(now.getTime() + 2 * 60 * 1000);

    const [product] = await db
      .insert(products)
      .values({
        sellerId,
        title: 'Mock Auction Item',
        description: 'Dev-only mock auction product for payment testing.',
        condition: 'new',
        status: 'active',
        startingBid: bidAmount.toFixed(2),
        reservePrice: bidAmount.toFixed(2),
        buyNowPrice: (bidAmount + 10).toFixed(2),
        quantity: 1,
        images: [],
      })
      .returning();

    const [stream] = await db
      .insert(streams)
      .values({
        sellerId,
        title: 'Mock Stream (Payment Test)',
        description: 'Dev-only stream for testing payments.',
        status: 'live',
        scheduledStart: now,
        actualStart: now,
        agoraChannelName: `mock_stream_${Date.now()}`,
        chatEnabled: true,
      })
      .returning();

    await db.insert(streamProducts).values({
      streamId: stream.id,
      productId: product.id,
      status: 'active',
      startedAt: now,
    });

    const [auction] = await db
      .insert(auctions)
      .values({
        productId: product.id,
        streamId: stream.id,
        startingBid: bidAmount.toFixed(2),
        minimumBidIncrement: '1.00',
        status: 'active',
        startedAt: now,
        endsAt: auctionsEndsAt,
      })
      .returning();

    const bidsRepository = new BidsRepository();
    const bidResult = await bidsRepository.placeBid(buyerId, {
      auction_id: auction.id,
      amount: bidAmount,
    });

    if (bidResult.isErr()) {
      res.status(400).json({
        success: false,
        message: bidResult.error.message,
      });
      return;
    }

    await db
      .update(auctions)
      .set({
        status: 'ended',
        endsAt: now,
        currentBid: bidAmount.toFixed(2),
        currentBidderId: buyerId,
        bidCount: 1,
        reserveMet: true,
        winnerNotified: true,
        updatedAt: now,
      })
      .where(eq(auctions.id, auction.id));

    await db
      .update(streamProducts)
      .set({
        status: 'sold',
        endedAt: now,
      })
      .where(
        and(
          eq(streamProducts.streamId, stream.id),
          eq(streamProducts.productId, product.id),
        ),
      );

    await db
      .update(products)
      .set({
        status: 'sold',
        soldQuantity: 1,
        updatedAt: now,
      })
      .where(eq(products.id, product.id));

    const ordersService = new OrdersService();
    const orderNumber = `BD-${Date.now().toString(36).toUpperCase()}`;
    const orderResult = await ordersService.createOrder({
      orderNumber,
      buyerId,
      sellerId,
      productId: product.id,
      streamId: stream.id,
      orderType: 'auction',
      itemPrice: bidAmount.toFixed(2),
      shippingCost: '0',
      tax: '0',
      total: bidAmount.toFixed(2),
      status: 'pending',
    });

    if (orderResult.isErr()) {
      res.status(400).json({
        success: false,
        message: orderResult.error.message,
      });
      return;
    }

    const notificationsService = new NotificationsService();
    await notificationsService.create({
      userId: buyerId,
      type: 'auction_won',
      title: 'You won the auction!',
      message: `You won "${product.title}" for $${bidAmount.toFixed(2)}`,
      data: {
        orderId: orderResult.value.id,
        auctionId: auction.id,
        streamId: stream.id,
      },
      actionUrl: `/checkout/${orderResult.value.id}`,
    });

    res.json({
      success: true,
      data: {
        streamId: stream.id,
        auctionId: auction.id,
        orderId: orderResult.value.id,
        orderNumber,
      },
    });
  }),
);

export default router;
