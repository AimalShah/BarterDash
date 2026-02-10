import React from "react";
import { Box, HStack, VStack, Text, Heading, Pressable, Center, Image } from "@gluestack-ui/themed";
import { Layers, MoveVertical, Plus, ClipboardCheck } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

interface InventoryItem {
    id: string;
    title: string;
    price: number;
    image?: string;
    status: 'ready' | 'sold' | 'active';
}

interface InventoryQueueProps {
    items: InventoryItem[];
    onReorder: () => void;
    onAddItem: () => void;
}

export const InventoryQueue = ({ items, onReorder, onAddItem }: InventoryQueueProps) => {
    return (
        <Box mt="$12">
            <HStack justifyContent="space-between" alignItems="center" mb="$6">
                <HStack space="xs" alignItems="center">
                    <Layers size={18} color={COLORS.textPrimary} />
                    <Text size="2xs" fontWeight="$black" color={COLORS.textSecondary} textTransform="uppercase" letterSpacing={1.5}>INVENTORY QUEUE ({items.length})</Text>
                </HStack>
                <Pressable onPress={onReorder}>
                    <Text size="xs" color={COLORS.textPrimary} fontWeight="$black" textTransform="uppercase">REORDER</Text>
                </Pressable>
            </HStack>

            <VStack space="md">
                {items.map((item) => (
                    <Box
                        key={item.id}
                        bg={COLORS.cardBackground}
                        p="$4"
                        rounded="$sm"
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                    >
                        <HStack space="md" alignItems="center">
                            <Box h={64} w={64} bg={COLORS.darkSurface} borderWidth={1} borderColor={COLORS.darkBorder} rounded="$sm" overflow="hidden">
                                {item.image ? (
                                    <Image source={{ uri: item.image }} alt={item.title} w="100%" h="100%" resizeMode="cover" />
                                ) : (
                                    <Center h="100%"><ClipboardCheck size={20} color={COLORS.textPrimary} /></Center>
                                )}
                            </Box>
                            <VStack flex={1}>
                                <Text size="md" fontWeight="$black" color={COLORS.textPrimary} numberOfLines={1} textTransform="uppercase">{item.title}</Text>
                                <Text size="sm" color={COLORS.textSecondary} fontWeight="$black">${item.price}</Text>
                            </VStack>
                            <Pressable p="$2">
                                <MoveVertical size={18} color={COLORS.textPrimary} />
                            </Pressable>
                        </HStack>
                    </Box>
                ))}

                <Pressable
                    onPress={onAddItem}
                    h={60}
                    rounded="$sm"
                    borderWidth={1}
                    borderColor={COLORS.darkBorder}
                    alignItems="center"
                    justifyContent="center"
                    bg={COLORS.darkSurface}
                >
                    <HStack space="xs" alignItems="center">
                        <Plus size={20} color={COLORS.textPrimary} />
                        <Text color={COLORS.textPrimary} fontWeight="$black" size="xs" textTransform="uppercase">ADD ITEM TO QUEUE</Text>
                    </HStack>
                </Pressable>
            </VStack>
        </Box>
    );
};
