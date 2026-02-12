import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { paymentsService, PaymentMethod } from "../lib/api/services/payments";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  selectedMethodId: string | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  loadError: string | null;
  isAddingMethod: boolean;
  selectMethod: (methodId: string) => void;
  setDefaultMethod: (methodId: string) => Promise<void>;
  deleteMethod: (methodId: string) => Promise<void>;
  addPaymentMethod: () => Promise<void>;
  refreshMethods: () => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function usePaymentMethods(
  userId: string,
  onMethodSelected?: (methodId: string) => void
): UsePaymentMethodsReturn {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);

  // Check authentication status and subscribe to auth changes
  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setIsAuthenticated(!!currentSession);
        setAuthChecked(true);
      } catch (error) {
        console.error("Error checking Supabase session:", error);
        setSession(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    };

    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      setSession(newSession);
      setIsAuthenticated(!!newSession);
      setAuthChecked(true);

      if (event === "SIGNED_OUT") {
        setPaymentMethods([]);
        setSelectedMethodId(null);
      }
    });

    authSubscription.current = subscription;

    return () => {
      authSubscription.current?.unsubscribe();
    };
  }, []);

  // Load payment methods with retry logic
  const loadPaymentMethods = useCallback(async (retryCount = 0): Promise<void> => {
    if (!isAuthenticated || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const methods = await paymentsService.getPaymentMethods();
      setPaymentMethods(methods);

      const defaultMethod = methods.find((method) => method.isDefault);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
        onMethodSelected?.(defaultMethod.id);
      } else if (methods.length > 0) {
        // Select first method if no default
        setSelectedMethodId(methods[0].id);
        onMethodSelected?.(methods[0].id);
      } else {
        setSelectedMethodId(null);
        onMethodSelected?.("");
      }
    } catch (error: any) {
      console.error("Error loading payment methods:", error);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && (error.message?.includes("network") || error.code === "NETWORK_ERROR")) {
        console.log(`Retrying payment methods load (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return loadPaymentMethods(retryCount + 1);
      }

      setLoadError("Failed to load payment methods. Please try again.");
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, session, onMethodSelected]);

  // Load payment methods when auth state changes
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      loadPaymentMethods();
    } else if (authChecked && !isAuthenticated) {
      setLoading(false);
    }
  }, [authChecked, isAuthenticated, loadPaymentMethods]);

  const selectMethod = useCallback(
    (methodId: string) => {
      if (!isAuthenticated) {
        Alert.alert("Authentication Required", "Please sign in to select a payment method");
        return;
      }
      setSelectedMethodId(methodId);
      onMethodSelected?.(methodId);
    },
    [isAuthenticated, onMethodSelected]
  );

  const setDefaultMethod = useCallback(
    async (methodId: string) => {
      try {
        await paymentsService.setDefaultPaymentMethod(methodId);
        setPaymentMethods((methods) =>
          methods.map((method) => ({
            ...method,
            isDefault: method.id === methodId,
          }))
        );
        Alert.alert("Success", "Default payment method updated");
      } catch (error) {
        console.error("Error setting default payment method:", error);
        Alert.alert("Error", "Failed to update default payment method");
      }
    },
    []
  );

  const deleteMethod = useCallback(
    async (methodId: string) => {
      const method = paymentMethods.find((m) => m.id === methodId);
      if (!method) return;

      Alert.alert(
        "Delete Payment Method",
        `Are you sure you want to delete the ${method.brand.toUpperCase()} card ending in ${method.last4}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await paymentsService.deletePaymentMethod(methodId);
                setPaymentMethods((methods) => methods.filter((m) => m.id !== methodId));

                if (selectedMethodId === methodId) {
                  const remainingMethods = paymentMethods.filter((m) => m.id !== methodId);
                  const newDefault = remainingMethods.find((m) => m.isDefault) || remainingMethods[0];
                  if (newDefault) {
                    setSelectedMethodId(newDefault.id);
                    onMethodSelected?.(newDefault.id);
                  } else {
                    setSelectedMethodId(null);
                    onMethodSelected?.("");
                  }
                }
                Alert.alert("Success", "Payment method deleted");
              } catch (error) {
                console.error("Error deleting payment method:", error);
                Alert.alert("Error", "Failed to delete payment method");
              }
            },
          },
        ]
      );
    },
    [paymentMethods, selectedMethodId, onMethodSelected]
  );

  const addPaymentMethod = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert("Authentication Required", "Please sign in to add a payment method");
      return;
    }

    if (isAddingMethod) return;

    try {
      setIsAddingMethod(true);

      const setupIntent = await paymentsService.createSetupIntent({
        setAsDefault: paymentMethods.length === 0,
      });

      const { error: initError } = await initPaymentSheet({
        customerId: setupIntent.customer,
        customerEphemeralKeySecret: setupIntent.ephemeralKey,
        setupIntentClientSecret: setupIntent.setupIntent,
        merchantDisplayName: "BarterDash",
        returnURL: "barterdash://payment-return",
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("Payment Method Cancelled", "No payment method was added.");
          return;
        }
        throw new Error(presentError.message);
      }

      Alert.alert("Payment Method Added", "Your payment method was added successfully.");
      await loadPaymentMethods();
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      Alert.alert(
        "Unable to Add Method",
        error?.message || "Failed to add payment method. Please try again."
      );
    } finally {
      setIsAddingMethod(false);
    }
  }, [isAuthenticated, isAddingMethod, paymentMethods.length, initPaymentSheet, presentPaymentSheet, loadPaymentMethods]);

  return {
    paymentMethods,
    loading,
    selectedMethodId,
    isAuthenticated,
    authChecked,
    loadError,
    isAddingMethod,
    selectMethod,
    setDefaultMethod,
    deleteMethod,
    addPaymentMethod,
    refreshMethods: loadPaymentMethods,
  };
}
