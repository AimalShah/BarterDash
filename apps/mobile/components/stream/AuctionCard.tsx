import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';

interface AuctionCardProps {
    auction: any;
    onPress: () => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onPress }) => {
    const router = useRouter();
    
    // Handle image URL (if relative path from backend) or placeholder
    const imageUrl = auction.images && auction.images.length > 0
        ? (auction.images[0].startsWith('http') ? auction.images[0] : auction.images[0])
        : 'https://via.placeholder.com/300x200?text=No+Image';

    const timeLeft = () => {
        if (!auction.ends_at) return 'No time limit';
        const now = new Date().getTime();
        const end = new Date(auction.ends_at).getTime();
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m left`;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.badgeContainer}>
                <View style={[styles.badge, styles.statusBadge]}>
                    <Text style={styles.badgeText}>{auction.status}</Text>
                </View>
            </View>

            {/* Live Stream Overlay Button (WhatNot Style) */}
            <View style={styles.liveOverlay}>
                <TouchableOpacity style={styles.liveButton} onPress={() => { }}>
                    <Text style={styles.liveButtonText}>📷 Live Stream</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{auction.title}</Text>
                <Text style={styles.category}>{auction.category || 'General'}</Text>
                
                {/* Seller Info */}
                {auction.seller?.username && (
                    <TouchableOpacity 
                        onPress={() => auction.seller?.id && router.push(`/user/${auction.seller.id}`)}
                        style={styles.sellerInfo}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sellerName}>@{auction.seller.username}</Text>
                        <View style={styles.sellerDot} />
                    </TouchableOpacity>
                )}

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.priceLabel}>Current Bid</Text>
                        <Text style={styles.price}>${auction.current_price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.timeLeftContainer}>
                        <Text style={styles.timeLabel}>Time Left</Text>
                        <Text style={[styles.time, timeLeft() === 'Ended' && styles.timeEnded]}>
                            {timeLeft()}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 180,
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadge: {
        backgroundColor: COLORS.overlayMedium,
    },
    badgeText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    category: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.darkBorder,
    },
    priceLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.primaryGold,
    },
    timeLeftContainer: {
        alignItems: 'flex-end',
    },
    timeLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    time: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    timeEnded: {
        color: COLORS.errorRed,
    },
    liveOverlay: {
        position: 'absolute',
        bottom: 80, // Position above content area
        right: 12,
    },
    liveButton: {
        backgroundColor: COLORS.overlayStrong,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveButtonText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
        fontSize: 12,
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    sellerName: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '500',
    },
    sellerDot: {
        width: 4,
        height: 4,
        backgroundColor: COLORS.primaryGold,
        borderRadius: 2,
        marginLeft: 6,
    },
});
