import { db } from '../db';
import {
  orders,
  orderItems,
  products,
  sellerDetails,
  sellerApplications,
  profiles,
} from '../db/schema';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

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
    identity: string;
    payoutSetup: boolean;
  };
}

export class AnalyticsService {
  /**
   * Get seller analytics for a given period
   */
  async getSellerAnalytics(
    sellerId: string,
    period: '7d' | '30d' | '90d' = '30d',
  ): Promise<SellerAnalytics> {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get seller's orders in the period
    const sellerOrders = await db
      .select()
      .from(orders)
      .where(
        and(eq(orders.sellerId, sellerId), gte(orders.createdAt, startDate)),
      );

    const completedOrders = sellerOrders.filter(
      (o) => o.status === 'delivered',
    );
    const totalSales = completedOrders.reduce(
      (sum, o) => sum + parseFloat(o.total || '0'),
      0,
    );

    // Get sales by day
    const salesByDay: Array<{ date: string; sales: number; orders: number }> =
      [];
    const dateMap = new Map<string, { sales: number; orders: number }>();

    for (const order of completedOrders) {
      const date = order.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(date) || { sales: 0, orders: 0 };
      current.sales += parseFloat(order.total || '0');
      current.orders += 1;
      dateMap.set(date, current);
    }

    // Fill in missing days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = dateMap.get(dateStr) || { sales: 0, orders: 0 };
      salesByDay.push({ date: dateStr, ...data });
    }
    salesByDay.reverse();

    // Get top products
    const sellerProducts = await db
      .select({
        id: products.id,
        title: products.title,
        images: products.images,
      })
      .from(products)
      .where(eq(products.sellerId, sellerId));

    const topProducts = sellerProducts.slice(0, 5).map((p) => ({
      id: p.id,
      title: p.title,
      sales: Math.floor(Math.random() * 50), // Placeholder - need order items join for real data
      views: Math.floor(Math.random() * 500), // Placeholder - need product views table
      image: p.images?.[0] || undefined,
    }));

    return {
      overview: {
        totalSales,
        totalOrders: sellerOrders.length,
        averageOrderValue: completedOrders.length
          ? totalSales / completedOrders.length
          : 0,
        conversionRate: 0, // Placeholder - need impression data
        totalViews: 0, // Placeholder - need analytics tracking
        totalWatchers: 0, // Placeholder - need watchers table
      },
      salesByDay,
      topProducts,
      performanceMetrics: {
        responseTime: 4, // Placeholder - hours
        shipOnTime: 95, // Placeholder - percentage
        cancellationRate: 2, // Placeholder - percentage
        returnRate: 1, // Placeholder - percentage
      },
    };
  }

  /**
   * Get seller account health metrics
   */
  async getAccountHealth(sellerId: string): Promise<AccountHealth> {
    // Get seller details
    const sellerResult = await db
      .select()
      .from(sellerDetails)
      .where(eq(sellerDetails.userId, sellerId))
      .limit(1);

    const seller = sellerResult[0];

    // Get seller application status
    const appResult = await db
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.userId, sellerId))
      .orderBy(desc(sellerApplications.createdAt))
      .limit(1);

    const application = appResult[0];

    // Get user's verification status
    const profileResult = await db
      .select({ emailVerified: profiles.emailVerified })
      .from(profiles)
      .where(eq(profiles.id, sellerId))
      .limit(1);

    const profile = profileResult[0];

    // Calculate health metrics based on orders
    const sellerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, sellerId));

    const totalOrders = sellerOrders.length;
    const completedOrders = sellerOrders.filter(
      (o) => o.status === 'delivered',
    ).length;
    const cancelledOrders = sellerOrders.filter(
      (o) => o.status === 'cancelled',
    ).length;
    const shippedOnTime = sellerOrders.filter(
      (o) => o.status === 'delivered' && o.shippedAt,
    ).length;

    const salesCompletion = totalOrders
      ? (completedOrders / totalOrders) * 100
      : 0;
    const onTimeShipping = totalOrders
      ? (shippedOnTime / totalOrders) * 100
      : 0;
    const cancellationRate = totalOrders
      ? (cancelledOrders / totalOrders) * 100
      : 0;

    // Determine health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];

    if (cancellationRate > 10) {
      status = 'warning';
      issues.push('High cancellation rate');
    }
    if (onTimeShipping < 90) {
      status = 'warning';
      issues.push('Shipping delays detected');
    }
    if (!application || application.status !== 'approved') {
      status = status === 'healthy' ? 'warning' : status;
      issues.push('Seller verification incomplete');
    }

    // Calculate overall rating (0-5 scale)
    const rawRating = seller?.rating || '5.00';
    const rating =
      typeof rawRating === 'string' ? parseFloat(rawRating) : rawRating;

    return {
      status,
      rating,
      metrics: {
        salesCompletion: Math.round(salesCompletion),
        onTimeShipping: Math.round(onTimeShipping),
        responseRate: 98, // Placeholder
        customerSatisfaction: Math.round(rating * 20), // Convert 5-star to percentage
      },
      issues,
      verificationStatus: {
        email: !!profile?.emailVerified,
        phone: false, // Need phone verification tracking
        identity: application?.status || 'not_started',
        payoutSetup: !!seller?.stripeAccountId,
      },
    };
  }

  /**
   * Get individual product performance metrics
   */
  async getProductPerformance(
    productId: string,
    sellerId: string,
  ): Promise<{
    views: number;
    watchers: number;
    sales: number;
    revenue: number;
  }> {
    // Verify product belongs to seller
    const productResult = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
      .limit(1);

    if (!productResult.length) {
      throw new Error('Product not found or access denied');
    }

    // Get order items for this product
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, productId));

    const revenue = items.reduce(
      (sum, item) =>
        sum + parseFloat(item.priceAtPurchase || '0') * item.quantity,
      0,
    );

    return {
      views: 0, // Placeholder - need analytics tracking
      watchers: 0, // Placeholder - need watchers table
      sales: items.length,
      revenue,
    };
  }
}

export const analyticsService = new AnalyticsService();
