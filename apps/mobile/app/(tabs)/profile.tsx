import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, RefreshControl, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    Settings,
    LogOut,
    Play,
    Plus,
    ClipboardList,
    Wallet,
    HelpCircle,
    Trophy,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/lib/api/services/social';
import { sellersService } from '@/lib/api/services/sellers';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '@/constants/colors';

// Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileMenuItems } from '@/components/profile/ProfileMenuItems';
import { SellerDashboardCTA } from '@/components/profile/SellerDashboardCTA';
import { QuickActions } from '@/components/profile/QuickActions';

interface ProfileStats {
    followers: number;
    following: number;
    items: number;
    revenue?: string;
    rating?: string;
}

export default function ProfileScreen() {
    const { profile, signOut, fetchProfile } = useAuthStore();
    const { showError, showSuccess } = useToast();
    const [stats, setStats] = useState<ProfileStats>({
        followers: 0,
        following: 0,
        items: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

    const isSeller = profile?.role === 'SELLER' || profile?.isSeller === true;

    useEffect(() => {
        loadProfileData();
    }, [profile?.id]);

    const loadProfileData = async () => {
        if (!profile?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const socialStats = await socialService.getStats(profile.id);
            const applicationStatus = await sellersService.getApplicationStatus().catch(() => null);
            let sellerStats = null;
            if (isSeller) {
                try {
                    sellerStats = await sellersService.getDashboard();
                } catch (e) {
                    console.log('Seller dashboard not available');
                }
            }

            const rawStatus = applicationStatus?.application?.status;
            const statusLabel = rawStatus ? rawStatus.replace(/_/g, ' ') : (isSeller ? 'approved' : null);
            setVerificationStatus(statusLabel);

            setStats({
                followers: socialStats.followers_count,
                following: socialStats.following_count,
                items: sellerStats?.total_auctions || 0,
                revenue: sellerStats ? `$${sellerStats.total_revenue?.toLocaleString() || '0'}` : undefined,
                rating: sellerStats?.rating?.toString() || '0.0',
            });
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchProfile();
            await loadProfileData();
            showSuccess('Profile updated');
        } catch (error) {
            showError('Failed to refresh profile');
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/(auth)/landing');
        } catch (error) {
            showError('Failed to sign out');
        }
    };

    const username = profile?.username || 'User';
    const displayName = profile?.full_name || profile?.fullName || username;
    const avatarUrl = profile?.avatar_url || profile?.avatarUrl;

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>LOADING STUDIO...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const QUICK_ACTIONS = [
        { icon: <Play size={20} color={COLORS.luxuryBlack} />, label: "GO LIVE", color: COLORS.primaryGold, onPress: () => router.push('/seller/go-live') },
        { icon: <Plus size={20} color={COLORS.luxuryBlack} />, label: "NEW STREAM", color: COLORS.primaryGold, onPress: () => router.push('/seller/create-stream') },
        { icon: <ClipboardList size={20} color={COLORS.luxuryBlack} />, label: "ORDERS", color: COLORS.primaryGold, onPress: () => router.push('/seller/sales') },
        { icon: <Wallet size={20} color={COLORS.luxuryBlack} />, label: "EARNINGS", color: COLORS.primaryGold, onPress: () => router.push('/seller/earnings') },
    ];

    const MENU_ITEMS = [
        { icon: <Trophy size={18} color={COLORS.textPrimary} />, label: "MY BIDS", onPress: () => router.push('/(tabs)/my-bids') },
        { icon: <HelpCircle size={18} color={COLORS.textPrimary} />, label: "HELP CENTER", onPress: () => router.push('/settings') },
        { icon: <Settings size={18} color={COLORS.textPrimary} />, label: "ACCOUNT SETTINGS", onPress: () => router.push('/settings') },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primaryGold}
                    />
                }
            >
                <View style={{ backgroundColor: COLORS.luxuryBlack }}>
                    <ProfileHeader
                        isSeller={isSeller}
                        username={username}
                        displayName={displayName}
                        avatarUrl={avatarUrl}
                        verificationStatus={verificationStatus}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        onSettings={() => router.push('/settings')}
                    />
                </View>

                <ProfileStats
                    isSeller={isSeller}
                    followers={stats.followers}
                    following={stats.following}
                    items={stats.items}
                    rating={stats.rating}
                    onFollowersPress={() => profile?.id && router.push(`/social/followers/${profile.id}`)}
                    onFollowingPress={() => profile?.id && router.push(`/social/following/${profile.id}`)}
                />

                <SellerDashboardCTA
                    isSeller={isSeller}
                    onDashboardPress={() => router.push('/seller/dashboard')}
                    onRegisterPress={() => router.push('/seller/register')}
                />

                <QuickActions isSeller={isSeller} actions={QUICK_ACTIONS} />

                <ProfileMenuItems menuItems={MENU_ITEMS} />

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <LogOut size={18} color={COLORS.textPrimary} />
                    <Text style={styles.logoutText}>SIGN OUT</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.luxuryBlack,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.luxuryBlack,
    },
    loadingText: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginTop: 40,
        marginBottom: 40,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 28, // Rounded
        backgroundColor: COLORS.luxuryBlackLight,
    },
    logoutText: {
        color: COLORS.errorRed, // Red for logout
        fontSize: 14,
        fontWeight: '900',
        marginLeft: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
