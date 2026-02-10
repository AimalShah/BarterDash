import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface StatItemProps {
    label: string;
    value: string;
    onPress?: () => void;
}

const StatItem = ({ label, value, onPress }: StatItemProps) => (
    <TouchableOpacity
        style={styles.statItem}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
);

const VerticalDivider = () => (
    <View style={styles.divider} />
);

interface ProfileStatsProps {
    isSeller: boolean;
    followers: number;
    following: number;
    items: number;
    rating?: string;
    onFollowersPress?: () => void;
    onFollowingPress?: () => void;
}

export const ProfileStats = ({
    isSeller,
    followers,
    following,
    items,
    rating,
    onFollowersPress,
    onFollowingPress,
}: ProfileStatsProps) => {
    return (
        <View style={styles.container}>
            {isSeller ? (
                <>
                    <StatItem
                        label="FOLLOWERS"
                        value={followers.toString()}
                        onPress={onFollowersPress}
                    />
                    <VerticalDivider />
                    <StatItem label="RATING" value={rating || '0'} />
                    <VerticalDivider />
                    <StatItem label="ITEMS" value={items.toString()} />
                </>
            ) : (
                <>
                    <StatItem
                        label="FOLLOWING"
                        value={following.toString()}
                        onPress={onFollowingPress}
                    />
                    <VerticalDivider />
                    <StatItem
                        label="FOLLOWERS"
                        value={followers.toString()}
                        onPress={onFollowersPress}
                    />
                    <VerticalDivider />
                    <StatItem label="WATCHLIST" value="0" />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: COLORS.luxuryBlackLight,
        borderRadius: 12,
        // Subtle border instead of full box
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.darkBorder,
    }
});
