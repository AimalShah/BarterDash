import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { ordersService } from '@/lib/api/services/orders';
import { COLORS } from '@/constants/colors';
import { StitchChip, StitchHeader, StitchPage } from '@/components/design';

type Filter = 'all' | 'pending' | 'shipped' | 'delivered';

export default function SalesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    void fetchSales();
  }, []);

  async function fetchSales(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await ordersService.getMySales();
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      setSales([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    return sales.filter((sale) => {
      const matchFilter = filter === 'all' ? true : String(sale.status).toLowerCase() === filter;
      if (!matchFilter) return false;

      if (!query.trim()) return true;

      const term = query.trim().toLowerCase();
      const title = String(sale.product?.title || '').toLowerCase();
      const order = String(sale.orderNumber || '').toLowerCase();
      return title.includes(term) || order.includes(term);
    });
  }, [filter, query, sales]);

  function statusStyle(status: string) {
    const normalized = status?.toLowerCase();

    if (normalized === 'pending' || normalized === 'processing') {
      return { pill: styles.statusPending, text: styles.statusTextPending };
    }

    if (normalized === 'shipped') {
      return { pill: styles.statusShipped, text: styles.statusTextShipped };
    }

    if (normalized === 'delivered' || normalized === 'completed') {
      return { pill: styles.statusDelivered, text: styles.statusTextDelivered };
    }

    return { pill: styles.statusMuted, text: styles.statusTextMuted };
  }

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchSales(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader title="Order History" subtitle={`${sales.length} total orders`} onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={COLORS.lightGrey} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by item name or order ID"
            placeholderTextColor={COLORS.lightGrey}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <StitchChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <StitchChip label="Pending" active={filter === 'pending'} onPress={() => setFilter('pending')} />
          <StitchChip label="Shipped" active={filter === 'shipped'} onPress={() => setFilter('shipped')} />
          <StitchChip label="Delivered" active={filter === 'delivered'} onPress={() => setFilter('delivered')} />
        </ScrollView>
      </View>

      <View style={styles.listPad}>
        {loading ? <Text style={styles.loadingText}>Loading order history...</Text> : null}

        {!loading && filtered.length === 0 ? (
          <Text style={styles.emptyText}>No orders match your current filters.</Text>
        ) : (
          filtered.map((sale) => {
            const image =
              sale.product?.images?.[0] ||
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400';
            const styleForStatus = statusStyle(String(sale.status));

            return (
              <Pressable key={sale.id} style={styles.orderCard} onPress={() => router.push(`/seller/order/${sale.id}`)}>
                <View style={styles.orderHead}>
                  <Text style={styles.orderNumber}>#{String(sale.orderNumber || sale.id).slice(-8).toUpperCase()}</Text>
                  <View style={[styles.statusPill, styleForStatus.pill]}>
                    <Text style={[styles.statusText, styleForStatus.text]}>{sale.status}</Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <Image source={{ uri: image }} style={styles.orderImage} />
                  <View style={styles.orderMain}>
                    <Text style={styles.orderTitle} numberOfLines={1}>{sale.product?.title || 'Unknown item'}</Text>
                    <Text style={styles.orderDate}>{new Date(sale.createdAt).toLocaleDateString()}</Text>
                    <View style={styles.orderBottom}>
                      <Text style={styles.orderAmount}>${Number(sale.total || 0).toFixed(2)}</Text>
                      <Text style={styles.arrow}>›</Text>
                    </View>
                  </View>
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInputWrap: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },
  searchInput: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 38,
    paddingRight: 12,
  },
  filterWrap: {
    paddingTop: 10,
  },
  filterRow: {
    paddingHorizontal: 16,
  },
  listPad: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadingText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    marginTop: 8,
  },
  orderCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  orderHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusShipped: {
    backgroundColor: '#E8F0FE',
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusMuted: {
    backgroundColor: '#E2E8F0',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextShipped: {
    color: COLORS.primaryBlue,
  },
  statusTextDelivered: {
    color: '#15803D',
  },
  statusTextMuted: {
    color: '#475569',
  },
  orderBody: {
    flexDirection: 'row',
  },
  orderImage: {
    width: 82,
    height: 82,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  orderMain: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  orderDate: {
    color: COLORS.lightGrey,
    fontSize: 11,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    color: COLORS.primaryBlue,
    fontSize: 18,
    fontWeight: '700',
  },
  arrow: {
    color: COLORS.lightGrey,
    fontSize: 22,
    fontWeight: '500',
  },
});
