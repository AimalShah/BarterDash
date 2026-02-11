import { useState, useEffect, useCallback } from "react";
import { usersService } from "../lib/api/services/users";
import { socialService } from "../lib/api/services/social";
import { productsService } from "../lib/api/services/products";
import { supabase } from "../lib/supabase";

interface SellerStats {
  followers: number;
  following: number;
  products: number;
}

interface UseSellerProfileReturn {
  seller: any;
  stats: SellerStats;
  isFollowing: boolean;
  followLoading: boolean;
  products: any[];
  currentUserId: string | null;
  loading: boolean;
  fetchSellerData: () => Promise<void>;
  toggleFollow: () => Promise<void>;
}

export function useSellerProfile(sellerId: string, visible: boolean): UseSellerProfileReturn {
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [stats, setStats] = useState<SellerStats>({ followers: 0, following: 0, products: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  }, []);

  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, socialStats, productsData, following] = await Promise.all([
        usersService.getProfile(sellerId).catch(() => null),
        socialService.getStats(sellerId).catch(() => ({ followers_count: 0, following_count: 0 })),
        productsService.getSellerProducts(sellerId).catch(() => []),
        socialService.isFollowing(sellerId).catch(() => false),
      ]);

      setSeller(userData);
      setStats({
        followers: socialStats.followers_count,
        following: socialStats.following_count,
        products: productsData.length,
      });
      setProducts(productsData.slice(0, 6));
      setIsFollowing(following);
    } catch (error) {
      console.error("Error fetching seller data:", error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (visible && sellerId) {
      fetchSellerData();
      getCurrentUser();
    }
  }, [visible, sellerId, fetchSellerData, getCurrentUser]);

  const toggleFollow = useCallback(async () => {
    if (followLoading || currentUserId === sellerId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollow(sellerId);
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        await socialService.follow(sellerId);
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  }, [followLoading, currentUserId, sellerId, isFollowing]);

  return {
    seller,
    stats,
    isFollowing,
    followLoading,
    products,
    currentUserId,
    loading,
    fetchSellerData,
    toggleFollow,
  };
}
