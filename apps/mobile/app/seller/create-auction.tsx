import React, { useState, useEffect } from "react";
import { StatusBar, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import {
    Box,
    Heading,
    HStack,
    VStack,
    Pressable,
    Spinner,
    Button,
    ButtonText,
    Text,
    Input,
    InputField,
} from "@gluestack-ui/themed";
import { ChevronLeft, ChevronDown } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { productsService } from "../../lib/api/services/products";
import { auctionsService } from "../../lib/api/services/auctions";
import { supabase } from "../../lib/supabase";
import { COLORS } from '../../constants/colors';

export default function CreateAuctionScreen() {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [startingBid, setStartingBid] = useState("");
    const [reservePrice, setReservePrice] = useState("");
    const [duration, setDuration] = useState("24");
    const [loading, setLoading] = useState(false);
    const [fetchingProducts, setFetchingProducts] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await productsService.getSellerProducts(user.id);
                // Filter to only show active products without active auctions
                setProducts((data || []).filter((p: any) => p.status === 'active'));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setFetchingProducts(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct) {
            Alert.alert("Missing Field", "Please select a product.");
            return;
        }
        if (!startingBid.trim()) {
            Alert.alert("Missing Field", "Please enter a starting bid.");
            return;
        }

        setLoading(true);
        try {
            await auctionsService.create({
                product_id: selectedProduct.id,
                starting_bid: parseFloat(startingBid),
                reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
                duration_minutes: parseInt(duration) * 60,
            });

            Alert.alert("Success", "Auction created successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Error creating auction:", error);
            Alert.alert("Error", error.message || "Failed to create auction");
        } finally {
            setLoading(false);
        }
    };

    const durations = [
        { value: "1", label: "1 hour" },
        { value: "6", label: "6 hours" },
        { value: "12", label: "12 hours" },
        { value: "24", label: "24 hours" },
        { value: "48", label: "2 days" },
        { value: "168", label: "7 days" },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={2} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" space="md">
                    <Pressable
                        onPress={() => router.back()}
                        h={44}
                        w={44}
                        rounded="$lg"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                        bg={COLORS.luxuryBlack}
                    >
                        <ChevronLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>
                    <Heading color={COLORS.textPrimary} size="xl" fontWeight="$black">
                        Create Auction
                    </Heading>
                </HStack>
            </Box>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Box px="$6" py="$6">
                    <VStack space="xl">
                        {/* Product Selection */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                SELECT PRODUCT
                            </Text>
                            {fetchingProducts ? (
                                <Box p="$4" alignItems="center">
                                    <Spinner size="small" color={COLORS.primaryGold} />
                                </Box>
                            ) : products.length === 0 ? (
                                <Box 
                                    bg={COLORS.luxuryBlackLight} 
                                    p="$4" 
                                    rounded="$lg" 
                                    borderWidth={1} 
                                    borderColor={COLORS.darkBorder}
                                    alignItems="center"
                                >
                                    <Text size="sm" color={COLORS.textSecondary}>No products available</Text>
                                    <Button
                                        size="sm"
                                        bg={COLORS.primaryGold}
                                        mt="$3"
                                        onPress={() => router.push('/seller/add-product')}
                                    >
                                        <ButtonText color={COLORS.luxuryBlack}>Add a Product First</ButtonText>
                                    </Button>
                                </Box>
                            ) : (
                                <>
                                    <Pressable
                                        onPress={() => setShowProductPicker(!showProductPicker)}
                                        bg={COLORS.luxuryBlack}
                                        p="$4"
                                        rounded="$lg"
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                    >
                                        <HStack justifyContent="space-between" alignItems="center">
                                            <Text 
                                                color={selectedProduct ? COLORS.textPrimary : COLORS.textMuted}
                                                fontWeight={selectedProduct ? "$bold" : "$normal"}
                                            >
                                                {selectedProduct?.title || "Choose a product..."}
                                            </Text>
                                            <ChevronDown size={20} color={COLORS.textPrimary} />
                                        </HStack>
                                    </Pressable>
                                    
                                    {showProductPicker && (
                                        <Box 
                                            mt="$2" 
                                            bg={COLORS.luxuryBlack} 
                                            rounded="$lg" 
                                            borderWidth={2} 
                                            borderColor={COLORS.darkBorder}
                                            overflow="hidden"
                                        >
                                            {products.map((product) => (
                                                <Pressable
                                                    key={product.id}
                                                    onPress={() => {
                                                        setSelectedProduct(product);
                                                        setShowProductPicker(false);
                                                    }}
                                                    p="$4"
                                                    bg={selectedProduct?.id === product.id ? COLORS.luxuryBlackLight : COLORS.luxuryBlack}
                                                    borderBottomWidth={1}
                                                    borderColor={COLORS.darkBorder}
                                                >
                                                    <Text fontWeight="$medium" color={COLORS.textPrimary}>
                                                        {product.title}
                                                    </Text>
                                                    <Text size="xs" color={COLORS.textSecondary}>
                                                        ${product.buyNowPrice || product.startingBid || '0'}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>

                        {/* Starting Bid */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                STARTING BID ($)
                            </Text>
                            <Input
                                size="lg"
                                borderWidth={2}
                                borderColor={COLORS.darkBorder}
                                rounded="$lg"
                            >
                                <InputField
                                    value={startingBid}
                                    onChangeText={setStartingBid}
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="decimal-pad"
                                    color={COLORS.textPrimary}
                                />
                            </Input>
                        </Box>

                        {/* Reserve Price (Optional) */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                RESERVE PRICE ($) - Optional
                            </Text>
                            <Input
                                size="lg"
                                borderWidth={2}
                                borderColor={COLORS.darkBorder}
                                rounded="$lg"
                            >
                                <InputField
                                    value={reservePrice}
                                    onChangeText={setReservePrice}
                                    placeholder="Minimum price to sell"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="decimal-pad"
                                    color={COLORS.textPrimary}
                                />
                            </Input>
                            <Text size="xs" color={COLORS.textMuted} mt="$1">
                                Item won't sell if bidding doesn't reach this price
                            </Text>
                        </Box>

                        {/* Duration */}
                        <Box>
                            <Text size="sm" fontWeight="$bold" color={COLORS.textPrimary} mb="$2">
                                DURATION
                            </Text>
                            <HStack space="sm" flexWrap="wrap">
                                {durations.map((d) => (
                                    <Pressable
                                        key={d.value}
                                        onPress={() => setDuration(d.value)}
                                        bg={duration === d.value ? COLORS.primaryGold : COLORS.luxuryBlack}
                                        px="$4"
                                        py="$2"
                                        rounded="$full"
                                        borderWidth={2}
                                        borderColor={COLORS.darkBorder}
                                        mb="$2"
                                    >
                                        <Text
                                            size="sm"
                                            fontWeight="$bold"
                                            color={duration === d.value ? COLORS.luxuryBlack : COLORS.textPrimary}
                                        >
                                            {d.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </HStack>
                        </Box>

                        {/* Submit Button */}
                        <Button
                            onPress={handleSubmit}
                            isDisabled={loading || !selectedProduct}
                            size="xl"
                            bg={COLORS.primaryGold}
                            rounded="$lg"
                            h={56}
                        >
                            {loading ? (
                                <Spinner color={COLORS.luxuryBlack} />
                            ) : (
                                <ButtonText fontWeight="$black" fontSize="$md" color={COLORS.luxuryBlack}>
                                    START AUCTION
                                </ButtonText>
                            )}
                        </Button>
                    </VStack>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
