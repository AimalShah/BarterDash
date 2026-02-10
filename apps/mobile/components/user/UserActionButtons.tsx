import React from 'react';
import { Box, Button, ButtonText, HStack } from "@gluestack-ui/themed";
import { UserPlus, UserCheck } from 'lucide-react-native';
import { COLORS } from "@/constants/colors";

interface UserActionButtonsProps {
    isFollowing: boolean;
    followLoading: boolean;
    onFollowToggle: () => void;
    isOwnProfile?: boolean;
}

export const UserActionButtons = ({
    isFollowing,
    followLoading,
    onFollowToggle,
    isOwnProfile,
}: UserActionButtonsProps) => {
    if (isOwnProfile) return null;

    return (
        <Box mt="$6" px="$6">
            <Button
                onPress={onFollowToggle}
                isDisabled={followLoading}
                h={48}
                rounded={500}
                bg={!isFollowing ? COLORS.primaryGold : 'transparent'}
                borderWidth={isFollowing ? 1.5 : 0}
                borderColor={isFollowing ? COLORS.primaryGold : 'transparent'}
                sx={{
                    ":active": { opacity: 0.8, transform: [{ scale: 0.98 }] }
                }}
            >
                <HStack space="xs" alignItems="center">
                    <ButtonText fontWeight="$bold" color={isFollowing ? COLORS.primaryGold : COLORS.luxuryBlack}>
                        {followLoading ? "..." : (isFollowing ? "Following" : "Follow")}
                    </ButtonText>
                </HStack>
            </Button>
        </Box>
    );
};
