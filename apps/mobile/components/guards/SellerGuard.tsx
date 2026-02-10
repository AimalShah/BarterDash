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

    useEffect(() => {
        if (!loading && !isFetchingProfile) {
            setTimeout(() => setIsLoading(false), 300);
        }
    }, [loading, isFetchingProfile]);

    const isSeller = profile?.is_seller || profile?.isSeller || profile?.role === 'SELLER';
    const isApproved = profile?.sellerStatus === 'approved' || profile?.seller_status === 'approved' || isSeller;
    const isPending = profile?.sellerStatus === 'pending' || profile?.seller_status === 'pending';
    const isSuspended = profile?.accountStatus === 'suspended' || profile?.account_status === 'suspended';
    const stripeComplete = profile?.stripeAccountStatus === 'complete';
    const isRegistering = segments[segments.length - 1] === 'register';

    useEffect(() => {
        if (isLoading || loading || isFetchingProfile || !profile) return;

        if (!isSeller && !isPending && !isRegistering) {
            router.replace('/seller/register');
        } else if (isApproved && isRegistering) {
            router.replace('/seller/dashboard');
        }
    }, [profile, loading, isFetchingProfile, segments, isLoading, isSeller, isPending, isApproved, isRegistering]);

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
                        <ButtonText color={COLORS.errorRed}>Sign Out</ButtonText>
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
                        <ButtonText color={COLORS.textPrimary}>Back to Marketplace</ButtonText>
                    </Button>
                </VStack>
            </Center>
        );
    }

    if (isSeller && !stripeComplete && !isRegistering && segments[segments.length - 1] !== 'stripe-setup') {
        // Option to redirect to stripe setup if not complete
        // For now, we'll let the dashboard handle it or redirect here
        // router.replace('/seller/stripe-setup');
    }

    if (!isSeller && !isRegistering) {
        return null; // Redirecting
    }

    return <>{children}</>;
}
