import { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '../context/ToastContext';

/**
 * Deep Link Handler
 * Handles deep links for:
 * - Stripe Identity verification callbacks
 * - Payment return URLs
 * - Other app-specific deep links
 */
export function useDeepLinkHandler() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleDeepLink = useCallback((url: string) => {
    console.log('Deep link received:', url);

    // Parse the URL
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const params = parsedUrl.searchParams;

    // Handle Stripe Identity verification callbacks
    if (path.includes('seller/verification')) {
      const status = params.get('status');
      
      if (status === 'verified') {
        showToast('Identity verified successfully!', 'success');
        router.push({
          pathname: '/seller/onboarding',
          params: { status: 'verified' }
        });
      } else if (status === 'requires_input') {
        showToast('Additional information needed', 'warning');
        router.push({
          pathname: '/seller/onboarding',
          params: { status: 'requires_input' }
        });
      } else if (status === 'canceled') {
        showToast('Verification was canceled', 'info');
        router.push({
          pathname: '/seller/onboarding',
          params: { status: 'canceled' }
        });
      }
      return;
    }

    // Handle payment return URLs
    if (path.includes('checkout/success')) {
      showToast('Payment successful!', 'success');
      const sessionId = params.get('session_id');
      if (sessionId) {
        // Handle checkout session completion
        router.push('/checkout/success');
      }
      return;
    }

    if (path.includes('checkout/cancel')) {
      showToast('Payment was canceled', 'info');
      router.push('/checkout/cancel');
      return;
    }

    if (path.includes('payment-return')) {
      // Handle payment method addition return
      showToast('Payment method updated', 'success');
      return;
    }

    // Handle other deep links
    console.log('Unhandled deep link:', url);
  }, [router, showToast]);

  useEffect(() => {
    // Handle deep link when app is opened from a URL
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link when app is already open
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return { handleDeepLink };
}

export default useDeepLinkHandler;
