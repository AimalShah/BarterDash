import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface HomeCategory {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: HomeCategory[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <View className="mt-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-6"
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => onSelectCategory(category.id)}
              className={cn(
                'mr-2 rounded-full border px-4 py-2',
                isActive ? 'border-primary bg-primary' : 'border-border bg-card'
              )}
            >
              <Text
                className={cn(
                  'text-xs',
                  isActive ? 'text-white' : 'text-secondary'
                )}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
