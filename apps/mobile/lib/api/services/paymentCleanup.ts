import api from "../client";
import { ApiResponse } from "../../../types";

export interface PaymentCleanupResult {
  paymentIntentId: string;
  status: 'cancelled' | 'failed_to_cancel' | 'already_completed';
  message: string;
  refundId?: string;
  escrowId?: string;
  escrowStatus?: 'cancelled' | 'refunded';
}

export interface CancelPaymentPayload {
  paymentIntentId: string;
  reason?: string;
  cancelEscrow?: boolean;
}

export interface PaymentIntentStatus {
  id: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  amount: number;
  currency: string;
  created: number;
  metadata?: Record<string, string>;
  escrowId?: string;
}

/**
 * Payment Cleanup Service
 * Handles cancellation and cleanup of payment intents and related resources
 */
export const paymentCleanupService = {
  /**
   * Cancel a payment intent and clean up associated resources
   */
  cancelPaymentIntent: async (payload: CancelPaymentPayload): Promise<PaymentCleanupResult> => {
    const response = await api.post<ApiResponse<PaymentCleanupResult>>(
      "/payments/cancel-intent",
      payload
    );
    return response.data.data;
  },

  /**
   * Get the current status of a payment intent
   */
  getPaymentIntentStatus: async (paymentIntentId: string): Promise<PaymentIntentStatus> => {
    const response = await api.get<ApiResponse<PaymentIntentStatus>>(
      `/payments/intent-status/${paymentIntentId}`
    );
    return response.data.data;
  },

  /**
   * Clean up orphaned payment intents for a user
   * This can be called when the app starts to clean up any incomplete payments
   */
  cleanupOrphanedPayments: async (): Promise<{ cleaned: number; errors: string[] }> => {
    const response = await api.post<ApiResponse<{ cleaned: number; errors: string[] }>>(
      "/payments/cleanup-orphaned"
    );
    return response.data.data;
  },

  /**
   * Cancel payment sheet session
   * Used when user cancels during payment sheet flow
   */
  cancelPaymentSheet: async (paymentIntentId: string): Promise<PaymentCleanupResult> => {
    const response = await api.post<ApiResponse<PaymentCleanupResult>>(
      "/payments/cancel-payment-sheet",
      { paymentIntentId }
    );
    return response.data.data;
  },

  /**
   * Validate if a payment intent can be safely cancelled
   */
  canCancelPaymentIntent: async (paymentIntentId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    status: string;
  }> => {
    const response = await api.get<ApiResponse<{
      canCancel: boolean;
      reason?: string;
      status: string;
    }>>(`/payments/can-cancel/${paymentIntentId}`);
    return response.data.data;
  },
};

/**
 * Utility functions for payment cleanup
 */

/**
 * Check if a payment intent is in a cancellable state
 */
export const isCancellableStatus = (status: string): boolean => {
  const cancellableStatuses = [
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
  ];
  return cancellableStatuses.includes(status);
};

/**
 * Check if a payment intent is completed (succeeded or failed)
 */
export const isCompletedStatus = (status: string): boolean => {
  const completedStatuses = ['succeeded', 'canceled'];
  return completedStatuses.includes(status);
};

/**
 * Get user-friendly cancellation reason
 */
export const getCancellationReason = (reason?: string): string => {
  const reasons: Record<string, string> = {
    user_cancelled: 'Cancelled by user',
    timeout: 'Payment timed out',
    duplicate_prevention: 'Duplicate payment prevented',
    app_backgrounded: 'App was backgrounded during payment',
    network_error: 'Network connection lost',
    authentication_failed: 'Authentication failed',
    insufficient_funds: 'Insufficient funds',
    card_declined: 'Card was declined',
    general_error: 'Payment error occurred',
  };
  
  return reasons[reason || 'user_cancelled'] || 'Payment was cancelled';
};

/**
 * Determine if cleanup should include escrow cancellation
 */
export const shouldCancelEscrow = (
  paymentStatus: string,
  escrowId?: string,
  reason?: string
): boolean => {
  // Don't cancel escrow if payment already succeeded
  if (paymentStatus === 'succeeded') {
    return false;
  }
  
  // Don't cancel if no escrow exists
  if (!escrowId) {
    return false;
  }
  
  // Cancel escrow for user cancellations and errors
  const escrowCancellationReasons = [
    'user_cancelled',
    'timeout',
    'network_error',
    'authentication_failed',
    'general_error',
  ];
  
  return escrowCancellationReasons.includes(reason || 'user_cancelled');
};