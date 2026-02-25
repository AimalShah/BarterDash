import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Onboarding from '@blazejkustra/react-native-onboarding';
import { ArrowRight, CheckCircle2, Sparkles, Store } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/store/authStore';

type StepNavigationProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

const TRANSPARENT_IMAGE = {
  uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
} as const;

function AutoStartIntro({ onPressStart }: { onPressStart: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onPressStart, 0);
    return () => clearTimeout(timer);
  }, [onPressStart]);

  return <View style={styles.introSpacer} />;
}

function SuccessStep({
  onNext,
  isSeller,
}: StepNavigationProps & {
  isSeller: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 660);

  const handleStartExploring = () => {
    useAuthStore.getState().setOnboarded(true);
    onNext();
  };

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Setup Complete</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.progressShell}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Onboarding Progress</Text>
            <Text style={styles.progressStep}>Step 5 of 5</Text>
          </View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successBadge}>
            <CheckCircle2 size={52} color={COLORS.primaryBlue} />
          </View>

          <View style={styles.sparkleRow}>
            <Sparkles size={16} color={COLORS.primaryBlue} />
            <Text style={styles.sparkleText}>WELCOME TO BARTERDASH</Text>
            <Sparkles size={16} color={COLORS.primaryBlue} />
          </View>

          <Text style={styles.title}>You&apos;re all set!</Text>
          <Text style={styles.subtitle}>
            Your profile is ready. Start exploring live drops, follow sellers, and place your first bid.
          </Text>

          {!isSeller ? (
            <View style={styles.sellerCard}>
              <Text style={styles.sellerTitle}>Want to sell on BarterDash?</Text>
              <Text style={styles.sellerSubtitle}>
                Launch your own live stream storefront when you&apos;re ready.
              </Text>
              <Pressable style={styles.sellerButton} onPress={() => router.push('/seller/onboarding')}>
                <Store size={16} color="#FFFFFF" />
                <Text style={styles.sellerButtonText}>Become a Seller</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomActionWrap}>
          <Pressable style={styles.primaryButtonLarge} onPress={handleStartExploring}>
            <Text style={styles.primaryButtonText}>Start Exploring</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function SuccessScreen() {
  const { profile } = useAuthStore();
  const isSeller = profile?.is_seller === true || profile?.role === 'SELLER';

  const onboardingColors = useMemo(
    () => ({
      background: {
        primary: COLORS.mainBackground,
        secondary: COLORS.cardWhite,
        label: '#EAF1FF',
        accent: '#EAF1FF',
      },
      text: {
        primary: COLORS.primaryText,
        secondary: COLORS.lightGrey,
        contrast: '#FFFFFF',
      },
    }),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Onboarding
        showCloseButton={false}
        showBackButton={false}
        wrapInModalOnWeb={false}
        colors={onboardingColors}
        introPanel={({ onPressStart }) => <AutoStartIntro onPressStart={onPressStart} />}
        steps={[
          {
            component: ({ onNext, onBack, isLast }: StepNavigationProps) => (
              <SuccessStep onNext={onNext} onBack={onBack} isLast={isLast} isSeller={isSeller} />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
        ]}
        onComplete={() => router.replace('/(tabs)')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  introSpacer: {
    minHeight: 1,
  },
  stage: {
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: COLORS.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 40,
    height: 40,
  },
  progressShell: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  progressStep: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrackLarge: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#DCEAFD',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryBlue,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: 'center',
  },
  successBadge: {
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#A9C8F8',
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sparkleText: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  sellerCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E6FA',
    backgroundColor: '#F8FBFF',
    padding: 14,
    gap: 8,
  },
  sellerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  sellerSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  sellerButton: {
    marginTop: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  sellerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomActionWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EFF4FA',
  },
  primaryButtonLarge: {
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primaryBlue,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
