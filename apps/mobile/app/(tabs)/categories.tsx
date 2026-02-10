import React, { useState, useEffect } from "react";
import {
    FlatList,
    StatusBar,
    RefreshControl,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Pressable,
    Center,
    Spinner,
    Image,
} from "@gluestack-ui/themed";
import {
    Search,
    Shirt,
    Smartphone,
    Watch,
    Home as HomeIcon,
    Gamepad2,
    Car,
    Palette,
    MoreHorizontal,
} from "lucide-react-native";
import { categoriesService } from "@/lib/api/services/categories";
import { Category } from "@/types";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48 - 16) / COLUMN_COUNT; // Padding + gap

// Default category icons
const categoryIcons: Record<string, any> = {
    fashion: Shirt,
    electronics: Smartphone,
    watches: Watch,
    home: HomeIcon,
    gaming: Gamepad2,
    automotive: Car,
    art: Palette,
    default: MoreHorizontal,
};

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await categoriesService.findAll();
            const raw = Array.isArray(data) ? data : [];
            const normalized = raw
                .map((c: any) => ({
                    id: String(c?.id ?? ""),
                    name: c?.name ?? "Unknown",
                    slug: c?.slug ?? "",
                    iconUrl: c?.iconUrl || c?.icon_url,
                }))
                .filter((c) => c.id) as Category[];
            setCategories(normalized);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCategoryPress = (category: Category) => {
        // Navigate to products filtered by category
        router.push(`/products?category=${category.id}&name=${encodeURIComponent(category.name)}`);
    };

    const getIconComponent = (slug: string) => {
        const IconComponent = categoryIcons[slug.toLowerCase()] || categoryIcons.default;
        return IconComponent;
    };

    const renderCategory = ({ item, index }: { item: Category; index: number }) => {
        const IconComponent = getIconComponent(item.slug);
        const isEven = index % 2 === 0;

        return (
            <Pressable
                onPress={() => handleCategoryPress(item)}
                style={{
                    width: ITEM_WIDTH,
                    marginRight: isEven ? 16 : 0,
                    marginBottom: 16,
                }}
                sx={{ ":active": { opacity: 0.8 } }}
            >
                <Box
                    bg={COLORS.cardBackground}
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    rounded={theme.borderRadius.round}
                    p="$6"
                    alignItems="center"
                    style={{
                        shadowColor: COLORS.luxuryBlack,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <Center
                        w="$16"
                        h="$16"
                        bg={COLORS.luxuryBlackLighter}
                        rounded="$full"
                        mb="$3"
                    >
                        <IconComponent size={28} color={COLORS.primaryGold} />
                    </Center>
                    <Text
                        color={COLORS.textPrimary}
                        fontWeight="$semibold"
                        size="md"
                        textAlign="center"
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                </Box>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" alignItems="center">
                <Spinner size="large" color={COLORS.primaryGold} />
            </Box>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <Heading size="2xl" color={COLORS.textPrimary} fontWeight="$bold">
                    Categories
                </Heading>
                <Text color={COLORS.textSecondary} size="sm" mt="$1">
                    Browse by category
                </Text>
            </Box>

            {/* Search Bar */}
            <Pressable
                onPress={() => router.push("/(tabs)/search")}
                mx="$6"
                my="$4"
            >
                <HStack
                    bg={COLORS.luxuryBlackLighter}
                    rounded={theme.borderRadius.round}
                    px="$4"
                    py="$3"
                    alignItems="center"
                    space="sm"
                >
                    <Search size={20} color={COLORS.textSecondary} />
                    <Text color={COLORS.textMuted} size="md">
                        Search products...
                    </Text>
                </HStack>
            </Pressable>

            {/* Categories Grid */}
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: 8,
                    paddingBottom: 100,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchCategories(true)}
                        tintColor={COLORS.primaryGold}
                    />
                }
                ListEmptyComponent={
                    <Center py="$16" px="$6">
                        <Text color={COLORS.textMuted} textAlign="center">
                            No categories available
                        </Text>
                    </Center>
                }
            />
        </SafeAreaView>
    );
}
