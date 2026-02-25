import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SellerStreamViewStream from '@/components/stream/SellerStreamViewStream';
import { streamsService } from '@/lib/api/services/streams';
import { StitchHeader, StitchPage, StitchPrimaryButton } from '@/components/design';
import { COLORS } from '@/constants/colors';
import { Text } from '@/components/ui/text';

export default function GoLiveScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setLoading(false);
      return;
    }

    const fetchStreamDetails = async () => {
      try {
        setLoading(true);
        const data = await streamsService.findById(streamId);
        setStream(data);
      } catch (err: any) {
        console.error('Error fetching stream:', err);
        setError('Failed to load stream details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamDetails();
  }, [streamId]);

  const handleEndStream = () => {
    router.replace('/seller/dashboard');
  };

  if (loading) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Go Live" subtitle="Preparing stream" onBack={() => router.back()} />
        <View style={styles.centerBody}>
          <Text style={styles.title}>Loading Stream...</Text>
          <Text style={styles.subtitle}>Starting your live broadcasting session</Text>
        </View>
      </StitchPage>
    );
  }

  if (!streamId || error || !stream) {
    return (
      <StitchPage scroll={false} contentStyle={styles.centerWrap}>
        <StitchHeader title="Go Live" subtitle="Unavailable" onBack={() => router.back()} />
        <View style={styles.centerBody}>
          <Text style={styles.title}>Stream Unavailable</Text>
          <Text style={styles.subtitle}>
            {error || 'The stream you are looking for could not be found or has ended.'}
          </Text>
          <View style={styles.buttonWrap}>
            <StitchPrimaryButton label="Back To Dashboard" onPress={() => router.replace('/seller/dashboard')} />
          </View>
        </View>
      </StitchPage>
    );
  }

  return (
    <View style={styles.fullscreenWrap}>
      <SellerStreamViewStream streamId={stream.id} onEndStream={handleEndStream} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    paddingBottom: 0,
  },
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonWrap: {
    marginTop: 18,
    width: '100%',
  },
  fullscreenWrap: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
});
