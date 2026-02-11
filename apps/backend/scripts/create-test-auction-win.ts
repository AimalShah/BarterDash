/**
 * Script to create test auction win data for payment testing
 * Run with: npx ts-node scripts/create-test-auction-win.ts
 */
import { db, products, streams, streamProducts, auctions } from '../src/db';
import { BidsRepository } from '../src/repositories/bids.repository';
import { OrdersService } from '../src/services/orders.service';
import { NotificationsService } from '../src/services/notifications.service';

const BUYER_ID = '878cdb21-ac5c-463f-8fbf-1bf152bd7a47';
const SELLER_ID = '47d220db-95c8-4365-9ec9-530431bab107';
const BID_AMOUNT = 50;

async function createTestAuctionWin() {
  console.log('🎯 Creating test auction win scenario...');
  console.log(`Buyer: ${BUYER_ID}`);
  console.log(`Seller: ${SELLER_ID}`);
  console.log(`Bid Amount: $${BID_AMOUNT}`);

  try {
    const now = new Date();
    const auctionsEndsAt = new Date(now.getTime() - 1000); // Already ended

    // 1. Create Product
    console.log('\n1️⃣ Creating product...');
    const [product] = await db
      .insert(products)
      .values({
        sellerId: SELLER_ID,
        title: 'Vintage Watch - Payment Test',
        description: 'A beautiful vintage watch for payment testing. This is a test item.',
        condition: 'new',
        status: 'sold',
        startingBid: BID_AMOUNT.toFixed(2),
        reservePrice: BID_AMOUNT.toFixed(2),
        buyNowPrice: (BID_AMOUNT + 10).toFixed(2),
        quantity: 1,
        images: [],
      })
      .returning();
    console.log(`   ✅ Product created: ${product.id}`);

    // 2. Create Stream
    console.log('\n2️⃣ Creating stream...');
    const [stream] = await db
      .insert(streams)
      .values({
        sellerId: SELLER_ID,
        title: 'Test Stream - Payment Flow',
        description: 'Dev stream for testing payment flow',
        status: 'ended',
        scheduledStart: now,
        actualStart: now,
        actualEnd: now,
        agoraChannelName: `test_stream_${Date.now()}`,
        chatEnabled: true,
      })
      .returning();
    console.log(`   ✅ Stream created: ${stream.id}`);

    // 3. Create Stream Product Link
    console.log('\n3️⃣ Creating stream-product link...');
    await db.insert(streamProducts).values({
      streamId: stream.id,
      productId: product.id,
      status: 'sold',
      startedAt: now,
      endedAt: now,
    });
    console.log('   ✅ Stream-product link created');

    // 4. Create Auction
    console.log('\n4️⃣ Creating auction...');
    const [auction] = await db
      .insert(auctions)
      .values({
        productId: product.id,
        streamId: stream.id,
        startingBid: BID_AMOUNT.toFixed(2),
        minimumBidIncrement: '1.00',
        status: 'ended',
        startedAt: now,
        endsAt: auctionsEndsAt,
        currentBid: BID_AMOUNT.toFixed(2),
        currentBidderId: BUYER_ID,
        bidCount: 1,
        reserveMet: true,
        winnerNotified: true,
      })
      .returning();
    console.log(`   ✅ Auction created: ${auction.id}`);

    // 5. Create Bid
    console.log('\n5️⃣ Creating bid...');
    const bidsRepository = new BidsRepository();
    const bidResult = await bidsRepository.placeBid(BUYER_ID, {
      auction_id: auction.id,
      amount: BID_AMOUNT,
    });

    if (bidResult.isErr()) {
      console.error('   ❌ Failed to create bid:', bidResult.error.message);
      // Continue anyway since we manually set the auction winner above
    } else {
      console.log(`   ✅ Bid created: ${bidResult.value.bid_id}`);
    }

    // 6. Create Order
    console.log('\n6️⃣ Creating order...');
    const ordersService = new OrdersService();
    const orderNumber = `BD-${Date.now().toString(36).toUpperCase()}`;
    const orderResult = await ordersService.createOrder({
      orderNumber,
      buyerId: BUYER_ID,
      sellerId: SELLER_ID,
      productId: product.id,
      streamId: stream.id,
      orderType: 'auction',
      itemPrice: BID_AMOUNT.toFixed(2),
      shippingCost: '5.00',
      tax: '4.50',
      total: (BID_AMOUNT + 5 + 4.5).toFixed(2),
      status: 'pending',
    });

    if (orderResult.isErr()) {
      console.error('   ❌ Failed to create order:', orderResult.error.message);
      process.exit(1);
    }

    const order = orderResult.value;
    console.log(`   ✅ Order created: ${order.id}`);
    console.log(`   📋 Order Number: ${orderNumber}`);

    // 7. Create Notification
    console.log('\n7️⃣ Creating notification...');
    try {
      const notificationsService = new NotificationsService();
      await notificationsService.create({
        userId: BUYER_ID,
        type: 'auction_won',
        title: 'You won the auction!',
        message: `You won "${product.title}" for $${BID_AMOUNT.toFixed(2)}`,
        data: {
          orderId: order.id,
          auctionId: auction.id,
          streamId: stream.id,
        },
        actionUrl: `/checkout/${order.id}`,
      });
      console.log('   ✅ Notification created');
    } catch (notifError) {
      console.warn('   ⚠️  Notification creation failed (non-critical):', notifError);
    }

    console.log('\n✨ Test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Stream ID: ${stream.id}`);
    console.log(`   Auction ID: ${auction.id}`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Total Amount: $${(BID_AMOUNT + 5 + 4.5).toFixed(2)} (includes $5 shipping + $4.50 tax)`);
    console.log('\n🔗 The buyer can now pay for this order in the app!');

  } catch (error) {
    console.error('\n❌ Error creating test data:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestAuctionWin();
