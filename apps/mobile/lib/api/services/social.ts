import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface FollowersResponse {
    followers: { id: string; username: string; avatar_url?: string }[];
    count: number;
}

export interface FollowingResponse {
    following: { id: string; username: string; avatar_url?: string }[];
    count: number;
}

export interface SocialStats {
    followers_count: number;
    following_count: number;
    is_following?: boolean;
}

export const socialService = {
    /**
     * Follow a user
     */
    follow: async (userId: string): Promise<void> => {
        await apiClient.post(`/social/follow/${userId}`);
    },

    /**
     * Unfollow a user
     */
    unfollow: async (userId: string): Promise<void> => {
        await apiClient.delete(`/social/unfollow/${userId}`);
    },

    /**
     * Get followers of a user
     */
    getFollowers: async (userId: string): Promise<FollowersResponse> => {
        const response = await apiClient.get<ApiResponse<FollowersResponse>>(
            `/social/followers/${userId}`
        );
        return response.data.data;
    },

    /**
     * Get users that a user is following
     */
    getFollowing: async (userId: string): Promise<FollowingResponse> => {
        const response = await apiClient.get<ApiResponse<FollowingResponse>>(
            `/social/following/${userId}`
        );
        return response.data.data;
    },

    /**
     * Get social stats for a user (followers count, following count)
     */
    getStats: async (userId: string): Promise<SocialStats> => {
        try {
            const response = await apiClient.get<ApiResponse<SocialStats>>(
                `/social/stats/${userId}`
            );
            return response.data.data;
        } catch (error) {
            // Return zeros on error (endpoints might not exist yet)
            return {
                followers_count: 0,
                following_count: 0,
            };
        }
    },

    /**
     * Check if current user is following a specific user
     */
    isFollowing: async (userId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get<ApiResponse<{ isFollowing: boolean }>>(
                `/social/is-following/${userId}`
            );
            return response.data.data.isFollowing;
        } catch (error) {
            // Assume not following on error
            return false;
        }
    },
};
