import apiClient from "../client";
import { ApiResponse } from "../../../types";

export const authService = {
    /**
     * Request password reset email
     */
    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiResponse<{ message: string }>>(
            "/auth/forgot-password",
            { email }
        );
        return response.data.data;
    },

    /**
     * Reset password using token from email
     */
    resetPassword: async (password: string, accessToken: string): Promise<{ message: string }> => {
        const response = await apiClient.post<ApiResponse<{ message: string }>>(
            "/auth/reset-password",
            { password },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data.data;
    },

    /**
     * Sync profile after Supabase auth
     */
    syncProfile: async (data: { username: string; full_name?: string; avatar_url?: string }) => {
        const response = await apiClient.post<ApiResponse<any>>("/auth/sync", data);
        return response.data.data;
    },

    /**
     * Get current user profile
     */
    getProfile: async () => {
        const response = await apiClient.get<ApiResponse<any>>("/auth/me");
        return response.data.data;
    },
};
