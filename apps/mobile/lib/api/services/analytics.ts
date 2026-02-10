import apiClient from "../client";

export interface SellerAnalytics {
    overview: {
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        conversionRate: number;
        totalViews: number;
        totalWatchers: number;
    };
    salesByDay: Array<{
        date: string;
        sales: number;
        orders: number;
    }>;
    topProducts: Array<{
        id: string;
        title: string;
        sales: number;
        views: number;
        image?: string;
    }>;
    performanceMetrics: {
        responseTime: number;
        shipOnTime: number;
        cancellationRate: number;
        returnRate: number;
    };
}

export interface AccountHealth {
    status: 'healthy' | 'warning' | 'critical';
    rating: number;
    metrics: {
        salesCompletion: number;
        onTimeShipping: number;
        responseRate: number;
        customerSatisfaction: number;
    };
    issues: string[];
    verificationStatus: {
        email: boolean;
        phone: boolean;
        identity: string; // 'pending' | 'verified' | 'rejected'
        payoutSetup: boolean;
    };
}

export const analyticsService = {
    getSellerAnalytics: async (period: '7d' | '30d' | '90d' = '30d'): Promise<SellerAnalytics> => {
        const response = await apiClient.get<{ success: boolean; data: SellerAnalytics }>(`/analytics/seller?period=${period}`);
        return response.data.data;
    },

    getAccountHealth: async (): Promise<AccountHealth> => {
        const response = await apiClient.get<{ success: boolean; data: AccountHealth }>('/analytics/account-health');
        return response.data.data;
    },

    getProductPerformance: async (productId: string): Promise<{
        views: number;
        watchers: number;
        sales: number;
        revenue: number;
    }> => {
        const response = await apiClient.get<{ success: boolean; data: any }>(`/analytics/products/${productId}`);
        return response.data.data;
    },
};
