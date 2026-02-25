import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const { requestPasswordResetMutation } = useAuth();
  const [email, setEmail] = useState('');
  const loading = requestPasswordResetMutation.isPending;
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Missing email', 'Enter your account email first.');
      return;
    }

    try {
      await requestPasswordResetMutation.mutateAsync({
        email: normalizedEmail,
        redirectTo: "barterdash://auth/confirm",
      });

      setSent(true);
    } catch (error: any) {
      Alert.alert('Request failed', error?.message || 'Could not send reset link.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="rounded-3xl bg-card p-6">
          <Text variant="h2">Reset password</Text>
          <Text color="secondary" className="mt-2">
            Enter your account email to receive a secure reset link.
          </Text>

          {sent ? (
            <View className="mt-6 rounded-2xl bg-primary-soft p-4">
              <Text color="secondary">
                Reset link sent. Check your inbox and open the link on this device.
              </Text>
            </View>
          ) : (
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
          )}

          {!sent ? (
            <Button
              variant="primary"
              size="lg"
              onPress={handleReset}
              loading={loading}
              label="Send Reset Link"
              className="mt-5 rounded-2xl"
            />
          ) : null}

          <Button
            variant="ghost"
            label="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            className="mt-4 self-center px-0 py-0"
            textClassName="text-primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
