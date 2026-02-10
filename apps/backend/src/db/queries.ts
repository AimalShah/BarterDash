import { db } from '.';
import {
  eq,
  and,
  or,
  desc,
  asc,
  sql,
  gt,
  lt,
  gte,
  lte,
  count,
  sum,
  avg,
  inArray,
  isNull,
  notInArray,
} from 'drizzle-orm';
import {
  profiles,
  sellerDetails,
  sellerApplications,
  verificationDocuments,
  categories,
  streams,
  products,
  streamProducts,
  auctions,
  bids,
  orders,
  cartItems,
  chatMessages,
  streamBans,
  notifications,
  reviews,
  follows,
  reports,
  payouts,
  pushTokens,
  savedStreams,
  userInterests,
} from './schema';

// ============================================
// PROFILE QUERIES
// ============================================

export const profileQueries = {
  // Get profile by ID
  getById: async (userId: string) => {
    return await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      with: {
        sellerDetails: true,
      },
    });
  },

  // Get profile by username
  getByUsername: async (username: string) => {
    return await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
      with: {
        sellerDetails: true,
      },
    });
  },

  // Create new profile
  create: async (data: typeof profiles.$inferInsert) => {
    return await db.insert(profiles).values(data).returning();
  },

  // Update profile
  update: async (
    userId: string,
    data: Partial<typeof profiles.$inferInsert>,
  ) => {
    return await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();
  },

  // Get profile with stats
  getWithStats: async (userId: string) => {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      with: {
        sellerDetails: true,
      },
    });

    const [followerCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      ...profile,
      followerCount: followerCount.count,
      followingCount: followingCount.count,
    };
  },

  // Search profiles
  search: async (searchTerm: string, limit = 20) => {
    return await db.query.profiles.findMany({
      where: sql`${profiles.username} ILIKE ${`%${searchTerm}%`} OR ${profiles.fullName} ILIKE ${`%${searchTerm}%`}`,
      limit,
    });
  },

  // Get sellers
  getSellers: async (limit = 50, offset = 0) => {
    return await db.query.profiles.findMany({
      where: eq(profiles.isSeller, true),
      with: {
        sellerDetails: true,
      },
      limit,
      offset,
    });
  },

  // Get top sellers by revenue
  getTopSellers: async (limit = 10) => {
    return await db.query.profiles.findMany({
      where: eq(profiles.isSeller, true),
      with: {
        sellerDetails: true,
      },
      orderBy: (profiles, { desc }) => [
        desc(
          sql`(SELECT total_revenue FROM seller_details WHERE user_id = ${profiles.id})`,
        ),
      ],
      limit,
    });
  },
};

// ============================================
// SELLER APPLICATION QUERIES
// ============================================

export const sellerApplicationQueries = {
  // Create application
  create: async (data: typeof sellerApplications.$inferInsert) => {
    return await db.insert(sellerApplications).values(data).returning();
  },

  // Get application by user ID
  getByUserId: async (userId: string) => {
    return await db.query.sellerApplications.findFirst({
      where: eq(sellerApplications.userId, userId),
      with: {
        documents: true,
      },
    });
  },

  // Update application
  update: async (
    applicationId: string,
    data: Partial<typeof sellerApplications.$inferInsert>,
  ) => {
    return await db
      .update(sellerApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sellerApplications.id, applicationId))
      .returning();
  },

  // Submit application
  submit: async (applicationId: string) => {
    return await db
      .update(sellerApplications)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sellerApplications.id, applicationId))
      .returning();
  },

  // Get pending applications (Admin)
  getPending: async (limit = 20, offset = 0) => {
    return await db.query.sellerApplications.findMany({
      where: inArray(sellerApplications.status, ['submitted', 'in_review']),
      with: {
        user: true,
        documents: true,
      },
      orderBy: [asc(sellerApplications.submittedAt)],
      limit,
      offset,
    });
  },

  // Approve application
  approve: async (applicationId: string, reviewerId: string) => {
    return await db.transaction(async (tx) => {
      // Update application
      await tx
        .update(sellerApplications)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewerId,
          updatedAt: new Date(),
        })
        .where(eq(sellerApplications.id, applicationId));

      // Get user ID
      const application = await tx.query.sellerApplications.findFirst({
        where: eq(sellerApplications.id, applicationId),
      });

      // Update profile to seller
      await tx
        .update(profiles)
        .set({ isSeller: true })
        .where(eq(profiles.id, application!.userId));

      // Create seller details
      await tx.insert(sellerDetails).values({
        userId: application!.userId,
      });

      return application;
    });
  },

  // Reject application
  reject: async (
    applicationId: string,
    reviewerId: string,
    rejectionReason: string,
  ) => {
    return await db
      .update(sellerApplications)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewerId,
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(sellerApplications.id, applicationId))
      .returning();
  },
};

// ============================================
// SELLER DETAILS QUERIES
// ============================================

