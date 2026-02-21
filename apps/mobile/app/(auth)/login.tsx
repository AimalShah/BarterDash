import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loading = loginMutation.isPending;

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Missing fields', 'Enter both email and password.');
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: normalizedEmail,
        password,
      });
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Invalid credentials.');
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
            <Text variant="h2">Welcome back</Text>
            <Text color="secondary" className="mt-2">
              Sign in to continue bidding and buying.
            </Text>

            <Input
              className="mt-6"
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <Button
              variant="ghost"
              label="Forgot password?"
              onPress={() => router.push('/(auth)/forgot-password')}
              className="mt-2 self-end px-0 py-0"
              textClassName="text-sm text-primary"
            />

            <Button
              variant="primary"
              size="lg"
              onPress={handleLogin}
              loading={loading}
              label="Sign In"
              className="mt-4 rounded-2xl"
            />
          </View>

          <View className="mt-6 flex-row items-center justify-center">
            <Text color="secondary">Don&apos;t have an account? </Text>
            <Button
              variant="ghost"
              label="Register"
              onPress={() => router.push('/(auth)/register')}
              className="px-0 py-0"
              textClassName="text-primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
