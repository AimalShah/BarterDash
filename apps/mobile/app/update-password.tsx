import { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export default function UpdatePasswordScreen() {
  const params = useLocalSearchParams<{ access_token?: string }>();
  const { updatePasswordMutation, logoutMutation } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { session } = useAuthStore()

  // useEffect(() => {
  //   console.log('[UPDATE PASSWORD] Params:', params);
  //   console.log('[UPDATE PASSWORD] Session query state:', {
  //     isLoading: sessionQuery.isLoading,
  //     hasSession: !!sessionQuery.data,
  //     hasUser: !!sessionQuery.data?.user,
  //   });
  //
  //   // If we have an access_token from params but no session, try to set it
  //   if (params.access_token && !sessionQuery.data) {
  //     console.log('[UPDATE PASSWORD] Have access_token but no session, setting session...');
  //   }
  // }, [params, sessionQuery.data]);

  const hasSession = Boolean(session);
  const submitting = updatePasswordMutation.isPending;

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirmation must match.');
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({ password });
      await logoutMutation.mutateAsync();

      Alert.alert('Password updated', 'Please sign in with your new password.', [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Please request a new reset link.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="rounded-3xl bg-card p-6">
          <Text variant="h2">Update password</Text>
          <Text color="secondary" className="mt-2">
            Set a new password for your account.
          </Text>

          {/* {validatingLink ? ( */}
          {/*   <View className="mt-6 rounded-2xl bg-primary-soft p-4"> */}
          {/*     <Text color="secondary">Validating your reset link...</Text> */}
          {/*   </View> */}
          {/* ) : null} */}
          {/**/}
          {/* {!validatingLink && !hasSession ? ( */}
          {/*   <View className="mt-6 rounded-2xl bg-primary-soft p-4"> */}
          {/*     <Text color="secondary"> */}
          {/*       This reset session is not active. Request a new password reset email. */}
          {/*     </Text> */}
          {/*   </View> */}
          {/* ) : null} */}

          {hasSession ? (
            <>
              <Input
                className="mt-6"
                label=""
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!submitting}
              />
              <Input
                className="mt-6"
                label=""
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!submitting}
              />

              <Button
                variant="primary"
                size="lg"
                onPress={handleUpdatePassword}
                loading={submitting}
                label="Update Password"
                className="mt-5 rounded-2xl"
              />
            </>
          ) : null}

          <Button
            variant="ghost"
            label={hasSession ? 'Back to Login' : 'Request New Reset Link'}
            onPress={() =>
              router.replace(hasSession ? '/(auth)/login' : '/(auth)/forgot-password')
            }
            className="mt-4 self-center px-0 py-0"
            textClassName="text-primary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
