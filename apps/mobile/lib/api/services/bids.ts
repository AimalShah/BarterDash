import apiClient from "../client";
import { Bid, CreateBidPayload, ApiResponse } from "../../../types";

export const bidsService = {
  placeBid: async (payload: CreateBidPayload | { auction_id: string; amount: number }): Promise<Bid> => {
    // Ensure we have a valid auction_id (handle both snake_case and camelCase)
    const auctionId = (payload as any).auction_id ?? (payload as any).auctionId;
    
    if (!auctionId) {
      console.error('[bidsService] Missing auction_id in payload:', payload);
      throw new Error("Missing auction_id: Cannot place bid without a valid auction ID");
    }
    
    const normalizedPayload = {
      auction_id: auctionId,
      amount: payload.amount,
    };
    
    console.log('[bidsService] Placing bid with payload:', normalizedPayload);
    
    try {
      const response = await apiClient.post<ApiResponse<Bid>>(
        "/bids",
        normalizedPayload,
      );
      console.log('[bidsService] Bid placed successfully:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[bidsService] Failed to place bid:', {
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  },

  getAuctionBids: async (auctionId: string): Promise<Bid[]> => {
    const response = await apiClient.get<ApiResponse<Bid[]>>(`/bids/auction/${auctionId}`);
    return response.data.data;
  },

  getMyBids: async (): Promise<Bid[]> => {
    const response = await apiClient.get<ApiResponse<Bid[]>>("/bids/my-bids");
    return response.data.data;
  },
};
