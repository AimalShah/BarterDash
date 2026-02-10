import "expo-dev-client";
import { Stack } from "expo-router";
import "@/global.css";
import { ToastProvider } from "../context/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { AuthGuard } from "../components/guards/AuthGuard";
import { OnboardingGuard } from "../components/guards/OnboardingGuard";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { config } from "../config/gluestack.config";
import { useFonts } from "expo-font";
import { StripeProvider } from "@stripe/stripe-react-native";
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../constants/colors";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  if (!stripePublishableKey) {
    console.warn(
      "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe PaymentSheet will be unavailable."
    );
  }

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.luxuryBlack,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StripeProvider
        publishableKey={stripePublishableKey}
        urlScheme="barterdash"
      >
        <GluestackUIProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AuthGuard>
                <OnboardingGuard>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: COLORS.luxuryBlack },
                    }}
                  >
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(onboarding)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="seller"
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen name="stream/[id]" />
                    <Stack.Screen name="product/[id]" />
                    <Stack.Screen
                      name="user/[id]"
                      options={{ presentation: "card" }}
                    />
                    <Stack.Screen
                      name="social"
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="menu"
                      options={{
                        presentation: "transparentModal",
                        animation: "fade",
                      }}
                    />
                  </Stack>
                </OnboardingGuard>
              </AuthGuard>
            </ToastProvider>
          </QueryClientProvider>
        </GluestackUIProvider>
      </StripeProvider>
    </ErrorBoundary>
  );
}
