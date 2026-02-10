import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Categories
    console.log('📁 Seeding categories...');
    const categories = [
      {
        name: 'Pokemon Cards',
        slug: 'pokemon-cards',
        iconUrl:
          'https://images.unsplash.com/photo-1613770282977-951316191452?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Sports Cards',
        slug: 'sports-cards',
        iconUrl:
          'https://images.unsplash.com/photo-1510614053703-0c464bdf697c?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Video Games',
        slug: 'video-games',
        iconUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        iconUrl:
          'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Fashion & Sneakers',
        slug: 'fashion-sneakers',
        iconUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200',
      },
    ];

    for (const cat of categories) {
      await db
        .insert(schema.categories)
        .values(cat)
        .onConflictDoUpdate({
          target: schema.categories.slug,
          set: { name: cat.name, iconUrl: cat.iconUrl },
        });
    }

    const pokemonCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, 'pokemon-cards'),
    });
    const electronicsCategory = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, 'electronics'),
    });

    // 2. Update Primary User
    console.log('👤 Updating primary user profile...');
    const primaryUserId = 'b3ea664f-f358-4e7a-a860-fa5801e1b76e';

    await db
      .insert(schema.profiles)
      .values({
        id: primaryUserId,
        username: 'aimalshah',
        fullName: 'Aimal Shah',
        bio: 'Expert collector of rare Pokemon cards and tech enthusiast.',
        isSeller: true,
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          isSeller: true,
          bio: 'Expert collector of rare Pokemon cards and tech enthusiast.',
          fullName: 'Aimal Shah',
        },
      });

    await db
      .insert(schema.sellerDetails)
      .values({
        userId: primaryUserId,
        trustScore: 98,
        rating: '4.9',
        totalSales: '150',
        identityVerified: true,
      })
      .onConflictDoNothing();

    // 3. Create Mock Users
    console.log('👥 Seeding mock users...');
    const mockUsers = [
      {
        id: uuidv4(),
        username: 'collector_pro',
        fullName: 'John Doe',
        bio: 'Living for the hunt.',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: uuidv4(),
        username: 'sneakerhead99',
        fullName: 'Jane Smith',
        bio: 'Exclusive drops only.',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
      },
    ];

    for (const user of mockUsers) {
      // Note: These might fail if auth.users doesn't have them, but in some setups profiles is separate.
      // If profiles.id references auth.users, this WILL fail without auth.users records.
      // Assuming profiles can exist independently or constraints are relaxed for dev.
      try {
        await db.insert(schema.profiles).values(user).onConflictDoNothing();
      } catch (e) {
        console.warn(
          `Could not seed profile ${user.username}, likely FK constraint: ${e.message}`,
        );
      }
    }

    const bidder1 = await db.query.profiles.findFirst({
      where: eq(schema.profiles.username, 'collector_pro'),
    });

    // 4. Create Products
    console.log('📦 Seeding products...');
    const products = [
      {
        sellerId: primaryUserId,
        title: 'PSA 10 Base Set Charizard',
        description:
          'A beautiful holographic Charizard from the original 1999 Base Set. Grade 10 Mint condition.',
        categoryId: pokemonCategory?.id,
        condition: 'new' as const,
        startingBid: '500.00',
        buyNowPrice: '2500.00',
        images: [
          'https://images.unsplash.com/photo-1627672360124-4ed092f3e116?auto=format&fit=crop&q=80&w=800',
        ],
        status: 'active' as const,
      },
      {
        sellerId: primaryUserId,
        title: 'iPhone 15 Pro Max 256GB',
        description: 'Brand new, sealed in box. Natural Titanium color.',
        categoryId: electronicsCategory?.id,
        condition: 'new' as const,
        startingBid: '900.00',
        buyNowPrice: '1199.00',
        images: [
          'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800',
        ],
        status: 'active' as const,
      },
    ];

    const insertedProducts = await db
      .insert(schema.products)
      .values(products)
      .returning();

    // 5. Create Streams
    console.log('🎥 Seeding streams...');
    const streams = [
      {
        sellerId: primaryUserId,
        title: 'Ultimate Pokemon Card Opening!',
        description:
          'Opening 5 vintage packs today. Join for a chance to win a Charizard!',
        categoryId: pokemonCategory?.id,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1613770282977-951316191452?auto=format&fit=crop&q=80&w=800',
        status: 'live' as const,
        actualStart: new Date(),
        viewerCount: 156,
      },
      {
        sellerId: primaryUserId,
        title: 'Tech Deals & Apple Giveaways',
        description: 'Best electronics deals of the week.',
        categoryId: electronicsCategory?.id,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&q=80&w=800',
        status: 'scheduled' as const,
        scheduledStart: new Date(Date.now() + 86400000), // tomorrow
      },
    ];

    const insertedStreams = await db
      .insert(schema.streams)
      .values(streams)
      .returning();

    // 6. Link Products to Streams & Auctions
    console.log('🔨 Setting up auctions...');
    for (const product of insertedProducts) {
      if (product.title.includes('Charizard')) {
        const stream = insertedStreams.find((s) => s.title.includes('Pokemon'));
        if (stream) {
          await db.insert(schema.streamProducts).values({
            streamId: stream.id,
            productId: product.id,
            status: 'active',
          });

          const [auction] = await db
            .insert(schema.auctions)
            .values({
              productId: product.id,
              streamId: stream.id,
              startingBid: product.startingBid!,
              currentBid: '550.00',
              currentBidderId: bidder1?.id || null,
              bidCount: 3,
              status: 'active',
              endsAt: new Date(Date.now() + 3600000), // 1 hour from now
            })
            .returning();

          if (bidder1) {
            await db.insert(schema.bids).values([
              { auctionId: auction.id, bidderId: bidder1.id, amount: '510.00' },
              {
                auctionId: auction.id,
                bidderId: primaryUserId,
                amount: '530.00',
              },
              {
                auctionId: auction.id,
                bidderId: bidder1.id,
                amount: '550.00',
                isWinning: true,
              },
            ]);
          }
        }
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
