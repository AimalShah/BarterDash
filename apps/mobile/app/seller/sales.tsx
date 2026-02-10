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
    Image,
    Badge,
    BadgeText,
} from "@gluestack-ui/themed";
import {
    ChevronLeft,
    Package,
    Calendar,
    Search,
} from 'lucide-react-native';
import { ordersService } from '../../lib/api/services/orders';
import { Order } from '../../types';
import { format } from 'date-fns';
import { COLORS } from '../../constants/colors';

export default function SalesScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sales, setSales] = useState<Order[]>([]);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const data = await ordersService.getMySales();
            setSales(data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSales();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return COLORS.warningAmber;
            case 'processing': return COLORS.primaryGold;
            case 'shipped': return COLORS.successGreen;
            case 'delivered': return COLORS.textMuted;
            case 'cancelled': return COLORS.errorRed;
            default: return COLORS.textMuted;
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'pending': return COLORS.luxuryBlack;
            case 'processing': return COLORS.luxuryBlack;
            case 'shipped': return COLORS.luxuryBlack;
            case 'delivered': return COLORS.textPrimary;
            case 'cancelled': return COLORS.luxuryBlack;
            default: return COLORS.textPrimary;
        }
    };

    if (loading) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <Box px="$6" py="$4">
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        bg={COLORS.luxuryBlack}
                        rounded={500}
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                    >
                        <ChevronLeft size={22} color={COLORS.textPrimary} />
                    </Pressable>
                    <VStack>
                        <Heading color={COLORS.textPrimary} size="xl" fontWeight="$bold">
                            My Sales
                        </Heading>
                        <Text color={COLORS.textSecondary} size="xs">
                            {sales.length} total orders
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primaryGold} />
                }
            >
                {sales.length === 0 ? (
                    <Center mt="$20">
                        <Box bg={COLORS.luxuryBlackLight} p="$8" rounded={100} mb="$6">
                            <Package size={48} color={COLORS.textMuted} />
                        </Box>
                        <Heading size="md" color={COLORS.textPrimary} mb="$2">No sales yet</Heading>
                        <Text color={COLORS.textSecondary} textAlign="center">
                            When you sell items in your streams, they will appear here for fulfillment.
                        </Text>
                    </Center>
                ) : (
                    <VStack space="md" mt="$4">
                        {sales.map((sale) => (
                            <Pressable
                                key={sale.id}
                                onPress={() => router.push(`/seller/order/${sale.id}`)}
                                bg={COLORS.luxuryBlack}
                                p="$4"
                                rounded={20}
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                sx={{ ":active": { bg: COLORS.luxuryBlackLight } }}
                            >
                                <HStack space="md" alignItems="center">
                                    <Box w={64} h={64} bg={COLORS.luxuryBlackLight} rounded={12} overflow="hidden">
                                        {sale.product?.images?.[0] ? (
                                            <Image
                                                source={{ uri: sale.product.images[0] }}
                                                className="w-full h-full"
                                                alt={sale.product.title}
                                            />
                                        ) : (
                                            <Center flex={1}>
                                                <Package size={20} color={COLORS.textMuted} />
                                            </Center>
                                        )}
                                    </Box>
                                    <VStack flex={1}>
                                        <HStack justifyContent="space-between" alignItems="flex-start">
                                            <VStack flex={1}>
                                                <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1}>
                                                    {sale.product?.title || 'Unknown Item'}
                                                </Text>
                                                <Text size="xs" color={COLORS.textSecondary}>
                                                    Order #{sale.orderNumber.slice(-8).toUpperCase()}
                                                </Text>
                                            </VStack>
                                            <Badge bg={getStatusColor(sale.status)} rounded="$full" size="sm">
                                                <BadgeText color={getStatusTextColor(sale.status)} textTransform="capitalize">
                                                    {sale.status}
                                                </BadgeText>
                                            </Badge>
                                        </HStack>
                                        <HStack justifyContent="space-between" alignItems="center" mt="$2">
                                            <Text size="xs" color={COLORS.textMuted}>
                                                {format(new Date(sale.createdAt), 'MMM dd, yyyy')}
                                            </Text>
                                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary}>
                                                ${sale.total}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </Pressable>
                        ))}
                    </VStack>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
