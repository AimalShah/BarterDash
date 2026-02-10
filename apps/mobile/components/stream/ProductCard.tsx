import React from 'react';
import {
    Box,
    HStack,
    VStack,
    Text,
    Heading,
    Button,
    ButtonText,
    Image,
    Pressable,
    Center,
    Spinner
} from "@gluestack-ui/themed";
import { COLORS } from "@/constants/colors";

interface ProductCardProps {
    title: string;
    price: number | string;
    image?: string;
    onBid: () => void;
    onBuy?: () => void;
    bidLoading?: boolean;
    buyLoading?: boolean;
}

export const ProductCard = ({ title, price, image, onBid, onBuy, bidLoading, buyLoading }: ProductCardProps) => {
    return (
        <Box
            bg={COLORS.cardBackground}
            p="$3"
            rounded="$2xl"
            shadowColor={COLORS.luxuryBlack}
            shadowOpacity={0.3}
            shadowRadius={10}
            elevation={5}
            mx="$4"
            mb="$4"
            borderWidth={1}
            borderColor={COLORS.darkBorder}
        >
            <HStack space="md" alignItems="center">
                <Box h="$16" w="$16" bg={COLORS.darkSurface} rounded="$lg" overflow="hidden">
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            alt={title}
                            h="100%"
                            w="100%"
                            resizeMode="cover"
                        />
                    ) : (
                        <Center h="100%" w="100%" bg={COLORS.luxuryBlackLighter}>
                            <Text size="xs" color={COLORS.textSecondary}>No Image</Text>
                        </Center>
                    )}
                </Box>

                <VStack flex={1}>
                    <Heading size="xs" color={COLORS.textPrimary} numberOfLines={1}>{title}</Heading>
                    <Text size="sm" color={COLORS.primaryGold} fontWeight="$bold">
                        ${typeof price === 'number' ? price.toFixed(2) : price}
                    </Text>
                </VStack>

                <VStack space="xs">
                    {onBuy && (
                        <Button
                            size="xs"
                            variant="solid"
                            action="positive"
                            bg={COLORS.successGreen}
                            rounded="$lg"
                            h="$8"
                            onPress={onBuy}
                            isDisabled={buyLoading}
                        >
                            {buyLoading ? <Spinner size="small" color={COLORS.textPrimary} /> : <ButtonText size="xs" fontWeight="$bold">BUY</ButtonText>}
                        </Button>
                    )}
                    <Button
                        size="xs"
                        variant="solid"
                        action="primary"
                        bg={COLORS.primaryGold}
                        rounded="$lg"
                        h="$8"
                        onPress={onBid}
                        isDisabled={bidLoading}
                    >
                        {bidLoading ? <Spinner size="small" color={COLORS.luxuryBlack} /> : <ButtonText size="xs" fontWeight="$bold" color={COLORS.luxuryBlack}>BID +$5</ButtonText>}
                    </Button>
                </VStack>
            </HStack>
        </Box>
    );
};
