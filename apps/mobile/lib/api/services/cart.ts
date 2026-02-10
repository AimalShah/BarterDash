import apiClient from "../client";
import { CartItem, CartTotal, ShippingAddress, ApiResponse } from "../../../types";

export const cartService = {
    getCart: async (): Promise<CartItem[]> => {
        const response = await apiClient.get<ApiResponse<CartItem[]>>("/cart");
        return response.data.data;
    },

    addItem: async (productId: string, quantity: number = 1): Promise<CartItem> => {
        const response = await apiClient.post<ApiResponse<CartItem>>("/cart", {
            productId,
            quantity,
        });
        return response.data.data;
    },

    updateQuantity: async (cartItemId: string, quantity: number): Promise<CartItem> => {
        const response = await apiClient.put<ApiResponse<CartItem>>(`/cart/${cartItemId}`, {
            quantity,
        });
        return response.data.data;
    },

    removeItem: async (cartItemId: string): Promise<boolean> => {
        const response = await apiClient.delete<ApiResponse<boolean>>(`/cart/${cartItemId}`);
        return response.data.data;
    },

    clearCart: async (): Promise<boolean> => {
        const response = await apiClient.delete<ApiResponse<boolean>>("/cart");
        return response.data.data;
    },

    getItemCount: async (): Promise<number> => {
        const response = await apiClient.get<ApiResponse<number>>("/cart/count");
        return response.data.data;
    },

    validateCart: async (): Promise<{ validItems: CartItem[], invalidItems: CartItem[] }> => {
        const response = await apiClient.get<ApiResponse<{ validItems: CartItem[], invalidItems: CartItem[] }>>("/cart/validate");
        return response.data.data;
    },

    calculateTotal: async (): Promise<CartTotal> => {
        const response = await apiClient.get<ApiResponse<CartTotal>>("/cart/total");
        return response.data.data;
    },

    checkout: async (shippingAddress: ShippingAddress): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>("/cart/checkout", {
            shippingAddress,
        });
        return response.data.data;
    },
};