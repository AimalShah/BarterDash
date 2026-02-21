import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchPrimaryButton } from '@/components/design';

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="••••••••"
        placeholderTextColor={COLORS.lightGrey}
        secureTextEntry
        style={styles.fieldInput}
      />
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { showSuccess, showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please complete all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      showSuccess('Password updated successfully');
      router.replace('/settings');
    } catch (error: any) {
      showError(error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <StitchPage contentStyle={{ paddingBottom: 80 }}>
      <StitchHeader title="Change Password" onBack={() => router.back()} />

      <View style={styles.contentPad}>
        <View style={styles.topIconWrap}>
          <View style={styles.topIcon}>
            <Lock size={26} color={COLORS.primaryBlue} />
          </View>
          <Text style={styles.title}>Secure your account</Text>
          <Text style={styles.subtitle}>Set a strong password with at least 6 characters.</Text>
        </View>

        <View style={styles.formCard}>
          <Field label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} />
          <Field label="New Password" value={newPassword} onChangeText={setNewPassword} />
          <Field label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} />

          <View style={styles.submitWrap}>
            <StitchPrimaryButton label={loading ? 'Updating...' : 'Update Password'} onPress={handleSubmit} disabled={loading} />
          </View>
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  topIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  topIcon: {
    height: 62,
    width: 62,
    borderRadius: 31,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.lightGrey,
    fontSize: 13,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: COLORS.lightGrey,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  fieldInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 12,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  submitWrap: {
    marginTop: 8,
  },
});
