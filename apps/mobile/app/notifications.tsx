import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, Bell, Gift, MessageCircle, Settings } from 'lucide-react-native';
import { notificationsService, Notification } from '@/lib/api/services/notifications';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchEmpty } from '@/components/design';

function iconForType(type: string) {
  switch (type) {
    case 'message':
      return <MessageCircle size={18} color={COLORS.primaryBlue} />;
    case 'order':
      return <Gift size={18} color={COLORS.primaryBlue} />;
    case 'alert':
      return <AlertCircle size={18} color={COLORS.primaryBlue} />;
    default:
      return <Bell size={18} color={COLORS.primaryBlue} />;
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState<'all' | 'activity' | 'messages'>('all');

  useEffect(() => {
    void fetchNotifications();
    void notificationsService.markAllAsRead().catch(() => undefined);
  }, []);

  async function fetchNotifications(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await notificationsService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onPressNotification(item: Notification) {
    if (!item.isRead) {
      try {
        await notificationsService.markAsRead(item.id);
        setNotifications((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      } catch (error) {
        // ignore
      }
    }

    if (item.actionUrl?.startsWith('/')) {
      router.push(item.actionUrl as any);
      return;
    }

    if (item.type === 'message') {
      router.push('/(tabs)/inbox');
    }
  }

  const filtered = useMemo(() => {
    if (segment === 'all') return notifications;
    if (segment === 'messages') return notifications.filter((item) => item.type === 'message');
    return notifications.filter((item) => item.type !== 'message');
  }, [segment, notifications]);

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchNotifications(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="Notifications"
        subtitle="Alerts and activity"
        onBack={() => router.back()}
        rightNode={
          <View style={styles.iconButton}>
            <Settings size={16} color={COLORS.primaryBlue} />
          </View>
        }
      />

      <View style={styles.segmentOuter}>
        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentBtn, segment === 'all' ? styles.segmentBtnActive : undefined]}
            onPress={() => setSegment('all')}
          >
            <Text style={[styles.segmentText, segment === 'all' ? styles.segmentTextActive : undefined]}>All</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, segment === 'activity' ? styles.segmentBtnActive : undefined]}
            onPress={() => setSegment('activity')}
          >
            <Text style={[styles.segmentText, segment === 'activity' ? styles.segmentTextActive : undefined]}>Activity</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, segment === 'messages' ? styles.segmentBtnActive : undefined]}
            onPress={() => setSegment('messages')}
          >
            <Text style={[styles.segmentText, segment === 'messages' ? styles.segmentTextActive : undefined]}>Messages</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listWrap}>
        {!loading && filtered.length === 0 ? (
          <StitchEmpty title="No notifications" subtitle="You're all caught up." />
        ) : (
          filtered.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.row, item.isRead ? undefined : styles.rowUnread]}
              onPress={() => onPressNotification(item)}
            >
              <View style={styles.iconCell}>{iconForType(item.type)}</View>

              <View style={styles.rowMain}>
                <View style={styles.rowHead}>
                  <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>

              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))
        )}
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOuter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentWrap: {
    backgroundColor: '#E8EEF8',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: COLORS.lightGrey,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.primaryBlue,
  },
  listWrap: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  rowUnread: {
    backgroundColor: '#EEF4FF',
  },
  iconCell: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: '#E9F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowMain: {
    flex: 1,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  message: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 99,
    backgroundColor: COLORS.primaryBlue,
    marginLeft: 8,
  },
});
