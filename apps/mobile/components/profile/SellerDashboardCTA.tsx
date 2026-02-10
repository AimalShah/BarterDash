import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface SellerDashboardCTAProps {
    isSeller: boolean;
    onDashboardPress: () => void;
    onRegisterPress: () => void;
}

export const SellerDashboardCTA = ({
    isSeller,
    onDashboardPress,
    onRegisterPress,
}: SellerDashboardCTAProps) => {
    return (
        <View style={styles.container}>
            {isSeller ? (
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onDashboardPress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>Seller Dashboard</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.outlineButton}
                    onPress={onRegisterPress}
                    activeOpacity={0.8}
                >
                    <Text style={styles.outlineButtonText}>Become a Seller</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    primaryButton: {
        backgroundColor: COLORS.primaryGold,
        height: 56,
        borderRadius: 28, // Fully rounded
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primaryGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: COLORS.luxuryBlack,
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.primaryGold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineButtonText: {
        color: COLORS.primaryGold,
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
