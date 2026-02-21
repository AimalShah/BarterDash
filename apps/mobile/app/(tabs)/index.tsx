import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { HeroBanner } from '@/components/home/HeroBanner';
import HomeHeader from '@/components/home/HomeHeader';
import { ProductGrid } from '@/components/home/ProductGrid';
import { StreamGrid } from '@/components/home/StreamGrid';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useCategories, useProducts, useStreams } from '@/hooks';
import { queryKeys } from '@/lib/api/queryKeys';
import type { HomeProduct } from '@/components/home/ProductCard';
import type { HomeStream } from '@/components/home/StreamCard';

type HomeTab = 'shows' | 'products';

function HomeLoadingState() {
  return (
    <View className="flex-1 px-4 pb-24 pt-4">
      <View className="flex-row">
        <View className="w-1/2 px-2 pb-3">
          <SkeletonCard />
        </View>
        <View className="w-1/2 px-2 pb-3">
          <SkeletonCard />
        </View>
      </View>
      <View className="flex-row">
        <View className="w-1/2 px-2 pb-3">
          <SkeletonCard />
        </View>
        <View className="w-1/2 px-2 pb-3">
          <SkeletonCard />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<HomeTab>('shows');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoriesQuery = useCategories();
  const streamsQuery = useStreams({
    category_id: selectedCategory === 'all' ? undefined : selectedCategory,
  });
  const productsQuery = useProducts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const categories = useMemo(
    () => [
      { id: 'all', name: 'All' },
      ...(categoriesQuery.data || []).map((category) => ({
        id: String(category.id),
        name: category.name,
      })),
    ],
    [categoriesQuery.data]
  );

  const streams = useMemo<HomeStream[]>(
    () =>
      (streamsQuery.data || [])
        .filter((stream) => stream.status === 'live' || stream.status === 'scheduled')
        .sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (a.status !== 'live' && b.status === 'live') return 1;

          const first = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
          const second = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
          return first - second;
        }),
    [streamsQuery.data]
  );

  const products = useMemo<HomeProduct[]>(() => productsQuery.data || [], [productsQuery.data]);

  const isLoading = activeTab === 'shows' ? streamsQuery.isLoading : productsQuery.isLoading;
  const isRefreshing = activeTab === 'shows' ? streamsQuery.isRefetching : productsQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: queryKeys.streams }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
    ]);
  }, [queryClient]);

  return (
    <View className="flex-1 bg-background">
      <HomeHeader />
      <HeroBanner />

      <View className="mt-5 flex-row px-6">
        <Pressable
          onPress={() => setActiveTab('shows')}
          className={`mr-4 border-b-2 pb-2 ${
            activeTab === 'shows' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text className={activeTab === 'shows' ? 'text-primary' : 'text-secondary'}>
            Shows
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('products')}
          className={`border-b-2 pb-2 ${
            activeTab === 'products' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text className={activeTab === 'products' ? 'text-primary' : 'text-secondary'}>
            Products
          </Text>
        </Pressable>
      </View>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {isLoading ? <HomeLoadingState /> : null}

      {!isLoading && activeTab === 'shows' ? (
        <StreamGrid
          streams={streams}
          onStreamPress={(id) => router.push(`/stream/${id}`)}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      ) : null}

      {!isLoading && activeTab === 'products' ? (
        <ProductGrid
          products={products}
          onProductPress={(id) => router.push(`/product/${id}`)}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      ) : null}
    </View>
  );
}
