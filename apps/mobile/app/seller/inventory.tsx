import React, { useState, useEffect, useCallback } from "react";
import { StatusBar, Alert, ScrollView, RefreshControl, Image } from "react-native";
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
    Badge,
    BadgeText,
} from "@gluestack-ui/themed";
import { 
    ChevronLeft, 
    Package, 
    ShoppingBag, 
    Truck, 
    CheckCircle, 
    Clock,
    MoreVertical,
    Edit,
    Trash2,
    Plus
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { productsService } from "../../lib/api/services/products";
import { ordersService } from "../../lib/api/services/orders";
import { supabase } from "../../lib/supabase";
import { COLORS } from '../../constants/colors';

type TabType = "products" | "orders";
type ProductFilter = "all" | "active" | "draft" | "sold";
type OrderFilter = "all" | "pending" | "shipped" | "completed";

export default function InventoryScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("products");
    const [productFilter, setProductFilter] = useState<ProductFilter>("all");
    const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [productsData, ordersData] = await Promise.all([
                productsService.getSellerProducts(user.id),
                ordersService.getMySales(),
            ]);

            setProducts(productsData || []);
            setOrders(ordersData || []);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await ordersService.updateStatus(orderId, newStatus);
            Alert.alert("Success", `Order marked as ${newStatus}`);
            fetchData();
        } catch (error: any) {
            console.error("Error updating order:", error);
            Alert.alert("Error", error.message || "Failed to update order");
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await productsService.delete(productId);
                            Alert.alert("Success", "Product deleted");
                            fetchData();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to delete product");
                        }
                    }
                }
            ]
        );
    };

    const filteredProducts = products.filter(p => {
        if (productFilter === "all") return true;
        return p.status === productFilter;
    });

    const filteredOrders = orders.filter(o => {
        if (orderFilter === "all") return true;
        return o.status === orderFilter;
    });

    const getProductStatusColor = (status: string) => {
        switch (status) {
            case "active": return COLORS.successGreen;
            case "draft": return COLORS.textMuted;
            case "sold": return COLORS.primaryGold;
            case "cancelled": return COLORS.errorRed;
            default: return COLORS.textMuted;
        }
    };

    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case "pending": return COLORS.warningAmber;
            case "paid": return COLORS.successGreen;
            case "shipped": return COLORS.primaryGold;
            case "completed": return COLORS.successGreen;
            case "cancelled": return COLORS.errorRed;
            default: return COLORS.textMuted;
        }
    };

    const getOrderStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <Clock size={16} color={COLORS.warningAmber} />;
            case "paid": return <CheckCircle size={16} color={COLORS.successGreen} />;
            case "shipped": return <Truck size={16} color={COLORS.primaryGold} />;
            case "completed": return <CheckCircle size={16} color={COLORS.successGreen} />;
            default: return <Clock size={16} color={COLORS.textMuted} />;
        }
    };

    const productCounts = {
        all: products.length,
        active: products.filter(p => p.status === "active").length,
        draft: products.filter(p => p.status === "draft").length,
        sold: products.filter(p => p.status === "sold").length,
    };

    const orderCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === "pending" || o.status === "paid").length,
        shipped: orders.filter(o => o.status === "shipped").length,
        completed: orders.filter(o => o.status === "completed").length,
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <Box px="$6" py="$4" borderBottomWidth={2} borderColor={COLORS.darkBorder}>
                <HStack alignItems="center" justifyContent="space-between">
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
                            Inventory
                        </Heading>
                    </HStack>
                    <Pressable
                        onPress={() => router.push('/seller/add-product')}
                        h={44}
                        w={44}
                        rounded="$lg"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                        bg={COLORS.primaryGold}
                    >
                        <Plus size={24} color={COLORS.luxuryBlack} />
                    </Pressable>
                </HStack>
            </Box>

            {/* Tabs */}
            <Box px="$6" py="$4" borderBottomWidth={2} borderColor={COLORS.darkBorder}>
                <HStack space="md">
                    <Pressable
                        onPress={() => setActiveTab("products")}
                        flex={1}
                        bg={activeTab === "products" ? COLORS.primaryGold : COLORS.luxuryBlack}
                        py="$3"
                        rounded="$lg"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                        alignItems="center"
                    >
                        <HStack space="sm" alignItems="center">
                            <Package size={18} color={activeTab === "products" ? COLORS.luxuryBlack : COLORS.textPrimary} />
                            <Text
                                fontWeight="$bold"
                                color={activeTab === "products" ? COLORS.luxuryBlack : COLORS.textPrimary}
                            >
                                Products ({products.length})
                            </Text>
                        </HStack>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab("orders")}
                        flex={1}
                        bg={activeTab === "orders" ? COLORS.primaryGold : COLORS.luxuryBlack}
                        py="$3"
                        rounded="$lg"
                        borderWidth={2}
                        borderColor={COLORS.darkBorder}
                        alignItems="center"
                    >
                        <HStack space="sm" alignItems="center">
                            <ShoppingBag size={18} color={activeTab === "orders" ? COLORS.luxuryBlack : COLORS.textPrimary} />
                            <Text
                                fontWeight="$bold"
                                color={activeTab === "orders" ? COLORS.luxuryBlack : COLORS.textPrimary}
                            >
                                Orders ({orders.length})
                            </Text>
                        </HStack>
                    </Pressable>
                </HStack>
            </Box>

            {loading ? (
                <Box flex={1} alignItems="center" justifyContent="center">
                    <Spinner size="large" color={COLORS.primaryGold} />
                </Box>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGold} />
                    }
                >
                    {activeTab === "products" ? (
                        <Box px="$4" py="$4">
                            {/* Product Filters */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <HStack space="sm" mb="$4">
                                    {(["all", "active", "draft", "sold"] as ProductFilter[]).map((filter) => (
                                        <Pressable
                                            key={filter}
                                            onPress={() => setProductFilter(filter)}
                                            bg={productFilter === filter ? COLORS.primaryGold : COLORS.luxuryBlack}
                                            px="$4"
                                            py="$2"
                                            rounded="$full"
                                            borderWidth={2}
                                            borderColor={COLORS.darkBorder}
                                        >
                                            <Text
                                                size="sm"
                                                fontWeight="$bold"
                                                color={productFilter === filter ? COLORS.luxuryBlack : COLORS.textPrimary}
                                                textTransform="capitalize"
                                            >
                                                {filter} ({productCounts[filter]})
                                            </Text>
                                        </Pressable>
                                    ))}
                                </HStack>
                            </ScrollView>

                            {/* Products List */}
                            {filteredProducts.length === 0 ? (
                                <Box py="$12" alignItems="center">
                                    <Package size={48} color={COLORS.textMuted} />
                                    <Text color={COLORS.textSecondary} mt="$3">No products found</Text>
                                    <Button
                                        size="sm"
                                        bg={COLORS.primaryGold}
                                        mt="$4"
                                        onPress={() => router.push('/seller/add-product')}
                                    >
                                        <ButtonText color={COLORS.luxuryBlack}>Add Product</ButtonText>
                                    </Button>
                                </Box>
                            ) : (
                                <VStack space="sm">
                                    {filteredProducts.map((product) => (
                                        <Box
                                            key={product.id}
                                            bg={COLORS.luxuryBlack}
                                            rounded="$xl"
                                            borderWidth={2}
                                            borderColor={COLORS.darkBorder}
                                            overflow="hidden"
                                        >
                                            <HStack>
                                                <Image
                                                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/100' }}
                                                    style={{ width: 100, height: 100 }}
                                                />
                                                <Box flex={1} p="$3">
                                                    <HStack justifyContent="space-between" alignItems="flex-start">
                                                        <VStack flex={1}>
                                                            <Text fontWeight="$bold" color={COLORS.textPrimary} numberOfLines={1}>
                                                                {product.title}
                                                            </Text>
                                                            <Text size="sm" color={COLORS.textSecondary}>
                                                                ${product.buyNowPrice || product.startingBid || '0'}
                                                            </Text>
                                                            <HStack mt="$2" space="xs" alignItems="center">
                                                                <Box
                                                                    w={8}
                                                                    h={8}
                                                                    rounded="$full"
                                                                    bg={getProductStatusColor(product.status)}
                                                                />
                                                                <Text size="xs" color={COLORS.textSecondary} textTransform="capitalize">
                                                                    {product.status}
                                                                </Text>
                                                            </HStack>
                                                        </VStack>
                                                        <HStack space="xs">
                                                            <Pressable
                                                                p="$2"
                                                                onPress={() => router.push(`/seller/edit-product?id=${product.id}`)}
                                                            >
                                                                <Edit size={18} color={COLORS.textMuted} />
                                                            </Pressable>
                                                            <Pressable
                                                                p="$2"
                                                                onPress={() => handleDeleteProduct(product.id)}
                                                            >
                                                                <Trash2 size={18} color={COLORS.errorRed} />
                                                            </Pressable>
                                                        </HStack>
                                                    </HStack>
                                                </Box>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    ) : (
                        <Box px="$4" py="$4">
                            {/* Order Filters */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <HStack space="sm" mb="$4">
                                    {(["all", "pending", "shipped", "completed"] as OrderFilter[]).map((filter) => (
                                        <Pressable
                                            key={filter}
                                            onPress={() => setOrderFilter(filter)}
                                            bg={orderFilter === filter ? COLORS.primaryGold : COLORS.luxuryBlack}
                                            px="$4"
                                            py="$2"
                                            rounded="$full"
                                            borderWidth={2}
                                            borderColor={COLORS.darkBorder}
                                        >
                                            <Text
                                                size="sm"
                                                fontWeight="$bold"
                                                color={orderFilter === filter ? COLORS.luxuryBlack : COLORS.textPrimary}
                                                textTransform="capitalize"
                                            >
                                                {filter} ({orderCounts[filter]})
                                            </Text>
                                        </Pressable>
                                    ))}
                                </HStack>
                            </ScrollView>

                            {/* Orders List */}
                            {filteredOrders.length === 0 ? (
                                <Box py="$12" alignItems="center">
                                    <ShoppingBag size={48} color={COLORS.textMuted} />
                                    <Text color={COLORS.textSecondary} mt="$3">No orders found</Text>
                                </Box>
                            ) : (
                                <VStack space="sm">
                                    {filteredOrders.map((order) => (
                                        <Box
                                            key={order.id}
                                            bg={COLORS.luxuryBlack}
                                            rounded="$xl"
                                            borderWidth={2}
                                            borderColor={COLORS.darkBorder}
                                            p="$4"
                                        >
                                            <HStack justifyContent="space-between" alignItems="flex-start">
                                                <VStack flex={1}>
                                                    <Text fontWeight="$bold" color={COLORS.textPrimary}>
                                                        Order #{order.id.slice(0, 8)}
                                                    </Text>
                                                    <Text size="sm" color={COLORS.textSecondary} mt="$1">
                                                        {order.product?.title || 'Product'}
                                                    </Text>
                                                    <HStack mt="$2" space="xs" alignItems="center">
                                                        {getOrderStatusIcon(order.status)}
                                                        <Text 
                                                            size="xs" 
                                                            fontWeight="$bold"
                                                            color={getOrderStatusColor(order.status)}
                                                            textTransform="uppercase"
                                                        >
                                                            {order.status}
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                                <VStack alignItems="flex-end">
                                                    <Text fontWeight="$black" color={COLORS.textPrimary} size="lg">
                                                        ${order.totalAmount || order.total_amount || '0'}
                                                    </Text>
                                                    <Text size="xs" color={COLORS.textMuted}>
                                                        {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                                                    </Text>
                                                </VStack>
                                            </HStack>

                                            {/* Order Actions */}
                                            {(order.status === "pending" || order.status === "paid") && (
                                                <Button
                                                    size="sm"
                                                    bg={COLORS.primaryGold}
                                                    mt="$3"
                                                    onPress={() => handleUpdateOrderStatus(order.id, "shipped")}
                                                >
                                                    <HStack space="xs" alignItems="center">
                                                        <Truck size={16} color={COLORS.luxuryBlack} />
                                                        <ButtonText color={COLORS.luxuryBlack}>Mark as Shipped</ButtonText>
                                                    </HStack>
                                                </Button>
                                            )}
                                            {order.status === "shipped" && (
                                                <Button
                                                    size="sm"
                                                    bg={COLORS.successGreen}
                                                    mt="$3"
                                                    onPress={() => handleUpdateOrderStatus(order.id, "completed")}
                                                >
                                                    <HStack space="xs" alignItems="center">
                                                        <CheckCircle size={16} color={COLORS.luxuryBlack} />
                                                        <ButtonText color={COLORS.luxuryBlack}>Mark as Completed</ButtonText>
                                                    </HStack>
                                                </Button>
                                            )}
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
