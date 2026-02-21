import { FlatList, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { StreamCard, type HomeStream } from './StreamCard';

interface StreamGridProps {
  streams: HomeStream[];
  onStreamPress: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function StreamGrid({
  streams,
  onStreamPress,
  refreshing,
  onRefresh,
}: StreamGridProps) {
  return (
    <FlatList
      data={streams}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerClassName="px-4 pb-28 pt-4"
      renderItem={({ item }) => (
        <View className="w-1/2 px-2 pb-3">
          <StreamCard stream={item} onPress={onStreamPress} />
        </View>
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View className="items-center px-4 py-10">
          <Text variant="h3" className="text-center">
            No streams right now
          </Text>
          <Text color="secondary" className="mt-2 text-center">
            Check back soon or switch category.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