export const sellerDetailsQueries = {
  // Get by user ID
  getByUserId: async (userId: string) => {
    return await db.query.sellerDetails.findFirst({
      where: eq(sellerDetails.userId, userId),
    });
  },

  // Update seller details
  update: async (
    userId: string,
    data: Partial<typeof sellerDetails.$inferInsert>,
  ) => {
    return await db
      .update(sellerDetails)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sellerDetails.userId, userId))
      .returning();
  },

  // Update trust score
  updateTrustScore: async (userId: string, score: number) => {
    return await db
      .update(sellerDetails)
      .set({ trustScore: score, updatedAt: new Date() })
      .where(eq(sellerDetails.userId, userId))
      .returning();
  },

  // Update sales stats
  updateSalesStats: async (userId: string, saleAmount: number) => {
    return await db
      .update(sellerDetails)
      .set({
        totalSales: sql`${sellerDetails.totalSales} + 1`,
        totalRevenue: sql`${sellerDetails.totalRevenue} + ${saleAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(sellerDetails.userId, userId))
      .returning();
  },

  // Update rating
  updateRating: async (userId: string, newRating: number) => {
    return await db
      .update(sellerDetails)
      .set({
        rating: sql`((${sellerDetails.rating} * ${sellerDetails.totalReviews}) + ${newRating}) / (${sellerDetails.totalReviews} + 1)`,
        totalReviews: sql`${sellerDetails.totalReviews} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sellerDetails.userId, userId))
      .returning();
  },
};

// ============================================
// CATEGORY QUERIES
// ============================================

export const categoryQueries = {
  // Get all categories
  getAll: async () => {
    return await db.query.categories.findMany({
      with: {
        subcategories: true,
      },
    });
  },

  // Get top-level categories
  getTopLevel: async () => {
    return await db.query.categories.findMany({
      where: isNull(categories.parentId),
      with: {
        subcategories: true,
      },
    });
  },

  // Get by ID
  getById: async (categoryId: string) => {
    return await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        subcategories: true,
        parent: true,
      },
    });
  },

  // Get by slug
  getBySlug: async (slug: string) => {
    return await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with: {
        subcategories: true,
      },
    });
  },

  // Create category
  create: async (data: typeof categories.$inferInsert) => {
    return await db.insert(categories).values(data).returning();
  },

  // Get subcategories
  getSubcategories: async (parentId: string) => {
    return await db.query.categories.findMany({
      where: eq(categories.parentId, parentId),
    });
  },
};

// ============================================
// STREAM QUERIES
// ============================================

