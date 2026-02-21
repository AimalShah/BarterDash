import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';

export default function VerifyEmailScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resendVerificationMutation, verificationStatusMutation } = useAuth();
  const { fetchProfile } = useAuthStore();
  const [email] = useState(emailParam || '');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || countdown > 0 || resendVerificationMutation.isPending) return;

    try {
      await resendVerificationMutation.mutateAsync({ email });
      setCountdown(60);
      Alert.alert('Email sent', 'A new verification email was sent to your inbox.');
    } catch (error: any) {
      Alert.alert('Unable to resend', error?.message || 'Please try again.');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const isVerified = await verificationStatusMutation.mutateAsync();
      if (!isVerified) {
        Alert.alert(
          'Not verified yet',
          'Please open the verification link from your email and try again.'
        );
        return;
      }

      await fetchProfile(true);
      router.replace('/(onboarding)/profile-setup');
    } catch (error: any) {
      Alert.alert('Verification check failed', error?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 justify-center">
        <View className="rounded-3xl bg-card p-6">
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
            <Mail size={24} color={COLORS.primaryBlue} />
          </View>

          <Text variant="h2">Verify your email</Text>
          <Text color="secondary" className="mt-2">
            We sent a verification link to {email || 'your email'}.
          </Text>

          <Input
            className="mt-6"
            label="Verification code (optional)"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="numeric"
            maxLength={6}
          />

          <View className="mt-3 flex-row items-start rounded-2xl bg-primary-soft p-3">
            <ShieldCheck size={16} color={COLORS.secondaryDark} />
            <Text color="secondary" className="ml-2 flex-1 text-sm">
              If code entry is unavailable, use the email link then tap the verify button.
            </Text>
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleVerifyEmail}
            loading={verificationStatusMutation.isPending}
            label="I've Verified My Email"
            className="mt-5 rounded-2xl"
          />

          <Button
            variant="outline"
            size="lg"
            onPress={handleResendEmail}
            disabled={countdown > 0 || resendVerificationMutation.isPending}
            loading={resendVerificationMutation.isPending}
            label={countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            className="mt-3 rounded-2xl"
          />

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
