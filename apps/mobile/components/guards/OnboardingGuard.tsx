import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Center, Spinner, Text } from '@/components/ui/reusables';
import { COLORS } from '@/constants/colors';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const segments = useSegments();
    const pathname = usePathname();
    const router = useRouter();
    const { profile, loading, isFetchingProfile, initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !isFetchingProfile && initialized) {
            // Minimum loading time to prevent flicker
            const timer = setTimeout(() => setIsLoading(false), 300);
            return () => clearTimeout(timer);
        }
    }, [loading, isFetchingProfile, initialized]);

    useEffect(() => {
        if (isLoading || loading || isFetchingProfile || !profile || !initialized) return;

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
        const inAuth = segments[0] === '(auth)';
        const inDev = segments[0] === 'dev';

        // If already in auth, don't double guard
        if (inAuth || inDev) return;

        // Check onboarding status using only snake_case field
        const isOnboarded = profile.onboarded === true || profile.onboarding_step === 'completed';

        if (!isOnboarded) {
            if (!inOnboarding) {
                // Determine which step to redirect to
                const step = profile.onboarding_step || 'profile';
                
                switch (step) {
                    case 'completed':
                        // Should not reach here due to isOnboarded check, but handle gracefully
                        router.replace('/(tabs)');
                        break;
                    case 'profile':
                    case 'interests':
                    case 'age_verification':
                    case 'notifications':
                    case null:
                    case undefined:
                    default:
                        router.replace('/(onboarding)/profile-setup');
                }
            }
        } else if (inOnboarding && !inOnboardingCompletionScreen) {
            // Already onboarded, don't stay in onboarding outside completion screens
            router.replace('/(tabs)');
        }
    }, [profile, loading, isFetchingProfile, segments, pathname, isLoading, initialized]);

    if (isLoading || loading || !initialized) {
        return (
            <Center flex={1} bg={COLORS.luxuryBlack}>
                <Spinner size="large" color={COLORS.primaryGold} />
                <Text color={COLORS.textSecondary} mt="$4" size="sm">
                    Loading...
                </Text>
            </Center>
        );
    }

    return <>{children}</>;
}