export const streamQueries = {
  // Create stream
  create: async (data: typeof streams.$inferInsert) => {
    return await db.insert(streams).values(data).returning();
  },

  // Get by ID
  getById: async (streamId: string) => {
    return await db.query.streams.findFirst({
      where: eq(streams.id, streamId),
      with: {
        seller: {
          with: {
            sellerDetails: true,
          },
        },
        category: true,
        products: {
          with: {
            product: true,
          },
        },
      },
    });
  },

  // Update stream
  update: async (
    streamId: string,
    data: Partial<typeof streams.$inferInsert>,
  ) => {
    return await db
      .update(streams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(streams.id, streamId))
      .returning();
  },

  // Get all streams with optional status, category, search and pagination
  getAll: async (
    status?: string,
    categoryId?: string,
    search?: string,
    limit = 20,
    offset = 0,
  ) => {
    const conditions = [];
    if (status) {
      conditions.push(eq(streams.status, status as any));
    }
    if (categoryId) {
      conditions.push(eq(streams.categoryId, categoryId));
    }
    if (search) {
      conditions.push(
        or(
          sql`${streams.title} ILIKE ${`%${search}%`}`,
          sql`${streams.description} ILIKE ${`%${search}%`}`,
        ),
      );
    }

    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db.query.streams.findMany({
      where: whereCondition,
      with: {
        seller: true,
        category: true,
      },
      orderBy: [desc(streams.createdAt)],
      limit,
      offset,
    });

    const [totalCountResult] = await db
      .select({ count: count() })
      .from(streams)
      .where(whereCondition);

    const totalCount = Number(totalCountResult.count);

    return {
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  // Get live streams
  getLive: async (limit = 20, offset = 0) => {
    return await db.query.streams.findMany({
      where: eq(streams.status, 'live'),
      with: {
        seller: true,
        category: true,
      },
      orderBy: [desc(streams.viewerCount)],
      limit,
      offset,
    });
  },

  // Get scheduled streams
  getScheduled: async (limit = 20, offset = 0) => {
    return await db.query.streams.findMany({
      where: eq(streams.status, 'scheduled'),
      with: {
        seller: true,
        category: true,
      },
      orderBy: [asc(streams.scheduledStart)],
      limit,
      offset,
    });
  },

  // Get streams by seller
  getBySeller: async (sellerId: string, limit = 20, offset = 0) => {
    return await db.query.streams.findMany({
      where: eq(streams.sellerId, sellerId),
      with: {
        category: true,
      },
      orderBy: [desc(streams.createdAt)],
      limit,
      offset,
    });
  },

  // Get streams by category
  getByCategory: async (
    categoryId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) => {
    const whereCondition = status
      ? and(
          eq(streams.categoryId, categoryId),
          eq(streams.status, status as any),
        )
      : eq(streams.categoryId, categoryId);

    return await db.query.streams.findMany({
      where: whereCondition,
      with: {
        seller: true,
      },
      orderBy: [desc(streams.viewerCount)],
      limit,
      offset,
    });
  },

  // Start stream
  start: async (streamId: string) => {
    return await db
      .update(streams)
      .set({
        status: 'live',
        actualStart: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId))
      .returning();
  },

  // End stream
  end: async (streamId: string) => {
    return await db
      .update(streams)
      .set({
        status: 'ended',
        actualEnd: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId))
      .returning();
  },

  // Update viewer count
  updateViewerCount: async (streamId: string, count: number) => {
    return await db
      .update(streams)
      .set({
        viewerCount: count,
        peakViewers: sql`GREATEST(${streams.peakViewers}, ${count})`,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId))
      .returning();
  },

  // Update total sales
  updateTotalSales: async (streamId: string, saleAmount: number) => {
    return await db
      .update(streams)
      .set({
        totalSales: sql`${streams.totalSales} + ${saleAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(streams.id, streamId))
      .returning();
  },

  // Get upcoming streams from followed sellers
  getUpcomingFromFollowed: async (userId: string, limit = 20) => {
    return await db
      .select()
      .from(streams)
      .innerJoin(follows, eq(follows.followingId, streams.sellerId))
      .where(
        and(
          eq(follows.followerId, userId),
          eq(streams.status, 'scheduled'),
          gt(streams.scheduledStart, new Date()),
        ),
      )
      .orderBy(asc(streams.scheduledStart))
      .limit(limit);
  },

  // Search streams
  search: async (searchTerm: string, limit = 20) => {
    return await db.query.streams.findMany({
      where: sql`${streams.title} ILIKE ${`%${searchTerm}%`} OR ${streams.description} ILIKE ${`%${searchTerm}%`}`,
      with: {
        seller: true,
        category: true,
      },
      limit,
    });
  },
};

// ============================================
// PRODUCT QUERIES
// ============================================

export const productQueries = {
  // Create product
  create: async (data: typeof products.$inferInsert) => {
    return await db.insert(products).values(data).returning();
  },

  // Get by ID
  getById: async (productId: string) => {
    return await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        seller: {
          with: {
            sellerDetails: true,
          },
        },
        category: true,
      },
    });
  },

  // Update product
  update: async (
    productId: string,
    data: Partial<typeof products.$inferInsert>,
  ) => {
    return await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
  },

  // Get products by seller
  getBySeller: async (
    sellerId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) => {
    const whereCondition = status
      ? and(eq(products.sellerId, sellerId), eq(products.status, status as any))
      : eq(products.sellerId, sellerId);

    return await db.query.products.findMany({
      where: whereCondition,
      with: {
        category: true,
      },
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
    });
  },

  // Get active products
  getActive: async (limit = 50, offset = 0) => {
    return await db.query.products.findMany({
      where: eq(products.status, 'active'),
      with: {
        seller: true,
        category: true,
      },
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
    });
  },

  // Get products by category
  getByCategory: async (categoryId: string, limit = 20, offset = 0) => {
    return await db.query.products.findMany({
      where: and(
        eq(products.categoryId, categoryId),
        eq(products.status, 'active'),
      ),
      with: {
        seller: true,
      },
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
    });
  },

  // Search products
  search: async (searchTerm: string, limit = 20) => {
    return await db.query.products.findMany({
      where: and(
        sql`${products.title} ILIKE ${`%${searchTerm}%`} OR ${products.description} ILIKE ${`%${searchTerm}%`}`,
        eq(products.status, 'active'),
      ),
      with: {
        seller: true,
        category: true,
      },
      limit,
    });
  },

  // Mark as sold
  markAsSold: async (productId: string) => {
    return await db
      .update(products)
      .set({
        status: 'sold',
        soldQuantity: sql`${products.soldQuantity} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();
  },

  // Get featured products (e.g., highest bids, popular)
  getFeatured: async (limit = 10) => {
    return await db.query.products.findMany({
      where: eq(products.status, 'active'),
      with: {
        seller: true,
        category: true,
      },
      orderBy: [desc(products.createdAt)],
      limit,
    });
  },
};

// ============================================
// STREAM PRODUCT QUERIES
// ============================================

export const streamProductQueries = {
  // Add product to stream
  add: async (data: typeof streamProducts.$inferInsert) => {
    return await db.insert(streamProducts).values(data).returning();
  },

  // Get products in stream
  getByStream: async (streamId: string) => {
    return await db.query.streamProducts.findMany({
      where: eq(streamProducts.streamId, streamId),
      with: {
        product: {
          with: {
            category: true,
          },
        },
      },
      orderBy: [asc(streamProducts.displayOrder)],
    });
  },

  // Update status
  updateStatus: async (streamProductId: string, status: string) => {
    return await db
      .update(streamProducts)
      .set({ status: status as any })
      .where(eq(streamProducts.id, streamProductId))
      .returning();
  },

  // Mark as active
  markAsActive: async (streamProductId: string) => {
    return await db
      .update(streamProducts)
      .set({
        status: 'active',
        startedAt: new Date(),
      })
      .where(eq(streamProducts.id, streamProductId))
      .returning();
  },

  // Mark as sold
  markAsSold: async (streamProductId: string) => {
    return await db
      .update(streamProducts)
      .set({
        status: 'sold',
        endedAt: new Date(),
      })
      .where(eq(streamProducts.id, streamProductId))
      .returning();
  },

  // Remove from stream
  remove: async (streamProductId: string) => {
    return await db
      .delete(streamProducts)
      .where(eq(streamProducts.id, streamProductId));
  },
};

// ============================================
// AUCTION QUERIES
// ============================================

export const auctionQueries = {
  // Create auction
  create: async (data: typeof auctions.$inferInsert) => {
    return await db.insert(auctions).values(data).returning();
  },

  // Get by ID
  getById: async (auctionId: string) => {
    return await db.query.auctions.findFirst({
      where: eq(auctions.id, auctionId),
      with: {
        product: {
          with: {
            seller: true,
          },
        },
        currentBidder: true,
        bids: {
          with: {
            bidder: true,
          },
          orderBy: [desc(bids.createdAt)],
          limit: 10,
        },
      },
    });
  },

  // Get by product ID
  getByProduct: async (productId: string) => {
    return await db.query.auctions.findFirst({
      where: eq(auctions.productId, productId),
      with: {
        currentBidder: true,
      },
    });
  },

  // Get active auctions
  getActive: async (limit = 20, offset = 0) => {
    return await db.query.auctions.findMany({
      where: eq(auctions.status, 'active'),
      with: {
        product: {
          with: {
            seller: true,
            category: true,
          },
        },
        currentBidder: true,
      },
      orderBy: [asc(auctions.endsAt)],
      limit,
      offset,
    });
  },

  // Get auctions by stream
  getByStream: async (streamId: string) => {
    return await db.query.auctions.findMany({
      where: eq(auctions.streamId, streamId),
      with: {
        product: true,
        currentBidder: true,
      },
      orderBy: [desc(auctions.createdAt)],
    });
  },

  // Start auction
  start: async (auctionId: string) => {
    return await db
      .update(auctions)
      .set({
        status: 'active',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(auctions.id, auctionId))
      .returning();
  },

  // End auction
  end: async (auctionId: string) => {
    return await db
      .update(auctions)
      .set({
        status: 'ended',
        updatedAt: new Date(),
      })
      .where(eq(auctions.id, auctionId))
      .returning();
  },

  // Update current bid
  updateCurrentBid: async (
    auctionId: string,
    bidderId: string,
    amount: string,
  ) => {
    return await db
      .update(auctions)
      .set({
        currentBid: amount,
        currentBidderId: bidderId,
        bidCount: sql`${auctions.bidCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(auctions.id, auctionId))
      .returning();
  },

  // Get ending soon (within next hour)
  getEndingSoon: async (limit = 10) => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return await db.query.auctions.findMany({
      where: and(
        eq(auctions.status, 'active'),
        lt(auctions.endsAt, oneHourFromNow),
        gt(auctions.endsAt, new Date()),
      ),
      with: {
        product: {
          with: {
            seller: true,
          },
        },
        currentBidder: true,
      },
      orderBy: [asc(auctions.endsAt)],
      limit,
    });
  },
};

// ============================================
// BID QUERIES
// ============================================

export const bidQueries = {
  // Place bid
  create: async (data: typeof bids.$inferInsert) => {
    return await db.transaction(async (tx) => {
      // Create the bid
      const [newBid] = await tx.insert(bids).values(data).returning();

      // Mark previous winning bids as not winning
      await tx
        .update(bids)
        .set({ isWinning: false })
        .where(
          and(eq(bids.auctionId, data.auctionId), eq(bids.isWinning, true)),
        );

      // Mark this bid as winning
      await tx
        .update(bids)
        .set({ isWinning: true })
        .where(eq(bids.id, newBid.id));

      return newBid;
    });
  },

  // Get bids by auction
  getByAuction: async (auctionId: string, limit = 50) => {
    return await db.query.bids.findMany({
      where: eq(bids.auctionId, auctionId),
      with: {
        bidder: true,
      },
      orderBy: [desc(bids.createdAt)],
      limit,
    });
  },

  // Get bids by user
  getByUser: async (userId: string, limit = 50, offset = 0) => {
    return await db.query.bids.findMany({
      where: eq(bids.bidderId, userId),
      with: {
        auction: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(bids.createdAt)],
      limit,
      offset,
    });
  },

  // Get winning bids by user
  getWinningByUser: async (userId: string) => {
    return await db.query.bids.findMany({
      where: and(eq(bids.bidderId, userId), eq(bids.isWinning, true)),
      with: {
        auction: {
          with: {
            product: {
              with: {
                seller: true,
              },
            },
          },
        },
      },
      orderBy: [desc(bids.createdAt)],
    });
  },

  // Get highest bid for auction
  getHighestBid: async (auctionId: string) => {
    return await db.query.bids.findFirst({
      where: eq(bids.auctionId, auctionId),
      orderBy: [desc(bids.amount)],
    });
  },

  // Get bid count for auction
  getCount: async (auctionId: string) => {
    const [result] = await db
      .select({ count: count() })
      .from(bids)
      .where(eq(bids.auctionId, auctionId));
    return result.count;
  },
};

// ============================================
// ORDER QUERIES
// ============================================

export const orderQueries = {
  // Create order
  create: async (data: typeof orders.$inferInsert) => {
    return await db.insert(orders).values(data).returning();
  },

  // Get by ID
  getById: async (orderId: string) => {
    return await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        buyer: true,
        seller: {
          with: {
            sellerDetails: true,
          },
        },
        product: true,
        stream: true,
      },
    });
  },

  // Get by order number
  getByOrderNumber: async (orderNumber: string) => {
    return await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      with: {
        buyer: true,
        seller: true,
        product: true,
      },
    });
  },

  // Get orders by buyer
  getByBuyer: async (
    buyerId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) => {
    const whereCondition = status
      ? and(eq(orders.buyerId, buyerId), eq(orders.status, status as any))
      : eq(orders.buyerId, buyerId);

    return await db.query.orders.findMany({
      where: whereCondition,
      with: {
        seller: true,
        product: true,
        stream: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    });
  },

  // Get orders by seller
  getBySeller: async (
    sellerId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) => {
    const whereCondition = status
      ? and(eq(orders.sellerId, sellerId), eq(orders.status, status as any))
      : eq(orders.sellerId, sellerId);

    return await db.query.orders.findMany({
      where: whereCondition,
      with: {
        buyer: true,
        product: true,
        stream: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    });
  },

  // Update status
  updateStatus: async (orderId: string, status: string) => {
    return await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
  },

  // Mark as paid
  markAsPaid: async (orderId: string, paymentIntentId: string) => {
    return await db
      .update(orders)
      .set({
        status: 'paid',
        stripePaymentIntentId: paymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  },

  // Mark as shipped
  markAsShipped: async (
    orderId: string,
    trackingNumber: string,
    carrier: string,
  ) => {
    return await db
      .update(orders)
      .set({
        status: 'shipped',
        trackingNumber,
        carrier,
        shippedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  },

  // Mark as delivered
  markAsDelivered: async (orderId: string) => {
    return await db
      .update(orders)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  },

  // Cancel order
  cancel: async (orderId: string, reason: string) => {
    return await db
      .update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  },

  // Get order statistics for seller
  getSellerStats: async (
    sellerId: string,
    startDate?: Date,
    endDate?: Date,
  ) => {
    let whereCondition = eq(orders.sellerId, sellerId);

    if (startDate && endDate) {
      whereCondition = and(
        whereCondition,
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      );
    }

    const [stats] = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.total),
        averageOrderValue: avg(orders.total),
      })
      .from(orders)
      .where(whereCondition);

    return stats;
  },

  // Get pending orders requiring action
  getPendingActionBySeller: async (sellerId: string) => {
    return await db.query.orders.findMany({
      where: and(
        eq(orders.sellerId, sellerId),
        inArray(orders.status, ['paid', 'processing']),
      ),
      with: {
        buyer: true,
        product: true,
      },
      orderBy: [asc(orders.createdAt)],
    });
  },
};

// ============================================
// CART QUERIES
// ============================================

export const cartQueries = {
  // Add to cart
  add: async (data: typeof cartItems.$inferInsert) => {
    return await db
      .insert(cartItems)
      .values(data)
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + ${data.quantity}` },
      })
      .returning();
  },

  // Get cart by user
  getByUser: async (userId: string) => {
    return await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: {
          with: {
            seller: true,
            category: true,
          },
        },
      },
    });
  },

  // Update quantity
  updateQuantity: async (cartItemId: string, quantity: number) => {
    return await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemId))
      .returning();
  },

  // Remove item
  remove: async (cartItemId: string) => {
    return await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  },

  // Clear cart
  clearCart: async (userId: string) => {
    return await db.delete(cartItems).where(eq(cartItems.userId, userId));
  },

  // Get cart count
  getCount: async (userId: string) => {
    const [result] = await db
      .select({ count: count() })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    return result.count;
  },

  // Get cart total
  getTotal: async (userId: string) => {
    const items = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: true,
      },
    });

    return items.reduce((total, item) => {
      const price = parseFloat(item.product.buyNowPrice || '0');
      return total + price * item.quantity;
    }, 0);
  },
};

