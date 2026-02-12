# Onboarding Implementation Plan

Based on your requirements:
1. **Age verification**: Just before onboarding completion
2. **Phone collection**: As a later setting (not in initial onboarding)
3. **Seller onboarding**: Require main onboarding completion first
4. **Email verification**: Block onboarding until email is verified

---

## Changes Required

### Phase 1: Backend Updates

#### 1.1 Update Schema - Add Age Verification Fields Support
**File**: `apps/backend/src/db/schema.ts`
- Add age verification columns (already exist, need to use them)

#### 1.2 Update Auth Service - Email Verification Check
**File**: `apps/backend/src/services/auth.service.ts`
- Add email verification check in `getProfile()`
- Return error if email not verified

#### 1.3 Update Users Service - Age Verification
**File**: `apps/backend/src/services/users.service.ts`
- Add `verifyAge()` method
- Add `updateDateOfBirth()` method

#### 1.4 Update Users Routes
**File**: `apps/backend/src/routes/users.routes.ts`
- Add `PUT /users/age-verification` endpoint

#### 1.5 Update Zod Schema
**File**: `apps/backend/src/schemas/users.schemas.ts`
- Add age verification validation

---

### Phase 2: Mobile Updates

#### 2.1 Create Age Verification Screen
**File**: `apps/mobile/app/(onboarding)/age-verification.tsx`
- Date of birth picker
- Age validation (must be 18+)
- Guardian consent for under 18

#### 2.2 Update Notifications Screen
**File**: `apps/mobile/app/(onboarding)/notifications.tsx`
- Add email notifications toggle
- Send complete `notificationPreferences`

#### 2.3 Update Success Screen - Seller CTA
**File**: `apps/mobile/app/(onboarding)/success.tsx`
- Add "Become a Seller" button
- Check `onboarded === true` before showing

#### 2.4 Update Auth Store - Email Verification Check
**File**: `apps/mobile/store/authStore.ts`
- Add `isEmailVerified()` helper
- Block onboarding if email not verified

#### 2.5 Update Profile Setup - Email Check
**File**: `apps/mobile/app/(onboarding)/profile-setup.tsx`
- Check email verification status on mount
- Redirect to email verification if needed

#### 2.6 Update Seller Onboarding - Completion Check
**File**: `apps/mobile/app/seller/onboarding/index.tsx`
- Add `isOnboarded()` check before showing form
- Redirect to main onboarding if not complete

#### 2.7 Create Age Verification Hook
**File**: `apps/mobile/lib/api/hooks/useAgeVerification.ts`

#### 2.8 Add API Endpoint for Age Verification
**File**: `apps/mobile/lib/api/services/users.ts`
- Add `verifyAge()` method

---

## Implementation

### Step 1: Update Backend Auth Service - Email Verification Check

```typescript
// apps/backend/src/services/auth.service.ts

async getProfile(userId: string): Promise<AppResult<Profile | null>> {
  const result = await this.repository.getProfile(userId);

  if (result.isErr()) {
    return failure(result.error);
  }

  if (!result.value) {
    // ... existing auto-create profile logic
  }

  // NEW: Check email verification
  const profile = result.value;
  if (!profile.emailVerified) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user?.email_confirmed_at) {
        // Update profile to mark email as verified
        await this.repository.update(userId, { emailVerified: true });
        profile.emailVerified = true;
      }
    } catch (e) {
      // ignore
    }
  }

  return success(profile);
}
```

### Step 2: Update Backend Users Service - Age Verification

```typescript
// apps/backend/src/services/users.service.ts

/**
 * Verify user age
 */
async verifyAge(
  id: string,
  dateOfBirth: string,
): Promise<AppResult<Profile>> {
  const dob = new Date(dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (age < 18) {
    return failure(new ValidationError('Users must be 18 or older to complete onboarding'));
  }

  return await this.repository.update(id, {
    dateOfBirth: dob,
    ageVerified: true,
    guardianConsent: false,
  });
}

/**
 * Update date of birth
 */
async updateDateOfBirth(
  id: string,
  dateOfBirth: string,
): Promise<AppResult<Profile>> {
  const dob = new Date(dateOfBirth);
  
  return await this.repository.update(id, {
    dateOfBirth: dob,
  });
}
```

### Step 3: Add Backend Routes for Age Verification

```typescript
// apps/backend/src/routes/users.routes.ts

const ageVerificationSchema = z.object({
  body: z.object({
    dateOfBirth: z.string().datetime(),
    guardianConsent: z.boolean().optional(),
  }),
});

/**
 * PUT /users/age-verification
 * Verify user age (18+ required)
 * Protected - requires JWT
 */
router.put(
  '/age-verification',
  authenticate,
  validate(ageVerificationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { dateOfBirth, guardianConsent } = req.body;

    // Check if already verified
    const existingProfile = await usersService.getProfile(userId);
    if (existingProfile.isOk() && existingProfile.value?.ageVerified) {
      return res.status(200).json({
        success: true,
        data: existingProfile.value,
        message: 'Age already verified',
      });
    }

    const result = await usersService.verifyAge(userId, dateOfBirth);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Age verified successfully',
    });
  }),
);
```

