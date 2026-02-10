import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import {
    Box,
    VStack,
    HStack,
    Text,
    Heading,
    Pressable,
    Center,
    Spinner,
    Button,
    ButtonText,
} from '@gluestack-ui/themed';
import {
    X,
    Star,
    Users,
    ShoppingBag,
    MessageCircle,
    ExternalLink,
    CheckCircle,
} from 'lucide-react-native';
import { usersService } from '../../lib/api/services/users';
import { socialService } from '../../lib/api/services/social';
import { productsService } from '../../lib/api/services/products';
import { supabase } from '../../lib/supabase';
import { COLORS } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SellerProfileModalProps {
    visible: boolean;
    onClose: () => void;
    sellerId: string;
    sellerName?: string;
    sellerAvatar?: string;
}

export default function SellerProfileModal({
    visible,
    onClose,
    sellerId,
    sellerName,
    sellerAvatar,
}: SellerProfileModalProps) {
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any>(null);
    const [stats, setStats] = useState({ followers: 0, following: 0, products: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (visible && sellerId) {
            fetchSellerData();
            getCurrentUser();
        }
    }, [visible, sellerId]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    const fetchSellerData = async () => {
        setLoading(true);
        try {
            const [userData, socialStats, productsData, following] = await Promise.all([
                usersService.getProfile(sellerId).catch(() => null),
                socialService.getStats(sellerId).catch(() => ({ followers_count: 0, following_count: 0 })),
                productsService.getSellerProducts(sellerId).catch(() => []),
                socialService.isFollowing(sellerId).catch(() => false),
            ]);

            setSeller(userData);
            setStats({
                followers: socialStats.followers_count,
                following: socialStats.following_count,
                products: productsData.length,
            });
            setProducts(productsData.slice(0, 6));
            setIsFollowing(following);
        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (followLoading || currentUserId === sellerId) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollow(sellerId);
                setIsFollowing(false);
                setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
            } else {
                await socialService.follow(sellerId);
                setIsFollowing(true);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleViewFullProfile = () => {
        onClose();
        router.push(`/user/${sellerId}`);
    };

    const handleViewProduct = (productId: string) => {
        onClose();
        router.push(`/product/${productId}`);
    };

    const displayName = seller?.full_name || seller?.fullName || sellerName || 'Seller';
    const username = seller?.username || 'seller';
    const avatarUrl = seller?.avatar_url || seller?.avatarUrl || sellerAvatar;
    const rating = seller?.sellerDetails?.rating || 4.8;
    const isVerified = seller?.verified || seller?.sellerDetails?.verified;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
            <Box
                bg={COLORS.luxuryBlack}
                borderTopLeftRadius={24}
                borderTopRightRadius={24}
                maxHeight={SCREEN_HEIGHT * 0.85}
                overflow="hidden"
            >
                {/* Handle bar */}
                <Center py="$3">
                    <Box w={40} h={4} bg={COLORS.darkBorder} rounded="$full" />
                </Center>

                {/* Close button */}
                <Pressable
                    position="absolute"
                    top={12}
                    right={16}
                    zIndex={10}
                    onPress={onClose}
                    h={36}
                    w={36}
                    rounded="$full"
                    bg={COLORS.darkSurface}
                    alignItems="center"
                    justifyContent="center"
                >
                    <X size={20} color={COLORS.textPrimary} />
                </Pressable>

                {loading ? (
                    <Center py="$16">
                        <Spinner size="large" color={COLORS.primaryGold} />
                    </Center>
                ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <VStack px="$6" pb="$8">
                                {/* Seller Header */}
                                <HStack space="md" alignItems="center" mb="$4">
                                    {avatarUrl ? (
                                        <Image
                                            source={{ uri: avatarUrl }}
                                            style={{ width: 72, height: 72, borderRadius: 36 }}
                                        />
                                    ) : (
                                        <Center w={72} h={72} rounded="$full" bg={COLORS.darkSurface}>
                                            <Text size="2xl" fontWeight="$black" color={COLORS.textPrimary}>
                                                {displayName[0]?.toUpperCase()}
                                            </Text>
                                        </Center>
                                    )}
                                    <VStack flex={1}>
                                        <HStack alignItems="center" space="xs">
                                            <Heading size="lg" color={COLORS.textPrimary} fontWeight="$black">
                                                {displayName}
                                            </Heading>
                                            {isVerified && (
                                                <CheckCircle size={18} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
                                            )}
                                        </HStack>
                                        <Text size="sm" color={COLORS.textSecondary}>@{username}</Text>
                                        <HStack alignItems="center" mt="$1" space="xs">
                                            <Star size={14} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
                                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary}>
                                                {rating.toFixed(1)}
                                            </Text>
                                            <Text size="xs" color={COLORS.textSecondary}>seller rating</Text>
                                        </HStack>
                                    </VStack>
                                </HStack>

                                {/* Stats */}
                                <HStack 
                                    bg={COLORS.luxuryBlackLight} 
                                    rounded="$xl" 
                                    p="$4" 
                                    mb="$4"
                                    justifyContent="space-around"
                                >
                                    <Pressable 
                                        alignItems="center" 
                                        onPress={() => { onClose(); router.push(`/social/followers/${sellerId}`); }}
                                    >
                                        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
                                            {stats.followers}
                                        </Text>
                                        <Text size="xs" color={COLORS.textSecondary}>Followers</Text>
                                    </Pressable>
                                    <Box w={1} bg={COLORS.darkBorder} />
                                    <Pressable 
                                        alignItems="center"
                                        onPress={() => { onClose(); router.push(`/social/following/${sellerId}`); }}
                                    >
                                        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
                                            {stats.following}
                                        </Text>
                                        <Text size="xs" color={COLORS.textSecondary}>Following</Text>
                                    </Pressable>
                                    <Box w={1} bg={COLORS.darkBorder} />
                                    <VStack alignItems="center">
                                        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
                                            {stats.products}
                                        </Text>
                                        <Text size="xs" color={COLORS.textSecondary}>Products</Text>
                                    </VStack>
                                </HStack>

                                {/* Action Buttons */}
                                <HStack space="sm" mb="$6">
                                    {currentUserId !== sellerId && (
                                        <Button
                                            flex={1}
                                            bg={isFollowing ? COLORS.luxuryBlackLight : COLORS.primaryGold}
                                            borderWidth={2}
                                            borderColor={COLORS.primaryGold}
                                            rounded="$lg"
                                            onPress={handleFollowToggle}
                                            isDisabled={followLoading}
                                        >
                                            {followLoading ? (
                                                <Spinner size="small" color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack} />
                                            ) : (
                                                <HStack space="xs" alignItems="center">
                                                    <Users size={16} color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack} />
                                                    <ButtonText color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack}>
                                                        {isFollowing ? 'Following' : 'Follow'}
                                                    </ButtonText>
                                                </HStack>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        flex={1}
                                        bg={COLORS.luxuryBlackLight}
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                        rounded="$lg"
                                        onPress={handleViewFullProfile}
                                    >
                                        <HStack space="xs" alignItems="center">
                                            <ExternalLink size={16} color={COLORS.textPrimary} />
                                            <ButtonText color={COLORS.textPrimary}>View Profile</ButtonText>
                                        </HStack>
                                    </Button>
                                </HStack>

                                {/* Products Section */}
                                {products.length > 0 && (
                                    <Box>
                                        <HStack justifyContent="space-between" alignItems="center" mb="$3">
                                            <Text fontWeight="$bold" color={COLORS.textPrimary} size="md">
                                                Shop Items
                                            </Text>
                                            <Pressable onPress={handleViewFullProfile}>
                                                <Text size="sm" color={COLORS.primaryGold}>See All</Text>
                                            </Pressable>
                                        </HStack>
                                        <HStack flexWrap="wrap" mx={-4}>
                                            {products.map((product) => (
                                                <Pressable
                                                    key={product.id}
                                                    onPress={() => handleViewProduct(product.id)}
                                                    w="33%"
                                                    p="$1"
                                                >
                                                    <Box
                                                        bg={COLORS.darkSurface}
                                                        rounded="$lg"
                                                        overflow="hidden"
                                                        borderWidth={1}
                                                        borderColor={COLORS.darkBorder}
                                                    >
                                                        <Image
                                                            source={{ uri: product.images?.[0] || 'https://via.placeholder.com/100' }}
                                                            style={{ width: '100%', aspectRatio: 1 }}
                                                        />
                                                        <Box p="$2">
                                                            <Text size="xs" numberOfLines={1} color={COLORS.textPrimary} fontWeight="$medium">
                                                                {product.title}
                                                            </Text>
                                                            <Text size="xs" color={COLORS.textSecondary}>
                                                                ${product.buyNowPrice || product.buy_now_price || '0'}
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                </Pressable>
                                            ))}
                                        </HStack>
                                    </Box>
                                )}

                                {/* Reviews Placeholder */}
                                <Box mt="$4" bg={COLORS.luxuryBlackLight} rounded="$xl" p="$4">
                                    <HStack alignItems="center" space="sm" mb="$2">
                                        <Star size={18} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
                                        <Text fontWeight="$bold" color={COLORS.textPrimary}>Reviews</Text>
                                    </HStack>
                                    <Text size="sm" color={COLORS.textSecondary}>
                                        This seller has great ratings! View their full profile to see all reviews.
                                    </Text>
                                </Box>
                            </VStack>
                        </ScrollView>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}
