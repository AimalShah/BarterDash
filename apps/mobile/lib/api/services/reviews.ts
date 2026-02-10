import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface Review {
    id: string;
    rating: number;
    comment: string;
    reviewerId: string;
    sellerId: string;
    orderId?: string;
    productId?: string;
    createdAt: string;
    reviewer: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
}

export const reviewsService = {
    /**
     * Get reviews for a specific seller
     */
    getSellerReviews: async (sellerId: string): Promise<Review[]> => {
        const response = await apiClient.get<ApiResponse<Review[]>>(
            `/reviews/seller/${sellerId}`
        );
        return response.data.data;
    },

    /**
     * Submit a new review
     */
    createReview: async (payload: {
        sellerId: string;
        rating: number;
        comment: string;
        orderId?: string;
        productId?: string;
    }): Promise<Review> => {
        const response = await apiClient.post<ApiResponse<Review>>(
            "/reviews",
            payload
        );
        return response.data.data;
    },
};
