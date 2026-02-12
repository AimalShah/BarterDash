import React, { useEffect, useState, useCallback } from "react";
import { StatusBar, Alert, StyleSheet } from "react-native";
import { router, useRouter } from "expo-router";
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
  Input,
  InputField,
  FormControl,
} from "@gluestack-ui/themed";
import {
  ChevronLeft,
  Shield,
  CreditCard,
  Clock,
  Package,
  MapPin,
  Plus,
  CheckCircle,
} from "lucide-react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { cartService } from "../../lib/api/services/cart";
import { paymentsService } from "../../lib/api/services/payments";
import { PaymentMethod } from "../../types";
import { COLORS } from "../../constants/colors";
import { useCartStore } from "../../store/cartStore";

interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CartItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  quantity: number;
}

interface CartTotal {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export default function CartCheckoutScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { setCount } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<CartTotal | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [step, setStep] = useState<"review" | "shipping" | "payment" | "processing" | "success">("review");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });

  // Load cart data and payment methods
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const [items, total, methods] = await Promise.all([
        cartService.getCart(),
        cartService.calculateTotal(),
        paymentsService.getPaymentMethods(),
      ]);

      setCartItems(items);
      setCartTotal(total);
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error("Error loading checkout:", err);
      setError("Failed to load checkout details");
    } finally {
      setLoading(false);
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

  const handleCreateOrder = async () => {
    if (!validateShipping()) return;

    try {
      setProcessing(true);
      setStep("processing");
      setError(null);

      // Create order from cart
      const order = await cartService.checkout({
        name: shippingAddress.fullName,
        line1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      });

      setOrderId(order.id);
      setStep("payment");
      
      // Proceed to payment
      await handlePayment(order.id, parseFloat(order.total));
    } catch (err: any) {
      console.error("Error creating order:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to create order";
      setError(errorMessage);
      setStep("shipping");
      Alert.alert("Checkout Error", errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (orderId: string, amount: number) => {
    try {
      setProcessing(true);
      setStep("processing");

      // Create Payment Sheet
      let paymentSheetParams;
      try {
        paymentSheetParams = await paymentsService.createPaymentSheet({
          orderId,
          amount,
          currency: "usd",
          setupFutureUsage: "off_session",
          automaticPaymentMethods: true,
        });
      } catch (apiError: any) {
        console.error("API Error creating payment sheet:", apiError);
        const errorMessage = apiError?.response?.data?.error?.message || apiError?.message || "Cannot process payments right now. Please try again.";
        throw new Error(errorMessage);
      }

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentSheetParams.paymentIntent,
        customerEphemeralKeySecret: paymentSheetParams.ephemeralKey,
        customerId: paymentSheetParams.customer,
        merchantDisplayName: "BarterDash",
        returnURL: "barterdash://checkout/success",
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: shippingAddress.fullName,
        },
      });

      if (initError) {
        console.error("Init payment sheet error:", initError);
        throw new Error(initError.message || "Cannot process payments right now. Please try again.");
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error("Present payment sheet error:", presentError);
        if (presentError.code === "Canceled") {
          setProcessing(false);
          setStep("payment");
          return;
        }
        throw new Error(presentError.message || "Payment could not be processed. Please try again.");
      }

      // Payment successful!
      setStep("success");
      setCount(0); // Clear cart count
      
      Alert.alert(
        "Payment Successful!",
        "Your order has been placed and payment received.",
        [
          {
            text: "View Order",
            onPress: () => router.replace(`/orders/${orderId}`),
          },
          {
            text: "Continue Shopping",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (err: any) {
      console.error("Payment error:", err);
      const errorMessage = err?.message || "Payment failed. Please try again.";
      setError(errorMessage);
      setStep("payment");
      
      Alert.alert(
        "Payment Failed",
        errorMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Try Again", 
            onPress: () => handlePayment(orderId, amount)
          }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setProcessing(true);
      
      const setupIntent = await paymentsService.createSetupIntent({
        setAsDefault: paymentMethods.length === 0,
      });

      const { error: initError } = await initPaymentSheet({
        customerId: setupIntent.customer,
        customerEphemeralKeySecret: setupIntent.ephemeralKey,
        setupIntentClientSecret: setupIntent.setupIntent,
        merchantDisplayName: "BarterDash",
        allowsDelayedPaymentMethods: true,
        returnURL: "barterdash://payment-return",
      });

      if (initError) {
        throw new Error(initError.message);
      }

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

      Alert.alert("Success", "Payment method added successfully");
    } catch (err: any) {
      console.error("Error adding payment method:", err);
      Alert.alert("Error", err.message || "Failed to add payment method");
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

  if (cartItems.length === 0 && step !== "success") {
    return (
      <Center flex={1} bg={COLORS.luxuryBlack}>
        <Package size={48} color={COLORS.textMuted} />
        <Text color={COLORS.textSecondary} mt="$4">
          Your cart is empty
        </Text>
        <Button mt="$4" bg={COLORS.primaryGold} onPress={() => router.replace("/(tabs)")}>
          <ButtonText color={COLORS.luxuryBlack}>Start Shopping</ButtonText>
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
              Checkout
            </Heading>
            <Text size="xs" color={COLORS.textMuted}>
              {step === "review" && "Review your cart"}
              {step === "shipping" && "Enter shipping details"}
              {step === "payment" && "Complete payment"}
              {step === "processing" && "Processing..."}
              {step === "success" && "Order complete!"}
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

          {/* Progress Steps */}
          <HStack justifyContent="space-between" alignItems="center" mb="$4">
            {["Cart", "Shipping", "Payment"].map((stepName, index) => {
              const stepValue = ["review", "shipping", "payment"][index];
              const isActive = step === stepValue || 
                (step === "processing" && ["shipping", "payment"].includes(stepValue)) ||
                step === "success";
              const isPast = ["review", "shipping"].indexOf(step) > index || step === "success";
              
              return (
                <HStack key={stepName} alignItems="center" flex={1}>
                  <Box
                    w={32}
                    h={32}
                    rounded="$full"
                    alignItems="center"
                    justifyContent="center"
                    bg={isActive || isPast ? COLORS.primaryGold : COLORS.luxuryBlackLight}
                    borderWidth={2}
                    borderColor={isActive || isPast ? COLORS.primaryGold : COLORS.darkBorder}
                  >
                    <Text
                      color={isActive || isPast ? COLORS.luxuryBlack : COLORS.textMuted}
                      fontWeight="$bold"
                      size="sm"
                    >
                      {index + 1}
                    </Text>
                  </Box>
                  <Text
                    size="xs"
                    color={isActive || isPast ? COLORS.textPrimary : COLORS.textMuted}
                    ml="$2"
                    flex={1}
                  >
                    {stepName}
                  </Text>
                  {index < 2 && (
                    <Box
                      flex={1}
                      h={2}
                      bg={isPast ? COLORS.primaryGold : COLORS.darkBorder}
                      mx="$2"
                    />
                  )}
                </HStack>
              );
            })}
          </HStack>

          {/* Cart Review */}
          {step === "review" && (
            <>
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
                  {cartItems.map((item) => (
                    <HStack key={item.id} justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text color={COLORS.textPrimary} size="sm" numberOfLines={1}>
                          {item.product.title}
                        </Text>
                        <Text color={COLORS.textMuted} size="xs">
                          Qty: {item.quantity}
                        </Text>
                      </VStack>
                      <Text color={COLORS.textPrimary} fontWeight="$bold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                    </HStack>
                  ))}
                  <Box h={1} bg={COLORS.darkBorder} my="$2" />
                  <HStack justifyContent="space-between">
                    <Text color={COLORS.textMuted}>Subtotal</Text>
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>
                      ${cartTotal?.subtotal.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text color={COLORS.textMuted}>Shipping</Text>
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>
                      ${cartTotal?.shipping.toFixed(2)}
                    </Text>
                  </HStack>
                  <HStack justifyContent="space-between">
                    <Text color={COLORS.textMuted}>Tax</Text>
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>
                      ${cartTotal?.tax.toFixed(2)}
                    </Text>
                  </HStack>
                  <Box h={1} bg={COLORS.darkBorder} my="$2" />
                  <HStack justifyContent="space-between">
                    <Text fontWeight="$black" color={COLORS.textPrimary} size="lg">
                      Total
                    </Text>
                    <Text fontWeight="$black" color={COLORS.primaryGold} size="lg">
                      ${cartTotal?.total.toFixed(2)}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              <Button
                size="xl"
                bg={COLORS.primaryGold}
                onPress={() => setStep("shipping")}
              >
                <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>
                  Continue to Shipping
                </ButtonText>
              </Button>
            </>
          )}

          {/* Shipping Form */}
          {step === "shipping" && (
            <>
              <Box
                bg={COLORS.luxuryBlackLight}
                rounded="$xl"
                borderWidth={2}
                borderColor={COLORS.darkBorder}
                p="$4"
              >
                <VStack space="md">
                  <FormControl>
                    <FormControl.Label>
                      <Text color={COLORS.textSecondary} size="sm">Full Name</Text>
                    </FormControl.Label>
                    <Input
                      variant="outline"
                      size="md"
                      borderColor={COLORS.darkBorder}
                      backgroundColor={COLORS.luxuryBlack}
                    >
                      <InputField
                        color={COLORS.textPrimary}
                        placeholder="Enter your full name"
                        placeholderTextColor={COLORS.textMuted}
                        value={shippingAddress.fullName}
                        onChangeText={(text) =>
                          setShippingAddress((prev) => ({ ...prev, fullName: text }))
                        }
                      />
                    </Input>
                  </FormControl>

                  <FormControl>
                    <FormControl.Label>
                      <Text color={COLORS.textSecondary} size="sm">Street Address</Text>
                    </FormControl.Label>
                    <Input
                      variant="outline"
                      size="md"
                      borderColor={COLORS.darkBorder}
                      backgroundColor={COLORS.luxuryBlack}
                    >
                      <InputField
                        color={COLORS.textPrimary}
                        placeholder="Enter street address"
                        placeholderTextColor={COLORS.textMuted}
                        value={shippingAddress.street}
                        onChangeText={(text) =>
                          setShippingAddress((prev) => ({ ...prev, street: text }))
                        }
                      />
                    </Input>
                  </FormControl>

                  <HStack space="md">
                    <FormControl flex={1}>
                      <FormControl.Label>
                        <Text color={COLORS.textSecondary} size="sm">City</Text>
                      </FormControl.Label>
                      <Input
                        variant="outline"
                        size="md"
                        borderColor={COLORS.darkBorder}
                        backgroundColor={COLORS.luxuryBlack}
                      >
                        <InputField
                          color={COLORS.textPrimary}
                          placeholder="City"
                          placeholderTextColor={COLORS.textMuted}
                          value={shippingAddress.city}
                          onChangeText={(text) =>
                            setShippingAddress((prev) => ({ ...prev, city: text }))
                          }
                        />
                      </Input>
                    </FormControl>

                    <FormControl w={80}>
                      <FormControl.Label>
                        <Text color={COLORS.textSecondary} size="sm">State</Text>
                      </FormControl.Label>
                      <Input
                        variant="outline"
                        size="md"
                        borderColor={COLORS.darkBorder}
                        backgroundColor={COLORS.luxuryBlack}
                      >
                        <InputField
                          color={COLORS.textPrimary}
                          placeholder="ST"
                          placeholderTextColor={COLORS.textMuted}
                          maxLength={2}
                          value={shippingAddress.state}
                          onChangeText={(text) =>
                            setShippingAddress((prev) => ({ ...prev, state: text.toUpperCase() }))
                          }
                        />
                      </Input>
                    </FormControl>
                  </HStack>

                  <HStack space="md">
                    <FormControl flex={1}>
                      <FormControl.Label>
                        <Text color={COLORS.textSecondary} size="sm">ZIP Code</Text>
                      </FormControl.Label>
                      <Input
                        variant="outline"
                        size="md"
                        borderColor={COLORS.darkBorder}
                        backgroundColor={COLORS.luxuryBlack}
                      >
                        <InputField
                          color={COLORS.textPrimary}
                          placeholder="ZIP"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                          value={shippingAddress.zipCode}
                          onChangeText={(text) =>
                            setShippingAddress((prev) => ({ ...prev, zipCode: text }))
                          }
                        />
                      </Input>
                    </FormControl>

                    <FormControl w={100}>
                      <FormControl.Label>
                        <Text color={COLORS.textSecondary} size="sm">Country</Text>
                      </FormControl.Label>
                      <Input
                        variant="outline"
                        size="md"
                        borderColor={COLORS.darkBorder}
                        backgroundColor={COLORS.luxuryBlack}
                        isDisabled
                      >
                        <InputField
                          color={COLORS.textPrimary}
                          value="US"
                        />
                      </Input>
                    </FormControl>
                  </HStack>
                </VStack>
              </Box>

              <Button
                size="xl"
                bg={COLORS.primaryGold}
                onPress={handleCreateOrder}
                isDisabled={processing}
              >
                {processing ? (
                  <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />
                ) : (
                  <CreditCard size={20} color={COLORS.luxuryBlack} style={{ marginRight: 8 }} />
                )}
                <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>
                  {processing ? "Creating Order..." : `Pay $${cartTotal?.total.toFixed(2)}`}
                </ButtonText>
              </Button>
            </>
          )}

          {/* Processing State */}
          {step === "processing" && (
            <Center py="$20">
              <Spinner size="large" color={COLORS.primaryGold} />
              <Text color={COLORS.textSecondary} mt="$4">
                Processing your order...
              </Text>
            </Center>
          )}

          {/* Payment Methods Section */}
          {step === "payment" && !processing && (
            <>
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
                      Secure Payment
                    </Text>
                    <Text size="xs" color={COLORS.textMuted}>
                      Your payment information is encrypted and secure
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Text color={COLORS.textPrimary} fontWeight="$bold">
                Payment Methods
              </Text>

              {paymentMethods.length === 0 ? (
                <Box
                  bg={COLORS.luxuryBlackLight}
                  rounded="$xl"
                  borderWidth={2}
                  borderColor={COLORS.darkBorder}
                  p="$6"
                  alignItems="center"
                >
                  <CreditCard size={48} color={COLORS.textMuted} />
                  <Text color={COLORS.textSecondary} mt="$4" textAlign="center">
                    No payment methods saved
                  </Text>
                  <Button
                    mt="$4"
                    bg={COLORS.primaryGold}
                    onPress={handleAddPaymentMethod}
                    isDisabled={processing}
                  >
                    <ButtonText color={COLORS.luxuryBlack}>Add Payment Method</ButtonText>
                  </Button>
                </Box>
              ) : (
                <VStack space="md">
                  {paymentMethods.map((method) => (
                    <Pressable
                      key={method.id}
                      bg={COLORS.luxuryBlackLight}
                      rounded="$xl"
                      borderWidth={2}
                      borderColor={COLORS.darkBorder}
                      p="$4"
                    >
                      <HStack alignItems="center" space="md">
                        <Box
                          bg={COLORS.primaryGold}
                          p="$3"
                          rounded="$lg"
                        >
                          <CreditCard size={24} color={COLORS.luxuryBlack} />
                        </Box>
                        <VStack flex={1}>
                          <Text color={COLORS.textPrimary} fontWeight="$bold">
                            {method.brand.toUpperCase()} •••• {method.last4}
                          </Text>
                          <Text size="xs" color={COLORS.textMuted}>
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </Text>
                        </VStack>
                        {method.isDefault && (
                          <Box
                            bg={`${COLORS.primaryGold}20`}
                            px="$2"
                            py="$1"
                            rounded="$md"
                          >
                            <Text size="xs" color={COLORS.primaryGold}>
                              Default
                            </Text>
                          </Box>
                        )}
                      </HStack>
                    </Pressable>
                  ))}

                  <Button
                    variant="outline"
                    borderColor={COLORS.darkBorder}
                    onPress={handleAddPaymentMethod}
                    isDisabled={processing}
                  >
                    <Plus size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                    <ButtonText color={COLORS.textSecondary}>Add New Payment Method</ButtonText>
                  </Button>

                  {orderId && cartTotal && (
                    <Button
                      size="xl"
                      bg={COLORS.primaryGold}
                      onPress={() => handlePayment(orderId, cartTotal.total)}
                      isDisabled={processing}
                      mt="$4"
                    >
                      {processing ? (
                        <ButtonSpinner mr="$2" color={COLORS.luxuryBlack} />
                      ) : (
                        <CreditCard size={20} color={COLORS.luxuryBlack} style={{ marginRight: 8 }} />
                      )}
                      <ButtonText fontWeight="$bold" color={COLORS.luxuryBlack}>
                        {processing ? "Processing..." : `Pay $${cartTotal?.total.toFixed(2)}`}
                      </ButtonText>
                    </Button>
                  )}
                </VStack>
              )}
            </>
          )}

          {/* Success State */}
          {step === "success" && (
            <Center py="$20">
              <Box
                bg={COLORS.successGreen}
                p="$6"
                rounded="$full"
                mb="$6"
              >
                <CheckCircle size={64} color={COLORS.textPrimary} />
              </Box>
              <Heading color={COLORS.textPrimary} size="xl" mb="$2">
                Order Confirmed!
              </Heading>
              <Text color={COLORS.textSecondary} textAlign="center" mb="$6">
                Your payment was successful and your order is being processed.
              </Text>
              <VStack space="md" w="100%">
                <Button
                  bg={COLORS.primaryGold}
                  onPress={() => router.replace(`/orders/${orderId}`)}
                >
                  <ButtonText color={COLORS.luxuryBlack}>View Order</ButtonText>
                </Button>
                <Button
                  variant="outline"
                  borderColor={COLORS.darkBorder}
                  onPress={() => router.replace("/(tabs)")}
                >
                  <ButtonText color={COLORS.textSecondary}>Continue Shopping</ButtonText>
                </Button>
              </VStack>
            </Center>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
