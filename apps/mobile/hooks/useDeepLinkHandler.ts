import { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { useAuthStore } from '@/store/authStore';

/**
 * Deep Link Handler
 * Handles deep links for:
 * - Email verification confirmations
 * - Magic Link authentication
 * - Password reset flows
 * - Stripe Identity verification callbacks
 * - Payment return URLs
 * - Other app-specific deep links
 */

export function useDeepLinkHandler() {
  const router = useRouter();
  const { showToast } = useToast()
  const { setSession } = useAuthStore()

  const createSessionFromUrl = useCallback(async (url: string) => {
    console.log('[DEEP LINK] Creating session from URL:', url);

    try {
      const { params, errorCode } = QueryParams.getQueryParams(url);

      if (errorCode) {
        throw new Error(errorCode);
      }

      const { access_token, refresh_token, type, token_hash, token } = params;

      if (token_hash || token) {
        const actual_token = token || token_hash;

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });


        if (error) {
          throw error;
        }


        if (data.session) {
          showToast('Email verified successfully!', 'success');
          setSession(data.session)

          if (type === 'signup' || type === 'email') {
            console.log('[DEEP LINK] Redirecting to onboarding');
            router.replace('/(onboarding)/profile-setup');
          } else if (type === 'recovery') {

            console.log('[DEEP LINK] Redirecting to update-password');
            router.replace({
              pathname: '/update-password',
              params: { access_token: data.session.access_token }
            });
          } else if (type === 'magiclink') {
            console.log('[DEEP LINK] Redirecting to tabs (magic link)');
            router.replace('/(tabs)');
          }

          return true;
        } else {
          console.log('[DEEP LINK] No session in OTP response');
        }
      }

      if (access_token && refresh_token) {
        console.log('Setting session from tokens');

        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Session error:', error);
          throw error;
        }

        if (data.session) {
          console.log('Session set successfully');
          showToast('Signed in successfully!', 'success');
          router.replace('/(tabs)');
          return true;
        }
      }

      return false;
    } catch (error: any) {
      console.error('Session creation error:', error);
      showToast(error.message || 'Authentication failed', 'error');
      return false;
    }
  }, [router, showToast]);

  const handleDeepLink = useCallback(async (url: string) => {
    console.log('[DEEP LINK] Received URL:', url);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      console.error('[DEEP LINK] Invalid URL:', error);
      return;
    }

    // Parse the URL
    const host = parsedUrl.hostname.toLowerCase();
    const path = parsedUrl.pathname.toLowerCase();
    const params = parsedUrl.searchParams;
    const route = `${host}${path}`;

    console.log('[DEEP LINK] Parsed:', { host, path, route });
    console.log('[DEEP LINK] Search params:', Object.fromEntries(params));

    if (route.includes('seller/verification')) {
      const status = params.get('status') || params.get('redirect_status');

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
      } else {
        showToast('Verification complete. Checking your seller status.', 'info');
        router.push('/seller/onboarding');
      }
      return;
    }

    // Handle auth confirmation URLs (Supabase sends these in emails)
    // URL format: barterdash://auth/confirm?token_hash=xxx&type=signup
    if (path.includes('auth/confirm') || path.includes('confirm')) {
      console.log('[DEEP LINK] Auth confirmation detected');
      const success = await createSessionFromUrl(url);

      if (!success) {
        showToast('Failed to verify email. Please try again.', 'error');
        router.replace('/(auth)/login');
      }
      return router.replace("/update-password");
    }

    // Handle password reset/update
    if (path.includes('auth/update-password') || path.includes('reset-password') || path.includes('update-password')) {
      console.log('[DEEP LINK] Password reset detected');
      const accessToken = params.get('access_token') || params.get('code');

      if (accessToken) {
        console.log('[DEEP LINK] Has access_token, redirecting to update-password');
        router.push({
          pathname: '/update-password',
          params: { access_token: accessToken }
        });
      } else {
        // Try to create session from URL parameters
        console.log('[DEEP LINK] No access_token, trying createSessionFromUrl');
        const success = await createSessionFromUrl(url);
        if (!success) {
          showToast('Invalid or expired reset link', 'error');
          router.replace('/(auth)/forgot-password');
        }
      }
      return;
    }

    // Handle magic link authentication
    if (path.includes('auth/magic-link') || path.includes('magiclink')) {
      console.log('[DEEP LINK] Magic link detected');
      const success = await createSessionFromUrl(url);

      if (!success) {
        showToast('Magic link expired or invalid', 'error');
        router.replace('/(auth)/login');
      }
      return;
    }

    // Handle email verification callback
    if (path.includes('verify') || path.includes('verification')) {
      console.log('[DEEP LINK] Verification detected');
      const success = await createSessionFromUrl(url);

      if (!success) {
        // Check if this is a post-verification redirect
        const verified = params.get('verified');
        if (verified === 'true') {
          showToast('Email verified! Please sign in.', 'success');
          router.replace('/(auth)/login');
        }
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
    console.log('[DEEP LINK] Unhandled URL:', url);
  }, [router, showToast, createSessionFromUrl]);

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

  return { handleDeepLink, createSessionFromUrl };
}

export default useDeepLinkHandler;
