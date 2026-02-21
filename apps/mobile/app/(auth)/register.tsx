import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Check, Lock, Mail, MoveRight, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants/colors';

export default function RegisterScreen() {
  const { registerMutation } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const loading = registerMutation.isPending;

  async function handleRegister() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirmation must match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Terms required', 'You must accept terms to continue.');
      return;
    }

    try {
      const data = await registerMutation.mutateAsync({
        email: normalizedEmail,
        password,
        username: normalizedName,
      });

      if (data.session) {
        router.replace('/(onboarding)/profile-setup');
        return;
      }

      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: normalizedEmail },
      });
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Could not create account.');
    }
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <View style={styles.toggleRow}>
              <Pressable style={styles.toggleBtn} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.toggleText}>Login</Text>
              </Pressable>
              <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, styles.toggleTextActive]}>Sign Up</Text>
              </View>
            </View>

            <Field
              label="Full Name"
              icon={<User size={16} color={COLORS.lightGrey} />}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Rivers"
              editable={!loading}
            />
            <Field
              label="Email Address"
              icon={<Mail size={16} color={COLORS.lightGrey} />}
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <Field
              label="Password"
              icon={<Lock size={16} color={COLORS.lightGrey} />}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            <Field
              label="Confirm Password"
              icon={<Lock size={16} color={COLORS.lightGrey} />}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((value) => !value)}>
              <View style={[styles.checkbox, acceptedTerms ? styles.checkboxActive : undefined]}>
                {acceptedTerms ? <Check size={12} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.termsText}>I agree to the Terms and Privacy Policy.</Text>
            </Pressable>

            <Pressable style={[styles.submitBtn, loading ? styles.btnDisabled : undefined]} onPress={handleRegister} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
              <MoveRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  ...props
}: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.lightGrey}
          style={styles.input}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  authCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  toggleRow: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
    padding: 4,
    flexDirection: 'row',
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: COLORS.primaryBlue,
  },
  fieldWrap: {
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputShell: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  termsRow: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    height: 18,
    width: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  termsText: {
    flex: 1,
    color: COLORS.lightGrey,
    fontSize: 12,
    lineHeight: 16,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: COLORS.lightGrey,
    fontSize: 13,
  },
  footerLink: {
    color: COLORS.primaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
});