// ============================================
// CHAT MESSAGE QUERIES
// ============================================

export const chatMessageQueries = {
  // Send message
  create: async (data: typeof chatMessages.$inferInsert) => {
    return await db.insert(chatMessages).values(data).returning();
  },

  // Get messages by stream
  getByStream: async (streamId: string, limit = 100, beforeId?: string) => {
    let whereCondition = and(
      eq(chatMessages.streamId, streamId),
      eq(chatMessages.isDeleted, false),
    );

    if (beforeId) {
      whereCondition = and(
        whereCondition,
        lt(
          chatMessages.createdAt,
          sql`(SELECT created_at FROM chat_messages WHERE id = ${beforeId})`,
        ),
      );
    }

    return await db.query.chatMessages.findMany({
      where: whereCondition,
      with: {
        user: true,
      },
      orderBy: [desc(chatMessages.createdAt)],
      limit,
    });
  },

  // Delete message
  delete: async (messageId: string, deletedBy: string) => {
    return await db
      .update(chatMessages)
      .set({
        isDeleted: true,
        deletedBy,
      })
      .where(eq(chatMessages.id, messageId))
      .returning();
  },

  // Get recent messages
  getRecent: async (streamId: string, limit = 50) => {
    return await db.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.streamId, streamId),
        eq(chatMessages.isDeleted, false),
      ),
      with: {
        user: true,
      },
      orderBy: [desc(chatMessages.createdAt)],
      limit,
    });
  },
};

