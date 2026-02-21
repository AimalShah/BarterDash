import { Image, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

export interface HomeProduct {
  id: string;
  title: string;
  price?: number | string;
  images?: string[];
  seller?: {
    username?: string;
    avatar_url?: string | null;
  };
}

interface ProductCardProps {
  product: HomeProduct;
  onPress: (id: string) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop';

export function ProductCard({ product, onPress }: ProductCardProps) {
  const rawPrice = typeof product.price === 'string' ? Number(product.price) : product.price;
  const formattedPrice = Number.isFinite(rawPrice) ? `$${rawPrice}` : '--';

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      className="rounded-2xl border border-border bg-card"
    >
      <Image
        source={{ uri: product.images?.[0] || FALLBACK_IMAGE }}
        className="h-36 w-full rounded-t-2xl"
        resizeMode="cover"
      />
      <View className="px-3 pb-3 pt-2">
        <Text className="text-sm" numberOfLines={2}>
          {product.title}
        </Text>
        <Text className="mt-1 text-sm text-primary">{formattedPrice}</Text>
        <Text color="muted" className="mt-1 text-xs">
          @{product.seller?.username || 'seller'}
        </Text>
      </View>
    </Pressable>
  );
}
