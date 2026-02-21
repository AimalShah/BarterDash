import { Image, Pressable, View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants/colors';

export interface HomeStream {
  id: string;
  title: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledStart?: string | null;
  viewerCount?: number;
  thumbnailUrl?: string | null;
  seller?: {
    username?: string;
    avatarUrl?: string | null;
  };
}

interface StreamCardProps {
  stream: HomeStream;
  onPress: (id: string) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop';

export function StreamCard({ stream, onPress }: StreamCardProps) {
  const isLive = stream.status === 'live';

  return (
    <Pressable
      onPress={() => onPress(stream.id)}
      className="rounded-2xl border border-border bg-card"
    >
      <Image
        source={{ uri: stream.thumbnailUrl || FALLBACK_IMAGE }}
        className="h-36 w-full rounded-t-2xl"
        resizeMode="cover"
      />
      <View className="px-3 pb-3 pt-2">
        <View className="mb-2 flex-row items-center justify-between">
          <View
            className={`rounded-full px-2 py-1 ${isLive ? 'bg-error' : 'bg-primary-soft'}`}
          >
            <Text
              className={`text-[10px] ${isLive ? 'text-white' : 'text-secondary'}`}
            >
              {isLive ? 'LIVE' : 'Scheduled'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Eye size={12} color={COLORS.mutedBlueGrey} />
            <Text color="muted" className="ml-1 text-xs">
              {stream.viewerCount || 0}
            </Text>
          </View>
        </View>
        <Text className="text-sm" numberOfLines={2}>
          {stream.title}
        </Text>
        <Text color="muted" className="mt-1 text-xs">
          @{stream.seller?.username || 'seller'}
        </Text>
      </View>
    </Pressable>
  );
}
