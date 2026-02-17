import { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

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
  const { showToast } = useToast();

  const createSessionFromUrl = useCallback(async (url: string) => {
    console.log('Creating session from URL:', url);
    
    try {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      
      if (errorCode) {
        console.error('Query params error:', errorCode);
        throw new Error(errorCode);
      }

      const { access_token, refresh_token, type, token_hash } = params;

      // Handle OTP verification (email confirmation, magic link, password reset)
      if (token_hash && type) {
        console.log('Verifying OTP:', { type, token_hash });
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error('OTP verification error:', error);
          throw error;
        }

        if (data.session) {
          console.log('OTP verification successful, session created');
          showToast('Email verified successfully!', 'success');
          
          // Redirect based on type
          if (type === 'signup' || type === 'email') {
            // Email verification - go to onboarding
            router.replace('/(onboarding)/profile-setup');
          } else if (type === 'recovery') {
            // Password reset - go to update password screen
            router.replace({
              pathname: '/(auth)/update-password',
              params: { access_token: data.session.access_token }
            });
          } else if (type === 'magiclink') {
            // Magic link - go to main app
            router.replace('/(tabs)');
          }
          
          return true;
        }
      }

      // Handle direct access_token/refresh_token (for OAuth, etc.)
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
    console.log('Deep link received:', url);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      console.error('Invalid deep link URL:', error);
      return;
    }

    // Parse the URL
    const host = parsedUrl.hostname.toLowerCase();
    const path = parsedUrl.pathname.toLowerCase();
    const params = parsedUrl.searchParams;
    const route = `${host}${path}`;

    // Handle Stripe Identity verification callbacks
    // e.g. barterdash://seller/verification?status=verified
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
      console.log('Handling auth confirmation deep link');
      const success = await createSessionFromUrl(url);
      
      if (!success) {
        showToast('Failed to verify email. Please try again.', 'error');
        router.replace('/(auth)/login');
      }
      return;
    }

    // Handle password reset/update
    if (path.includes('auth/update-password') || path.includes('reset-password')) {
      console.log('Handling password reset deep link');
      const accessToken = params.get('access_token') || params.get('code');
      
      if (accessToken) {
        router.push({
          pathname: '/(auth)/update-password',
          params: { access_token: accessToken }
        });
      } else {
        // Try to create session from URL parameters
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
      console.log('Handling magic link deep link');
      const success = await createSessionFromUrl(url);
      
      if (!success) {
        showToast('Magic link expired or invalid', 'error');
        router.replace('/(auth)/login');
      }
      return;
    }

    // Handle email verification callback
    if (path.includes('verify') || path.includes('verification')) {
      console.log('Handling verification deep link');
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
    console.log('Unhandled deep link:', url);
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
