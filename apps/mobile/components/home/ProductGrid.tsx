import { FlatList, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ProductCard, type HomeProduct } from './ProductCard';

interface ProductGridProps {
  products: HomeProduct[];
  onProductPress: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function ProductGrid({
  products,
  onProductPress,
  refreshing,
  onRefresh,
}: ProductGridProps) {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerClassName="px-4 pb-28 pt-4"
      renderItem={({ item }) => (
        <View className="w-1/2 px-2 pb-3">
          <ProductCard product={item} onPress={onProductPress} />
        </View>
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View className="items-center px-4 py-10">
          <Text variant="h3" className="text-center">
            No products found
          </Text>
          <Text color="secondary" className="mt-2 text-center">
            Try another category filter.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
