import 'expo-dev-client';
import '@/global.css';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GluestackUIProvider } from '@/components/ui/reusables';
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { COLORS } from '../constants/colors';
import { ToastProvider } from '../context/ToastContext';
import { AuthGuard } from '../components/guards/AuthGuard';
import { OnboardingGuard } from '../components/guards/OnboardingGuard';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler';
import { usePushNotificationHandler } from '../hooks/usePushNotificationHandler';
import { logFeatureFlags } from '../lib/config/featureFlags';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppBootstrap() {
  useDeepLinkHandler();
  usePushNotificationHandler();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const applePayMerchantIdentifier =
    process.env.EXPO_PUBLIC_STRIPE_APPLE_PAY_MERCHANT_ID || '';

  useEffect(() => {
    logFeatureFlags();
  }, []);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StripeProvider
        publishableKey={stripePublishableKey}
        urlScheme="barterdash"
        merchantIdentifier={applePayMerchantIdentifier || undefined}
      >
        <GluestackUIProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AppBootstrap />
              <AuthGuard>
                <OnboardingGuard>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: COLORS.mainBackground },
                    }}
                  >
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="seller" options={{ headerShown: false }} />
                    <Stack.Screen name="stream/[id]" />
                    <Stack.Screen name="product/[id]" />
                    <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
                    <Stack.Screen name="social" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="menu"
                      options={{ presentation: 'transparentModal', animation: 'fade' }}
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
