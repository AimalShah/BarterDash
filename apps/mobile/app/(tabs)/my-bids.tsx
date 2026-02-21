import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, Search } from 'lucide-react-native';
import { bidsService } from '@/lib/api/services/bids';
import { COLORS } from '@/constants/colors';
import { StitchChip, StitchHeader, StitchPage, StitchEmpty } from '@/components/design';

interface MyBid {
  id: string;
  amount: number | string;
  auctionId?: string;
  auction_id?: string;
  isWinning?: boolean;
  is_winning?: boolean;
  auction?: {
    id?: string;
    title?: string;
    status?: string;
    currentBid?: number | string;
    current_bid?: number | string;
    endsAt?: string;
    ends_at?: string;
    product?: {
      title?: string;
      images?: string[];
    };
  };
}

function formatTimeLeft(endDate?: string) {
  if (!endDate) return 'ending soon';

  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function MyBidsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [bids, setBids] = useState<MyBid[]>([]);

  useEffect(() => {
    void fetchBids();
  }, []);

  async function fetchBids(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await bidsService.getMyBids();
      setBids(Array.isArray(data) ? data : []);
    } catch (error) {
      setBids([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return bids;

    return bids.filter((bid) => {
      const status = bid.auction?.status;
      if (filter === 'active') return status !== 'ended' && status !== 'cancelled';
      return status === 'ended' || status === 'cancelled';
    });
  }, [bids, filter]);

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchBids(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="My Wishlist"
        subtitle="Saved bids and watched lots"
        onBack={() => router.back()}
        rightNode={
          <Pressable style={styles.headerIcon} onPress={() => router.push('/(tabs)/search')}>
            <Search size={16} color={COLORS.primaryBlue} />
          </Pressable>
        }
      />

      <View style={styles.tabRow}>
        <StitchChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <StitchChip label="Active" active={filter === 'active'} onPress={() => setFilter('active')} />
        <StitchChip label="Ended" active={filter === 'ended'} onPress={() => setFilter('ended')} />
      </View>

      <View style={styles.grid}>
        {!loading && filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <StitchEmpty title="No saved items" subtitle="Start bidding or save products to build your wishlist." />
          </View>
        ) : (
          filtered.map((bid) => {
            const auctionId = bid.auctionId || bid.auction_id || bid.auction?.id;
            const image =
              bid.auction?.product?.images?.[0] ||
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200';
            const title = bid.auction?.product?.title || bid.auction?.title || 'Auction item';
            const current = Number(bid.auction?.currentBid ?? bid.auction?.current_bid ?? 0);
            const amount = Number(bid.amount || 0);
            const isActive = bid.auction?.status !== 'ended' && bid.auction?.status !== 'cancelled';

            return (
              <Pressable
                key={bid.id}
                style={styles.item}
                onPress={() => {
                  if (auctionId) router.push(`/auction/${auctionId}`);
                }}
              >
                <View style={styles.imageWrap}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <View style={[styles.statusBadge, isActive ? styles.statusLive : styles.statusEnded]}>
                    <Text style={styles.statusText}>{isActive ? 'Live' : 'Ended'}</Text>
                  </View>
                  <Pressable style={styles.heartBtn}>
                    <Heart size={14} color={COLORS.primaryBlue} fill={COLORS.primaryBlue} />
                  </Pressable>
                  <View style={styles.timerPill}>
                    <Text style={styles.timerText}>{formatTimeLeft(bid.auction?.endsAt || bid.auction?.ends_at)}</Text>
                  </View>
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.bidLabel}>Current Bid</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>${current.toFixed(2)}</Text>
                    <Text style={styles.myPrice}>You: ${amount.toFixed(2)}</Text>
                  </View>
                  <Pressable style={[styles.ctaBtn, isActive ? styles.ctaBtnLive : styles.ctaBtnMuted]}>
                    <Text style={[styles.ctaText, isActive ? styles.ctaTextLive : styles.ctaTextMuted]}>
                      {isActive ? 'Bid Now' : 'View Result'}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  item: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  imageWrap: {
    height: 152,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusLive: {
    backgroundColor: '#DC2626',
  },
  statusEnded: {
    backgroundColor: '#64748B',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heartBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPill: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  itemBody: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#DFE7F3',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  itemTitle: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  bidLabel: {
    marginTop: 8,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: COLORS.lightGrey,
    letterSpacing: 0.5,
  },
  priceRow: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPrice: {
    color: COLORS.primaryBlue,
    fontSize: 15,
    fontWeight: '700',
  },
  myPrice: {
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '600',
  },
  ctaBtn: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnLive: {
    backgroundColor: COLORS.primaryBlue,
  },
  ctaBtnMuted: {
    backgroundColor: '#EFF3FA',
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ctaTextLive: {
    color: '#FFFFFF',
  },
  ctaTextMuted: {
    color: COLORS.primaryText,
  },
  emptyWrap: {
    width: '100%',
    paddingHorizontal: 8,
  },
});
