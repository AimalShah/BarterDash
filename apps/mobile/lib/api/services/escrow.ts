import api from "../client";
import { ApiResponse } from "../../../types";

// Escrow types
export interface EscrowTransaction {
    id: string;
    orderId: string;
    buyerId: string;
    sellerId: string;
    amount: string;
    platformFee: string;
    sellerAmount: string;
    currency: string;
    status: 'pending' | 'held' | 'releasing' | 'released' | 'refunding' | 'refunded' | 'disputed' | 'cancelled';
    stripePaymentIntentId?: string;
    stripeTransferId?: string;
    stripeRefundId?: string;
    heldAt?: string;
    releasedAt?: string;
    refundedAt?: string;
    releaseScheduledAt?: string;
    releaseReason?: string;
    refundReason?: string;
    disputeId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEscrowResponse {
    clientSecret: string | null;
    paymentIntentId: string;
    escrowId: string;
    customer: string;
    ephemeralKey: string;
}

export interface ReleaseEscrowResponse {
    escrowId: string;
    transferId: string;
    sellerAmount: string;
}

export interface RefundEscrowResponse {
    escrowId: string;
    refundId: string;
    amount: string;
}

export const escrowService = {
    /**
     * Create an escrow payment for an order
     * Returns clientSecret to confirm payment on frontend
     */
    createEscrowPayment: async (orderId: string): Promise<CreateEscrowResponse> => {
        const response = await api.post<ApiResponse<CreateEscrowResponse>>(
            "/escrow/create",
            { orderId }
        );
        return response.data.data;
    },

    /**
     * Get escrow details by ID
     */
    getEscrow: async (escrowId: string): Promise<EscrowTransaction> => {
        const response = await api.get<ApiResponse<EscrowTransaction>>(
            `/escrow/${escrowId}`
        );
        return response.data.data;
    },

    /**
     * Get escrow by order ID
     */
    getEscrowByOrder: async (orderId: string): Promise<EscrowTransaction> => {
        const response = await api.get<ApiResponse<EscrowTransaction>>(
            `/escrow/order/${orderId}`
        );
        return response.data.data;
    },

    /**
     * Release escrow to seller (called after delivery confirmation)
     */
    releaseEscrow: async (
        escrowId: string,
        reason: 'delivery_confirmed' | 'auto_release' | 'dispute_resolved' | 'admin_override'
    ): Promise<ReleaseEscrowResponse> => {
        const response = await api.post<ApiResponse<ReleaseEscrowResponse>>(
            `/escrow/release/${escrowId}`,
            { reason }
        );
        return response.data.data;
    },

    /**
     * Refund escrow to buyer
     */
    refundEscrow: async (escrowId: string, reason: string): Promise<RefundEscrowResponse> => {
        const response = await api.post<ApiResponse<RefundEscrowResponse>>(
            `/escrow/refund/${escrowId}`,
            { reason }
        );
        return response.data.data;
    },
};
