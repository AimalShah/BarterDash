import { StreamsRepository } from '../repositories/streams.repository';
import { StreamService } from './stream.service';
import { config } from '../config';
import { StreamVideoService } from './stream-video.service';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  InternalError,
} from '../utils/result';
import type { Stream, NewStream, StreamProduct, NewStreamProduct } from '../db/schema';
import { randomUUID } from 'crypto';

/**
 * Streams Service
 * Business logic for stream management, including scheduling, products, and live session tracking
 */

export interface CreateStreamInput {
  sellerId: string;
  title: string;
  description?: string;
  categoryId: string;
  scheduledStart: Date;
  thumbnailUrl?: string;
}

export interface UpdateStreamInput {
  title?: string;
  description?: string;
  categoryId?: string;
  scheduledStart?: Date;
  thumbnailUrl?: string;
}

export interface AddProductInput {
  streamId: string;
  productId: string;
  displayOrder?: number;
}

export interface StreamWithDetails extends Stream {
  seller?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    sellerDetails?: any;
  };
  category?: any;
  products?: StreamProduct[];
}

export class StreamsService {
  private repository: StreamsRepository;
  private streamSessionService: StreamService;
  private streamVideoService: StreamVideoService;

  constructor() {
    this.repository = new StreamsRepository();
    this.streamSessionService = new StreamService();
    this.streamVideoService = new StreamVideoService();
  }

  /**
   * Generate a consistent stream channel name
   */
  private generateStreamChannelName(): string {
    const timestamp = Date.now().toString(36);
    const uuid = randomUUID().replace(/-/g, '').substring(0, 8);
    return `stream_${timestamp}_${uuid}`;
  }

  /**
   * Generate stream key
   */
  private generateStreamKey(): string {
    return `sk_${randomUUID()}`;
  }

  /**
   * Create a new stream
   */
  async createStream(input: CreateStreamInput): Promise<AppResult<StreamWithDetails>> {
    try {
      // Generate Agora channel name and stream key
      const streamChannelName = this.generateStreamChannelName();
      const streamKey = this.generateStreamKey();

      const newStream: NewStream = {
        sellerId: input.sellerId,
        title: input.title,
        description: input.description || null,
        categoryId: input.categoryId,
        scheduledStart: input.scheduledStart,
        thumbnailUrl: input.thumbnailUrl || null,
        status: 'scheduled',
        // Legacy column name kept for compatibility; used as stream channel name
        agoraChannelName: streamChannelName,
        streamKey,
        viewerCount: 0,
        peakViewerCount: 0,
        totalSales: '0',
        peakViewers: 0,
        totalViewTime: 0,
        chatEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.repository.create(newStream);
      if (result.isErr()) {
        return failure(result.error);
      }

      // Fetch the created stream with all details
      const streamResult = await this.repository.findById(result.value.id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      return success(streamResult.value as StreamWithDetails);
    } catch (error) {
      console.error('Error creating stream:', error);
      return failure(new InternalError('Failed to create stream'));
    }
  }

  /**
   * Get stream by ID
   */
  async getStreamById(id: string): Promise<AppResult<StreamWithDetails>> {
    const result = await this.repository.findById(id);
    if (result.isErr()) {
      return failure(result.error);
    }

    if (!result.value) {
      return failure(new NotFoundError('Stream', id));
    }

    return success(result.value as StreamWithDetails);
  }

  /**
   * Get all streams with filtering
   */
  async getStreams(options: {
    status?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AppResult<{ items: StreamWithDetails[]; totalCount: number; totalPages: number }>> {
    const result = await this.repository.findAll(options);
    if (result.isErr()) {
      return failure(result.error);
    }

    return success({
      items: result.value.items as StreamWithDetails[],
      totalCount: result.value.totalCount,
      totalPages: result.value.totalPages,
    });
  }

  /**
   * Get streams by seller
   */
  async getStreamsBySeller(sellerId: string): Promise<AppResult<StreamWithDetails[]>> {
    const result = await this.repository.findBySeller(sellerId);
    if (result.isErr()) {
      return failure(result.error);
    }

    return success(result.value as StreamWithDetails[]);
  }

  /**
   * Update stream
   */
  async updateStream(
    id: string,
    sellerId: string,
    input: UpdateStreamInput,
  ): Promise<AppResult<StreamWithDetails>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only update your own streams'));
      }

      // Can only edit scheduled streams
      if (stream.status !== 'scheduled') {
        return failure(new ValidationError('Can only edit scheduled streams'));
      }

      const updateData: Partial<NewStream> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
      if (input.scheduledStart !== undefined) updateData.scheduledStart = input.scheduledStart;
      if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;

      const result = await this.repository.update(id, updateData);
      if (result.isErr()) {
        return failure(result.error);
      }

      // Fetch updated stream with details
      const updatedResult = await this.repository.findById(id);
      if (updatedResult.isErr()) {
        return failure(updatedResult.error);
      }

      return success(updatedResult.value as StreamWithDetails);
    } catch (error) {
      console.error('Error updating stream:', error);
      return failure(new InternalError('Failed to update stream'));
    }
  }

  /**
   * Start a stream
   * This also creates a stream session for Agora integration
   */
  async startStream(
    id: string,
    sellerId: string,
    conferenceRoomId?: string,
  ): Promise<AppResult<{ stream: StreamWithDetails; sellerToken: null }>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only start your own streams'));
      }

