import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Filter, Play, ShoppingBag } from 'lucide-react-native';
import { useProducts, useStreams } from '@/hooks';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchEmpty,
  StitchHeader,
  StitchPage,
  StitchSearchBar,
  StitchSectionTitle,
} from '@/components/design';

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ category?: string; name?: string }>();
  const categoryId = typeof params.category === 'string' ? params.category : undefined;
  const categoryName = typeof params.name === 'string' ? params.name : undefined;

  const [search, setSearch] = useState('');

  const streamsQuery = useStreams({
    status: 'live',
    category_id: categoryId,
    search: search || undefined,
    limit: 8,
  });

  const productsQuery = useProducts({
    category: categoryId,
    search: search || undefined,
  });

  const streams = streamsQuery.data || [];
  const products = productsQuery.data || [];
  const isLoading = streamsQuery.isLoading || productsQuery.isLoading;
  const isRefreshing = streamsQuery.isRefetching || productsQuery.isRefetching;

  const title = useMemo(() => categoryName || (categoryId ? 'Category Results' : 'Marketplace'), [
    categoryId,
    categoryName,
  ]);

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            streamsQuery.refetch();
            productsQuery.refetch();
          }}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader title={title} subtitle="Browse live lots + products" onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <StitchSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search in this category..."
          onFilterPress={() => undefined}
        />
      </View>

      <View style={styles.contentPad}>
        {streams.length > 0 ? (
          <>
            <View style={styles.sectionTop}>
              <StitchSectionTitle title="Live Right Now" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveRow}>
              {streams.map((stream) => (
                <Pressable
                  key={stream.id}
                  style={styles.liveCardWrap}
                  onPress={() => router.push(`/stream/${stream.id}`)}
                >
                  <StitchCard style={styles.liveCard}>
                    <Image
                      source={{
                        uri:
                          (stream as any).thumbnailUrl ||
                          (stream as any).thumbnail_url ||
                          'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000',
                      }}
                      style={styles.liveImage}
                    />
                    <View style={styles.liveBadge}>
                      <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                    <Text style={styles.liveTitle} numberOfLines={1}>
                      {stream.title}
                    </Text>
                    <Text style={styles.liveMeta} numberOfLines={1}>
                      @{stream.seller?.username || 'seller'}
                    </Text>
                  </StitchCard>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.sectionTop}>
          <StitchSectionTitle title={`Products (${products.length})`} />
        </View>

        {isLoading ? (
          <StitchCard>
            <StitchEmpty title="Loading Products..." subtitle="Pulling latest listings for you" />
          </StitchCard>
        ) : products.length === 0 ? (
          <StitchCard>
            <StitchEmpty title="No Items Found" subtitle="Try a different search or check back later." />
          </StitchCard>
        ) : (
          <View style={styles.grid}>
            {products.map((product) => (
              <Pressable
                key={product.id}
                style={styles.gridItem}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <StitchCard style={styles.productCard}>
                  {(product as any).images?.[0] ? (
                    <Image source={{ uri: (product as any).images?.[0] }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImageFallback}>
                      <ShoppingBag size={24} color={COLORS.lightGrey} />
                    </View>
                  )}

                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product.title}
                  </Text>

                  <View style={styles.productBottomRow}>
                    <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
                    <View style={styles.filterChip}>
                      <Filter size={10} color={COLORS.primaryBlue} />
                      <Text style={styles.filterChipText}>Sort</Text>
                    </View>
                  </View>
                </StitchCard>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionTop: {
    marginBottom: 8,
  },
  liveRow: {
    paddingBottom: 14,
  },
  liveCardWrap: {
    width: 210,
    marginRight: 10,
  },
  liveCard: {
    padding: 8,
  },
  liveImage: {
    width: '100%',
    height: 118,
    borderRadius: 10,
    marginBottom: 8,
  },
  liveBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  liveTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  liveMeta: {
    color: COLORS.lightGrey,
    fontSize: 11,
    marginTop: 2,
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
  productCard: {
    padding: 8,
  },
  productImage: {
    width: '100%',
    height: 132,
    borderRadius: 10,
    marginBottom: 8,
  },
  productImageFallback: {
    width: '100%',
    height: 132,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
  },
  productTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  productBottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterChipText: {
    color: COLORS.primaryBlue,
    fontSize: 10,
    fontWeight: '700',
  },
});
