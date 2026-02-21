import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar, Eye, Plus, Radio, Video } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Stream, streamsService } from '@/lib/api/services/streams';
import {
  StitchCard,
  StitchEmpty,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSectionTitle,
  StitchStat,
} from '@/components/design';

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function StreamManagementDashboard() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreams = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await streamsService.getMyStreams();
      setStreams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      Alert.alert('Error', 'Failed to load your streams.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const liveStreams = useMemo(
    () => streams.filter((stream) => stream.status === 'live'),
    [streams]
  );

  const scheduledStreams = useMemo(
    () => streams.filter((stream) => stream.status === 'scheduled'),
    [streams]
  );

  const totalViewers = useMemo(
    () => liveStreams.reduce((sum, stream) => sum + Number(stream.viewerCount || 0), 0),
    [liveStreams]
  );

  const handleGoLive = useCallback((streamId: string) => {
    Alert.alert(
      'Go Live',
      'Start streaming now? Your stream will be visible to viewers immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Live',
          onPress: () =>
            router.push({
              pathname: '/seller/go-live',
              params: { streamId },
            }),
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.loadingWrap}>
        <Text style={styles.loadingTitle}>Loading Studio...</Text>
        <Text style={styles.loadingSubtitle}>Preparing your live dashboard</Text>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      contentStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchStreams(true)}
          tintColor={COLORS.primaryBlue}
        />
      }
    >
      <StitchHeader
        title="Stream Manager"
        subtitle="Live control + schedule"
        onBack={() => router.back()}
        rightNode={
          <Pressable style={styles.addButton} onPress={() => router.push('/seller/create-stream')}>
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        }
      />

      <View style={styles.contentPad}>
        <View style={styles.statsRow}>
          <StitchStat label="Live" value={liveStreams.length} />
          <View style={styles.statsSpacer} />
          <StitchStat label="Scheduled" value={scheduledStreams.length} />
          <View style={styles.statsSpacer} />
          <StitchStat label="Viewers" value={totalViewers} />
        </View>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Currently Live" />
        </View>

        {liveStreams.length ? (
          liveStreams.map((stream) => (
            <StitchCard key={stream.id} style={styles.cardSpacing}>
              <View style={styles.cardHeader}>
                <View style={styles.liveBadge}>
                  <Radio size={11} color="#FFFFFF" />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <View style={styles.viewerBadge}>
                  <Eye size={12} color={COLORS.lightGrey} />
                  <Text style={styles.viewerText}>{stream.viewerCount || 0}</Text>
                </View>
              </View>

              <Text style={styles.streamTitle} numberOfLines={2}>
                {stream.title}
              </Text>

              <Text style={styles.streamMeta}>Started {formatDateTime(stream.startedAt || stream.scheduledStart)}</Text>

              <View style={styles.actionRow}>
                <View style={styles.actionItem}>
                  <StitchPrimaryButton
                    label="Manage"
                    onPress={() => router.push(`/seller/stream/${stream.id}`)}
                  />
                </View>
                <View style={styles.actionItem}>
                  <StitchPrimaryButton
                    label="Join Live"
                    onPress={() =>
                      router.push({ pathname: '/seller/go-live', params: { streamId: stream.id } })
                    }
                  />
                </View>
              </View>
            </StitchCard>
          ))
        ) : (
          <StitchCard style={styles.cardSpacing}>
            <StitchEmpty title="No Active Stream" subtitle="Start a stream to show up live here." />
          </StitchCard>
        )}

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Upcoming Streams" />
        </View>

        {scheduledStreams.length ? (
          scheduledStreams
            .sort(
              (a, b) =>
                new Date(a.scheduledStart || 0).getTime() - new Date(b.scheduledStart || 0).getTime()
            )
            .map((stream) => (
              <StitchCard key={stream.id} style={styles.cardSpacing}>
                <View style={styles.rowTop}>
                  <View style={styles.rowDateBadge}>
                    <Calendar size={14} color={COLORS.primaryBlue} />
                  </View>

                  <View style={styles.rowContent}>
                    <Text style={styles.streamTitle} numberOfLines={1}>
                      {stream.title}
                    </Text>
                    <Text style={styles.streamMeta}>{formatDateTime(stream.scheduledStart)}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <View style={styles.actionItem}>
                    <StitchPrimaryButton
                      label="Edit"
                      onPress={() => router.push(`/seller/stream/edit/${stream.id}`)}
                    />
                  </View>
                  <View style={styles.actionItem}>
                    <StitchPrimaryButton label="Go Live" onPress={() => handleGoLive(stream.id)} />
                  </View>
                </View>
              </StitchCard>
            ))
        ) : (
          <StitchCard>
            <StitchEmpty title="No Scheduled Streams" subtitle="Create your next show to build hype." />
            <StitchPrimaryButton label="Schedule Stream" onPress={() => router.push('/seller/create-stream')} />
          </StitchCard>
        )}

        <View style={styles.footerSpace} />
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  statsSpacer: {
    width: 8,
  },
  sectionTop: {
    marginBottom: 8,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewerText: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
  },
  streamTitle: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  streamMeta: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 4,
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionItem: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowDateBadge: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  footerSpace: {
    height: 24,
  },
});
