import React, { useEffect, useState } from 'react';
import { StatusBar, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Pressable,
    Center,
    Spinner,
    Button,
    ButtonText,
    ButtonSpinner,
} from "@gluestack-ui/themed";
import {
    ChevronLeft,
    CreditCard,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Shield,
    DollarSign,
    RefreshCw,
} from 'lucide-react-native';
import { stripeConnectService, StripeAccountStatus } from '../../lib/api/services/stripe-connect';
import { COLORS } from '../../constants/colors';

export default function StripeSetupScreen() {
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAccountStatus();
    }, []);

    const fetchAccountStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const status = await stripeConnectService.getAccountStatus();
            setAccountStatus(status);
        } catch (err: any) {
            console.error('Error fetching Stripe status:', err);
            setError(err.response?.data?.message || 'Failed to fetch account status');
        } finally {
            setLoading(false);
        }
    };

    const handleConnectStripe = async () => {
        try {
            setConnecting(true);
            setError(null);

            let onboardingUrl: string;

            if (accountStatus?.isConnected && !accountStatus?.onboardingComplete) {
                // Resume onboarding
                const response = await stripeConnectService.getOnboardingLink();
                onboardingUrl = response.url;
            } else {
                // Start new onboarding
                const response = await stripeConnectService.createConnectAccount();
                onboardingUrl = response.onboardingUrl;
            }

            // Open Stripe onboarding in browser
            const supported = await Linking.canOpenURL(onboardingUrl);
            if (supported) {
                await Linking.openURL(onboardingUrl);
            } else {
                Alert.alert('Error', 'Could not open Stripe onboarding page');
            }
        } catch (err: any) {
            console.error('Error connecting Stripe:', err);
            setError(err.response?.data?.message || 'Failed to start Stripe setup');
        } finally {
            setConnecting(false);
        }
    };

    const handleOpenDashboard = async () => {
        try {
            setConnecting(true);
            const response = await stripeConnectService.getDashboardLink();
            await Linking.openURL(response.url);
        } catch (err: any) {
            console.error('Error opening dashboard:', err);
            Alert.alert('Error', 'Failed to open Stripe dashboard');
        } finally {
            setConnecting(false);
        }
    };

    if (loading) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
        );
    }

    const StatusCard = ({ icon, title, description, status, color }: any) => (
        <HStack
            bg={COLORS.luxuryBlackLight}
            p="$4"
            rounded="$lg"
            borderWidth={2}
            borderColor={COLORS.darkBorder}
            alignItems="center"
            space="md"
            mb="$3"
        >
            <Box bg={`${color}30`} p="$3" rounded="$full">
                {icon}
            </Box>
            <VStack flex={1}>
                <Text fontWeight="$bold" color={COLORS.textPrimary}>{title}</Text>
                <Text size="xs" color={COLORS.textMuted}>{description}</Text>
            </VStack>
            {status ? (
                <CheckCircle size={24} color={COLORS.successGreen} />
            ) : (
                <AlertTriangle size={24} color={COLORS.warningAmber} />
            )}
        </HStack>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" pt="$4" pb="$6">
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        bg={COLORS.luxuryBlackLight}
                        rounded="$lg"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={COLORS.primaryGold}
                    >
                        <ChevronLeft size={22} color={COLORS.primaryGold} />
                    </Pressable>
                    <VStack>
                        <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">
                            Payment Setup
                        </Heading>
                        <Text size="sm" color={COLORS.textMuted}>
                            Connect Stripe to receive payouts
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            <Box px="$6" flex={1}>
                {/* Error message */}
                {error && (
                    <Box bg={`${COLORS.errorRed}20`} p="$4" rounded="$lg" borderWidth={1} borderColor={COLORS.errorRed} mb="$4">
                        <HStack alignItems="center" space="sm">
                            <AlertTriangle size={20} color={COLORS.errorRed} />
                            <Text size="sm" color={COLORS.errorRed} flex={1}>{error}</Text>
                        </HStack>
                    </Box>
                )}

                {/* Not Connected State */}
                {!accountStatus?.isConnected && (
                    <VStack space="lg">
                        <Box
                            bg={COLORS.primaryGold}
                            p="$6"
                            rounded="$xl"
                        >
                            <VStack alignItems="center" space="md">
                                <Box bg={COLORS.luxuryBlack} p="$4" rounded="$full">
                                    <CreditCard size={32} color={COLORS.primaryGold} />
                                </Box>
                                <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="lg" textAlign="center">
                                    Connect Stripe to Get Paid
                                </Text>
                                <Text color={COLORS.luxuryBlack} size="sm" textAlign="center" opacity={0.8}>
                                    Set up your Stripe account to receive payments from your sales.
                                    Funds are securely held until delivery is confirmed.
                                </Text>
                            </VStack>
                        </Box>

                        {/* Benefits */}
                        <VStack space="sm">
                            <HStack alignItems="center" space="sm" p="$3" bg={COLORS.luxuryBlackLight} rounded="$lg">
                                <Shield size={20} color={COLORS.primaryGold} />
                                <Text size="sm" color={COLORS.textPrimary} flex={1}>
                                    Secure escrow protection for all transactions
                                </Text>
                            </HStack>
                            <HStack alignItems="center" space="sm" p="$3" bg={COLORS.luxuryBlackLight} rounded="$lg">
                                <DollarSign size={20} color={COLORS.primaryGold} />
                                <Text size="sm" color={COLORS.textPrimary} flex={1}>
                                    Automatic payouts after delivery (8% platform fee)
                                </Text>
                            </HStack>
                        </VStack>

                        <Button
                            size="xl"
                            bg={COLORS.primaryGold}
                            onPress={handleConnectStripe}
                            isDisabled={connecting}
                        >
                            {connecting && <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />}
                            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">Connect with Stripe</ButtonText>
                        </Button>
                    </VStack>
                )}

                {/* Connected but Incomplete */}
                {accountStatus?.isConnected && !accountStatus?.onboardingComplete && (
                    <VStack space="lg">
                        <Box
                            bg={`${COLORS.warningAmber}20`}
                            p="$6"
                            rounded="$xl"
                            borderWidth={2}
                            borderColor={COLORS.warningAmber}
                        >
                            <VStack alignItems="center" space="md">
                                <Box bg={COLORS.warningAmber} p="$4" rounded="$full">
                                    <AlertTriangle size={32} color={COLORS.luxuryBlack} />
                                </Box>
                                <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg" textAlign="center">
                                    Complete Your Setup
                                </Text>
                                <Text color={COLORS.textMuted} size="sm" textAlign="center">
                                    Your Stripe account is created but you need to complete
                                    the verification process to receive payouts.
                                </Text>
                            </VStack>
                        </Box>

                        <StatusCard
                            icon={<CreditCard size={24} color={COLORS.primaryGold} />}
                            title="Account Created"
                            description="Stripe account connected"
                            status={true}
                            color={COLORS.primaryGold}
                        />
                        <StatusCard
                            icon={<Shield size={24} color={COLORS.warningAmber} />}
                            title="Verification Pending"
                            description="Complete identity verification"
                            status={false}
                            color={COLORS.warningAmber}
                        />
                        <StatusCard
                            icon={<DollarSign size={24} color={COLORS.textMuted} />}
                            title="Payouts"
                            description={accountStatus?.payoutsEnabled ? "Enabled" : "Not available yet"}
                            status={accountStatus?.payoutsEnabled}
                            color={COLORS.textMuted}
                        />

                        <Button
                            size="xl"
                            bg={COLORS.primaryGold}
                            onPress={handleConnectStripe}
                            isDisabled={connecting}
                        >
                            {connecting && <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />}
                            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">Continue Setup</ButtonText>
                            <ExternalLink size={18} color={COLORS.luxuryBlack} style={{ marginLeft: 8 }} />
                        </Button>
                    </VStack>
                )}

                {/* Fully Connected */}
                {accountStatus?.isConnected && accountStatus?.onboardingComplete && (
                    <VStack space="lg">
                        <Box
                            bg={`${COLORS.successGreen}20`}
                            p="$6"
                            rounded="$xl"
                            borderWidth={2}
                            borderColor={COLORS.successGreen}
                        >
                            <VStack alignItems="center" space="md">
                                <Box bg={COLORS.successGreen} p="$4" rounded="$full">
                                    <CheckCircle size={32} color={COLORS.textPrimary} />
                                </Box>
                                <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg" textAlign="center">
                                    You're All Set!
                                </Text>
                                <Text color={COLORS.textMuted} size="sm" textAlign="center">
                                    Your Stripe account is fully connected.
                                    Payouts will be sent automatically after delivery confirmation.
                                </Text>
                            </VStack>
                        </Box>

                        <StatusCard
                            icon={<CreditCard size={24} color={COLORS.successGreen} />}
                            title="Account Connected"
                            description="Stripe Express account active"
                            status={true}
                            color={COLORS.successGreen}
                        />
                        <StatusCard
                            icon={<Shield size={24} color={COLORS.successGreen} />}
                            title="Verification Complete"
                            description="Identity verified"
                            status={true}
                            color={COLORS.successGreen}
                        />
                        <StatusCard
                            icon={<DollarSign size={24} color={COLORS.successGreen} />}
                            title="Payouts Enabled"
                            description={accountStatus?.payoutsEnabled ? "Ready to receive funds" : "Pending activation"}
                            status={accountStatus?.payoutsEnabled}
                            color={COLORS.successGreen}
                        />

                        <Button
                            size="xl"
                            bg={COLORS.primaryGold}
                            onPress={handleOpenDashboard}
                            isDisabled={connecting}
                        >
                            {connecting && <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />}
                            <ButtonText color={COLORS.luxuryBlack} fontWeight="$bold">Open Stripe Dashboard</ButtonText>
                            <ExternalLink size={18} color={COLORS.luxuryBlack} style={{ marginLeft: 8 }} />
                        </Button>

                        <Pressable onPress={fetchAccountStatus} alignSelf="center" p="$2">
                            <HStack alignItems="center" space="xs">
                                <RefreshCw size={16} color={COLORS.textMuted} />
                                <Text size="sm" color={COLORS.textMuted}>Refresh Status</Text>
                            </HStack>
                        </Pressable>
                    </VStack>
                )}
            </Box>
        </SafeAreaView>
    );
}
