import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Center, Spinner, VStack, Heading, Text, Box, Button, ButtonText } from '@gluestack-ui/themed';
import { COLORS } from '@/constants/colors';

export function SellerGuard({ children }: { children: React.ReactNode }) {
    const segments = useSegments();
    const router = useRouter();
    const { profile, loading, isFetchingProfile, signOut } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const legacyProfile = profile as any;

    useEffect(() => {
        if (!loading && !isFetchingProfile) {
            setTimeout(() => setIsLoading(false), 300);
        }
    }, [loading, isFetchingProfile]);

    const isSeller = profile?.is_seller || legacyProfile?.isSeller || profile?.role === 'SELLER';
    const rawSellerStatus = legacyProfile?.sellerStatus || profile?.seller_status;
    const sellerStatus = typeof rawSellerStatus === 'string' ? rawSellerStatus.toLowerCase() : '';
    const isApproved = sellerStatus === 'approved' || isSeller;
    const isPending = sellerStatus === 'pending' || sellerStatus === 'in_review' || sellerStatus === 'submitted';
    const isSuspended = legacyProfile?.accountStatus === 'suspended' || profile?.account_status === 'suspended';
    const stripeComplete = legacyProfile?.stripeAccountStatus === 'complete' || profile?.stripe_account_status === 'complete';

    const inSellerSection = segments.includes('seller');
    const isRegistering = inSellerSection && segments.includes('register');
    const isOnboarding = inSellerSection && segments.includes('onboarding');
    const isEntryScreen = isRegistering || isOnboarding;

    useEffect(() => {
        if (isLoading || loading || isFetchingProfile || !profile) return;

        if (!isSeller && !isPending && !isApproved && !isEntryScreen) {
            router.replace('/seller/onboarding');
        } else if (isApproved && isEntryScreen) {
            router.replace('/seller/dashboard');
        }
    }, [profile, loading, isFetchingProfile, segments, isLoading, isSeller, isPending, isApproved, isEntryScreen]);

    if (isLoading || loading || isFetchingProfile) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.textPrimary} />
            </Center>
        );
    }

    if (!profile) return null;

    if (isSuspended) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack} p="$4">
                <VStack space="md" alignItems="center">
                    <Heading color={COLORS.errorRed}>Account Suspended</Heading>
                    <Text color={COLORS.textSecondary} textAlign="center">
                        Your seller account has been suspended. Please contact support for more information.
                    </Text>
                    <Button onPress={() => signOut()} variant="outline" borderColor={COLORS.errorRed}>
                        <ButtonText color={COLORS.errorRed} textAlign="center">Sign Out</ButtonText>
                    </Button>
                </VStack>
            </Center>
        );
    }

    if (isPending) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack} p="$4">
                <VStack space="xl" alignItems="center">
                    <Box bg={COLORS.luxuryBlackLighter} p="$4" borderRadius="$full">
                        <Spinner size="large" color={COLORS.textPrimary} />
                    </Box>
                    <VStack space="xs" alignItems="center">
                        <Heading color={COLORS.textPrimary} textAlign="center">Application Under Review</Heading>
                        <Text color={COLORS.textSecondary} textAlign="center">
                            We're reviewing your seller application. This usually takes 24-48 hours.
                        </Text>
                    </VStack>
                    <Button onPress={() => router.replace('/(tabs)')} variant="link">
                        <ButtonText color={COLORS.textPrimary} textAlign="center">Back to Marketplace</ButtonText>
                    </Button>
                </VStack>
            </Center>
        );
    }

    if (isSeller && !stripeComplete && !isEntryScreen && segments[segments.length - 1] !== 'stripe-setup') {
        // Option to redirect to stripe setup if not complete
        // For now, we'll let the dashboard handle it or redirect here
        // router.replace('/seller/stripe-setup');
    }

    if (!isSeller && !isApproved && !isEntryScreen) {
        return null; // Redirecting
    }

    return <>{children}</>;
}
