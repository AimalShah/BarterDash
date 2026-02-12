import React, { useState, useEffect } from 'react';
import { StatusBar, ScrollView, Alert } from 'react-native';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    ButtonText,
    Input,
    InputField,
    FormControl,
    FormControlLabel,
    FormControlLabelText,
    Center,
    Spinner,
    Pressable
} from "@gluestack-ui/themed";
import { Truck, ChevronLeft } from 'lucide-react-native';
import { cartService } from '../../lib/api/services/cart';
import { useRouter } from 'expo-router';
import { paymentsService } from '../../lib/api/services/payments';
import { COLORS } from '../../constants/colors';
import { useStripe } from '@stripe/stripe-react-native';
import { useCartStore } from '../../store/cartStore';
import { CartTotal, ShippingAddress } from '../../types';

export default function CheckoutScreen() {
    const [cartTotal, setCartTotal] = useState<CartTotal | null>(null);
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        name: '',
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
    });
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [pendingOrderTotal, setPendingOrderTotal] = useState<number | null>(null);
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { setCount } = useCartStore();

    useEffect(() => {
        fetchCartTotal();
    }, []);

    const fetchCartTotal = async () => {
        try {
            const total = await cartService.calculateTotal();
            setCartTotal(total);
        } catch (error) {
            console.error('Failed to fetch cart total:', error);
            Alert.alert('Error', 'Failed to load cart information');
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!cartTotal) return;

        if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
            Alert.alert('Incomplete Address', 'Please fill in all shipping details to proceed.');
            return;
        }

        setPlacingOrder(true);
        try {
            const order = pendingOrderId
                ? { id: pendingOrderId, total: pendingOrderTotal ?? cartTotal.total }
                : await cartService.checkout(shippingAddress);
            const amount = Number(order.total);
            if (!Number.isFinite(amount) || amount <= 0) {
                throw new Error("Invalid order total for payment");
            }

            if (!pendingOrderId) {
                setPendingOrderId(order.id);
                setPendingOrderTotal(amount);
            }

            const paymentSheetParams = await paymentsService.createPaymentSheet({
                orderId: order.id,
                amount,
                currency: "usd",
                setupFutureUsage: "off_session",
                automaticPaymentMethods: true,
            });

            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: paymentSheetParams.paymentIntent,
                customerEphemeralKeySecret: paymentSheetParams.ephemeralKey,
                customerId: paymentSheetParams.customer,
                merchantDisplayName: "BarterDash",
                returnURL: "barterdash://checkout/success",
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    name: shippingAddress.name || "BarterDash Customer",
                },
            });

            if (initError) {
                throw new Error(
                    initError.message || "Cannot initialize payment sheet right now."
                );
            }

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === "Canceled") {
                    Alert.alert(
                        "Payment Cancelled",
                        "Your order was created but payment was cancelled. You can complete payment from the secure checkout screen.",
                        [
                            {
                                text: "Go to Secure Checkout",
                                onPress: () => router.push(`/checkout/${order.id}`),
                            },
                            {
                                text: "Later",
                                style: "cancel",
                            },
                        ],
                    );
                    return;
                }
                throw new Error(
                    presentError.message || "Payment could not be processed right now."
                );
            }

            setCount(0);
            setPendingOrderId(null);
            setPendingOrderTotal(null);
            Alert.alert(
                "Payment Successful",
                "Your order has been placed and payment has been received.",
                [
                    {
                        text: "View Order",
                        onPress: () => router.replace(`/orders/${order.id}`),
                    },
                    {
                        text: "Continue Shopping",
                        onPress: () => router.replace("/(tabs)"),
                    },
                ],
            );
        } catch (error) {
            const apiErrorMessage =
                (error as any)?.response?.data?.error?.message ||
                (error as any)?.response?.data?.message;
            const fallbackMessage =
                (error as any)?.message || "Payment could not be processed right now. Please try again.";
            Alert.alert("Checkout Error", apiErrorMessage || fallbackMessage);
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" alignItems="center">
                <HStack space="md" alignItems="center">
                    <Spinner size="small" color={COLORS.primaryGold} />
                    <Text color={COLORS.textPrimary} fontWeight="$black" size="sm" textTransform="uppercase">
                        PREPARING CHECKOUT...
                    </Text>
                </HStack>
            </Box>
        );
    }

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />

            <Box pt="$6" px="$6" pb="$4" bg={COLORS.luxuryBlack} borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h="$10"
                        w="$10"
                        bg={COLORS.luxuryBlack}
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <ChevronLeft size={22} color={COLORS.textPrimary} />
                    </Pressable>
                    <Text size="xl" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase" style={{ letterSpacing: -0.5 }}>Checkout</Text>
                </HStack>
            </Box>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 }}>
                <VStack space="xl">
                    {/* Progress Indicator */}
                    <HStack space="xs" alignItems="center" justifyContent="center" mb="$6">
                        <Text color={COLORS.textPrimary} size="2xs" fontWeight="$black" textTransform="uppercase">ADRESS</Text>
                        <Box h={1} w={30} bg={COLORS.textPrimary} mx="$2" />
                        <Text color={COLORS.textSecondary} size="2xs" fontWeight="$black" textTransform="uppercase">PAYMENT</Text>
                        <Box h={1} w={30} bg={COLORS.darkBorder} mx="$2" />
                        <Text color={COLORS.textSecondary} size="2xs" fontWeight="$black" textTransform="uppercase">CONFIRM</Text>
                    </HStack>

                    <Box bg={COLORS.luxuryBlack} p="$6" borderWidth={1} borderColor={COLORS.darkBorder}>
                        <VStack space="lg">
                            <HStack alignItems="center" space="md" mb="$2">
                                <Truck size={18} color={COLORS.textPrimary} />
                                <Text color={COLORS.textPrimary} fontWeight="$black" size="md" textTransform="uppercase">Shipping Address</Text>
                            </HStack>

                            <FormControl isRequired>
                                <FormControlLabel mb="$1">
                                    <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">FULL NAME</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                    <InputField
                                        placeholder="REQUIRED"
                                        color={COLORS.textPrimary}
                                        style={{ fontWeight: "700" }}
                                        value={shippingAddress.name}
                                        onChangeText={(text) => setShippingAddress({ ...shippingAddress, name: text })}
                                    />
                                </Input>
                            </FormControl>

                            <FormControl isRequired>
                                <FormControlLabel mb="$1">
                                    <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">STREET</FormControlLabelText>
                                </FormControlLabel>
                                <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                    <InputField
                                        placeholder="REQUIRED"
                                        color={COLORS.textPrimary}
                                        style={{ fontWeight: "700" }}
                                        value={shippingAddress.line1}
                                        onChangeText={(text) => setShippingAddress({ ...shippingAddress, line1: text })}
                                    />
                                </Input>
                            </FormControl>

                            <HStack space="md">
                                <FormControl isRequired flex={1}>
                                    <FormControlLabel mb="$1">
                                        <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">CITY</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                        <InputField
                                            placeholder="REQUIRED"
                                            color={COLORS.textPrimary}
                                            style={{ fontWeight: "700" }}
                                            value={shippingAddress.city}
                                            onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
                                        />
                                    </Input>
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormControlLabel mb="$1">
                                        <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">STATE</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                        <InputField
                                            placeholder="CA"
                                            color={COLORS.textPrimary}
                                            style={{ fontWeight: "700" }}
                                            value={shippingAddress.state}
                                            onChangeText={(text) => setShippingAddress({ ...shippingAddress, state: text })}
                                        />
                                    </Input>
                                </FormControl>
                            </HStack>

                            <HStack space="md">
                                <FormControl isRequired flex={1}>
                                    <FormControlLabel mb="$1">
                                        <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">ZIP</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                        <InputField
                                            placeholder="00000"
                                            color={COLORS.textPrimary}
                                            style={{ fontWeight: "700" }}
                                            keyboardType="numeric"
                                            value={shippingAddress.postalCode}
                                            onChangeText={(text) => setShippingAddress({ ...shippingAddress, postalCode: text })}
                                        />
                                    </Input>
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormControlLabel mb="$1">
                                        <FormControlLabelText color={COLORS.textSecondary} size="2xs" fontWeight="$black">COUNTRY</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input variant="outline" size="md" borderColor={COLORS.darkBorder} rounded="$sm">
                                        <InputField
                                            placeholder="USA"
                                            color={COLORS.textPrimary}
                                            style={{ fontWeight: "700" }}
                                            value={shippingAddress.country}
                                            onChangeText={(text) => setShippingAddress({ ...shippingAddress, country: text })}
                                        />
                                    </Input>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* Order Summary */}
                    <Box bg={COLORS.luxuryBlack} p="$6" borderTopWidth={1} borderColor={COLORS.darkBorder}>
                        <VStack space="md">
                            <Text color={COLORS.textPrimary} fontWeight="$black" size="sm" textTransform="uppercase">SUMMARY</Text>

                            <VStack space="xs" mt="$2">
                                <HStack justifyContent="space-between">
                                    <Text color={COLORS.textSecondary} size="xs" fontWeight="$bold" textTransform="uppercase">SUBTOTAL ({cartTotal?.items.length || 0} ITEMS)</Text>
                                    <Text color={COLORS.textPrimary} size="sm" fontWeight="$black">${cartTotal?.subtotal.toFixed(2)}</Text>
                                </HStack>
                                <HStack justifyContent="space-between">
                                    <Text color={COLORS.textSecondary} size="xs" fontWeight="$bold" textTransform="uppercase">SHIPPING</Text>
                                    <Text color={COLORS.textPrimary} size="sm" fontWeight="$black">${cartTotal?.shipping.toFixed(2)}</Text>
                                </HStack>
                                <HStack justifyContent="space-between" mt="$4" pt="$4" borderTopWidth={1} borderColor={COLORS.darkBorder}>
                                    <Text color={COLORS.textPrimary} size="lg" fontWeight="$black" textTransform="uppercase">TOTAL</Text>
                                    <Text color={COLORS.textPrimary} size="lg" fontWeight="$black">${cartTotal?.total.toFixed(2)}</Text>
                                </HStack>
                            </VStack>
                        </VStack>
                    </Box>

                    <Button
                        size="xl"
                        bg={COLORS.primaryGold}
                        h="$16"
                        mt="$6"
                        rounded="$sm"
                        onPress={handlePlaceOrder}
                        disabled={placingOrder}
                    >
                        {placingOrder ? (
                            <HStack space="md" alignItems="center">
                                <Spinner color={COLORS.luxuryBlack} size="small" />
                                <ButtonText fontWeight="$black" textTransform="uppercase" color={COLORS.luxuryBlack}>PROCESSING...</ButtonText>
                            </HStack>
                        ) : (
                            <ButtonText fontWeight="$black" textTransform="uppercase" color={COLORS.luxuryBlack}>SECURE CHECKOUT</ButtonText>
                        )}
                    </Button>

                    <Text color={COLORS.textMuted} size="2xs" textAlign="center" mt="$4" fontWeight="$bold" textTransform="uppercase">
                        FAST & SECURE PAYMENT VIA STRIPE
                    </Text>
                </VStack>
            </ScrollView>
        </Box>
    );
}
