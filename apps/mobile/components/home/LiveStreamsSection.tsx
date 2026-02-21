import React from "react";
import { Box, HStack, Heading, Text, FlatList } from "@/components/ui/reusables";
import { Animated } from "react-native";
import StreamCard from "../stream/StreamCard";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface LiveStreamsSectionProps {
    liveStreams: any[];
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
}

export const LiveStreamsSection = ({
    liveStreams,
    fadeAnim,
    slideAnim,
}: LiveStreamsSectionProps) => {
    const { width, isTablet, horizontalPadding } = useResponsiveLayout();
    if (!liveStreams || liveStreams.length === 0) return null;
    const cardWidth = isTablet ? Math.min(width * 0.5, 360) : width * 0.75;

    const renderLiveItem = ({ item }: { item: any }) => (
        <Box w={cardWidth} mr="$3">
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <StreamCard stream={item} isLive={true} />
            </Animated.View>
        </Box>
    );

    return (
        <Box mt="$6" mb="$8">
            <HStack
                mb="$4"
                justifyContent="space-between"
                alignItems="center"
                style={{ paddingHorizontal: horizontalPadding }}
            >
                <HStack alignItems="center">
                    <Box
                        height={8}
                        width={8}
                        bg={COLORS.liveIndicator}
                        rounded="$full"
                        mr="$2"
                    />
                    <Heading color={COLORS.textPrimary} size="md" fontWeight="$extrabold" style={{ letterSpacing: -0.5 }}>
                        LIVE AUCTIONS
                    </Heading>
                </HStack>
            </HStack>
            <FlatList
                data={liveStreams}
                keyExtractor={(item: any) => item.id}
                renderItem={renderLiveItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: horizontalPadding }}
            />
        </Box>
    );
};
