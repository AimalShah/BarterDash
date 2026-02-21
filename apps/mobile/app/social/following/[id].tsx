import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { socialService } from '@/lib/api/services/social';
import { COLORS } from '@/constants/colors';
import { StitchCard, StitchEmpty, StitchHeader, StitchPage } from '@/components/design';

type SocialUser = { id: string; username: string; avatar_url?: string };

export default function FollowingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await socialService.getFollowing(id);
        const users = Array.isArray(data?.following) ? data.following : [];
        setList(users);
      } catch (error) {
        console.error('Following list error:', error);
        setList([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.loadingTitle}>Loading Following...</Text>
        <Text style={styles.loadingSubtitle}>Fetching the accounts this user follows</Text>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader title="Following" subtitle={`${list.length} accounts`} onBack={() => router.back()} />

      <View style={styles.contentPad}>
        {list.length === 0 ? (
          <StitchCard>
            <StitchEmpty title="No Following Yet" subtitle="This user is not following anyone at the moment." />
          </StitchCard>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {list.map((item) => (
              <Pressable key={item.id} style={styles.itemWrap} onPress={() => router.push(`/user/${item.id}`)}>
                <StitchCard>
                  <View style={styles.row}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Users size={16} color={COLORS.primaryBlue} />
                      </View>
                    )}

                    <View style={styles.info}>
                      <Text style={styles.username}>@{item.username || 'user'}</Text>
                      <Text style={styles.meta}>Following</Text>
                    </View>
                  </View>
                </StitchCard>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  itemWrap: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
    color: COLORS.lightGrey,
    fontSize: 12,
  },
});
