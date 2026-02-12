import { useState, useEffect, useCallback, useRef } from "react";
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
import { useConnectionManager } from "@/lib/connection/useConnectionManager";
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
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(
    null,
  );
  const [isStreamPaused, setIsStreamPaused] = useState(false);

  // Auction state
  const { activeAuction } = useStreamAuctions(streamId);

  // Bidding state
  const {
    currentBid,
    minimumBid,
    bidIncrement,
    isPlacingBid,
    timerExtended,
    newEndsAt,
    canBid,
    cannotBidReason,
    placeBid,
    placeCustomBid,
    placeMaxBid,
  } = useBidding(activeAuction, () => {
    console.log("[ViewerStream] Bid placed successfully");
  });

  const [showBidAlert, setShowBidAlert] = useState(false);
  const lastBidRef = useRef<number | null>(null);
  const bidAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auctionTop = insets.top + 88;

  // Reactions
  const { addReaction, renderReactions } = useReactionSystem();

  // Connection Manager
  const {
    connectionState,
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempt,
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, router]);

  // Show bid alert when bid changes
  useEffect(() => {
    if (!activeAuction?.id) {
      lastBidRef.current = null;
      setShowBidAlert(false);
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
        bidAlertTimeoutRef.current = null;
      }
      return;
    }

    if (lastBidRef.current === null) {
      lastBidRef.current = currentBid;
      return;
    }

    if (currentBid > lastBidRef.current) {
      setShowBidAlert(true);
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
      bidAlertTimeoutRef.current = setTimeout(() => {
        setShowBidAlert(false);
      }, 1800);
    }

    lastBidRef.current = currentBid;
  }, [activeAuction?.id, currentBid]);

  useEffect(() => {
    return () => {
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
    };
  }, []);

  // Handlers
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
              colors={[
                COLORS.overlaySoft,
                COLORS.overlayMedium,
                COLORS.luxuryBlack,
              ]}
              style={styles.videoOverlay}
            />
          </View>
        )}
      </View>

      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.overlaySoft, COLORS.overlayMedium, COLORS.overlayStrong]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.screenScrim}
      />

      {/* Auction Section - Shows overlay and bid buttons */}
      <View style={[styles.auctionContainer, { top: auctionTop }]}>
        <View style={styles.auctionInner}>
          <AuctionSection
            auction={activeAuction}
            currentBid={currentBid}
            minimumBid={minimumBid}
            bidIncrement={bidIncrement}
            isPlacingBid={isPlacingBid}
            canBid={canBid}
            cannotBidReason={cannotBidReason}
            timerExtended={timerExtended}
            newEndsAt={newEndsAt}
            onPlaceBid={placeBid}
            onPlaceCustomBid={placeCustomBid}
            onPlaceMaxBid={placeMaxBid}
          />
        </View>
      </View>

      {/* Floating Reactions */}
      {renderReactions()}

      {/* Bid Alert Banner */}
      <BidAlert show={showBidAlert} currentBid={currentBid} />

      {/* Top Bar */}
      <LinearGradient
        colors={[COLORS.overlayStrong, COLORS.overlaySoft]}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBarContent}>
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
                <Text
                  style={[
                    styles.liveText,
                    !isConnected && styles.liveTextOffline,
                  ]}
                >
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
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.mainContent, { paddingBottom: insets.bottom + 12 }]}>
        {/* Chat Area */}
        <View style={styles.chatPanel}>
          <View style={styles.chatContainer}>
            <InstagramLiveChat streamId={streamId} showInput={true} />
          </View>
        </View>

        {/* Reaction Button */}
        <View style={styles.actionsRow}>
          <ReactionButton onPress={() => addReaction()} />
        </View>
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
  screenScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
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
    left: 0,
    right: 0,
    zIndex: 12,
    paddingHorizontal: 16,
  },
  auctionInner: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 20,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.overlaySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.overlayMedium,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  streamInfo: {
    flex: 1,
    marginLeft: 10,
  },
  streamTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
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
    backgroundColor: COLORS.overlayMedium,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveIndicator,
  },
  liveDotOffline: {
    backgroundColor: COLORS.textMuted,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
  },
  liveTextOffline: {
    color: COLORS.textSecondary,
  },
  viewersBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlayMedium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorderLight,
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
    zIndex: 12,
  },
  chatPanel: {
    backgroundColor: COLORS.overlayStrong,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
    marginBottom: 10,
  },
  chatContainer: {
    height: 220,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