// ============================================
// FOLLOW QUERIES
// ============================================

export const followQueries = {
  // Follow user
  follow: async (followerId: string, followingId: string) => {
    return await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
  },

  // Unfollow user
  unfollow: async (followerId: string, followingId: string) => {
    return await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      );
  },

  // Check if following
  isFollowing: async (followerId: string, followingId: string) => {
    const result = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId),
      ),
    });
    return !!result;
  },

  // Get followers
  getFollowers: async (userId: string, limit = 50, offset = 0) => {
    return await db.query.follows.findMany({
      where: eq(follows.followingId, userId),
      with: {
        follower: true,
      },
      orderBy: [desc(follows.createdAt)],
      limit,
      offset,
    });
  },

  // Get following
  getFollowing: async (userId: string, limit = 50, offset = 0) => {
    return await db.query.follows.findMany({
      where: eq(follows.followerId, userId),
      with: {
        following: true,
      },
      orderBy: [desc(follows.createdAt)],
      limit,
      offset,
    });
  },

  // Get follower count
  getFollowerCount: async (userId: string) => {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return result.count;
  },

  // Get following count
  getFollowingCount: async (userId: string) => {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return result.count;
  },
};

// ============================================
// NOTIFICATION QUERIES
// ============================================

export const notificationQueries = {
  // Create notification
  create: async (data: typeof notifications.$inferInsert) => {
    return await db.insert(notifications).values(data).returning();
  },

  // Get by user
  getByUser: async (userId: string, limit = 50, offset = 0) => {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });
  },

  // Get unread by user
  getUnreadByUser: async (userId: string) => {
    return await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
      orderBy: [desc(notifications.createdAt)],
    });
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
  },

  // Mark all as read
  markAllAsRead: async (userId: string) => {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning();
  },

  // Get unread count
  getUnreadCount: async (userId: string) => {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
    return result.count;
  },

  // Delete notification
  delete: async (notificationId: string) => {
    return await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
  },

  // Bulk create notifications
  bulkCreate: async (
    notificationData: (typeof notifications.$inferInsert)[],
  ) => {
    return await db.insert(notifications).values(notificationData).returning();
  },
};

