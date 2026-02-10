import React, { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UpgradeToSeller } from '@/components/seller/UpgradeToSeller';
import { COLORS } from '@/constants/colors';

export const SellerOnly = ({ children }: { children: ReactNode }) => {
    const { user, isSeller } = useAuthStore();

    if (!user) return <Redirect href="/(auth)/login" />;
    if (!isSeller) return <UpgradeToSeller />;

    return <>{children}</>;
};
