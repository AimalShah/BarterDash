import React from "react";
import { Box, HStack, Text, Center } from "@gluestack-ui/themed";
import { Users, Eye, Zap } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface DashboardStatusProps {
    isLive: boolean;
    viewerCount: number;
    quality: string;
}

export const DashboardStatus = ({ isLive, viewerCount, quality }: DashboardStatusProps) => {
    return (
        <HStack space="md" mb="$8">
            <Box
                flex={1}
                bg={isLive ? COLORS.liveIndicator : COLORS.cardBackground}
                p="$5"
                rounded="$sm"
                borderWidth={1}
                borderColor={isLive ? COLORS.liveIndicator : COLORS.darkBorder}
                alignItems="center"
            >
                <HStack space="xs" alignItems="center">
                    <Center w={8} h={8} rounded="$full" bg={COLORS.textPrimary} />
                    <Text size="2xs" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">
                        {isLive ? "LIVE" : "OFFLINE"}
                    </Text>
                </HStack>
                <Text size="md" fontWeight="$black" color={COLORS.textPrimary} mt="$2">{viewerCount} VIEWERS</Text>
            </Box>

            <Box
                flex={1}
                bg={COLORS.cardBackground}
                p="$5"
                rounded="$sm"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
                alignItems="center"
            >
                <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase">STREAM QUALITY</Text>
                <Text size="md" fontWeight="$black" color={COLORS.textPrimary} mt="$2">{quality.toUpperCase()}</Text>
            </Box>
        </HStack>
    );
};
