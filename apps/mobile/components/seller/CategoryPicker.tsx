import React, { useState } from "react";
import { Box, ScrollView, HStack, Pressable, Text } from "@gluestack-ui/themed";
import { Plus } from "lucide-react-native";
import { CategoryDrawer } from "./CategoryDrawer";
import { Category } from "../../lib/api/services/categories";
import { COLORS } from "../../constants/colors";

interface CategoryPickerProps {
    categories: Category[];
    selectedCategory: string | null;
    onSelectCategory: (id: string) => void;
    onCategoryCreated: (category: Category) => void;
}

export function CategoryPicker({
    categories,
    selectedCategory,
    onSelectCategory,
    onCategoryCreated,
}: CategoryPickerProps) {
    const [drawerVisible, setDrawerVisible] = useState(false);

    return (
        <Box>
            <Text
                color={COLORS.textPrimary}
                size="2xs"
                fontWeight="$black"
                mb="$4"
                textTransform="uppercase"
                letterSpacing={1.5}
            >
                CATEGORY
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
            >
                <HStack space="md">
                    {categories.map((cat) => (
                        <Pressable
                            key={cat.id}
                            onPress={() => onSelectCategory(cat.id)}
                            px="$6"
                            h={40}
                            rounded="$sm"
                            borderWidth={1}
                            borderColor={COLORS.darkBorder}
                            bg={selectedCategory === cat.id ? COLORS.primaryGold : "transparent"}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text
                                fontWeight="$black"
                                color={selectedCategory === cat.id ? COLORS.luxuryBlack : COLORS.textPrimary}
                                size="xs"
                                textTransform="uppercase"
                            >
                                {cat.name}
                            </Text>
                        </Pressable>
                    ))}
                    
                    {/* Add Category Button */}
                    <Pressable
                        onPress={() => setDrawerVisible(true)}
                        px="$4"
                        h={40}
                        rounded="$sm"
                        borderWidth={1}
                        borderColor={COLORS.darkBorder}
                        bg="transparent"
                        alignItems="center"
                        justifyContent="center"
                        flexDirection="row"
                    >
                        <Plus size={16} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                        <Text
                            fontWeight="$black"
                            color={COLORS.textPrimary}
                            size="xs"
                            textTransform="uppercase"
                        >
                            Add
                        </Text>
                    </Pressable>
                </HStack>
            </ScrollView>

            {/* Category Drawer */}
            <CategoryDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                onCategoryCreated={onCategoryCreated}
            />
        </Box>
    );
}
