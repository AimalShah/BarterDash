import React from "react";
import { Box, VStack, Text, HStack, Spinner, Center } from "@gluestack-ui/themed";
import { StatusBar } from "react-native";
import { COLORS } from "@/constants/colors";

export const HomeLoadingState = () => {
    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <StatusBar barStyle="light-content" />

            <Box px="$6" pt="$12" pb="$6" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <Text size="2xl" fontWeight="$extrabold" color={COLORS.textPrimary} style={{ letterSpacing: -1 }}>
                    BARTERDASH
                </Text>
            </Box>

            <Center flex={1}>
                <VStack space="md" alignItems="center">
                    <Spinner size="large" color={COLORS.textPrimary} />
                    <Text color={COLORS.textPrimary} size="sm" fontWeight="$bold" textTransform="uppercase" style={{ letterSpacing: 2 }}>
                        SEARCHING LIVE STREAMS...
                    </Text>
                </VStack>
            </Center>
        </Box>
    );
};
