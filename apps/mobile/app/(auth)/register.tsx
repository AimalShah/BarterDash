import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const { registerMutation } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const loading = registerMutation.isPending;

  const handleRegister = async () => {
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
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-3xl bg-card p-6">
            <Text variant="h2">Create account</Text>
            <Text color="secondary" className="mt-2">
              Set up your buyer profile to start shopping live.
            </Text>

            <Input
              className="mt-6"
              label="Full name"
              placeholder="Jane Doe"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
            <Input
              className="mt-4"
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <Input
              className="mt-4"
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
            <Input
              className="mt-4"
              label="Confirm password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Pressable
              onPress={() => setAcceptedTerms((value) => !value)}
              className="mt-4 flex-row items-center"
            >
              <View
                className={`mr-3 h-5 w-5 items-center justify-center rounded border ${
                  acceptedTerms ? 'border-primary bg-primary' : 'border-border bg-white'
                }`}
              >
                {acceptedTerms ? <Check size={13} color={COLORS.cardWhite} /> : null}
              </View>
              <Text color="secondary" className="flex-1 text-sm">
                I agree to the Terms and Privacy Policy.
              </Text>
            </Pressable>

            <Button
              variant="primary"
              size="lg"
              onPress={handleRegister}
              loading={loading}
              label="Create Account"
              className="mt-5 rounded-2xl"
            />
          </View>

          <View className="mt-6 flex-row items-center justify-center">
            <Text color="secondary">Already have an account? </Text>
            <Button
              variant="ghost"
              label="Sign In"
              onPress={() => router.push('/(auth)/login')}
              className="px-0 py-0"
              textClassName="text-primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
