import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MessageCircle, MoreVertical, Star, Verified } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/lib/api/services/users';
import { socialService } from '@/lib/api/services/social';
import { productsService } from '@/lib/api/services/products';
import { COLORS } from '@/constants/colors';
import { StitchCard, StitchChip, StitchHeader, StitchPage, StitchPrimaryButton, StitchSecondaryButton } from '@/components/design';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, sales: 0 });
  const [tab, setTab] = useState<'store' | 'reviews' | 'shows'>('store');

  const isOwnProfile = profile?.id === id;

  useEffect(() => {
    if (!id) return;
    void loadProfile();
  }, [id]);

  async function loadProfile(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const userData = await usersService.getProfile(id as string);
      setUser(userData);

      const [socialStats, sellerProducts, following] = await Promise.all([
        socialService.getStats(id as string).catch(() => ({ followers_count: 0, following_count: 0 })),
        productsService.getSellerProducts(id as string).catch(() => []),
        socialService.isFollowing(id as string).catch(() => false),
      ]);

      setProducts(Array.isArray(sellerProducts) ? sellerProducts : []);
      setIsFollowing(Boolean(following));
      setStats({
        followers: Number(socialStats.followers_count || 0),
        following: Number(socialStats.following_count || 0),
        sales: Array.isArray(sellerProducts) ? sellerProducts.length : 0,
      });
    } catch (error) {
      setUser(null);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleFollow() {
    if (!id || isOwnProfile) return;

    try {
      if (isFollowing) {
        await socialService.unfollow(id as string);
        setIsFollowing(false);
        setStats((current) => ({ ...current, followers: Math.max(0, current.followers - 1) }));
      } else {
        await socialService.follow(id as string);
        setIsFollowing(true);
        setStats((current) => ({ ...current, followers: current.followers + 1 }));
      }
    } catch (error) {
      // ignore
    }
  }

  const showcaseProducts = useMemo(() => products.slice(0, 6), [products]);

  if (!loading && !user) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.emptyText}>User profile not found.</Text>
        <View style={styles.backBtnWrap}>
          <StitchPrimaryButton label="Go Back" onPress={() => router.back()} />
        </View>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={COLORS.primaryBlue} />}
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="Seller Profile"
        onBack={() => router.back()}
        rightNode={
          <View style={styles.iconBtn}>
            <MoreVertical size={16} color={COLORS.primaryBlue} />
          </View>
        }
      />

      {loading ? (
        <Text style={styles.loadingText}>Loading profile...</Text>
      ) : (
        <View style={styles.contentPad}>
          <View style={styles.topWrap}>
            <View style={styles.avatarWrap}>
              {user?.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{user?.username?.[0]?.toUpperCase() || 'S'}</Text></View>}
              <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>Live Now</Text></View>
            </View>

            <Text style={styles.name}>{user?.full_name || user?.username || 'Seller'}</Text>
            <Text style={styles.meta}>New York, NY • Joined 2022</Text>
            <Text style={styles.bio}>
              Expert in vintage watches and collectibles. Always open to fair trades and high-end bartering sessions.
            </Text>

            <View style={styles.actionsRow}>
              {!isOwnProfile ? (
                <View style={styles.actionHalf}>
                  <StitchPrimaryButton label={isFollowing ? 'Following' : 'Follow'} onPress={toggleFollow} />
                </View>
              ) : null}
              <View style={styles.actionHalf}>
                <StitchSecondaryButton
                  label="Message"
                  onPress={() => router.push(`/messages/new?userId=${id}`)}
                />
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StitchCard style={styles.statCard}><Text style={styles.statValue}>{stats.followers}</Text><Text style={styles.statLabel}>Followers</Text></StitchCard>
            <StitchCard style={styles.statCard}><View style={styles.ratingRow}><Text style={styles.statValue}>4.9</Text><Star size={12} color="#EAB308" fill="#EAB308" /></View><Text style={styles.statLabel}>Rating</Text></StitchCard>
            <StitchCard style={styles.statCard}><Text style={styles.statValue}>{stats.sales}</Text><Text style={styles.statLabel}>Sales</Text></StitchCard>
          </View>

          <View style={styles.tabsRow}>
            <StitchChip label="Store" active={tab === 'store'} onPress={() => setTab('store')} />
            <StitchChip label="Reviews" active={tab === 'reviews'} onPress={() => setTab('reviews')} />
            <StitchChip label="Shows" active={tab === 'shows'} onPress={() => setTab('shows')} />
          </View>

          {tab === 'store' ? (
            <View style={styles.productGrid}>
              {showcaseProducts.map((product) => (
                <Pressable key={product.id} style={styles.productItem} onPress={() => router.push(`/product/${product.id}`)}>
                  <Image
                    source={{
                      uri:
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400',
                    }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                  <Text style={styles.productPrice}>${Number(product.price || 0).toFixed(2)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {tab === 'reviews' ? (
            <StitchCard style={styles.tabCard}>
              <Text style={styles.tabCardTitle}>Buyer reviews</Text>
              <Text style={styles.tabCardText}>4.9 average rating from verified marketplace transactions.</Text>
            </StitchCard>
          ) : null}

          {tab === 'shows' ? (
            <StitchCard style={styles.tabCard}>
              <Text style={styles.tabCardTitle}>Live shows</Text>
              <Text style={styles.tabCardText}>Upcoming drops and previous streams will appear here.</Text>
            </StitchCard>
          ) : null}
        </View>
      )}

      {/* <Pressable style={styles.messageFab} onPress={() => router.push(`/messages/new?userId=${id}`)}> */}
      {/*   <MessageCircle size={18} color="#FFFFFF" /> */}
      {/* </Pressable> */}
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  backBtnWrap: {
    marginTop: 14,
    width: 160,
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topWrap: {
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    height: 118,
    width: 118,
    borderRadius: 59,
    borderWidth: 3,
    borderColor: '#D2E1FB',
  },
  avatarFallback: {
    height: 118,
    width: 118,
    borderRadius: 59,
    borderWidth: 3,
    borderColor: '#D2E1FB',
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: COLORS.primaryBlue,
    fontSize: 36,
    fontWeight: '700',
  },
  liveBadge: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  meta: {
    marginTop: 3,
    color: COLORS.lightGrey,
    fontSize: 12,
  },
  bio: {
    marginTop: 10,
    color: COLORS.lightGrey,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionHalf: {
    flex: 1,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primaryText,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.lightGrey,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tabsRow: {
    marginTop: 16,
    flexDirection: 'row',
  },
  productGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  productTitle: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  tabCard: {
    marginTop: 12,
  },
  tabCardTitle: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  tabCardText: {
    marginTop: 4,
    color: COLORS.lightGrey,
    fontSize: 13,
  },
  messageFab: {
    position: 'absolute',
    right: 16,
    bottom: 104,
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlue,
  },
});
