/**
 * Script to create 5 test orders with different scenarios
 * Run with: cd apps/backend && npx ts-node scripts/create-multiple-orders.ts
 */
import { db, products, streams, streamProducts, auctions } from '../src/db';
import { OrdersService } from '../src/services/orders.service';
import { BidsRepository } from '../src/repositories/bids.repository';

const BUYER_ID = '878cdb21-ac5c-463f-8fbf-1bf152bd7a47';
const SELLER_ID = '47d220db-95c8-4365-9ec9-530431bab107';

const testOrders = [
  {
    productName: 'Vintage Watch Collection',
    description: 'A beautiful vintage watch from the 1960s',
    startingBid: 75,
    bidAmount: 85,
    shippingCost: 8,
    tax: 7.65,
    status: 'pending',
  },
  {
    productName: 'Rare Pokemon Card',
    description: 'First edition Charizard card in mint condition',
    startingBid: 120,
    bidAmount: 150,
    shippingCost: 5,
    tax: 13.50,
    status: 'pending',
  },
  {
    productName: 'Designer Handbag',
    description: 'Authentic luxury designer handbag',
    startingBid: 200,
    bidAmount: 250,
    shippingCost: 12,
    tax: 22.50,
    status: 'pending',
  },
  {
    productName: 'Signed Sports Jersey',
    description: 'Autographed by the legendary player',
    startingBid: 300,
    bidAmount: 350,
    shippingCost: 10,
    tax: 31.50,
    status: 'pending',
  },
  {
    productName: 'Limited Edition Sneakers',
    description: 'Rare collaboration sneakers, size 10',
    startingBid: 180,
    bidAmount: 220,
    shippingCost: 8,
    tax: 19.80,
    status: 'pending',
  },
];

async function createTestOrders() {
  console.log('🎯 Creating 5 test orders...');
  console.log(`Buyer: ${BUYER_ID}`);
  console.log(`Seller: ${SELLER_ID}\n`);

  const createdOrders = [];

  for (let i = 0; i < testOrders.length; i++) {
    const orderData = testOrders[i];
    console.log(`\n📦 Order ${i + 1}: ${orderData.productName}`);
    console.log('─'.repeat(60));

    try {
      const now = new Date();
      const pastDate = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000); // Different days ago

      // 1. Create Product
      const [product] = await db.insert(products).values({
        sellerId: SELLER_ID,
        title: orderData.productName,
        description: orderData.description,
        condition: 'new',
        status: 'sold',
        startingBid: orderData.startingBid.toFixed(2),
        reservePrice: orderData.startingBid.toFixed(2),
        buyNowPrice: (orderData.startingBid + 20).toFixed(2),
        quantity: 1,
        images: [],
      }).returning();
      console.log(`   ✅ Product: ${product.id}`);

      // 2. Create Stream
      const [stream] = await db.insert(streams).values({
        sellerId: SELLER_ID,
        title: `Stream - ${orderData.productName}`,
        description: `Live auction for ${orderData.productName}`,
        status: 'ended',
        scheduledStart: pastDate,
        actualStart: pastDate,
        actualEnd: pastDate,
        agoraChannelName: `stream_${Date.now()}_${i}`,
        chatEnabled: true,
      }).returning();
      console.log(`   ✅ Stream: ${stream.id}`);

      // 3. Create Stream Product
      await db.insert(streamProducts).values({
        streamId: stream.id,
        productId: product.id,
        status: 'sold',
        startedAt: pastDate,
        endedAt: pastDate,
      });
      console.log(`   ✅ Stream Product link`);

      // 4. Create Auction
      const [auction] = await db.insert(auctions).values({
        productId: product.id,
        streamId: stream.id,
        startingBid: orderData.startingBid.toFixed(2),
        minimumBidIncrement: '5.00',
        status: 'ended',
        startedAt: pastDate,
        endsAt: pastDate,
        currentBid: orderData.bidAmount.toFixed(2),
        currentBidderId: BUYER_ID,
        bidCount: 1,
        reserveMet: true,
        winnerNotified: true,
      }).returning();
      console.log(`   ✅ Auction: ${auction.id}`);

      // 5. Create Bid
      const bidsRepository = new BidsRepository();
      await bidsRepository.placeBid(BUYER_ID, {
        auction_id: auction.id,
        amount: orderData.bidAmount,
      });
      console.log(`   ✅ Bid: $${orderData.bidAmount}`);

      // 6. Create Order
      const ordersService = new OrdersService();
      const total = orderData.bidAmount + orderData.shippingCost + orderData.tax;
      const orderNumber = `BD-${Date.now().toString(36).toUpperCase().slice(-8)}-${i + 1}`;
      
      const orderResult = await ordersService.createOrder({
        orderNumber,
        buyerId: BUYER_ID,
        sellerId: SELLER_ID,
        productId: product.id,
        streamId: stream.id,
        orderType: 'auction',
        itemPrice: orderData.bidAmount.toFixed(2),
        shippingCost: orderData.shippingCost.toFixed(2),
        tax: orderData.tax.toFixed(2),
        total: total.toFixed(2),
        status: orderData.status,
      });

      if (orderResult.isErr()) {
        throw new Error(orderResult.error.message);
      }

      const order = orderResult.value;
      console.log(`   ✅ Order: ${order.id}`);
      console.log(`   📋 Order Number: ${orderNumber}`);
      console.log(`   💰 Total: $${total.toFixed(2)}`);

      createdOrders.push({
        index: i + 1,
        orderId: order.id,
        orderNumber,
        productName: orderData.productName,
        total: total.toFixed(2),
      });

    } catch (error) {
      console.error(`   ❌ Error creating order ${i + 1}:`, error);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✨ ALL ORDERS CREATED!');
  console.log('═'.repeat(60));
  
  createdOrders.forEach(order => {
    console.log(`\n${order.index}. ${order.productName}`);
    console.log(`   Order ID: ${order.orderId}`);
    console.log(`   Order #: ${order.orderNumber}`);
    console.log(`   Total: $${order.total}`);
  });

  console.log('\n🔗 Buyer can view orders at:');
  console.log('   /orders/my-orders');
  console.log('\n🔗 Seller can view sales at:');
  console.log('   /seller/sales');

  process.exit(0);
}

createTestOrders();
