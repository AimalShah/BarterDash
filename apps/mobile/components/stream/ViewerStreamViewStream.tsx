import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/api/queryKeys";
import { streamsService, type Stream } from "../../lib/api/services/streams";
import { useAuthStore } from "../../store/authStore";
import { useBidding } from "../../hooks/useBidding";
import { useStreamAuctions } from "../../hooks/useStreamAuctions";
import {
  StreamVideo,
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

const IS_UI_ONLY_MODE = true;

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
  type StreamWithLegacyThumbnail = Stream & { thumbnail?: string | null };
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  // Core state
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
  const [uiOnlyCurrentBid, setUiOnlyCurrentBid] = useState(120);
  const [uiOnlyPlacingBid, setUiOnlyPlacingBid] = useState(false);
  const previewEndsAtRef = useRef(
    new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  );
  const lastBidRef = useRef<number | null>(null);
  const bidAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedAlertShownByStreamRef = useRef<Record<string, boolean>>({});
  const auctionTop = insets.top + 88;

  // Reactions
  const { addReaction, renderReactions } = useReactionSystem();

  // TEMP: UI-only mode while stream transport is being fixed.
  const streamClient = null;
  const connectionState = "connected";
  const isConnected = true;
  const isConnecting = false;
  const isReconnecting = false;
  const reconnectAttempt = 0;
  const disconnect = async () => { };

  const { data: streamInfo } = useQuery<StreamWithLegacyThumbnail>({
    queryKey: [...queryKeys.streams, "detail", streamId, "viewer"] as const,
    queryFn: async () => {
      const stream = (await streamsService.findById(
        streamId,
      )) as StreamWithLegacyThumbnail;

      if (
        stream.status === "ended" &&
        !endedAlertShownByStreamRef.current[streamId]
      ) {
        endedAlertShownByStreamRef.current[streamId] = true;
        Alert.alert("Stream Ended", "The stream has ended.", [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      }

      return stream;
    },
    enabled: Boolean(streamId),
    refetchInterval: (query) => {
      const latestStream = query.state.data;
      return latestStream?.status === "ended" ? false : 5000;
    },
  });

  const streamThumbnail = streamInfo?.thumbnail ?? streamInfo?.thumbnailUrl;
  const isUsingPreviewAuction = IS_UI_ONLY_MODE && !activeAuction;
  const previewBidIncrement = 5;
  const previewAuction = isUsingPreviewAuction
    ? {
      id: `preview-${streamId}`,
      currentBid: uiOnlyCurrentBid,
      startingBid: uiOnlyCurrentBid,
      bidCount: 18,
      endsAt: previewEndsAtRef.current,
      status: "active",
      mode: "normal" as const,
      title: streamInfo?.title ?? "Live item",
      product: { images: streamThumbnail ? [streamThumbnail] : [] },
    }
    : null;
  const auctionForUi = activeAuction ?? previewAuction;
  const currentBidForUi = isUsingPreviewAuction ? uiOnlyCurrentBid : currentBid;
  const bidIncrementForUi = isUsingPreviewAuction
    ? previewBidIncrement
    : bidIncrement;
  const minimumBidForUi = isUsingPreviewAuction
    ? uiOnlyCurrentBid + previewBidIncrement
    : minimumBid;
  const canBidForUi = isUsingPreviewAuction ? true : canBid;
  const cannotBidReasonForUi = isUsingPreviewAuction ? null : cannotBidReason;
  const isPlacingBidForUi = isUsingPreviewAuction
    ? uiOnlyPlacingBid
    : isPlacingBid;

  const placeBidForUi = useCallback(async (): Promise<boolean> => {
    if (!isUsingPreviewAuction) {
      return placeBid();
    }

    setUiOnlyPlacingBid(true);
    setUiOnlyCurrentBid((prev) => prev + previewBidIncrement);
    setUiOnlyPlacingBid(false);
    return true;
  }, [isUsingPreviewAuction, placeBid, previewBidIncrement]);

  const placeCustomBidForUi = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!isUsingPreviewAuction) {
        return placeCustomBid(amount);
      }
      if (amount < minimumBidForUi) {
        return false;
      }
      setUiOnlyPlacingBid(true);
      setUiOnlyCurrentBid(amount);
      setUiOnlyPlacingBid(false);
      return true;
    },
    [isUsingPreviewAuction, minimumBidForUi, placeCustomBid],
  );

  const placeMaxBidForUi = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!isUsingPreviewAuction) {
        return placeMaxBid(amount);
      }
      if (amount < minimumBidForUi) {
        return false;
      }
      setUiOnlyPlacingBid(true);
      setUiOnlyCurrentBid(amount);
      setUiOnlyPlacingBid(false);
      return true;
    },
    [isUsingPreviewAuction, minimumBidForUi, placeMaxBid],
  );

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
    if (!auctionForUi?.id) {
      lastBidRef.current = null;
      setShowBidAlert(false);
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
        bidAlertTimeoutRef.current = null;
      }
      return;
    }

    if (lastBidRef.current === null) {
      lastBidRef.current = currentBidForUi;
      return;
    }

    if (currentBidForUi > lastBidRef.current) {
      setShowBidAlert(true);
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
      bidAlertTimeoutRef.current = setTimeout(() => {
        setShowBidAlert(false);
      }, 1800);
    }

    lastBidRef.current = currentBidForUi;
  }, [auctionForUi?.id, currentBidForUi]);

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
    router.replace('/(tabs)');
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
        {!isConnected && streamThumbnail && (
          <View style={styles.thumbnailOverlay}>
            <Image
              source={{ uri: streamThumbnail }}
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

      {/* Floating Reactions */}
      {renderReactions()}

      {/* Bid Alert Banner */}
      <BidAlert show={showBidAlert} currentBid={currentBidForUi} />

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
            <View style={styles.actionsRow}>
              <ReactionButton onPress={() => addReaction()} />
            </View>
          </View>
        </View>

        <View style={[styles.auctionContainer]}>
          <View style={styles.auctionInner}>
            <AuctionSection
              auction={auctionForUi}
              currentBid={currentBidForUi}
              minimumBid={minimumBidForUi}
              bidIncrement={bidIncrementForUi}
              isPlacingBid={isPlacingBidForUi}
              canBid={canBidForUi}
              cannotBidReason={cannotBidReasonForUi}
              timerExtended={timerExtended}
              newEndsAt={newEndsAt}
              onPlaceBid={placeBidForUi}
              onPlaceCustomBid={placeCustomBidForUi}
              onPlaceMaxBid={placeMaxBidForUi}
            />
          </View>
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
    paddingHorizontal: 0,
  },
  auctionInner: {
    width: "100%",
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
    paddingHorizontal: 12,
    zIndex: 12,
  },
  chatPanel: {
    backgroundColor: "transparent",
    borderRadius: 18,
    borderWidth: 0,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
    marginBottom: 4,
  },
  chatContainer: {
    height: 210,
    flexDirection: "row",
    paddingHorizontal: 0,
  },
  actionsRow: {
    justifyContent: "flex-end",
    marginBottom: 22,
  },
});
