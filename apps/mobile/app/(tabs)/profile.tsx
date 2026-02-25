import { useEffect, useState } from 'react'; import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Heart, HelpCircle, LogOut, Settings, ShieldCheck, Store } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { socialService } from '@/lib/api/services/social';
import { sellersService } from '@/lib/api/services/sellers';
import { COLORS } from '@/constants/colors';
import {
  StitchCard,
  StitchHeader,
  StitchPage,
  StitchPrimaryButton,
  StitchSecondaryButton,
  StitchStat,
} from '@/components/design';

interface ProfileStats {
  followers: number;
  following: number;
  purchases: number;
}

export default function ProfileScreen() {
  const { profile, fetchProfile, signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, purchases: 0 });

  const isSeller = profile?.role === 'SELLER' || profile?.is_seller === true;

  useEffect(() => {
    void loadStats();
  }, [profile?.id]);

  async function loadStats() {
    if (!profile?.id) return;

    try {
      const social = await socialService.getStats(profile.id);
      let purchases = 0;

      if (isSeller) {
        const sellerData = await sellersService.getDashboard().catch(() => null);
        purchases = Number(sellerData?.total_auctions || 0);
      }

      setStats({
        followers: Number(social.followers_count || 0),
        following: Number(social.following_count || 0),
        purchases,
      });
    } catch (error) {
      setStats({ followers: 0, following: 0, purchases: 0 });
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchProfile();
    await loadStats();
    setRefreshing(false);
  }

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/landing');
  }

  const avatar = profile?.avatarUrl;
  const displayName = profile?.fullName || 'BarterDash User';
  const handle = profile?.username ? `@${profile.username}` : '@barterdash_user';

  return (
    <StitchPage
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryBlue} />}
      contentStyle={{ paddingBottom: 120 }}
    >
      <StitchHeader
        title="Buyer Profile"
        subtitle="Manage your account"
        rightNode={
          <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
            <Settings size={16} color={COLORS.primaryBlue} />
          </Pressable>
        }
      />

      <View style={styles.profileTop}>
        <View style={styles.avatarWrap}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{displayName[0]?.toUpperCase() || 'U'}</Text></View>}
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.handle}>{handle}</Text>

        <Text style={styles.bio}>
          Lover of rare finds and good deals. Discovering the best live auctions every week.
        </Text>

        <View style={styles.actionRow}>
          <View style={styles.actionButtonHalf}>
            <StitchPrimaryButton label="Edit Profile" onPress={() => router.push('/settings')} />
          </View>
          <View style={styles.actionButtonHalf}>
            <StitchSecondaryButton
              label={isSeller ? 'Seller Dashboard' : 'Become Seller'}
              onPress={() => router.push(isSeller ? '/seller/dashboard' : '/seller/register')}
            />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StitchStat label="Purchases" value={stats.purchases} />
        <View style={styles.statGap} />
        <StitchStat label="Followers" value={stats.followers} />
        <View style={styles.statGap} />
        <StitchStat label="Following" value={stats.following} />
      </View>

      <View style={styles.sectionPad}>
        <StitchCard>
          <Pressable style={styles.menuItem} onPress={() => router.push('/(tabs)/my-bids')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}><Heart size={16} color={COLORS.primaryBlue} /></View>
              <Text style={styles.menuText}>Wishlist</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/seller/sales')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}><Store size={16} color={COLORS.primaryBlue} /></View>
              <Text style={styles.menuText}>Order History</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/help-support')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}><HelpCircle size={16} color={COLORS.primaryBlue} /></View>
              <Text style={styles.menuText}>Help Center</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/settings/privacy')}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}><ShieldCheck size={16} color={COLORS.primaryBlue} /></View>
              <Text style={styles.menuText}>Privacy & Security</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </StitchCard>
      </View>

      <View style={styles.signOutPad}>
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
  profileTop: {
    paddingHorizontal: 18,
    paddingTop: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#E4EDFF',
    padding: 2,
  },
  avatar: {
    height: 108,
    width: 108,
    borderRadius: 16,
  },
  avatarFallback: {
    height: 108,
    width: 108,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0FF',
  },
  avatarFallbackText: {
    color: COLORS.primaryBlue,
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  handle: {
    marginTop: 3,
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    marginTop: 10,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  actionRow: {
    marginTop: 14,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButtonHalf: {
    width: '48%',
  },
  statsRow: {
    paddingHorizontal: 18,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statGap: {
    width: 8,
  },
  sectionPad: {
    paddingHorizontal: 18,
    marginTop: 16,
  },
  menuItem: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIcon: {
    height: 32,
    width: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0FF',
  },
  menuText: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  menuArrow: {
    color: COLORS.lightGrey,
    fontSize: 22,
    fontWeight: '500',
  },
  signOutPad: {
    paddingHorizontal: 18,
    marginTop: 18,
  },
  signOutButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
