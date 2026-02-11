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
