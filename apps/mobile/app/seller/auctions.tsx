import React, { useEffect, useState } from 'react';
import { StatusBar, ScrollView, RefreshControl, StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Gavel,
    DollarSign,
    Calendar,
    Clock,
    Users,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { auctionsService } from '../../lib/api/services/auctions';
import { Auction } from '../../types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function AuctionsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [auctions, setAuctions] = useState<Auction[]>([]);

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            const data = await auctionsService.findAll({ status: 'live' });
            setAuctions(data || []);
        } catch (error) {
            console.error('Error fetching auctions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAuctions();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return COLORS.errorRed;
            case 'scheduled': return COLORS.primaryGold;
            case 'ended': return COLORS.textMuted;
            case 'cancelled': return COLORS.errorRed;
            case 'draft': return COLORS.textMuted;
            default: return COLORS.textMuted;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryGold} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ChevronLeft size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>My Auctions</Text>
                    <Text style={styles.headerSubtitle}>
                        {auctions.length} active auctions
                    </Text>
                </View>
            </View>

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
                {auctions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Gavel size={48} color={COLORS.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No active auctions</Text>
                        <Text style={styles.emptyText}>
                            Create your first auction to start bidding!
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/seller/create-auction')}
                        >
                            <Text style={styles.createButtonText}>Create Auction</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.auctionsList}>
                        {auctions.map((auction) => (
                            <TouchableOpacity
                                key={auction.id}
                                onPress={() => router.push(`/auction/${auction.id}`)}
                                style={styles.auctionCard}
                                activeOpacity={0.9}
                            >
                                <View style={styles.auctionImageContainer}>
                                    {auction.images && auction.images[0] ? (
                                        <Image
                                            source={{ uri: auction.images[0] }}
                                            style={styles.auctionImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.noImageContainer}>
                                            <Gavel size={24} color={COLORS.textMuted} />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.auctionInfo}>
                                    <View style={styles.auctionHeader}>
                                        <Text style={styles.auctionTitle} numberOfLines={1}>
                                            {auction.title}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(auction.status) }]}>
                                            <Text style={styles.statusText} numberOfLines={1}>
                                                {auction.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.auctionDetails}>
                                        <View style={styles.detailItem}>
                                            <DollarSign size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.detailText}>
                                                ${auction.current_price}
                                            </Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <Users size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.detailText}>
                                                {auction.seller?.username || 'Unknown'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.auctionFooter}>
                                        {auction.ends_at && (
                                            <View style={styles.timeContainer}>
                                                <Clock size={14} color={COLORS.textMuted} />
                                                <Text style={styles.timeText}>
                                                    Ends {format(new Date(auction.ends_at), 'MMM dd, yyyy')}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/seller/create-auction')}
            >
                <Gavel size={24} color={COLORS.luxuryBlack} />
            </TouchableOpacity>
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
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
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
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    auctionsList: {
        paddingHorizontal: 24,
        marginTop: 12,
    },
    auctionCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        marginBottom: 12,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    auctionImageContainer: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.darkSurface,
    },
    auctionImage: {
        width: '100%',
        height: '100%',
    },
    noImageContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    auctionInfo: {
        flex: 1,
        padding: 12,
    },
    auctionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    auctionTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        color: COLORS.textPrimary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    auctionDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    auctionFooter: {
        marginTop: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        color: COLORS.textMuted,
        fontSize: 11,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 100,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.darkSurface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: COLORS.primaryGold,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: COLORS.luxuryBlack,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primaryGold,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
