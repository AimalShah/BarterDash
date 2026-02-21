import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { cartService } from '@/lib/api/services/cart';
import { CartItem, CartTotal } from '@/types';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchPrimaryButton, StitchSecondaryButton, StitchCard, StitchEmpty } from '@/components/design';

export default function CartScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<CartTotal | null>(null);

  useEffect(() => {
    void loadCart();
  }, []);

  async function loadCart(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await cartService.getCart();
      setItems(list);

      if (list.length > 0) {
        const totals = await cartService.calculateTotal();
        setTotal(totals);
      } else {
        setTotal(null);
      }

      setError(null);
    } catch (error: any) {
      setError(error?.response?.data?.error?.message || 'Failed to load cart');
      setItems([]);
      setTotal(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateQuantity(id: string, quantity: number) {
    try {
      await cartService.updateQuantity(id, quantity);
      await loadCart();
    } catch (error: any) {
      Alert.alert('Unable to update quantity', error?.response?.data?.error?.message || 'Please try again.');
    }
  }

  async function removeItem(id: string) {
    try {
      await cartService.removeItem(id);
      await loadCart();
    } catch (error) {
      Alert.alert('Unable to remove item', 'Please try again.');
    }
  }

  const totalAmount = useMemo(() => Number(total?.total || 0), [total]);

  return (
    <StitchPage
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCart(true)} tintColor={COLORS.primaryBlue} />}
      contentStyle={{ paddingBottom: 150 }}
    >
      <StitchHeader title="Checkout" subtitle="Review your bag" />

      <View style={styles.contentPad}>
        {loading ? <Text style={styles.loadingText}>Loading your bag...</Text> : null}

        {!loading && error ? (
          <StitchCard>
            <Text style={styles.errorTitle}>Cart error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActionWrap}>
              <StitchPrimaryButton label="Retry" onPress={() => loadCart()} />
            </View>
          </StitchCard>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}><ShoppingCart size={28} color={COLORS.primaryBlue} /></View>
            <StitchEmpty title="Your bag is empty" subtitle="Add items from live shows or product listings." />
            <StitchPrimaryButton label="Start shopping" onPress={() => router.push('/(tabs)')} />
          </View>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <View style={styles.listWrap}>
            {items.map((item) => {
              const product = item.product;
              const image =
                product?.images?.[0] ||
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400';

              return (
                <StitchCard key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: image }} style={styles.itemImage} />

                  <View style={styles.itemMain}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{product?.title || 'Item'}</Text>
                    <Text style={styles.itemPrice}>${Number(product?.price || 0).toFixed(2)}</Text>

                    <View style={styles.itemFooter}>
                      <View style={styles.qtyWrap}>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => {
                            if (item.quantity > 1) {
                              void updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                        >
                          <Minus size={14} color={COLORS.primaryBlue} />
                        </Pressable>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <Pressable style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={14} color={COLORS.primaryBlue} />
                        </Pressable>
                      </View>

                      <Pressable style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                        <Trash2 size={14} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                </StitchCard>
              );
            })}
          </View>
        ) : null}
      </View>

      {!loading && !error && items.length > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.ctaHalf}>
              <StitchSecondaryButton
                label="Clear Cart"
                onPress={() => {
                  Alert.alert('Clear cart', 'Remove all items from cart?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        await cartService.clearCart();
                        await loadCart();
                      },
                    },
                  ]);
                }}
              />
            </View>
            <View style={styles.ctaHalf}>
              <StitchPrimaryButton label="Checkout" onPress={() => router.push('/(tabs)/checkout')} />
            </View>
          </View>
        </View>
      ) : null}
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  errorTitle: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    marginTop: 6,
  },
  errorActionWrap: {
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  emptyIcon: {
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    marginBottom: 8,
  },
  listWrap: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E2E8F0',
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  itemPrice: {
    marginTop: 4,
    color: COLORS.primaryBlue,
    fontSize: 16,
    fontWeight: '700',
  },
  itemFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyWrap: {
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    width: 30,
    textAlign: 'center',
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalWrap: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.lightGrey,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  totalValue: {
    color: COLORS.primaryBlue,
    fontSize: 24,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaHalf: {
    flex: 1,
  },
});
