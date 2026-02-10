import React, { useEffect, useState } from "react";
import { StatusBar, Alert, View, Text as RNText, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import SellerStreamViewStream from "../../components/stream/SellerStreamViewStream";
import { streamsService } from "../../lib/api/services/streams";
import { COLORS } from "../../constants/colors";

export default function GoLiveScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (streamId) {
      fetchStreamDetails();
    }
  }, [streamId]);

  const fetchStreamDetails = async () => {
    try {
      setLoading(true);
      const data = await streamsService.findById(streamId);
      setStream(data);
      console.log('📺 GoLiveScreen - Stream loaded:', {
        streamId: data.id,
        status: data.status,
      });
    } catch (err: any) {
      console.error('Error fetching stream:', err);
      setError('Failed to load stream details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = () => {
    router.replace("/seller/dashboard");
  };

  if (!streamId) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack, padding: 40, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderWidth: 1, borderColor: COLORS.darkBorder, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <RNText style={{ fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary }}>!</RNText>
        </View>
        <RNText style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: COLORS.textPrimary }}>INVALID STREAM</RNText>
        <RNText style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30 }}>
          The stream you are looking for could not be found or has ended.
        </RNText>
        <View 
          style={{ backgroundColor: COLORS.primaryGold, paddingHorizontal: 24, paddingVertical: 16, width: '100%' }}
          onTouchEnd={() => router.replace("/seller/dashboard")}
        >
          <RNText style={{ color: COLORS.luxuryBlack, fontWeight: 'bold', textAlign: 'center' }}>Back To Dashboard</RNText>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
        <RNText style={{ color: COLORS.textPrimary, marginTop: 16, fontWeight: 'bold' }}>Loading stream...</RNText>
      </View>
    );
  }

  if (error || !stream) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <StatusBar hidden />
        <RNText style={{ color: COLORS.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Error</RNText>
        <RNText style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30 }}>{error || "Stream not found"}</RNText>
        <View 
          style={{ backgroundColor: COLORS.primaryGold, paddingHorizontal: 24, paddingVertical: 12 }}
          onTouchEnd={() => router.replace("/seller/dashboard")}
        >
          <RNText style={{ color: COLORS.luxuryBlack, fontWeight: 'bold' }}>Back to Dashboard</RNText>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar hidden />
      <SellerStreamViewStream
        streamId={stream.id}
        onEndStream={handleEndStream}
      />
    </View>
  );
}
