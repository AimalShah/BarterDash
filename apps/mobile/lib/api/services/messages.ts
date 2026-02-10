import apiClient from "../client";
import { ApiResponse } from "../../../types";

export interface Conversation {
    id: string;
    otherUser: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
    lastMessage: {
        content: string;
        createdAt: string;
        isRead: boolean;
    } | null;
    unreadCount: number;
    lastMessageAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        username: string;
        avatarUrl?: string;
    };
    content: string;
    isRead: boolean;
    createdAt: string;
}

export const messagesService = {
    /**
     * Get all conversations
     */
    getConversations: async (): Promise<Conversation[]> => {
        const response = await apiClient.get<ApiResponse<Conversation[]>>(
            "/messages/conversations"
        );
        return response.data.data;
    },

    /**
     * Get messages in a conversation
     */
    getMessages: async (conversationId: string, limit = 50, offset = 0): Promise<Message[]> => {
        const response = await apiClient.get<ApiResponse<Message[]>>(
            `/messages/conversations/${conversationId}?limit=${limit}&offset=${offset}`
        );
        return response.data.data;
    },

    /**
     * Send a message
     */
    sendMessage: async (conversationId: string, content: string): Promise<Message> => {
        const response = await apiClient.post<ApiResponse<Message>>(
            `/messages/conversations/${conversationId}`,
            { content }
        );
        return response.data.data;
    },

    /**
     * Start a new conversation
     */
    startConversation: async (userId: string): Promise<Conversation> => {
        const response = await apiClient.post<ApiResponse<Conversation>>(
            "/messages/start",
            { userId }
        );
        return response.data.data;
    },

    /**
     * Mark messages as read
     */
    markAsRead: async (conversationId: string): Promise<void> => {
        await apiClient.patch(`/messages/conversations/${conversationId}/read`);
    },

    /**
     * Get unread messages count
     */
    getUnreadCount: async (): Promise<number> => {
        const response = await apiClient.get<ApiResponse<number>>("/messages/unread-count");
        return response.data.data;
    },
};
