import React from "react";
import { Box, HStack, Heading, Text } from "@gluestack-ui/themed";
import { Clock, Users } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface UpcomingStreamsSectionProps {
    upcomingStreamsCount: number;
}

export const UpcomingStreamsSection = ({
    upcomingStreamsCount,
}: UpcomingStreamsSectionProps) => {
    if (upcomingStreamsCount === 0) return null;

    return (
        <Box px="$6" mb="$6" mt="$4">
            <HStack justifyContent="space-between" alignItems="center">
                <HStack alignItems="center">
                    <Clock size={20} color={COLORS.textPrimary} />
                    <Heading color={COLORS.textPrimary} size="md" fontWeight="$extrabold" ml="$2" style={{ letterSpacing: -0.5 }}>
                        UPCOMING
                    </Heading>
                </HStack>
                <Box
                    bg={COLORS.luxuryBlack}
                    px="$3"
                    py="$1"
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.primaryGold}
                >
                    <Text color={COLORS.textPrimary} size="xs" fontWeight="$bold">
                        {upcomingStreamsCount} TOTAL
                    </Text>
                </Box>
            </HStack>
        </Box>
    );
};
