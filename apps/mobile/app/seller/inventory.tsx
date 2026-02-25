import { useEffect, useMemo, useState } from 'react'; import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { router } from 'expo-router';
import { MoreVertical, Plus, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { productsService } from '@/lib/api/services/products';
import { COLORS } from '@/constants/colors';
import { StitchChip, StitchHeader, StitchPage, StitchSectionTitle } from '@/components/design';

type ProductFilter = 'all' | 'active' | 'sold' | 'scheduled';

export default function InventoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilter>('all');

  useEffect(() => {
    void fetchInventory();
  }, []);

  async function fetchInventory(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setProducts([]);
        return;
      }

      const items = await productsService.getSellerProducts(data.user.id);
      setProducts(Array.isArray(items) ? items : []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    const base = products.filter((item) => {
      const matchesSearch = !search.trim()
        ? true
        : String(item.title || '')
            .toLowerCase()
            .includes(search.trim().toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'scheduled') return item.status === 'scheduled';
      return item.status === filter;
    });

    return base;
  }, [filter, products, search]);

  async function onDelete(id: string) {
    Alert.alert('Delete product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await productsService.delete(id);
            await fetchInventory();
          } catch (error) {
            Alert.alert('Delete failed', 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchInventory(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="My Inventory"
        subtitle={`${products.length} listed items`}
        onBack={() => router.back()}
        rightNode={
          <Pressable style={styles.iconBtn} onPress={() => router.push('/seller/add-product')}>
            <Plus size={16} color={COLORS.primaryBlue} />
          </Pressable>
        }
      />

      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={COLORS.lightGrey} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, SKUs, or tags..."
            placeholderTextColor={COLORS.lightGrey}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          <StitchChip label={`All (${products.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <StitchChip
            label={`Active (${products.filter((p) => p.status === 'active').length})`}
            active={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <StitchChip
            label={`Sold (${products.filter((p) => p.status === 'sold').length})`}
            active={filter === 'sold'}
            onPress={() => setFilter('sold')}
          />
          <StitchChip
            label={`Scheduled (${products.filter((p) => p.status === 'scheduled').length})`}
            active={filter === 'scheduled'}
            onPress={() => setFilter('scheduled')}
          />
        </ScrollView>
      </View>

      <View style={styles.contentPad}>
        <StitchSectionTitle title="Product Management" />

        {loading ? (
          <Text style={styles.loadingText}>Loading inventory...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No products match this filter.</Text>
        ) : (
          filtered.map((product) => {
            const image =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400';
            const status = String(product.status || 'draft').toUpperCase();

            return (
              <View key={product.id} style={styles.productRow}>
                <Image source={{ uri: image }} style={styles.productImage} />

                <View style={styles.productMain}>
                  <View style={styles.productHead}>
                    <Text style={styles.productTitle} numberOfLines={1}>{product.title || 'Untitled product'}</Text>
                    <Pressable onPress={() => onDelete(product.id)}>
                      <MoreVertical size={16} color={COLORS.lightGrey} />
                    </Pressable>
                  </View>

                  <Text style={styles.productMeta}>
                    {product.condition || 'Good'} • ${Number(product.price || product.buyNowPrice || 0).toFixed(2)}
                  </Text>

                  <View style={styles.productFooter}>
                    <Text style={styles.offersText}>
                      {Number(product.offerCount || 0)} active offers
                    </Text>
                    <View style={[styles.statusPill, status === 'ACTIVE' ? styles.statusLive : status === 'SOLD' ? styles.statusSold : styles.statusMuted]}>
                      <Text style={[styles.statusPillText, status === 'ACTIVE' ? styles.statusPillTextLive : status === 'SOLD' ? styles.statusPillTextSold : styles.statusPillTextMuted]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Pressable style={styles.loadMoreBtn} onPress={() => router.push('/seller/add-product')}>
          <Text style={styles.loadMoreText}>Add another item</Text>
        </Pressable>
      </View>
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
    paddingLeft: 38,
    paddingRight: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  filtersWrap: {
    paddingTop: 10,
  },
  filtersRow: {
    paddingHorizontal: 16,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    marginTop: 12,
  },
  productRow: {
    marginTop: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  productImage: {
    width: 86,
    height: 86,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  productMain: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  productTitle: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  productMeta: {
    marginTop: 3,
    color: COLORS.lightGrey,
    fontSize: 12,
  },
  productFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offersText: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLive: {
    backgroundColor: '#DCFCE7',
  },
  statusSold: {
    backgroundColor: '#E8F0FE',
  },
  statusMuted: {
    backgroundColor: '#E2E8F0',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPillTextLive: {
    color: '#15803D',
  },
  statusPillTextSold: {
    color: COLORS.primaryBlue,
  },
  statusPillTextMuted: {
    color: '#475569',
  },
  loadMoreBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
