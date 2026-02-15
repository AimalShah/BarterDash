import React, { useState, useEffect } from "react";
import { View, StatusBar, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  ButtonText,
  Center,
  Pressable,
} from "@gluestack-ui/themed";
import {
  Mail,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  LogIn,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam || "");
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendEmail = async () => {
    if (!email || !canResend) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your inbox.",
      );

      // Reset countdown
      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      console.error("Resend error:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to resend verification email. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = async () => {
    setIsChecking(true);
    try {
      // First, refresh the session to get the latest auth state from Supabase
      // This ensures email_confirmed_at is updated if user just clicked the link
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Session refresh error:", refreshError);
        // Continue anyway - session might still be valid
      }

      // Now check if email is verified with refreshed session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user?.email_confirmed_at) {
        // Email is verified, fetch profile and redirect
        await fetchProfile();

        Alert.alert(
          "Email Verified!",
          "Your email has been verified successfully. Let's set up your profile.",
          [
            {
              text: "Continue",
              onPress: () => {
                router.replace("/(onboarding)/profile-setup");
              },
            },
          ],
        );
      } else {
        // Email not verified yet
        Alert.alert(
          "Email Not Verified",
          "Please check your email and click the verification link first. Make sure to check your spam folder.",
        );
      }
    } catch (error: any) {
      console.error("Check verification error:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to check verification status. Please try signing in.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar barStyle="light-content" />
      <Box safeAreaTop />

      <Box flex={1} px="$8" justifyContent="center">
        <VStack space="xl" alignItems="center">
          {/* Icon */}
          <Center
            h={100}
            w={100}
            rounded={28}
            bg={COLORS.luxuryBlackLight}
            borderWidth={1}
            borderColor={COLORS.darkBorder}
            mb="$4"
          >
            <Mail size={48} color={COLORS.primaryGold} />
          </Center>

          {/* Title */}
          <Heading
            size="3xl"
            color={COLORS.textPrimary}
            fontWeight="$black"
            textAlign="center"
          >
            Verify Your Email
          </Heading>

          {/* Description */}
          <Text
            color={COLORS.textSecondary}
            size="md"
            textAlign="center"
            lineHeight="$xl"
            px="$4"
          >
            We've sent a verification link to{" "}
            <Text color={COLORS.textPrimary} fontWeight="$bold">
              {email || "your email"}
            </Text>
            . Please check your inbox and click the link to verify your account.
          </Text>

          {/* Instructions */}
          <Box
            bg={COLORS.luxuryBlackLight}
            borderWidth={1}
            borderColor={COLORS.darkBorder}
            rounded={20}
            p="$5"
            w="$full"
            mt="$4"
          >
            <VStack space="md">
              <HStack space="sm" alignItems="flex-start">
                <CheckCircle2
                  size={20}
                  color={COLORS.successGreen}
                  style={{ marginTop: 2 }}
                />
                <Text color={COLORS.textSecondary} size="sm" flex={1}>
                  Check your spam/junk folder if you don't see it
                </Text>
              </HStack>
              <HStack space="sm" alignItems="flex-start">
                <CheckCircle2
                  size={20}
                  color={COLORS.successGreen}
                  style={{ marginTop: 2 }}
                />
                <Text color={COLORS.textSecondary} size="sm" flex={1}>
                  The link expires in 24 hours
                </Text>
              </HStack>
              <HStack space="sm" alignItems="flex-start">
                <CheckCircle2
                  size={20}
                  color={COLORS.successGreen}
                  style={{ marginTop: 2 }}
                />
                <Text color={COLORS.textSecondary} size="sm" flex={1}>
                  You can close this screen after verification
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Bottom Actions */}
      <Box
        px="$8"
        pb={Math.max(insets.bottom, 24)}
        pt="$6"
        borderTopWidth={1}
        borderColor={COLORS.darkBorder}
        bg={COLORS.luxuryBlack}
      >
        <VStack space="md">
          {/* Continue Button - Check if email is verified */}
          <Button
            size="xl"
            variant="solid"
            onPress={handleContinue}
            bg={COLORS.successGreen}
            rounded="$full"
            h={56}
            px="$6"
            alignItems="center"
            justifyContent="center"
            isDisabled={isChecking}
            sx={{
              ":active": { opacity: 0.9 },
            }}
          >
            {isChecking ? (
              <ActivityIndicator color={COLORS.luxuryBlack} size="small" />
            ) : (
              <>
                {/* <LogIn size={20} color={COLORS.luxuryBlack} style={{ marginRight: 8 }} /> */}
                <ButtonText
                  fontWeight="$bold"
                  color={COLORS.luxuryBlack}
                  textAlign="center"
                  justifyContent="center"
                  alignItems="center"
                >
                  I've Verified My Email
                </ButtonText>
              </>
            )}
          </Button>

          <Button
            size="xl"
            variant="outline"
            onPress={handleResendEmail}
            borderColor={canResend ? COLORS.primaryGold : COLORS.darkBorder}
            rounded="$full"
            h={56}
            px="$6"
            isDisabled={!canResend || isResending}
            sx={{
              ":active": { opacity: 0.9 },
            }}
          >
            {isResending ? (
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
            ) : (
              <>
                {/*
                <RefreshCw
                  size={20}
                  color={canResend ? COLORS.primaryGold : COLORS.textMuted}
                  style={{ marginRight: 8 }}
                /> */}
                <ButtonText
                  fontWeight="$bold"
                  color={canResend ? COLORS.primaryGold : COLORS.textMuted}
                  textAlign="center"
                >
                  {canResend
                    ? "Resend Verification Email"
                    : `Resend in ${countdown}s`}
                </ButtonText>
              </>
            )}
          </Button>

          <Pressable
            onPress={handleBackToLogin}
            h={48}
            justifyContent="center"
            alignItems="center"
            flexDirection="row"
            sx={{
              ":active": { opacity: 0.7 },
            }}
          >
            <ArrowLeft
              size={18}
              color={COLORS.textSecondary}
              style={{ marginRight: 8 }}
            />
            <Text color={COLORS.textSecondary} fontWeight="$bold" size="sm">
              Back to Login
            </Text>
          </Pressable>
        </VStack>
      </Box>
    </View>
  );
}
