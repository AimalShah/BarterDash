import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, Eye, Search as SearchIcon, Star, MessageCircle, Video } from 'lucide-react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useProducts, useStreams } from '@/hooks';
import { queryKeys } from '@/lib/api/queryKeys';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchChip,
  StitchHeader,
  StitchPage,
  StitchSectionTitle,
} from '@/components/design';
import { FONT_FAMILIES } from '@/constants/fonts';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoriesQuery = useCategories();
  const streamsQuery = useStreams({
    category_id: selectedCategory === 'all' ? undefined : selectedCategory,
  });
  const productsQuery = useProducts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const categories = useMemo(
    () => [
      { id: 'all', name: 'All Live' },
      ...(categoriesQuery.data || []).map((category) => ({
        id: String(category.id),
        name: category.name,
      })),
    ],
    [categoriesQuery.data]
  );

  const streams = useMemo(
    () =>
      (streamsQuery.data || []).filter(
        (stream) => stream.status === 'live' || stream.status === 'scheduled'
      ),
    [streamsQuery.data]
  );
  console.log("STREAMS : ", streams)

  const products = productsQuery.data || [];

  const featuredStream = streams[0];

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: queryKeys.streams }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
    ]);
  }, [queryClient]);

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 120 }}
      scroll
      refreshControl={
        <RefreshControl
          refreshing={streamsQuery.isRefetching || categoriesQuery.isRefetching || productsQuery.isRefetching}
          onRefresh={onRefresh}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader
        title="BarterDash"
        subtitle="Live marketplace"
        rightNode={
          <View className="flex-row gap-2">
            <Pressable style={styles.headerAction} onPress={() => router.push('/(tabs)/inbox')}>
              <MessageCircle size={18} color={COLORS.primaryBlue} />
            </Pressable>
            <Pressable style={styles.headerAction} onPress={() => router.push('/notifications')}>
              <Bell size={18} color={COLORS.primaryBlue} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.searchWrap}>
        <Pressable style={styles.searchButton} onPress={() => router.push('/(tabs)/search')}>
          <SearchIcon size={16} color={COLORS.lightGrey} />
          <Text style={styles.searchText}>Search cards, kicks, or sellers...</Text>
        </Pressable>
      </View>

      <View style={styles.chipRowWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
            <StitchChip
              key={category.id}
              label={category.name}
              active={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentPad}>
        {featuredStream ? (
          <Pressable onPress={() => router.push(`/stream/${featuredStream.id}`)}>
            <View style={styles.heroCard}>
              <Image
                source={{
                  uri:
                    (featuredStream as any).thumbnailUrl ||
                    (featuredStream as any).thumbnail_url ||
                    (featuredStream as any).thumbnail ||
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
                }}
                style={styles.heroImage}
              />
              <View style={styles.heroOverlay}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {featuredStream.title}
                </Text>
                <View style={styles.heroMeta}>
                  <Eye size={14} color="#FFFFFF" />
                  <Text style={styles.heroMetaText}>
                    {((featuredStream as any).viewerCount || (featuredStream as any).viewer_count || 0)} viewers
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Trending Now" actionLabel="See All" onActionPress={() => router.push('/products')} />
        </View>

        {streams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No streams available</Text>
            <Text style={styles.emptySubtitle}>Check back later for live selling sessions</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {streams.slice(0, 4).map((stream) => (
              <Pressable key={stream.id} style={styles.gridItem} onPress={() => router.push(`/stream/${stream.id}`)}>
                <StitchCard style={styles.streamCard}>
                  <Image
                    source={{
                      uri:
                        (stream as any).thumbnailUrl ||
                        (stream as any).thumbnail_url ||
                        (stream as any).thumbnail ||
                        'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000',
                    }}
                    style={styles.streamImage}
                  />
                  <View style={styles.streamBadge}>
                    <Text style={styles.streamBadgeText}>{stream.status === 'live' ? 'LIVE' : 'SOON'}</Text>
                  </View>
                  <Text style={styles.streamTitle} numberOfLines={1}>
                    {stream.title}
                  </Text>
                  <View style={styles.streamSellerRow}>
                    <Text style={styles.streamSeller} numberOfLines={1}>
                      @{stream.seller?.username || 'seller'}
                    </Text>
                    <View style={styles.ratingWrap}>
                      <Star size={10} color="#EAB308" fill="#EAB308" />
                      <Text style={styles.ratingText}>4.9</Text>
                    </View>
                  </View>
                </StitchCard>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Fresh Products" actionLabel="Browse" onActionPress={() => router.push('/products')} />
        </View>

        <View style={styles.grid}>
          {products.slice(0, 4).map((product) => (
            <Pressable key={product.id} style={styles.gridItem} onPress={() => router.push(`/product/${product.id}`)}>
              <StitchCard style={styles.productCard}>
                <Image
                  source={{
                    uri:
                      (product as any).images?.[0] ||
                      (product as any).thumbnail_url ||
                      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000',
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
              </StitchCard>
            </Pressable>
          ))}
        </View>
      </View>

    </StitchPage>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchText: {
    color: COLORS.lightGrey,
    fontSize: 14,
    fontWeight: '500',
  },
  chipRowWrap: {
    paddingTop: 12,
  },
  chipRow: {
    paddingHorizontal: 16,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(220,38,38,0.9)',
  },
  liveDot: {
    height: 6,
    width: 6,
    borderRadius: 99,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTop: {
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  streamCard: {
    padding: 8,
  },
  streamImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  streamBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streamBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  streamTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  streamSellerRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamSeller: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '700',
  },
  productCard: {
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  productTitle: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    marginTop: 4,
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    fontFamily: FONT_FAMILIES.spaceGrotesk.regular,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE4F1',
  },
  emptyTitle: {
    color: COLORS.primaryText,
    fontFamily: FONT_FAMILIES.spaceGrotesk.semibold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.lightGrey,
    fontFamily: FONT_FAMILIES.spaceGrotesk.regular,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 280,
  },
});
