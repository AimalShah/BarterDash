import React, { useEffect, useState } from 'react';
import { StatusBar, ScrollView, RefreshControl } from 'react-native';
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
} from "@gluestack-ui/themed";
import {
    ChevronLeft,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    ExternalLink,
    AlertTriangle,
    CreditCard,
    Shield,
    ChevronRight,
} from 'lucide-react-native';
import { stripeConnectService, StripeAccountStatus } from '../../lib/api/services/stripe-connect';
import { escrowService, EscrowTransaction } from '../../lib/api/services/escrow';
import { ordersService } from '../../lib/api/services/orders';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/colors';

export default function EarningsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [escrows, setEscrows] = useState<Map<string, EscrowTransaction>>(new Map());

    // Calculated stats
    const [stats, setStats] = useState({
        pendingPayout: 0,
        totalEarned: 0,
        inEscrow: 0,
        thisMonth: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [status, salesData] = await Promise.all([
                stripeConnectService.getAccountStatus().catch(() => null),
                ordersService.getMySales().catch(() => []),
            ]);

            setAccountStatus(status);
            setOrders(salesData);

            // Fetch escrow data for each order
            const escrowMap = new Map<string, EscrowTransaction>();
            for (const order of salesData) {
                try {
                    const escrow = await escrowService.getEscrowByOrder(order.id);
                    escrowMap.set(order.id, escrow);
                } catch (e) {
                    // No escrow for this order
                }
            }
            setEscrows(escrowMap);

            // Calculate stats
            let inEscrow = 0;
            let totalEarned = 0;
            let thisMonth = 0;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            escrowMap.forEach((escrow) => {
                const sellerAmount = parseFloat(escrow.sellerAmount || '0');

                if (escrow.status === 'held') {
                    inEscrow += sellerAmount;
                } else if (escrow.status === 'released') {
                    totalEarned += sellerAmount;

                    if (escrow.releasedAt && new Date(escrow.releasedAt) >= startOfMonth) {
                        thisMonth += sellerAmount;
                    }
                }
            });

            setStats({
                pendingPayout: inEscrow,
                totalEarned,
                inEscrow,
                thisMonth,
            });
        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
        );
    }

    const StatCard = ({ icon, label, value, subtitle }: any) => (
        <Box
            bg={COLORS.cardBackground}
            p="$4"
            rounded="$lg"
            borderWidth={2}
            borderColor={COLORS.darkBorder}
            flex={1}
        >
            <HStack alignItems="center" space="sm" mb="$2">
                {icon}
                <Text size="xs" color={COLORS.textSecondary}>{label}</Text>
            </HStack>
            <Text size="2xl" fontWeight="$black" color={COLORS.textPrimary}>{value}</Text>
            {subtitle && <Text size="xs" color={COLORS.textMuted}>{subtitle}</Text>}
        </Box>
    );

    const EscrowOrderItem = ({ order, escrow }: { order: any; escrow: EscrowTransaction }) => {
        const getStatusBadge = () => {
            switch (escrow.status) {
                case 'held':
                    return { bg: COLORS.primaryGold, text: 'In Escrow', color: COLORS.luxuryBlack };
                case 'releasing':
                    return { bg: COLORS.warningAmber, text: 'Releasing', color: COLORS.luxuryBlack };
                case 'released':
                    return { bg: COLORS.successGreen, text: 'Released', color: COLORS.textPrimary };
                case 'refunded':
                    return { bg: COLORS.errorRed, text: 'Refunded', color: COLORS.textPrimary };
                case 'disputed':
                    return { bg: COLORS.errorRed, text: 'Disputed', color: COLORS.textPrimary };
                default:
                    return { bg: COLORS.darkSurface, text: escrow.status, color: COLORS.textPrimary };
            }
        };

        const badge = getStatusBadge();

        return (
            <Pressable
                onPress={() => router.push(`/seller/order/${order.id}`)}
                bg={COLORS.cardBackground}
                p="$4"
                rounded="$lg"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
                mb="$2"
            >
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                        <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1}>
                            Order #{order.orderNumber}
                        </Text>
                        <Text size="xs" color={COLORS.textSecondary}>
                            {new Date(order.createdAt).toLocaleDateString()}
                        </Text>
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text fontWeight="$bold" color={COLORS.textPrimary}>
                            ${escrow.sellerAmount}
                        </Text>
                        <Box bg={badge.bg} px="$2" py="$0.5" rounded="$full">
                            <Text size="2xs" color={badge.color} fontWeight="$bold">
                                {badge.text}
                            </Text>
                        </Box>
                    </VStack>
                </HStack>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" pt="$4" pb="$4">
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        bg={COLORS.cardBackground}
                        rounded="$lg"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                    >
                        <ChevronLeft size={22} color={COLORS.textPrimary} />
                    </Pressable>
                    <VStack>
                        <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">
                            Earnings
                        </Heading>
                        <Text size="sm" color={COLORS.textSecondary}>
                            Track your payouts
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primaryGold}
                    />
                }
            >
                <VStack px="$6" space="lg">
                    {/* Stripe Connect Status */}
                    {!accountStatus?.onboardingComplete && (
                        <Pressable
                            onPress={() => router.push('/seller/stripe-setup')}
                            bg={COLORS.warningAmber}
                            p="$4"
                            rounded="$xl"
                            borderWidth={2}
                            borderColor={COLORS.warningAmber}
                        >
                            <HStack alignItems="center" space="md">
                                <Box bg={COLORS.luxuryBlack} p="$3" rounded="$full">
                                    <AlertTriangle size={20} color={COLORS.primaryGold} />
                                </Box>
                                <VStack flex={1}>
                                    <Text fontWeight="$bold" color={COLORS.luxuryBlack}>Complete Payout Setup</Text>
                                    <Text size="xs" color={COLORS.textSecondary}>
                                        Connect Stripe to receive payments
                                    </Text>
                                </VStack>
                                <ChevronRight size={20} color={COLORS.luxuryBlack} />
                            </HStack>
                        </Pressable>
                    )}

                    {/* Stats Grid */}
                    <VStack space="sm">
                        <HStack space="sm">
                            <StatCard
                                icon={<Shield size={16} color={COLORS.primaryGold} />}
                                label="In Escrow"
                                value={`$${stats.inEscrow.toFixed(2)}`}
                                subtitle="Pending release"
                            />
                            <StatCard
                                icon={<CheckCircle size={16} color={COLORS.successGreen} />}
                                label="Released"
                                value={`$${stats.totalEarned.toFixed(2)}`}
                                subtitle="Total earned"
                            />
                        </HStack>
                        <HStack space="sm">
                            <StatCard
                                icon={<TrendingUp size={16} color={COLORS.primaryGold} />}
                                label="This Month"
                                value={`$${stats.thisMonth.toFixed(2)}`}
                            />
                            <Box flex={1}>
                                <Pressable
                                    onPress={() => router.push('/seller/stripe-setup')}
                                    bg={COLORS.primaryGold}
                                    p="$4"
                                    rounded="$lg"
                                    flex={1}
                                    justifyContent="center"
                                >
                                    <HStack alignItems="center" space="sm">
                                        <CreditCard size={20} color={COLORS.luxuryBlack} />
                                        <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="sm">
                                            Stripe Settings
                                        </Text>
                                    </HStack>
                                </Pressable>
                            </Box>
                        </HStack>
                    </VStack>

                    {/* Transactions List */}
                    <Box>
                        <Text fontWeight="$bold" color={COLORS.textPrimary} mb="$3">Recent Transactions</Text>

                        {orders.length === 0 ? (
                            <Box
                                bg={COLORS.darkSurface}
                                p="$8"
                                rounded="$lg"
                                alignItems="center"
                            >
                                <DollarSign size={32} color={COLORS.textMuted} />
                                <Text color={COLORS.textSecondary} mt="$2">No transactions yet</Text>
                            </Box>
                        ) : (
                            orders.map((order) => {
                                const escrow = escrows.get(order.id);
                                if (!escrow) return null;
                                return (
                                    <EscrowOrderItem
                                        key={order.id}
                                        order={order}
                                        escrow={escrow}
                                    />
                                );
                            })
                        )}
                    </Box>

                    {/* Escrow Info */}
                    <Box bg={COLORS.darkSurface} p="$4" rounded="$lg">
                        <HStack alignItems="flex-start" space="md">
                            <Shield size={20} color={COLORS.primaryGold} />
                            <VStack flex={1}>
                                <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
                                    How Escrow Works
                                </Text>
                                <Text size="xs" color={COLORS.textSecondary} mt="$1">
                                    Buyer payments are held securely until they confirm delivery.
                                    Funds are automatically released 7 days after shipping or when
                                    the buyer confirms receipt. An 8% platform fee is deducted.
                                </Text>
                            </VStack>
                        </HStack>
                    </Box>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}
