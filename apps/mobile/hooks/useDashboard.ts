import { useState, useEffect, useCallback } from "react";
import { productsService } from "../lib/api/services/products";
import { ordersService } from "../lib/api/services/orders";
import { streamsService } from "../lib/api/services/streams";
import { auctionsService } from "../lib/api/services/auctions";
import { analyticsService, AccountHealth, SellerAnalytics } from "../lib/api/services/analytics";
import { sellersService } from "../lib/api/services/sellers";
import { supabase } from "../lib/supabase";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeAuctions: number;
}

interface DashboardData {
  username: string;
  products: any[];
  orders: any[];
  streams: any[];
  auctions: any[];
  stats: DashboardStats;
  analytics: SellerAnalytics | null;
  accountHealth: AccountHealth | null;
  sellerStatus: any;
}

interface UseDashboardReturn extends DashboardData {
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState("Seller");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [accountHealth, setAccountHealth] = useState<AccountHealth | null>(null);
  const [sellerStatus, setSellerStatus] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUsername(
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.user_metadata?.username ||
        "Seller"
      );

      const [
        productsData,
        ordersData,
        streamsData,
        auctionsData,
        analyticsData,
        healthData,
        sellerData,
      ] = await Promise.all([
        productsService.getSellerProducts(user.id).catch(() => []),
        ordersService.getMySales().catch(() => []),
        streamsService.getMyStreams().catch(() => []),
        auctionsService.findAll({ status: "active" }).catch(() => []),
        analyticsService.getSellerAnalytics("30d").catch(() => null),
        analyticsService.getAccountHealth().catch(() => null),
        sellersService.getApplicationStatus().catch(() => null),
      ]);

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setStreams(streamsData || []);
      setAuctions(auctionsData || []);
      setAnalytics(analyticsData);
      setAccountHealth(healthData);
      setSellerStatus(sellerData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats: DashboardStats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(
      (o: any) => o.status === "pending" || o.status === "processing"
    ).length,
    totalRevenue: orders
      .filter((o: any) => o.status === "delivered")
      .reduce((sum: number, o: any) => sum + parseFloat(o.total || "0"), 0),
    activeAuctions: auctions.filter((a: any) => a.status === "active").length,
  };

  return {
    username,
    products,
    orders,
    streams,
    auctions,
    stats,
    analytics,
    accountHealth,
    sellerStatus,
    loading,
    refreshing,
    refresh,
  };
}
