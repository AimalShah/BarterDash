import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { streamsService } from "../../lib/api/services/streams";
import { useAuthStore } from "../../store/authStore";
import { useBidding } from "../../hooks/useBidding";
import { useStreamAuctions } from "../../hooks/useStreamAuctions";
import { useConnectionManager } from "../../lib/connection/useConnectionManager";
import {
  StreamVideo,
  StreamVideoClient,
  LivestreamPlayer,
  ViewerLivestream,
  type ViewerLivestreamProps,
} from "@stream-io/video-react-native-sdk";
import { InstagramLiveChat } from "./InstagramLiveChat";
import AuctionSection from "./AuctionSection";
import ConnectionOverlay from "./ConnectionOverlay";
import { useReactionSystem, ReactionButton } from "./ReactionSystem";
import BidAlert from "./BidAlert";
import { COLORS } from "../../constants/colors";

interface ViewerStreamViewStreamProps {
  streamId: string;
}

const ViewerLivestreamNoControls = (props: ViewerLivestreamProps) => (
  <ViewerLivestream
    {...props}
    ViewerLivestreamTopView={null}
    ViewerLivestreamControls={null}
  />
);

export default function ViewerStreamViewStream({
  streamId,
}: ViewerStreamViewStreamProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  
  // Core state
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [isStreamPaused, setIsStreamPaused] = useState(false);

  // Auction state
  const {
    activeAuction,
    isLoading: isAuctionLoading,
    error: auctionError,
    refetch: refetchAuction,
  } = useStreamAuctions(streamId);

  // Bidding state
  const {
    currentBid,
    isPlacingBid,
    showBidAlert,
    placeQuickBid,
  } = useBidding(activeAuction, () => {
    console.log("[ViewerStream] Bid placed successfully");
  });

  // Reactions
  const { addReaction, renderReactions } = useReactionSystem();

  // Connection Manager
  const {
    connectionState,
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempt,
    connect,
    disconnect,
  } = useConnectionManager({
    streamId,
    connectFn: async () => {
      const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
      if (!apiKey) throw new Error("Missing Stream API key");

      const userId = profile?.id;
      if (!userId) throw new Error("Missing user for Stream authentication");

      const tokenProvider = async () => {
        const { token } = await streamsService.getViewerToken(streamId);
        return token;
      };

      const client = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id: userId, name: profile?.username || "Viewer" },
        tokenProvider,
      });

      setStreamClient(client);
      await streamsService.join(streamId);
    },
    disconnectFn: async () => {
      await streamsService.leave(streamId);
      if (streamClient) {
        await streamClient.disconnectUser();
        setStreamClient(null);
      }
    },
    autoConnect: true,
  });

  // Fetch stream info
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        const stream = await streamsService.findById(streamId);
        setStreamInfo(stream);
      } catch (error) {
        console.error("Failed to fetch stream info:", error);
      }
    };
    fetchStreamInfo();
  }, [streamId]);

  // Check if stream ended
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stream = await streamsService.findById(streamId);
        if (stream.status === "ended") {
          Alert.alert("Stream Ended", "The stream has ended.", [
            { text: "OK", onPress: () => router.back() },
          ]);
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to check stream status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [streamId, router]);

  // Handle auction won
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`auction-won:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          if (notification?.type === "auction_won") {
            const orderId = notification.data?.orderId;
            if (orderId) router.push(`/checkout/${orderId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, router]);

  // Handlers
  const handleQuickBid = useCallback(async (amount: number) => {
    await placeQuickBid(amount);
  }, [placeQuickBid]);

  const handlePauseResume = useCallback(() => {
    setIsStreamPaused((prev) => !prev);
  }, []);

  const handleLeaveStream = useCallback(async () => {
    await disconnect();
    router.back();
  }, [disconnect, router]);

  // Show connection overlay while connecting
  if (isConnecting && !streamClient) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ConnectionOverlay
          isConnecting={isConnecting}
          isReconnecting={isReconnecting}
          isStreamPaused={isStreamPaused}
          reconnectAttempt={reconnectAttempt}
          isConnected={isConnected}
          streamInfo={streamInfo}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Video Background */}
      <View style={styles.videoContainer}>
        {isConnected && streamClient && !isStreamPaused ? (
          <StreamVideo client={streamClient}>
            <LivestreamPlayer
              callType="livestream"
              callId={streamId}
              testID="viewer-stream-video"
              ViewerLivestream={ViewerLivestreamNoControls}
            />
          </StreamVideo>
        ) : (
          <ConnectionOverlay
            isConnecting={isConnecting}
            isReconnecting={isReconnecting}
            isStreamPaused={isStreamPaused}
            reconnectAttempt={reconnectAttempt}
            isConnected={isConnected}
            streamInfo={streamInfo}
            onResume={handlePauseResume}
          />
        )}

        {/* Thumbnail overlay when disconnected */}
        {!isConnected && streamInfo?.thumbnail && (
          <View style={styles.thumbnailOverlay}>
            <Image
              source={{ uri: streamInfo.thumbnail }}
              style={styles.thumbnail}
              blurRadius={1}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)", COLORS.luxuryBlack]}
              style={styles.videoOverlay}
            />
          </View>
        )}
      </View>

      {/* Auction Section - Shows overlay and bid buttons */}
      <View style={styles.auctionContainer}>
        <AuctionSection
          auction={activeAuction}
          currentBid={currentBid}
          isPlacingBid={isPlacingBid}
          auctionError={auctionError}
          isLoading={isAuctionLoading}
          onPlaceBid={handleQuickBid}
          onRetry={refetchAuction}
        />
      </View>

      {/* Floating Reactions */}
      {renderReactions()}

      {/* Bid Alert Banner */}
      <BidAlert show={showBidAlert} currentBid={currentBid} />

      {/* Top Bar */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        style={[styles.topBar, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={handleLeaveStream} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {streamInfo?.title || "Live Stream"}
          </Text>
          <View style={styles.liveIndicators}>
            <View style={styles.liveBadge}>
              <View
                style={[styles.liveDot, !isConnected && styles.liveDotOffline]}
              />
              <Text style={styles.liveText}>
                {isConnected ? "LIVE" : connectionState.toUpperCase()}
              </Text>
            </View>
            <View style={styles.viewersBadge}>
              <Ionicons name="eye" size={12} color={COLORS.textPrimary} />
              <Text style={styles.viewersText}>
                {streamInfo?.viewerCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Chat Area */}
        <View style={styles.chatContainer}>
          <InstagramLiveChat streamId={streamId} showInput={true} />
        </View>

        {/* Reaction Button */}
        <ReactionButton onPress={() => addReaction()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  videoContainer: {
    flex: 1,
    zIndex: 0,
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  auctionContainer: {
    position: "absolute",
    top: "18%",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  streamInfo: {
    flex: 1,
    marginLeft: 8,
  },
  streamTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  liveIndicators: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#4CAF50",
  },
  liveDotOffline: {
    backgroundColor: "#FF5252",
  },
  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
  },
  viewersBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  viewersText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  mainContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  chatContainer: {
    height: 180,
    marginBottom: 12,
  },
});
