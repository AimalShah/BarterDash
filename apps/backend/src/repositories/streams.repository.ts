import { db } from '../db';
import { streams, streamProducts, streamSubscriptions, products } from '../db/schema';
import { eq, and, or, desc, asc, sql, count, gt, lt } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  InternalError,
} from '../utils/result';
import type { Stream, NewStream, StreamProduct, NewStreamProduct } from '../db/schema';

/**
 * Streams Repository
 * Data access layer for streams and stream products
 */
export class StreamsRepository {
  /**
   * Create a new stream
   */
  async create(data: NewStream): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .insert(streams)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return success(stream);
    } catch (error) {
      console.error('Error creating stream:', error);
      return failure(new InternalError('Failed to create stream'));
    }
  }

  /**
   * Find stream by ID with related data
   */
  async findById(id: string): Promise<AppResult<Stream | null>> {
    try {
      const stream = await db.query.streams.findFirst({
        where: eq(streams.id, id),
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

      return success(stream || null);
    } catch (error) {
      console.error('Error finding stream:', error);
      return failure(new InternalError('Failed to find stream'));
    }
  }

  /**
   * Find stream by Agora channel name
   */
  async findByChannelName(channelName: string): Promise<AppResult<Stream | null>> {
    try {
      const stream = await db.query.streams.findFirst({
        where: eq(streams.agoraChannelName, channelName),
        with: {
          seller: true,
          category: true,
        },
      });

      return success(stream || null);
    } catch (error) {
      console.error('Error finding stream by channel:', error);
      return failure(new InternalError('Failed to find stream'));
    }
  }

  /**
   * Update stream
   */
  async update(id: string, data: Partial<NewStream>): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .update(streams)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error updating stream:', error);
      return failure(new InternalError('Failed to update stream'));
    }
  }

  /**
   * Get all streams with optional filtering
   */
  async findAll(options: {
    status?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AppResult<{ items: Stream[]; totalCount: number; totalPages: number }>> {
    try {
      const { status, categoryId, search, limit = 20, offset = 0 } = options;
      const conditions = [];

      if (status && status !== 'all') {
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

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

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

      return success({
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      });
    } catch (error) {
      console.error('Error finding streams:', error);
      return failure(new InternalError('Failed to find streams'));
    }
  }

  /**
   * Get streams by seller
   */
  async findBySeller(sellerId: string, limit = 20, offset = 0): Promise<AppResult<Stream[]>> {
    try {
      const items = await db.query.streams.findMany({
        where: eq(streams.sellerId, sellerId),
        with: {
          category: true,
        },
        orderBy: [desc(streams.createdAt)],
        limit,
        offset,
      });

      return success(items);
    } catch (error) {
      console.error('Error finding seller streams:', error);
      return failure(new InternalError('Failed to find seller streams'));
    }
  }

  /**
   * Start stream
   */
  async start(id: string, conferenceRoomId?: string): Promise<AppResult<Stream>> {
    try {
      const updateData: any = {
        status: 'live',
        actualStart: new Date(),
        updatedAt: new Date(),
      };
      if (conferenceRoomId) {
        updateData.streamKey = conferenceRoomId;
      }

      const [stream] = await db
        .update(streams)
        .set(updateData)
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error starting stream:', error);
      return failure(new InternalError('Failed to start stream'));
    }
  }

  /**
   * End stream
   */
  async end(id: string): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .update(streams)
        .set({
          status: 'ended',
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error ending stream:', error);
      return failure(new InternalError('Failed to end stream'));
    }
  }

  /**
   * Update viewer count
   */
  async updateViewerCount(id: string, count: number): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .update(streams)
        .set({
          viewerCount: count,
          peakViewerCount: sql`GREATEST(${streams.peakViewerCount}, ${count})`,
          updatedAt: new Date(),
        })
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error updating viewer count:', error);
      return failure(new InternalError('Failed to update viewer count'));
    }
  }

  /**
   * Increment viewer count
   */
  async incrementViewerCount(id: string): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .update(streams)
        .set({
          viewerCount: sql`${streams.viewerCount} + 1`,
          peakViewerCount: sql`GREATEST(${streams.peakViewerCount}, ${streams.viewerCount} + 1)`,
          updatedAt: new Date(),
        })
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error incrementing viewer count:', error);
      return failure(new InternalError('Failed to increment viewer count'));
    }
  }

  /**
   * Decrement viewer count
   */
  async decrementViewerCount(id: string): Promise<AppResult<Stream>> {
    try {
      const [stream] = await db
        .update(streams)
        .set({
          viewerCount: sql`GREATEST(${streams.viewerCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(streams.id, id))
        .returning();

      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      return success(stream);
    } catch (error) {
      console.error('Error decrementing viewer count:', error);
      return failure(new InternalError('Failed to decrement viewer count'));
    }
  }

  /**
   * Add product to stream
   */
  async addProduct(data: NewStreamProduct): Promise<AppResult<StreamProduct>> {
    try {
      const [streamProduct] = await db
        .insert(streamProducts)
        .values(data)
        .returning();

      return success(streamProduct);
    } catch (error) {
      console.error('Error adding product to stream:', error);
      return failure(new InternalError('Failed to add product to stream'));
    }
  }

  /**
   * Get products in stream
   */
  async getProductsByStream(streamId: string): Promise<AppResult<StreamProduct[]>> {
    try {
      const products = await db.query.streamProducts.findMany({
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

      return success(products);
    } catch (error) {
      console.error('Error getting stream products:', error);
      return failure(new InternalError('Failed to get stream products'));
    }
  }

  /**
   * Update stream product
   */
  async updateProduct(
    productId: string,
    data: Partial<NewStreamProduct>,
  ): Promise<AppResult<StreamProduct>> {
    try {
      const [streamProduct] = await db
        .update(streamProducts)
        .set({
          ...data,
        })
        .where(eq(streamProducts.id, productId))
        .returning();

      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      return success(streamProduct);
    } catch (error) {
      console.error('Error updating stream product:', error);
      return failure(new InternalError('Failed to update stream product'));
    }
  }

  /**
   * Mark stream product as active
   */
  async markProductAsActive(productId: string): Promise<AppResult<StreamProduct>> {
    try {
      const [streamProduct] = await db
        .update(streamProducts)
        .set({
          status: 'active',
          startedAt: new Date(),
        })
        .where(eq(streamProducts.id, productId))
        .returning();

      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      return success(streamProduct);
    } catch (error) {
      console.error('Error marking product as active:', error);
      return failure(new InternalError('Failed to mark product as active'));
    }
  }

  /**
   * Mark stream product as sold
   */
  async markProductAsSold(productId: string): Promise<AppResult<StreamProduct>> {
    try {
      const [streamProduct] = await db
        .update(streamProducts)
        .set({
          status: 'sold',
          endedAt: new Date(),
        })
        .where(eq(streamProducts.id, productId))
        .returning();

      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      return success(streamProduct);
    } catch (error) {
      console.error('Error marking product as sold:', error);
      return failure(new InternalError('Failed to mark product as sold'));
    }
  }

  /**
   * Remove product from stream
   */
  async removeProduct(productId: string): Promise<AppResult<void>> {
    try {
      await db.delete(streamProducts).where(eq(streamProducts.id, productId));
      return success(undefined);
    } catch (error) {
      console.error('Error removing product from stream:', error);
      return failure(new InternalError('Failed to remove product from stream'));
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(streamId: string, userId: string): Promise<AppResult<any>> {
    try {
      const [subscription] = await db
        .insert(streamSubscriptions)
        .values({
          streamId,
          userId,
          notified: false,
          createdAt: new Date(),
        })
        .returning();

      return success(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      return failure(new InternalError('Failed to create subscription'));
    }
  }

  /**
   * Check if subscription exists
   */
  async hasSubscription(streamId: string, userId: string): Promise<AppResult<boolean>> {
    try {
      const subscription = await db.query.streamSubscriptions.findFirst({
        where: and(
          eq(streamSubscriptions.streamId, streamId),
          eq(streamSubscriptions.userId, userId),
        ),
      });

      return success(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      return failure(new InternalError('Failed to check subscription'));
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<AppResult<any>> {
    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      return success(product);
    } catch (error) {
      console.error('Error getting product:', error);
      return failure(new InternalError('Failed to get product'));
    }
  }

  /**
   * Get stream product by ID
   */
  async getStreamProductById(productId: string): Promise<AppResult<any>> {
    try {
      const streamProduct = await db.query.streamProducts.findFirst({
        where: eq(streamProducts.id, productId),
      });

      return success(streamProduct);
    } catch (error) {
      console.error('Error getting stream product:', error);
      return failure(new InternalError('Failed to get stream product'));
    }
  }

  /**
   * Get stream product by stream and ID
   */
  async getStreamProductByStreamAndId(
    streamId: string,
    productId: string,
  ): Promise<AppResult<any>> {
    try {
      const streamProduct = await db.query.streamProducts.findFirst({
        where: and(
          eq(streamProducts.id, productId),
          eq(streamProducts.streamId, streamId),
        ),
      });

      return success(streamProduct);
    } catch (error) {
      console.error('Error getting stream product:', error);
      return failure(new InternalError('Failed to get stream product'));
    }
  }
}
