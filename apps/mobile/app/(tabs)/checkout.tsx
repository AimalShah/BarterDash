import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { CreditCard, Package, Timer, Trophy, Truck } from 'lucide-react-native';
import { cartService } from '@/lib/api/services/cart';
import { paymentsService } from '@/lib/api/services/payments';
import { getWalletPaymentSheetParams } from '@/lib/payments/walletConfig';
import { useCartStore } from '@/store/cartStore';
import { CartTotal, ShippingAddress } from '@/types';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
} from '@/components/design';

const EMPTY_ADDRESS: ShippingAddress = {
  name: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function CheckoutScreen() {
  const [cartTotal, setCartTotal] = useState<CartTotal | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number | null>(null);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { setCount } = useCartStore();

  const fetchCartTotal = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const total = await cartService.calculateTotal();
      setCartTotal(total);
    } catch (error) {
      console.error('Failed to fetch cart total:', error);
      Alert.alert('Error', 'Failed to load cart information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCartTotal();
  }, [fetchCartTotal]);

  const updateAddress = useCallback(
    <K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) => {
      setShippingAddress((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!cartTotal) {
      return;
    }

    if (
      !shippingAddress.name ||
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      Alert.alert('Incomplete Address', 'Please fill in all shipping details to proceed.');
      return;
    }

    setPlacingOrder(true);

    try {
      const order = pendingOrderId
        ? { id: pendingOrderId, total: pendingOrderTotal ?? cartTotal.total }
        : await cartService.checkout(shippingAddress);

      const amount = Number(order.total);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid order total for payment.');
      }

      if (!pendingOrderId) {
        setPendingOrderId(order.id);
        setPendingOrderTotal(amount);
      }

      const paymentSheetParams = await paymentsService.createPaymentSheet({
        orderId: order.id,
        amount,
        currency: 'usd',
        setupFutureUsage: 'off_session',
        automaticPaymentMethods: true,
      });

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentSheetParams.paymentIntent,
        customerEphemeralKeySecret: paymentSheetParams.ephemeralKey,
        customerId: paymentSheetParams.customer,
        merchantDisplayName: 'BarterDash',
        ...getWalletPaymentSheetParams(),
        returnURL: 'barterdash://checkout/success',
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: shippingAddress.name || 'BarterDash Customer',
        },
      });

      if (initError) {
        throw new Error(initError.message || 'Cannot initialize payment sheet right now.');
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          Alert.alert(
            'Payment Cancelled',
            'Your order was created but payment was cancelled. You can complete payment from secure checkout.',
            [
              {
                text: 'Open Secure Checkout',
                onPress: () => router.push(`/checkout/${order.id}`),
              },
              {
                text: 'Later',
                style: 'cancel',
              },
            ]
          );
          return;
        }

        throw new Error(presentError.message || 'Payment could not be processed right now.');
      }

      setCount(0);
      setPendingOrderId(null);
      setPendingOrderTotal(null);

      Alert.alert('Payment Successful', 'Your order has been placed and payment is complete.', [
        {
          text: 'Open Receipt',
          onPress: () => router.replace(`/checkout/${order.id}`),
        },
        {
          text: 'Continue Shopping',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      const apiErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
      const fallbackMessage = error?.message || 'Payment could not be processed right now. Please try again.';
      Alert.alert('Checkout Error', apiErrorMessage || fallbackMessage);
    } finally {
      setPlacingOrder(false);
    }
  }, [
    cartTotal,
    initPaymentSheet,
    pendingOrderId,
    pendingOrderTotal,
    presentPaymentSheet,
    setCount,
    shippingAddress,
  ]);

  const winningItem = cartTotal?.items?.[0]?.product;

  const displayedTotals = useMemo(() => {
    const subtotal = Number(cartTotal?.subtotal ?? 0);
    const shipping = Number(cartTotal?.shipping ?? 0);
    const tax = Number(cartTotal?.tax ?? 0);
    const total = Number(cartTotal?.total ?? subtotal + shipping + tax);

    return { subtotal, shipping, tax, total };
  }, [cartTotal]);

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.loadingWrap}>
        <Text style={styles.loadingTitle}>Preparing Checkout...</Text>
        <Text style={styles.loadingSubtitle}>Fetching your cart and delivery details</Text>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchCartTotal(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader title="Checkout" onBack={() => router.back()} subtitle="Secure order flow" />

      <View style={styles.contentPad}>
        <StitchCard style={styles.timerCard}>
          <View style={styles.timerLeft}>
            <Timer size={16} color={COLORS.primaryBlue} />
            <Text style={styles.timerLabel}>Complete purchase within</Text>
          </View>
          <Text style={styles.timerValue}>04:52</Text>
        </StitchCard>

        <View style={styles.wonRow}>
          <Trophy size={22} color="#EAB308" />
          <Text style={styles.wonTitle}>You Won</Text>
        </View>

        <StitchCard style={styles.itemCard}>
          <View style={styles.itemRow}>
            <Image
              source={{
                uri:
                  (winningItem as any)?.images?.[0] ||
                  (winningItem as any)?.thumbnail_url ||
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
              }}
              style={styles.itemImage}
            />

            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {winningItem?.title || 'Auction Item'}
              </Text>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {(winningItem as any)?.condition || 'Collector Condition'}
              </Text>
              <Text style={styles.itemPriceLabel}>Winning Bid</Text>
              <Text style={styles.itemPrice}>{formatMoney(displayedTotals.subtotal)}</Text>
            </View>
          </View>
        </StitchCard>

        <View style={styles.sectionTop}>
          <View style={styles.sectionHead}>
            <Truck size={16} color={COLORS.primaryBlue} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
        </View>

        <StitchCard style={styles.formCard}>
          <AddressField
            label="Full Name"
            value={shippingAddress.name}
            placeholder="e.g. John Doe"
            onChangeText={(text) => updateAddress('name', text)}
          />

          <AddressField
            label="Street Address"
            value={shippingAddress.line1}
            placeholder="123 Barter Lane"
            onChangeText={(text) => updateAddress('line1', text)}
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldItem}>
              <AddressField
                label="City"
                value={shippingAddress.city}
                placeholder="New York"
                onChangeText={(text) => updateAddress('city', text)}
              />
            </View>
            <View style={styles.inlineFieldItem}>
              <AddressField
                label="State"
                value={shippingAddress.state}
                placeholder="NY"
                onChangeText={(text) => updateAddress('state', text)}
              />
            </View>
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.inlineFieldItem}>
              <AddressField
                label="ZIP"
                value={shippingAddress.postalCode}
                placeholder="10001"
                keyboardType="number-pad"
                onChangeText={(text) => updateAddress('postalCode', text)}
              />
            </View>
            <View style={styles.inlineFieldItem}>
              <AddressField
                label="Country"
                value={shippingAddress.country}
                placeholder="USA"
                onChangeText={(text) => updateAddress('country', text)}
              />
            </View>
          </View>
        </StitchCard>

        <View style={styles.sectionTop}>
          <View style={styles.sectionHead}>
            <CreditCard size={16} color={COLORS.primaryBlue} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
        </View>

        <StitchCard>
          <View style={styles.walletButton}>
            <Text style={styles.walletButtonText}>Apple Pay + Card via Stripe</Text>
          </View>
        </StitchCard>

        <View style={styles.sectionTop}>
          <View style={styles.sectionHead}>
            <Package size={16} color={COLORS.primaryBlue} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
        </View>

        <StitchCard>
          <SummaryRow label={`Items (${cartTotal?.items?.length || 0})`} value={formatMoney(displayedTotals.subtotal)} />
          <SummaryRow label="Shipping" value={formatMoney(displayedTotals.shipping)} />
          <SummaryRow label="Estimated Tax" value={formatMoney(displayedTotals.tax)} />
          <View style={styles.divider} />
          <SummaryRow label="Total" value={formatMoney(displayedTotals.total)} total />
        </StitchCard>

        <View style={styles.ctaWrap}>
          <StitchPrimaryButton
            label={placingOrder ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
            onPress={handlePlaceOrder}
            disabled={placingOrder || !cartTotal}
          />
          <Text style={styles.ctaHint}>Fast and secure payment processing</Text>
        </View>
      </View>
    </StitchPage>
  );
}

function SummaryRow({ label, value, total = false }: { label: string; value: string; total?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={total ? styles.summaryTotalLabel : styles.summaryLabel}>{label}</Text>
      <Text style={total ? styles.summaryTotalValue : styles.summaryValue}>{value}</Text>
    </View>
  );
}

function AddressField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGrey}
        keyboardType={keyboardType || 'default'}
        style={styles.fieldInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF4FF',
    borderColor: '#D3E2FB',
    marginBottom: 16,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  timerValue: {
    color: COLORS.primaryBlue,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  wonTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  itemCard: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  itemImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#EEF2F7',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 2,
  },
  itemPriceLabel: {
    marginTop: 6,
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemPrice: {
    color: COLORS.primaryBlue,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTop: {
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  formCard: {
    marginBottom: 8,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.7,
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E0EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: COLORS.primaryText,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineFieldItem: {
    flex: 1,
  },
  walletButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.lightGrey,
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryTotalValue: {
    color: COLORS.primaryBlue,
    fontSize: 20,
    fontWeight: '800',
  },
  ctaWrap: {
    marginTop: 16,
    marginBottom: 24,
  },
  ctaHint: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.lightGrey,
    fontSize: 12,
    fontWeight: '600',
  },
});
