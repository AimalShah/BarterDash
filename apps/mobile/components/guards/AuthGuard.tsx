import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Center, Spinner, VStack, Heading, Text, Button, ButtonText, Box } from '@gluestack-ui/themed';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '@/constants/colors';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const segments = useSegments();
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
        const isAuthenticated = !!session;

        if (!isAuthenticated) {
            if (!inAuthGroup && !inDevGroup) {
                // Not authenticated and not in auth group, redirect to landing
                router.replace('/(auth)/landing');
            }
        } else {
            // Check onboarding using only snake_case field
            const onboarded = profile?.onboarded === true || profile?.onboarding_step === 'completed';
            const inOnboarding = segments[0] === '(onboarding)';

            if (!onboarded && !inOnboarding && !inAuthGroup) {
                router.replace('/(onboarding)/profile-setup');
            } else if (onboarded && (inAuthGroup || inOnboarding)) {
                // Logged in and onboarded, but in auth/onboarding group
                router.replace('/(tabs)');
            } else if (isAuthenticated && inAuthGroup && !onboarded) {
                // Logged in but not onboarded, and in auth group
                router.replace('/(onboarding)/profile-setup');
            }
        }
    }, [session, profile, segments, isLoading, initialized]);

    if (isLoading || loading || isFetchingProfile || !initialized) {
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
                        <ButtonText color={COLORS.textPrimary}>Retry</ButtonText>
                    </Button>
                </VStack>
            </Center>
        );
    }

    // Allow children to render if in auth group (unauthenticated) 
    // or if authenticated
    const inAuthGroup = segments[0] === '(auth)';
    const inDevGroup = segments[0] === 'dev';
    const isAuthenticated = !!session;

    if (!isAuthenticated && !inAuthGroup && !inDevGroup) {
        return null; // Redirecting
    }

    return <>{children}</>;
}
