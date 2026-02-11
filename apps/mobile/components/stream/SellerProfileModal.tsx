import React from "react";
import { Modal, ScrollView, Dimensions } from "react-native";
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Center,
  Spinner,
} from "@gluestack-ui/themed";
import { X, Star } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { useSellerProfile } from "@/hooks/useSellerProfile";

import SellerProfileHeader from "./profile/SellerProfileHeader";
import SellerStats from "./profile/SellerStats";
import SellerActionButtons from "./profile/SellerActionButtons";
import SellerProductsGrid from "./profile/SellerProductsGrid";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SellerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
}

export default function SellerProfileModal({
  visible,
  onClose,
  sellerId,
  sellerName,
  sellerAvatar,
}: SellerProfileModalProps) {
  const {
    seller,
    stats,
    isFollowing,
    followLoading,
    products,
    currentUserId,
    loading,
    toggleFollow,
  } = useSellerProfile(sellerId, visible);

  const rating = seller?.sellerDetails?.rating || 4.8;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
        <Box
          bg={COLORS.luxuryBlack}
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          maxHeight={SCREEN_HEIGHT * 0.85}
          overflow="hidden"
        >
          {/* Handle bar */}
          <Center py="$3">
            <Box w={40} h={4} bg={COLORS.darkBorder} rounded="$full" />
          </Center>

          {/* Close button */}
          <Pressable
            position="absolute"
            top={12}
            right={16}
            zIndex={10}
            onPress={onClose}
            h={36}
            w={36}
            rounded="$full"
            bg={COLORS.darkSurface}
            alignItems="center"
            justifyContent="center"
          >
            <X size={20} color={COLORS.textPrimary} />
          </Pressable>

          {loading ? (
            <Center py="$16">
              <Spinner size="large" color={COLORS.primaryGold} />
            </Center>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack px="$6" pb="$8">
                <SellerProfileHeader
                  seller={seller}
                  sellerName={sellerName}
                  sellerAvatar={sellerAvatar}
                  rating={rating}
                />

                <SellerStats
                  sellerId={sellerId}
                  followers={stats.followers}
                  following={stats.following}
                  products={stats.products}
                  onClose={onClose}
                />

                <SellerActionButtons
                  sellerId={sellerId}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  followLoading={followLoading}
                  onFollowToggle={toggleFollow}
                  onClose={onClose}
                />

                <SellerProductsGrid
                  products={products}
                  sellerId={sellerId}
                  onClose={onClose}
                />

                {/* Reviews Placeholder */}
                <Box mt="$4" bg={COLORS.luxuryBlackLight} rounded="$xl" p="$4">
                  <HStack alignItems="center" space="sm" mb="$2">
                    <Star size={18} color={COLORS.primaryGold} fill={COLORS.primaryGold} />
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>Reviews</Text>
                  </HStack>
                  <Text size="sm" color={COLORS.textSecondary}>
                    This seller has great ratings! View their full profile to see all reviews.
                  </Text>
                </Box>
              </VStack>
            </ScrollView>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
