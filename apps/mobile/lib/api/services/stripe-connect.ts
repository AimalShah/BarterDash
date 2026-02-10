import api from "../client";
import { ApiResponse } from "../../../types";

// Stripe Connect types
export interface StripeConnectAccount {
    accountId: string;
    onboardingUrl: string;
}

export interface StripeAccountStatus {
    isConnected: boolean;
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    onboardingComplete: boolean;
    accountId: string | null;
}

export interface OnboardingLinkResponse {
    url: string;
}

export interface DashboardLinkResponse {
    url: string;
}

export const stripeConnectService = {
    /**
     * Create a Stripe Connect account for the seller
     * Returns an onboarding URL to redirect the user
     */
    createConnectAccount: async (): Promise<StripeConnectAccount> => {
        const response = await api.post<ApiResponse<StripeConnectAccount>>(
            "/sellers/stripe/connect"
        );
        return response.data.data;
    },

    /**
     * Get a new onboarding link (for resuming setup)
     */
    getOnboardingLink: async (): Promise<OnboardingLinkResponse> => {
        const response = await api.get<ApiResponse<OnboardingLinkResponse>>(
            "/sellers/stripe/onboarding-link"
        );
        return response.data.data;
    },

    /**
     * Get current Connect account status
     */
    getAccountStatus: async (): Promise<StripeAccountStatus> => {
        const response = await api.get<ApiResponse<StripeAccountStatus>>(
            "/sellers/stripe/account-status"
        );
        return response.data.data;
    },

    /**
     * Get Express Dashboard link for managing payouts
     */
    getDashboardLink: async (): Promise<DashboardLinkResponse> => {
        const response = await api.get<ApiResponse<DashboardLinkResponse>>(
            "/sellers/stripe/dashboard-link"
        );
        return response.data.data;
    },
};
