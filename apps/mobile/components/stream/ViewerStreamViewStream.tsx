import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { streamsService } from '../../lib/api/services/streams';
import { auctionsService } from '../../lib/api/services/auctions';
import { useAuthStore } from '../../store/authStore';
import { useBidding } from '../../hooks/useBidding';
import { useStreamAuctions } from '../../hooks/useStreamAuctions';
import { useConnectionManager } from '../../lib/connection/useConnectionManager';
import {
  StreamVideo,
  StreamVideoClient,
  LivestreamPlayer,
  ViewerLivestream,
  type ViewerLivestreamProps,
} from '@stream-io/video-react-native-sdk';
import { InstagramLiveChat } from './InstagramLiveChat';
import { AuctionOverlayCompact } from './AuctionOverlay';
import { ConnectionControls } from './ConnectionControls';
import { COLORS } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface ViewerStreamViewStreamProps {
  streamId: string;
}

interface Reaction {
  id: number;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
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
  const { profile, user, session } = useAuthStore();
  const reactionIdRef = useRef(0);

  // Local UI state
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [showConnectionControls, setShowConnectionControls] = useState(false);

  // Auction management
  const {
    activeAuction,
    isLoading: isAuctionLoading,
    error: auctionError,
    refetch: refetchAuction,
  } = useStreamAuctions(streamId);

  // Debug logging for auction state
  useEffect(() => {
    console.log('[ViewerStream] Auction state:', {
      hasAuction: !!activeAuction,
      auctionId: activeAuction?.id,
      status: activeAuction?.status,
      endsAt: activeAuction?.endsAt,
      currentBid: activeAuction?.currentBid,
      isLoading: isAuctionLoading,
      error: auctionError,
    });
  }, [activeAuction, isAuctionLoading, auctionError]);

  // Bidding
  const {
    currentBid,
    isPlacingBid,
    showBidAlert,
    placeQuickBid,
  } = useBidding(activeAuction, () => {
    console.log('Bid placed successfully');
  });

