import React from "react";
import { Box, Text, VStack, HStack, Center } from "@gluestack-ui/themed";
import { Check } from "lucide-react-native";
import { COLORS } from "../../constants/colors";

const STEPS = ["Business Info", "KYC Documents", "Review"];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <HStack justifyContent="center" alignItems="center" px="$4" py="$4">
      {STEPS.map((step, i) => (
        <HStack
          key={step}
          alignItems="center"
          flex={i < STEPS.length - 1 ? 1 : 0}
          justifyContent="center"
        >
          <VStack alignItems="center">
            <Center
              w={40}
              h={40}
              rounded="$full"
              borderWidth={2}
              bg={
                i < currentStep
                  ? COLORS.primaryGold
                  : i === currentStep
                  ? COLORS.primaryGold
                  : COLORS.luxuryBlackLight
              }
              borderColor={
                i < currentStep
                  ? COLORS.primaryGold
                  : i === currentStep
                  ? COLORS.primaryGold
                  : COLORS.darkBorder
              }
            >
              {i < currentStep ? (
                <Check size={20} color={COLORS.luxuryBlack} />
              ) : (
                <Text
                  color={i === currentStep ? COLORS.luxuryBlack : COLORS.textMuted}
                  fontWeight="$bold"
                  size="sm"
                >
                  {i + 1}
                </Text>
              )}
            </Center>
            <Text
              size="2xs"
              mt="$1"
              fontWeight="$medium"
              color={i <= currentStep ? COLORS.textPrimary : COLORS.textMuted}
              textAlign="center"
              numberOfLines={1}
            >
              {step}
            </Text>
          </VStack>
          {i < STEPS.length - 1 && (
            <Box
              h={2}
              flex={1}
              mx="$2"
              bg={i < currentStep ? COLORS.primaryGold : COLORS.darkBorder}
              rounded="$full"
            />
          )}
        </HStack>
      ))}
    </HStack>
  );
}
