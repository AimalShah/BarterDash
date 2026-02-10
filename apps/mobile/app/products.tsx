import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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
import { Search, Filter, ShoppingBag, Play, ChevronLeft } from 'lucide-react-native';
import { productsService } from '@/lib/api/services/products';
import { auctionsService } from '@/lib/api/services/auctions';
import { Product, Auction } from '@/types';
import StreamCard from '@/components/stream/StreamCard';
import { COLORS } from '../constants/colors';

export default function ProductsScreen() {
    const { category, name } = useLocalSearchParams<{ category?: string; name?: string }>();
    const [products, setProducts] = useState<Product[]>([]);
    const [streams, setStreams] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async (isRefreshing = false) => {
        try {
            if (isRefreshing) setRefreshing(true);
            else setLoading(true);

            const query: any = {};
            if (search) {
                query.search = search;
            }

            // Fetch products and streams with their respective category filter parameter names
            const [productsData, streamsData] = await Promise.all([
                productsService.findAll({ ...query, category: category }),
                auctionsService.findAll({ ...query, category_id: category, status: 'live' })
            ]);

            setProducts(productsData || []);
            setStreams(streamsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [category, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderProductItem = ({ item }: { item: Product }) => (
        <Pressable
            onPress={() => router.push(`/product/${item.id}`)}
            w="48%"
            mb="$5"
            bg={COLORS.cardBackground}
            rounded="$3xl"
            borderWidth={1}
            borderColor={COLORS.darkBorder}
            overflow="hidden"
            sx={{
                ":active": { opacity: 0.9 }
            }}
            shadowColor={COLORS.luxuryBlack}
            shadowOpacity={0.05}
            shadowRadius={4}
            elevation={2}
        >
            <Box aspectRatio={1} bg={COLORS.luxuryBlackLight} position="relative">
                {item.images?.[0] ? (
                    <Image
                        source={{ uri: item.images[0] }}
                        alt={item.title}
                        w="100%"
                        h="100%"
                        resizeMode="cover"
                    />
                ) : (
                    <Center w="100%" h="100%">
                        <ShoppingBag size={32} color={COLORS.textSecondary} />
                    </Center>
                )}
                {item.condition && (
                    <Box
                        position="absolute"
                        top="$2"
                        left="$2"
                        bg={COLORS.luxuryBlack}
                        px="$2"
                        py="$0.5"
                        rounded="$full"
                    >
                        <Text color={COLORS.textPrimary} size="2xs" fontWeight="$bold" textTransform="uppercase">
                            {item.condition}
                        </Text>
                    </Box>
                )}
            </Box>
            <Box p="$3">
                <Text numberOfLines={1} color={COLORS.textPrimary} fontWeight="$bold" size="md" mb="$1">
                    {item.title}
                </Text>
                <HStack justifyContent="space-between" alignItems="center">
                    <Text color={COLORS.primaryGold} fontWeight="$black" size="lg">
                        ${item.price}
                    </Text>
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            const sellerId = item.seller_id || (item.seller as any)?.id;
                            if (sellerId) router.push(`/user/${sellerId}`);
                        }}
                        hitSlop={8}
                    >
                        <Text color={COLORS.textSecondary} size="xs">
                            @{item.seller?.username || 'user'}
                        </Text>
                    </Pressable>
                </HStack>
            </Box>
        </Pressable>
    );

    const renderHeader = () => (
        <VStack space="lg" pt="$4">
            {streams.length > 0 && (
                <Box px="$6">
                    <HStack justifyContent="space-between" alignItems="center" mb="$3">
                        <HStack space="xs" alignItems="center">
                            <Box w="$2" h="$2" rounded="$full" bg={COLORS.liveIndicator} />
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} textTransform="uppercase" letterSpacing={1}>Live Streams</Text>
                        </HStack>
                    </HStack>
                    <FlatList
                        data={streams}
                        renderItem={({ item }) => (
                            <Box w={300} mr="$4">
                                <StreamCard stream={item} isLive={true} />
                            </Box>
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                    />
                </Box>
            )}

            <Box px="$6" mb="$2">
                <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} textTransform="uppercase" letterSpacing={1}>
                    {products.length} Products
                </Text>
            </Box>
        </VStack>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <Box flex={1} bg={COLORS.luxuryBlack}>
                <Box px="$6" py="$4" borderBottomWidth={1} borderColor={COLORS.darkBorder}>
                    <HStack alignItems="center" space="md" mb="$5">
                        <Pressable
                            onPress={() => router.back()}
                            h={44}
                            w={44}
                            bg={COLORS.luxuryBlackLight}
                            rounded={500}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <ChevronLeft size={24} color={COLORS.textPrimary} />
                        </Pressable>
                        <VStack flex={1}>
                            <Heading size="xl" color={COLORS.textPrimary} fontWeight="$bold">
                                {name || (category ? 'Category' : 'Marketplace')}
                            </Heading>
                            {category && <Text size="xs" color={COLORS.textSecondary}>Filtered results</Text>}
                        </VStack>
                        <Pressable
                            h={44}
                            w={44}
                            bg={COLORS.luxuryBlack}
                            rounded={500}
                            alignItems="center"
                            justifyContent="center"
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                        >
                            <Filter size={20} color={COLORS.textPrimary} />
                        </Pressable>
                    </HStack>

                    <Input
                        variant="outline"
                        h={50}
                        bg={COLORS.luxuryBlackLight}
                        borderColor={COLORS.darkBorder}
                        rounded={500}
                    >
                        <InputSlot pl="$4">
                            <InputIcon as={Search} size="sm" color={COLORS.textSecondary} />
                        </InputSlot>
                        <InputField
                            placeholder="Search in this category..."
                            value={search}
                            onChangeText={setSearch}
                            color={COLORS.textPrimary}
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </Input>
                </Box>

                {loading && !refreshing ? (
                    <Center flex={1}>
                        <Spinner size="large" color={COLORS.primaryGold} />
                    </Center>
                ) : (
                    <FlatList
                        ListHeaderComponent={renderHeader}
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 10 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={COLORS.primaryGold} />
                        }
                        ListEmptyComponent={
                            <Center flex={1} mt="$20" px="$10">
                                <ShoppingBag size={64} color={COLORS.darkBorder} />
                                <Text color={COLORS.textSecondary} size="lg" fontWeight="$bold" mt="$4" textAlign="center">
                                    No items found
                                </Text>
                                <Text color={COLORS.textMuted} textAlign="center" mt="$2">
                                    Check back later or try a different search.
                                </Text>
                            </Center>
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </Box>
        </SafeAreaView>
    );
}