  // Connection Manager for robust connection handling
  const {
    connectionState,
    connectionQuality,
    connectionStats,
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempt,
    lastError,
    connect,
    disconnect,
    reconnect,
  } = useConnectionManager({
    streamId,
    connectFn: async () => {
      const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
      if (!apiKey) {
        throw new Error('Missing Stream API key');
      }

      const userId = profile?.id || user?.id || session?.user?.id;
      if (!userId) {
        throw new Error('Missing user for Stream authentication');
      }

      const fallbackName =
        profile?.username ||
        profile?.full_name ||
        profile?.fullName ||
        session?.user?.email?.split('@')[0] ||
        user?.email?.split('@')[0] ||
        'Viewer';

      const user = {
        id: userId,
        name: fallbackName,
      };

      const tokenProvider = async () => {
        const { token } = await streamsService.getViewerToken(streamId);
        return token;
      };

      const client = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user,
        tokenProvider,
      });

      setStreamClient(client);

      // Join the stream (increment viewer count)
      await streamsService.join(streamId);
    },
    disconnectFn: async () => {
      await streamsService.leave(streamId);
      if (streamClient) {
        await streamClient.disconnectUser();
        setStreamClient(null);
      }
    },
    pingFn: async () => {
      // Simple latency check - can be enhanced
      const start = Date.now();
      await streamsService.findById(streamId);
      return Date.now() - start;
    },
    autoConnect: true,
    onStateChange: (state) => {
      console.log(`[ViewerStream] Connection state changed to: ${state}`);
      // Show controls when there's an error or disconnection
      if (state === 'error' || state === 'offline' || state === 'disconnected') {
        setShowConnectionControls(true);
      }
    },
    onError: (error) => {
      console.error('[ViewerStream] Connection error:', error);
    },
  });

  // Fetch stream info on mount
  useEffect(() => {
    const fetchStreamInfo = async () => {
      try {
        const stream = await streamsService.findById(streamId);
        setStreamInfo(stream);
      } catch (error) {
        console.error('Failed to fetch stream info:', error);
      }
    };

    fetchStreamInfo();
  }, [streamId]);

  // Handle stream ended based on backend status
  useEffect(() => {
    // Poll stream status
    const interval = setInterval(async () => {
      try {
        const stream = await streamsService.findById(streamId);
        if (stream.status === 'ended' || stream.state === 'ended') {
          Alert.alert('Stream Ended', 'The stream has ended.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to check stream status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [streamId, router]);

  // Handle auction won notifications
  useEffect(() => {
      if (!profile?.id && !user?.id && !session?.user?.id) return;

    const channel = supabase
      .channel(`auction-won:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          if (!notification || notification.type !== 'auction_won') return;
          const orderId =
            notification.data?.orderId ||
            notification.data?.order_id ||
            notification.data?.orderID;
          if (!orderId) return;
          router.push(`/checkout/${orderId}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, user?.id, session?.user?.id, router]);

  // Add reaction animation
  const addReaction = useCallback(() => {
    const newReaction: Reaction = {
      id: reactionIdRef.current++,
      x: Math.random() * 60 - 30,
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    };

    setReactions((prev) => [...prev, newReaction]);

    Animated.parallel([
      Animated.timing(newReaction.y, {
        toValue: -120,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(newReaction.opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    });
  }, []);

  // Handle quick bid
  const handleQuickBid = useCallback(
    async (amount: number) => {
      await placeQuickBid(amount);
    },
    [placeQuickBid]
  );

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    setIsStreamPaused((prev) => !prev);
  }, []);

  // Handle leave stream
  const handleLeaveStream = useCallback(async () => {
    await disconnect();
    router.back();
  }, [disconnect, router]);

  // Render reactions
  const renderReactions = () => (
    <View style={styles.reactionsContainer} pointerEvents="none">
      {reactions.map((r) => (
        <Animated.View
          key={r.id}
          style={[
            styles.reaction,
            {
              transform: [{ translateX: r.x }, { translateY: r.y }],
              opacity: r.opacity,
            },
          ]}
        >
          <Text style={styles.reactionEmoji}>❤️</Text>
        </Animated.View>
      ))}
    </View>
  );

  // Render bid alert banner
  const renderBidAlert = () => {
    console.log('[ViewerStream] renderBidAlert called, showBidAlert:', showBidAlert, 'currentBid:', currentBid);
    if (!showBidAlert) return null;
    return (
      <View style={styles.bidAlertContainer}>
        <View style={styles.bidAlertContent}>
          <View style={styles.bidAlertLeft}>
            <View style={styles.bidAlertIcon}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </View>
            <View>
              <Text style={styles.bidAlertLabel}>New Top Bid</Text>
              <Text style={styles.bidAlertText}>
                Current bid is now ${currentBid.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.bidAlertDot} />
        </View>
      </View>
    );
  };

  // Show loading while initializing
  if (isConnecting && !streamClient) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
          <Text style={styles.loadingText}>Connecting to stream...</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Video Background - Stream */}
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
          <View style={styles.loadingContainer}>
            {isConnecting || isReconnecting ? (
              <>
                <ActivityIndicator size="large" color={COLORS.primaryGold} />
                <Text style={styles.loadingText}>
                  {isReconnecting
                    ? `Reconnecting... (Attempt ${reconnectAttempt})`
                    : 'Connecting to stream...'
                  }
                </Text>
              </>
            ) : isStreamPaused ? (
              <>
                <Ionicons name="pause-circle" size={64} color={COLORS.textMuted} />
                <Text style={styles.loadingText}>Stream Paused</Text>
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={handlePauseResume}
                >
                  <Text style={styles.resumeText}>Resume</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="wifi-off" size={64} color={COLORS.textMuted} />
                <Text style={styles.loadingText}>Disconnected</Text>
              </>
            )}
          </View>
        )}

        {/* Thumbnail overlay when not connected */}
        {!isConnected && streamInfo?.thumbnail && (
          <View style={styles.thumbnailOverlay}>
            <Image
              source={{ uri: streamInfo.thumbnail }}
              style={styles.thumbnail}
              blurRadius={1}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)', COLORS.luxuryBlack]}
              style={styles.videoOverlay}
            />
            {(isConnecting || isReconnecting) && (
              <View style={styles.connectingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primaryGold} />
                <Text style={styles.connectingText}>
                  {isReconnecting ? 'Reconnecting...' : 'Connecting to stream...'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Connection Controls */}
      {/* {(showConnectionControls || connectionState === 'error' || connectionState === 'offline') && (
        <ConnectionControls
          connectionState={connectionState}
          connectionQuality={connectionQuality}
          reconnectAttempt={reconnectAttempt}
          lastError={lastError}
          isStreamPaused={isStreamPaused}
          onRetry={reconnect}
          onPauseResume={handlePauseResume}
          onDisconnect={handleLeaveStream}
        />
      )} */}

      {/* Auction Overlay - Show if we have an active auction */}
      {activeAuction && activeAuction.id && (
        <View style={styles.auctionOverlayContainer}>
          {console.log('[ViewerStream] Rendering AuctionOverlay with currentBid:', currentBid, 'auction:', activeAuction.id)}
          <AuctionOverlayCompact
            currentBid={currentBid || activeAuction.currentBid || activeAuction.startingBid || 0}
            endsAt={activeAuction.endsAt ? new Date(activeAuction.endsAt) : new Date(Date.now() + 300000)}
          />
        </View>
      )}

      {/* Floating Reactions */}
      {renderReactions()}

      {/* Bid Alert Banner */}
      {renderBidAlert()}

      {/* Top Bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={[styles.topBar, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={handleLeaveStream}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {streamInfo?.title || 'Live Stream'}
          </Text>
          <View style={styles.liveIndicators}>
            <View style={styles.liveBadge}>
              <View style={[styles.liveDot, !isConnected && styles.liveDotOffline]} />
              <Text style={styles.liveText}>
                {isConnected ? 'LIVE' : connectionState.toUpperCase()}
              </Text>
            </View>
            <View style={styles.viewersBadge}>
              <Ionicons name="eye" size={12} color={COLORS.textPrimary} />
              <Text style={styles.viewersText}>{streamInfo?.viewerCount || 0}</Text>
            </View>
          </View>
        </View>

      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Chat Area - Using custom InstagramLiveChat UI */}
        <View style={styles.chatContainer}>
          <InstagramLiveChat
            streamId={streamId}
            showInput={true}
          />
        </View>

        {/* Auction Status / Errors */}
        {auctionError && (
          <View style={styles.auctionErrorBanner}>
            <Text style={styles.auctionErrorText}>{auctionError}</Text>
            <TouchableOpacity
              onPress={refetchAuction}
              style={styles.auctionRetryButton}
            >
              <Text style={styles.auctionRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!auctionError && !isAuctionLoading && !activeAuction && (
          <View style={styles.auctionEmptyBanner}>
            <Text style={styles.auctionEmptyText}>No live auction right now</Text>
          </View>
        )}

        {/* Quick Bid Buttons - Show if we have an auction with an ID */}
        {activeAuction?.id && (
          <View style={styles.quickBidContainer}>
            <TouchableOpacity
              style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
              onPress={() => handleQuickBid(100)}
              disabled={isPlacingBid}
            >
              <Text style={styles.quickBidText}>+$100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
              onPress={() => handleQuickBid(500)}
              disabled={isPlacingBid}
            >
              <Text style={styles.quickBidText}>+$500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
              onPress={() => handleQuickBid(1000)}
              disabled={isPlacingBid}
            >
              <Text style={styles.quickBidText}>+$1000</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reaction Button */}
        <View style={styles.reactionContainer}>
          <TouchableOpacity style={styles.reactionButton} onPress={addReaction}>
            <Text style={styles.reactionButtonText}>❤️</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.luxuryBlack,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  resumeButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 8,
  },
  resumeText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  videoContainer: {
    flex: 1,
    zIndex: 0,
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  connectingText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  auctionOverlayContainer: {
    position: 'absolute',
    top: '20%',
    left: 16,
    zIndex: 10,
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    zIndex: 30,
    pointerEvents: 'none',
  },
  reaction: {
    position: 'absolute',
    bottom: 0,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  bidAlertContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  bidAlertContent: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.luxuryBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bidAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bidAlertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.luxuryBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 14,
  },
  bidAlertLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.luxuryBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bidAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.luxuryBlack,
  },
  bidAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.luxuryBlack,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamInfo: {
    flex: 1,
    marginLeft: 8,
  },
  streamTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  liveIndicators: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#4CAF50',
  },
  liveDotOffline: {
    backgroundColor: '#FF5252',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  viewersText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  connectionIndicator: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textMuted,
  },
  connectionDotConnected: {
    backgroundColor: '#4CAF50',
  },
  connectionDotPoor: {
    backgroundColor: '#FF9800',
  },
  connectionDotError: {
    backgroundColor: '#FF5252',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  chatContainer: {
    height: 180,
    marginBottom: 12,
  },
  auctionErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  auctionErrorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  auctionRetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.errorRed,
  },
  auctionRetryText: {
    color: COLORS.errorRed,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  auctionEmptyBanner: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  auctionEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quickBidContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickBidButton: {
    backgroundColor: COLORS.overlayStrong,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  quickBidButtonDisabled: {
    opacity: 0.5,
  },
  quickBidText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  reactionContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonText: {
    fontSize: 20,
  },
});
