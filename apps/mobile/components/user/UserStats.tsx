import React from 'react';
import { Box, HStack, Heading, Text, Pressable } from "@gluestack-ui/themed";
import { COLORS } from "@/constants/colors";

interface UserStatsProps {
    followers: number;
    following: number;
    items?: number;
    rating?: string;
    isSeller: boolean;
    onFollowersPress: () => void;
    onFollowingPress: () => void;
}

export const UserStats = ({
    followers,
    following,
    items = 0,
    rating,
    isSeller,
    onFollowersPress,
    onFollowingPress,
}: UserStatsProps) => {
    return (
        <HStack mt="$6" space="xl" px="$6">
            <Pressable onPress={onFollowersPress} alignItems="center">
                <Heading color={COLORS.textPrimary} size="md" fontWeight="$bold">{followers}</Heading>
                <Text color={COLORS.textSecondary} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mt="$1">Followers</Text>
            </Pressable>
            <Pressable onPress={onFollowingPress} alignItems="center">
                <Heading color={COLORS.textPrimary} size="md" fontWeight="$bold">{following}</Heading>
                <Text color={COLORS.textSecondary} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mt="$1">Following</Text>
            </Pressable>
            {isSeller && (
                <>
                    <Box alignItems="center">
                        <Heading color={COLORS.textPrimary} size="md" fontWeight="$bold">{items}</Heading>
                        <Text color={COLORS.textSecondary} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mt="$1">Items</Text>
                    </Box>
                    <Box alignItems="center">
                        <Heading color={COLORS.textPrimary} size="md" fontWeight="$bold">{rating || '0.0'}</Heading>
                        <Text color={COLORS.textSecondary} size="2xs" fontWeight="$bold" textTransform="uppercase" letterSpacing={1.2} mt="$1">Rating</Text>
                    </Box>
                </>
            )}
        </HStack>
    );
};
