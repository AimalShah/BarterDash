import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import {
    Box,
    Text,
    VStack,
    HStack,
    Center,
    Spinner,
} from "@gluestack-ui/themed";
import { Star } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

import { reviewsService, Review as ReviewType } from "@/lib/api/services/reviews";

export function ReviewsTab({ userId }: { userId: string }) {
    const [reviews, setReviews] = useState<ReviewType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [userId]);

    const fetchReviews = async () => {
        try {
            const data = await reviewsService.getSellerReviews(userId);
            setReviews(data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: ReviewType }) => (
        <Box
            bg={COLORS.luxuryBlackLight}
            p="$4"
            mb="$3"
            rounded="$xl"
            borderWidth={1}
            borderColor={COLORS.darkBorder}
        >
            <HStack justifyContent="space-between" mb="$2">
                <Text fontWeight="$bold" color={COLORS.textPrimary}>@{item.reviewer.username}</Text>
                <HStack alignItems="center" space="xs">
                    <Star size={14} color={COLORS.warningAmber} fill={COLORS.warningAmber} />
                    <Text fontWeight="$bold" color={COLORS.textPrimary}>{item.rating}</Text>
                </HStack>
            </HStack>
            <Text color={COLORS.textSecondary}>{item.comment}</Text>
            <Text color={COLORS.textMuted} size="xs" mt="$2">
                {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </Box>
    );

    if (loading) {
        return (
            <Center py="$10">
                <Spinner size="large" color={COLORS.textPrimary} />
            </Center>
        );
    }

    if (reviews.length === 0) {
        return (
            <Center py="$10">
                <Text color={COLORS.textSecondary}>No reviews yet.</Text>
            </Center>
        );
    }

    return (
        <FlatList
            data={reviews}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24 }}
            scrollEnabled={false}
        />
    );
}
