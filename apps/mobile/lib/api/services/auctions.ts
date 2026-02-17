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
  mode?: 'normal' | 'sudden_death';
  max_timer_extensions?: number;
}

const mapStatusForApi = (status?: string): string | undefined => {
  if (!status) return undefined;
  if (status === "live") return "active";
  if (status === "scheduled" || status === "draft") return "pending";
  return status;
};

const mapStatusFromApi = (status?: string): string => {
  if (status === "active") return "live";
  if (status === "pending") return "scheduled";
  return status || "scheduled";
};

const normalizeAuction = (raw: any): Auction => {
  const product = raw?.product || {};
  const seller = product?.seller || raw?.seller || {};

  const startingPrice = Number(
    raw?.starting_price ??
      raw?.startingBid ??
      raw?.starting_bid ??
      product?.startingBid ??
      product?.starting_bid ??
      0,
  );
  const currentPrice = Number(
    raw?.current_price ??
      raw?.currentBid ??
      raw?.current_bid ??
      raw?.startingBid ??
      raw?.starting_bid ??
      startingPrice,
  );
  const buyoutRaw =
    raw?.buyout_price ??
    raw?.buyoutPrice ??
    raw?.buyNowPrice ??
    raw?.buy_now_price ??
    product?.buyNowPrice ??
    product?.buy_now_price;
  const buyoutPrice = buyoutRaw !== undefined && buyoutRaw !== null
    ? Number(buyoutRaw)
    : undefined;
  const images = raw?.images || product?.images || [];

  return {
    ...raw,
    id: raw?.id,
    seller_id:
      raw?.seller_id ||
      raw?.sellerId ||
      product?.sellerId ||
      seller?.id ||
      "",
    title: raw?.title || product?.title || "Auction Item",
    description: raw?.description || product?.description || undefined,
    starting_price: startingPrice,
    current_price: currentPrice,
    buyout_price: buyoutPrice,
    bid_increment: Number(
      raw?.bid_increment ??
        raw?.minimumBidIncrement ??
        raw?.minimum_bid_increment ??
        1,
    ),
    status: mapStatusFromApi(raw?.status) as Auction["status"],
    images,
    thumbnail_url: raw?.thumbnail_url || images?.[0],
    category: raw?.category || product?.category,
    starts_at: raw?.starts_at || raw?.startedAt || raw?.started_at,
    ends_at: raw?.ends_at || raw?.endsAt,
    created_at: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    seller: seller?.username
      ? {
          username: seller.username,
          avatar_url: seller.avatar_url || seller.avatarUrl,
        }
      : undefined,
  };
};

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
    const normalizedQuery = {
      ...query,
      status: mapStatusForApi(query?.status),
    };
    const response = await apiClient.get<ApiResponse<Auction[]>>("/auctions", {
      params: normalizedQuery,
    });
    return (response.data.data || []).map(normalizeAuction);
  },

  /**
   * Get auctions for a specific stream
   */
  findByStream: async (streamId: string): Promise<Auction[]> => {
    const response = await apiClient.get<ApiResponse<Auction[]>>(
      `/auctions/stream/${streamId}`,
    );
    return (response.data.data || []).map(normalizeAuction);
  },

  /**
   * Get auction by ID
   */
  findById: async (id: string): Promise<Auction> => {
    const response = await apiClient.get<ApiResponse<Auction>>(
      `/auctions/${id}`,
    );
    return normalizeAuction(response.data.data);
  },

  /**
   * Cancel an auction (only if no bids)
   */
  cancel: async (id: string): Promise<Auction> => {
    const response = await apiClient.delete<ApiResponse<Auction>>(
      `/auctions/${id}`,
    );
    return normalizeAuction(response.data.data);
  },

  /**
   * Extend auction duration
   */
  extend: async (
    id: string,
    extensionSeconds: number = 15,
  ): Promise<Auction & { extension_seconds: number; new_ends_at: string }> => {
    const response = await apiClient.post<
      ApiResponse<Auction & { extension_seconds: number; new_ends_at: string }>
    >(`/auctions/${id}/extend`, { extension_seconds: extensionSeconds });
    return normalizeAuction(response.data.data) as Auction & {
      extension_seconds: number;
      new_ends_at: string;
    };
  },
};
