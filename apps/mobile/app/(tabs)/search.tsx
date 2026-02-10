import React, { useState, useEffect } from "react";
import { ScrollView, FlatList, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Input,
    InputField,
    InputSlot,
    InputIcon,
    Pressable,
    Center,
    Image,
    Spinner,
} from "@gluestack-ui/themed";
import { Search, Filter, Play } from "lucide-react-native";
import { auctionsService } from "@/lib/api/services/auctions";
import { categoriesService } from "@/lib/api/services/categories";
import StreamCard from "@/components/stream/StreamCard";
import { Auction, Category } from "@/types";
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get("window");

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Auction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query || activeCategory !== "all") {
                performSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, activeCategory]);

    const fetchCategories = async () => {
        try {
            const data = await categoriesService.findAll();
            const raw = Array.isArray(data) ? data : [];
            const normalized = raw
                .map((c: any) => ({
                    id: String(c?.id ?? ""),
                    name: c?.name ?? "Unknown",
                    slug: c?.slug ?? "",
                }))
                .filter((c) => c.id) as Category[];
            setCategories([
                { id: "all", name: "All", slug: "all" } as Category,
                ...normalized,
            ]);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const performSearch = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (query) params.title = query;
            if (activeCategory !== "all") params.category_id = activeCategory;

            const data = await auctionsService.findAll(params);
            setResults(data || []);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderResultItem = ({ item }: { item: Auction }) => (
        <Box px="$2" mb="$6" w={width / 2 - 12}>
            <StreamCard stream={item} isLive={item.status === "live"} />
        </Box>
    );

    return (
        <Box flex={1} bg={COLORS.luxuryBlack}>
            <Box safeAreaTop />
            <Box px="$6" pt="$8" pb="$6" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" space="md">
                    <Input
                        variant="outline"
                        h={56}
                        bg={COLORS.luxuryBlack}
                        borderColor={COLORS.darkBorder}
                        rounded="$sm"
                        flex={1}
                        borderWidth={1}
                    >
                        <InputSlot pl="$3">
                            <Search size={20} color={COLORS.textPrimary} />
                        </InputSlot>
                        <InputField
                            placeholder="SEARCH STREAMS..."
                            value={query}
                            onChangeText={setQuery}
                            color={COLORS.textPrimary}
                            placeholderTextColor={COLORS.textSecondary}
                            style={{ fontWeight: "700", fontSize: 13 }}
                            autoCapitalize="none"
                        />
                    </Input>
                    <Pressable
                        h={56}
                        w={56}
                        bg={COLORS.luxuryBlack}
                        rounded="$sm"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                    >
                        <Filter size={20} color={COLORS.textPrimary} />
                    </Pressable>
                </HStack>
            </Box>

            <Box py="$6" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                >
                    {categories &&
                        categories.length > 0 &&
                        categories.map((cat) => (
                            <Pressable
                                key={String(cat.id)}
                                onPress={() => setActiveCategory(String(cat.id))}
                                mr="$3"
                                px="$6"
                                h={40}
                                rounded="$sm"
                                borderWidth={1}
                                borderColor={COLORS.darkBorder}
                                bg={
                                    activeCategory === String(cat.id) ? COLORS.primaryGold : COLORS.luxuryBlack
                                }
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text
                                    size="xs"
                                    fontWeight="$black"
                                    textTransform="uppercase"
                                    color={
                                        activeCategory === String(cat.id) ? COLORS.luxuryBlack : COLORS.textPrimary
                                    }
                                >
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                </ScrollView>
            </Box>

            <Box flex={1}>
                {loading ? (
                    <Center flex={1}>
                        <Spinner size="large" color={COLORS.primaryGold} />
                        <Text mt="$4" fontWeight="$black" size="xs" textTransform="uppercase" color={COLORS.textPrimary}>SEARCHING...</Text>
                    </Center>
                ) : results && results.length > 0 ? (
                    <FlatList
                        data={results}
                        renderItem={renderResultItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{
                            paddingHorizontal: 16,
                            paddingTop: 24,
                            justifyContent: "space-between"
                        }}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                ) : (
                    <Center flex={1} px="$10">
                        <Box
                            h="$24"
                            w="$24"
                            bg={COLORS.luxuryBlackLight}
                            opacity={0.5}
                            rounded="$sm"
                            alignItems="center"
                            justifyContent="center"
                            mb="$6"
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                        >
                            <Search size={40} color={COLORS.textPrimary} />
                        </Box>
                        <Text size="lg" color={COLORS.textPrimary} fontWeight="$black" textAlign="center" textTransform="uppercase">
                            {query ? "NO RESULTS FOUND" : "EXPLORE BARTERDASH"}
                        </Text>
                        <Text color={COLORS.textSecondary} textAlign="center" mt="$2" fontWeight="$bold" size="sm">
                            {query
                                ? "TRY DIFFERENT KEYWORDS OR CATEGORIES."
                                : "SEARCH FOR YOUR FAVORITE ITEMS OR LIVE AUCTIONS."}
                        </Text>
                        <Pressable
                            mt="$8"
                            px="$8"
                            py="$3"
                            bg={COLORS.primaryGold}
                            rounded="$sm"
                            onPress={() => { setQuery(""); setActiveCategory("all"); }}
                        >
                            <Text color={COLORS.luxuryBlack} fontWeight="$black" size="xs" textTransform="uppercase">CLEAR SEARCH</Text>
                        </Pressable>
                    </Center>
                )}
            </Box>
        </Box>
    );
}
