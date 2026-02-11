import apiClient from "../client";
import { Order, ApiResponse } from "../../../types";

export const ordersService = {
    getMyOrders: async (): Promise<Order[]> => {
        const response = await apiClient.get<ApiResponse<Order[]>>("/orders/my-orders");
        return response.data.data;
    },

    getMySales: async (): Promise<Order[]> => {
        const response = await apiClient.get<ApiResponse<Order[]>>("/orders/my-sales");
        return response.data.data;
    },

    getOrder: async (id: string): Promise<Order> => {
        const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
        return response.data.data;
    },

    updateStatus: async (id: string, status: string): Promise<Order> => {
        const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
        return response.data.data;
    },

    generateLabel: async (id: string): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>(`/orders/${id}/label`, {});
        return response.data.data;
    },

    updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
        const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}`, data);
        return response.data.data;
    },
};
