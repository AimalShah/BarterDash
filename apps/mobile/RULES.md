# BarterDash Mobile App - Complete Refactor & Fix Plan

## 🎯 Executive Summary

This document outlines a comprehensive plan to fix the broken user experience, navigation flow, design inconsistencies, and architecture issues in the BarterDash mobile app.

---

## 🚨 Critical Issues Identified

### 1. **Broken Navigation Flow**
- Non-sellers seeing seller dashboard
- No proper role-based routing
- Missing navigation guards
- Inconsistent back navigation

### 2. **Poor UI/UX**
- Janky layouts
- Inconsistent spacing and typography
- No loading states
- Missing error boundaries
- Poor mobile responsiveness

### 3. **Architecture Problems**
- Mixed state management (Context + Zustand)
- Incomplete API integration
- Missing real-time subscriptions
- No proper auth flow

### 4. **Design System Issues**
- Duplicate component files (components/ vs components/ui/)
- Inconsistent Tailwind usage
- No design tokens
- Missing component library

---

## 📋 Phase 1: Foundation & Cleanup (Days 1-2)

### Task 1.1: Clean Up Project Structure

**DELETE these duplicate/unused files:**
```bash
# Remove duplicate components
rm -rf components/Button.tsx
rm -rf components/Card.tsx
rm -rf components/Input.tsx

# Keep only components/ui/* and components/stream/*
```

**KEEP this structure:**
```
components/
├── ui/              # All reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Header.tsx
│   ├── Text.tsx
│   ├── LoadingSpinner.tsx    # ADD
│   ├── ErrorBoundary.tsx     # ADD
│   └── EmptyState.tsx        # ADD
└── stream/          # Stream-specific components
    ├── StreamCard.tsx        # ADD
    ├── AuctionCard.tsx
    ├── ChatBox.tsx
    ├── ProductCard.tsx
    ├── SellerStreamViewStream.tsx
    └── ViewerStreamViewStream.tsx
```

### Task 1.2: Create Design System

**Create:** `constants/theme.ts`
```typescript
export const theme = {
  colors: {
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
    },
    background: {
      primary: '#020617',    // slate-950
      secondary: '#0F172A',  // slate-900
      tertiary: '#1E293B',   // slate-800
    },
    text: {
      primary: '#F8FAFC',    // slate-50
      secondary: '#CBD5E1',  // slate-300
      tertiary: '#64748B',   // slate-500
    },
    status: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
};
```

### Task 1.3: Update Tailwind Config

**Update:** `tailwind.config.js`
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        background: {
          primary: '#020617',
          secondary: '#0F172A',
          tertiary: '#1E293B',
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
```

---

## 📋 Phase 2: Fix Authentication & Routing (Days 3-4)

### Task 2.1: Implement Proper Auth Flow

**Update:** `app/_layout.tsx`
```typescript
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inTabs = segments[0] === "(tabs)";

    if (!session && !inAuthGroup) {
      // Not logged in, redirect to auth
      router.replace("/(auth)/landing");
    } else if (session && inAuthGroup) {
      // Logged in but on auth screen, check onboarding status
      checkOnboardingStatus(session.user.id);
    } else if (session && !inOnboarding && !inTabs) {
      // Logged in, check if needs onboarding
      checkOnboardingStatus(session.user.id);
    }
  }, [session, segments, isLoading]);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, fullName')
        .eq('id', userId)
        .single();

      if (!profile?.username || !profile?.fullName) {
        // Needs onboarding
        router.replace("/(onboarding)/profile-setup");
      } else {
        // All good, go to main app
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      router.replace("/(tabs)");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="seller" />
      <Stack.Screen name="stream/[id]" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
```

### Task 2.2: Add Auth Guards

**Create:** `components/guards/AuthGuard.tsx`
```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        router.replace('/(auth)/landing');
      }
    });
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return session ? <>{children}</> : null;
}
```

**Create:** `components/guards/SellerGuard.tsx`
```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { View, ActivityIndicator, Text } from 'react-native';

export function SellerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/(auth)/landing');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('isSeller, sellerTier')
        .eq('id', user.id)
        .single();

      if (!profile?.isSeller) {
        // Not a seller, redirect to registration
        router.replace('/seller/register');
        return;
      }

      setIsSeller(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking seller status:', error);
      router.replace('/(tabs)');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isSeller) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-white text-lg">Checking seller status...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
