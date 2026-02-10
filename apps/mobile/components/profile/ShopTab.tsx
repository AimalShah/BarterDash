import React, { useEffect, useState } from "react";
import { FlatList, Dimensions } from "react-native";
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

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48 - 16) / 2;

export function ShopTab({ userId }: { userId: string }) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    const renderItem = ({ item }: { item: Product }) => (
        <Pressable
            onPress={() => router.push(`/product/${item.id}`)}
            style={{ width: ITEM_WIDTH, marginBottom: 16 }}
            mr={16} // This will be handled by columnWrapperStyle usually
        >
            <Box
                bg={COLORS.luxuryBlackLight}
                rounded="$xl"
                overflow="hidden"
                borderWidth={1}
                borderColor={COLORS.darkBorder}
            >
                <Box h={150} bg={COLORS.luxuryBlackLighter}>
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
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ padding: 24 }}
            scrollEnabled={false} // Nested in main ScrollView
        />
    );
}
