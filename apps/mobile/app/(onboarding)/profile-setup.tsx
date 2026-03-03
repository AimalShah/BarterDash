import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Onboarding from '@blazejkustra/react-native-onboarding';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Gavel,
  Mail,
  Rocket,
  Sparkles,
  Store,
  Upload,
  UserRound,
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { resolveSpaceGroteskFontFamily } from '@/constants/fonts';
import { Text } from '@/components/ui/text';
import { useProfileSetup } from '@/hooks/useProfileSetup';
import { useUpdateProfileMutation } from '@/hooks/useUser';
import { categoriesService } from '@/lib/api/services/categories';
import { useAgeVerification } from '@/lib/api/hooks/useAgeVerification';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

type StepNavigationProps = {
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
};

const FALLBACK_INTERESTS: CategoryOption[] = [
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

const TRANSPARENT_IMAGE = {
  uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
} as const;
const STAGE_BOTTOM_OFFSET = 48;

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function useStageHeight() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return Math.max(height - insets.top - insets.bottom - STAGE_BOTTOM_OFFSET, 40);
}

function UsernameIntroPanel({
  onPressStart,
  username,
  onUsernameChange,
}: {
  onPressStart: () => void;
  username: string;
  onUsernameChange: (value: string) => void;
}) {
  const stageHeight = useStageHeight();

  const normalizedUsername = username.trim();
  const usernameLooksValid = /^[a-zA-Z0-9_]{3,}$/.test(normalizedUsername);

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
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.progressHeader}>
          <View className={styles.progressRow}>
            <Text className={styles.progressTitle} style={fontStyles.progressTitle}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 1 of 4
            </Text>
          </View>
          <View className={styles.progressTrack}>
            <View className={styles.progressFill} style={{ width: '20%' }} />
          </View>
        </View>

        <View className={styles.contentContainer}>
          <View className={styles.iconBadge}>
            <UserRound size={26} color={COLORS.primaryBlue} />
          </View>

          <Text className={styles.title} style={fontStyles.title}>
            Choose your username
          </Text>
          <Text className={styles.subtitle} style={fontStyles.subtitle}>
            This is how you&apos;ll appear to other traders on BarterDash Live.
          </Text>

          <View className={styles.fieldWrap}>
            <Text className={styles.fieldLabel} style={fontStyles.fieldLabel}>
              Username
            </Text>
            <View className={styles.inputShell}>
              <Text className={styles.atSign} style={fontStyles.atSign}>
                @
              </Text>
              <TextInput
                value={username}
                onChangeText={onUsernameChange}
                autoCapitalize="none"
                placeholder="trader_pro123"
                placeholderTextColor={COLORS.lightGrey}
                className={styles.input}
                style={fontStyles.input}
              />
              {usernameLooksValid ? (
                <CheckCircle2 size={18} color={COLORS.successGreen} />
              ) : null}
            </View>
            <Text className={styles.helperText} style={fontStyles.helperText}>
              {usernameLooksValid
                ? 'Username format looks good.'
                : 'Use 3+ chars: letters, numbers, underscores.'}
            </Text>
          </View>

          <Pressable className={styles.primaryButton} onPress={handleContinue}>
            <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
              Continue to Profile Photo
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
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
  const stageHeight = useStageHeight();
  const isLoading = uploading || isUpdating;

  return (
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.topBar}>
          <Pressable className={styles.iconButton} onPress={onBack} disabled={isLoading}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text className={styles.topBarTitle} style={fontStyles.topBarTitle}>
            Profile Setup
          </Text>
          <View className={styles.topBarSpacer} />
        </View>

        <View className={styles.progressShell}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText} style={fontStyles.progressText}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 2 of 4
            </Text>
          </View>
          <View className={styles.progressTrackLarge}>
            <View className={styles.progressFill} style={{ width: '40%' }} />
          </View>
        </View>

        <ScrollView
          className={styles.stepScroll}
          contentContainerClassName={styles.photoContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text className={styles.photoTitle} style={fontStyles.photoTitle}>
            Upload a profile photo
          </Text>
          <Text className={styles.photoSubtitle} style={fontStyles.photoSubtitle}>
            Help others recognize you in the BarterDash community.
          </Text>

          <View className={styles.avatarStack}>
            <View className={styles.avatarOuter}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className={styles.avatarImage} />
              ) : (
                <UserRound size={68} color={COLORS.primaryBlue} />
              )}

              {uploading ? (
                <View className={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                </View>
              ) : null}
            </View>

            <Pressable className={styles.cameraFab} onPress={() => void onPickImage()} disabled={isLoading}>
              <Camera size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className={styles.photoActions}>
            <Pressable
              className={cn(styles.secondaryPrimaryButton, isLoading && styles.disabled)}
              onPress={() => void onPickImage()}
              disabled={isLoading}
            >
              <Upload size={18} color="#FFFFFF" />
              <Text
                className={styles.secondaryPrimaryButtonText}
                style={fontStyles.secondaryPrimaryButtonText}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Text>
            </Pressable>

            <Pressable
              className={styles.ghostButton}
              onPress={() => onContinue(onNext)}
              disabled={isLoading}
            >
              <Text className={styles.ghostButtonText} style={fontStyles.ghostButtonText}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <View className={styles.bottomActionWrap}>
          <Pressable
            className={cn(styles.primaryButtonLarge, isLoading && styles.disabled)}
            onPress={() => onContinue(onNext)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
                  Continue to Step 2
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InterestsStep({
  onNext,
  onBack,
  categories,
  selected,
  loading,
  isUpdating,
  onToggle,
  onFinish,
}: StepNavigationProps & {
  categories: CategoryOption[];
  selected: string[];
  loading: boolean;
  isUpdating: boolean;
  onToggle: (id: string) => void;
  onFinish: (onSuccess: () => void) => void;
}) {
  const stageHeight = useStageHeight();
  const isBusy = loading || isUpdating;

  return (
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.topBar}>
          <Pressable className={styles.iconButton} onPress={onBack} disabled={isBusy}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text className={styles.topBarTitle} style={fontStyles.topBarTitle}>
            Interests
          </Text>
          <View className={styles.topBarSpacer} />
        </View>

        <View className={styles.progressShell}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText} style={fontStyles.progressText}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 3 of 4
            </Text>
          </View>
          <View className={styles.progressTrackLarge}>
            <View className={styles.progressFill} style={{ width: '60%' }} />
          </View>
        </View>

        <ScrollView
          className={styles.stepScroll}
          contentContainerClassName={styles.mainContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={styles.headerBlock}>
            <Text className={styles.title} style={fontStyles.title}>
              What are you into?
            </Text>
            <Text className={styles.subtitle} style={fontStyles.subtitle}>
              Select categories you&apos;re interested in. We&apos;ll tailor your feed.
            </Text>
          </View>

          {loading ? (
            <View className={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            </View>
          ) : (
            <View className={styles.grid}>
              {categories.map((category) => {
                const isSelected = selected.includes(category.id);

                return (
                  <Pressable
                    key={category.id}
                    className={cn(styles.chipCard, isSelected && styles.chipCardSelected)}
                    onPress={() => onToggle(category.id)}
                    disabled={isBusy}
                  >
                    {isSelected ? (
                      <CheckCircle2 size={20} color={COLORS.primaryBlue} />
                    ) : null}
                    <Text
                      className={cn(styles.chipText, isSelected && styles.chipTextSelected)}
                      style={[fontStyles.chipText, isSelected && fontStyles.chipTextSelected]}
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

        </ScrollView>

        <View className={styles.bottomActionWrap}>
          <Pressable
            className={cn(styles.primaryButtonLarge, isBusy && styles.disabled)}
            disabled={isBusy}
            onPress={() => onFinish(onNext)}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
                  Continue to Step 3
                </Text>
                <Rocket size={17} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          {!selected.length ? (
            <Pressable
              className={styles.ghostButton}
              onPress={() => onFinish(onNext)}
              disabled={isBusy}
            >
              <Text className={styles.ghostButtonText} style={fontStyles.ghostButtonText}>
                Skip and continue
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function AgeVerificationStep({
  onNext,
  onBack,
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
  const stageHeight = useStageHeight();

  return (
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.topBar}>
          <Pressable className={styles.iconButton} onPress={onBack} disabled={isBusy}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text className={styles.topBarTitle} style={fontStyles.topBarTitle}>
            Age Verification
          </Text>
          <View className={styles.topBarSpacer} />
        </View>

        <View className={styles.progressShell}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText} style={fontStyles.progressText}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 4 of 4
            </Text>
          </View>
          <View className={styles.progressTrackLarge}>
            <View className={styles.progressFill} style={{ width: '100%' }} />
          </View>
        </View>

        <ScrollView
          className={styles.stepScroll}
          contentContainerClassName={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.iconBadge}>
            <Calendar size={26} color={COLORS.primaryBlue} />
          </View>

          <Text className={styles.title} style={fontStyles.title}>
            Verify your age
          </Text>
          <Text className={styles.subtitle} style={fontStyles.subtitle}>
            Confirm your date of birth to unlock live bidding and secure transactions.
          </Text>

          <View className={styles.fieldWrap}>
            <Text className={styles.fieldLabel} style={fontStyles.fieldLabel}>
              Date of Birth
            </Text>
            <Pressable className={styles.inputShell} onPress={onOpenPicker} disabled={isBusy}>
              <Text className={styles.inputValue} style={fontStyles.inputValue}>
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Calendar size={18} color={COLORS.primaryBlue} />
            </Pressable>

            {showPicker ? (
              <View className={styles.datePickerWrap}>
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

            <View className={styles.ageSummary}>
              <Text className={styles.ageLabel} style={fontStyles.ageLabel}>
                Your age
              </Text>
              <View className={styles.ageValueWrap}>
                {isEligible ? <CheckCircle2 size={16} color={COLORS.successGreen} /> : null}
                <Text
                  className={cn(styles.ageValue, isEligible ? styles.ageValid : styles.ageInvalid)}
                  style={fontStyles.ageValue}
                >
                  {age} years old
                </Text>
              </View>
            </View>

            {!isEligible ? (
              <View className={styles.warningBox}>
                <Text className={styles.warningText} style={fontStyles.warningText}>
                  You must be 18 or older to continue onboarding.
                </Text>
                <Pressable onPress={() => router.push('/help-support')}>
                  <Text className={styles.warningLink} style={fontStyles.warningLink}>
                    Need help? Contact support
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className={styles.bottomActionWrap}>
          <Pressable
            className={cn(styles.primaryButtonLarge, (!isEligible || isBusy) && styles.disabled)}
            disabled={!isEligible || isBusy}
            onPress={() => onContinue(onNext)}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
                  Continue to Step 4
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
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
    <View className={styles.preferenceCard}>
      <View className={styles.preferenceContent}>
        <View className={styles.preferenceIcon}>{icon}</View>
        <View className={styles.preferenceTextBlock}>
          <Text className={styles.preferenceTitle} style={fontStyles.preferenceTitle}>
            {title}
          </Text>
          <Text className={styles.preferenceSubtitle} style={fontStyles.preferenceSubtitle}>
            {subtitle}
          </Text>
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

function NotificationsStep({
  onNext,
  onBack,
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
  const stageHeight = useStageHeight();

  return (
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.topBar}>
          <Pressable className={styles.iconButton} onPress={onBack} disabled={isUpdating}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text className={styles.topBarTitle} style={fontStyles.topBarTitle}>
            Notifications
          </Text>
          <View className={styles.topBarSpacer} />
        </View>

        <View className={styles.progressShell}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText} style={fontStyles.progressText}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 4 of 5
            </Text>
          </View>
          <View className={styles.progressTrackLarge}>
            <View className={styles.progressFill} style={{ width: '80%' }} />
          </View>
        </View>

        <ScrollView
          className={styles.stepScroll}
          contentContainerClassName={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.iconBadge}>
            <Bell size={26} color={COLORS.primaryBlue} />
          </View>

          <Text className={styles.title} style={fontStyles.title}>
            Choose your alerts
          </Text>
          <Text className={styles.subtitle} style={fontStyles.subtitle}>
            Stay updated with the moments that matter in your live shopping journey.
          </Text>

          <View className={styles.preferenceList}>
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

        <View className={styles.bottomActionWrap}>
          <Pressable
            className={cn(styles.primaryButtonLarge, isUpdating && styles.disabled)}
            onPress={() => onComplete(onNext)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
                  Continue to Step 5
                </Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Pressable className={styles.ghostButton} onPress={() => onComplete(onNext)} disabled={isUpdating}>
            <Text className={styles.ghostButtonText} style={fontStyles.ghostButtonText}>
              Skip for now
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SuccessStep({
  onNext,
  onBack,
  isSeller,
}: StepNavigationProps & {
  isSeller: boolean;
}) {
  const stageHeight = useStageHeight();

  const handleStartExploring = () => {
    useAuthStore.getState().setOnboarded(true);
    onNext();
  };

  return (
    <View className={styles.stage} style={{ height: stageHeight }}>
      <View className={styles.card}>
        <View className={styles.topBar}>
          <Pressable className={styles.iconButton} onPress={onBack}>
            <ArrowLeft size={20} color={COLORS.primaryText} />
          </Pressable>
          <Text className={styles.topBarTitle} style={fontStyles.topBarTitle}>
            Setup Complete
          </Text>
          <View className={styles.topBarSpacer} />
        </View>

        <View className={styles.progressShell}>
          <View className={styles.progressRow}>
            <Text className={styles.progressText} style={fontStyles.progressText}>
              Onboarding Progress
            </Text>
            <Text className={styles.progressStep} style={fontStyles.progressStep}>
              Step 5 of 5
            </Text>
          </View>
          <View className={styles.progressTrackLarge}>
            <View className={styles.progressFill} style={{ width: '100%' }} />
          </View>
        </View>

        <ScrollView
          className={styles.stepScroll}
          contentContainerClassName={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.successBadge}>
            <CheckCircle2 size={52} color={COLORS.primaryBlue} />
          </View>

          <View className={styles.sparkleRow}>
            <Sparkles size={16} color={COLORS.primaryBlue} />
            <Text className={styles.sparkleText} style={fontStyles.sparkleText}>
              WELCOME TO BARTERDASH
            </Text>
            <Sparkles size={16} color={COLORS.primaryBlue} />
          </View>

          <Text className={styles.successTitle} style={fontStyles.successTitle}>
            You&apos;re all set!
          </Text>
          <Text className={styles.subtitle} style={fontStyles.subtitle}>
            Your profile is ready. Start exploring live drops, follow sellers, and place your first bid.
          </Text>

          {!isSeller ? (
            <View className={styles.sellerCard}>
              <Text className={styles.sellerTitle} style={fontStyles.sellerTitle}>
                Want to sell on BarterDash?
              </Text>
              <Text className={styles.sellerSubtitle} style={fontStyles.sellerSubtitle}>
                Launch your own live stream storefront when you&apos;re ready.
              </Text>
              <Pressable className={styles.sellerButton} onPress={() => router.push('/seller/onboarding')}>
                <Store size={16} color="#FFFFFF" />
                <Text className={styles.sellerButtonText} style={fontStyles.sellerButtonText}>
                  Become a Seller
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View className={styles.bottomActionWrap}>
          <Pressable className={styles.primaryButtonLarge} onPress={handleStartExploring}>
            <Text className={styles.primaryButtonText} style={fontStyles.primaryButtonText}>
              Start Exploring
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
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
    isUpdating: isSubmittingProfile,
    updateField,
    pickAndUploadImage,
    validateAndSubmit,
  } = useProfileSetup();
  const { profile } = useAuthStore();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [streamAlerts, setStreamAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfileMutation();
  const { mutate: verifyAge, isPending: isVerifyingAge } = useAgeVerification();

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
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
        setLoadingCategories(false);
      }
    };

    void fetchCategories();
  }, []);

  useEffect(() => {
    const profileInterests = profile?.interests;
    if (!profileInterests?.length || !categories.length || selectedInterests.length) {
      return;
    }

    const selectedFromProfile = categories
      .filter((category) => profileInterests.includes(category.name))
      .map((category) => category.id);

    if (selectedFromProfile.length) {
      setSelectedInterests(selectedFromProfile);
    }
  }, [categories, profile?.interests, selectedInterests.length]);

  useEffect(() => {
    const preferences = profile?.notification_preferences;
    if (!preferences) {
      return;
    }

    setStreamAlerts(preferences.streamAlerts ?? true);
    setBidAlerts(preferences.bidAlerts ?? true);
    setEmailAlerts(preferences.emailNotifications ?? true);
  }, [profile?.notification_preferences]);

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const saveInterests = (onSuccess: () => void) => {
    const selectedInterestNames = selectedInterests
      .map((id) => categories.find((category) => category.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    updateProfile(
      {
        interests: selectedInterestNames,
        onboarding_step: 'age_verification',
      },
      {
        onSuccess: () => {
          onSuccess();
          void useAuthStore.getState().fetchProfile(true);
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Please try again.';
          Alert.alert('Unable to save interests', message);
        },
      }
    );
  };

  const age = calculateAge(date);
  const isEligible = age >= 18;

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAgeContinue = (onSuccess: () => void) => {
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
              onSuccess: () => {
                onSuccess();
                void useAuthStore.getState().fetchProfile(true);
              },
              onError: (error: unknown) => {
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Your age was verified, but we could not update onboarding progress.';
                Alert.alert('Update failed', message);
              },
            }
          );
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Failed to verify age. Please try again.';
          Alert.alert('Verification failed', message);
        },
      }
    );
  };

  const handleNotificationsComplete = (onSuccess: () => void) => {
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
        onSuccess: () => {
          onSuccess();
          void useAuthStore.getState().fetchProfile(true);
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'Something went wrong while completing setup.';
          Alert.alert('Could not save notifications', message);
        },
      }
    );
  };

  const isSeller = profile?.is_seller === true || profile?.role === 'SELLER';

  return (
    <SafeAreaView className={styles.safeArea} edges={['left', 'bottom']}>
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
                isLast={false}
                avatarUrl={formData.avatarUrl}
                uploading={uploading}
                isUpdating={isSubmittingProfile}
                onPickImage={pickAndUploadImage}
                onContinue={(onSuccess) => validateAndSubmit(onSuccess)}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
          {
            component: ({ onNext, onBack }: StepNavigationProps) => (
              <InterestsStep
                onNext={onNext}
                onBack={onBack}
                isLast={false}
                categories={categories}
                selected={selectedInterests}
                loading={loadingCategories}
                isUpdating={isUpdatingProfile}
                onToggle={toggleInterest}
                onFinish={saveInterests}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
          {
            component: ({ onNext, onBack }: StepNavigationProps) => (
              <AgeVerificationStep
                onNext={onNext}
                onBack={onBack}
                isLast={false}
                date={date}
                age={age}
                isEligible={isEligible}
                showPicker={showPicker}
                isBusy={isUpdatingProfile || isVerifyingAge}
                onDateChange={handleDateChange}
                onOpenPicker={() => setShowPicker(true)}
                onContinue={handleAgeContinue}
              />
            ),
            image: TRANSPARENT_IMAGE,
            position: 'bottom',
          },
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

const styles = {
  safeArea: 'flex-1 w-full bg-[#F5F7F8]',
  stage: 'w-full items-center justify-center px-3 py-2',
  card: 'flex-1 min-h-0 w-full max-w-[760px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm',
  progressHeader: 'gap-3 border-b border-[#F1F5F9] bg-[#F8FAFC] px-5 pb-[18px] pt-5',
  progressShell: 'gap-2.5 px-5 pb-4 pt-2.5',
  progressRow: 'flex-row items-center justify-between',
  progressTitle: 'uppercase text-[#22232D]',
  progressText: 'text-[#22232D]',
  progressStep: 'text-primary',
  progressTrack: 'h-2 overflow-hidden rounded-full bg-[#E2E8F0]',
  progressTrackLarge: 'h-2.5 overflow-hidden rounded-full bg-[#DCEAFD]',
  progressFill: 'h-full rounded-full bg-primary',
  contentContainer: 'h-full justify-center px-5 py-6',
  iconBadge: 'mb-[18px] h-12 w-12 items-center justify-center rounded-xl bg-[#EAF1FF]',
  title: 'mb-2.5 text-[#22232D]',
  successTitle: 'mb-2.5 text-center text-[#22232D]',
  subtitle: 'mb-[22px] text-center text-[#64748B]',
  fieldWrap: 'mb-[18px]',
  fieldLabel: 'mb-2 text-[#334155]',
  inputShell: 'min-h-[54px] flex-row items-center justify-between gap-2 rounded-[10px] border border-[#CBD5E1] bg-white px-3.5',
  atSign: 'text-[#94A3B8]',
  input: 'flex-1 text-[#22232D]',
  inputValue: 'flex-1 text-[#22232D]',
  helperText: 'mt-2 text-[#0F766E]',
  primaryButton: 'h-14 flex-row items-center justify-center gap-2 rounded-[10px] bg-primary',
  primaryButtonLarge: 'h-14 flex-row items-center justify-center gap-2 rounded-[10px] bg-primary',
  primaryButtonText: 'text-white',
  topBar: 'h-14 flex-row items-center justify-between px-3',
  iconButton: 'h-10 w-10 items-center justify-center rounded-full',
  topBarTitle: 'text-[#22232D]',
  topBarSpacer: 'h-10 w-10',
  stepScroll: 'flex-1 min-h-0',
  photoContent: 'grow items-center px-5 pb-5 pt-2',
  photoTitle: 'text-center text-[#22232D]',
  photoSubtitle: 'mb-6 mt-2.5 text-center text-[#64748B]',
  avatarStack: 'mb-6 h-[210px] w-[210px] items-center justify-center',
  avatarOuter: 'h-48 w-48 items-center justify-center overflow-hidden rounded-full border-[3px] border-dashed border-[#A9C8F8] bg-[#EEF5FF]',
  avatarImage: 'h-full w-full',
  cameraFab: 'absolute bottom-3 right-2 h-[42px] w-[42px] items-center justify-center rounded-full border-[3px] border-white bg-primary',
  uploadingOverlay: 'absolute inset-0 items-center justify-center bg-white/70',
  photoActions: 'mb-4 w-full gap-2.5',
  secondaryPrimaryButton: 'h-[50px] flex-row items-center justify-center gap-2 rounded-xl bg-primary',
  secondaryPrimaryButtonText: 'text-white',
  ghostButton: 'h-11 items-center justify-center rounded-xl',
  ghostButtonText: 'text-primary',
  mainContent: 'grow px-5 pb-5 pt-2',
  headerBlock: 'mb-5 mt-2',
  loadingWrap: 'items-center py-[38px]',
  grid: 'mb-5 flex-row flex-wrap gap-2.5',
  chipCard: 'w-[48%] min-h-[38px] items-center justify-center gap-1.5 rounded-[14px] border-2 border-[#E2E8F0] bg-white px-2 py-3',
  chipCardSelected: 'border-primary bg-[#EFF6FF]',
  chipText: 'text-center text-[#22232D]',
  chipTextSelected: 'text-primary',
  datePickerWrap: 'mt-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-1 py-2',
  ageSummary: 'mt-3.5 min-h-[54px] flex-row items-center justify-between rounded-[10px] border border-[#D7E6FA] bg-[#F8FBFF] px-3.5',
  ageLabel: 'text-[#334155]',
  ageValueWrap: 'flex-row items-center gap-1.5',
  ageValue: '',
  ageValid: 'text-[#22c55e]',
  ageInvalid: 'text-[#B45309]',
  warningBox: 'mt-3 gap-1 rounded-[10px] border border-[#FCD34D] bg-[#FFFBEB] px-3.5 py-3',
  warningText: 'text-[#92400E]',
  warningLink: 'text-primary',
  preferenceList: 'mb-2 gap-2.5',
  preferenceCard: 'min-h-[82px] flex-row items-center flex-1 justify-between gap-2.5 rounded-xl border border-[#D7E6FA] bg-[#F8FBFF] px-3 py-3',
  preferenceContent: 'flex-1 flex-row items-center gap-2.5',
  preferenceIcon: 'h-9 w-9 items-center justify-center rounded-[10px] bg-[#EAF1FF]',
  preferenceTextBlock: 'flex-1 gap-1',
  preferenceTitle: 'text-[#0F172A]',
  preferenceSubtitle: 'text-[#64748B]',
  successContent: 'grow items-center px-5 pb-5 pt-3.5',
  successBadge: 'mb-[18px] h-[122px] w-[122px] items-center justify-center rounded-full border-[3px] border-dashed border-[#A9C8F8] bg-[#EEF5FF]',
  sparkleRow: 'mb-2.5 flex-row items-center gap-1.5',
  sparkleText: 'text-primary',
  sellerCard: 'w-full gap-2 rounded-xl border border-[#D7E6FA] bg-[#F8FBFF] p-3.5',
  sellerTitle: 'text-[#0F172A]',
  sellerSubtitle: 'text-[#64748B]',
  sellerButton: 'mt-1.5 h-11 flex-row items-center justify-center gap-[7px] rounded-[10px] bg-primary',
  sellerButtonText: 'text-white',
  bottomActionWrap: 'gap-2 border-t border-[#EFF4FA] px-5 pb-5 pt-1.5',
  disabled: 'opacity-[0.65]',
} as const;

const fontStyles = StyleSheet.create({
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressStep: {
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  successTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  atSign: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: resolveSpaceGroteskFontFamily('600'),
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  photoTitle: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  photoSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    fontWeight: '700',
  },
  ageLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  ageValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  warningLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sparkleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sellerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sellerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  sellerButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
