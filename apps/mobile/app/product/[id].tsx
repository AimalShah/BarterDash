import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Heart, MessageCircle, ShieldCheck, Share2 } from 'lucide-react-native';
import { useProductById } from '@/hooks/useProducts';
import { cartService } from '@/lib/api/services/cart';
import { productsService } from '@/lib/api/services/products';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSecondaryButton,
} from '@/components/design';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productQuery = useProductById(id);
  const product = productQuery.data as any;

  const [loadingAction, setLoadingAction] = useState<'cart' | 'buy' | null>(null);

  async function handleAddToCart() {
    if (!product?.id) return;

    try {
      setLoadingAction('cart');
      await cartService.addItem(product.id, 1);
      Alert.alert('Added to cart', 'This item is now in your cart.', [
        { text: 'Continue' },
        { text: 'View cart', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (error: any) {
      Alert.alert('Unable to add item', error?.message || 'Please try again.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleBuyNow() {
    if (!product?.id) return;

    try {
      setLoadingAction('buy');
      const result = await productsService.buyNow(product.id);
      router.push(`/checkout/${result.order.id}`);
    } catch (error: any) {
      Alert.alert('Unable to buy now', error?.message || 'Please try again.');
    } finally {
      setLoadingAction(null);
    }
  }

  if (productQuery.isLoading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.loadingText}>Loading item details...</Text>
      </StitchPage>
    );
  }

  if (!product) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.emptyText}>Product not found.</Text>
      </StitchPage>
    );
  }

  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400';
  const sellerName = product.seller?.username || product.seller_name || 'Verified Seller';
  const price = Number(product.price || product.buyNowPrice || 0);

  return (
    <StitchPage contentStyle={{ paddingBottom: 150 }}>
      <StitchHeader
        title="Item Details"
        onBack={() => router.back()}
        rightNode={
          <View style={styles.headerActions}>
            <View style={styles.iconBtn}><Share2 size={15} color={COLORS.primaryBlue} /></View>
            <View style={styles.iconBtn}><Heart size={15} color={COLORS.primaryBlue} /></View>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: image }} style={styles.heroImage} />

        <View style={styles.mainPad}>
          <StitchCard style={styles.liveBanner}>
            <View style={styles.liveBannerRow}>
              <View>
                <Text style={styles.liveBannerTitle}>Upcoming Live Session</Text>
                <Text style={styles.liveBannerText}>Sunday Sneaker Grails @ 6:00 PM</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/index')}>
                <Text style={styles.liveBannerLink}>View</Text>
              </Pressable>
            </View>
          </StitchCard>

          <Text style={styles.productTitle}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${price.toFixed(2)}</Text>
            <Text style={styles.priceMeta}>Market Value</Text>
          </View>

          <StitchCard style={styles.sellerCard}>
            <View style={styles.sellerLeft}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>{sellerName[0]?.toUpperCase() || 'S'}</Text>
              </View>
              <View>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>@{sellerName}</Text>
                  <ShieldCheck size={14} color={COLORS.primaryBlue} />
                </View>
                <Text style={styles.sellerMeta}>4.9 rating · 120 trades</Text>
              </View>
            </View>

            <Pressable style={styles.followBtn} onPress={() => router.push(`/user/${product.seller_id || product.seller?.id}`)}>
              <Text style={styles.followBtnText}>Profile</Text>
            </Pressable>
          </StitchCard>

          <View style={styles.specGrid}>
            <StitchCard style={styles.specCard}>
              <Text style={styles.specLabel}>Condition</Text>
              <Text style={styles.specValue}>{product.condition || 'Like New'}</Text>
            </StitchCard>
            <StitchCard style={styles.specCard}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>{product.category?.name || 'Collectibles'}</Text>
            </StitchCard>
            <StitchCard style={styles.specCard}>
              <Text style={styles.specLabel}>Ships From</Text>
              <Text style={styles.specValue}>{product.location || 'New York, NY'}</Text>
            </StitchCard>
            <StitchCard style={styles.specCard}>
              <Text style={styles.specLabel}>Authenticity</Text>
              <View style={styles.verifiedRow}>
                <CheckCircle2 size={14} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </StitchCard>
          </View>

          <View style={styles.descriptionBlock}>
            <Text style={styles.sectionTitle}>About this item</Text>
            <Text style={styles.descriptionText}>
              {product.description ||
                'Great condition collectible with complete accessories. This listing follows BarterDash authenticity standards and ships securely.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.actionHalf}>
          <StitchSecondaryButton
            label={loadingAction === 'cart' ? 'Adding...' : 'Add to Cart'}
            onPress={handleAddToCart}
            disabled={loadingAction !== null}
          />
        </View>
        <View style={styles.actionHalf}>
          <StitchPrimaryButton
            label={loadingAction === 'buy' ? 'Processing...' : 'Buy Now'}
            onPress={handleBuyNow}
            disabled={loadingAction !== null}
          />
        </View>
      </View>

      <Pressable style={styles.contactFab} onPress={() => router.push('/(tabs)/inbox')}>
        <MessageCircle size={18} color="#FFFFFF" />
      </Pressable>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.lightGrey,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    height: 32,
    width: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 340,
  },
  mainPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  liveBanner: {
    marginBottom: 14,
    backgroundColor: '#ECF4FF',
  },
  liveBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBannerTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  liveBannerText: {
    marginTop: 2,
    color: COLORS.lightGrey,
    fontSize: 12,
  },
  liveBannerLink: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  productTitle: {
    color: COLORS.primaryText,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    color: COLORS.primaryBlue,
    fontSize: 28,
    fontWeight: '700',
  },
  priceMeta: {
    color: COLORS.lightGrey,
    fontSize: 12,
    fontWeight: '600',
  },
  sellerCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sellerAvatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
  },
  sellerInitial: {
    color: COLORS.primaryBlue,
    fontSize: 17,
    fontWeight: '700',
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  sellerMeta: {
    marginTop: 2,
    color: COLORS.lightGrey,
    fontSize: 11,
  },
  followBtn: {
    borderWidth: 1,
    borderColor: '#C5D9FB',
    backgroundColor: '#EEF4FF',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  followBtnText: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  specGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  specCard: {
    width: '50%',
    paddingHorizontal: 10,
    marginBottom: 10,
    marginHorizontal: 5,
    flex: 1,
  },
  specLabel: {
    color: COLORS.lightGrey,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
    marginBottom: 5,
  },
  specValue: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  descriptionBlock: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    color: COLORS.lightGrey,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  actionHalf: {
    flex: 1,
  },
  contactFab: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlue,
  },
});
