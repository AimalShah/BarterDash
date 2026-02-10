import React, { useEffect, useState } from 'react';
import { StatusBar, ScrollView, RefreshControl, Image, StyleSheet, View, Text, TouchableOpacity, Dimensions, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Plus,
    Package,
    DollarSign,
    ShoppingBag,
    Video,
    Calendar,
    Gavel,
    TrendingUp,
    ChevronRight,
    BarChart3,
    Heart,
    AlertTriangle,
    CheckCircle,
    Clock,
    Truck,
    Star,
    Shield,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { productsService } from '../../lib/api/services/products';
import { ordersService } from '../../lib/api/services/orders';
import { streamsService } from '../../lib/api/services/streams';
import { auctionsService } from '../../lib/api/services/auctions';
import { analyticsService, AccountHealth, SellerAnalytics } from '../../lib/api/services/analytics';
import { sellersService } from '../../lib/api/services/sellers';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function SellerDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [username, setUsername] = useState('Seller');

    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [streams, setStreams] = useState<any[]>([]);
    const [auctions, setAuctions] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        activeAuctions: 0,
    });

    const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
    const [accountHealth, setAccountHealth] = useState<AccountHealth | null>(null);
    const [sellerStatus, setSellerStatus] = useState<any>(null);
    const [verificationLoading, setVerificationLoading] = useState(false);

    const liveStreamsCount = streams.filter((stream: any) => stream.status === 'live').length;
    const scheduledStreamsCount = streams.filter((stream: any) => stream.status === 'scheduled').length;
    const nextScheduledStream = streams
        .filter((stream: any) => stream.status === 'scheduled' && stream.scheduledStart)
        .sort((a: any, b: any) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUsername(user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.username || 'Seller');

                const [
                    productsData,
                    ordersData,
                    streamsData,
                    auctionsData,
                    analyticsData,
                    healthData,
                    sellerData
                ] = await Promise.all([
                    productsService.getSellerProducts(user.id).catch(() => []),
                    ordersService.getMySales().catch(() => []),
                    streamsService.getMyStreams().catch(() => []),
                    auctionsService.findAll({ status: 'active' }).catch(() => []),
                    analyticsService.getSellerAnalytics('30d').catch(() => null),
                    analyticsService.getAccountHealth().catch(() => null),
                    sellersService.getApplicationStatus().catch(() => null),
                ]);

                setProducts(productsData || []);
                setOrders(ordersData || []);
                setStreams(streamsData || []);
                setAuctions(auctionsData || []);
                setAnalytics(analyticsData);
                setAccountHealth(healthData);
                setSellerStatus(sellerData);

                const pendingOrders = (ordersData || []).filter((o: any) =>
                    o.status === 'pending' || o.status === 'processing'
                );
                const totalRevenue = (ordersData || [])
                    .filter((o: any) => o.status === 'delivered')
                    .reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);

                setStats({
                    totalProducts: (productsData || []).length,
                    totalOrders: (ordersData || []).length,
                    pendingOrders: pendingOrders.length,
                    totalRevenue,
                    activeAuctions: (auctionsData || []).filter((a: any) => a.status === 'active').length,
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleStartVerification = async () => {
        try {
            setVerificationLoading(true);
            const response = await sellersService.createVerificationSession();
            const supported = await Linking.canOpenURL(response.url);
            if (!supported) {
                Alert.alert("Unable to Open", "Please open the verification link in your browser.");
                return;
            }
            await Linking.openURL(response.url);
        } catch (error: any) {
            console.error("Verification error:", error);
            Alert.alert("Error", error?.message || "Failed to start verification.");
        } finally {
            setVerificationLoading(false);
        }
    };

    const application = sellerStatus?.application;
    const applicationStatus = application?.status as string | undefined;
    const statusLabel = applicationStatus ? applicationStatus.replace(/_/g, ' ') : 'not started';
    const isStatus = (value: string) => applicationStatus === value;
    const verificationDescription = (() => {
        if (!applicationStatus) return 'Start your seller application to begin verification.';
        if (isStatus('draft') || isStatus('more_info_needed')) return 'Complete your application and upload the required documents.';
        if (isStatus('submitted')) return 'Documents submitted. Start identity verification to continue.';
        if (isStatus('in_review')) return 'Your identity verification is in review.';
        if (isStatus('approved')) return 'Your identity has been verified. You are fully approved.';
        if (isStatus('rejected')) return 'Your verification was rejected. Please contact support or resubmit.';
        return 'Check your application status.';
    })();

    const verificationIcon = (() => {
        if (isStatus('approved')) return <CheckCircle size={20} color={COLORS.luxuryBlack} />;
        if (isStatus('rejected')) return <AlertTriangle size={20} color={COLORS.luxuryBlack} />;
        if (isStatus('in_review')) return <Clock size={20} color={COLORS.luxuryBlack} />;
        return <Shield size={20} color={COLORS.luxuryBlack} />;
    })();

    const verificationIconBg = (() => {
        if (isStatus('approved')) return COLORS.successGreen;
        if (isStatus('rejected')) return COLORS.errorRed;
        if (isStatus('in_review')) return COLORS.warningAmber;
        return COLORS.primaryGold;
    })();

    const formatShortDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primaryGold}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ChevronLeft size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.greeting}>Hi, {username}</Text>
                            <Text style={styles.subtitle}>Seller Dashboard</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={[styles.statusBadge, { backgroundColor: verificationIconBg }]}>
                            <Text style={styles.statusBadgeText}>
                                {statusLabel.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                    <View style={styles.quickActionsRow}>
                        <QuickActionButton
                            icon={<Plus size={24} color={COLORS.luxuryBlack} />}
                            label="Add Product"
                            onPress={() => router.push('/seller/add-product')}
                            highlight
                        />
                        <QuickActionButton
                            icon={<Video size={24} color={COLORS.textPrimary} />}
                            label="Go Live"
                            onPress={() => router.push('/seller/create-stream')}
                        />
                        <QuickActionButton
                            icon={<Gavel size={24} color={COLORS.textPrimary} />}
                            label="New Auction"
                            onPress={() => router.push('/seller/create-auction')}
                        />
                    </View>
                </View>

                {/* Verification */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>VERIFICATION</Text>
                    <View style={styles.verificationCard}>
                        <View style={styles.verificationHeader}>
                            <View style={[styles.verificationIcon, { backgroundColor: verificationIconBg }]}>
                                {verificationIcon}
                            </View>
                            <View style={styles.verificationInfo}>
                                <Text style={styles.verificationTitle}>Identity Verification</Text>
                                <Text style={styles.verificationStatus}>
                                    Status: {statusLabel.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.verificationDescription}>{verificationDescription}</Text>
                        {(!applicationStatus || isStatus('draft') || isStatus('more_info_needed')) && (
                            <TouchableOpacity
                                onPress={() => router.push('/seller/register')}
                                style={styles.verificationButton}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.verificationButtonText}>
                                    Complete Application
                                </Text>
                            </TouchableOpacity>
                        )}
                        {isStatus('submitted') && (
                            <TouchableOpacity
                                onPress={handleStartVerification}
                                style={styles.verificationButton}
                                activeOpacity={0.85}
                                disabled={verificationLoading}
                            >
                                <Text style={styles.verificationButtonText}>
                                    {verificationLoading ? 'Starting Verification...' : 'Start Verification'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Streams */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>STREAMS</Text>
                        <TouchableOpacity onPress={() => router.push('/seller/streams')}>
                            <Text style={styles.seeAllText}>Manage</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.streamCard}
                        onPress={() => router.push('/seller/streams')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.streamCardHeader}>
                            <View style={styles.streamCardIcon}>
                                <Video size={18} color={COLORS.primaryGold} />
                            </View>
                            <View style={styles.streamCardInfo}>
                                <Text style={styles.streamCardTitle}>Stream Control</Text>
                                <Text style={styles.streamCardSubtitle}>
                                    {liveStreamsCount} live · {scheduledStreamsCount} scheduled
                                </Text>
                            </View>
                            <ChevronRight size={18} color={COLORS.textSecondary} />
                        </View>
                        <View style={styles.streamNextRow}>
                            <Calendar size={14} color={COLORS.textSecondary} />
                            <Text style={styles.streamNextText}>
                                {nextScheduledStream
                                    ? `Next: ${nextScheduledStream.title} · ${formatShortDate(nextScheduledStream.scheduledStart)}`
                                    : 'No upcoming streams scheduled'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>OVERVIEW</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon={<Package size={16} color={COLORS.textPrimary} />}
                            label="Products"
                            value={stats.totalProducts}
                            onPress={() => router.push('/seller/inventory')}
                        />
                        <StatCard
                            icon={<ShoppingBag size={16} color={COLORS.textPrimary} />}
                            label="Orders"
                            value={stats.totalOrders}
                            onPress={() => router.push('/seller/sales')}
                        />
                        <StatCard
                            icon={<DollarSign size={16} color={COLORS.textPrimary} />}
                            label="Revenue"
                            value={`$${stats.totalRevenue.toFixed(0)}`}
                        />
                        <StatCard
                            icon={<TrendingUp size={16} color={COLORS.textPrimary} />}
                            label="Auctions"
                            value={stats.activeAuctions}
                            onPress={() => router.push('/seller/auctions')}
                        />
                    </View>
                </View>

                {/* My Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>MY PRODUCTS</Text>
                        <TouchableOpacity onPress={() => router.push('/seller/inventory')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {products.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productsScroll}
                        >
                            {products.slice(0, 5).map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyProducts}>
                            <Package size={32} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No products yet</Text>
                            <TouchableOpacity
                                style={styles.addProductButton}
                                onPress={() => router.push('/seller/add-product')}
                            >
                                <LinearGradient
                                    colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.addProductText}>Add Your First Product</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Pending Orders */}
                {stats.pendingOrders > 0 && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.pendingOrdersCard}
                            onPress={() => router.push('/seller/sales')}
                        >
                            <View style={styles.pendingIconContainer}>
                                <ShoppingBag size={20} color={COLORS.luxuryBlack} />
                            </View>
                            <View style={styles.pendingInfo}>
                                <Text style={styles.pendingTitle}>
                                    {stats.pendingOrders} Pending Order{stats.pendingOrders > 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.pendingSubtitle}>Tap to view and fulfill</Text>
                            </View>
                            <ChevronRight size={24} color={COLORS.luxuryBlack} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const QuickActionButton = ({ icon, label, onPress, highlight = false }: any) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.quickActionButton,
            highlight && styles.quickActionHighlight
        ]}
        activeOpacity={0.8}
    >
        {highlight ? (
            <LinearGradient
                colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                style={styles.quickActionGradient}
            >
                {icon}
            </LinearGradient>
        ) : (
            <View style={styles.quickActionIcon}>
                {icon}
            </View>
        )}
        <Text style={[styles.quickActionLabel, highlight && styles.quickActionLabelHighlight]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const StatCard = ({ icon, label, value, onPress }: any) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.statCard}
        activeOpacity={0.8}
    >
        <View style={styles.statHeader}>
            {icon}
            <Text style={styles.statLabel}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
    </TouchableOpacity>
);

const ProductCard = ({ product }: any) => (
    <TouchableOpacity
        onPress={() => router.push(`/product/${product.id}`)}
        style={styles.productCard}
        activeOpacity={0.9}
    >
        <View style={styles.productImageContainer}>
            {product.images?.[0] && (
                <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            )}
        </View>
        <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>
                {product.title}
            </Text>
            <Text style={styles.productPrice}>
                ${product.buyNowPrice || product.startingBid || '0'}
            </Text>
        </View>
    </TouchableOpacity>
);

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
        fontSize: 14,
        fontWeight: '900',
        marginTop: 16,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.luxuryBlack,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusBadgeText: {
        color: COLORS.luxuryBlack,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.luxuryBlackLight,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    seeAllText: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionButton: {
        flex: 1,
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.luxuryBlackLight,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    quickActionHighlight: {
        backgroundColor: COLORS.luxuryBlack,
        borderColor: COLORS.primaryGold,
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    quickActionGradient: {
        width: 56,
        height: 56,
        borderRadius: 28, // Circle
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.luxuryBlack,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    quickActionLabelHighlight: {
        color: COLORS.primaryGold,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    verificationCard: {
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        padding: 20,
        gap: 16,
    },
    verificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    verificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verificationInfo: {
        flex: 1,
    },
    verificationTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    verificationStatus: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    verificationDescription: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
    },
    verificationButton: {
        backgroundColor: COLORS.primaryGold,
        borderRadius: 24, // Pill shape
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verificationButtonText: {
        color: COLORS.luxuryBlack,
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    streamCard: {
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        padding: 20,
        gap: 16,
    },
    streamCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    streamCardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold tint
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streamCardInfo: {
        flex: 1,
    },
    streamCardTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    streamCardSubtitle: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    streamNextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.luxuryBlack,
        padding: 12,
        borderRadius: 8,
    },
    streamNextText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    statCard: {
        width: (width - 60) / 2, // 24 padding * 2 + 12 gap / 2
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -1,
    },
    productsScroll: {
        paddingRight: 24,
        gap: 16,
    },
    productCard: {
        width: 160,
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    productImageContainer: {
        width: '100%',
        height: 160,
        backgroundColor: COLORS.luxuryBlack,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        padding: 12,
    },
    productTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    productPrice: {
        color: COLORS.primaryGold,
        fontSize: 14,
        fontWeight: '800',
    },
    emptyProducts: {
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 20,
    },
    addProductButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addProductText: {
        color: COLORS.luxuryBlack,
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    pendingOrdersCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.primaryGold, // Highlight pending
        gap: 16,
    },
    pendingIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryGold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingInfo: {
        flex: 1,
    },
    pendingTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '800',
    },
    pendingSubtitle: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    addProductButton: {
    borderRadius: 12,
        overflow: 'hidden',
    },
gradientButton: {
    paddingVertical: 12,
        paddingHorizontal: 24,
            alignItems: 'center',
    },
addProductText: {
    color: COLORS.luxuryBlack,
        fontSize: 12,
            fontWeight: '900',
                textTransform: 'uppercase',
    },
pendingOrdersCard: {
    flexDirection: 'row',
        alignItems: 'center',
            backgroundColor: COLORS.warningAmber,
                borderRadius: 16,
                    padding: 16,
                        gap: 16,
    },
pendingIconContainer: {
    width: 40,
        height: 40,
            borderRadius: 20,
                backgroundColor: COLORS.luxuryBlack,
                    justifyContent: 'center',
                        alignItems: 'center',
    },
pendingInfo: {
    flex: 1,
    },
pendingTitle: {
    color: COLORS.luxuryBlack,
        fontSize: 16,
            fontWeight: '900',
    },
pendingSubtitle: {
    color: COLORS.textSecondary,
        fontSize: 12,
            fontWeight: '600',
    },
});