      // Start the stream in the database
      const startResult = await this.repository.start(id, conferenceRoomId);
      if (startResult.isErr()) {
        return failure(startResult.error);
      }

      // Create a stream session for viewer tracking (no Agora tokens)
      const sessionResult = await this.streamSessionService.startStream({
        sellerId,
        auctionId: undefined,
        metadata: {
          streamId: id,
          channelName: stream.agoraChannelName,
        },
      });

      if (sessionResult.isErr()) {
        if (config.nodeEnv !== 'production') {
          console.warn(
            '[StreamsService] Stream session creation failed in dev. Skipping session creation.',
            sessionResult.error,
          );
        } else {
          // Revert stream status if session creation fails
          await this.repository.update(id, { status: 'scheduled' });
          return failure(sessionResult.error);
        }
      }

      // Get updated stream with details
      const updatedResult = await this.repository.findById(id);
      if (updatedResult.isErr()) {
        return failure(updatedResult.error);
      }

      return success({
        stream: updatedResult.value as StreamWithDetails,
        sellerToken: null,
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      return failure(new InternalError('Failed to start stream'));
    }
  }

  async getStreamVideoToken(
    streamId: string,
    userId: string,
  ): Promise<AppResult<{ token: string }>> {
    try {
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value as StreamWithDetails | null;
      if (!stream) {
        return failure(new NotFoundError('Stream', streamId));
      }

      const token = this.streamVideoService.createUserToken(userId);
      return success({ token });
    } catch (error) {
      console.error('Error generating Stream video token:', error);
      return failure(new InternalError('Failed to generate streaming token'));
    }
  }

