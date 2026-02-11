import React from "react";
import { Image } from "react-native";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Center,
} from "@gluestack-ui/themed";
import { Star, CheckCircle } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";

interface SellerProfileHeaderProps {
  seller: any;
  sellerName?: string;
  sellerAvatar?: string;
  rating: number;
}

export default function SellerProfileHeader({
  seller,
  sellerName,
  sellerAvatar,
  rating,
}: SellerProfileHeaderProps) {
  const displayName = seller?.full_name || seller?.fullName || sellerName || "Seller";
  const username = seller?.username || "seller";
  const avatarUrl = seller?.avatar_url || seller?.avatarUrl || sellerAvatar;
  const isVerified = seller?.verified || seller?.sellerDetails?.verified;

  return (
    <HStack space="md" alignItems="center" mb="$4">
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 72, height: 72, borderRadius: 36 }}
        />
      ) : (
        <Center w={72} h={72} rounded="$full" bg={COLORS.darkSurface}>
          <Text size="2xl" fontWeight="$black" color={COLORS.textPrimary}>
            {displayName[0]?.toUpperCase()}
          </Text>
        </Center>
      )}
      <VStack flex={1}>
        <HStack alignItems="center" space="xs">
          <Heading size="lg" color={COLORS.textPrimary} fontWeight="$black">
            {displayName}
          </Heading>
          {isVerified && (
            <CheckCircle size={18} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
          )}
        </HStack>
        <Text size="sm" color={COLORS.textSecondary}>@{username}</Text>
        <HStack alignItems="center" mt="$1" space="xs">
          <Star size={14} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
          <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary}>
            {rating.toFixed(1)}
          </Text>
          <Text size="xs" color={COLORS.textSecondary}>seller rating</Text>
        </HStack>
      </VStack>
    </HStack>
  );
}
