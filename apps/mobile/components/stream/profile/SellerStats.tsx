import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { COLORS } from "../../../constants/colors";

interface SellerStatsProps {
  sellerId: string;
  followers: number;
  following: number;
  products: number;
  onClose: () => void;
}

export default function SellerStats({
  sellerId,
  followers,
  following,
  products,
  onClose,
}: SellerStatsProps) {
  const navigateToFollowers = () => {
    onClose();
    router.push(`/social/followers/${sellerId}`);
  };

  const navigateToFollowing = () => {
    onClose();
    router.push(`/social/following/${sellerId}`);
  };

  return (
    <HStack
      bg={COLORS.luxuryBlackLight}
      rounded="$xl"
      p="$4"
      mb="$4"
      justifyContent="space-around"
    >
      <Pressable alignItems="center" onPress={navigateToFollowers}>
        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
          {followers}
        </Text>
        <Text size="xs" color={COLORS.textSecondary}>Followers</Text>
      </Pressable>
      <Box w={1} bg={COLORS.darkBorder} />
      <Pressable alignItems="center" onPress={navigateToFollowing}>
        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
          {following}
        </Text>
        <Text size="xs" color={COLORS.textSecondary}>Following</Text>
      </Pressable>
      <Box w={1} bg={COLORS.darkBorder} />
      <VStack alignItems="center">
        <Text size="xl" fontWeight="$black" color={COLORS.textPrimary}>
          {products}
        </Text>
        <Text size="xs" color={COLORS.textSecondary}>Products</Text>
      </VStack>
    </HStack>
  );
}
