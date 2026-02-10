import api from "../client";
import { CreatePaymentIntentPayload, ApiResponse } from "../../../types";

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  fingerprint: string;
}

export interface SavePaymentMethodPayload {
  stripePaymentMethodId: string;
  isDefault?: boolean;
}

export interface CreatePaymentSheetPayload {
  orderId: string;
  amount: number;
  currency?: string;
  automaticPaymentMethods?: boolean;
  setupFutureUsage?: 'on_session' | 'off_session';
}

export interface PaymentSheetResponse {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
}

export interface CreateSetupIntentPayload {
  setAsDefault?: boolean;
}

export interface SetupIntentResponse {
  setupIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
}

export interface CreatePaymentIntentWithMethodPayload {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
}

export interface ConfirmPaymentIntentPayload {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface PaymentConfirmationResponse {
  status: string;
  clientSecret?: string;
  nextAction?: any;
}

export const paymentsService = {
  createIntent: async (
    payload: CreatePaymentIntentPayload,
  ): Promise<{ clientSecret: string | null; id: string }> => {
    const normalizedPayload = {
      auction_id: (payload as any).auction_id ?? (payload as any).auctionId,
      order_id: (payload as any).order_id,
      amount: payload.amount,
    };

    const response = await api.post<ApiResponse<{ clientSecret: string | null; id: string }>>(
      "/payments/create-intent",
      normalizedPayload,
    );
    return response.data.data;
  },

  createCheckoutSession: async (orderId: string): Promise<{ url: string; sessionId: string }> => {
    const response = await api.post<ApiResponse<{ url: string; sessionId: string }>>(
      "/payments/create-checkout-session",
      { orderId }
    );
    return response.data.data;
  },

  // Payment Sheet Support
  createPaymentSheet: async (payload: CreatePaymentSheetPayload): Promise<PaymentSheetResponse> => {
    const response = await api.post<ApiResponse<PaymentSheetResponse>>(
      "/payments/payment-sheet",
      payload
    );
    return response.data.data;
  },

  // Setup Intent Support (Add Payment Method)
  createSetupIntent: async (payload: CreateSetupIntentPayload = {}): Promise<SetupIntentResponse> => {
    const response = await api.post<ApiResponse<SetupIntentResponse>>(
      "/payments/setup-intent",
      payload
    );
    return response.data.data;
  },

  createPaymentIntentWithMethod: async (
    payload: CreatePaymentIntentWithMethodPayload
  ): Promise<{ clientSecret: string | null; id: string }> => {
    const response = await api.post<ApiResponse<{ clientSecret: string | null; id: string }>>(
      "/payments/create-intent-with-method",
      payload
    );
    return response.data.data;
  },

  confirmPaymentIntent: async (
    payload: ConfirmPaymentIntentPayload
  ): Promise<PaymentConfirmationResponse> => {
    const response = await api.post<ApiResponse<PaymentConfirmationResponse>>(
      "/payments/confirm-intent",
      payload
    );
    return response.data.data;
  },

  // Payment Method Management
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>("/payments/methods");
    return response.data.data;
  },

  savePaymentMethod: async (payload: SavePaymentMethodPayload): Promise<PaymentMethod> => {
    const normalizedPayload = {
      paymentMethodId: payload.stripePaymentMethodId,
      setAsDefault: payload.isDefault,
    };

    const response = await api.post<ApiResponse<PaymentMethod>>(
      "/payments/methods",
      normalizedPayload
    );
    return response.data.data;
  },

  deletePaymentMethod: async (methodId: string): Promise<void> => {
    await api.delete(`/payments/methods/${methodId}`);
  },

  setDefaultPaymentMethod: async (methodId: string): Promise<void> => {
    await api.put(`/payments/methods/${methodId}/default`);
  },
};
