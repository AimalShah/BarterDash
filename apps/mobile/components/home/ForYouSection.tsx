import { Box, Text, Pressable, FlatList } from "@gluestack-ui/themed";
import { useQuery } from "@tanstack/react-query";
import { feedService } from "../../lib/api/services/feed";
import ProductFeedCard from "../stream/ProductFeedCard";
import { Sparkles } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface ForYouSectionProps {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ForYouSection({ refreshing, onRefresh }: ForYouSectionProps) {
  const { data: forYouProducts, isLoading } = useQuery({
    queryKey: ['forYouFeed'],
    queryFn: () => feedService.getForYou({ limit: 10 }),
  });

  const handleProductPress = (productId: string) => {
    // Track click for recommendation improvement
    feedService.trackClick(productId).catch(() => {});
  };

  if (isLoading || !forYouProducts || forYouProducts.length === 0) {
    return null;
  }

  return (
    <Box px="$4" py="$3" bg={COLORS.luxuryBlack}>
      {/* Section Header */}
      <Box flexDirection="row" alignItems="center" mb="$3">
        <Sparkles size={20} color={COLORS.primaryGold} />
        <Text fontSize="$lg" fontWeight="$bold" ml="$2" color={COLORS.textPrimary}>
          For You
        </Text>
      </Box>

      {/* Horizontal scrollable product list */}
      <FlatList
        data={forYouProducts}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <Pressable onPress={() => handleProductPress(item.id)} mr="$3">
            <Box w={160}>
              <ProductFeedCard product={item} />
            </Box>
          </Pressable>
        )}
      />
    </Box>
  );
}
