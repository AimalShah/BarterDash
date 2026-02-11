import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface Stream {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  thumbnailUrl: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStart: string | null;
  startedAt: string | null;
  endedAt: string | null;
  // Legacy field kept for backend compatibility
  agoraChannelName: string | null;
  streamKey: string | null;
  viewerCount: number;
  peakViewerCount: number;
  totalSales: string;
  chatEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    username: string;
    avatarUrl: string | null;
    sellerDetails?: {
      businessName: string;
      rating: number;
    };
  };
  products?: any[];
}

interface CreateStreamPayload {
  title: string;
  description?: string;
  categoryId?: string;
  scheduledStart?: string;
  thumbnailUrl?: string;
}

interface UpdateStreamPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  scheduledStart?: string;
  thumbnailUrl?: string;
}

export interface StreamProduct {
  id: string;
  streamId: string;
  productId: string;
  displayOrder: number | null;
  status: 'upcoming' | 'active' | 'sold' | 'passed';
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    description: string | null;
    price: string;
    images: string[];
    condition: string;
    category?: {
      id: string;
      name: string;
    };
  };
}

interface AddProductPayload {
  productId: string;
  displayOrder?: number;
}

interface UpdateProductPayload {
  status?: 'upcoming' | 'active' | 'sold' | 'passed';
  displayOrder?: number;
}

