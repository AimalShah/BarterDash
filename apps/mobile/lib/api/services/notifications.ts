import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface Notification {
    id: string;
    type: string;
    title?: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    actionUrl?: string;
    createdAt: string;
}

export const notificationsService = {
    /**
     * Get user notifications
     */
    getNotifications: async (limit = 50, offset = 0): Promise<Notification[]> => {
        const response = await apiClient.get<ApiResponse<Notification[]>>(
            `/notifications?limit=${limit}&offset=${offset}`
        );
        return response.data.data;
    },

    /**
     * Get count of unread notifications
     */
    getUnreadCount: async (): Promise<number> => {
        const response = await apiClient.get<ApiResponse<{ count: number }>>(
            "/notifications/unread-count"
        );
        return response.data.data.count;
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (notificationId: string): Promise<void> => {
        await apiClient.patch(`/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<void> => {
        await apiClient.patch("/notifications/read-all");
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (notificationId: string): Promise<void> => {
        await apiClient.delete(`/notifications/${notificationId}`);
    },

    /**
     * Register push token for notifications
     */
    registerPushToken: async (token: string, platform: 'ios' | 'android' | 'web'): Promise<void> => {
        await apiClient.post("/notifications/push-token", { token, platform });
    },

    /**
     * Unregister push token
     */
    unregisterPushToken: async (token: string): Promise<void> => {
        await apiClient.delete("/notifications/push-token", { data: { token } });
    },
};