```

### Task 2.3: Fix Tab Navigation

**Update:** `app/(tabs)/_layout.tsx`
```typescript
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Tabs, router } from "expo-router";
import { Home, Play, Plus, ShoppingCart, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: Platform.OS === 'ios' ? -20 : -30,
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View className="w-16 h-16 rounded-full bg-primary-500 items-center justify-center shadow-lg">
      {children}
    </View>
  </TouchableOpacity>
);

export default function TabLayout() {
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('isSeller')
        .eq('id', user.id)
        .single();

      setIsSeller(profile?.isSeller || false);
    } catch (error) {
      console.error('Error checking seller status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerAction = () => {
    if (isSeller) {
      router.push('/seller/dashboard');
    } else {
      router.push('/seller/register');
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopWidth: 1,
          borderTopColor: "#1E293B",
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Play size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell_action"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <Plus size={32} color="#FFFFFF" />,
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={handleSellerAction} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 📋 Phase 3: Redesign Core Screens (Days 5-7)

### Task 3.1: Fix Home/Feed Screen

**Update:** `app/(tabs)/index.tsx`
```typescript
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Filter, Bell } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import StreamCard from "../../components/stream/StreamCard";
import { theme } from "../../constants/theme";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const router = useRouter();

  const categories = [
    { id: "all", name: "All" },
    { id: "electronics", name: "Electronics" },
    { id: "fashion", name: "Fashion" },
    { id: "collectibles", name: "Collectibles" },
    { id: "sneakers", name: "Sneakers" },
  ];

  useEffect(() => {
    fetchStreams();
    setupRealtimeSubscription();
  }, [selectedCategory]);

  const fetchStreams = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch live streams
      let liveQuery = supabase
        .from("streams")
        .select(
          `
          *,
          seller:profiles!seller_id(id, username, avatarUrl),
          category:categories(id, name)
        `
        )
        .eq("status", "live")
        .order("viewerCount", { ascending: false })
        .limit(10);

      if (selectedCategory !== "all") {
        liveQuery = liveQuery.eq("category.slug", selectedCategory);
      }

      const { data: live } = await liveQuery;

      // Fetch upcoming streams
      let upcomingQuery = supabase
        .from("streams")
        .select(
          `
          *,
          seller:profiles!seller_id(id, username, avatarUrl),
          category:categories(id, name)
        `
        )
        .eq("status", "scheduled")
        .gte("scheduledStart", new Date().toISOString())
        .order("scheduledStart", { ascending: true })
        .limit(10);

      if (selectedCategory !== "all") {
        upcomingQuery = upcomingQuery.eq("category.slug", selectedCategory);
      }

      const { data: upcoming } = await upcomingQuery;

      setLiveStreams(live || []);
      setUpcomingStreams(upcoming || []);
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("streams-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "streams",
        },
        () => {
          fetchStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onRefresh = () => {
    fetchStreams(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="px-4 py-4 border-b border-background-tertiary">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text-primary text-2xl font-bold">
              BarterDash
            </Text>
            <Text className="text-text-tertiary text-sm">
              Live Shopping Experience
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="w-10 h-10 rounded-full bg-background-tertiary items-center justify-center"
          >
            <Bell size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <View className="py-3 border-b border-background-tertiary">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedCategory === category.id
                  ? "bg-primary-500"
                  : "bg-background-tertiary"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-text-tertiary"
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <View className="mt-6">
            <View className="px-4 mb-4 flex-row items-center">
              <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
              <Text className="text-text-primary text-xl font-bold">
                Live Now
              </Text>
              <Text className="text-text-tertiary text-sm ml-2">
                ({liveStreams.length})
              </Text>
            </View>
            <FlatList
              data={liveStreams}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="px-4 mb-4">
                  <StreamCard stream={item} isLive={true} />
                </View>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={width - 32}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 16 }}
            />
          </View>
        )}

        {/* Upcoming Streams */}
        {upcomingStreams.length > 0 && (
          <View className="mt-6 mb-6">
            <View className="px-4 mb-4">
              <Text className="text-text-primary text-xl font-bold">
                Coming Up
              </Text>
              <Text className="text-text-tertiary text-sm">
                {upcomingStreams.length} scheduled
              </Text>
            </View>
            {upcomingStreams.map((stream) => (
              <View key={stream.id} className="px-4 mb-4">
                <StreamCard stream={stream} isLive={false} />
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading &&
          liveStreams.length === 0 &&
          upcomingStreams.length === 0 && (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Text className="text-text-secondary text-lg mb-2 text-center">
                No streams available
              </Text>
              <Text className="text-text-tertiary text-sm text-center">
                Check back later for new live streams
              </Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Task 3.2: Create StreamCard Component

**Create:** `components/stream/StreamCard.tsx`
```typescript
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Users, Clock } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";

const { width } = Dimensions.get("window");

interface StreamCardProps {
  stream: any;
  isLive: boolean;
}

export default function StreamCard({ stream, isLive }: StreamCardProps) {
  const router = useRouter();

  const getTimeDisplay = () => {
    if (isLive) {
      return `${stream.viewerCount || 0} watching`;
    }
    if (stream.scheduledStart) {
      return `Starts ${formatDistanceToNow(new Date(stream.scheduledStart), {
        addSuffix: true,
      })}`;
    }
    return "";
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/stream/${stream.id}`)}
      className="bg-background-secondary rounded-2xl overflow-hidden"
      style={{ width: isLive ? width - 64 : width - 32 }}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View className="relative">
        <Image
          source={{
            uri: stream.thumbnailUrl || "https://via.placeholder.com/400x225",
          }}
          className="w-full h-48"
          resizeMode="cover"
        />

        {/* Live Badge */}
        {isLive && (
          <View className="absolute top-3 left-3 bg-red-600 px-3 py-1 rounded-full flex-row items-center">
            <View className="w-2 h-2 bg-white rounded-full mr-2" />
            <Text className="text-white font-bold text-xs">LIVE</Text>
          </View>
        )}

        {/* Upcoming Badge */}
        {!isLive && (
          <View className="absolute top-3 left-3 bg-primary-500 px-3 py-1 rounded-full flex-row items-center">
            <Clock size={12} color="#fff" />
            <Text className="text-white font-bold text-xs ml-1">UPCOMING</Text>
          </View>
        )}

        {/* Viewer Count */}
        {isLive && (
          <View className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex-row items-center">
            <Users size={12} color="#fff" />
            <Text className="text-white font-semibold text-xs ml-1">
              {stream.viewerCount}
            </Text>
          </View>
        )}

        {/* Category */}
        {stream.category && (
          <View className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {stream.category.name}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Seller Info */}
        <View className="flex-row items-center mb-3">
          <Image
            source={{
              uri: stream.seller?.avatarUrl || "https://via.placeholder.com/40",
            }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="text-text-primary font-semibold text-base">
              {stream.seller?.username}
            </Text>
            <Text className="text-text-tertiary text-xs">{getTimeDisplay()}</Text>
          </View>
        </View>

        {/* Title */}
        <Text
          className="text-text-primary font-bold text-base mb-2"
          numberOfLines={2}
        >
          {stream.title}
        </Text>

        {/* Description */}
        {stream.description && (
          <Text
            className="text-text-secondary text-sm"
            numberOfLines={2}
          >
            {stream.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

### Task 3.3: Fix Seller Dashboard

**Update:** `app/seller/dashboard.tsx`
```typescript
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Video, Plus, DollarSign, TrendingUp, Package } from "lucide-react-native";
import { SellerGuard } from "../../components/guards/SellerGuard";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeStreams: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch seller details
      const { data: details } = await supabase
        .from("sellerDetails")
        .select("totalRevenue")
        .eq("userId", user.id)
        .single();

      // Count active streams
      const { count: streams } = await supabase
        .from("streams")
        .select("*", { count: "exact", head: true })
        .eq("sellerId", user.id)
        .eq("status", "live");

      // Count products
      const { count: products } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("sellerId", user.id)
        .eq("status", "active");

      // Count pending orders
      const { count: orders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("sellerId", user.id)
        .eq("status", "pending");

      setStats({
        totalRevenue: parseFloat(details?.totalRevenue || "0"),
        activeStreams: streams || 0,
        totalProducts: products || 0,
        pendingOrders: orders || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <SellerGuard>
      <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View className="px-6 py-4 border-b border-background-tertiary">
          <Text className="text-text-primary text-2xl font-bold">
            Seller Dashboard
          </Text>
          <Text className="
          text-text-tertiary text-sm mt-1">
            Manage your streams and products
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <View className="px-6 py-6">
            <Text className="text-text-primary text-lg font-bold mb-4">
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.push("/seller/go-live")}
                className="flex-1 bg-primary-500 rounded-xl p-4 items-center"
              >
                <Video size={24} color="#fff" />
                <Text className="text-white font-semibold mt-2">Go Live</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push("/seller/create-stream")}
                className="flex-1 bg-background-secondary rounded-xl p-4 items-center border border-background-tertiary"
              >
                <Plus size={24} color="#CBD5E1" />
                <Text className="text-text-secondary font-semibold mt-2">
                  Schedule Stream
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View className="px-6 pb-6">
            <Text className="text-text-primary text-lg font-bold mb-4">
              Overview
            </Text>
            <View className="gap-3">
              {/* Revenue Card */}
              <View className="bg-background-secondary rounded-xl p-4 border border-background-tertiary">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center">
                    <DollarSign size={20} color="#10B981" />
                  </View>
                  <Text className="text-text-tertiary text-xs">Total Revenue</Text>
                </View>
                <Text className="text-text-primary text-3xl font-bold">
                  ${stats.totalRevenue.toLocaleString()}
                </Text>
              </View>

              {/* Active Streams */}
              <View className="bg-background-secondary rounded-xl p-4 border border-background-tertiary">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center">
                    <Video size={20} color="#EF4444" />
                  </View>
                  <Text className="text-text-tertiary text-xs">Active Streams</Text>
                </View>
                <Text className="text-text-primary text-3xl font-bold">
                  {stats.activeStreams}
                </Text>
              </View>

              <View className="flex-row gap-3">
                {/* Products */}
                <View className="flex-1 bg-background-secondary rounded-xl p-4 border border-background-tertiary">
                  <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mb-2">
                    <Package size={20} color="#3B82F6" />
                  </View>
                  <Text className="text-text-tertiary text-xs mb-1">Products</Text>
                  <Text className="text-text-primary text-2xl font-bold">
                    {stats.totalProducts}
                  </Text>
                </View>

                {/* Pending Orders */}
                <View className="flex-1 bg-background-secondary rounded-xl p-4 border border-background-tertiary">
                  <View className="w-10 h-10 bg-yellow-500/20 rounded-full items-center justify-center mb-2">
                    <TrendingUp size={20} color="#F59E0B" />
                  </View>
                  <Text className="text-text-tertiary text-xs mb-1">Pending</Text>
                  <Text className="text-text-primary text-2xl font-bold">
                    {stats.pendingOrders}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recent Streams */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary text-lg font-bold">
                Recent Streams
              </Text>
              <TouchableOpacity>
                <Text className="text-primary-500 text-sm font-semibold">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <View className="bg-background-secondary rounded-xl p-4 border border-background-tertiary">
              <Text className="text-text-tertiary text-center">
                No recent streams
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SellerGuard>
  );
}
```

---

## 📋 Phase 4: Common UI Components (Days 8-9)

### Task 4.1: Create Reusable Components

**Update:** `components/ui/Button.tsx`
```typescript
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { theme } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-background-secondary border border-background-tertiary";
      case "outline":
        return "bg-transparent border-2 border-primary-500";
      case "ghost":
        return "bg-transparent";
      default:
        return "bg-primary-500";
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case "secondary":
      case "ghost":
        return "text-text-primary";
      case "outline":
        return "text-primary-500";
      default:
        return "text-white";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2";
      case "lg":
        return "px-8 py-4";
      default:
        return "px-6 py-3";
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl ${getVariantStyles()} ${getSizeStyles()} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50" : ""}`}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? "#fff" : theme.colors.primary[500]}
          />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text
              className={`${getTextStyles()} ${getTextSizeStyles()} font-semibold`}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

**Update:** `components/ui/Input.tsx`
```typescript
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text-primary text-sm font-semibold mb-2">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-background-secondary border rounded-xl px-4 ${
          error ? "border-red-500" : "border-background-tertiary"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        
        <TextInput
          className={`flex-1 text-text-primary ${
            multiline ? "py-3" : "py-4"
          }`}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-3"
          >
            {showPassword ? (
              <EyeOff size={20} color="#64748B" />
            ) : (
              <Eye size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>

      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
```

**Create:** `components/ui/LoadingSpinner.tsx`
```typescript
import { View, ActivityIndicator } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = "large",
  color = "#6366F1",
  fullScreen = false,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 bg-background-primary items-center justify-center">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} />;
}
```

**Create:** `components/ui/EmptyState.tsx`
```typescript
import { View, Text } from "react-native";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-text-primary text-lg font-bold text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-text-tertiary text-sm text-center mb-6">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
```

---

## 📋 Phase 5: Navigation & Polish (Days 10-11)

### Task 5.1: Add Proper Back Navigation

**Create:** `components/ui/Header.tsx`
```typescript
import { View, Text, TouchableOpacity, StatusBar, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, MoreVertical } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
}

export default function Header({
  title,
  subtitle,
  showBack = true,
  rightAction,
  onBackPress,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={["top"]} className="bg-background-primary">
        <View className="px-4 py-4 flex-row items-center justify-between border-b border-background-tertiary">
          <View className="flex-row items-center flex-1">
            {showBack && (
              <TouchableOpacity
                onPress={handleBack}
                className="mr-3 w-10 h-10 items-center justify-center"
              >
                <ArrowLeft size={24} color="#F8FAFC" />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-text-primary text-xl font-bold">
                {title}
              </Text>
              {subtitle && (
                <Text className="text-text-tertiary text-sm">{subtitle}</Text>
              )}
            </View>
          </View>
          {rightAction && <View className="ml-3">{rightAction}</View>}
        </View>
      </SafeAreaView>
    </>
  );
}
```

### Task 5.2: Add Error Boundaries

**Create:** `components/ui/ErrorBoundary.tsx`
```typescript
import React from "react";
import { View, Text } from "react-native";
import Button from "./Button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background-primary items-center justify-center p-6">
          <Text className="text-text-primary text-2xl font-bold mb-4">
            Oops! Something went wrong
          </Text>
          <Text className="text-text-secondary text-center mb-6">
            We're sorry for the inconvenience. Please try again.
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Task 5.3: Wrap App with Error Boundary

**Update:** `app/_layout.tsx` (add ErrorBoundary wrapper)
```typescript
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

export default function RootLayout() {
  // ... existing code ...

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        {/* ... existing stack screens ... */}
      </Stack>
    </ErrorBoundary>
  );
}
```

---

## 📋 Phase 6: State Management Cleanup (Day 12)

### Task 6.1: Consolidate to Zustand Only

**REMOVE:** `context/AuthContext.tsx`

**Update:** `store/authStore.ts`
```typescript
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user || null, loading: false, initialized: true });
      
      if (session?.user) {
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  setSession: (session) => {
    set({ session, user: session?.user || null });
  },

  fetchProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, sellerDetails:sellerDetails!userId(*)')
        .eq('id', user.id)
        .single();

      set({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      set({ session: data.session, user: data.user });
      await get().fetchProfile();
    } catch (error) {
      throw error;
    }
  },

  signUp: async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;
      
      set({ session: data.session, user: data.user });
    } catch (error) {
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
}));

