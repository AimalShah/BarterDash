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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Mail, MoveRight, Repeat2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants/colors';

export default function LoginScreen() {
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loading = loginMutation.isPending;

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Missing fields', 'Enter both email and password.');
      return;
    }

    try {
      await loginMutation.mutateAsync({ email: normalizedEmail, password });
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Invalid credentials.');
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
          <View style={styles.headerArt}>
            <View style={styles.logoBadge}>
              <Repeat2 size={26} color={COLORS.primaryBlue} />
            </View>
            <Text style={styles.title}>BarterDash Live</Text>
            <Text style={styles.subtitle}>Trade smarter. Live better.</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.toggleRow}>
              <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, styles.toggleTextActive]}>Login</Text>
              </View>
              <Pressable style={styles.toggleBtn} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.toggleText}>Sign Up</Text>
              </Pressable>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputShell}>
                <Mail size={17} color={COLORS.lightGrey} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  placeholderTextColor={COLORS.lightGrey}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <View style={styles.passwordHead}>
                <Text style={styles.fieldLabel}>Password</Text>
                <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgot}>Forgot?</Text>
                </Pressable>
              </View>

              <View style={styles.inputShell}>
                <Lock size={17} color={COLORS.lightGrey} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.lightGrey}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable style={[styles.loginBtn, loading ? styles.btnDisabled : undefined]} onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              <MoveRight size={16} color="#FFFFFF" />
            </Pressable>

            <View style={styles.legalWrap}>
              <Text style={styles.legalText}>
                By continuing, you agree to BarterDash's Terms and Privacy Policy.
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Create one</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  headerArt: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    height: 58,
    width: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#C7DAFB',
  },
  title: {
    marginTop: 12,
    color: COLORS.primaryText,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.lightGrey,
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 16,
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
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forgot: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  inputShell: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 4,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primaryBlue,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  legalWrap: {
    marginTop: 14,
  },
  legalText: {
    color: COLORS.lightGrey,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
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
