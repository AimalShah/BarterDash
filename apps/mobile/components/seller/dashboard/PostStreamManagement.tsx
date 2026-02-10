import React from "react";
import { Box, HStack, VStack, Text, Pressable, Center, Heading } from "@gluestack-ui/themed";
import { Package, Share2, BarChart3, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";

interface PostStreamManagementProps {
    pendingShipmentsCount?: number;
}

export const PostStreamManagement = ({ pendingShipmentsCount = 0 }: PostStreamManagementProps) => {
    return (
        <Box mt="$12">
            <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5} mb="$4" px="$1">
                POST-STREAM & SHIPPING
            </Text>

            <VStack space="sm">
                <Pressable
                    onPress={() => router.push('/seller/sales')}
                    bg={COLORS.cardBackground}
                    p="$5"
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                >
                    <HStack justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center">
                            <Center w={44} h={44} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm">
                                <Package size={20} color={COLORS.textPrimary} />
                            </Center>
                            <VStack>
                                <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Pending Shipments</Text>
                                <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">
                                    {pendingShipmentsCount} {pendingShipmentsCount === 1 ? 'ITEM NEEDS' : 'ITEMS NEED'} LABELS
                                </Text>
                            </VStack>
                        </HStack>
                        <ChevronRight size={18} color={COLORS.textPrimary} />
                    </HStack>
                </Pressable>

                <Pressable
                    bg={COLORS.cardBackground}
                    p="$5"
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                >
                    <HStack justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center">
                            <Center w={44} h={44} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm">
                                <BarChart3 size={20} color={COLORS.textPrimary} />
                            </Center>
                            <VStack>
                                <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Stream Summaries</Text>
                                <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">VIEW PERFORMANCE BREAKDOWN</Text>
                            </VStack>
                        </HStack>
                        <ChevronRight size={18} color={COLORS.textPrimary} />
                    </HStack>
                </Pressable>

                <Pressable
                    bg={COLORS.cardBackground}
                    p="$5"
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                >
                    <HStack justifyContent="space-between" alignItems="center">
                        <HStack space="md" alignItems="center">
                            <Center w={44} h={44} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm">
                                <Share2 size={20} color={COLORS.textPrimary} />
                            </Center>
                            <VStack>
                                <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Promote Store</Text>
                                <Text size="2xs" color={COLORS.textSecondary} fontWeight="$black" textTransform="uppercase">SHARE YOUR UPCOMING SCHEDULE</Text>
                            </VStack>
                        </HStack>
                        <ChevronRight size={18} color={COLORS.textPrimary} />
                    </HStack>
                </Pressable>
            </VStack>
        </Box>
    );
};
