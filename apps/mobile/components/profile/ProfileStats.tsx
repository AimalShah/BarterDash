import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface StatItemProps {
    label: string;
    value: string;
    onPress?: () => void;
    valueFontSize: number;
    labelFontSize: number;
}

const StatItem = ({
    label,
    value,
    onPress,
    valueFontSize,
    labelFontSize,
}: StatItemProps) => (
    <TouchableOpacity
        style={styles.statItem}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.statValue, { fontSize: valueFontSize }]}>{value}</Text>
        <Text style={[styles.statLabel, { fontSize: labelFontSize }]}>{label}</Text>
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
    const { horizontalPadding, isTablet, scaledFont } = useResponsiveLayout();
    const statValueFont = scaledFont(isTablet ? 22 : 20, 0.95, 1.1);
    const statLabelFont = scaledFont(11, 0.95, 1.05);

    return (
        <View
            style={[
                styles.container,
                {
                    paddingHorizontal: horizontalPadding,
                    marginHorizontal: Math.max(horizontalPadding - 8, 8),
                },
            ]}
        >
            {isSeller ? (
                <>
                    <StatItem
                        label="FOLLOWERS"
                        value={followers.toString()}
                        onPress={onFollowersPress}
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
                    <VerticalDivider />
                    <StatItem
                        label="RATING"
                        value={rating || '0'}
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
                    <VerticalDivider />
                    <StatItem
                        label="ITEMS"
                        value={items.toString()}
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
                </>
            ) : (
                <>
                    <StatItem
                        label="FOLLOWING"
                        value={following.toString()}
                        onPress={onFollowingPress}
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
                    <VerticalDivider />
                    <StatItem
                        label="FOLLOWERS"
                        value={followers.toString()}
                        onPress={onFollowersPress}
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
                    <VerticalDivider />
                    <StatItem
                        label="WATCHLIST"
                        value="0"
                        valueFontSize={statValueFont}
                        labelFontSize={statLabelFont}
                    />
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
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
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
