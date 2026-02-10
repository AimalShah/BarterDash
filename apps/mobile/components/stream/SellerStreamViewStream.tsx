import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import SellerStreamControls from "./SellerStreamControls";
import AuctionOverlay from "./AuctionOverlay";
import { streamsService } from "../../lib/api/services/streams";
import { auctionsService } from "../../lib/api/services/auctions";
import { devService } from "../../lib/api/services/dev";
import InstagramLiveChat from "./InstagramLiveChat";
import { useAuthStore } from "../../store/authStore";
import { useLiveStream } from "../../hooks/useLiveStream";
import { useStreamAuctions } from "../../hooks/useStreamAuctions";
import { supabase } from "../../lib/supabase";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  HostLivestream,
} from "@stream-io/video-react-native-sdk";
import { COLORS } from "../../constants/colors";
import {
  X,
  Eye,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  RefreshCw,
  Sliders,
  ShoppingBag,
  Gift,
} from "lucide-react-native";

interface SellerStreamViewStreamProps {
  streamId: string;
  onEndStream: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.luxuryBlack,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 16,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  cameraOff: {
    backgroundColor: COLORS.luxuryBlackLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 12,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  endButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  liveInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlayStrong,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  liveBadge: {
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },
  duration: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 40,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlayStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  viewerText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  rightControls: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    zIndex: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  controlButtonActive: {
    borderColor: COLORS.liveIndicator,
    backgroundColor: "rgba(220, 38, 36, 0.4)",
  },
  bottomSection: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  chatContainer: {
    height: 140,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  actionBtn: {
    alignItems: "center",
    minWidth: 60,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  actionBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  goLiveButton: {
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
    ...COLORS.shadowMedium,
  },
  goLiveText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default function SellerStreamViewStream({
  streamId,
  onEndStream,
}: SellerStreamViewStreamProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const [isLive, setIsLive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [streamProducts, setStreamProducts] = useState<any[]>([]);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isPreparingLive, setIsPreparingLive] = useState(false);
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [streamCall, setStreamCall] = useState<any>(null);
  const streamClientRef = useRef<StreamVideoClient | null>(null);
  const streamCallRef = useRef<any>(null);
  const hasLeftCallRef = useRef(false);
  const hasDisconnectedRef = useRef(false);
  
  // Mock data for new features
  const [viewers] = useState<any[]>([
    { id: "1", username: "buyer123", joinedAt: new Date() },
    { id: "2", username: "collector_jane", joinedAt: new Date() },
  ]);
  const {
    activeAuction: liveAuction,
    refetch: refetchAuction,
    refreshAuction,
  } = useStreamAuctions(streamId);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const showDevTools = __DEV__;
  const devBuyerId = process.env.EXPO_PUBLIC_DEV_BUYER_ID || "878cdb21-ac5c-463f-8fbf-1bf152bd7a47";
  const devSellerId = process.env.EXPO_PUBLIC_DEV_SELLER_ID || "47d220db-95c8-4365-9ec9-530431bab107";


  const {
    viewerCount,
    streamStatus,
  } = useLiveStream(streamId, { autoJoin: false });

  const activeAuction = useMemo(() => {
    if (!liveAuction) return null;
    const fallbackProduct = streamProducts.find(
      (p) => p.product?.id === liveAuction.productId,
    )?.product;
    const product = liveAuction.product || fallbackProduct;
    if (!product) return null;
    const topBidder =
      liveAuction.currentBidder?.username ||
      liveAuction.currentBidder?.full_name ||
      liveAuction.currentBidder?.fullName ||
      undefined;

    return {
      id: liveAuction.id,
      product,
      currentBid: liveAuction.currentBid,
      bidCount: liveAuction.bidCount,
      endsAt: liveAuction.endsAt ? new Date(liveAuction.endsAt) : new Date(),
      status: liveAuction.status,
      topBidder,
    };
  }, [liveAuction, streamProducts]);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchStreamProducts();
      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  useEffect(() => {
    streamClientRef.current = streamClient;
  }, [streamClient]);

  useEffect(() => {
    streamCallRef.current = streamCall;
  }, [streamCall]);

  useEffect(() => {
    fetchStreamDetails();
    prepareCameraPreview();
    fetchStreamProducts();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const activeCall = streamCallRef.current;
      if (activeCall && !hasLeftCallRef.current) {
        hasLeftCallRef.current = true;
        activeCall.leave?.().catch?.((error: any) => {
          console.warn("Failed to leave call during cleanup:", error);
        });
      }
      const activeClient = streamClientRef.current;
      if (activeClient && !hasDisconnectedRef.current) {
        hasDisconnectedRef.current = true;
        activeClient.disconnectUser?.().catch?.((error: any) => {
          console.warn("Failed to disconnect Stream client during cleanup:", error);
        });
      }
    };
  }, [streamId]);

  useEffect(() => {
    if (!profile?.id) return;
    const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Missing Stream API key');
      return;
    }

    const user = {
      id: profile.id,
      name: profile.username || profile.full_name || profile.fullName || 'Host',
    };

    const tokenProvider = async () => {
      const { token } = await streamsService.getHostToken(streamId);
      return token;
    };

    const client = StreamVideoClient.getOrCreateInstance({
      apiKey,
      user,
      tokenProvider,
    });

    setStreamClient(client);
  }, [profile?.id, profile?.username, profile?.full_name, profile?.fullName, streamId]);

  const fetchStreamDetails = async () => {
    try {
      const data = await streamsService.findById(streamId);
      setStreamInfo(data);
      if (data.status === "live") {
        setIsLive(true);
        if (data.startedAt) {
          const start = new Date(data.startedAt).getTime();
          const now = new Date().getTime();
          setDuration(Math.floor((now - start) / 1000));
        }
        startTimer();
      }
    } catch (e) {
      console.error("Failed to fetch stream details", e);
    }
  };

  const fetchStreamProducts = useCallback(async () => {
    try {
      const data = await streamsService.getProducts(streamId);
      setStreamProducts(data);
    } catch (e) {
      console.error("Failed to fetch stream products", e);
    }
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;
    const channel = supabase
      .channel(`stream-products:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stream_products",
          filter: `stream_id=eq.${streamId}`,
        },
        () => {
          fetchStreamProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, fetchStreamProducts]);

  const prepareCameraPreview = useCallback(async () => {
    try {
      setInitializing(true);
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert("Camera Required", "Camera permission is needed to stream.");
          return;
        }
      }
    } catch (error) {
      console.error("Error preparing camera preview:", error);
    } finally {
      setInitializing(false);
    }
  }, [cameraPermission?.granted, requestCameraPermission]);

  const ensureLivePermissions = useCallback(async () => {
    let cameraGranted = !!cameraPermission?.granted;
    if (!cameraGranted) {
      const permission = await requestCameraPermission();
      cameraGranted = permission.granted;
    }

    let micGranted = !!microphonePermission?.granted;
    if (!micGranted) {
      const permission = await requestMicrophonePermission();
      micGranted = permission.granted;
    }

    if (!cameraGranted || !micGranted) {
      Alert.alert("Permissions Required", "Camera and microphone permissions are needed to stream.");
    }

    return cameraGranted && micGranted;
  }, [cameraPermission?.granted, microphonePermission?.granted, requestCameraPermission, requestMicrophonePermission]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const setCallAudioEnabled = async (callInstance: any, enabled: boolean) => {
    if (!callInstance) return;
    try {
      if (callInstance.microphone?.enable && callInstance.microphone?.disable) {
        if (enabled) {
          await callInstance.microphone.enable();
        } else {
          await callInstance.microphone.disable();
        }
        return;
      }
      if (typeof callInstance.setLocalAudioEnabled === "function") {
        await callInstance.setLocalAudioEnabled(enabled);
      }
    } catch (error) {
      console.warn("Failed to toggle microphone:", error);
    }
  };

  const setCallVideoEnabled = async (callInstance: any, enabled: boolean) => {
    if (!callInstance) return;
    try {
      if (callInstance.camera?.enable && callInstance.camera?.disable) {
        if (enabled) {
          await callInstance.camera.enable();
        } else {
          await callInstance.camera.disable();
        }
        return;
      }
      if (typeof callInstance.setLocalVideoEnabled === "function") {
        await callInstance.setLocalVideoEnabled(enabled);
      }
    } catch (error) {
      console.warn("Failed to toggle camera:", error);
    }
  };

  const enableCallMedia = async (callInstance: any) => {
    await setCallAudioEnabled(callInstance, true);
    await setCallVideoEnabled(callInstance, true);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m < 10 && h > 0 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const startStream = async () => {
    if (isLive || isJoining) return;

    const permissionsOk = await ensureLivePermissions();
    if (!permissionsOk) return;

    try {
      setIsPreparingLive(true);
      setIsJoining(true);
      hasLeftCallRef.current = false;
      hasDisconnectedRef.current = false;

      console.log('[STREAM] start: streamId=', streamId);

      if (!streamClient) {
        throw new Error('Streaming client not ready');
      }

      const callInstance = streamClient.call('livestream', streamId);
      await callInstance.join({ create: true });
      await enableCallMedia(callInstance);
      setStreamCall(callInstance);

      if (typeof callInstance.goLive === 'function') {
        await callInstance.goLive();
      }

      // Apply current mute/camera settings
      if (isMuted) {
        await setCallAudioEnabled(callInstance, false);
      }
      if (isCameraOff) {
        await setCallVideoEnabled(callInstance, false);
      }

      // Start stream via API
      console.log('[STREAM] calling streamsService.start', {
        streamId,
        apiBase: process.env.EXPO_PUBLIC_API_URL,
      });
      await streamsService.start(streamId);

      setIsLive(true);
      startTimer();
      console.log('✅ Stream started successfully with Stream');
    } catch (error: any) {
      console.error("Error going live:", error);
      if (streamCall) {
        await streamCall.leave();
        setStreamCall(null);
      }
      Alert.alert("Error", error?.message || "Failed to start streaming.");
    } finally {
      setIsPreparingLive(false);
      setIsJoining(false);
    }
  };

  const handleEndStream = () => {
    Alert.alert("End Stream", "Are you sure you want to end?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          try {
            if (timerRef.current) clearInterval(timerRef.current);
            await streamsService.end(streamId);
            const callToEnd = streamCallRef.current || streamCall;
            streamCallRef.current = null;
            setStreamCall(null);
            if (callToEnd && !hasLeftCallRef.current) {
              hasLeftCallRef.current = true;
              const hasConnectedUser = !!(streamClient as any)?.user?.id;
              if (hasConnectedUser && typeof callToEnd.endCall === "function") {
                await callToEnd.endCall();
              } else if (!hasConnectedUser) {
                console.warn("Skipping endCall: Stream client not connected");
              }
              await callToEnd.leave?.();
            }
            if (streamClient && !hasDisconnectedRef.current) {
              hasDisconnectedRef.current = true;
              await streamClient.disconnectUser?.();
            }
            setIsLive(false);
            onEndStream();
          } catch (error) {
            console.error("Error ending stream:", error);
          }
        },
      },
    ]);
  };

  const toggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    await setCallAudioEnabled(streamCall, !nextMuted);
  };

  const toggleCamera = async () => {
    const nextOff = !isCameraOff;
    setIsCameraOff(nextOff);
    await setCallVideoEnabled(streamCall, !nextOff);
  };

  const switchCamera = async () => {
    try {
      if (streamCall?.camera?.flip) {
        await streamCall.camera.flip();
      } else if (streamCall?.switchCamera) {
        await streamCall.switchCamera();
      }
    } catch (error) {
      console.warn("Failed to switch camera:", error);
    } finally {
      setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
    }
  };

  const handleStartAuction = async (productId: string, config: any) => {
    try {
      if (!isLive) {
        Alert.alert("Stream Not Live", "Start your stream before launching an auction.");
        return;
      }
      
      const product = streamProducts.find((p) => p.product.id === productId);
      if (!product) {
        Alert.alert("Error", "Product not found in stream.");
        return;
      }

      const durationMinutes = Math.max(1, Math.ceil((config.durationSeconds || 60) / 60));
      
      const auction = await auctionsService.startStreamAuction({
        stream_id: streamId,
        product_id: productId,
        starting_bid: config.startingBid,
        reserve_price: config.reservePrice,
        minimum_bid_increment: config.minimumBidIncrement || 1,
        duration_minutes: durationMinutes,
      }) as any;

      await refreshAuction(auction.id);
      await fetchStreamProducts();
      Alert.alert("Success", "Auction started!");
    } catch (error: any) {
      console.error("Error starting auction:", error);
      Alert.alert("Error", error?.response?.data?.error?.message || error?.message || "Failed to start auction.");
    }
  };

  const handleAddProduct = () => {
    setShowControls(false);
    router.push(`/seller/stream/add-product/${streamId}`);
  };

  const handleMockAuctionWin = async () => {
    try {
      const result = await devService.createMockAuctionWin({
        buyerId: devBuyerId,
        sellerId: profile?.id || devSellerId,
        bidAmount: 25,
      });
      Alert.alert("Mock Auction Created", `Order ${result.orderNumber} created.`);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create mock auction.");
    }
  };

  const handlePinProduct = async (productId: string) => {
    const streamProduct = streamProducts.find((p) => p.product.id === productId);
    if (streamProduct) {
      await streamsService.markProductActive(streamId, streamProduct.id);
      fetchStreamProducts();
    }
  };

  const handleMarkAsSold = async (productId: string, auctionId?: string) => {
    const streamProduct = streamProducts.find((p) => p.product.id === productId);
    if (streamProduct) {
      await streamsService.markProductSold(streamId, streamProduct.id);
      await fetchStreamProducts();
      if (auctionId && liveAuction?.id === auctionId) {
        await refetchAuction();
      }
    }
  };

  const handleMarkAsPassed = async (productId: string) => {
    const streamProduct = streamProducts.find((p) => p.product.id === productId);
    if (!streamProduct) return;
    await streamsService.updateProduct(streamId, streamProduct.id, { status: "passed" });
    await fetchStreamProducts();
  };

  const handleExtendAuction = async (auctionId: string, seconds: number) => {
    Alert.alert(
      "Not Supported Yet",
      "Extending auctions isn't supported by the backend yet.",
    );
  };

  const handleEndAuctionEarly = async (auctionId: string) => {
    try {
      if (!liveAuction || liveAuction.id !== auctionId) return;

      if (liveAuction.bidCount > 0) {
        Alert.alert(
          "Cannot End Early",
          "This auction already has bids and will end automatically.",
        );
        return;
      }

      await auctionsService.cancel(auctionId);
      await refetchAuction();
      await fetchStreamProducts();
    } catch (error: any) {
      console.error("Error ending auction early:", error);
      Alert.alert("Error", error?.message || "Failed to end auction early.");
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <VideoIcon size={48} color={COLORS.primaryGold} />
        <Text style={styles.loadingText}>PREPARING LIVE STUDIO</Text>
      </View>
    );
  }

  // Determine if we should show preview or live video
  const showExpoPreview = isScreenFocused && cameraPermission?.granted && !isCameraOff && !isLive && !isPreparingLive;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera / Video Layer */}
      <View style={styles.videoContainer}>
        {streamClient && streamCall ? (
          <StreamVideo client={streamClient}>
            <StreamCall call={streamCall}>
              <HostLivestream
                onStartStreamHandler={startStream}
                onEndStreamHandler={handleEndStream}
                HostLivestreamTopView={null}
                HostLivestreamControls={null}
              />
            </StreamCall>
          </StreamVideo>
        ) : showExpoPreview ? (
          <CameraView style={styles.video} facing={cameraFacing} />
        ) : (
          <View style={[styles.video, styles.cameraOff]}>
            <VideoOff size={48} color={COLORS.textMuted} />
            <Text style={styles.cameraOffText}>CAMERA OFF</Text>
          </View>
        )}
      </View>

      {/* Auction Display Overlay */}
      {activeAuction && (
        <AuctionOverlay
          currentBid={activeAuction.currentBid}
          bidCount={activeAuction.bidCount}
          endsAt={activeAuction.endsAt}
          productTitle={activeAuction.product.title}
          topBidder={activeAuction.topBidder}
        />
      )}

      {/* Top Bar Navigation */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topLeft}>
          <TouchableOpacity onPress={handleEndStream} style={styles.endButton}>
            <X size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.liveInfo}>
            {isLive ? (
              <>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <Text style={styles.duration}>{formatDuration(duration)}</Text>
              </>
            ) : (
              <View style={styles.previewBadge}>
                <Text style={styles.previewText}>PREVIEW</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightHeader}>
          <View style={styles.viewerCount}>
            <Eye size={14} color={COLORS.textPrimary} />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>
        </View>
      </View>

      {/* Side Quick Controls */}
      {!showControls && (
        <View style={[styles.rightControls, { top: insets.top + 100 }]}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
            testID="seller-mic-toggle"
          >
            {isMuted ? (
              <MicOff size={20} color={COLORS.textPrimary} />
            ) : (
              <Mic size={20} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
            onPress={toggleCamera}
            testID="seller-camera-toggle"
          >
            {isCameraOff ? (
              <VideoOff size={20} color={COLORS.textPrimary} />
            ) : (
              <VideoIcon size={20} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
            <RefreshCw size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Interaction Layer */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 12 }]}>
        {/* Chat Feed */}
        <View style={styles.chatContainer}>
          <InstagramLiveChat
            streamId={streamId}
            showInput={isLive}
            viewers={viewers}
          />
        </View>

        {/* Seller Toolbar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowControls(true)}>
            <View style={styles.iconCircle}>
              <Sliders size={20} color={COLORS.textPrimary} />
            </View>
            <Text style={styles.actionBtnText}>MANAGE</Text>
          </TouchableOpacity>

          {!isLive ? (
            <TouchableOpacity
              style={[styles.goLiveButton, isJoining && { opacity: 0.6 }]}
              onPress={startStream}
              disabled={isJoining}
              testID="seller-go-live-button"
            >
              <Text style={styles.goLiveText}>
                {isJoining ? "CONNECTING..." : "START STREAM"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.goLiveButton, { backgroundColor: COLORS.overlayStrong }]}
              onPress={handleEndStream}
              testID="seller-stop-stream-button"
            >
              <Text style={styles.goLiveText}>STOP STREAM</Text>
            </TouchableOpacity>
          )}

          {!isLive ? (
            <TouchableOpacity style={styles.actionBtn}>
              <View style={styles.iconCircle}>
                <Gift size={20} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.actionBtnText}>GIFT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/seller/sales")}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryGold }]}>
                <ShoppingBag size={20} color={COLORS.luxuryBlack} />
              </View>
              <Text style={[styles.actionBtnText, { color: COLORS.primaryGold }]}>SALES</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Full Control Dashboard */}
      {showControls && (
        <SellerStreamControls
          streamId={streamId}
          productQueue={streamProducts.map((sp, index) => ({
            id: sp.id,
            product: sp.product,
            orderIndex: index,
            status: sp.status,
          }))}
          activeAuction={activeAuction}
          pinnedProduct={streamProducts.find((p) => p.status === "active")?.product || null}
          onStartAuction={handleStartAuction}
          onPinProduct={handlePinProduct}
          onMarkAsSold={handleMarkAsSold}
          onMarkAsPassed={handleMarkAsPassed}
          onExtendAuction={handleExtendAuction}
          onEndAuctionEarly={handleEndAuctionEarly}
          onAddProduct={handleAddProduct}
          onMockAuctionWin={handleMockAuctionWin}
          showDevTools={showDevTools}
          onClose={() => setShowControls(false)}
        />
      )}
    </View>
  );
}