  /**
   * End a stream
   */
  async endStream(id: string, sellerId: string): Promise<AppResult<StreamWithDetails>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only end your own streams'));
      }

      // End the stream session if it exists
      // Note: We don't have a direct way to get the session ID from the stream,
      // but the stream session repository can handle cleanup based on sellerId

      // End the stream in the database
      const endResult = await this.repository.end(id);
      if (endResult.isErr()) {
        return failure(endResult.error);
      }

      // Get updated stream with details
      const updatedResult = await this.repository.findById(id);
      if (updatedResult.isErr()) {
        return failure(updatedResult.error);
      }

      return success(updatedResult.value as StreamWithDetails);
    } catch (error) {
      console.error('Error ending stream:', error);
      return failure(new InternalError('Failed to end stream'));
    }
  }

  /**
   * Join a stream (increment viewer count)
   */
  async joinStream(id: string): Promise<AppResult<{ stream: StreamWithDetails; viewerCount: number }>> {
    try {
      // Verify stream exists and is live
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      if (stream.status !== 'live') {
        return failure(new ValidationError('Stream is not live'));
      }

      // Increment viewer count
      const incrementResult = await this.repository.incrementViewerCount(id);
      if (incrementResult.isErr()) {
        return failure(incrementResult.error);
      }

      // Get updated stream
      const updatedResult = await this.repository.findById(id);
      if (updatedResult.isErr()) {
        return failure(updatedResult.error);
      }

      return success({
        stream: updatedResult.value as StreamWithDetails,
        viewerCount: incrementResult.value.viewerCount,
      });
    } catch (error) {
      console.error('Error joining stream:', error);
      return failure(new InternalError('Failed to join stream'));
    }
  }

  /**
   * Leave a stream (decrement viewer count)
   */
  async leaveStream(id: string): Promise<AppResult<{ viewerCount: number }>> {
    try {
      // Verify stream exists
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      // Decrement viewer count
      const decrementResult = await this.repository.decrementViewerCount(id);
      if (decrementResult.isErr()) {
        return failure(decrementResult.error);
      }

      return success({
        viewerCount: decrementResult.value.viewerCount,
      });
    } catch (error) {
      console.error('Error leaving stream:', error);
      return failure(new InternalError('Failed to leave stream'));
    }
  }

  /**
   * Subscribe to stream notifications
   */
  async subscribeToStream(id: string, userId: string): Promise<AppResult<void>> {
    try {
      // Verify stream exists
      const streamResult = await this.repository.findById(id);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', id));
      }

      // Can only subscribe to scheduled streams
      if (stream.status !== 'scheduled') {
        return failure(new ValidationError('Can only subscribe to scheduled streams'));
      }

      // Check if already subscribed
      const hasSubResult = await this.repository.hasSubscription(id, userId);
      if (hasSubResult.isErr()) {
        return failure(hasSubResult.error);
      }

      if (hasSubResult.value) {
        return failure(new ConflictError('Already subscribed to this stream'));
      }

      // Create subscription
      const subResult = await this.repository.createSubscription(id, userId);
      if (subResult.isErr()) {
        return failure(subResult.error);
      }

      return success(undefined);
    } catch (error) {
      console.error('Error subscribing to stream:', error);
      return failure(new InternalError('Failed to subscribe to stream'));
    }
  }

  /**
   * Add product to stream
   */
  async addProductToStream(
    streamId: string,
    sellerId: string,
    input: AddProductInput,
  ): Promise<AppResult<StreamProduct>> {
    try {
      console.log('[StreamsService] Adding product to stream:', {
        streamId,
        sellerId,
        productId: input.productId,
        displayOrder: input.displayOrder,
      });

      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        console.error('[StreamsService] Stream not found:', streamId);
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        console.error('[StreamsService] Stream is null:', streamId);
        return failure(new NotFoundError('Stream', streamId));
      }

      console.log('[StreamsService] Found stream:', {
        streamId: stream.id,
        status: stream.status,
        sellerId: stream.sellerId,
      });

      if (stream.sellerId !== sellerId) {
        console.error('[StreamsService] Seller mismatch:', {
          streamSellerId: stream.sellerId,
          requestSellerId: sellerId,
        });
        return failure(new ForbiddenError('You can only add products to your own streams'));
      }

      // Can add products to scheduled or live streams
      if (!['scheduled', 'live'].includes(stream.status)) {
        console.error('[StreamsService] Invalid stream status:', stream.status);
        return failure(new ValidationError(`Cannot add products to ${stream.status} streams. Only scheduled or live streams are allowed.`));
      }

      // Verify product exists and belongs to seller
      const productResult = await this.repository.getProductById(input.productId);
      if (productResult.isErr()) {
        console.error('[StreamsService] Product lookup failed:', input.productId);
        return failure(productResult.error);
      }

      const product = productResult.value;
      if (!product) {
        console.error('[StreamsService] Product not found:', input.productId);
        return failure(new NotFoundError('Product', input.productId));
      }

      if (product.sellerId !== sellerId) {
        console.error('[StreamsService] Product seller mismatch:', {
          productSellerId: product.sellerId,
          requestSellerId: sellerId,
        });
        return failure(new ForbiddenError('You can only add your own products'));
      }

      console.log('[StreamsService] Adding product to stream:', {
        streamId,
        productId: input.productId,
        displayOrder: input.displayOrder || 0,
      });

      // Add product to stream
      const addResult = await this.repository.addProduct({
        streamId,
        productId: input.productId,
        displayOrder: input.displayOrder || 0,
        status: 'upcoming',
        createdAt: new Date(),
      });

      if (addResult.isErr()) {
        console.error('[StreamsService] Failed to add product to stream:', addResult.error);
        return failure(addResult.error);
      }

      console.log('[StreamsService] Product added successfully:', addResult.value);
      return success(addResult.value);
    } catch (error) {
      console.error('[StreamsService] Error adding product to stream:', error);
      return failure(new InternalError('Failed to add product to stream'));
    }
  }

  /**
   * Get products in stream
   */
  async getStreamProducts(streamId: string): Promise<AppResult<StreamProduct[]>> {
    const result = await this.repository.getProductsByStream(streamId);
    if (result.isErr()) {
      return failure(result.error);
    }

    return success(result.value);
  }

  /**
   * Update stream product
   */
  async updateStreamProduct(
    streamId: string,
    productId: string,
    sellerId: string,
    data: { status?: string; displayOrder?: number },
  ): Promise<AppResult<StreamProduct>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', streamId));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only update products in your own streams'));
      }

      // Verify stream product exists
      const streamProductResult = await this.repository.getStreamProductByStreamAndId(
        streamId,
        productId,
      );
      if (streamProductResult.isErr()) {
        return failure(streamProductResult.error);
      }

      const streamProduct = streamProductResult.value;
      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      const updateData: Partial<NewStreamProduct> = {};
      if (data.status !== undefined) updateData.status = data.status as any;
      if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

      const result = await this.repository.updateProduct(productId, updateData);
      if (result.isErr()) {
        return failure(result.error);
      }

      return success(result.value);
    } catch (error) {
      console.error('Error updating stream product:', error);
      return failure(new InternalError('Failed to update stream product'));
    }
  }

  /**
   * Mark stream product as active
   */
  async markProductAsActive(
    streamId: string,
    productId: string,
    sellerId: string,
  ): Promise<AppResult<StreamProduct>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', streamId));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only update products in your own streams'));
      }

      // Verify stream product exists
      const streamProductResult = await this.repository.getStreamProductByStreamAndId(
        streamId,
        productId,
      );
      if (streamProductResult.isErr()) {
        return failure(streamProductResult.error);
      }

      const streamProduct = streamProductResult.value;
      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      const result = await this.repository.markProductAsActive(productId);
      if (result.isErr()) {
        return failure(result.error);
      }

      return success(result.value);
    } catch (error) {
      console.error('Error marking product as active:', error);
      return failure(new InternalError('Failed to mark product as active'));
    }
  }

  /**
   * Mark stream product as sold
   */
  async markProductAsSold(
    streamId: string,
    productId: string,
    sellerId: string,
  ): Promise<AppResult<StreamProduct>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', streamId));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only update products in your own streams'));
      }

      // Verify stream product exists
      const streamProductResult = await this.repository.getStreamProductByStreamAndId(
        streamId,
        productId,
      );
      if (streamProductResult.isErr()) {
        return failure(streamProductResult.error);
      }

      const streamProduct = streamProductResult.value;
      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      const result = await this.repository.markProductAsSold(productId);
      if (result.isErr()) {
        return failure(result.error);
      }

      return success(result.value);
    } catch (error) {
      console.error('Error marking product as sold:', error);
      return failure(new InternalError('Failed to mark product as sold'));
    }
  }

  /**
   * Remove product from stream
   */
  async removeProductFromStream(
    streamId: string,
    productId: string,
    sellerId: string,
  ): Promise<AppResult<void>> {
    try {
      // Verify stream exists and belongs to seller
      const streamResult = await this.repository.findById(streamId);
      if (streamResult.isErr()) {
        return failure(streamResult.error);
      }

      const stream = streamResult.value;
      if (!stream) {
        return failure(new NotFoundError('Stream', streamId));
      }

      if (stream.sellerId !== sellerId) {
        return failure(new ForbiddenError('You can only remove products from your own streams'));
      }

      // Verify stream product exists
      const streamProductResult = await this.repository.getStreamProductByStreamAndId(
        streamId,
        productId,
      );
      if (streamProductResult.isErr()) {
        return failure(streamProductResult.error);
      }

      const streamProduct = streamProductResult.value;
      if (!streamProduct) {
        return failure(new NotFoundError('Stream product', productId));
      }

      const result = await this.repository.removeProduct(productId);
      if (result.isErr()) {
        return failure(result.error);
      }

      return success(undefined);
    } catch (error) {
      console.error('Error removing product from stream:', error);
      return failure(new InternalError('Failed to remove product from stream'));
    }
  }

}