// Initialize on app start
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session);
  if (session) {
    useAuthStore.getState().fetchProfile();
  }
});
```

### Task 6.2: Update All Components to Use Zustand

Replace all `useAuth()` hooks with `useAuthStore()`:

```typescript
// OLD
import { useAuth } from '../context/AuthContext';
const { user, signOut } = useAuth();

// NEW
import { useAuthStore } from '../store/authStore';
const { user, profile, signOut } = useAuthStore();
```

---

## 📋 Phase 7: Testing Checklist (Day 13)

### Test Each Flow:

1. **Authentication Flow**
   - [ ] Landing page loads
   - [ ] Can navigate to sign up
   - [ ] Can create account
   - [ ] Auto-redirects to onboarding
   - [ ] Can complete profile setup
   - [ ] Can select interests
   - [ ] Can navigate through tutorial
   - [ ] Lands on home feed after onboarding

2. **Home Feed**
   - [ ] Live streams display correctly
   - [ ] Upcoming streams display correctly
   - [ ] Can filter by category
   - [ ] Pull-to-refresh works
   - [ ] Can tap stream to view details
   - [ ] Loading states show properly
   - [ ] Empty states show when no streams

3. **Seller Flow**
   - [ ] Non-sellers see "Become a Seller" button
   - [ ] Sellers see "Dashboard" button
   - [ ] Registration form validates properly
   - [ ] Dashboard shows correct stats
   - [ ] Can create stream
   - [ ] Can go live
   - [ ] Can't access seller features without approval

4. **Navigation**
   - [ ] Tab bar works correctly
   - [ ] Back buttons work
   - [ ] Deep links work
   - [ ] No unauthorized access to protected routes

5. **UI/UX**
   - [ ] Layouts are consistent
   - [ ] Colors match design system
   - [ ] Spacing is uniform
   - [ ] Loading indicators show during operations
   - [ ] Error messages display properly
   - [ ] Success messages display properly

---

## 📋 Phase 8: Performance Optimization (Day 14)

### Task 8.1: Add Memoization

```typescript
// In StreamCard.tsx
import { memo } from 'react';

