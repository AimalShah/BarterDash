import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Onboarding from '@blazejkustra/react-native-onboarding';
import { ArrowLeft, ArrowRight, Bell, Clock, Gavel, Mail } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfileMutation } from '@/hooks/useUser';
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

function AutoStartIntro({ onPressStart }: { onPressStart: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onPressStart, 0);
    return () => clearTimeout(timer);
  }, [onPressStart]);

  return <View style={styles.introSpacer} />;
}

function NotificationToggleCard({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.preferenceCard}>
      <View style={styles.preferenceContent}>
        <View style={styles.preferenceIcon}>{icon}</View>
        <View style={styles.preferenceTextBlock}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#A9C8F8' }}
        thumbColor={value ? COLORS.primaryBlue : '#94A3B8'}
        disabled={disabled}
      />
    </View>
  );
}

function NotificationStep({
  onNext,
  streamAlerts,
  bidAlerts,
  emailAlerts,
  isUpdating,
  onToggleStreamAlerts,
  onToggleBidAlerts,
  onToggleEmailAlerts,
  onComplete,
}: StepNavigationProps & {
  streamAlerts: boolean;
  bidAlerts: boolean;
  emailAlerts: boolean;
  isUpdating: boolean;
  onToggleStreamAlerts: (value: boolean) => void;
  onToggleBidAlerts: (value: boolean) => void;
  onToggleEmailAlerts: (value: boolean) => void;
  onComplete: (onSuccess: () => void) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 690);

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.replace('/(onboarding)/age-verification')}
            disabled={isUpdating}
          >
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text style={styles.topBarTitle}>Notifications</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.progressShell}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Onboarding Progress</Text>
            <Text style={styles.progressStep}>Step 4 of 5</Text>
          </View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
          <View style={styles.iconBadge}>
            <Bell size={26} color={COLORS.primaryBlue} />
          </View>

          <Text style={styles.title}>Choose your alerts</Text>
          <Text style={styles.subtitle}>
            Stay updated with the moments that matter in your live shopping journey.
          </Text>

          <View style={styles.preferenceList}>
            <NotificationToggleCard
              icon={<Clock size={18} color={COLORS.primaryBlue} />}
              title="Stream Starts"
              subtitle="Get alerted when your favorite sellers go live."
              value={streamAlerts}
              onValueChange={onToggleStreamAlerts}
              disabled={isUpdating}
            />

            <NotificationToggleCard
              icon={<Gavel size={18} color={COLORS.primaryBlue} />}
              title="Outbid Alerts"
              subtitle="Instant notifications when someone outbids you."
              value={bidAlerts}
              onValueChange={onToggleBidAlerts}
              disabled={isUpdating}
            />

            <NotificationToggleCard
              icon={<Mail size={18} color={COLORS.primaryBlue} />}
              title="Email Updates"
              subtitle="Receive order and account updates by email."
              value={emailAlerts}
              onValueChange={onToggleEmailAlerts}
              disabled={isUpdating}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomActionWrap}>
          <Pressable
            style={[styles.primaryButtonLarge, isUpdating ? styles.disabled : undefined]}
            onPress={() => onComplete(onNext)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Continue to Done</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Pressable style={styles.ghostButton} onPress={() => onComplete(onNext)} disabled={isUpdating}>
            <Text style={styles.ghostButtonText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const [streamAlerts, setStreamAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();

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

  const handleComplete = (onSuccess: () => void) => {
    updateProfile(
      {
        onboarded: true,
        onboarding_step: 'completed',
        notification_preferences: {
          streamAlerts,
          bidAlerts,
          emailNotifications: emailAlerts,
        },
      },
      {
        onSuccess: async () => {
          onSuccess();
          await useAuthStore.getState().fetchProfile(true);
        },
        onError: (error: any) => {
          if (error?.response?.status === 429) {
            Alert.alert('Too many requests', 'Please wait a moment before trying again.');
            return;
          }

          Alert.alert(
            'Could not save notifications',
            error?.message || 'Something went wrong while completing setup.'
          );
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
              <NotificationStep
                onNext={onNext}
                onBack={onBack}
                isLast={isLast}
                streamAlerts={streamAlerts}
                bidAlerts={bidAlerts}
                emailAlerts={emailAlerts}
                isUpdating={isUpdating}
                onToggleStreamAlerts={setStreamAlerts}
                onToggleBidAlerts={setBidAlerts}
                onToggleEmailAlerts={setEmailAlerts}
                onComplete={handleComplete}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
        ]}
        onComplete={() => router.push('/(onboarding)/success')}
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
  preferenceList: {
    gap: 10,
    marginBottom: 8,
  },
  preferenceCard: {
    minHeight: 82,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E6FA',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceTextBlock: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomActionWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EFF4FA',
    gap: 8,
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
  ghostButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});
