import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seedMockData() {
  console.log('🚀 Starting mock data generation...');

  try {
    const primaryUserId = 'b3ea664f-f358-4e7a-a860-fa5801e1b76e';
    const bidder1Id = (
      await db.query.profiles.findFirst({
        where: eq(schema.profiles.username, 'collector_pro'),
      })
    )?.id;
    const bidder2Id = (
      await db.query.profiles.findFirst({
        where: eq(schema.profiles.username, 'sneakerhead99'),
      })
    )?.id;

    const categories = await db.query.categories.findMany();
    const getCat = (slug: string) =>
      categories.find((c) => c.slug === slug)?.id;

    const mockProducts = [
      // Pokemon Cards
      {
        title: 'PSA 9 Mewtwo Holo 1999',
        description: 'Rare Mewtwo holographic card.',
        cat: 'pokemon-cards',
        price: '450.00',
        image:
          'https://images.unsplash.com/photo-1613770282977-951316191452?q=80&w=800',
      },
      {
        title: 'Umbreon VMAX Alternate Art',
        description: 'Evolving Skies chase card.',
        cat: 'pokemon-cards',
        price: '600.00',
        image:
          'https://images.unsplash.com/photo-1636114673156-052a9333ec5c?q=80&w=800',
      },
      {
        title: 'Lugia Legend Bottom Half',
        description: 'Classic HGSS Legend card.',
        cat: 'pokemon-cards',
        price: '120.00',
        image:
          'https://images.unsplash.com/photo-1613770282977-951316191452?q=80&w=800',
      },

      // Video Games
      {
        title: 'GameBoy Color Atomic Purple',
        description: 'Classic handheld in good condition.',
        cat: 'video-games',
        price: '85.00',
        image:
          'https://images.unsplash.com/photo-1591333139245-2b411c9d1bd7?q=80&w=800',
      },
      {
        title: 'N64 GoldenEye 007 Boxed',
        description: 'Complete in box legendary shooter.',
        cat: 'video-games',
        price: '150.00',
        image:
          'https://images.unsplash.com/photo-1527187162622-535b785f65f5?q=80&w=800',
      },
      {
        title: 'Zelda Breath of the Wild Master Edition',
        description: 'Extremely rare collector edition.',
        cat: 'video-games',
        price: '800.00',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
      },

      // Electronics
      {
        title: 'AirPods Max Space Gray',
        description: 'Premium over-ear headphones.',
        cat: 'electronics',
        price: '400.00',
        image:
          'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=800',
      },
      {
        title: 'Sony PS5 Disk Edition',
        description: 'Slightly used console.',
        cat: 'electronics',
        price: '450.00',
        image:
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800',
      },
      {
        title: 'Mechanical Keyboard Custom',
        description: 'Gasket mount, lubed switches.',
        cat: 'electronics',
        price: '250.00',
        image:
          'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800',
      },

      // Fashion & Sneakers
      {
        title: 'Jordan 1 Retro High Lost and Found',
        description: 'Iconic Chicago colorway.',
        cat: 'fashion-sneakers',
        price: '450.00',
        image:
          'https://images.unsplash.com/photo-1582587319032-19e481134023?q=80&w=800',
      },
      {
        title: 'Yeezy Boost 350 V2 Zebra',
        description: 'Classic Yeezy silhouette.',
        cat: 'fashion-sneakers',
        price: '280.00',
        image:
          'https://images.unsplash.com/photo-1584739090141-924f0c76255a?q=80&w=800',
      },
      {
        title: 'Supreme Box Logo Hoodie',
        description: 'Black on black, size Medium.',
        cat: 'fashion-sneakers',
        price: '350.00',
        image:
          'https://images.unsplash.com/photo-1556316301-d83e5c3e447b?q=80&w=800',
      },

      // Sports Cards
      {
        title: 'Mike Trout Rookie Card PSA 8',
        description: 'The GOAT of modern baseball.',
        cat: 'sports-cards',
        price: '1200.00',
        image:
          'https://images.unsplash.com/photo-1510614053703-0c464bdf697c?q=80&w=800',
      },
      {
        title: 'LeBron James 2003 Upper Deck',
        description: 'Iconic rookie year card.',
        cat: 'sports-cards',
        price: '500.00',
        image:
          'https://images.unsplash.com/photo-1510614053703-0c464bdf697c?q=80&w=800',
      },

      // More Pokemon
      {
        title: 'Rayquaza Gold Star',
        description: 'Ex Deoxys rare find.',
        cat: 'pokemon-cards',
        price: '1500.00',
        image:
          'https://images.unsplash.com/photo-1613770282977-951316191452?q=80&w=800',
      },
      {
        title: 'Pikachu Illustrator (Replica)',
        description: 'High quality showcase piece.',
        cat: 'pokemon-cards',
        price: '50.00',
        image:
          'https://images.unsplash.com/photo-1636114673156-052a9333ec5c?q=80&w=800',
      },

      // More Tech
      {
        title: 'Analog Pocket Handheld',
        description: 'Plays all classic cartridges.',
        cat: 'electronics',
        price: '300.00',
        image:
          'https://images.unsplash.com/photo-1591333139245-2b411c9d1bd7?q=80&w=800',
      },
      {
        title: 'Steam Deck 512GB',
        description: 'Great condition, LCD model.',
        cat: 'electronics',
        price: '350.00',
        image:
          'https://images.unsplash.com/photo-1647416342674-3200155b112c?q=80&w=800',
      },

      // More Games
      {
        title: 'Pokemon Red Factory Sealed',
        description: 'Museum grade condition.',
        cat: 'video-games',
        price: '5000.00',
        image:
          'https://images.unsplash.com/photo-1527187162622-535b785f65f5?q=80&w=800',
      },
      {
        title: 'GameCube Controller Smash Edition',
        description: 'Mint in box.',
        cat: 'video-games',
        price: '75.00',
        image:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800',
      },
    ];

    console.log(`📦 Inserting ${mockProducts.length} mockup products...`);

    const productsToInsert = mockProducts.map((p) => ({
      sellerId: primaryUserId,
      title: p.title,
      description: p.description,
      categoryId: getCat(p.cat) || categories[0].id,
      condition: 'new' as const,
      startingBid: p.price,
      buyNowPrice: (parseFloat(p.price) * 1.5).toFixed(2),
      images: [p.image],
      status: 'active' as const,
    }));

    const insertedProducts = await db
      .insert(schema.products)
      .values(productsToInsert)
      .returning();

    // Create a few streams to hold these products
    console.log('🎥 Creating mockup streams...');
    const streamData = [
      {
        sellerId: primaryUserId,
        title: 'Sunday Morning Pokemon Hunt!',
        description: 'Searching for rare holos.',
        categoryId: getCat('pokemon-cards'),
        thumbnailUrl:
          'https://images.unsplash.com/photo-1613770282977-951316191452?q=80&w=800',
        status: 'live' as const,
        viewerCount: 84,
      },
      {
        sellerId: primaryUserId,
        title: 'Sneaker Drop & Tech Talk',
        description: 'Showing off some new heat.',
        categoryId: getCat('fashion-sneakers'),
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
        status: 'scheduled' as const,
        scheduledStart: new Date(Date.now() + 3600000 * 2),
      },
    ];

    const insertedStreams = await db
      .insert(schema.streams)
      .values(streamData)
      .returning();

    // Link products to streams and create auctions
    console.log('🔨 Setting up stream products and auctions...');
    for (let i = 0; i < insertedProducts.length; i++) {
      const product = insertedProducts[i];
      const stream = insertedStreams[i % 2]; // Alternate between the two streams

      await db.insert(schema.streamProducts).values({
        streamId: stream.id,
        productId: product.id,
        status: i % 5 === 0 ? 'active' : 'upcoming', // Make some active
      });

      if (i % 5 === 0) {
        // Create an active auction for active products
        await db.insert(schema.auctions).values({
          productId: product.id,
          streamId: stream.id,
          startingBid: product.startingBid!,
          currentBid: (parseFloat(product.startingBid!) + 20).toFixed(2),
          currentBidderId: Math.random() > 0.5 ? bidder1Id : bidder2Id,
          status: 'active',
          endsAt: new Date(Date.now() + 600000), // 10 mins left
        });
      }
    }

    console.log('✅ Mock data generation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Mock data generation failed:', error);
    process.exit(1);
  }
}

seedMockData();
