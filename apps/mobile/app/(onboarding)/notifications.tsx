import React, { useState } from "react";
import { StatusBar, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  ButtonText,
  Center,
  Switch,
  Pressable
} from "@gluestack-ui/themed";
import {
  Bell,
  Clock,
  Gavel,
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfileMutation } from "@/lib/api/hooks/useUser";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = ["Profile", "Interests", "Done"];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [streamAlerts, setStreamAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const { mutate: updateProfile, isPending: isUpdating } =
    useUpdateProfileMutation();

  const handleComplete = () => {
    updateProfile(
      {
        onboarded: true,
        onboarding_step: "completed",
        notification_preferences: {
          streamAlerts,
          bidAlerts,
          emailNotifications: true,
        },
      },
      {
        onSuccess: async () => {
          // Force fresh profile fetch to ensure onboarding status is updated
          await useAuthStore.getState().fetchProfile(true);
          // Small delay to ensure state is propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          // Navigate to success screen for celebration moment
          router.push("/(onboarding)/success");
        },
        onError: (error: any) => {
          console.error("Profile setup error:", error);
          if (error.response?.status === 429) {
            Alert.alert(
              "Too Many Requests",
              "Please wait a moment before trying again.",
            );
          } else {
            Alert.alert(
              "Error",
              error.message || "Something went wrong completing your setup.",
            );
          }
        },
      },
    );
  };

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <StatusBar barStyle="light-content" />
      <Box safeAreaTop />

      <OnboardingProgress steps={STEPS} currentStepIndex={2} />

      <Box flex={1} px="$8" justifyContent="space-between" pt="$8" pb={Math.max(insets.bottom, 16)}>
        <Box mt="$6">
          <Center mb="$10">
            <Center
              h={80}
              w={80}
              rounded={24}
              bg={COLORS.luxuryBlackLight}
              mb="$6"
              borderWidth={1}
              borderColor={COLORS.darkBorder}
            >
              <Bell size={40} color={COLORS.primaryGold} />
            </Center>
            <Heading size="3xl" color={COLORS.textPrimary} textAlign="center" mb="$3" fontWeight="$black">
              Stay in the Loop
            </Heading>
            <Text color={COLORS.textSecondary} textAlign="center" size="md" lineHeight="$xl" px="$4">
              Get notified about live drops, outbids, and your favorite sellers.
            </Text>
          </Center>

          <VStack space="md">
            <Box
              bg={COLORS.luxuryBlackLight}
              p="$5"
              rounded={24}
              borderWidth={1}
              borderColor={COLORS.darkBorder}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                shadowColor: COLORS.luxuryBlack,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 5,
                elevation: 2
              }}
            >
              <HStack space="md" alignItems="center" flex={1}>
                <Center h={48} w={48} rounded={16} bg={COLORS.luxuryBlackLighter}>
                  <Clock size={24} color={COLORS.primaryGold} />
                </Center>
                <VStack flex={1}>
                  <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
                    Stream Starts
                  </Text>
                  <Text color={COLORS.textMuted} size="sm" mt="$0.5">
                    When your favorite sellers go live.
                  </Text>
                </VStack>
              </HStack>
              <Switch
                value={streamAlerts}
                onValueChange={setStreamAlerts}
                trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }}
                thumbColor={COLORS.textPrimary}
                disabled={isUpdating}
              />
            </Box>

            <Box
              bg={COLORS.luxuryBlackLight}
              p="$5"
              rounded={24}
              borderWidth={1}
              borderColor={COLORS.darkBorder}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                shadowColor: COLORS.luxuryBlack,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 5,
                elevation: 2
              }}
            >
              <HStack space="md" alignItems="center" flex={1}>
                <Center h={48} w={48} rounded={16} bg={COLORS.luxuryBlackLighter}>
                  <Gavel size={24} color={COLORS.primaryGold} />
                </Center>
                <VStack flex={1}>
                  <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
                    Outbid Alerts
                  </Text>
                  <Text color={COLORS.textMuted} size="sm" mt="$0.5">
                    Instant alerts when someone outbids you.
                  </Text>
                </VStack>
              </HStack>
              <Switch
                value={bidAlerts}
                onValueChange={setBidAlerts}
                trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }}
                thumbColor={COLORS.textPrimary}
                disabled={isUpdating}
              />
            </Box>
          </VStack>
        </Box>

        <Box>
          <Button
            size="xl"
            variant="solid"
            onPress={handleComplete}
            bg={COLORS.primaryGold}
            rounded={500}
            h={56}
            isDisabled={isUpdating}
            justifyContent="center"
            alignItems="center"
            sx={{
              ":active": { opacity: 0.9, transform: [{ scale: 0.98 }] }
            }}
          >
            {isUpdating ? (
              <ActivityIndicator color={COLORS.luxuryBlack} size="small" />
            ) : (
              <>
                <ButtonText 
                  fontWeight="$bold" 
                  color={COLORS.luxuryBlack}
                  textAlign="center"
                  flex={1}
                >
                  Complete Setup
                </ButtonText>
                <Box position="absolute" right={16}>
                  <ChevronRight size={20} color={COLORS.luxuryBlack} />
                </Box>
              </>
            )}
          </Button>
          <Pressable
            onPress={handleComplete}
            disabled={isUpdating}
            h={48}
            justifyContent="center"
            alignItems="center"
            mt="$4"
          >
            <Text color={COLORS.textMuted} fontWeight="$bold" size="sm">
              {isUpdating ? "Saving..." : "Skip for now"}
            </Text>
          </Pressable>
        </Box>
      </Box>
    </Box>
  );
}