export default memo(StreamCard, (prevProps, nextProps) => {
  return prevProps.stream.id === nextProps.stream.id &&
         prevProps.stream.viewerCount === nextProps.stream.viewerCount;
});
```

### Task 8.2: Optimize Images

```typescript
// In StreamCard.tsx
<Image
  source={{ uri: stream.thumbnailUrl }}
  className="w-full h-48"
  resizeMode="cover"
  defaultSource={require('../../assets/placeholder.png')}
  progressiveRenderingEnabled
  fadeDuration={300}
/>
```

### Task 8.3: Add FlatList Optimization

```typescript
// In home screen
<FlatList
  data={liveStreams}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  updateCellsBatchingPeriod={50}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## 🚫 DO NOT DO

1. **DO NOT** create duplicate components
2. **DO NOT** mix state management libraries (pick Zustand, remove Context)
3. **DO NOT** skip guards on protected routes
4. **DO NOT** use inconsistent color values (always use theme constants)
5. **DO NOT** skip loading states
6. **DO NOT** skip error handling
7. **DO NOT** hardcode spacing values (use theme.spacing)
8. **DO NOT** mix inline styles with Tailwind classes
9. **DO NOT** skip TypeScript types
10. **DO NOT** commit console.logs to production

---

## ✅ Must-Have Features Before Launch

