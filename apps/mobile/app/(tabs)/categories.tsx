import { ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Compass, Flame, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { useCategories } from '@/hooks';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchSearchBar,
  StitchSectionTitle,
} from '@/components/design';

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200',
  'https://images.unsplash.com/photo-1519669417670-68775a50919c?w=1200',
  'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=1200',
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200',
];

export default function CategoriesScreen() {
  const categoriesQuery = useCategories();

  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={categoriesQuery.isRefetching}
          onRefresh={categoriesQuery.refetch}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader
        title="Discovery"
        subtitle="Browse by interest"
        rightNode={
          <View style={styles.iconWrap}>
            <Compass size={18} color={COLORS.primaryBlue} />
          </View>
        }
      />

      <View style={styles.searchRow}>
        <StitchSearchBar
          placeholder="Search niches, items, or users"
          onFilterPress={() => router.push('/(tabs)/search')}
          onChangeText={() => undefined}
        />
      </View>

      <View style={styles.contentPad}>
        <StitchCard style={styles.trendingCard}>
          <View style={styles.trendingHeader}>
            <Flame size={18} color="#EF4444" />
            <Text style={styles.trendingLabel}>Trending Niche</Text>
            <Text style={styles.liveTag}>LIVE NOW</Text>
          </View>
          <Pressable style={styles.trendingHero} onPress={() => router.push('/(tabs)/search')}>
            <ImageBackground
              source={{ uri: CATEGORY_IMAGES[1] }}
              style={styles.trendingHero}
              imageStyle={styles.rounded12}
            >
              <View style={styles.heroGradient}>
                <Text style={styles.heroTitle}>Sneakers & Kicks</Text>
                <Text style={styles.heroMeta}>124 live trades</Text>
              </View>
            </ImageBackground>
          </Pressable>
        </StitchCard>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Browse by Interest" actionLabel="View all" />
        </View>

        <View style={styles.grid}>
          {categories.map((category, index) => (
            <Pressable
              key={String(category.id)}
              style={styles.gridItem}
              onPress={() => router.push(`/products?category=${category.id}&name=${encodeURIComponent(category.name)}`)}
            >
              <ImageBackground
                source={{ uri: CATEGORY_IMAGES[index % CATEGORY_IMAGES.length] }}
                style={styles.categoryImage}
                imageStyle={styles.rounded12}
              >
                <View style={styles.categoryOverlay}>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                  <Text style={styles.categoryMeta}>{16 + index * 7} active trades</Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>

        <View style={styles.recommendedSection}>
          <StitchSectionTitle title="Recommended Sellers" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellerRow}>
            {['RetroCollector', 'KicksKing', 'CardGuru'].map((name) => (
              <StitchCard key={name} style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  <Users size={22} color={COLORS.primaryBlue} />
                </View>
                <Text style={styles.sellerName} numberOfLines={1}>{name}</Text>
                <Text style={styles.sellerFeedback}>98% feedback</Text>
                <Pressable style={styles.followBtn}>
                  <Text style={styles.followBtnText}>Follow</Text>
                </Pressable>
              </StitchCard>
            ))}
          </ScrollView>
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  trendingCard: {
    marginBottom: 20,
    padding: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  trendingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryText,
    flex: 1,
  },
  liveTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    letterSpacing: 0.6,
  },
  trendingHero: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rounded12: {
    borderRadius: 12,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  heroMeta: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionTop: {
    marginBottom: 10,
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
  categoryImage: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  categoryOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryMeta: {
    color: '#F8FAFC',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recommendedSection: {
    marginTop: 12,
  },
  sellerRow: {
    paddingBottom: 6,
  },
  sellerCard: {
    width: 140,
    marginRight: 10,
    alignItems: 'center',
  },
  sellerAvatar: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginBottom: 8,
  },
  sellerName: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  sellerFeedback: {
    color: COLORS.lightGrey,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  followBtn: {
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followBtnText: {
    color: COLORS.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
  },
});
