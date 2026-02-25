import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Onboarding from '@blazejkustra/react-native-onboarding';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Upload,
  UserRound,
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';
import { useProfileSetup } from '@/hooks/useProfileSetup';

type StepNavigationProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

const TRANSPARENT_IMAGE = {
  uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
} as const;

function UsernameIntroPanel({
  onPressStart,
  username,
  onUsernameChange,
}: {
  onPressStart: () => void;
  username: string;
  onUsernameChange: (value: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const normalizedUsername = username.trim();
  const usernameLooksValid = /^[a-zA-Z0-9_]{3,}$/.test(normalizedUsername);

  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 140);

  const handleContinue = () => {
    if (!normalizedUsername) {
      Alert.alert('Username required', 'Please choose a username to continue.');
      return;
    }

    if (!usernameLooksValid) {
      Alert.alert(
        'Invalid username',
        'Use at least 3 characters and only letters, numbers, or underscores.'
      );
      return;
    }

    onPressStart();
  };

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.progressHeader}>
          <View style={styles.progressRow}>
            <Text style={styles.progressTitle}>Onboarding Progress</Text>
            <Text style={styles.progressStep}>1 of 3</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.iconBadge}>
            <UserRound size={26} color={COLORS.primaryBlue} />
          </View>

          <Text style={styles.title}>Choose your username</Text>
          <Text style={styles.subtitle}>
            This is how you&apos;ll appear to other traders on BarterDash Live.
          </Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputShell}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                value={username}
                onChangeText={onUsernameChange}
                autoCapitalize="none"
                placeholder="trader_pro123"
                placeholderTextColor={COLORS.lightGrey}
                style={styles.input}
              />
              {usernameLooksValid ? (
                <CheckCircle2 size={18} color={COLORS.successGreen} />
              ) : null}
            </View>
            <Text style={styles.helperText}>
              {usernameLooksValid
                ? 'Username format looks good.'
                : 'Use 3+ chars: letters, numbers, underscores.'}
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>Continue to Step 2</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.footerAccent} />
      </View>
    </View>
  );
}

function ProfilePhotoStep({
  onNext,
  onBack,
  avatarUrl,
  uploading,
  isUpdating,
  onPickImage,
  onContinue,
}: StepNavigationProps & {
  avatarUrl: string;
  uploading: boolean;
  isUpdating: boolean;
  onPickImage: () => Promise<void>;
  onContinue: (onSuccess: () => void) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(height - insets.top - insets.bottom - 48, 640);
  const isLoading = uploading || isUpdating;

  return (
    <View style={[styles.stage, { minHeight: stageHeight }]}>
      <View style={styles.card}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text style={styles.topBarTitle}>Profile Setup</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.progressShell}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Onboarding Progress</Text>
            <Text style={styles.progressStep}>Step 2 of 3</Text>
          </View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.photoContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.photoTitle}>Upload a profile photo</Text>
          <Text style={styles.photoSubtitle}>
            Help others recognize you in the BarterDash community.
          </Text>

          <View style={styles.avatarStack}>
            <View style={styles.avatarOuter}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <UserRound size={68} color={COLORS.primaryBlue} />
              )}

              {uploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                </View>
              ) : null}
            </View>

            <Pressable style={styles.cameraFab} onPress={() => void onPickImage()}>
              <Camera size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.photoActions}>
            <Pressable
              style={[styles.secondaryPrimaryButton, isLoading ? styles.disabled : undefined]}
              onPress={() => void onPickImage()}
              disabled={isLoading}
            >
              <Upload size={18} color="#FFFFFF" />
              <Text style={styles.secondaryPrimaryButtonText}>
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.ghostButton}
              onPress={() => onContinue(onNext)}
              disabled={isLoading}
            >
              <Text style={styles.ghostButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.bottomActionWrap}>
          <Pressable
            style={[styles.primaryButtonLarge, isLoading ? styles.disabled : undefined]}
            onPress={() => onContinue(onNext)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ProfileSetupScreen() {
  const {
    formData,
    uploading,
    isUpdating,
    updateField,
    pickAndUploadImage,
    validateAndSubmit,
  } = useProfileSetup();

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
        introPanel={({ onPressStart }) => (
          <UsernameIntroPanel
            onPressStart={onPressStart}
            username={formData.username}
            onUsernameChange={(value) => updateField('username', value)}
          />
        )}
        steps={[
          {
            component: ({ onNext, onBack }: StepNavigationProps) => (
              <ProfilePhotoStep
                onNext={onNext}
                onBack={onBack}
                isLast
                avatarUrl={formData.avatarUrl}
                uploading={uploading}
                isUpdating={isUpdating}
                onPickImage={pickAndUploadImage}
                onContinue={(onSuccess) => validateAndSubmit(onSuccess)}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
        ]}
        onComplete={() => router.push('/(onboarding)/interests')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F8',
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
  progressHeader: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
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
  progressTitle: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
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
    marginBottom: 18,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputShell: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  atSign: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primaryBlue,
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
  footerAccent: {
    height: 4,
    width: '100%',
    backgroundColor: COLORS.primaryBlue,
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
  photoContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  photoTitle: {
    color: COLORS.primaryText,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  photoSubtitle: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarStack: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarOuter: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#A9C8F8',
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraFab: {
    position: 'absolute',
    right: 8,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  photoActions: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  secondaryPrimaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: COLORS.primaryBlue,
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
  disabled: {
    opacity: 0.65,
  },
});