// ============================================
// REVIEW QUERIES
// ============================================

export const reviewQueries = {
  // Create review
  create: async (data: typeof reviews.$inferInsert) => {
    return await db.insert(reviews).values(data).returning();
  },

  // Get by ID
  getById: async (reviewId: string) => {
    return await db.query.reviews.findFirst({
      where: eq(reviews.id, reviewId),
      with: {
        reviewer: true,
        seller: true,
        product: true,
        order: true,
      },
    });
  },

  // Get reviews for seller
  getBySeller: async (sellerId: string, limit = 20, offset = 0) => {
    return await db.query.reviews.findMany({
      where: eq(reviews.sellerId, sellerId),
      with: {
        reviewer: true,
        product: true,
      },
      orderBy: [desc(reviews.createdAt)],
      limit,
      offset,
    });
  },

  // Get reviews by product
  getByProduct: async (productId: string, limit = 20, offset = 0) => {
    return await db.query.reviews.findMany({
      where: eq(reviews.productId, productId),
      with: {
        reviewer: true,
      },
      orderBy: [desc(reviews.createdAt)],
      limit,
      offset,
    });
  },

  // Get review by order
  getByOrder: async (orderId: string) => {
    return await db.query.reviews.findFirst({
      where: eq(reviews.orderId, orderId),
      with: {
        reviewer: true,
        seller: true,
      },
    });
  },

  // Update review
  update: async (
    reviewId: string,
    data: Partial<typeof reviews.$inferInsert>,
  ) => {
    return await db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();
  },

  // Add seller response
  addSellerResponse: async (reviewId: string, response: string) => {
    return await db
      .update(reviews)
      .set({
        sellerResponse: response,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();
  },

  // Get average rating for seller
  getAverageRating: async (sellerId: string) => {
    const [result] = await db
      .select({
        avgRating: avg(reviews.rating),
        totalReviews: count(),
      })
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId));
    return result;
  },

  // Get rating distribution for seller
  getRatingDistribution: async (sellerId: string) => {
    return await db
      .select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId))
      .groupBy(reviews.rating)
      .orderBy(desc(reviews.rating));
  },
};

// ============================================
// REPORT QUERIES
// ============================================

export const reportQueries = {
  // Create report
  create: async (data: typeof reports.$inferInsert) => {
    return await db.insert(reports).values(data).returning();
  },

  // Get by ID
  getById: async (reportId: string) => {
    return await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    });
  },

  // Get pending reports
  getPending: async (limit = 50, offset = 0) => {
    return await db.query.reports.findMany({
      where: eq(reports.status, 'pending'),
      orderBy: [asc(reports.createdAt)],
      limit,
      offset,
    });
  },

  // Get reports by type
  getByType: async (type: string, limit = 50, offset = 0) => {
    return await db.query.reports.findMany({
      where: eq(reports.reportType, type),
      orderBy: [desc(reports.createdAt)],
      limit,
      offset,
    });
  },

  // Update status
  updateStatus: async (
    reportId: string,
    status: string,
    reviewedBy?: string,
    reviewNotes?: string,
  ) => {
    return await db
      .update(reports)
      .set({
        status: status as any,
        reviewedBy,
        reviewNotes,
        resolvedAt:
          status === 'resolved' || status === 'dismissed'
            ? new Date()
            : undefined,
      })
      .where(eq(reports.id, reportId))
      .returning();
  },

  // Get reports for specific user
  getForUser: async (userId: string) => {
    return await db.query.reports.findMany({
      where: eq(reports.reportedUserId, userId),
      orderBy: [desc(reports.createdAt)],
    });
  },

  // Get reports for specific product
  getForProduct: async (productId: string) => {
    return await db.query.reports.findMany({
      where: eq(reports.reportedProductId, productId),
      orderBy: [desc(reports.createdAt)],
    });
  },

  // Get reports for specific stream
  getForStream: async (streamId: string) => {
    return await db.query.reports.findMany({
      where: eq(reports.reportedStreamId, streamId),
      orderBy: [desc(reports.createdAt)],
    });
  },
};

