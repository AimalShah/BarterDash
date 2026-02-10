import React, { useState, useEffect } from "react";
import {
  View,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
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
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam || "");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
        "A new verification email has been sent to your inbox."
      );

      // Reset countdown
      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      console.error("Resend error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to resend verification email. Please try again."
      );
    } finally {
      setIsResending(false);
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
                <CheckCircle2 size={20} color={COLORS.successGreen} style={{ marginTop: 2 }} />
                <Text color={COLORS.textSecondary} size="sm" flex={1}>
                  Check your spam/junk folder if you don't see it
                </Text>
              </HStack>
              <HStack space="sm" alignItems="flex-start">
                <CheckCircle2 size={20} color={COLORS.successGreen} style={{ marginTop: 2 }} />
                <Text color={COLORS.textSecondary} size="sm" flex={1}>
                  The link expires in 24 hours
                </Text>
              </HStack>
              <HStack space="sm" alignItems="flex-start">
                <CheckCircle2 size={20} color={COLORS.successGreen} style={{ marginTop: 2 }} />
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
          <Button
            size="xl"
            variant="solid"
            onPress={handleResendEmail}
            bg={canResend ? COLORS.primaryGold : COLORS.luxuryBlackLighter}
            rounded="$full"
            h={56}
            isDisabled={!canResend || isResending}
            sx={{
              ":active": { opacity: 0.9 },
            }}
          >
            {isResending ? (
              <ActivityIndicator color={canResend ? COLORS.luxuryBlack : COLORS.textPrimary} size="small" />
            ) : (
              <>
                <RefreshCw size={20} color={canResend ? COLORS.luxuryBlack : COLORS.textMuted} style={{ marginRight: 8 }} />
                <ButtonText
                  fontWeight="$bold"
                  color={canResend ? COLORS.luxuryBlack : COLORS.textMuted}
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
            <ArrowLeft size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <Text color={COLORS.textSecondary} fontWeight="$bold" size="sm">
              Back to Login
            </Text>
          </Pressable>
        </VStack>
      </Box>
    </View>
  );
}
