import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Calendar,
  Clock,
  Eye,
  Plus,
} from 'lucide-react-native';
import { streamsService, Stream } from '../../lib/api/services/streams';
import { COLORS } from '../../constants/colors';

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function StreamManagementDashboard() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreams = useCallback(async () => {
    try {
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStreams();
  };

  const liveStreams = useMemo(
    () => streams.filter((stream) => stream.status === 'live'),
    [streams],
  );
  const scheduledStreams = useMemo(
    () => streams.filter((stream) => stream.status === 'scheduled'),
    [streams],
  );

  const handleManageStream = (streamId: string) => {
    router.push(`/seller/stream/${streamId}`);
  };

  const handleGoLive = (streamId: string) => {
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
      ],
    );
  };

  const renderLiveStreamCard = (stream: Stream) => (
    <View key={stream.id} style={styles.liveCard}>
      <View style={styles.liveCardHeader}>
        <LinearGradient
          colors={[COLORS.liveIndicator, '#b91c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveBadge}
        >
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </LinearGradient>
        <View style={styles.viewerBadge}>
          <Eye size={12} color={COLORS.textSecondary} />
          <Text style={styles.viewerCount}>{stream.viewerCount || 0}</Text>
        </View>
      </View>

      <Text style={styles.streamTitle} numberOfLines={2}>
        {stream.title}
      </Text>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => handleManageStream(stream.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.manageButtonText}>Manage Console</Text>
        <View style={styles.iconCircle}>
          <ChevronRight size={14} color={COLORS.luxuryBlack} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderScheduledStreamCard = (stream: Stream) => (
    <View key={stream.id} style={styles.scheduledCard}>
      <View style={styles.scheduledHeader}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>
            {new Date(stream.scheduledStart || 0).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(stream.scheduledStart || 0).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={styles.streamInfo}>
          <Text style={styles.scheduledTitle} numberOfLines={1}>
            {stream.title}
          </Text>
          <View style={styles.streamMetaRow}>
            <Clock size={12} color={COLORS.primaryGold} />
            <Text style={styles.streamMetaText}>
              {new Date(stream.scheduledStart || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleManageStream(stream.id)}
        >
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleGoLive(stream.id)}
        >
          <Text style={styles.primaryButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>LOADING STUDIO...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primaryGold}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>STREAM MANAGER</Text>
            <Text style={styles.headerSubtitle}>Live control + scheduled lineup</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/seller/create-stream')}
          >
            <Plus size={20} color={COLORS.luxuryBlack} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Live Now</Text>
            <Text style={styles.summaryValue}>{liveStreams.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scheduled</Text>
            <Text style={styles.summaryValue}>{scheduledStreams.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURRENTLY LIVE</Text>
          {liveStreams.length > 0 ? (
            liveStreams.map(renderLiveStreamCard)
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Video size={24} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>OFFLINE</Text>
              <Text style={styles.emptySubtitle}>
                You are not currently streaming.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING</Text>
          {scheduledStreams.length > 0 ? (
            scheduledStreams
              .sort(
                (a, b) =>
                  new Date(a.scheduledStart || 0).getTime() -
                  new Date(b.scheduledStart || 0).getTime(),
              )
              .map(renderScheduledStreamCard)
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Calendar size={24} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>NO SCHEDULE</Text>
              <Text style={styles.emptySubtitle}>
                Plan your next show to build hype.
              </Text>
              <TouchableOpacity
                style={styles.textLinkButton}
                onPress={() => router.push('/seller/create-stream')}
              >
                <Text style={styles.textLink}>Schedule Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlack,
  },
  loadingText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  liveCard: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.liveIndicator, // Red border for live
    padding: 20,
    gap: 16,
    shadowColor: COLORS.liveIndicator,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  viewerCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  streamTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  manageButton: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centered text, icon right
    paddingHorizontal: 16,
    gap: 8,
  },
  manageButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduledCard: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  scheduledHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  dateBlock: {
    backgroundColor: COLORS.luxuryBlack,
    borderRadius: 12,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  dateDay: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  dateMonth: {
    color: COLORS.primaryGold,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  streamInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduledTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  streamMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamMetaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    paddingTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.luxuryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  textLinkButton: {
    padding: 8,
  },
  textLink: {
    color: COLORS.primaryGold,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
