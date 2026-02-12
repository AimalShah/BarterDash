import apiClient from '../client';
import { Bid, ApiResponse } from '../../../types';

export interface PlaceBidPayload {
  auction_id: string;
  amount: number;
  is_max_bid?: boolean;
}

export interface PlaceBidResponse extends Bid {
  timer_extended?: boolean;
  new_ends_at?: string;
  timer_extensions?: number;
  bid_count?: number;
}

export interface MaxBidPayload {
  auction_id: string;
  max_amount: number;
}

export const bidsService = {
  placeBid: async (payload: PlaceBidPayload): Promise<PlaceBidResponse> => {
    const response = await apiClient.post<ApiResponse<PlaceBidResponse>>('/bids', payload);
    return response.data.data;
  },

  placeMaxBid: async (payload: MaxBidPayload): Promise<PlaceBidResponse> => {
    const response = await apiClient.post<ApiResponse<PlaceBidResponse>>('/bids/max', payload);
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
