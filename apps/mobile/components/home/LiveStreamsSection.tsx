import React from "react";
import { Box, HStack, Heading, Text, FlatList } from "@gluestack-ui/themed";
import { Zap } from "lucide-react-native";
import { Animated, Dimensions } from "react-native";
import StreamCard from "../stream/StreamCard";
import { COLORS } from "@/constants/colors";

const { width } = Dimensions.get("window");

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
    if (!liveStreams || liveStreams.length === 0) return null;

    const renderLiveItem = ({ item }: { item: any }) => (
        <Box px="$2" w={width * 0.75}>
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
            <HStack px="$6" mb="$4" justifyContent="space-between" alignItems="center">
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
                snapToInterval={width * 0.75}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </Box>
    );
};
