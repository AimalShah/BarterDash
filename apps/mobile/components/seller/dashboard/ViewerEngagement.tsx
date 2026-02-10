import React from "react";
import { Box, HStack, VStack, Text, Heading, ScrollView, Pressable, Center } from "@gluestack-ui/themed";
import { MessageSquare, Users, ShieldAlert, Smile } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface Viewer {
    id: string;
    username: string;
    isModerator?: boolean;
}

interface ViewerEngagementProps {
    viewers: Viewer[];
    onModAction: (userId: string) => void;
}

export const ViewerEngagement = ({ viewers, onModAction }: ViewerEngagementProps) => {
    return (
        <Box mt="$12">
            <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5} mb="$4" px="$1">
                VIEWER ENGAGEMENT
            </Text>

            <Box bg={COLORS.cardBackground} rounded="$sm" borderWidth={1} borderColor={COLORS.darkBorder} overflow="hidden">
                {/* Viewer List Header */}
                <HStack bg={COLORS.luxuryBlack} px="$6" py="$3" justifyContent="space-between" alignItems="center">
                    <HStack space="xs" alignItems="center">
                        <Users size={16} color={COLORS.textPrimary} />
                        <Text size="2xs" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">Active Viewers</Text>
                    </HStack>
                    <Box h={20} px="$2" bg={COLORS.primaryGold} rounded="$sm" alignItems="center" justifyContent="center">
                        <Text size="2xs" color={COLORS.luxuryBlack} fontWeight="$black">{viewers.length}</Text>
                    </Box>
                </HStack>

                <VStack>
                    {viewers.slice(0, 5).map((viewer, index) => (
                        <HStack
                            key={viewer.id}
                            px="$6"
                            py="$4"
                            alignItems="center"
                            justifyContent="space-between"
                            borderBottomWidth={1}
                            borderColor={COLORS.darkBorder}
                        >
                            <HStack space="md" alignItems="center">
                                <Box h={36} w={36} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm" alignItems="center" justifyContent="center">
                                    <Text size="xs" fontWeight="$black" color={COLORS.textPrimary}>{viewer.username[0].toUpperCase()}</Text>
                                </Box>
                                <VStack>
                                    <Text size="sm" fontWeight="$black" color={COLORS.textPrimary} textTransform="uppercase">@{viewer.username}</Text>
                                    {viewer.isModerator && (
                                        <Text size="2xs" color={COLORS.primaryGold} fontWeight="$black" textTransform="uppercase">MODERATOR</Text>
                                    )}
                                </VStack>
                            </HStack>
                            <Pressable
                                onPress={() => onModAction(viewer.id)}
                                h={32}
                                w={32}
                                rounded="$sm"
                                bg={COLORS.darkSurface}
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <ShieldAlert size={16} color={COLORS.textPrimary} />
                            </Pressable>
                        </HStack>
                    ))}

                    <Pressable h={48} alignItems="center" justifyContent="center" bg={COLORS.darkSurface}>
                        <Text size="xs" color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">VIEW ALL VIEWERS</Text>
                    </Pressable>
                </VStack>
            </Box>

            {/* Quick Chat Actions */}
            <HStack space="md" mt="$6">
                <Pressable
                    flex={1}
                    bg={COLORS.darkSurface}
                    h={56}
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    alignItems="center"
                    justifyContent="center"
                    onPress={() => { }}
                >
                    <HStack space="xs" alignItems="center">
                        <Smile size={18} color={COLORS.textPrimary} />
                        <Text size="xs" color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">Emoji Mode</Text>
                    </HStack>
                </Pressable>
                <Pressable
                    flex={1}
                    bg={COLORS.darkSurface}
                    h={56}
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    alignItems="center"
                    justifyContent="center"
                    onPress={() => { }}
                >
                    <HStack space="xs" alignItems="center">
                        <MessageSquare size={18} color={COLORS.textPrimary} />
                        <Text size="xs" color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">Chat Only</Text>
                    </HStack>
                </Pressable>
            </HStack>
        </Box>
    );
};
