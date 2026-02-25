import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Onboarding from '@blazejkustra/react-native-onboarding';
import { ArrowLeft, CheckCircle2, Rocket, ArrowRight } from 'lucide-react-native';
import { categoriesService } from '@/lib/api/services/categories';
import { useUpdateProfileMutation } from '@/hooks/useUser';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';

type StepNavigationProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

const TRANSPARENT_IMAGE = {
  uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
} as const;

const FALLBACK_INTERESTS = [
  { id: '1', name: 'Sneakers' },
  { id: '2', name: 'Toys' },
  { id: '3', name: 'TCG Cards' },
  { id: '4', name: 'Comics' },
  { id: '5', name: 'Watches' },
  { id: '6', name: 'Video Games' },
  { id: '7', name: 'Electronics' },
  { id: '8', name: 'Sports' },
  { id: '9', name: 'Tools' },
  { id: '10', name: 'Fashion' },
];

function InterestsAutoStartIntro({
  onPressStart,
}: {
  onPressStart: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onPressStart, 0);
    return () => clearTimeout(timer);
  }, [onPressStart]);

  return <View style={styles.introSpacer} />;
}

function InterestsStep({
  onNext,
  categories,
  selected,
  loading,
  isUpdating,
  onToggle,
  onFinish,
}: StepNavigationProps & {
  categories: Array<{ id: string; name: string }>;
  selected: string[];
  loading: boolean;
  isUpdating: boolean;
  onToggle: (id: string) => void;
  onFinish: (onSuccess: () => void) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 660);

  const isBusy = loading || isUpdating;

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.topNav}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/(onboarding)/profile-setup')}
          >
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text style={styles.topTitle}>Onboarding</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Step 2 of 5</Text>
            <Text style={styles.progressPercent}>40% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>What are you into?</Text>
            <Text style={styles.subtitle}>
              Select categories you&apos;re interested in. We&apos;ll tailor your feed.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((category) => {
                const isSelected = selected.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.chipCard,
                      isSelected ? styles.chipCardSelected : undefined,
                    ]}
                    onPress={() => onToggle(category.id)}
                  >
                    {isSelected ? (
                      <CheckCircle2 size={20} color={COLORS.primaryBlue} />
                    ) : null}
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : undefined,
                      ]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={styles.otherLabel}>Other tags you might like:</Text>
          <View style={styles.tagWrap}>
            {['Retro Art', 'Vinyl Records', 'Camera Gear', 'Board Games', 'Designer Bags'].map(
              (tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              )
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomAction}>
          <Pressable
            style={[styles.finishButton, isBusy ? styles.disabled : undefined]}
            disabled={isBusy}
            onPress={() => onFinish(onNext)}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.finishButtonText}>Continue to Step 3</Text>
                <Rocket size={17} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          {!selected.length ? (
            <Pressable
              style={styles.skipAction}
              onPress={() => onFinish(onNext)}
              disabled={isBusy}
            >
              <Text style={styles.skipText}>Skip and continue</Text>
              <ArrowRight size={14} color={COLORS.primaryBlue} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await categoriesService.findAll();
        if (Array.isArray(data) && data.length) {
          setCategories(data.map((item) => ({ id: String(item.id), name: item.name })));
        } else {
          setCategories(FALLBACK_INTERESTS);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(FALLBACK_INTERESTS);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategories();
  }, []);

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

  const toggleInterest = (categoryId: string) => {
    setSelected((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const saveInterests = (onSuccess: () => void) => {
    const selectedInterests = selected
      .map((id) => categories.find((category) => category.id === id)?.name)
      .filter(Boolean) as string[];

    updateProfile(
      {
        interests: selectedInterests,
        onboarding_step: 'age_verification',
      },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchProfile(true);
          onSuccess();
        },
        onError: (error: any) => {
          Alert.alert('Unable to save interests', error?.message || 'Please try again.');
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Onboarding
        showCloseButton={false}
        showBackButton={false}
        wrapInModalOnWeb={false}
        colors={onboardingColors}
        introPanel={({ onPressStart }) => (
          <InterestsAutoStartIntro onPressStart={onPressStart} />
        )}
        steps={[
          {
            component: ({ onNext, onBack, isLast }: StepNavigationProps) => (
              <InterestsStep
                onNext={onNext}
                onBack={onBack}
                isLast={isLast}
                categories={categories}
                selected={selected}
                loading={loading}
                isUpdating={isUpdating}
                onToggle={toggleInterest}
                onFinish={saveInterests}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
        ]}
        onComplete={() => router.push('/(onboarding)/age-verification')}
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
  topNav: {
    height: 54,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  topSpacer: {
    width: 38,
    height: 38,
  },
  progressWrap: {
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: COLORS.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  progressPercent: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DCEAFD',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryBlue,
  },
  mainContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    lineHeight: 23,
  },
  loadingWrap: {
    paddingVertical: 38,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chipCard: {
    width: '48%',
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 6,
  },
  chipCardSelected: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextSelected: {
    color: COLORS.primaryBlue,
    fontWeight: '700',
  },
  otherLabel: {
    marginTop: 4,
    marginBottom: 10,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomAction: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  finishButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skipAction: {
    marginTop: 12,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  skipText: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});
