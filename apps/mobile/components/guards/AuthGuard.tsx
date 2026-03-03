import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Center, Spinner, VStack, Heading, Text, Button, ButtonText, Box } from '@/components/ui/reusables';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '@/constants/colors';

function getOnboardingRoute(step?: string | null): string {
    switch (step) {
        case 'completed':
            return '/(tabs)';
        case 'interests':
        case 'age_verification':
        case 'notifications':
        case 'profile':
        case null:
        case undefined:
        default:
            return '/(onboarding)/profile-setup';
    }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const segments = useSegments();
    const pathname = usePathname();
    const router = useRouter();
    const { session, setSession, fetchProfile, profile, initialized, loading, isFetchingProfile } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkSession = useCallback(async () => {
        try {
            setError(null);
            const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            setSession(initialSession);

            if (initialSession) {
                await fetchProfile();
            }
        } catch (err: any) {
            console.error('AuthGuard: Session check failed', err);
            setError(err.message || 'Failed to initialize authentication');
        } finally {
            // Minimum loading time to prevent flicker
            setTimeout(() => setIsLoading(false), 300);
        }
    }, [setSession, fetchProfile]);

    useEffect(() => {
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('AuthGuard: Auth state changed', event);
            setSession(currentSession);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await fetchProfile();
            } else if (event === 'SIGNED_OUT') {
                // Clear local state if needed (authStore.signOut already does this)
            }
        });

        return () => subscription.unsubscribe();
    }, [checkSession, setSession, fetchProfile]);

    useEffect(() => {
        if (isLoading || !initialized) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inDevGroup = segments[0] === 'dev';
        const onboardingRoutes = [
            'profile-setup',
            'interests',
            'age-verification',
            'notifications',
            'success',
        ];
        const inOnboardingPath = onboardingRoutes.some((route) => pathname.includes(route));
        const inOnboarding =
            segments[0] === '(onboarding)' ||
            onboardingRoutes.some((route) => segments.includes(route)) ||
            inOnboardingPath;
        const inOnboardingCompletionScreen =
            inOnboarding &&
            (
                segments.includes('success') ||
                segments.includes('profile-setup') ||
                pathname.includes('success') ||
                pathname.includes('profile-setup')
            );
        const isUpdatePasswordRoute = segments[0] === 'update-password';
        const isAuthenticated = !!session;

        console.log('[AUTH GUARD] State:', {
            segments,
            inAuthGroup,
            inDevGroup,
            inOnboarding,
            inOnboardingCompletionScreen,
            isUpdatePasswordRoute,
            isAuthenticated,
            hasProfile: !!profile,
        });

        if (!isAuthenticated) {
            if (!inAuthGroup && !inDevGroup && !isUpdatePasswordRoute) {
                // Not authenticated and not in auth group, redirect to landing
                console.log('[AUTH GUARD] Redirecting to landing (not authenticated)');
                router.replace('/(auth)/landing');
            } else {
                console.log('[AUTH GUARD] Allowing access (not authenticated but allowed route)');
            }
        } else {
            if (!profile) {
                if (!isFetchingProfile) {
                    fetchProfile(true);
                }
                return;
            }

            const onboarded =
                profile.onboarded === true || profile.onboarding_step === 'completed';
            const onboardingRoute = getOnboardingRoute(profile.onboarding_step);


            if (!onboarded && !inOnboarding && !inAuthGroup && !isUpdatePasswordRoute) {
                console.log('[AUTH GUARD] Redirecting to onboarding (not onboarded)');
                router.replace(onboardingRoute as any);
            } else if (
                onboarded &&
                (inAuthGroup || (inOnboarding && !inOnboardingCompletionScreen)) &&
                !isUpdatePasswordRoute
            ) {
                // Logged in and onboarded, but in auth/onboarding group
                console.log('[AUTH GUARD] Redirecting to tabs (onboarded)');
                router.replace('/(tabs)');
            } else if (isAuthenticated && inAuthGroup && !onboarded && !isUpdatePasswordRoute) {
                // Logged in but not onboarded, and in auth group
                console.log('[AUTH GUARD] Redirecting to onboarding (in auth group)');
                router.replace(onboardingRoute as any);
            } else if (isUpdatePasswordRoute) {
                console.log('[AUTH GUARD] Allowing update-password route');
            }
        }
    }, [session, profile, segments, pathname, isLoading, initialized, isFetchingProfile, fetchProfile]);

    if (isLoading || loading || !initialized) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.textPrimary} />
            </Center>
        );
    }

    if (error) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack} p="$4">
                <VStack space="md" alignItems="center">
                    <Heading color={COLORS.textPrimary}>Authentication Error</Heading>
                    <Text color={COLORS.textSecondary} textAlign="center">{error}</Text>
                    <Button onPress={checkSession} variant="outline" borderColor={COLORS.textPrimary}>
                        <ButtonText color={COLORS.textPrimary} textAlign="center">Retry</ButtonText>
                    </Button>
                </VStack>
            </Center>
        );
    }

    // Allow children to render if in auth group (unauthenticated) 
    // or if authenticated
    const inAuthGroup = segments[0] === '(auth)';
    const inDevGroup = segments[0] === 'dev';
    const isUpdatePasswordRoute = segments[0] === 'update-password';
    const isAuthenticated = !!session;

    if (!isAuthenticated && !inAuthGroup && !inDevGroup && !isUpdatePasswordRoute) {
        return null; // Redirecting
    }

    return <>{children}</>;
}
