import React, { useEffect, useState } from 'react';
import { StatusBar, ScrollView, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
    Divider,
    Button,
    ButtonText,
    Badge,
    BadgeText,
} from "@gluestack-ui/themed";
import {
    ChevronLeft,
    Package,
    MapPin,
    User,
    CreditCard,
    Truck,
} from 'lucide-react-native';
import { ordersService } from '../../../lib/api/services/orders';
import { Order } from '../../../types';
import { format } from 'date-fns';
import { COLORS } from '../../../constants/colors';

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [generatingLabel, setGeneratingLabel] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const data = await ordersService.getOrder(id as string);
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Failed to load order details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return;

        try {
            setUpdating(true);
            await ordersService.updateStatus(order.id, newStatus);
            await fetchOrder(); // Refresh data
            Alert.alert('Success', `Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    const handleGenerateLabel = async () => {
        if (!order) return;
        try {
            setGeneratingLabel(true);
            const labelData = await ordersService.generateLabel(order.id);
            await fetchOrder(); // Refresh to get tracking info
            Alert.alert('Success', 'Shipping label generated successfully!');
        } catch (error) {
            console.error('Error generating label:', error);
            Alert.alert('Error', 'Failed to generate shipping label');
        } finally {
            setGeneratingLabel(false);
        }
    };

    const handlePrintLabel = () => {
        if (order?.trackingNumber && order.status === 'shipped') {
            // In a real app we would use the actual label URL from the backend response
            // For this mock, we'll use the dummy URL or the one returned if we stored it
            const labelUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
            Alert.alert('Print Label', 'Opening label PDF...', [
                { text: 'Open', onPress: () => Linking.openURL(labelUrl) }
            ]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return `${COLORS.warningAmber}30`;
            case 'processing': return `$blue100`;
            case 'shipped': return `${COLORS.successGreen}30`;
            case 'delivered': return `${COLORS.textMuted}30`;
            case 'cancelled': return `${COLORS.errorRed}30`;
            default: return `${COLORS.textMuted}30`;
        }
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'pending': return COLORS.warningAmber;
            case 'processing': return '$blue700';
            case 'shipped': return COLORS.successGreen;
            case 'delivered': return COLORS.textSecondary;
            case 'cancelled': return COLORS.errorRed;
            default: return COLORS.textSecondary;
        }
    };

    if (loading) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
        );
    }

    if (!order) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <Box px="$6" py="$4">
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        bg={COLORS.luxuryBlackLight}
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
                            Order Details
                        </Heading>
                        <Text color={COLORS.textMuted} size="xs">
                            #{order.orderNumber.toUpperCase()}
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
                {/* Status Section */}
                <Box mt="$4" p="$4" bg={COLORS.luxuryBlackLight} rounded={24} borderWidth={1} borderColor={COLORS.darkBorder}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text size="sm" color={COLORS.textMuted}>Current Status</Text>
                            <Heading size="md" color={COLORS.textPrimary} textTransform="capitalize" mt="$1">
                                {order.status}
                            </Heading>
                        </VStack>
                        <Badge bg={getStatusColor(order.status)} rounded="$full" size="lg">
                            <BadgeText color={getStatusTextColor(order.status)} textTransform="capitalize" fontWeight="$bold">
                                {order.status}
                            </BadgeText>
                        </Badge>
                    </HStack>

                    {order.status === 'pending' && (
                        <Button
                            mt="$4"
                            size="md"
                            variant="solid"
                            action="primary"
                            bg={COLORS.primaryGold}
                            onPress={() => handleUpdateStatus('processing')}
                            isDisabled={updating}
                        >
                            <ButtonText color={COLORS.luxuryBlack}>Accept & Process Order</ButtonText>
                        </Button>
                    )}

                    {order.status === 'processing' && !order.trackingNumber && (
                        <VStack space="sm" mt="$4">
                            <Button
                                size="md"
                                variant="solid"
                                action="positive"
                                bg={COLORS.primaryGold}
                                onPress={handleGenerateLabel}
                                isDisabled={generatingLabel}
                            >
                                {generatingLabel ? (
                                    <Spinner color={COLORS.luxuryBlack} />
                                ) : (
                                    <HStack space="sm" alignItems="center">
                                        <Truck size={18} color={COLORS.luxuryBlack} />
                                        <ButtonText color={COLORS.luxuryBlack}>Generate Shipping Label</ButtonText>
                                    </HStack>
                                )}
                            </Button>
                            <Button
                                size="md"
                                variant="outline"
                                action="secondary"
                                borderColor={COLORS.successGreen}
                                onPress={() => handleUpdateStatus('shipped')}
                                isDisabled={updating}
                            >
                                <ButtonText color={COLORS.successGreen}>Mark as Shipped (Manual)</ButtonText>
                            </Button>
                        </VStack>
                    )}

                    {(order.status === 'shipped' || order.trackingNumber) && (
                        <VStack space="md" mt="$4">
                            <Box bg={COLORS.luxuryBlackLighter} p="$3" rounded="$md">
                                <Text size="xs" color={COLORS.textMuted} fontWeight="bold">TRACKING NUMBER</Text>
                                <HStack justifyContent="space-between" alignItems="center" mt="$1">
                                    <Text size="md" color={COLORS.textPrimary} fontWeight="bold">{order.trackingNumber || 'N/A'}</Text>
                                    <Text size="xs" color={COLORS.textMuted}>{order.carrier || 'USPS'}</Text>
                                </HStack>
                            </Box>
                            <Button
                                size="md"
                                variant="solid"
                                action="primary"
                                bg={COLORS.primaryGold}
                                onPress={handlePrintLabel}
                            >
                                <HStack space="sm" alignItems="center">
                                    <Package size={18} color={COLORS.luxuryBlack} />
                                    <ButtonText color={COLORS.luxuryBlack}>Print Label</ButtonText>
                                </HStack>
                            </Button>
                        </VStack>
                    )}
                </Box>

                {/* Item Details */}
                <VStack mt="$6" space="md">
                    <Text size="xs" fontWeight="$bold" color={COLORS.textMuted} textTransform="uppercase" letterSpacing={1}>
                        Item
                    </Text>
                    <HStack space="md" alignItems="center">
                        <Box w={80} h={80} bg={COLORS.luxuryBlackLight} rounded={16} overflow="hidden">
                            {order.product?.images?.[0] ? (
                                <Image
                                    source={{ uri: order.product.images[0] }}
                                    className="w-full h-full"
                                    alt={order.product.title}
                                />
                            ) : (
                                <Center flex={1}>
                                    <Package size={24} color={COLORS.textMuted} />
                                </Center>
                            )}
                        </Box>
                        <VStack flex={1}>
                            <Text size="md" fontWeight="$bold" color={COLORS.textPrimary}>
                                {order.product?.title || 'Unknown Item'}
                            </Text>
                            <Text size="sm" color={COLORS.textMuted} mt="$1">
                                Sold for ${order.itemPrice}
                            </Text>
                        </VStack>
                    </HStack>
                </VStack>

                <Divider my="$6" bg={COLORS.darkBorder} />

                {/* Shipping Address */}
                <VStack space="md">
                    <HStack space="sm" alignItems="center">
                        <MapPin size={16} color={COLORS.primaryGold} />
                        <Text size="xs" fontWeight="$bold" color={COLORS.textMuted} textTransform="uppercase" letterSpacing={1}>
                            Shipping Address
                        </Text>
                    </HStack>
                    {order.shippingAddress ? (
                        <VStack bg={COLORS.luxuryBlackLight} p="$4" rounded={16}>
                            <Text size="md" fontWeight="$bold" color={COLORS.textPrimary}>{order.shippingAddress.name}</Text>
                            <Text size="sm" color={COLORS.textMuted} mt="$1">{order.shippingAddress.line1}</Text>
                            {order.shippingAddress.line2 && <Text size="sm" color={COLORS.textMuted}>{order.shippingAddress.line2}</Text>}
                            <Text size="sm" color={COLORS.textMuted}>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </Text>
                            <Text size="sm" color={COLORS.textMuted}>{order.shippingAddress.country}</Text>
                        </VStack>
                    ) : (
                        <Text color={COLORS.textMuted}>No address provided</Text>
                    )}
                </VStack>

                <Divider my="$6" bg={COLORS.darkBorder} />

                {/* Customer Info */}
                <VStack space="md">
                    <HStack space="sm" alignItems="center">
                        <User size={16} color={COLORS.primaryGold} />
                        <Text size="xs" fontWeight="$bold" color={COLORS.textMuted} textTransform="uppercase" letterSpacing={1}>
                            Customer
                        </Text>
                    </HStack>
                    <HStack bg={COLORS.luxuryBlackLight} p="$4" rounded={16} alignItems="center" space="md">
                        <Box w={40} h={40} bg={COLORS.luxuryBlackLighter} rounded={20} alignItems="center" justifyContent="center" borderWidth={1} borderColor={COLORS.darkBorder}>
                            <User size={20} color={COLORS.textPrimary} />
                        </Box>
                        <VStack>
                            <Text size="md" fontWeight="$bold" color={COLORS.textPrimary}>
                                {order.buyer?.username || 'Guest Customer'}
                            </Text>
                            <Text size="xs" color={COLORS.textMuted}>
                                {order.buyer?.email || 'No email available'}
                            </Text>
                        </VStack>
                    </HStack>
                </VStack>

                <Divider my="$6" bg={COLORS.darkBorder} />

                {/* Payment Breakdown */}
                <VStack space="md">
                    <HStack space="sm" alignItems="center">
                        <CreditCard size={16} color={COLORS.primaryGold} />
                        <Text size="xs" fontWeight="$bold" color={COLORS.textMuted} textTransform="uppercase" letterSpacing={1}>
                            Payment
                        </Text>
                    </HStack>
                    <VStack bg={COLORS.luxuryBlackLight} p="$4" rounded={16} space="sm">
                        <HStack justifyContent="space-between">
                            <Text size="sm" color={COLORS.textMuted}>Item Price</Text>
                            <Text size="sm" color={COLORS.textPrimary}>${order.itemPrice}</Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color={COLORS.textMuted}>Shipping</Text>
                            <Text size="sm" color={COLORS.textPrimary}>${order.shippingCost}</Text>
                        </HStack>
                        <HStack justifyContent="space-between">
                            <Text size="sm" color={COLORS.textMuted}>Tax</Text>
                            <Text size="sm" color={COLORS.textPrimary}>${order.tax}</Text>
                        </HStack>
                        <Divider my="$1" bg={COLORS.darkBorder} />
                        <HStack justifyContent="space-between">
                            <Text size="md" fontWeight="$bold" color={COLORS.textPrimary}>Total Payout</Text>
                            <Text size="md" fontWeight="$bold" color={COLORS.primaryGold}>${order.total}</Text>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {order.status === 'shipped' && (
                <Box position="absolute" bottom={0} left={0} right={0} p="$6" bg={COLORS.luxuryBlack} borderTopWidth={1} borderTopColor={COLORS.darkBorder}>
                    <HStack space="sm" alignItems="center">
                        <Truck size={20} color={COLORS.successGreen} />
                        <Text size="sm" color={COLORS.successGreen} fontWeight="$medium">
                            Package is in transit
                        </Text>
                    </HStack>
                </Box>
            )}
        </SafeAreaView>
    );
}
