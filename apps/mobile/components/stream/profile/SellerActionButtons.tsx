import React from "react";
import {
  HStack,
  Button,
  ButtonText,
  Spinner,
} from "@gluestack-ui/themed";
import { Users, ExternalLink } from "lucide-react-native";
import { router } from "expo-router";
import { COLORS } from "../../../constants/colors";

interface SellerActionButtonsProps {
  sellerId: string;
  currentUserId: string | null;
  isFollowing: boolean;
  followLoading: boolean;
  onFollowToggle: () => void;
  onClose: () => void;
}

export default function SellerActionButtons({
  sellerId,
  currentUserId,
  isFollowing,
  followLoading,
  onFollowToggle,
  onClose,
}: SellerActionButtonsProps) {
  const handleViewFullProfile = () => {
    onClose();
    router.push(`/user/${sellerId}`);
  };

  return (
    <HStack space="sm" mb="$6">
      {currentUserId !== sellerId && (
        <Button
          flex={1}
          bg={isFollowing ? COLORS.luxuryBlackLight : COLORS.primaryGold}
          borderWidth={2}
          borderColor={COLORS.primaryGold}
          rounded="$lg"
          onPress={onFollowToggle}
          isDisabled={followLoading}
        >
          {followLoading ? (
            <Spinner size="small" color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack} />
          ) : (
            <HStack space="xs" alignItems="center">
              <Users size={16} color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack} />
              <ButtonText color={isFollowing ? COLORS.textPrimary : COLORS.luxuryBlack}>
                {isFollowing ? "Following" : "Follow"}
              </ButtonText>
            </HStack>
          )}
        </Button>
      )}
      <Button
        flex={1}
        bg={COLORS.luxuryBlackLight}
        borderWidth={2}
        borderColor={COLORS.darkBorder}
        rounded="$lg"
        onPress={handleViewFullProfile}
      >
        <HStack space="xs" alignItems="center">
          <ExternalLink size={16} color={COLORS.textPrimary} />
          <ButtonText color={COLORS.textPrimary}>View Profile</ButtonText>
        </HStack>
      </Button>
    </HStack>
  );
}
