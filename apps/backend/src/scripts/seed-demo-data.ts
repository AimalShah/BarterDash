/**
 * Seed Demo Data Script
 * Creates mockup data for testing the app flows
 *
 * Run with: npx ts-node src/scripts/seed-demo-data.ts
 */

import { db } from '../db';
import {
  profiles,
  categories,
  products,
  streams,
  streamProducts,
  sellerDetails,
  auctions,
  orders,
} from '../db/schema';
import { eq } from 'drizzle-orm';

const DEMO_USER_ID = 'b3ea664f-f358-4e7a-a860-fa5801e1b76e';

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...\n');

  try {
    // 1. Update user profile to be a seller
    console.log('📝 Setting up user as seller...');
    await db
      .update(profiles)
      .set({
        isSeller: true,
        onboarded: true,
        onboardingStep: 'completed',
        username: 'demo_seller',
        fullName: 'Demo Seller',
        bio: 'Your favorite marketplace seller! Authentic products, fast shipping.',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, DEMO_USER_ID));

    // 2. Create or update seller details
    console.log('🏪 Creating seller details...');
    const existingSellerDetails = await db.query.sellerDetails.findFirst({
      where: eq(sellerDetails.userId, DEMO_USER_ID),
    });

    if (!existingSellerDetails) {
      await db.insert(sellerDetails).values({
        userId: DEMO_USER_ID,
        totalSales: '150.00',
        totalRevenue: '25000.00',
        rating: '4.8',
        totalReviews: 45,
      });
    }

    // 3. Create categories if they don't exist
    console.log('📂 Creating categories...');
    const categoryData = [
      { name: 'Sneakers', slug: 'sneakers' },
      { name: 'Streetwear', slug: 'streetwear' },
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Collectibles', slug: 'collectibles' },
      { name: 'Watches', slug: 'watches' },
    ];

    const insertedCategories: any[] = [];
    for (const cat of categoryData) {
      const existing = await db.query.categories.findFirst({
        where: eq(categories.slug, cat.slug),
      });
      if (existing) {
        insertedCategories.push(existing);
      } else {
        const [inserted] = await db.insert(categories).values(cat).returning();
        insertedCategories.push(inserted);
      }
    }

    // 4. Create demo products
    console.log('📦 Creating demo products...');
    const productData = [
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[0].id,
        title: 'Nike Air Jordan 1 Retro High OG',
        description:
          'Brand new, never worn. Size 10 US. Comes with original box and receipt.',
        buyNowPrice: '350.00',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        ],
        condition: 'new' as const,
        status: 'active' as const,
      },
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[0].id,
        title: 'Yeezy Boost 350 V2 Zebra',
        description: 'Lightly worn, excellent condition. Size 9.5 US.',
        buyNowPrice: '280.00',
        images: [
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800',
        ],
        condition: 'like_new' as const,
        status: 'active' as const,
      },
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[1].id,
        title: 'Supreme Box Logo Hoodie Black',
        description: 'FW21 release. Size L. Deadstock with tags.',
        buyNowPrice: '650.00',
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
        ],
        condition: 'new' as const,
        status: 'active' as const,
      },
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[2].id,
        title: 'Sony PlayStation 5 Digital Edition',
        description: 'Sealed in box. Never opened.',
        buyNowPrice: '450.00',
        images: [
          'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
        ],
        condition: 'new' as const,
        status: 'active' as const,
      },
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[3].id,
        title: 'Pokemon Base Set Charizard Holo PSA 9',
        description: 'Graded PSA 9. Amazing condition for a 1999 card.',
        startingBid: '500.00',
        buyNowPrice: '1200.00',
        images: [
          'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=800',
        ],
        condition: 'good' as const,
        status: 'active' as const,
      },
      {
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[4].id,
        title: 'Rolex Submariner Date 126610LN',
        description: '2023 model with box and papers. Excellent condition.',
        buyNowPrice: '14500.00',
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        ],
        condition: 'like_new' as const,
        status: 'active' as const,
      },
    ];

    const insertedProducts: any[] = [];
    for (const prod of productData) {
      const [inserted] = await db.insert(products).values(prod).returning();
      insertedProducts.push(inserted);
      console.log(`  ✅ Created product: ${prod.title}`);
    }

    // 5. Create a scheduled stream
    console.log('🎥 Creating demo stream...');
    const [demoStream] = await db
      .insert(streams)
      .values({
        sellerId: DEMO_USER_ID,
        categoryId: insertedCategories[0].id,
        title: 'Live Sneaker Drop! Jordans, Yeezys & More',
        description:
          'Join us for exclusive sneaker auctions. Authentic pairs only!',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',
        status: 'scheduled',
        scheduledStart: new Date(Date.now() + 3600000), // 1 hour from now
        agoraChannelName: `stream_${DEMO_USER_ID.slice(0, 8)}_${Date.now()}`,
        streamKey: `sk_${Math.random().toString(36).substring(7)}`,
      })
      .returning();

    console.log(`  ✅ Created stream: ${demoStream.title}`);

    // 6. Add products to stream
    console.log('🔗 Adding products to stream...');
    for (let i = 0; i < 2; i++) {
      await db.insert(streamProducts).values({
        streamId: demoStream.id,
        productId: insertedProducts[i].id,
        displayOrder: i + 1,
        status: 'upcoming',
      });
    }

    // 7. Create a pending auction (pre-bidding)
    console.log('⏰ Creating auction...');
    const auctionEndTime = new Date(Date.now() + 86400000); // 24 hours from now

    await db.insert(auctions).values({
      productId: insertedProducts[4].id, // Charizard card
      startingBid: '500.00',
      currentBid: '500.00',
      reservePrice: '1000.00',
      minimumBidIncrement: '25.00',
      status: 'active',
      startedAt: new Date(),
      endsAt: auctionEndTime,
    });

    console.log('  ✅ Created active auction for Pokemon Charizard');

    // 8. Create a sample completed order (for sales history)
    console.log('📋 Creating sample order...');
    const orderNumber = `ORD-${Date.now()}`;
    await db.insert(orders).values({
      orderNumber,
      buyerId: DEMO_USER_ID,
      sellerId: DEMO_USER_ID,
      productId: insertedProducts[0].id,
      orderType: 'buy_now',
      itemPrice: '350.00',
      shippingCost: '10.00',
      tax: '28.00',
      platformFee: '35.00',
      total: '423.00',
      status: 'delivered',
      shippingAddress: {
        name: 'Demo User',
        line1: '123 Demo Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'USA',
      },
    });

    console.log('\n✨ Demo data seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  - User ${DEMO_USER_ID} is now a seller`);
    console.log(`  - Created ${insertedProducts.length} products`);
    console.log(`  - Created 1 scheduled stream with 2 products`);
    console.log(`  - Created 1 active auction`);
    console.log(`  - Created 1 sample order`);
    console.log('\nYou can now test the seller and buyer flows!');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }

  process.exit(0);
}

seedDemoData();
