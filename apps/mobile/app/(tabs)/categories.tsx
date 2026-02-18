import React, { useState, useEffect } from "react";
import {
    FlatList,
    StatusBar,
    RefreshControl,
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
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

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
    const { width, isTablet, horizontalPadding } = useResponsiveLayout();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const columnCount = isTablet ? (width >= 1040 ? 4 : 3) : 2;
    const itemGap = isTablet ? 20 : 16;
    const itemWidth =
        (width - horizontalPadding * 2 - itemGap * (columnCount - 1)) / columnCount;

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
        const isRowEnd = (index + 1) % columnCount === 0;

        return (
            <Pressable
                onPress={() => handleCategoryPress(item)}
                style={{
                    width: itemWidth,
                    marginRight: isRowEnd ? 0 : itemGap,
                    marginBottom: itemGap,
                }}
                sx={{ ":active": { opacity: 0.8 } }}
            >
                <Box
                    bg={COLORS.cardBackground}
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    rounded={theme.borderRadius.xl}
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
            <Box
                py="$4"
                borderBottomWidth={1}
                borderColor={COLORS.darkBorder}
                style={{ paddingHorizontal: horizontalPadding }}
            >
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
                my="$4"
                style={{ marginHorizontal: horizontalPadding }}
            >
                <HStack
                    bg={COLORS.luxuryBlackLighter}
                    rounded={theme.borderRadius.xl}
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
                key={`categories-grid-${columnCount}`}
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={columnCount}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: 8,
                    paddingBottom: 100,
                }}
                columnWrapperStyle={columnCount > 1 ? { justifyContent: "flex-start" } : undefined}
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
