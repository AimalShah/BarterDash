import apiClient from "../client";
import { Auction, ApiResponse } from "../../../types";

interface CreateAuctionPayload {
  product_id: string;
  starting_bid: number;
  reserve_price?: number;
  minimum_bid_increment?: number;
  duration_minutes?: number;
  scheduled_start?: string;
}

interface StartStreamAuctionPayload {
  stream_id: string;
  product_id: string;
  starting_bid: number;
  reserve_price?: number;
  minimum_bid_increment?: number;
  duration_minutes?: number;
}

export const auctionsService = {
  /**
   * Create a standalone/pre-bidding auction (not tied to live stream)
   */
  create: async (payload: CreateAuctionPayload): Promise<Auction> => {
    const response = await apiClient.post<ApiResponse<Auction>>(
      "/auctions",
      payload,
    );
    return response.data.data;
  },

  /**
   * Start auction for a product during a live stream
   */
  startStreamAuction: async (
    payload: StartStreamAuctionPayload,
  ): Promise<Auction> => {
    const response = await apiClient.post<ApiResponse<Auction>>(
      "/auctions/stream",
      payload,
    );
    return response.data.data;
  },

  /**
   * Get all auctions with optional filters
   */
  findAll: async (query?: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Auction[]> => {
    const response = await apiClient.get<ApiResponse<Auction[]>>("/auctions", {
      params: query,
    });
    return response.data.data;
  },

  /**
   * Get auctions for a specific stream
   */
  findByStream: async (streamId: string): Promise<Auction[]> => {
    const response = await apiClient.get<ApiResponse<Auction[]>>(
      `/auctions/stream/${streamId}`,
    );
    return response.data.data;
  },

  /**
   * Get auction by ID
   */
  findById: async (id: string): Promise<Auction> => {
    const response = await apiClient.get<ApiResponse<Auction>>(
      `/auctions/${id}`,
    );
    return response.data.data;
  },

  /**
   * Cancel an auction (only if no bids)
   */
  cancel: async (id: string): Promise<Auction> => {
    const response = await apiClient.delete<ApiResponse<Auction>>(
      `/auctions/${id}`,
    );
    return response.data.data;
  },
};
