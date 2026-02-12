import React from 'react';
import { StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
    Box,
    ScrollView,
    Image,
    Pressable,
    Heading,
    Text,
    VStack,
    HStack,
    Center,
    Button,
    ButtonText
} from '@gluestack-ui/themed';
import { ChevronLeft, Share2, Heart, Truck, ShieldCheck, User, Gavel, ChevronRight, ShoppingCart, Zap } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { productsService } from '@/lib/api/services/products';
import { cartService } from '@/lib/api/services/cart';
import { Product } from '@/types';
import { Spinner } from '@gluestack-ui/themed';
import { COLORS } from '../../constants/colors';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const { profile } = useAuthStore();
    const [product, setProduct] = React.useState<Product | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const data = await productsService.findById(id as string);
            setProduct(data);
        } catch (error) {
            console.error('Error fetching product details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToBag = async () => {
        if (!product) return;
        try {
            setActionLoading('cart');
            await cartService.addItem(product.id);
            Alert.alert('Added to Bag', 'Item has been added to your shopping bag', [
                { text: 'Continue Shopping', style: 'default' },
                { text: 'View Bag', onPress: () => router.push('/(tabs)/cart') }
            ]);
        } catch (error: any) {
            console.error('Error adding to bag:', error);
            Alert.alert('Error', error.message || 'Failed to add item to bag');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBuyNow = async () => {
        if (!product) return;
        try {
            setActionLoading('buy');
            const result = await productsService.buyNow(product.id);
            router.push(`/checkout/${result.order.id}`);
        } catch (error: any) {
            console.error('Error with buy now:', error);
            Alert.alert('Error', error.message || 'Failed to process purchase');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePlaceBid = () => {
        if (!product) return;
        const streamId = (product as any).streamId || (product as any).stream_id;
        if (streamId) {
            router.push(`/stream/${streamId}`);
        } else {
            Alert.alert('Coming Soon', 'Bidding will be available during live streams');
        }
    };

    const handleBuyout = async () => {
        if (!product) return;
        const buyoutPrice = (product as any).buyout_price || (product as any).buyNowPrice;
        Alert.alert(
            'Buy Now',
            `Purchase this item immediately for $${buyoutPrice}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Buy Now', 
                    style: 'default',
                    onPress: handleBuyNow
                }
            ]
        );
    };

    if (loading) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
        );
    }

    if (!product) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Text color={COLORS.textPrimary}>Product not found</Text>
            </Center>
        );
    }

    const sellerName = (product as any).seller?.username || (product as any).seller_name || 'Verified Seller';
    const isOwner = profile?.id === (product.seller_id || (product as any).sellerId);

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <Box position="relative">
                    {/* Header Actions */}
                    <Box position="absolute" top="$12" left="$6" zIndex={10}>
                        <Pressable
                            onPress={() => router.back()}
                            h={44}
                            w={44}
                            bg={COLORS.luxuryBlackLight}
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <ChevronLeft size={24} color={COLORS.textPrimary} />
                        </Pressable>
                    </Box>
                    <Box position="absolute" top="$12" right="$6" zIndex={10} flexDirection="row">
                        <HStack space="md">
                            <Pressable
                                h={44}
                                w={44}
                                bg={COLORS.luxuryBlackLight}
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Share2 size={20} color={COLORS.textPrimary} />
                            </Pressable>
                            <Pressable
                                h={44}
                                w={44}
                                bg={COLORS.luxuryBlackLight}
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Heart size={20} color={COLORS.textPrimary} />
                            </Pressable>
                        </HStack>
                    </Box>

                    {/* image gallery */}
                    <Box h={450} w="$full" bg={COLORS.luxuryBlackLight}>
                        {product.images && product.images.length > 0 ? (
                            <Image
                                source={{ uri: product.images[0] }}
                                alt={product.title}
                                w="100%"
                                h="100%"
                                resizeMode="cover"
                            />
                        ) : (
                            <Center h="100%" w="100%" borderWidth={1} borderColor={COLORS.darkBorder}>
                                <Text color={COLORS.textPrimary} fontWeight="$bold">NO IMAGES</Text>
                            </Center>
                        )}
                    </Box>

                    <Box p="$8" bg={COLORS.luxuryBlack} borderTopWidth={2} borderColor={COLORS.darkBorder}>
                        <HStack justifyContent="space-between" alignItems="center" mb="$8">
                            <Box bg={COLORS.primaryGold} px="$4" py="$1.5" rounded="$sm">
                                <Text color={COLORS.luxuryBlack} size="2xs" fontWeight="$black" textTransform="uppercase">
                                    {(product as any).status === 'live' ? 'LIVE AUCTION' : 'MARKETPLACE'}
                                </Text>
                            </Box>
                            {(product as any).ends_at && (
                                <Text color={COLORS.textSecondary} size="2xs" fontWeight="$black" textTransform="uppercase">
                                    Ends {new Date((product as any).ends_at).toLocaleDateString()}
                                </Text>
                            )}
                        </HStack>

                        <Heading color={COLORS.textPrimary} size="4xl" fontWeight="$black" mb="$4" style={{ letterSpacing: -1 }}>{product.title}</Heading>
                        <HStack alignItems="baseline" space="xs" mb="$10">
                            <Text color={COLORS.primaryGold} size="4xl" fontWeight="$black">${product.price || (product as any).current_price || '0.00'}</Text>
                            <Text color={COLORS.textMuted} size="sm" fontWeight="$bold" textTransform="uppercase">{(product as any).status === 'live' ? 'Current bid' : 'Listing Price'}</Text>
                        </HStack>

                        {/* Seller Info */}
                        <Pressable
                            onPress={() => {
                                const sellerId = product.seller_id || (product as any).sellerId;
                                if (sellerId) router.push(`/user/${sellerId}`);
                            }}
                            mb="$10"
                            p="$5"
                            bg={COLORS.luxuryBlackLight}
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                            flexDirection="row"
                            alignItems="center"
                            sx={{
                                gap: 16
                            }}
                        >
                            <Center h={56} w={56} bg={COLORS.luxuryBlackLighter} borderWidth={1} borderColor={COLORS.darkBorder}>
                                {(product as any).seller?.avatar_url ? (
                                    <Image
                                        source={{ uri: (product as any).seller.avatar_url }}
                                        alt={sellerName}
                                        h="100%"
                                        w="100%"
                                    />
                                ) : (
                                    <User size={28} color={COLORS.textPrimary} />
                                )}
                            </Center>
                            <VStack flex={1}>
                                <Text color={COLORS.textPrimary} fontWeight="$black" size="lg" textTransform="uppercase">{sellerName}</Text>
                                <Text color={COLORS.textMuted} size="xs" fontWeight="$bold" textTransform="uppercase">{product.condition || 'CERTIFIED'}</Text>
                            </VStack>
                            <ChevronRight size={20} color={COLORS.textPrimary} />
                        </Pressable>

                        <Text color={COLORS.textPrimary} size="xs" fontWeight="$black" mb="$4" textTransform="uppercase" letterSpacing={1.2}>Description</Text>
                        <Text color={COLORS.textSecondary} size="md" lineHeight="$xl" mb="$12" fontWeight="$medium">
                            {product.description || 'No description provided.'}
                        </Text>

                        <VStack space="xl" mb="$12">
                            <HStack alignItems="center" space="md">
                                <Truck size={20} color={COLORS.primaryGold} />
                                <Text color={COLORS.textPrimary} size="md" fontWeight="$bold">Ships from New York, USA</Text>
                            </HStack>
                            <HStack alignItems="center" space="md">
                                <ShieldCheck size={20} color={COLORS.primaryGold} />
                                <Text color={COLORS.textPrimary} size="md" fontWeight="$bold">Authenticity Guaranteed</Text>
                            </HStack>
                        </VStack>
                    </Box>
                </Box>
            </ScrollView>

            {/* Bottom Action Bar */}
            <Box bg={COLORS.luxuryBlack} borderTopWidth={1} borderColor={COLORS.darkBorder} px="$8" py="$4" safeAreaBottom>
                {isOwner ? (
                    <HStack space="md" alignItems="center">
                        <VStack flex={1}>
                            <Text color={COLORS.textMuted} size="2xs" textTransform="uppercase" fontWeight="$black" letterSpacing={1} mb="$1">
                                LISTING
                            </Text>
                            <Text color={COLORS.primaryGold} size="2xl" fontWeight="$black">${product.price || '0.00'}</Text>
                        </VStack>
                        <Button
                            onPress={() => router.push(`/seller/product/${product.id}/edit`)}
                            flex={2}
                            h={56}
                            bg={COLORS.luxuryBlackLight}
                            borderColor={COLORS.primaryGold}
                            borderWidth={2}
                            rounded="$sm"
                        >
                            <ButtonText color={COLORS.primaryGold} fontWeight="$black" textTransform="uppercase">Edit Listing</ButtonText>
                        </Button>
                    </HStack>
                ) : (product as any).status === 'live' ? (
                    <HStack space="md" alignItems="center">
                        <VStack flex={1}>
                            <Text color={COLORS.textMuted} size="2xs" textTransform="uppercase" fontWeight="$black" letterSpacing={1} mb="$1">
                                CURRENT BID
                            </Text>
                            <Text color={COLORS.primaryGold} size="2xl" fontWeight="$black">${(product as any).current_price || product.price || '0.00'}</Text>
                        </VStack>
                        {((product as any).buyout_price || (product as any).buyNowPrice) && (
                            <Button
                                onPress={handleBuyout}
                                flex={1}
                                h={56}
                                bg={COLORS.successGreen}
                                rounded="$sm"
                                isDisabled={actionLoading !== null}
                            >
                                {actionLoading === 'buy' ? (
                                    <ActivityIndicator color={COLORS.textPrimary} />
                                ) : (
                                    <ButtonText color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">
                                        Buy ${(product as any).buyout_price || (product as any).buyNowPrice}
                                    </ButtonText>
                                )}
                            </Button>
                        )}
                        <Button
                            onPress={handlePlaceBid}
                            flex={1}
                            h={56}
                            bg={COLORS.primaryGold}
                            rounded="$sm"
                            isDisabled={actionLoading !== null}
                        >
                            <ButtonText color={COLORS.luxuryBlack} fontWeight="$black" textTransform="uppercase">Place Bid</ButtonText>
                        </Button>
                    </HStack>
                ) : (
                    <HStack space="md" alignItems="center">
                        <VStack flex={1}>
                            <Text color={COLORS.textMuted} size="2xs" textTransform="uppercase" fontWeight="$black" letterSpacing={1} mb="$1">
                                TOTAL
                            </Text>
                            <Text color={COLORS.primaryGold} size="2xl" fontWeight="$black">${product.price || '0.00'}</Text>
                        </VStack>
                        <Button
                            onPress={handleAddToBag}
                            flex={1}
                            h={56}
                            bg={COLORS.luxuryBlackLight}
                            borderColor={COLORS.primaryGold}
                            borderWidth={2}
                            rounded="$sm"
                            isDisabled={actionLoading !== null}
                        >
                            {actionLoading === 'cart' ? (
                                <ActivityIndicator color={COLORS.primaryGold} />
                            ) : (
                                <HStack alignItems="center" space="xs">
                                    <ShoppingCart size={16} color={COLORS.primaryGold} />
                                    <ButtonText color={COLORS.primaryGold} fontWeight="$black" textTransform="uppercase">Add to Bag</ButtonText>
                                </HStack>
                            )}
                        </Button>
                        <Button
                            onPress={handleBuyNow}
                            flex={1}
                            h={56}
                            bg={COLORS.primaryGold}
                            rounded="$sm"
                            isDisabled={actionLoading !== null}
                        >
                            {actionLoading === 'buy' ? (
                                <ActivityIndicator color={COLORS.luxuryBlack} />
                            ) : (
                                <HStack alignItems="center" space="xs">
                                    <Zap size={16} color={COLORS.luxuryBlack} />
                                    <ButtonText color={COLORS.luxuryBlack} fontWeight="$black" textTransform="uppercase">Buy Now</ButtonText>
                                </HStack>
                            )}
                        </Button>
                    </HStack>
                )}
            </Box>
        </Box>
    );
}
