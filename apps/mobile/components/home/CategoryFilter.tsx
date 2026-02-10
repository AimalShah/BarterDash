import React from "react";
import { Box, ScrollView, Pressable, Text } from "@gluestack-ui/themed";
import { COLORS } from "@/constants/colors";

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  return (
    <Box pt="$3" borderBottomWidth={1} borderColor={COLORS.darkBorder} bg={COLORS.luxuryBlack}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {categories.map((category) => (
          <Pressable
            key={String(category.id)}
            onPress={() => onSelectCategory(String(category.id))}
            mr="$1"
            px="$6"
            py="$1"
            rounded={0}
            borderBottomWidth={selectedCategory === String(category.id) ? 2 : 0}
            borderColor={
              selectedCategory === String(category.id) ? COLORS.primaryGold : COLORS.darkBorder
            }
            sx={{
              ":active": { transform: [{ scale: 0.95 }] },
            }}
          >
            <Text
              size="sm"
              fontWeight={
                selectedCategory === String(category.id) ? "$bold" : "$normal"
              }
              color={
                selectedCategory === String(category.id)
                  ? COLORS.textPrimary
                  : COLORS.textSecondary
              }
            >
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Box>
  );
};
