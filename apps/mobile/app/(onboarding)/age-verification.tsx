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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';
import { useAgeVerification } from '@/lib/api/hooks/useAgeVerification';
import { useUpdateProfileMutation } from '@/hooks/useUser';
import { useAuthStore } from '@/store/authStore';

type StepNavigationProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

const TRANSPARENT_IMAGE = {
  uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
} as const;

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function AutoStartIntro({ onPressStart }: { onPressStart: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onPressStart, 0);
    return () => clearTimeout(timer);
  }, [onPressStart]);

  return <View style={styles.introSpacer} />;
}

function AgeVerificationStep({
  onNext,
  date,
  age,
  isEligible,
  showPicker,
  isBusy,
  onDateChange,
  onOpenPicker,
  onContinue,
}: StepNavigationProps & {
  date: Date;
  age: number;
  isEligible: boolean;
  showPicker: boolean;
  isBusy: boolean;
  onDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onOpenPicker: () => void;
  onContinue: (onSuccess: () => void) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 670);

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.replace('/(onboarding)/interests')}
            disabled={isBusy}
          >
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text style={styles.topBarTitle}>Age Verification</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.progressShell}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Onboarding Progress</Text>
            <Text style={styles.progressStep}>Step 3 of 5</Text>
          </View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          <View style={styles.iconBadge}>
            <Calendar size={26} color={COLORS.primaryBlue} />
          </View>

          <Text style={styles.title}>Verify your age</Text>
          <Text style={styles.subtitle}>
            Confirm your date of birth to unlock live bidding and secure transactions.
          </Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <Pressable style={styles.inputShell} onPress={onOpenPicker} disabled={isBusy}>
              <Text style={styles.inputValue}>
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Calendar size={18} color={COLORS.primaryBlue} />
            </Pressable>

            {showPicker ? (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  locale="en-US"
                />
              </View>
            ) : null}

            <View style={styles.ageSummary}>
              <Text style={styles.ageLabel}>Your age</Text>
              <View style={styles.ageValueWrap}>
                {isEligible ? <CheckCircle2 size={16} color={COLORS.successGreen} /> : null}
                <Text style={[styles.ageValue, isEligible ? styles.ageValid : styles.ageInvalid]}>
                  {age} years old
                </Text>
              </View>
            </View>

            {!isEligible ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  You must be 18 or older to continue onboarding.
                </Text>
                <Pressable onPress={() => router.push('/help-support')}>
                  <Text style={styles.warningLink}>Need help? Contact support</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomActionWrap}>
          <Pressable
            style={[
              styles.primaryButtonLarge,
              (!isEligible || isBusy) ? styles.disabled : undefined,
            ]}
            disabled={!isEligible || isBusy}
            onPress={() => onContinue(onNext)}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Continue to Step 4</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function AgeVerificationScreen() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const { mutate: verifyAge, isPending: isVerifying } = useAgeVerification();
  const { mutate: updateProfile, isPending: isUpdatingStep } = useUpdateProfileMutation();

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

  const age = calculateAge(date);
  const isEligible = age >= 18;
  const isBusy = isVerifying || isUpdatingStep;

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleContinue = (onSuccess: () => void) => {
    if (!isEligible) {
      Alert.alert(
        'Age Requirement',
        'You must be 18 or older to use BarterDash.',
        [
          { text: 'Contact Support', onPress: () => router.push('/help-support') },
          { text: 'Okay', style: 'cancel' },
        ]
      );
      return;
    }

    verifyAge(
      { dateOfBirth: date.toISOString() },
      {
        onSuccess: () => {
          updateProfile(
            { onboarding_step: 'notifications' },
            {
              onSuccess: async () => {
                await useAuthStore.getState().fetchProfile(true);
                onSuccess();
              },
              onError: (error: any) => {
                Alert.alert(
                  'Update failed',
                  error?.message || 'Your age was verified, but we could not update onboarding progress.'
                );
              },
            }
          );
        },
        onError: (error: any) => {
          Alert.alert('Verification failed', error?.message || 'Failed to verify age. Please try again.');
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
        introPanel={({ onPressStart }) => <AutoStartIntro onPressStart={onPressStart} />}
        steps={[
          {
            component: ({ onNext, onBack, isLast }: StepNavigationProps) => (
              <AgeVerificationStep
                onNext={onNext}
                onBack={onBack}
                isLast={isLast}
                date={date}
                age={age}
                isEligible={isEligible}
                showPicker={showPicker}
                isBusy={isBusy}
                onDateChange={handleDateChange}
                onOpenPicker={() => setShowPicker(true)}
                onContinue={handleContinue}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
        ]}
        onComplete={() => router.push('/(onboarding)/notifications')}
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: 8,
    paddingBottom: 20,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF1FF',
    marginBottom: 18,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    gap: 8,
  },
  inputValue: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerWrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  ageSummary: {
    marginTop: 14,
    minHeight: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7E6FA',
    backgroundColor: '#F8FBFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  ageLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  ageValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ageValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  ageValid: {
    color: COLORS.successGreen,
  },
  ageInvalid: {
    color: '#B45309',
  },
  warningBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  warningLink: {
    color: COLORS.primaryBlue,
    fontSize: 13,
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
  disabled: {
    opacity: 0.65,
  },
});
