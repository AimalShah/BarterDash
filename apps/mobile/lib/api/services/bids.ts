import apiClient from '../client';
import { Bid, ApiResponse } from '../../../types';

export interface PlaceBidPayload {
  auction_id: string;
  auctionId?: string;
  amount: number;
  is_max_bid?: boolean;
  isMaxBid?: boolean;
}

export interface PlaceBidResponse extends Bid {
  timer_extended?: boolean;
  new_ends_at?: string;
  timer_extensions?: number;
  bid_count?: number;
}

export interface MaxBidPayload {
  auction_id: string;
  auctionId?: string;
  max_amount: number;
  maxAmount?: number;
}

export const bidsService = {
  placeBid: async (payload: PlaceBidPayload): Promise<PlaceBidResponse> => {
    const auctionId = payload.auction_id ?? payload.auctionId;
    if (!auctionId) {
      throw new Error('Missing auction_id');
    }

    const normalizedPayload: PlaceBidPayload = {
      auction_id: auctionId,
      amount: Number(payload.amount),
      ...(typeof (payload.is_max_bid ?? payload.isMaxBid) === 'boolean'
        ? { is_max_bid: Boolean(payload.is_max_bid ?? payload.isMaxBid) }
        : {}),
    };

    const response = await apiClient.post<ApiResponse<PlaceBidResponse>>(
      '/bids',
      normalizedPayload,
    );
    return response.data.data;
  },

  placeMaxBid: async (payload: MaxBidPayload): Promise<PlaceBidResponse> => {
    const auctionId = payload.auction_id ?? payload.auctionId;
    const maxAmount = payload.max_amount ?? payload.maxAmount;

    if (!auctionId) {
      throw new Error('Missing auction_id');
    }

    if (maxAmount === undefined || maxAmount === null) {
      throw new Error('Missing max_amount');
    }

    const response = await apiClient.post<ApiResponse<PlaceBidResponse>>(
      '/bids/max',
      {
        auction_id: auctionId,
        max_amount: Number(maxAmount),
      },
    );
    return response.data.data;
  },

  getAuctionBids: async (auctionId: string): Promise<Bid[]> => {
    const response = await apiClient.get<ApiResponse<Bid[]>>(`/bids/auction/${auctionId}`);
    return response.data.data;
  },

  getMyBids: async (): Promise<Bid[]> => {
    const response = await apiClient.get<ApiResponse<Bid[]>>('/bids/my-bids');
    return response.data.data;
  },

  getMyMaxBids: async (): Promise<Bid[]> => {
    const response = await apiClient.get<ApiResponse<Bid[]>>('/bids/my-max-bids');
    return response.data.data;
  },

  cancelMaxBid: async (maxBidId: string): Promise<void> => {
    await apiClient.delete(`/bids/max/${maxBidId}`);
  },
};
