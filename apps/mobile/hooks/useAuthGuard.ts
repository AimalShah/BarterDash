import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

/**
 * Auth Guard Hook
 * Handles authentication-based navigation and redirects
 */
export const useAuthGuard = () => {
  const router = useRouter();
  const segments = useSegments();
  const { profile, isSeller, isAdmin, isOnboarded, canAccessSellerFeatures } = useAuthStore();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inTabs = segments[0] === "(tabs)";
    const isSellerRoute = segments.includes("seller");
    const isAdminRoute = segments.includes("admin");

    // Check if user is authenticated
    if (!profile) {
      if (!inAuthGroup && !inOnboarding) {
        router.replace("/(auth)/landing");
      }
      return;
    }

    // Check onboarding status
    const needsOnboarding = !isOnboarded();
    if (needsOnboarding && !inOnboarding) {
      router.replace("/(onboarding)/profile-setup");
      return;
    }

    // Check seller routes
    if (isSellerRoute && !canAccessSellerFeatures()) {
      if (isSeller()) {
        // User is seller but not onboarded
        router.replace("/(onboarding)/profile-setup");
      } else {
        // User is not a seller
        router.replace("/(tabs)");
      }
      return;
    }

    // Check admin routes
    if (isAdminRoute && !isAdmin()) {
      router.replace("/(tabs)");
      return;
    }

    // If authenticated and onboarded, redirect from auth to main app
    if (inAuthGroup || inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [profile, segments, router, isSeller, isAdmin, isOnboarded, canAccessSellerFeatures]);
};

/**
 * Seller Guard Hook
 * Specifically for seller-only routes
 */
export const useSellerGuard = () => {
  const router = useRouter();
  const { profile, canAccessSellerFeatures } = useAuthStore();

  useEffect(() => {
    if (profile && !canAccessSellerFeatures()) {
      if (profile.isSeller) {
        // Redirect to onboarding
        router.replace("/(onboarding)/profile-setup");
      } else {
        // Redirect to main app
        router.replace("/(tabs)");
      }
    }
  }, [profile, canAccessSellerFeatures, router]);
};

/**
 * Admin Guard Hook
 * Specifically for admin-only routes
 */
export const useAdminGuard = () => {
  const router = useRouter();
  const { profile, isAdmin } = useAuthStore();

  useEffect(() => {
    if (profile && !isAdmin()) {
      router.replace("/(tabs)");
    }
  }, [profile, isAdmin, router]);
};

/**
 * Public Route Guard
 * For routes that should redirect authenticated users to main app
 */
export const usePublicRouteGuard = () => {
  const router = useRouter();
  const segments = useSegments();
  const { profile, isOnboarded } = useAuthStore();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (profile && isOnboarded() && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [profile, isOnboarded, segments, router]);
};