// ============================================
// PAYOUT QUERIES
// ============================================

export const payoutQueries = {
  // Create payout
  create: async (data: typeof payouts.$inferInsert) => {
    return await db.insert(payouts).values(data).returning();
  },

  // Get by ID
  getById: async (payoutId: string) => {
    return await db.query.payouts.findFirst({
      where: eq(payouts.id, payoutId),
    });
  },

  // Get by seller
  getBySeller: async (sellerId: string, limit = 20, offset = 0) => {
    return await db.query.payouts.findMany({
      where: eq(payouts.sellerId, sellerId),
      orderBy: [desc(payouts.createdAt)],
      limit,
      offset,
    });
  },

  // Get pending payouts
  getPending: async (limit = 50, offset = 0) => {
    return await db.query.payouts.findMany({
      where: eq(payouts.status, 'pending'),
      orderBy: [asc(payouts.createdAt)],
      limit,
      offset,
    });
  },

  // Update status
  updateStatus: async (
    payoutId: string,
    status: string,
    stripePayoutId?: string,
  ) => {
    return await db
      .update(payouts)
      .set({
        status: status as any,
        stripePayoutId,
        paidAt: status === 'paid' ? new Date() : undefined,
      })
      .where(eq(payouts.id, payoutId))
      .returning();
  },

  // Mark as failed
  markAsFailed: async (payoutId: string, failureReason: string) => {
    return await db
      .update(payouts)
      .set({
        status: 'failed',
        failureReason,
      })
      .where(eq(payouts.id, payoutId))
      .returning();
  },

  // Get total payouts for seller
  getTotalBySeller: async (sellerId: string) => {
    const [result] = await db
      .select({
        total: sum(payouts.amount),
      })
      .from(payouts)
      .where(and(eq(payouts.sellerId, sellerId), eq(payouts.status, 'paid')));
    return result.total || 0;
  },
};

// ============================================
// SAVED STREAM QUERIES
// ============================================

export const savedStreamQueries = {
  // Save stream
  save: async (userId: string, streamId: string) => {
    return await db
      .insert(savedStreams)
      .values({ userId, streamId })
      .returning();
  },

  // Unsave stream
  unsave: async (userId: string, streamId: string) => {
    return await db
      .delete(savedStreams)
      .where(
        and(
          eq(savedStreams.userId, userId),
          eq(savedStreams.streamId, streamId),
        ),
      );
  },

  // Check if saved
  isSaved: async (userId: string, streamId: string) => {
    const result = await db.query.savedStreams.findFirst({
      where: and(
        eq(savedStreams.userId, userId),
        eq(savedStreams.streamId, streamId),
      ),
    });
    return !!result;
  },

  // Get saved streams
  getSavedByUser: async (userId: string, limit = 50, offset = 0) => {
    return await db
      .select()
      .from(savedStreams)
      .innerJoin(streams, eq(savedStreams.streamId, streams.id))
      .where(eq(savedStreams.userId, userId))
      .orderBy(desc(savedStreams.createdAt))
      .limit(limit)
      .offset(offset);
  },
};

// ============================================
// USER INTEREST QUERIES
// ============================================

export const userInterestQueries = {
  // Add interest
  add: async (userId: string, categoryId: string) => {
    return await db
      .insert(userInterests)
      .values({ userId, categoryId })
      .returning();
  },

  // Remove interest
  remove: async (userId: string, categoryId: string) => {
    return await db
      .delete(userInterests)
      .where(
        and(
          eq(userInterests.userId, userId),
          eq(userInterests.categoryId, categoryId),
        ),
      );
  },

  // Get user interests
  getByUser: async (userId: string) => {
    return await db
      .select()
      .from(userInterests)
      .innerJoin(categories, eq(userInterests.categoryId, categories.id))
      .where(eq(userInterests.userId, userId));
  },

  // Set interests (replace all)
  setInterests: async (userId: string, categoryIds: string[]) => {
    return await db.transaction(async (tx) => {
      // Remove existing interests
      await tx.delete(userInterests).where(eq(userInterests.userId, userId));

      // Add new interests
      if (categoryIds.length > 0) {
        await tx
          .insert(userInterests)
          .values(categoryIds.map((categoryId) => ({ userId, categoryId })));
      }
    });
  },
};

// ============================================
// PUSH TOKEN QUERIES
// ============================================

