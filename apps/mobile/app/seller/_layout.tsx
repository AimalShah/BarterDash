import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SellerGuard } from '@/components/guards/SellerGuard';
import { COLORS } from '../../constants/colors';

export default function SellerLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.luxuryBlack} />
            <SellerGuard>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="streams" />
                    <Stack.Screen name="create-stream" />
                    <Stack.Screen name="go-live" />
                    <Stack.Screen name="stream/[id]" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="sales" />
                    <Stack.Screen name="order/[id]" />
                </Stack>
            </SellerGuard>
        </>
    );
}