export const streamsService = {
  /**
   * Create a new stream
   */
  create: async (payload: CreateStreamPayload): Promise<Stream> => {
    // Normalize to snake_case for backend
    const normalizedPayload = {
      title: payload.title,
      description: payload.description,
      category_id: payload.categoryId,
      schedule_start: payload.scheduledStart,
      thumbnail_url: payload.thumbnailUrl,
    };
    const response = await apiClient.post<ApiResponse<Stream>>("/stream/create", normalizedPayload);
    return response.data.data;
  },

  /**
   * Get all streams with optional filters
   */
  findAll: async (query?: { status?: string; category_id?: string; search?: string; limit?: number; offset?: number }): Promise<Stream[]> => {
    const response = await apiClient.get<ApiResponse<Stream[]>>("/stream", { params: query });
    return response.data.data;
  },

  /**
   * Get stream by ID
   */
  findById: async (id: string): Promise<Stream> => {
    const response = await apiClient.get<ApiResponse<Stream>>(`/stream/${id}`);
    return response.data.data;
  },

  /**
   * Start a scheduled stream (go live)
   */
  start: async (
    streamId: string,
    options?: { conferenceRoomId?: string },
  ): Promise<Stream> => {
    const payload: Record<string, any> = { stream_id: streamId };
    if (options?.conferenceRoomId) {
      payload.conference_room_id = options.conferenceRoomId;
    }
    const response = await apiClient.post<
      ApiResponse<{ stream: Stream; sellerToken?: any }>
    >("/stream/start", payload);

    return response.data.data.stream;
  },

  /**
   * Get 100ms host token
   */
  getHostToken: async (streamId: string): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      `/stream/${streamId}/host-token`,
    );
    return response.data.data;
  },

  /**
   * Get 100ms viewer token
   */
  getViewerToken: async (streamId: string): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      `/stream/${streamId}/viewer-token`,
    );
    return response.data.data;
  },

  /**
   * End a live stream
   */
  end: async (streamId: string): Promise<Stream> => {
    try {
      console.log('[StreamsService] Ending stream:', streamId);
      console.log('[StreamsService] API URL:', apiClient.defaults.baseURL);
      const response = await apiClient.post<ApiResponse<Stream>>("/stream/end", { stream_id: streamId });
      console.log('[StreamsService] Stream ended successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('[StreamsService] Failed to end stream:', error.message);
      console.error('[StreamsService] Error details:', error?.response?.data || error);
      throw error;
    }
  },

  /**
   * Get my streams (seller)
   */
  getMyStreams: async (): Promise<Stream[]> => {
    const response = await apiClient.get<ApiResponse<Stream[]>>("/stream/me");
    return response.data.data;
  },

  /**
   * Subscribe to stream notifications
   */
  subscribe: async (streamId: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`/stream/${streamId}/subscribe`);
  },

  /**
   * Update stream details
   */
  update: async (streamId: string, payload: UpdateStreamPayload): Promise<Stream> => {
    const normalizedPayload = {
      title: payload.title,
      description: payload.description,
      category_id: payload.categoryId,
      schedule_start: payload.scheduledStart,
      thumbnail_url: payload.thumbnailUrl,
    };
    const response = await apiClient.put<ApiResponse<Stream>>(`/stream/${streamId}`, normalizedPayload);
    return response.data.data;
  },

  /**
   * Get products in stream
   */
  getProducts: async (streamId: string): Promise<StreamProduct[]> => {
    const response = await apiClient.get<ApiResponse<StreamProduct[]>>(`/stream/${streamId}/products`);
    return response.data.data;
  },

  /**
   * Add product to stream
   */
  addProduct: async (streamId: string, payload: AddProductPayload): Promise<StreamProduct> => {
    const normalizedPayload = {
      product_id: payload.productId,
      display_order: payload.displayOrder ?? 0, // Ensure display_order is always a number
    };
    
    console.log('[StreamsService] Adding product to stream:', {
      streamId,
      productId: payload.productId,
      displayOrder: payload.displayOrder,
      normalizedPayload,
    });
    
    try {
      const response = await apiClient.post<ApiResponse<StreamProduct>>(`/stream/${streamId}/products`, normalizedPayload);
      console.log('[StreamsService] Product added successfully:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[StreamsService] Failed to add product:', error.message);
      console.error('[StreamsService] Error response:', error?.response?.data);
      console.error('[StreamsService] Request payload:', normalizedPayload);
      throw error;
    }
  },

  /**
   * Remove product from stream
   */
  removeProduct: async (streamId: string, streamProductId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/stream/${streamId}/products/${streamProductId}`);
  },

  /**
   * Update stream product
   */
  updateProduct: async (streamId: string, streamProductId: string, payload: UpdateProductPayload): Promise<StreamProduct> => {
    const response = await apiClient.put<ApiResponse<StreamProduct>>(`/stream/${streamId}/products/${streamProductId}`, payload);
    return response.data.data;
  },

  /**
   * Mark stream product as active
   */
  markProductActive: async (streamId: string, streamProductId: string): Promise<StreamProduct> => {
    const response = await apiClient.put<ApiResponse<StreamProduct>>(`/stream/${streamId}/products/${streamProductId}/active`);
    return response.data.data;
  },

  /**
   * Mark stream product as sold
   */
  markProductSold: async (streamId: string, streamProductId: string): Promise<StreamProduct> => {
    const response = await apiClient.put<ApiResponse<StreamProduct>>(`/stream/${streamId}/products/${streamProductId}/sold`);
    return response.data.data;
  },

  /**
   * Join stream - increment viewer count
   */
  join: async (streamId: string): Promise<{ viewerCount: number }> => {
    const response = await apiClient.post<ApiResponse<{ viewerCount: number }>>(`/stream/${streamId}/join`);
    return response.data.data;
  },

  /**
   * Leave stream - decrement viewer count
   */
  leave: async (streamId: string): Promise<{ viewerCount: number }> => {
    const response = await apiClient.post<ApiResponse<{ viewerCount: number }>>(`/stream/${streamId}/leave`);
    return response.data.data;
  },

  /**
   * Get stream stats (viewer count, etc.)
   */
  getStreamStats: async (streamId: string): Promise<{ viewerCount: number; peakViewers: number; totalSales: string }> => {
    const response = await apiClient.get<ApiResponse<{ viewerCount: number; peakViewers: number; totalSales: string }>>(`/stream/${streamId}/stats`);
    return response.data.data;
  },
};
