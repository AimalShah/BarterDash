import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart3, Boxes, CalendarClock, Settings, Video } from 'lucide-react-native';
import { useDashboard } from '@/hooks/useDashboard';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSectionTitle,
  StitchStat,
} from '@/components/design';

function ActionTile({
  label,
  icon,
  onPress,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable style={[styles.actionTile, primary ? styles.actionTilePrimary : undefined]} onPress={onPress}>
      <View style={[styles.actionIcon, primary ? styles.actionIconPrimary : undefined]}>{icon}</View>
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : undefined]}>{label}</Text>
    </Pressable>
  );
}

export default function SellerDashboardScreen() {
  const { username, stats, streams, refreshing, refresh, loading } = useDashboard();

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </StitchPage>
    );
  }

  return (
    <StitchPage
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primaryBlue} />}
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="Seller Dashboard"
        subtitle={`Welcome back, ${username || 'Seller'}`}
        rightNode={
          <Pressable style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Settings size={16} color={COLORS.primaryBlue} />
          </Pressable>
        }
      />

      {/* TODO : MAKE IT SO IT WORKS WITH REAL DATA */}
      <View style={styles.contentPad}>
        <StitchCard style={styles.liveAlertCard}>
          <View style={styles.liveAlertRow}>
            <View>
              <Text style={styles.liveAlertTitle}>Upcoming: Tech Tuesday</Text>
              <Text style={styles.liveAlertMeta}>Starting in 15 minutes</Text>
            </View>
            <StitchPrimaryButton label="Go Live" onPress={() => router.push('/seller/go-live')} />
          </View>
        </StitchCard>

        {/* TODO : ALSO ADD STREAMS AND PRODUCT TO STATS */}
        <View style={styles.statsRow}>
          <StitchStat label="Revenue" value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`} />
          <View style={styles.statGap} />
          <StitchStat label="Sales" value={stats.totalOrders || 0} />
        </View>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Quick Actions" />
        </View>

        <View style={styles.actionsGrid}>
          <ActionTile
            label="Go Live"
            icon={<Video size={20} color={COLORS.primaryBlue} />}
            onPress={() => router.push('/seller/go-live')}
            primary
          />
          <ActionTile
            label="Add Product"
            icon={<Boxes size={20} color={COLORS.primaryBlue} />}
            onPress={() => router.push('/seller/add-product')}
          />
          <ActionTile
            label="Inventory"
            icon={<BarChart3 size={20} color={COLORS.primaryBlue} />}
            onPress={() => router.push('/seller/inventory')}
          />
          <ActionTile
            label="Orders"
            icon={<CalendarClock size={20} color={COLORS.primaryBlue} />}
            onPress={() => router.push('/seller/sales')}
          />
        </View>

        <View style={styles.sectionTop}>
          <StitchSectionTitle title="Your Shows" actionLabel="View all" onActionPress={() => router.push('/seller/streams')} />
        </View>

        <View style={styles.showsList}>
          {(streams || []).slice(0, 3).map((stream) => (
            <Pressable key={stream.id} onPress={() => router.push(`/seller/stream/${stream.id}`)}>
              <StitchCard style={styles.showCard}>
                <View style={styles.showLeft}>
                  <Text style={styles.showTitle} numberOfLines={1}>{stream.title}</Text>
                  <Text style={styles.showMeta}>
                    {stream.status === 'live'
                      ? `${stream.viewer_count || 0} viewers live`
                      : stream.scheduledStart || stream.schedule_start || 'Scheduled'}
                  </Text>
                </View>
                <View style={[styles.showBadge, stream.status === 'live' ? styles.showBadgeLive : styles.showBadgeSoon]}>
                  <Text style={[styles.showBadgeText, stream.status === 'live' ? styles.showBadgeTextLive : styles.showBadgeTextSoon]}>
                    {stream.status === 'live' ? 'LIVE' : 'SCHEDULED'}
                  </Text>
                </View>
              </StitchCard>
            </Pressable>
          ))}
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.lightGrey,
    fontSize: 14,
    fontWeight: '600',
  },
  iconBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liveAlertCard: {
    marginBottom: 14,
    backgroundColor: '#ECF4FF',
  },
  liveAlertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  liveAlertTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  liveAlertMeta: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statGap: {
    width: 8,
  },
  sectionTop: {
    marginTop: 16,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  actionTile: {
    width: '47%',
    paddingHorizontal: 5,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minHeight: 92,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTilePrimary: {
    backgroundColor: '#ECF4FF',
    borderColor: '#D2E1FB',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionIconPrimary: {
    transform: [{ scale: 1.05 }],
  },
  actionText: {
    color: COLORS.primaryText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  actionTextPrimary: {
    color: COLORS.primaryBlue,
  },
  showsList: {
    gap: 8,
  },
  showCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showLeft: {
    flex: 1,
    paddingRight: 8,
  },
  showTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  showMeta: {
    color: COLORS.lightGrey,
    fontSize: 11,
    marginTop: 2,
  },
  showBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  showBadgeLive: {
    backgroundColor: '#FEE2E2',
  },
  showBadgeSoon: {
    backgroundColor: '#E8F0FE',
  },
  showBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  showBadgeTextLive: {
    color: '#DC2626',
  },
  showBadgeTextSoon: {
    color: COLORS.primaryBlue,
  },
});
