import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { ArrowLeft, Gavel, Users, ShoppingBag, Clock, Check } from 'lucide-react-native';

export default function AuctionDetailScreen() {
  const router = useRouter();
  const { id: auctionId } = useLocalSearchParams<{ id: string }>();
  
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [bids, setBids] = useState<any[]>([]);
  
  useEffect(() => {
    fetchAuctionDetails();
  }, [auctionId]);
  
  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auctions/${auctionId}`);
      const data = await response.json();
      if (data.success) {
        setAuction(data.data);
        setBids(data.data.bids || []);
      }
    } catch (error) {
      console.error('Error fetching auction:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlaceBid = async () => {
    const bidValue = parseFloat(bidAmount);
    
    if (!bidValue || bidValue <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }
    
    setPlacingBid(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalThis?.localStorage?.getItem?.('token') || ''}`,
        },
        body: JSON.stringify({
          auctionId: auctionId,
          amount: bidValue,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Bid Placed!', 'Your bid has been placed successfully');
        setBidAmount('');
        fetchAuctionDetails();
      } else {
        Alert.alert('Error', data.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      Alert.alert('Error', 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };
  
  const handleBuyNow = () => {
    Alert.alert(
      'Buy Now',
      `Purchase ${auction?.title} for ${auction?.buyNowPrice || '0'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Checkout',
          onPress: () => router.push(`/checkout?auctionId=${auctionId}`),
        }
      ]
    );
  };
  
  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Proceed to checkout to complete your purchase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => router.push(`/checkout?auctionId=${auctionId}`),
        },
      ]
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
          <Text style={styles.loadingText}>Loading auction...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!auction) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerContainer}>
          <Gavel size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>Auction not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.primaryGold} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const hasEnded = auction.status === 'ended';
  const timeLeft = auction.ends_at ? new Date(auction.ends_at).getTime() - new Date().getTime() : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Auction</Text>
          <View style={[styles.statusBadge, { backgroundColor: hasEnded ? COLORS.cardBackground : COLORS.liveIndicator }]}>
            <Text style={styles.statusText}>{auction.status?.toUpperCase() || 'ACTIVE'}</Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.productImageContainer}>
          {auction.images && auction.images[0] ? (
            <Image
              source={{ uri: auction.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <ShoppingBag size={64} color={COLORS.textMuted} />
            </View>
          )}
          {hasEnded && auction.status === 'ended' && (
            <View style={styles.endedBadge}>
              <Check size={16} color={COLORS.primaryGold} />
              <Text style={styles.endedText}>ENDED</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{auction.title}</Text>
          <Text style={styles.productDescription} numberOfLines={3}>
            {auction.description || 'No description available'}
          </Text>
          
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              {auction.seller?.avatarUrl ? (
                <Image
                  source={{ uri: auction.seller?.avatarUrl }}
                  style={styles.sellerAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.sellerAvatarPlaceholder, { backgroundColor: COLORS.primaryGold }]}>
                  <Text style={styles.sellerInitial}>
                    {auction.seller?.username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>@{auction.seller?.username || 'seller'}</Text>
              <View style={styles.sellerRating}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.auctionSection}>
          <View style={styles.timerContainer}>
            <Text style={styles.auctionInfoText}>
              {hasEnded ? 'Auction Ended' : `Time Left: ${Math.max(0, Math.floor(timeLeft / 60000))}:${String(Math.max(0, Math.floor((timeLeft % 60000) / 1000))).padStart(2, '0')}`}
            </Text>
          </View>
          
          <View style={styles.auctionStats}>
            <View style={styles.stat}>
              <Users size={16} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{auction.viewerCount || 0}</Text>
              <Text style={styles.statLabel}>Watching</Text>
            </View>
            <View style={styles.stat}>
              <Gavel size={16} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{bids.length}</Text>
              <Text style={styles.statLabel}>Bids</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.currentBidContainer}>
          <Text style={styles.sectionTitle}>Current Bid: ${auction.currentBid || auction.current_price || '0'}</Text>
          
          {!hasEnded && (
            <View style={styles.biddingSection}>
              <Text style={styles.sectionSubtitle}>Place Your Bid</Text>
              
              <View style={styles.bidInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.bidInput}
                  placeholder="Enter amount"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity
                  style={[styles.placeBidButton, placingBid && styles.placeBidButtonDisabled]}
                  onPress={handlePlaceBid}
                  disabled={placingBid || !bidAmount}
                >
                  {placingBid ? (
                    <ActivityIndicator size="small" color={COLORS.luxuryBlack} />
                  ) : (
                    <Text style={styles.placeBidText}>Place Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.quickBidButton} onPress={() => setBidAmount(((auction.currentBid || auction.current_price || 0) + 100).toString())}>
                <Text style={styles.quickBidText}>+$100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBidButton} onPress={() => setBidAmount(((auction.currentBid || auction.current_price || 0) + 500).toString())}>
                <Text style={styles.quickBidText}>+$500</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBidButton} onPress={() => setBidAmount(((auction.currentBid || auction.current_price || 0) + 1000).toString())}>
                <Text style={styles.quickBidText}>+$1,000</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {auction.buyNowPrice && (
            <View style={styles.buyNowSection}>
              <Text style={styles.buyNowPrice}>Buy Now: {auction.buyNowPrice || '0'}</Text>
              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={handleBuyNow}
              >
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {hasEnded && (
          <View style={styles.checkoutSection}>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.bidsSection}>
          <View style={styles.bidsHeader}>
            <Text style={styles.bidsTitle}>Bid History</Text>
            <Text style={styles.bidsCount}>{bids.length} bids</Text>
          </View>
          
          {bids.length > 0 ? (
            <View style={styles.bidsList}>
              {bids.map((bid, index) => (
                <View key={bid.id} style={styles.bidItem}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.bidderName}>@{bid.bidder?.username || 'User'}</Text>
                    <Text style={styles.bidRank}>#{index + 1}</Text>
                  </View>
                  <View style={styles.bidDetails}>
                    <Text style={styles.bidAmount}>${bid.amount}</Text>
                  <Text style={styles.bidTime}>
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noBids}>
              <Gavel size={32} color={COLORS.textMuted} />
              <Text style={styles.noBidsText}>No bids yet</Text>
              <Text style={styles.noBidsSubtext}>Be the first to place a bid!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkSurface,
  },
  endedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  endedText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginLeft: 8,
  },
  productInfo: {
    padding: 24,
    backgroundColor: COLORS.luxuryBlackLight,
  },
  productTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  productDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: 40,
    height: 40,
    },
  sellerAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitial: {
    color: COLORS.luxuryBlack,
    fontSize: 18,
    fontWeight: '700',
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    color: COLORS.primaryGold,
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  auctionSection: {
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  auctionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  auctionInfoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    },
  currentBidContainer: {
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
  },
  biddingSection: {
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.darkSurface,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontSize: 18,
    },
  placeBidButton: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  placeBidButtonDisabled: {
    opacity: 0.5,
  },
  placeBidText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  quickBidButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  quickBidButton: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  quickBidText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  buyNowSection: {
    marginTop: 16,
  },
  buyNowPrice: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  buyNowAmount: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  buyNowButton: {
    backgroundColor: COLORS.successGreen,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buyNowText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutSection: {
    padding: 24,
  },
  checkoutButton: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  bidsSection: {
    padding: 24,
  },
  bidsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bidsTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  bidsCount: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  bidsList: {},
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlackLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  bidHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidderName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    },
  bidRank: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  bidDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidAmount: {
    color: COLORS.primaryGold,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 24,
  },
  bidTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  noBids: {
    alignItems: 'center',
    padding: 40,
  },
  noBidsText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  noBidsSubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
