import React from "react";
import { Image } from "react-native";
import {
  Box,
  HStack,
  Text,
  Pressable,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { COLORS } from "../../../constants/colors";

interface Product {
  id: string;
  title: string;
  images?: string[];
  buyNowPrice?: string;
  buy_now_price?: string;
}

interface SellerProductsGridProps {
  products: Product[];
  sellerId: string;
  onClose: () => void;
}

export default function SellerProductsGrid({
  products,
  sellerId,
  onClose,
}: SellerProductsGridProps) {
  if (products.length === 0) return null;

  const handleViewProduct = (productId: string) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  const handleViewAll = () => {
    onClose();
    router.push(`/user/${sellerId}`);
  };

  return (
    <Box>
      <HStack justifyContent="space-between" alignItems="center" mb="$3">
        <Text fontWeight="$bold" color={COLORS.textPrimary} size="md">
          Shop Items
        </Text>
        <Pressable onPress={handleViewAll}>
          <Text size="sm" color={COLORS.primaryGold}>See All</Text>
        </Pressable>
      </HStack>
      <HStack flexWrap="wrap" mx={-4}>
        {products.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => handleViewProduct(product.id)}
            w="33%"
            p="$1"
          >
            <Box
              bg={COLORS.darkSurface}
              rounded="$lg"
              overflow="hidden"
              borderWidth={1}
              borderColor={COLORS.darkBorder}
            >
              <Image
                source={{ uri: product.images?.[0] || "https://via.placeholder.com/100" }}
                style={{ width: "100%", aspectRatio: 1 }}
              />
              <Box p="$2">
                <Text size="xs" numberOfLines={1} color={COLORS.textPrimary} fontWeight="$medium">
                  {product.title}
                </Text>
                <Text size="xs" color={COLORS.textSecondary}>
                  ${product.buyNowPrice || product.buy_now_price || "0"}
                </Text>
              </Box>
            </Box>
          </Pressable>
        ))}
      </HStack>
    </Box>
  );
}
