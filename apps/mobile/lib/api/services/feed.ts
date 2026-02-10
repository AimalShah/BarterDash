import apiClient from "../client";
import { Product, ApiResponse } from "../../../types";

export const feedService = {
    /**
     * Get personalized "For You" feed
     */
    getForYou: async (params?: { limit?: number; offset?: number }): Promise<Product[]> => {
        const response = await apiClient.get<ApiResponse<Product[]>>('/feed/for-you', { params });
        return response.data.data;
    },

    /**
     * Get trending products
     */
    getTrending: async (params?: { limit?: number; offset?: number }): Promise<Product[]> => {
        const response = await apiClient.get<ApiResponse<Product[]>>('/feed/trending', { params });
        return response.data.data;
    },

    /**
     * Track recommendation click
     */
    trackClick: async (productId: string): Promise<boolean> => {
        const response = await apiClient.post<ApiResponse<boolean>>('/feed/track-click', { productId });
        return response.data.data;
    },
};
