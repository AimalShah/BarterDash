import { useState } from 'react'; import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Clock, Download, Eye, Shield } from 'lucide-react-native';
import { usersService } from '@/lib/api/services/users';
import { COLORS } from '@/constants/colors';
import { StitchCard, StitchHeader, StitchPage, StitchPrimaryButton } from '@/components/design';

function InfoCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <StitchCard style={styles.infoCard}>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </StitchCard>
  );
}

export default function PrivacySettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Date | null>(null);

  function handleExport() {
    Alert.alert('Download your data', 'We will prepare your account export. This can take a few minutes.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request export',
        onPress: async () => {
          setIsExporting(true);
          try {
            const result = await usersService.exportData();
            setLastExport(new Date());
            Alert.alert('Export ready', 'Your download link is ready and expires in 1 hour.', [
              { text: 'Download', onPress: () => Linking.openURL(result.download_url) },
              { text: 'Later' },
            ]);
          } catch (error: any) {
            if (error?.response?.data?.error?.code === 'RATE_LIMITED') {
              Alert.alert('Please wait', 'You can request one export every 24 hours.');
            } else {
              Alert.alert('Error', 'Unable to export data right now.');
            }
          } finally {
            setIsExporting(false);
          }
        },
      },
    ]);
  }

  return (
    <StitchPage>
      <StitchHeader title="Privacy & Visibility" onBack={() => router.back()} />

      <View style={styles.contentPad}>
        <StitchCard style={styles.mainCard}>
          <View style={styles.mainHeader}>
            <View style={styles.downloadIconWrap}>
              <Download size={24} color={COLORS.primaryBlue} />
            </View>
            <Text style={styles.mainTitle}>Download your data</Text>
          </View>

          <Text style={styles.mainSubtitle}>
            Get a copy of your profile, orders, bids, products, conversations, and account history.
          </Text>

          <StitchPrimaryButton
            label={isExporting ? 'Preparing Export...' : 'Request Data Export'}
            onPress={handleExport}
            disabled={isExporting}
          />

          {lastExport ? (
            <View style={styles.lastExportRow}>
              <Clock size={14} color={COLORS.lightGrey} />
              <Text style={styles.lastExportText}>Last export: {lastExport.toLocaleDateString()}</Text>
            </View>
          ) : null}
        </StitchCard>

        <View style={styles.infoWrap}>
          <InfoCard
            icon={<Eye size={16} color={COLORS.primaryBlue} />}
            title="What's included"
            subtitle="Account profile, orders, bids, chats, social connections, and billing records."
          />
          <InfoCard
            icon={<Shield size={16} color={COLORS.primaryBlue} />}
            title="Privacy first"
            subtitle="Export links are generated on demand and expire quickly for safety."
          />
        </View>
      </View>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  mainCard: {
    padding: 16,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  downloadIconWrap: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  mainSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  lastExportRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lastExportText: {
    color: COLORS.lightGrey,
    fontSize: 11,
    fontWeight: '600',
  },
  infoWrap: {
    marginTop: 14,
    gap: 10,
  },
  infoCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    height: 30,
    width: 30,
    borderRadius: 9,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  infoSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
