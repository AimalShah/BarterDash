import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import {
    Box,
    Text,
    Pressable,
    Image,
    Center,
    Spinner,
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import { productsService } from "@/lib/api/services/products";
import { Product } from "@/types";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export function ShopTab({ userId }: { userId: string }) {
    const router = useRouter();
    const { width, isTablet, horizontalPadding } = useResponsiveLayout();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const columns = isTablet ? (width >= 1040 ? 4 : 3) : 2;
    const itemGap = isTablet ? 20 : 16;
    const itemWidth =
        (width - horizontalPadding * 2 - itemGap * (columns - 1)) / columns;
    const imageHeight = isTablet ? 180 : 150;

    useEffect(() => {
        fetchProducts();
    }, [userId]);

    const fetchProducts = async () => {
        try {
            const data = await productsService.getSellerProducts(userId);
            setProducts(data);
        } catch (error) {
            console.error("Error fetching shop products:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: Product; index: number }) => (
        <Pressable
            onPress={() => router.push(`/product/${item.id}`)}
            style={{
                width: itemWidth,
                marginBottom: itemGap,
                marginRight: (index + 1) % columns === 0 ? 0 : itemGap,
            }}
        >
            <Box
                bg={COLORS.luxuryBlackLight}
                rounded="$xl"
                overflow="hidden"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
            >
                <Box bg={COLORS.luxuryBlackLighter} style={{ height: imageHeight }}>
                    {item.images?.[0] && (
                        <Image
                            source={{ uri: item.images[0] }}
                            alt={item.title}
                            h="100%"
                            w="100%"
                            resizeMode="cover"
                        />
                    )}
                </Box>
                <Box p="$3">
                    <Text fontWeight="$bold" numberOfLines={1} color={COLORS.textPrimary}>
                        {item.title}
                    </Text>
                    <Text color={COLORS.primaryGold} fontWeight="$bold" mt="$1">
                        ${item.price}
                    </Text>
                </Box>
            </Box>
        </Pressable>
    );

    if (loading) {
        return (
            <Center py="$10">
                <Spinner size="large" color={COLORS.textPrimary} />
            </Center>
        );
    }

    if (products.length === 0) {
        return (
            <Center py="$10">
                <Text color={COLORS.textSecondary}>No products listed yet.</Text>
            </Center>
        );
    }

    return (
        <FlatList
            key={`shop-grid-${columns}`}
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={columns}
            columnWrapperStyle={columns > 1 ? { justifyContent: "flex-start" } : undefined}
            contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                paddingTop: 24,
            }}
            scrollEnabled={false} // Nested in main ScrollView
        />
    );
}