export const pushTokenQueries = {
  // Register token
  register: async (data: typeof pushTokens.$inferInsert) => {
    return await db
      .insert(pushTokens)
      .values(data)
      .onConflictDoUpdate({
        target: [pushTokens.userId, pushTokens.token],
        set: {
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();
  },

  // Deactivate token
  deactivate: async (userId: string, token: string) => {
    return await db
      .update(pushTokens)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
      .returning();
  },

  // Get active tokens for user
  getActiveByUser: async (userId: string) => {
    return await db.query.pushTokens.findMany({
      where: and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)),
    });
  },

  // Delete token
  delete: async (userId: string, token: string) => {
    return await db
      .delete(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
  },
};

// ============================================
// STREAM BAN QUERIES
// ============================================

export const streamBanQueries = {
  // Ban user from stream
  ban: async (data: typeof streamBans.$inferInsert) => {
    return await db.insert(streamBans).values(data).returning();
  },

  // Unban user from stream
  unban: async (streamId: string, userId: string) => {
    return await db
      .delete(streamBans)
      .where(
        and(eq(streamBans.streamId, streamId), eq(streamBans.userId, userId)),
      );
  },

  // Check if banned
  isBanned: async (streamId: string, userId: string) => {
    const ban = await db.query.streamBans.findFirst({
      where: and(
        eq(streamBans.streamId, streamId),
        eq(streamBans.userId, userId),
      ),
    });

    if (!ban) return false;
    if (ban.isPermanent) return true;
    if (ban.expiresAt && ban.expiresAt > new Date()) return true;

    return false;
  },

  // Get bans for stream
  getByStream: async (streamId: string) => {
    return await db.query.streamBans.findMany({
      where: eq(streamBans.streamId, streamId),
      with: {
        user: true,
        bannedBy: true,
      },
      orderBy: [desc(streamBans.createdAt)],
    });
  },
};

// ============================================
// ANALYTICS & DASHBOARD QUERIES
// ============================================

export const analyticsQueries = {
  // Get seller dashboard stats
  getSellerDashboard: async (
    sellerId: string,
    startDate?: Date,
    endDate?: Date,
  ) => {
    let dateCondition = eq(orders.sellerId, sellerId);

    if (startDate && endDate) {
      dateCondition = and(
        dateCondition,
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      );
    }

    const [orderStats] = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.total),
        averageOrderValue: avg(orders.total),
      })
      .from(orders)
      .where(and(dateCondition, eq(orders.status, 'delivered')));

    const [streamStats] = await db
      .select({
        totalStreams: count(),
        totalViewers: sum(streams.peakViewers),
      })
      .from(streams)
      .where(eq(streams.sellerId, sellerId));

    const [productStats] = await db
      .select({
        totalProducts: count(),
        activeProducts: count(),
      })
      .from(products)
      .where(eq(products.sellerId, sellerId));

    return {
      orders: orderStats,
      streams: streamStats,
      products: productStats,
    };
  },

  // Get trending products
  getTrendingProducts: async (limit = 10, hours = 24) => {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await db
      .select({
        product: products,
        orderCount: count(orders.id),
      })
      .from(products)
      .leftJoin(orders, eq(orders.productId, products.id))
      .where(
        and(gte(orders.createdAt, cutoffDate), eq(products.status, 'active')),
      )
      .groupBy(products.id)
      .orderBy(desc(count(orders.id)))
      .limit(limit);
  },

  // Get revenue by period
  getRevenueByPeriod: async (
    sellerId: string,
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ) => {
    const dateFormat =
      period === 'day'
        ? 'YYYY-MM-DD'
        : period === 'week'
          ? 'YYYY-IW'
          : 'YYYY-MM';

    return await db
      .select({
        period: sql`TO_CHAR(${orders.createdAt}, ${dateFormat})`,
        revenue: sum(orders.total),
        orderCount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          eq(orders.status, 'delivered'),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, ${dateFormat})`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, ${dateFormat})`);
  },

  // Get top selling products
  getTopSellingProducts: async (
    sellerId: string,
    limit = 10,
    startDate?: Date,
    endDate?: Date,
  ) => {
    let whereCondition = and(
      eq(orders.sellerId, sellerId),
      eq(orders.status, 'delivered'),
    );

    if (startDate && endDate) {
      whereCondition = and(
        whereCondition,
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      );
    }

    return await db
      .select({
        product: products,
        totalSales: count(orders.id),
        totalRevenue: sum(orders.itemPrice),
      })
      .from(products)
      .leftJoin(orders, eq(orders.productId, products.id))
      .where(whereCondition)
      .groupBy(products.id)
      .orderBy(desc(count(orders.id)))
      .limit(limit);
  },

  // Get platform-wide statistics (Admin)
  getPlatformStats: async () => {
    const [userStats] = await db.select({ total: count() }).from(profiles);

    const [sellerStats] = await db
      .select({ total: count() })
      .from(profiles)
      .where(eq(profiles.isSeller, true));

    const [orderStats] = await db
      .select({ total: count(), revenue: sum(orders.total) })
      .from(orders);

    const [streamStats] = await db.select({ total: count() }).from(streams);

    const [liveStreamStats] = await db
      .select({ total: count() })
      .from(streams)
      .where(eq(streams.status, 'live'));

    return {
      users: userStats,
      sellers: sellerStats,
      orders: orderStats,
      streams: streamStats,
      liveStreams: liveStreamStats,
    };
  },
};

// Export all query objects
export const queries = {
  profiles: profileQueries,
  sellerApplications: sellerApplicationQueries,
  sellerDetails: sellerDetailsQueries,
  categories: categoryQueries,
  streams: streamQueries,
  products: productQueries,
  streamProducts: streamProductQueries,
  auctions: auctionQueries,
  bids: bidQueries,
  orders: orderQueries,
  cart: cartQueries,
  chatMessages: chatMessageQueries,
  follows: followQueries,
  notifications: notificationQueries,
  reviews: reviewQueries,
  reports: reportQueries,
  payouts: payoutQueries,
  savedStreams: savedStreamQueries,
  userInterests: userInterestQueries,
  pushTokens: pushTokenQueries,
  streamBans: streamBanQueries,
  analytics: analyticsQueries,
};

export default queries;
