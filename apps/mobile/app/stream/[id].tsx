import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ViewerStreamViewStream from '@/components/stream/ViewerStreamViewStream';
import { useStream } from '@/hooks/useStream';
import { COLORS } from '@/constants/colors';
import { StitchHeader, StitchPage, StitchPrimaryButton } from '@/components/design';

export default function WatchStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stream, loading, error } = useStream(id);

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Live Auction" subtitle="Connecting stream" onBack={() => router.back()} />
        <View style={styles.bodyCenter}>
          <Text style={styles.title}>Connecting to stream...</Text>
          <Text style={styles.subtitle}>Syncing live video, bids, and chat</Text>
        </View>
      </StitchPage>
    );
  }

  if (!id || error || !stream) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Live Auction" subtitle="Unavailable" onBack={() => router.back()} />
        <View style={styles.bodyCenter}>
          <Text style={styles.title}>Stream Unavailable</Text>
          <Text style={styles.subtitle}>
            {error?.message || 'This live auction could not be loaded right now.'}
          </Text>
          <View style={styles.buttonRow}>
            <StitchPrimaryButton label="Browse Live" onPress={() => router.replace('/(tabs)')} />
          </View>
        </View>
      </StitchPage>
    );
  }

  return <ViewerStreamViewStream streamId={stream.id} />;
}

const styles = StyleSheet.create({
  centerWrap: {
    paddingBottom: 0,
  },
  bodyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.lightGrey,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: 18,
    width: '100%',
  },
});
