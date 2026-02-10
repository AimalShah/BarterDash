import React from 'react';
import { Box, HStack, Text, Pressable, Center } from "@gluestack-ui/themed";
import { COLORS } from "@/constants/colors";

interface UserSectionItemProps {
    icon: any;
    label: string;
    count: string;
    onPress: () => void;
}

export const UserSectionItem = ({ icon, label, count, onPress }: UserSectionItemProps) => (
    <Pressable
        onPress={onPress}
        p="$4"
        bg={COLORS.luxuryBlackLight}
        rounded="$2xl"
        borderWidth={1}
        borderColor={COLORS.darkBorder}
        sx={{
            ":active": { bg: COLORS.luxuryBlackLighter }
        }}
    >
        <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space="md">
                <Center h="$10" w="$10" rounded="$xl" bg={COLORS.darkSurface}>
                    {icon}
                </Center>
                <Text color={COLORS.textPrimary} fontWeight="$semibold" size="lg">{label}</Text>
            </HStack>
            <Box bg={COLORS.darkSurface} px="$3" py="$1" rounded="$lg">
                <Text color={COLORS.primaryGold} fontWeight="$bold">{count}</Text>
            </Box>
        </HStack>
    </Pressable>
);
