import React, { memo, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { getProductImage, isValidImageUrl } from "@/lib/utils/imageUtils";
import { COLORS } from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ProductFeedCardProps {
    product: any;
}

const ProductFeedCard = memo(({ product }: ProductFeedCardProps) => {
    const router = useRouter();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const sellerId = product.seller?.id || product.sellerId || product.seller_id;

    // Get validated image URL
    const imageUrl = getProductImage(product);
    const hasValidImage = isValidImageUrl(imageUrl) && !imageError;

    const handleImageLoad = useCallback(() => {
        setImageLoading(false);
    }, []);

    const handleImageError = useCallback(() => {
        setImageLoading(false);
        setImageError(true);
    }, []);

    return (
        <TouchableOpacity
            onPress={() => router.push(`/product/${product.id}`)}
            activeOpacity={0.9}
            style={{
                backgroundColor: COLORS.cardBackground,
                borderRadius: 16,  // 200
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: COLORS.darkBorder,
                width: '100%',
                aspectRatio: 0.7,
                shadowColor: COLORS.luxuryBlack,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            {/* Thumbnail */}
            <View className="flex-1 bg-gray-50 relative">
                {hasValidImage ? (
                    <>
                        <Image
                            source={{ uri: imageUrl! }}
                            className="w-full h-full"
                            resizeMode="cover"
                            progressiveRenderingEnabled
                            fadeDuration={300}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                        {imageLoading && (
                            <View className="absolute inset-0 items-center justify-center bg-gray-100">
                                <ActivityIndicator size="small" color={COLORS.primaryGold} />
                            </View>
                        )}
                    </>
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Text className="text-gray-300 font-bold text-[10px] uppercase tracking-widest">No Image</Text>
                    </View>
                )}

                {/* Product Badge - Yellow accent */}
                <View className="absolute top-3 left-3">
                    <View
                        style={{
                            backgroundColor: COLORS.primaryGold,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 9999,  // Full rounded
                        }}
                    >
                        <Text className="text-black text-[10px] font-black uppercase tracking-tighter">
                            PRODUCT
                        </Text>
                    </View>
                </View>

                {/* Price Badge - Yellow accent */}
                {product.price && (
                    <View
                            style={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                backgroundColor: COLORS.primaryGold,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 9999,  // Full rounded
                            }}
                    >
                        <Text className="text-black text-xs font-bold">
                            ${product.price}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info Section */}
            <View
                style={{
                    padding: 16,
                    backgroundColor: COLORS.cardBackground,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.darkBorder,
                }}
            >
                <Text
                    numberOfLines={1}
                    style={{
                        color: COLORS.textPrimary,
                        fontSize: 14,
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        marginBottom: 2,
                    }}
                >
                    {product.title || "Untitled"}
                </Text>

                <TouchableOpacity
                    onPress={() => sellerId && router.push(`/user/${sellerId}`)}
                    activeOpacity={0.7}
                    className="flex-row items-center"
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            color: COLORS.textSecondary,
                            fontSize: 11,
                            fontWeight: '500',
                        }}
                    >
                        @{product.seller?.username || "unknown"}
                    </Text>
                    <View
                        style={{
                            width: 4,
                            height: 4,
                            backgroundColor: COLORS.primaryGold,
                            borderRadius: 2,
                            marginLeft: 6,
                        }}
                    />
                </TouchableOpacity>

                {product.condition && (
                    <Text
                        style={{
                            color: COLORS.textPrimary,
                            fontSize: 10,
                            fontWeight: '700',
                            marginTop: 8,
                            textTransform: 'uppercase',
                        }}
                    >
                        {product.condition.replace('_', ' ')}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return prev.product.id === next.product.id;
});

export default ProductFeedCard;
