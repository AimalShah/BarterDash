import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface MockAuctionWinResponse {
  streamId: string;
  auctionId: string;
  orderId: string;
  orderNumber: string;
}

export interface MockAuctionWinPayload {
  buyerId?: string;
  sellerId?: string;
  bidAmount?: number;
}

export const devService = {
  createMockAuctionWin: async (
    payload: MockAuctionWinPayload = {},
  ): Promise<MockAuctionWinResponse> => {
    const response = await apiClient.post<ApiResponse<MockAuctionWinResponse>>(
      "/dev/mock-auction-win",
      payload,
    );
    return response.data.data;
  },
};
