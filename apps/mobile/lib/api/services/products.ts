import apiClient from "../client";
import { Product, ApiResponse } from "../../../types";

export interface CreateProductPayload {
    title: string;
    description?: string;
    categoryId?: string;
    condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    startingBid?: string;
    buyNowPrice?: string;
    reservePrice?: string;
    quantity?: number;
    shippingCost?: string;
    images?: string[];
}

export const productsService = {
    /**
     * Get all products with optional filters
     */
    findAll: async (query?: Record<string, any>): Promise<Product[]> => {
        const response = await apiClient.get<ApiResponse<Product[]>>("/products", { params: query });
        return response.data.data;
    },

    /**
     * Get product by ID
     */
    findById: async (id: string): Promise<Product> => {
        const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data.data;
    },

    /**
     * Create a new product (seller only)
     */
    create: async (payload: CreateProductPayload): Promise<Product> => {
        // Normalize to snake_case for backend
        const normalizedPayload = {
            title: payload.title,
            description: payload.description,
            category_id: payload.categoryId,
            condition: payload.condition,
            starting_bid: payload.startingBid,
            buy_now_price: payload.buyNowPrice,
            reserve_price: payload.reservePrice,
            quantity: payload.quantity,
            shipping_cost: payload.shippingCost,
            images: payload.images,
        };
        const response = await apiClient.post<ApiResponse<Product>>("/products", normalizedPayload);
        return response.data.data;
    },

    /**
     * Update a product (seller only)
     */
    update: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
        const normalizedPayload: any = {};
        if (payload.title) normalizedPayload.title = payload.title;
        if (payload.description) normalizedPayload.description = payload.description;
        if (payload.categoryId) normalizedPayload.category_id = payload.categoryId;
        if (payload.condition) normalizedPayload.condition = payload.condition;
        if (payload.startingBid) normalizedPayload.starting_bid = payload.startingBid;
        if (payload.buyNowPrice) normalizedPayload.buy_now_price = payload.buyNowPrice;
        if (payload.reservePrice) normalizedPayload.reserve_price = payload.reservePrice;
        if (payload.quantity) normalizedPayload.quantity = payload.quantity;
        if (payload.shippingCost) normalizedPayload.shipping_cost = payload.shippingCost;
        if (payload.images) normalizedPayload.images = payload.images;
        
        const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, normalizedPayload);
        return response.data.data;
    },

    /**
     * Delete a product (seller only)
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/products/${id}`);
    },

    /**
     * Get products by seller ID
     */
    getSellerProducts: async (sellerId: string): Promise<Product[]> => {
        const response = await apiClient.get<ApiResponse<Product[]>>(`/products/seller/${sellerId}`);
        return response.data.data;
    },

    /**
     * Get my products (current seller)
     */
    getMyProducts: async (): Promise<Product[]> => {
        const response = await apiClient.get<ApiResponse<Product[]>>("/products/my-products");
        return response.data.data;
    },
};
