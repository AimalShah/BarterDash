import React, { useState, useEffect } from 'react';
import { StatusBar, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
    Box,
    ScrollView,
    Spinner,
    Heading,
    Text,
    Button,
    ButtonText,
    Center,
    VStack,
    HStack,
    Pressable,
} from "@gluestack-ui/themed";
import {
    Users,
    Calendar,
    ShoppingBag,
    Star,
    Grid,
    ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/lib/api/services/users';
import { socialService } from '@/lib/api/services/social';
import { productsService } from '@/lib/api/services/products';
import { User as UserType } from '@/types';
import { useToast } from '@/context/ToastContext';
import { handleApiError } from '@/lib/api/errorHandle';
import { theme } from '@/constants/theme';
import { COLORS } from '../../constants/colors';

// Extracted Components
import { UserHeader } from '@/components/user/UserHeader';
import { UserStats } from '@/components/user/UserStats';
import { UserActionButtons } from '@/components/user/UserActionButtons';
import { ShopTab } from '@/components/profile/ShopTab';
import { ReviewsTab } from '@/components/profile/ReviewsTab';

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const { profile } = useAuthStore();
    const { showSuccess, showError } = useToast();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [stats, setStats] = useState({ followers: 0, following: 0, items: 0 });
    const [activeTab, setActiveTab] = useState<'shop' | 'reviews' | 'about'>('shop');

    useEffect(() => {
        if (id) fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const userData = await usersService.getProfile(id as string);
            setUser(userData);

            try {
                const socialStats = await socialService.getStats(id as string);

                // Also fetch products to get the count
                let itemsCount = 0;
                if (userData.role === 'SELLER' || userData.isSeller) {
                    const products = await productsService.getSellerProducts(id as string);
                    itemsCount = products.length;
                }

                setStats({
                    followers: socialStats.followers_count,
                    following: socialStats.following_count,
                    items: itemsCount,
                });

                const following = await socialService.isFollowing(id as string);
                setIsFollowing(following);
            } catch (err) {
                console.log('Social stats not available');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            handleApiError(error, { context: 'User Profile', showAlert: false });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const handleFollowToggle = async () => {
        if (!id || followLoading || profile?.id === id) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollow(id as string);
                setIsFollowing(false);
                setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
                showSuccess('Unfollowed successfully');
            } else {
                await socialService.follow(id as string);
                setIsFollowing(true);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
                showSuccess('Following!');
            }
        } catch (error) {
            const message = handleApiError(error, { context: 'Follow', showAlert: false });
            showError(message);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" alignItems="center">
                <Spinner size="large" color={COLORS.primaryGold} />
            </Box>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
                <Box flex={1} alignItems="center" justifyContent="center" p="$6">
                    <Heading color={COLORS.textPrimary} size="xl" mb="$4">User not found</Heading>
                    <Text color={COLORS.textSecondary} textAlign="center" mb="$6">
                        This user profile could not be loaded or doesn't exist.
                    </Text>
                    <Button
                        action="primary"
                        bg={COLORS.primaryGold}
                        rounded="$full"
                        px="$8"
                        onPress={() => router.back()}
                    >
                        <ButtonText color={COLORS.luxuryBlack}>Go Back</ButtonText>
                    </Button>
                </Box>
            </SafeAreaView>
        );
    }

    const username = user.username || 'User';
    const displayName = user.full_name || user.fullName || username;
    const avatarUrl = user.avatar_url || user.avatarUrl;
    const isSeller = user.role === 'SELLER' || user.isSeller;

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                flex={1}
                contentContainerStyle={{ paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primaryGold}
                    />
                }
            >
                <UserHeader
                    isSeller={isSeller}
                    username={username}
                    displayName={displayName}
                    avatarUrl={avatarUrl}
                    onBack={() => router.back()}
                    onShare={() => { }}
                    onMessage={() => { router.push(`/messages/new?userId=${id}`) }}
                    isOwnProfile={profile?.id === id}
                />

                <UserStats
                    followers={stats.followers}
                    following={stats.following}
                    items={stats.items}
                    isSeller={isSeller}
                    onFollowersPress={() => id && router.push(`/social/followers/${id}`)}
                    onFollowingPress={() => id && router.push(`/social/following/${id}`)}
                />

                <UserActionButtons
                    isFollowing={isFollowing}
                    followLoading={followLoading}
                    onFollowToggle={handleFollowToggle}
                    isOwnProfile={profile?.id === id}
                />

                {/* Tabs for Sellers */}
                {isSeller && (
                    <Box mt="$8">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
                            <Pressable
                                onPress={() => setActiveTab('shop')}
                                mr="$6"
                                pb="$3"
                                borderBottomWidth={activeTab === 'shop' ? 2 : 0}
                                borderColor={COLORS.primaryGold}
                            >
                                <Text color={activeTab === 'shop' ? COLORS.textPrimary : COLORS.textSecondary} fontWeight="$black" size="sm" textTransform="uppercase" letterSpacing={1.2}>Shop</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab('reviews')}
                                mr="$6"
                                pb="$3"
                                borderBottomWidth={activeTab === 'reviews' ? 2 : 0}
                                borderColor={COLORS.primaryGold}
                            >
                                <Text color={activeTab === 'reviews' ? COLORS.textPrimary : COLORS.textSecondary} fontWeight="$black" size="sm" textTransform="uppercase" letterSpacing={1.2}>Reviews</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveTab('about')}
                                mr="$6"
                                pb="$3"
                                borderBottomWidth={activeTab === 'about' ? 2 : 0}
                                borderColor={COLORS.primaryGold}
                            >
                                <Text color={activeTab === 'about' ? COLORS.textPrimary : COLORS.textSecondary} fontWeight="$black" size="sm" textTransform="uppercase" letterSpacing={1.2}>About</Text>
                            </Pressable>
                        </ScrollView>
                    </Box>
                )}

                {/* Tab Content */}
                <Box mt="$4">
                    {activeTab === 'shop' && isSeller && <ShopTab userId={id as string} />}

                    {activeTab === 'reviews' && isSeller && <ReviewsTab userId={id as string} />}

                    {(activeTab === 'about' || !isSeller) && (
                        <VStack px="$8" space="lg" mt="$4">
                            {isSeller && (
                                <Box pt="$2" pb="$4">
                                    <Text color={COLORS.textSecondary} size="md" lineHeight="$xl">
                                        {user.verified ? 'Verified seller on BarterDash. Check out their live streams and products!' : 'Seller on BarterDash. Browse their items and follow for updates.'}
                                    </Text>
                                </Box>
                            )}
                            {/* Actions / Links */}
                            <Pressable py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder} sx={{ ":active": { opacity: 0.6 } }}>
                                <HStack justifyContent="space-between" alignItems="center">
                                    <HStack alignItems="center" space="md">
                                        <Box h={40} w={40} bg={COLORS.luxuryBlackLight} rounded={12} alignItems="center" justifyContent="center">
                                            <Calendar size={20} color={COLORS.textPrimary} />
                                        </Box>
                                        <Text color={COLORS.textPrimary} fontWeight="$bold">Past Streams</Text>
                                    </HStack>
                                    <ChevronRight size={18} color={COLORS.textSecondary} />
                                </HStack>
                            </Pressable>
                        </VStack>
                    )}
                </Box>
            </ScrollView>
        </Box>
    );
}
