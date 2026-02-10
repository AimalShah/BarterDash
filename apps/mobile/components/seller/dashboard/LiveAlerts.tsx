import React from "react";
import { Box, HStack, VStack, Text, Center } from "@gluestack-ui/themed";
import { Bell, Zap, Info, AlertTriangle } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface AlertItem {
    id: string;
    type: 'bid' | 'viewer' | 'system';
    message: string;
    time: string;
}

export const LiveAlerts = ({ alerts }: { alerts: AlertItem[] }) => {
    return (
        <Box mt="$12">
            <HStack justifyContent="space-between" alignItems="center" mb="$6">
                <HStack space="xs" alignItems="center">
                    <Bell size={18} color={COLORS.textPrimary} />
                    <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5}>REAL-TIME FEED</Text>
                </HStack>
                <Box bg={COLORS.liveIndicator} px="$3" py="$1" rounded="$sm">
                    <Text size="2xs" color={COLORS.textPrimary} fontWeight="$black">LIVE</Text>
                </Box>
            </HStack>

            <VStack space="sm">
                {alerts.map((alert) => (
                    <Box
                        key={alert.id}
                        bg={COLORS.cardBackground}
                        p="$4"
                        rounded="$sm"
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                    >
                        <HStack space="md" alignItems="center">
                            <Center w={36} h={36} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm">
                                {alert.type === 'bid' ? <Zap size={18} color={COLORS.primaryGold} /> : <Info size={18} color={COLORS.textPrimary} />}
                            </Center>
                            <VStack flex={1}>
                                <Text size="sm" color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">{alert.message}</Text>
                                <Text size="2xs" color={COLORS.textMuted} fontWeight="$black">{alert.time.toUpperCase()}</Text>
                            </VStack>
                        </HStack>
                    </Box>
                ))}

                {alerts.length === 0 && (
                    <Center p="$10" bg={COLORS.darkSurface} rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder}>
                        <Text size="xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">WAITING FOR ACTIVITY...</Text>
                    </Center>
                )}
            </VStack>
        </Box>
    );
};
