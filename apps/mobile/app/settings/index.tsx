import { useState } from 'react'; import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CreditCard,
  Lock,
  LogOut,
  Moon,
  Shield,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage } from '@/components/design';

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.lightGrey} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/landing');
  }

  return (
    <StitchPage contentStyle={{ paddingBottom: 120 }}>
      <StitchHeader title="Settings" onBack={() => router.back()} />

      <View style={styles.profileWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.profileName}>{profile?.full_name || profile?.username || 'BarterDash User'}</Text>
        <Text style={styles.profileEmail}>{profile?.email || 'user@barterdash.com'}</Text>
        <Text style={styles.proPill}>Pro Member</Text>
      </View>

      <View style={styles.groupWrap}>
        <Text style={styles.groupTitle}>Account & Security</Text>
        <View style={styles.groupCard}>
          <SettingsRow
            icon={<User size={16} color={COLORS.primaryBlue} />}
            title="Account"
            subtitle="Profile details and identity"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <SettingsRow
            icon={<Lock size={16} color={COLORS.primaryBlue} />}
            title="Change Password"
            subtitle="Update login credentials"
            onPress={() => router.push('/settings/change-password')}
          />
          <SettingsRow
            icon={<Shield size={16} color={COLORS.primaryBlue} />}
            title="Privacy"
            subtitle="Data export and visibility"
            onPress={() => router.push('/settings/privacy')}
          />
        </View>
      </View>

      <View style={styles.groupWrap}>
        <Text style={styles.groupTitle}>Preferences</Text>
        <View style={styles.groupCard}>
          <SettingsRow
            icon={<Bell size={16} color={COLORS.primaryBlue} />}
            title="Notifications"
            subtitle="Push and email alerts"
            onPress={() => router.push('/notifications')}
          />
          <SettingsRow
            icon={<CreditCard size={16} color={COLORS.primaryBlue} />}
            title="Payment Methods"
            subtitle="Cards and payouts"
            onPress={() => router.push('/checkout/cart')}
          />
          {/* <View style={styles.switchRow}> */}
          {/*   <View style={styles.rowLeft}> */}
          {/*     <View style={styles.rowIcon}> */}
          {/*       <Moon size={16} color={COLORS.primaryBlue} /> */}
          {/*     </View> */}
          {/*     <Text style={styles.rowTitle}>Dark Mode</Text> */}
          {/*   </View> */}
          {/*   <Switch */}
          {/*     value={darkMode} */}
          {/*     onValueChange={setDarkMode} */}
          {/*     trackColor={{ false: '#CBD5E1', true: '#93C5FD' }} */}
          {/*     thumbColor={darkMode ? COLORS.primaryBlue : '#FFFFFF'} */}
          {/*   /> */}
          {/* </View> */}
        </View>
      </View>

      <View style={styles.footerPad}>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={17} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={styles.versionText}>BarterDash Live v2.4.0</Text>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  profileWrap: {
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  avatar: {
    height: 90,
    width: 90,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D2E1FB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0FF',
  },
  avatarText: {
    color: COLORS.primaryBlue,
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    marginTop: 10,
    color: COLORS.primaryText,
    fontSize: 22,
    fontWeight: '700',
  },
  profileEmail: {
    marginTop: 2,
    color: COLORS.lightGrey,
    fontSize: 13,
  },
  proPill: {
    marginTop: 8,
    backgroundColor: '#E8F0FE',
    color: COLORS.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  groupWrap: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  groupTitle: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  row: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowIcon: {
    height: 34,
    width: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: COLORS.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 1,
  },
  switchRow: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  footerPad: {
    marginTop: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    marginTop: 12,
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
  },
});
