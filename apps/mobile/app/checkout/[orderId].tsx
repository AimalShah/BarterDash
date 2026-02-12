import React, { useEffect, useState } from "react";
import { StatusBar, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
  ScrollView,
} from "@gluestack-ui/themed";
import {
  ChevronLeft,
  Shield,
  CreditCard,
  Clock,
  CheckCircle,
  Package,
  DollarSign,
} from "lucide-react-native";
import { useStripe } from "@stripe/stripe-react-native";
import {
  escrowService,
  CreateEscrowResponse,
} from "../../lib/api/services/escrow";
import { ordersService } from "../../lib/api/services/orders";
import { paymentsService, type PaymentMethod } from "../../lib/api/services/payments";
import { COLORS } from "../../constants/colors";

interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [escrowData, setEscrowData] = useState<CreateEscrowResponse | null>(
    null,
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [step, setStep] = useState<"review" | "shipping" | "payment">("review");
  const [error, setError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });

  useEffect(() => {
    if (orderId) {
      loadCheckoutData();
    }
  }, [orderId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const [orderData, methodsData] = await Promise.all([
        ordersService.getOrder(orderId!),
        paymentsService.getPaymentMethods(),
      ]);

      setOrder(orderData);
      setPaymentMethods(methodsData);

      // Select default payment method
      const defaultMethod = methodsData.find((m) => m.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      } else if (methodsData.length > 0) {
        setSelectedPaymentMethod(methodsData[0].id);
      }
    } catch (err: any) {
      console.error("Error loading checkout:", err);
      setError("Failed to load checkout details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setProcessing(true);
      // Get setup intent from backend
      const { setupIntent, ephemeralKey, customer } =
        await paymentsService.createSetupIntent();
      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        merchantDisplayName: "BarterDash",
        allowsDelayedPaymentMethods: true,
        returnURL: "barterdash://payment-return",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          return;
        }
        throw new Error(presentError.message);
      }

      // Refresh payment methods
      const methods = await paymentsService.getPaymentMethods();
      setPaymentMethods(methods);

      // Select the newly added method
      const newMethod = methods[methods.length - 1];
      if (newMethod) {
        setSelectedPaymentMethod(newMethod.id);
      }

      Alert.alert("Success", "Payment method added successfully");
    } catch (err: any) {
      console.error("Error adding payment method:", err);
      Alert.alert("Error", err.message || "Failed to add payment method");
    } finally {
      setProcessing(false);
    }
  };

  const validateShipping = (): boolean => {
    const { fullName, street, city, state, zipCode } = shippingAddress;
    if (!fullName || !street || !city || !state || !zipCode) {
      setError("Please fill in all shipping address fields");
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateShipping()) return;
    setStep("payment");
  };

  const handlePayWithEscrow = async () => {
    try {
      setProcessing(true);
      setError(null);

      // 1. Create escrow payment
      const escrowResponse = await escrowService.createEscrowPayment(orderId!);
      setEscrowData(escrowResponse);

      if (
        !escrowResponse.clientSecret ||
        !escrowResponse.customer ||
        !escrowResponse.ephemeralKey
      ) {
        throw new Error(
          "Unable to initialize secure payment session. Please try again.",
        );
      }

      // 2. Initialize Payment Sheet with escrow payment intent
      const { error: initError } = await initPaymentSheet({
        customerId: escrowResponse.customer,
        customerEphemeralKeySecret: escrowResponse.ephemeralKey,
        paymentIntentClientSecret: escrowResponse.clientSecret,
        merchantDisplayName: "BarterDash",
        allowsDelayedPaymentMethods: false,
        returnURL: "barterdash://checkout/success",
        defaultBillingDetails: {
          name: shippingAddress.fullName || "BarterDash Customer",
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          setProcessing(false);
          return;
        }
        throw new Error(presentError.message);
      }

      // 4. Payment successful!
      Alert.alert(
        "Payment Successful!",
        "Your payment is being held in escrow. The seller will ship your item soon.",
        [
          {
            text: "View Order",
            onPress: () => router.replace(`/orders/${orderId}`),
          },
        ],
      );
    } catch (err: any) {
      console.error("Payment error:", err);
      const apiErrorMessage =
        err?.response?.data?.error?.message || err?.response?.data?.message;
      const errorMessage =
        apiErrorMessage ||
        err?.message ||
        "Payment could not be processed right now. Please try again.";
      setError(errorMessage);
      
      // Show error alert with retry option
      Alert.alert(
        "Payment Failed",
        errorMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Retry", 
            onPress: () => handlePayWithEscrow()
          }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Center flex={1} bg={COLORS.luxuryBlack}>
        <Spinner size="large" color={COLORS.primaryGold} />
      </Center>
    );
  }

  if (!order) {
    return (
      <Center flex={1} bg={COLORS.luxuryBlack}>
        <Package size={48} color={COLORS.textMuted} />
        <Text color={COLORS.textSecondary} mt="$4">
          Order not found
        </Text>
        <Button mt="$4" bg={COLORS.primaryGold} onPress={() => router.back()}>
          <ButtonText color={COLORS.luxuryBlack}>Go Back</ButtonText>
        </Button>
      </Center>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Box
        px="$6"
        pt="$4"
        pb="$4"
        borderBottomWidth={1}
        borderBottomColor={COLORS.darkBorder}
      >
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
            <Heading color={COLORS.textPrimary} size="lg" fontWeight="$black">
              Secure Checkout
            </Heading>
            <Text size="xs" color={COLORS.textMuted}>
              Order #{order.orderNumber}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 120 }}>
        <VStack p="$6" space="lg">
          {/* Error Message */}
          {error && (
            <Box
              bg={`${COLORS.errorRed}20`}
              p="$4"
              rounded="$lg"
              borderWidth={1}
              borderColor={COLORS.errorRed}
            >
              <Text size="sm" color={COLORS.errorRed}>
                {error}
              </Text>
            </Box>
          )}

          {/* Escrow Protection Banner */}
          <Box
            bg={`${COLORS.successGreen}20`}
            p="$4"
            rounded="$xl"
            borderWidth={2}
            borderColor={COLORS.successGreen}
          >
            <HStack alignItems="center" space="md">
              <Box bg={COLORS.successGreen} p="$3" rounded="$full">
                <Shield size={24} color={COLORS.textPrimary} />
              </Box>
              <VStack flex={1}>
                <Text fontWeight="$bold" color={COLORS.textPrimary}>
                  Buyer Protection
                </Text>
                <Text size="xs" color={COLORS.textMuted}>
                  Your payment is held securely until you confirm delivery
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Order Summary */}
          <Box
            bg={COLORS.luxuryBlackLight}
            rounded="$xl"
            borderWidth={2}
            borderColor={COLORS.darkBorder}
            overflow="hidden"
          >
            <Box bg={COLORS.primaryGold} px="$4" py="$3">
              <Text color={COLORS.luxuryBlack} fontWeight="$bold">
                Order Summary
              </Text>
            </Box>
            <VStack p="$4" space="sm">
              <HStack justifyContent="space-between">
                <Text color={COLORS.textMuted}>Item Price</Text>
                <Text fontWeight="$bold" color={COLORS.textPrimary}>
                  ${order.itemPrice}
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text color={COLORS.textMuted}>Shipping</Text>
                <Text fontWeight="$bold" color={COLORS.textPrimary}>
                  ${order.shippingCost}
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text color={COLORS.textMuted}>Tax</Text>
                <Text fontWeight="$bold" color={COLORS.textPrimary}>
                  ${order.tax}
                </Text>
              </HStack>
              <Box h={1} bg={COLORS.darkBorder} my="$2" />
              <HStack justifyContent="space-between">
                <Text fontWeight="$black" color={COLORS.textPrimary} size="lg">
                  Total
                </Text>
                <Text fontWeight="$black" color={COLORS.primaryGold} size="lg">
                  ${order.total}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* How Escrow Works */}
          <Box>
            <Text fontWeight="$bold" color={COLORS.textPrimary} mb="$3">
              How Escrow Protection Works
            </Text>
            <VStack space="sm">
              <HStack alignItems="flex-start" space="md">
                <Box
                  bg={COLORS.primaryGold}
                  w={28}
                  h={28}
                  rounded="$full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="xs">
                    1
                  </Text>
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
                    Pay Securely
                  </Text>
                  <Text size="xs" color={COLORS.textMuted}>
                    Your payment is held by BarterDash, not the seller
                  </Text>
                </VStack>
              </HStack>
              <HStack alignItems="flex-start" space="md">
                <Box
                  bg={COLORS.primaryGold}
                  w={28}
                  h={28}
                  rounded="$full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="xs">
                    2
                  </Text>
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
                    Seller Ships Item
                  </Text>
                  <Text size="xs" color={COLORS.textMuted}>
                    Track your package with the provided tracking number
                  </Text>
                </VStack>
              </HStack>
              <HStack alignItems="flex-start" space="md">
                <Box
                  bg={COLORS.primaryGold}
                  w={28}
                  h={28}
                  rounded="$full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color={COLORS.luxuryBlack} fontWeight="$bold" size="xs">
                    3
                  </Text>
                </Box>
                <VStack flex={1}>
                  <Text fontWeight="$bold" color={COLORS.textPrimary} size="sm">
                    Confirm Delivery
                  </Text>
                  <Text size="xs" color={COLORS.textMuted}>
                    Inspect your item and confirm receipt to release payment
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Auto-release notice */}
          <Box
            bg={`${COLORS.warningAmber}20`}
            p="$3"
            rounded="$lg"
            borderWidth={1}
            borderColor={COLORS.warningAmber}
          >
            <HStack alignItems="center" space="sm">
              <Clock size={16} color={COLORS.warningAmber} />
              <Text size="xs" color={COLORS.warningAmber} flex={1}>
                Funds auto-release 7 days after delivery if not disputed
              </Text>
            </HStack>
          </Box>
        </VStack>
      </ScrollView>

      {/* Pay Button */}
      <Box
        px="$6"
        py="$4"
        bg={COLORS.luxuryBlack}
        borderTopWidth={1}
        borderTopColor={COLORS.darkBorder}
        position="absolute"
        bottom={0}
        left={0}
        right={0}
      >
        <Button
          size="xl"
          bg={COLORS.primaryGold}
          onPress={handlePayWithEscrow}
          isDisabled={processing}
        >
          {processing ? (
            <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />
          ) : (
            <CreditCard
              size={20}
              color={COLORS.luxuryBlack}
              style={{ marginRight: 8 }}
            />
          )}
          <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>
            {processing ? "Processing..." : `Pay $${order.total} Securely`}
          </ButtonText>
        </Button>
      </Box>
    </SafeAreaView>
  );
}