### Step 4: Update Mobile Auth Store

```typescript
// apps/mobile/store/authStore.ts

// Add helper method
isEmailVerified: () => {
  const state = get();
  return !!state.profile?.email_verified;
},

// Add age verification helper
isAgeVerified: () => {
  const state = get();
  return !!state.profile?.age_verified;
},

canCompleteOnboarding: () => {
  const state = get();
  return !!(
    state.profile?.email_verified === true &&
    state.profile?.age_verified === true
  );
},
```

### Step 5: Create Age Verification Screen

```tsx
// apps/mobile/app/(onboarding)/age-verification.tsx

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Calendar } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useAgeVerification } from '@/lib/api/hooks/useAgeVerification';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

const STEPS = ["Profile", "Interests", "Age", "Notifications", "Done"];

export default function AgeVerificationScreen() {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  const { mutate: verifyAge, isPending: isVerifying } = useAgeVerification();

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleContinue = () => {
    const age = calculateAge(date);
    
    if (age < 18) {
      Alert.alert(
        'Age Requirement',
        'You must be 18 or older to use BarterDash. Please contact support if you believe this is an error.',
        [
          { text: 'Contact Support', onPress: () => router.replace('/support') },
          { text: 'Go Back', onPress: () => setShowPicker(true) },
        ]
      );
      return;
    }

    verifyAge(
      { dateOfBirth: date.toISOString() },
      {
        onSuccess: () => {
          router.push('/(onboarding)/notifications');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to verify age');
        },
      }
    );
  };

  const age = calculateAge(date);
  const isValidAge = age >= 18;

  return (
    <View style={styles.container}>
      <OnboardingProgress steps={STEPS} currentStepIndex={2} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Calendar size={32} color={COLORS.luxuryBlack} />
          </View>
          <Text style={styles.title}>Verify Your Age</Text>
          <Text style={styles.subtitle}>
            We need to confirm you're 18 or older to use BarterDash.
          </Text>
        </View>

        <View style={styles.datePickerContainer}>
          <Text style={styles.label}>Date of Birth</Text>
          
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Calendar size={20} color={COLORS.primaryGold} />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              locale="en-US"
            />
          )}

          <View style={styles.ageDisplay}>
            <Text style={styles.ageLabel}>Your Age</Text>
            <Text style={[
              styles.ageValue,
              isValidAge ? styles.ageValid : styles.ageInvalid
            ]}>
              {age} years old
            </Text>
          </View>

          {!isValidAge && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                You must be 18 or older to complete onboarding. 
                Parental consent is not accepted.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!isValidAge || isVerifying) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValidAge || isVerifying}
        >
          <LinearGradient
            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isVerifying ? (
              <ActivityIndicator color={COLORS.luxuryBlack} />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <ChevronRight size={20} color={COLORS.luxuryBlack} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 16,
  },
  ageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ageValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  ageValid: {
    color: COLORS.successGreen,
  },
  ageInvalid: {
    color: COLORS.errorRed,
  },
  warningBox: {
    backgroundColor: `${COLORS.warningAmber}20`,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.warningAmber,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.darkBorder,
    backgroundColor: COLORS.luxuryBlack,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.luxuryBlack,
  },
});
```

### Step 6: Update Notifications Screen

```tsx
// apps/mobile/app/(onboarding)/notifications.tsx

// Update the state and handleComplete function:

const [streamAlerts, setStreamAlerts] = useState(true);
const [bidAlerts, setBidAlerts] = useState(true);
const [emailAlerts, setEmailAlerts] = useState(true);  // ADD THIS

const handleComplete = () => {
  updateProfile(
    {
      onboarded: true,
      onboarding_step: 'completed',
      notification_preferences: {  // UPDATE THIS
        streamAlerts,
        bidAlerts,
        emailNotifications: emailAlerts,  // ADD THIS
      },
    },
    // ... rest of handler
  );
};

// Add email toggle in the UI:
<Box
  bg={COLORS.luxuryBlackLight}
  p="$5"
  rounded={24}
  borderWidth={1}
  borderColor={COLORS.darkBorder}
  flexDirection="row"
  alignItems="center"
  justifyContent="space-between"
>
  <HStack space="md" alignItems="center" flex={1}>
    <Center h={48} w={48} rounded={16} bg={COLORS.luxuryBlackLighter}>
      <Mail size={24} color={COLORS.primaryGold} />
    </Center>
    <VStack flex={1}>
      <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
        Email Notifications
      </Text>
      <Text color={COLORS.textMuted} size="sm" mt="$0.5">
        Receive updates about your activity.
      </Text>
    </VStack>
  </HStack>
  <Switch
    value={emailAlerts}
    onValueChange={setEmailAlerts}
    trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }}
    thumbColor={COLORS.textPrimary}
    disabled={isUpdating}
  />
</Box>
```

