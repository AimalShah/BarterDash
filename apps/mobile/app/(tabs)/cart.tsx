import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Alert,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Trash2, ShoppingCart, Minus, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cartService } from "../../lib/api/services/cart";
import { CartItem, CartTotal } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");

export default function CartScreen() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartTotal, setCartTotal] = useState<CartTotal | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { profile } = useAuthStore();

    const fetchCart = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('[Cart] Fetching cart...');
            const items = await cartService.getCart();
            console.log('[Cart] Fetched items:', items.length);
            setCartItems(items);

            if (items.length > 0) {
                try {
                    const total = await cartService.calculateTotal();
                    setCartTotal(total);
                } catch (totalError: any) {
                    console.error("[Cart] Failed to calculate cart total:", totalError);
                    const errorMessage = totalError?.response?.data?.error?.message 
                        || "Failed to calculate cart total. Some items may be unavailable.";
                    setError(errorMessage);
                    setCartTotal(null);
                }
            } else {
                setCartTotal(null);
            }
        } catch (error: any) {
            console.error("[Cart] Failed to fetch cart:", error);
            
            const statusCode = error?.response?.status;
            const errorData = error?.response?.data;
            const errorMessage = errorData?.error?.message || error?.message;
            
            console.log('[Cart] Error details:', {
                statusCode,
                errorData,
                errorMessage,
                fullError: error
            });
            
            let displayError = "Failed to load your cart. Please try again.";
            
            if (statusCode === 400) {
                if (errorMessage?.includes("not available")) {
                    displayError = "Some items in your cart are no longer available.";
                } else if (errorMessage?.includes("stock")) {
                    displayError = "Some items exceed available stock.";
                } else if (errorMessage) {
                    displayError = errorMessage;
                } else {
                    displayError = "Invalid cart data. Please refresh.";
                }
            } else if (statusCode === 401) {
                displayError = "Please sign in again to view your cart.";
            } else if (statusCode === 500) {
                displayError = "Server error. Please try again later.";
            }
            
            setError(displayError);
            setCartItems([]);
            setCartTotal(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCart();
        setRefreshing(false);
    };

    const handleUpdateQuantity = async (
        cartItemId: string,
        newQuantity: number,
    ) => {
        try {
            await cartService.updateQuantity(cartItemId, newQuantity);
            await fetchCart();
        } catch (error: any) {
            const statusCode = error?.response?.status;
            const errorMessage = error?.response?.data?.error?.message;
            
            if (statusCode === 400) {
                if (errorMessage?.includes("stock")) {
                    Alert.alert("Stock Limit", "Requested quantity exceeds available stock.");
                } else if (errorMessage?.includes("not available")) {
                    Alert.alert("Item Unavailable", "This product is no longer available.");
                } else {
                    Alert.alert("Error", errorMessage || "Failed to update quantity");
                }
            } else {
                Alert.alert("Error", "Failed to update quantity. Please try again.");
            }
        }
    };

    const handleRemoveItem = async (cartItemId: string) => {
        try {
            await cartService.removeItem(cartItemId);
            await fetchCart();
        } catch (error) {
            Alert.alert("Error", "Failed to remove item");
        }
    };

    const handleClearCart = async () => {
        Alert.alert("Clear Cart", "Are you sure you want to clear your cart?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Clear",
                style: "destructive",
                onPress: async () => {
                    try {
                        await cartService.clearCart();
                        await fetchCart();
                    } catch (error) {
                        Alert.alert("Error", "Failed to clear cart");
                    }
                },
            },
        ]);
    };

    const handleCheckout = () => {
        router.push("/(tabs)/checkout");
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>LOADING BAG...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state if there's an error
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.emptyHeader}>
                    <Text style={styles.pageTitle}>YOUR BAG</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <ShoppingCart size={64} color={COLORS.liveIndicator} />
                    <Text style={styles.emptyTitle}>CART ERROR</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={fetchCart}
                        accessible={true}
                        accessibilityLabel="Retry loading cart"
                        accessibilityHint="Attempts to reload your shopping cart"
                        accessibilityRole="button"
                        testID="cart-retry-button"
                    >
                        <LinearGradient
                            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.shopButtonText}>RETRY</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.emptyHeader}>
                    <Text style={styles.pageTitle}>YOUR BAG</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <ShoppingCart size={64} color={COLORS.textPrimary} />
                    <Text style={styles.emptyTitle}>YOUR BAG IS EMPTY</Text>
                    <Text style={styles.emptySubtitle}>
                        Looks like you haven't added any items to your bag yet.
                    </Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => router.push("/")}
                        accessible={true}
                        accessibilityLabel="Start shopping"
                        accessibilityHint="Navigate to home screen to browse products"
                        accessibilityRole="button"
                        testID="cart-shop-button"
                    >
                        <LinearGradient
                            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.shopButtonText}>START SHOPPING</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.pageTitle}>YOUR BAG</Text>
                <TouchableOpacity 
                    onPress={handleClearCart}
                    accessible={true}
                    accessibilityLabel="Clear all items from cart"
                    accessibilityHint="Removes all items from your shopping cart"
                    accessibilityRole="button"
                    testID="cart-clear-all-button"
                >
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primaryGold}
                    />
                }
            >
                <View style={styles.itemsContainer}>
                    {cartItems.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemRow}>
                                {/* Product Image */}
                                <View style={styles.imageContainer}>
                                    {item.product.images && item.product.images[0] ? (
                                        <Image
                                            source={{ uri: item.product.images[0] }}
                                            style={styles.productImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.noImage}>
                                            <Text style={styles.noImageText}>NO IMG</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Product Info */}
                                <View style={styles.infoContainer}>
                                    <Text style={styles.productTitle} numberOfLines={2}>
                                        {item.product.title}
                                    </Text>
                                    <Text style={styles.productPrice}>
                                        $ {item.product.price}
                                    </Text>

                                    {/* Quantity Controls */}
                                    <View style={styles.controlsRow}>
                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() =>
                                                    handleUpdateQuantity(
                                                        item.id,
                                                        Math.max(1, item.quantity - 1),
                                                    )
                                                }
                                                accessible={true}
                                                accessibilityLabel={`Decrease quantity of ${item.product.title}`}
                                                accessibilityHint="Reduces item quantity by one"
                                                accessibilityRole="button"
                                                testID={`cart-decrease-quantity-${item.id}`}
                                            >
                                                <Minus size={16} color={COLORS.textPrimary} />
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                style={styles.quantityButton}
                                                onPress={() =>
                                                    handleUpdateQuantity(item.id, item.quantity + 1)
                                                }
                                                accessible={true}
                                                accessibilityLabel={`Increase quantity of ${item.product.title}`}
                                                accessibilityHint="Increases item quantity by one"
                                                accessibilityRole="button"
                                                testID={`cart-increase-quantity-${item.id}`}
                                            >
                                                <Plus size={16} color={COLORS.textPrimary} />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveItem(item.id)}
                                            accessible={true}
                                            accessibilityLabel={`Remove ${item.product.title} from cart`}
                                            accessibilityHint="Removes this item from your shopping cart"
                                            accessibilityRole="button"
                                            testID={`cart-remove-item-${item.id}`}
                                        >
                                            <Trash2 size={20} color={COLORS.liveIndicator} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Checkout Footer */}
            {cartTotal && (
                <View style={styles.footer}>
                    <View style={styles.totalContainer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>
                                ${cartTotal.subtotal.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Shipping</Text>
                            <Text style={styles.totalValue}>
                                ${cartTotal.shipping.toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <Text style={styles.grandTotalLabel}>Total</Text>
                            <Text style={styles.grandTotalValue}>
                                ${cartTotal.total.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                        accessible={true}
                        accessibilityLabel="Proceed to checkout"
                        accessibilityHint="Continue to payment and shipping information"
                        accessibilityRole="button"
                        testID="cart-checkout-button"
                    >
                        <LinearGradient
                            colors={[COLORS.primaryGold, COLORS.secondaryGold]}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.checkoutButtonText}>PROCEED TO CHECKOUT</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.luxuryBlack,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    emptyHeader: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: "900",
        marginTop: 32,
        marginBottom: 8,
        textTransform: "uppercase",
        textAlign: "center",
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
    },
    pageTitle: {
        color: COLORS.textPrimary,
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -1,
    },
    clearText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    scrollView: {
        flex: 1,
    },
    itemsContainer: {
        paddingHorizontal: 24,
    },
    itemCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        padding: 16,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: "row",
        gap: 16,
    },
    imageContainer: {
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
    },
    productImage: {
        width: "100%",
        height: "100%",
    },
    noImage: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.luxuryBlackLight,
        justifyContent: "center",
        alignItems: "center",
    },
    noImageText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: "700",
    },
    infoContainer: {
        flex: 1,
        justifyContent: "space-between",
    },
    productTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    productPrice: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    controlsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 8,
    },
    quantityButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    quantityText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "700",
        paddingHorizontal: 12,
    },
    removeButton: {
        padding: 8,
    },
    bottomPadding: {
        height: 200,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.darkBorder,
        padding: 24,
        backgroundColor: COLORS.luxuryBlack,
    },
    totalContainer: {
        marginBottom: 20,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    totalLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    totalValue: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
    grandTotalRow: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.darkBorder,
    },
    grandTotalLabel: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: "900",
        textTransform: "uppercase",
    },
    grandTotalValue: {
        color: COLORS.primaryGold,
        fontSize: 24,
        fontWeight: "900",
    },
    shopButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    checkoutButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    shopButtonText: {
        color: COLORS.luxuryBlack,
        fontSize: 14,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    checkoutButtonText: {
        color: COLORS.luxuryBlack,
        fontSize: 14,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});
