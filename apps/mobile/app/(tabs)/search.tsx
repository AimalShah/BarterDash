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
import { Flame, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCategories, useProducts, useStreams } from '@/hooks';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchChip,
  StitchHeader,
  StitchPage,
  StitchSearchBar,
  StitchSectionTitle,
} from '@/components/design';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categoriesQuery = useCategories();
  const streamsQuery = useStreams({
    category_id: activeCategory === 'all' ? undefined : activeCategory,
    search: query || undefined,
  });
  const productsQuery = useProducts({
    category: activeCategory === 'all' ? undefined : activeCategory,
    search: query || undefined,
  });

  const categories = useMemo(
    () => [{ id: 'all', name: 'All' }, ...(categoriesQuery.data || []).map((cat) => ({ id: String(cat.id), name: cat.name }))],
    [categoriesQuery.data]
  );

  const streams = streamsQuery.data || [];
  const products = productsQuery.data || [];

  const isRefreshing = streamsQuery.isRefetching || productsQuery.isRefetching || categoriesQuery.isRefetching;

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            streamsQuery.refetch();
            productsQuery.refetch();
            categoriesQuery.refetch();
          }}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader title="Search & Discovery" subtitle="Find streams and products" />

      <View style={styles.searchWrap}>
        <StitchSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search for sneakers, cards, or live breaks..."
          onFilterPress={() => undefined}
        />
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((category) => (
            <StitchChip
              key={category.id}
              label={category.name}
              active={activeCategory === category.id}
              onPress={() => setActiveCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentPad}>
        <StitchCard style={styles.trendingCard}>
          <View style={styles.trendingHead}>
            <View style={styles.trendingTitleWrap}>
              <Flame size={18} color="#F97316" />
              <Text style={styles.trendingTitle}>Trending Now</Text>
            </View>
            <Pressable onPress={() => router.push('/products')}>
              <Text style={styles.trendingAction}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.trendingGrid}>
            {[
              { label: 'Jordan 4 SB', type: 'Trending' },
              { label: 'Pokemon 151', type: 'Hot Item' },
              { label: 'Vintage Wax', type: 'Live Break' },
              { label: 'Charizard PSA 10', type: 'Top Trade' },
            ].map((item) => (
              <View key={item.label} style={styles.trendingChipCard}>
                <Text style={styles.trendingChipMeta}>{item.type}</Text>
                <Text style={styles.trendingChipTitle}>{item.label}</Text>
              </View>
            ))}
          </View>
        </StitchCard>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Results" />
        </View>

        <View style={styles.resultsGrid}>
          {streams.slice(0, 4).map((stream) => (
            <Pressable key={`stream-${stream.id}`} style={styles.resultItem} onPress={() => router.push(`/stream/${stream.id}`)}>
              <StitchCard style={styles.resultCardLive}>
                <Image
                  source={{
                    uri:
                      stream.thumbnailUrl ||
                      (stream as any).thumbnail_url ||
                      'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=1200',
                  }}
                  style={styles.resultImage}
                />
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>LIVE</Text>
                </View>
                <Text style={styles.resultTitle} numberOfLines={1}>{stream.title}</Text>
                <Text style={styles.resultMeta} numberOfLines={1}>@{stream.seller?.username || 'seller'}</Text>
                <Pressable style={styles.streamCta} onPress={() => router.push(`/stream/${stream.id}`)}>
                  <Text style={styles.streamCtaText}>Join Stream</Text>
                </Pressable>
              </StitchCard>
            </Pressable>
          ))}

          {products.slice(0, 6).map((product) => (
            <Pressable key={`product-${product.id}`} style={styles.resultItem} onPress={() => router.push(`/product/${product.id}`)}>
              <StitchCard style={styles.resultCardProduct}>
                <Image
                  source={{
                    uri:
                      product.images?.[0] ||
                      (product as any).thumbnail_url ||
                      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.resultTitle} numberOfLines={1}>{product.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Est. Value</Text>
                  <Text style={styles.priceValue}>${Number(product.price || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <View style={styles.reviewLeft}>
                    <Star size={11} color="#EAB308" fill="#EAB308" />
                    <Text style={styles.reviewText}>4.9</Text>
                  </View>
                  <Text style={styles.watchText}>Watch</Text>
                </View>
              </StitchCard>
            </Pressable>
          ))}
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chipsWrap: {
    paddingTop: 12,
  },
  chipRow: {
    paddingHorizontal: 16,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  trendingCard: {
    marginBottom: 16,
  },
  trendingHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  trendingAction: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  trendingChipCard: {
    width: '50%',
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  trendingChipMeta: {
    color: COLORS.lightGrey,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  trendingChipTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTop: {
    marginTop: 8,
    marginBottom: 8,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  resultItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  resultCardLive: {
    padding: 8,
    borderColor: '#B7D0F8',
    borderWidth: 2,
  },
  resultCardProduct: {
    padding: 8,
  },
  resultImage: {
    height: 150,
    width: '100%',
    borderRadius: 10,
    marginBottom: 8,
  },
  livePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  resultTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  resultMeta: {
    color: COLORS.lightGrey,
    fontSize: 11,
    marginTop: 2,
  },
  streamCta: {
    marginTop: 8,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  streamCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  productImage: {
    height: 120,
    width: '100%',
    borderRadius: 10,
    marginBottom: 8,
  },
  priceRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '600',
  },
  priceValue: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewText: {
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '700',
  },
  watchText: {
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
