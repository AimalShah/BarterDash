import React from "react";
import { Box, HStack, VStack, Text, Heading, Center } from "@gluestack-ui/themed";
import { Gavel, Clock, TrendingUp } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface ActiveAuctionPanelProps {
    item: {
        title: string;
        currentBid: number;
        reservePrice: number;
        endsAt: string;
    } | null;
}

export const ActiveAuctionPanel = ({ item }: ActiveAuctionPanelProps) => {
    if (!item) {
        return (
            <Box bg={COLORS.cardBackground} p="$10" rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder} alignItems="center">
                <Gavel size={40} color={COLORS.textPrimary} />
                <Text color={COLORS.textPrimary} mt="$4" fontWeight="$black" textTransform="uppercase" size="xs">NO ACTIVE AUCTION</Text>
            </Box>
        );
    }

    return (
        <Box bg={COLORS.cardBackground} p="$8" rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder}>
            <VStack space="xl">
                <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                        <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5}>ACTIVE AUCTION</Text>
                        <Heading size="xl" color={COLORS.textPrimary} fontWeight="$black" numberOfLines={1}>{item.title.toUpperCase()}</Heading>
                    </VStack>
                    <Box bg={COLORS.primaryGold} px="$4" py="$1" rounded="$sm">
                        <Text size="2xs" fontWeight="$black" color={COLORS.luxuryBlack}>IN PROGRESS</Text>
                    </Box>
                </HStack>

                <HStack space="md">
                    <VStack flex={1} bg={COLORS.darkSurface} p="$5" rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder}>
                        <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">HIGH BID</Text>
                        <Text size="3xl" fontWeight="$black" color={COLORS.textPrimary} style={{ letterSpacing: -1 }}>${item.currentBid}</Text>
                    </VStack>
                    <VStack flex={1} bg={COLORS.darkSurface} p="$5" rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder}>
                        <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">TIME LEFT</Text>
                        <HStack alignItems="center" space="xs" mt="$1">
                            <Clock size={16} color={COLORS.textPrimary} />
                            <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>04:20</Text>
                        </HStack>
                    </VStack>
                </HStack>

                <HStack justifyContent="space-between" pt="$4" borderTopWidth={1} borderColor={COLORS.darkBorder}>
                    <VStack>
                        <Text size="2xs" color={COLORS.textMuted} fontWeight="$black">RESERVE PRICE</Text>
                        <Text size="sm" fontWeight="$black" color={COLORS.textPrimary}>${item.reservePrice}</Text>
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text size="2xs" color={COLORS.textMuted} fontWeight="$black">BID COUNT</Text>
                        <Text size="sm" fontWeight="$black" color={COLORS.textPrimary}>12 BIDS</Text>
                    </VStack>
                </HStack>
            </VStack>
        </Box>
    );
};
