import React from "react";
import { Box, HStack, VStack, Text, Pressable, Switch, Center } from "@gluestack-ui/themed";
import { Settings, ShieldCheck, Volume2, Globe, Clock } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

export const DashboardSettings = () => {
    return (
        <Box mt="$12" mb="$20">
            <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5} mb="$4" px="$1">
                DASHBOARD CONFIGURATION
            </Text>

            <Box bg={COLORS.cardBackground} rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder} overflow="hidden">
                <VStack>
                    <HStack px="$6" py="$5" justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                        <HStack space="md" alignItems="center">
                            <Volume2 size={20} color={COLORS.textPrimary} />
                            <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Bid Sound Alerts</Text>
                        </HStack>
                        <Switch size="sm" trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }} thumbColor={COLORS.textPrimary} defaultValue={true} />
                    </HStack>

                    <HStack px="$6" py="$5" justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                        <HStack space="md" alignItems="center">
                            <ShieldCheck size={20} color={COLORS.textPrimary} />
                            <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Anti-Snipe Protection</Text>
                        </HStack>
                        <Switch size="sm" trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }} thumbColor={COLORS.textPrimary} defaultValue={true} />
                    </HStack>

                    <HStack px="$6" py="$5" justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center">
                            <Clock size={20} color={COLORS.textPrimary} />
                            <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Auto-Extend Bidding</Text>
                        </HStack>
                        <Switch size="sm" trackColor={{ false: COLORS.darkBorder, true: COLORS.primaryGold }} thumbColor={COLORS.textPrimary} defaultValue={false} />
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
};
