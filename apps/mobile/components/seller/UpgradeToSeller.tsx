import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';

export const UpgradeToSeller = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.luxuryBlack }}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <Text variant="h2" style={{ textAlign: 'center', marginBottom: 8, color: COLORS.textPrimary }}>Become a Seller</Text>
                <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
                    Start your own live auctions and grow your business today.
                </Text>
            </View>

            <Button
                label="Register as Seller"
                onPress={() => router.push('/seller/register')}
                style={{ width: '100%', backgroundColor: COLORS.primaryGold }}
            />

            <Button
                variant="ghost"
                label="Go Home"
                onPress={() => router.replace('/(tabs)')}
                style={{ marginTop: 8 }}
            />
        </View>
    );
};
