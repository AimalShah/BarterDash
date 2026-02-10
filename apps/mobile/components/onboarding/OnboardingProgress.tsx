import React from 'react';
import { Box, HStack, Center, Text } from "@gluestack-ui/themed";
import { CheckCircle2 } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface OnboardingProgressProps {
    steps: string[];
    currentStepIndex: number;
}

export const OnboardingProgress = ({ steps, currentStepIndex }: OnboardingProgressProps) => {
    return (
        <Box px="$6" pt="$4" pb="$2">
            <HStack justifyContent="space-between" alignItems="center">
                {steps.map((step, index) => (
                    <HStack key={step} alignItems="center" flex={1}>
                        <Box alignItems="center" flex={1}>
                            <Center
                                w={40}
                                h={40}
                                rounded="$full"
                                borderWidth={2}
                                bg={index === currentStepIndex
                                    ? COLORS.primaryGold
                                    : (index < currentStepIndex
                                        ? COLORS.primaryGold
                                        : COLORS.luxuryBlackLighter)}
                                borderColor={index === currentStepIndex
                                    ? COLORS.primaryGold
                                    : (index < currentStepIndex
                                        ? COLORS.primaryGold
                                        : COLORS.darkBorder)}
                            >
                                {index < currentStepIndex ? (
                                    <CheckCircle2 size={20} color={COLORS.luxuryBlack} />
                                ) : (
                                    <Text
                                        color={index === currentStepIndex ? COLORS.luxuryBlack : COLORS.textMuted}
                                        fontWeight="$bold"
                                        size="sm"
                                    >
                                        {index + 1}
                                    </Text>
                                )}
                            </Center>
                            <Text
                                size="2xs"
                                mt="$1.5"
                                fontWeight="$bold"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                                color={index === currentStepIndex ? COLORS.textPrimary : COLORS.textMuted}
                            >
                                {step}
                            </Text>
                        </Box>
                        {index < steps.length - 1 && (
                            <Box h={2} flex={1} mx="$2" rounded="$full" bg={index < currentStepIndex ? COLORS.primaryGold : COLORS.darkBorder} />
                        )}
                    </HStack>
                ))}
            </HStack>
        </Box>
    );
};
