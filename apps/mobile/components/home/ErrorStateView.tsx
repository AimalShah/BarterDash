import React from "react";
import { Box, Heading, Text, Pressable, Center } from "@gluestack-ui/themed";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { StatusBar } from "react-native";
import { COLORS } from "@/constants/colors";

interface ErrorStateViewProps {
    error: string;
    onRetry: () => void;
}

export const ErrorStateView = ({ error, onRetry }: ErrorStateViewProps) => {
    return (
        <Box
            flex={1}
            bg={COLORS.luxuryBlack}
        >
            <StatusBar barStyle="light-content" />
            <Center flex={1} p="$6">
                <Center
                    height={80}
                    width={80}
                    rounded="$full"
                    bg={COLORS.errorRed}
                    opacity={0.1}
                    mb="$6"
                    borderWidth={1}
                    borderColor={COLORS.errorRed}
                >
                    <WifiOff size={40} color={COLORS.errorRed} />
                </Center>

                <Heading color={COLORS.textPrimary} size="xl" textAlign="center" mb="$2" fontWeight="$black">
                    Connection Error
                </Heading>
                <Text color={COLORS.textSecondary} textAlign="center" mb="$8" px="$8" fontWeight="$medium">
                    {error}
                </Text>
                <Pressable
                    onPress={onRetry}
                    bg={COLORS.primaryGold}
                    px="$10"
                    py="$4"
                    rounded={500}
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    sx={{
                        ":active": { transform: [{ scale: 0.98 }], opacity: 0.8 },
                    }}
                >
                    <RefreshCw size={20} color={COLORS.luxuryBlack} />
                    <Text color={COLORS.luxuryBlack} fontWeight="$black" size="md">
                        TRY AGAIN
                    </Text>
                </Pressable>
            </Center>
        </Box>
    );
};