### Step 7: Update Success Screen with Seller CTA

```tsx
// apps/mobile/app/(onboarding)/success.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, Shop, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const isOnboarded = profile?.onboarded === true;

  const handleGoToHome = () => {
    router.replace('/(tabs)');
  };

  const handleBecomeSeller = () => {
    router.push('/seller/onboarding');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <Check size={48} color={COLORS.luxuryBlack} />
        </View>
        
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile is ready. Start exploring live auctions and unique finds.
        </Text>

        {/* Seller CTA - Only show if not already a seller */}
        {!profile?.is_seller && (
          <View style={styles.sellerBox}>
            <View style={styles.sellerIcon}>
              <Sparkles size={24} color={COLORS.primaryGold} />
            </View>
            <View style={styles.sellerText}>
              <Text style={styles.sellerTitle}>Ready to Sell?</Text>
              <Text style={styles.sellerSubtitle}>
                Turn your passion into profit. Join our seller community.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sellerButton}
              onPress={handleBecomeSeller}
            >
              <LinearGradient
                colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                style={styles.sellerGradient}
              >
                <Shop size={18} color={COLORS.luxuryBlack} />
                <Text style={styles.sellerButtonText}>Become a Seller</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoToHome}>
          <LinearGradient
            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
            style={styles.gradient}
          >
            <Text style={styles.homeButtonText}>Start Exploring</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  sellerBox: {
    width: '100%',
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 24,
    padding: 20,
    marginTop: 40,
  },
  sellerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.luxuryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sellerText: {
    marginBottom: 16,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sellerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sellerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sellerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sellerButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.luxuryBlack,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  homeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.luxuryBlack,
  },
});
```

### Step 8: Create Age Verification Hook

```typescript
// apps/mobile/lib/api/hooks/useAgeVerification.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users';
import { USER_QUERY_KEY } from './useUser';

interface AgeVerificationPayload {
  dateOfBirth: string;
  guardianConsent?: boolean;
}

export function useAgeVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AgeVerificationPayload) => {
      const response = await usersService.verifyAge(data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}
```

### Step 9: Add API Method to Users Service

```typescript
// apps/mobile/lib/api/services/users.ts

export const usersService = {
  // ... existing methods

  verifyAge: async (data: { dateOfBirth: string }): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(
      '/users/age-verification',
      data,
    );
    return response.data.data;
  },
};
```

### Step 10: Update Seller Onboarding - Completion Check

```tsx
// apps/mobile/app/seller/onboarding/index.tsx

import React, { useEffect, useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function SellerOnboardingScreen() {
  const [loading, setLoading] = useState(true);
  const { profile, isOnboarded } = useAuthStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if user has completed main onboarding
    if (!isOnboarded()) {
      Alert.alert(
        'Complete Setup First',
        'Please finish setting up your profile before becoming a seller.',
        [
          { 
            text: 'Continue Setup', 
            onPress: () => router.replace('/(onboarding)/profile-setup') 
          },
          { 
            text: 'Go Home', 
            onPress: () => router.replace('/(tabs)'),
            style: 'cancel' 
          },
        ]
      );
    }
    setLoading(false);
  }, [profile, isOnboarded]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // ... rest of component
}
```

### Step 11: Update Onboarding Layout - Add Age Screen

```tsx
// apps/mobile/app/(onboarding)/_layout.tsx

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="age-verification" />  // ADD THIS
      <Stack.Screen name="notifications" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
```

---

## File Summary

| File | Action |
|------|--------|
| `apps/backend/src/services/auth.service.ts` | Add email verification check |
| `apps/backend/src/services/users.service.ts` | Add age verification methods |
| `apps/backend/src/routes/users.routes.ts` | Add age verification endpoint |
| `apps/mobile/store/authStore.ts` | Add verification helpers |
| `apps/mobile/lib/api/hooks/useAgeVerification.ts` | Create new hook |
| `apps/mobile/lib/api/services/users.ts` | Add verifyAge method |
| `apps/mobile/app/(onboarding)/age-verification.tsx` | Create new screen |
| `apps/mobile/app/(onboarding)/notifications.tsx` | Add email toggle |
| `apps/mobile/app/(onboarding)/success.tsx` | Add seller CTA |
| `apps/mobile/app/(onboarding)/_layout.tsx` | Add age screen to stack |
| `apps/mobile/app/seller/onboarding/index.tsx` | Add completion check |

---

## Dependencies

```bash
# Install date picker
npm install @react-native-community/datetimepicker
# or
yarn add @react-native-community/datetimepicker
```

---

## Testing Checklist

- [ ] Email verification blocks onboarding completion
- [ ] Age verification screen shows for new users
- [ ] Under 18 users cannot complete onboarding
- [ ] Date of birth is saved to profile
- [ ] Email notifications toggle works
- [ ] Success screen shows seller CTA for non-sellers
- [ ] Seller onboarding redirects incomplete users
- [ ] Notifications complete onboarding flow correctly