1. ✅ Proper authentication flow
2. ✅ Role-based routing (user/seller/admin)
3. ✅ Onboarding for new users
4. ✅ Seller registration & approval flow
5. ✅ Working feed with live & upcoming streams
6. ✅ Real-time updates via Supabase
7. ✅ Proper error boundaries
8. ✅ Loading states everywhere
9. ✅ Consistent design system
10. ✅ Mobile-responsive layouts

---

## 📊 Success Metrics

After implementing this plan, you should have:

- **0 navigation bugs** - Users always land on correct screens
- **100% design consistency** - All screens use same components/colors
- **< 2s load times** - Proper optimization and caching
- **0 crashes** - Error boundaries catch all errors
- **Intuitive UX** - Users understand the flow without instructions

---

## 🎯 Priority Order

**Week 1 (Critical)**
1. Phase 1: Foundation & Cleanup
2. Phase 2: Fix Authentication & Routing
3. Phase 3: Redesign Core Screens

**Week 2 (Important)**
4. Phase 4: Common UI Components
5. Phase 5: Navigation & Polish
6. Phase 6: State Management Cleanup

**Week 3 (Final)**
7. Phase 7: Testing
8. Phase 8: Performance Optimization

---

## 📝 Daily Progress Tracking

Create a checklist and mark off completed tasks daily. This plan is extensive but systematic. Follow it in order, and your app will be production-ready in 2-3 weeks.

Good luck! 🚀
