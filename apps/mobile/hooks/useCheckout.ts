import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { cartService } from "../lib/api/services/cart";
import { paymentsService } from "../lib/api/services/payments";
import { ordersService } from "../lib/api/services/orders";
import { ShippingAddress } from "../types";
import { useCartStore } from "../store/cartStore";

export interface CheckoutState {
  loading: boolean;
  processingPayment: boolean;
  error: string | null;
  orderId: string | null;
  orderNumber: string | null;
  total: number;
  step: "shipping" | "payment" | "processing" | "success" | "error";
}

export interface UseCheckoutReturn extends CheckoutState {
  createOrder: (shippingAddress: ShippingAddress) => Promise<string | null>;
  processPayment: (orderId: string, paymentMethodId?: string) => Promise<boolean>;
  presentPaymentSheet: (orderId: string, amount: number) => Promise<boolean>;
  resetCheckout: () => void;
}

const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useCheckout(): UseCheckoutReturn {
  const [state, setState] = useState<CheckoutState>({
    loading: false,
    processingPayment: false,
    error: null,
    orderId: null,
    orderNumber: null,
    total: 0,
    step: "shipping",
  });

  const { initPaymentSheet, presentPaymentSheet: presentSheet } = useStripe();
  const idempotencyKeyRef = useRef<string>("");
  const { setCount } = useCartStore();

  // Create order from cart
  const createOrder = useCallback(async (
    shippingAddress: ShippingAddress
  ): Promise<string | null> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null, step: "processing" }));

      const order = await cartService.checkout(shippingAddress);

      setState((prev) => ({
        ...prev,
        loading: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: parseFloat(order.total),
        step: "payment",
      }));

      return order.id;
    } catch (error: any) {
      console.error("Error creating order:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create order";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        step: "error",
      }));
      Alert.alert("Checkout Error", errorMessage);
      return null;
    }
  }, []);

  // Present Stripe Payment Sheet for payment
  const presentPaymentSheet = useCallback(async (
    orderId: string,
    amount: number
  ): Promise<boolean> => {
    // Generate idempotency key for this payment attempt
    idempotencyKeyRef.current = generateIdempotencyKey();

    try {
      setState((prev) => ({ ...prev, processingPayment: true, error: null }));

      // Create Payment Sheet params
      const paymentSheetParams = await paymentsService.createPaymentSheet({
        orderId,
        amount,
        currency: "usd",
        setupFutureUsage: "off_session",
        automaticPaymentMethods: true,
      });

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentSheetParams.paymentIntent,
        customerEphemeralKeySecret: paymentSheetParams.ephemeralKey,
        customerId: paymentSheetParams.customer,
        merchantDisplayName: "BarterDash",
        returnURL: "barterdash://checkout/success",
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: "BarterDash Customer",
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          setState((prev) => ({
            ...prev,
            processingPayment: false,
            step: "payment",
          }));
          return false;
        }
        throw new Error(presentError.message);
      }

      // Payment successful
      setState((prev) => ({
        ...prev,
        processingPayment: false,
        step: "success",
      }));

      // Clear cart after successful payment
      setCount(0);

      return true;
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error?.message || "Payment failed. Please try again.";
      
      setState((prev) => ({
        ...prev,
        processingPayment: false,
        error: errorMessage,
        step: "error",
      }));

      Alert.alert(
        "Payment Failed",
        errorMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Try Again", 
            onPress: () => {
              setState((prev) => ({ ...prev, step: "payment", error: null }));
            }
          },
        ]
      );

      return false;
    }
  }, [initPaymentSheet, presentSheet, setCount]);

  // Process payment with saved payment method (alternative to Payment Sheet)
  const processPayment = useCallback(async (
    orderId: string,
    paymentMethodId?: string
  ): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, processingPayment: true, error: null }));

      // Get order details
      const order = await ordersService.getOrder(orderId);
      const amount = parseFloat(order.total);

      if (paymentMethodId) {
        // Use saved payment method
        const paymentIntent = await paymentsService.createPaymentIntentWithMethod({
          orderId,
          amount,
          currency: "usd",
          paymentMethodId,
        });

        // Confirm the payment
        const confirmation = await paymentsService.confirmPaymentIntent({
          paymentIntentId: paymentIntent.id,
          paymentMethodId,
        });

        if (confirmation.status === "succeeded") {
          setState((prev) => ({
            ...prev,
            processingPayment: false,
            step: "success",
          }));
          setCount(0);
          return true;
        } else if (confirmation.status === "requires_action") {
          // Handle 3D Secure or other authentication
          Alert.alert(
            "Additional Authentication Required",
            "Please complete the authentication in your banking app."
          );
          setState((prev) => ({ ...prev, processingPayment: false }));
          return false;
        } else {
          throw new Error("Payment could not be completed");
        }
      } else {
        // Fall back to Payment Sheet
        return presentPaymentSheet(orderId, amount);
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      const errorMessage = error?.message || "Payment failed. Please try again.";
      
      setState((prev) => ({
        ...prev,
        processingPayment: false,
        error: errorMessage,
        step: "error",
      }));

      Alert.alert("Payment Failed", errorMessage);
      return false;
    }
  }, [presentPaymentSheet, setCount]);

  // Reset checkout state
  const resetCheckout = useCallback(() => {
    idempotencyKeyRef.current = "";
    setState({
      loading: false,
      processingPayment: false,
      error: null,
      orderId: null,
      orderNumber: null,
      total: 0,
      step: "shipping",
    });
  }, []);

  return {
    ...state,
    createOrder,
    processPayment,
    presentPaymentSheet,
    resetCheckout,
  };
}
