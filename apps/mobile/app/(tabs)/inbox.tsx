import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Edit3, MessageCircle, Search } from 'lucide-react-native';
import { useConversations } from '@/hooks/useMessages';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchEmpty } from '@/components/design';

function formatTime(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString();
}

export default function InboxScreen() {
  const [search, setSearch] = useState('');
  const conversationsQuery = useConversations();

  const conversations = useMemo(() => {
    const list = conversationsQuery.data || [];
    if (!search.trim()) return list;

    const term = search.toLowerCase();
    return list.filter((item) => {
      const username = item.otherUser.username?.toLowerCase() || '';
      const message = item.lastMessage?.content?.toLowerCase() || '';
      return username.includes(term) || message.includes(term);
    });
  }, [conversationsQuery.data, search]);

  return (
    <StitchPage
      refreshControl={
        <RefreshControl
          refreshing={conversationsQuery.isRefetching}
          onRefresh={conversationsQuery.refetch}
          tintColor={COLORS.primaryBlue}
        />
      }
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="Messages"
        subtitle="Direct messages"
        rightNode={
          <Pressable style={styles.iconButton} onPress={() => router.push('/messages/new')}>
            <Edit3 size={16} color={COLORS.primaryBlue} />
          </Pressable>
        }
      />

      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={COLORS.lightGrey} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search trades or users"
            placeholderTextColor={COLORS.lightGrey}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.segmentRow}>
        <Pressable style={[styles.segmentBtn, styles.segmentBtnActive]}>
          <Text style={[styles.segmentText, styles.segmentTextActive]}>All</Text>
        </Pressable>
        <Pressable style={styles.segmentBtn}>
          <Text style={styles.segmentText}>Buying</Text>
        </Pressable>
        <Pressable style={styles.segmentBtn}>
          <Text style={styles.segmentText}>Selling</Text>
        </Pressable>
      </View>

      <View style={styles.listWrap}>
        {conversations.length === 0 ? (
          <StitchEmpty
            title="No conversations yet"
            subtitle="Start chatting with buyers or sellers to negotiate deals."
          />
        ) : (
          conversations.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.row, item.unreadCount > 0 ? styles.rowUnread : undefined]}
              onPress={() => router.push(`/messages/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.otherUser.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>

              <View style={styles.rowMain}>
                <View style={styles.rowHeader}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.otherUser.username}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.lastMessage?.createdAt || item.lastMessageAt)}</Text>
                </View>

                <View style={styles.rowFooter}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage?.content || 'No messages yet'}
                  </Text>
                  {item.unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Pressable style={styles.fab} onPress={() => router.push('/messages/new')}>
        <MessageCircle size={20} color="#FFFFFF" />
      </Pressable>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInputWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
  },
  searchInput: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 38,
    paddingRight: 12,
  },
  segmentRow: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmentBtn: {
    marginRight: 14,
    paddingBottom: 10,
    paddingTop: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentBtnActive: {
    borderBottomColor: COLORS.primaryBlue,
  },
  segmentText: {
    color: COLORS.lightGrey,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.primaryBlue,
  },
  listWrap: {
    paddingTop: 6,
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
  avatar: {
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: '#E8EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primaryBlue,
    fontSize: 16,
    fontWeight: '700',
  },
  rowMain: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 6,
  },
  time: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    color: COLORS.lightGrey,
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 99,
    backgroundColor: COLORS.primaryBlue,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 104,
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
});
