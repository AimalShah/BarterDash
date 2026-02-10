
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { supabase } from "../../lib/supabase";
import { streamsService } from "../../lib/api/services/streams";
import { productsService } from "../../lib/api/services/products";
import { categoriesService } from "../../lib/api/services/categories";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { COLORS } from "../../constants/colors";
import HomeHeader from "@/components/home/HomeHeader";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'shows' | 'products'>('shows');
  const [streams, setStreams] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchData();

    // Realtime subscriptions
    const streamSub = supabase
      .channel("streams-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "streams" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(streamSub);
    };
  }, [selectedCategory, activeTab]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.findAll();
      const raw = Array.isArray(data) ? data : [];
      const normalized = raw
        .map((c: any) => ({
          id: String(c?.id ?? ""),
          name: c?.name ?? "Unknown",
        }))
        .filter((c) => c.id);
      setCategories([{ id: "all", name: "All" }, ...normalized]);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([{ id: "all", name: "All" }]);
    }
  };

  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const query: any = {};
      if (selectedCategory !== "all") {
        query.category_id = activeTab === 'shows' ? selectedCategory : undefined;
        query.category = activeTab === 'products' ? selectedCategory : undefined;
      }

      if (activeTab === 'shows') {
        // Fetch Streams (Live first, then Scheduled) - exclude ended/cancelled
        const allStreams = await streamsService.findAll(query).catch(() => []);
        // Filter to only include live and scheduled streams (exclude ended/cancelled)
        const activeStreams = allStreams.filter((stream: any) =>
          stream.status === 'live' || stream.status === 'scheduled'
        );
        // Sort: Live first, then by scheduled date
        const sorted = activeStreams.sort((a: any, b: any) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (a.status !== 'live' && b.status === 'live') return 1;
          return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
        });
        setStreams(sorted);
      } else {
        // Fetch Products
        const allProducts = await productsService.findAll(query).catch(() => []);
        setProducts(allProducts);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [selectedCategory, activeTab]);

  const handleStreamPress = (streamId: string) => {
    router.push(`/stream/${streamId}`);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderStreamItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50)}
      style={styles.gridItemContainer}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleStreamPress(item.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{
            uri: item.thumbnailUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardGradient}
        />

        {/* Status Badge */}
        <View style={styles.statusBadgeContainer}>
          {item.status === 'live' ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.scheduledBadge}>
              <Text style={styles.scheduledText}>
                {new Date(item.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}
          {item.viewerCount > 0 && (
            <View style={styles.viewerBadge}>
              <Ionicons name="eye" size={10} color="white" />
              <Text style={styles.viewerText}>{item.viewerCount}</Text>
            </View>
          )}
        </View>

        {/* Card Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.seller?.avatarUrl || `https://ui-avatars.com/api/?name=${item.seller?.username || 'User'}` }}
              style={styles.userAvatar}
            />
            <Text style={styles.userName} numberOfLines={1}>@{item.seller?.username || 'user'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProductItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 50)}
      style={styles.gridItemContainer}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{
            uri: item.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        />

        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.seller?.avatarUrl || `https://ui-avatars.com/api/?name=${item.seller?.username || 'User'}` }}
              style={styles.userAvatar}
            />
            <Text style={styles.userName} numberOfLines={1}>@{item.seller?.username || 'user'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <HomeHeader />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shows' && styles.activeTab]}
          onPress={() => setActiveTab('shows')}
        >
          <Text style={[styles.tabText, activeTab === 'shows' && styles.activeTabText]}>Shows</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll - Keeps it minimal */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Grid */}
      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'shows' ? streams : products}
          renderItem={activeTab === 'shows' ? renderStreamItem : renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primaryGold}
              colors={[COLORS.primaryGold]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {activeTab} found</Text>
              <Text style={styles.emptySubText}>Try a different category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 20
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primaryGold,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },

  // Categories
  categoryContainer: {
    marginBottom: 16,
    height: 40,
  },
  categoryContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  catPillActive: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catTextActive: {
    color: COLORS.luxuryBlack,
    fontWeight: '700',
  },

  // Grid
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItemContainer: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  card: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },

  // Status Badges
  statusBadgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  scheduledBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduledText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: COLORS.luxuryBlack,
    fontSize: 12,
    fontWeight: '800',
  },

  // Card Info
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  userName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
