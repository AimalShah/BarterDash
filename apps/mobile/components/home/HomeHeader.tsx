import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, MessageCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';

export default function HomeHeader() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const { unreadCount } = useNotifications(userId);
  const { unreadMessagesCount } = useUnreadMessages(userId);
  const hasUnread = unreadCount > 0 || unreadMessagesCount > 0;

  return (
    <View className="flex-row items-center justify-between px-6 pb-4 pt-3">
      <View>
        <Text color="muted" className="text-xs uppercase tracking-[1px]">
          Live Marketplace
        </Text>
        <Text variant="h2" className="mt-1">
          BarterDash
        </Text>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
          onPress={() => router.push('/(tabs)/inbox')}
        >
          <MessageCircle size={20} color={COLORS.secondaryDark} />
        </Pressable>
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
          onPress={() => router.push('/notifications')}
        >
          <Bell size={20} color={COLORS.secondaryDark} />
          {hasUnread ? (
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
