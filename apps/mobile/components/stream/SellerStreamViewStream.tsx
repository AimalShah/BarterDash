import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import SellerStreamControls from "./SellerStreamControls";
import AuctionOverlay from "./AuctionOverlay";
import StreamTopBar from "./StreamTopBar";
import StreamVideoLayer from "./StreamVideoLayer";
import StreamSideControls from "./StreamSideControls";
import StreamBottomBar from "./StreamBottomBar";
import { streamsService } from "../../lib/api/services/streams";
import { auctionsService } from "../../lib/api/services/auctions";
import { devService } from "../../lib/api/services/dev";
import { useAuthStore } from "../../store/authStore";
import { useStreamAuctions } from "../../hooks/useStreamAuctions";
import { useLiveStream } from "../../hooks/useLiveStream";
import {
  useStreamMedia,
  useStreamConnection,
  useStreamTimer,
} from "../../hooks/useStreamMedia";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants/colors";
import { Video as VideoIcon } from "lucide-react-native";

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
});

export default function SellerStreamViewStream({
  streamId,
  onEndStream,
}: SellerStreamViewStreamProps) {
  const router = useRouter();
  const { profile } = useAuthStore();

  // Core stream state
  const [isLive, setIsLive] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isPreparingLive, setIsPreparingLive] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Stream data
  const [streamProducts, setStreamProducts] = useState<any[]>([]);
  const [streamInfo, setStreamInfo] = useState<any>(null);

  // Hooks
  const {
    isMuted,
    isCameraOff,
    cameraFacing,
    cameraPermission,
    microphonePermission,
    toggleMute,
    toggleCamera,
    switchCamera,
    ensurePermissions,
    setCallAudioEnabled,
    setCallVideoEnabled,
  } = useStreamMedia();

  const { streamClient, streamCall, joinStream, leaveStream } =
    useStreamConnection(streamId);

  const { duration, startTimer, stopTimer, resetTimer } = useStreamTimer();
  const { viewerCount } = useLiveStream(streamId, { autoJoin: false });

  const {
    activeAuction: liveAuction,
    refetch: refetchAuction,
    refreshAuction,
  } = useStreamAuctions(streamId);

  // Derived auction data
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
      liveAuction.currentBidder?.fullName;

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

  // Initialize camera
  useEffect(() => {
    prepareCameraPreview();
    fetchStreamDetails();
    fetchStreamProducts();
  }, [streamId]);

  // Subscribe to product updates
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
  }, [streamId]);

  // Screen focus handling
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchStreamProducts();
      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  const prepareCameraPreview = useCallback(async () => {
    try {
      setInitializing(true);
      if (!cameraPermission?.granted) {
        await ensurePermissions();
      }
    } catch (error) {
      console.error("Error preparing camera preview:", error);
    } finally {
      setInitializing(false);
    }
  }, [cameraPermission?.granted, ensurePermissions]);

  const fetchStreamDetails = async () => {
    try {
      const data = await streamsService.findById(streamId);
      setStreamInfo(data);
      if (data.status === "live") {
        setIsLive(true);
        if (data.startedAt) {
          const start = new Date(data.startedAt).getTime();
          const now = new Date().getTime();
          resetTimer();
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

  const handleStartStream = async () => {
    if (isLive || isPreparingLive) return;

    const permissionsOk = await ensurePermissions();
    if (!permissionsOk) return;

    try {
      setIsPreparingLive(true);

      const callInstance = await joinStream();

      if (isMuted) {
        await setCallAudioEnabled(callInstance, false);
      }
      if (isCameraOff) {
        await setCallVideoEnabled(callInstance, false);
      }

      await streamsService.start(streamId);

      setIsLive(true);
      startTimer();
    } catch (error: any) {
      console.error("Error going live:", error);
      leaveStream();
    } finally {
      setIsPreparingLive(false);
    }
  };

  const handleEndStream = async () => {
    stopTimer();
    await streamsService.end(streamId);
    await leaveStream();
    setIsLive(false);
    onEndStream();
  };

  const handleStartAuction = async (productId: string, config: any) => {
    try {
      if (!isLive) {
        return;
      }

      const product = streamProducts.find((p) => p.product.id === productId);
      if (!product) {
        return;
      }

      const durationMinutes = Math.max(
        1,
        Math.ceil((config.durationSeconds || 60) / 60),
      );

      const auction = (await auctionsService.startStreamAuction({
        stream_id: streamId,
        product_id: productId,
        starting_bid: config.startingBid,
        reserve_price: config.reservePrice,
        minimum_bid_increment: config.minimumBidIncrement || 1,
        duration_minutes: durationMinutes,
      })) as any;

      await refreshAuction(auction.id);
      await fetchStreamProducts();
    } catch (error: any) {
      console.error("Error starting auction:", error);
    }
  };

  const handleAddProduct = () => {
    setShowControls(false);
    router.push(`/seller/stream/add-product/${streamId}`);
  };

  const handlePinProduct = async (productId: string) => {
    const streamProduct = streamProducts.find(
      (p) => p.product.id === productId,
    );
    if (streamProduct) {
      await streamsService.markProductActive(streamId, streamProduct.id);
      fetchStreamProducts();
    }
  };

  const handleMarkAsSold = async (productId: string, auctionId?: string) => {
    const streamProduct = streamProducts.find(
      (p) => p.product.id === productId,
    );
    if (streamProduct) {
      await streamsService.markProductSold(streamId, streamProduct.id);
      await fetchStreamProducts();
      if (auctionId && liveAuction?.id === auctionId) {
        await refetchAuction();
      }
    }
  };

  const handleMarkAsPassed = async (productId: string) => {
    const streamProduct = streamProducts.find(
      (p) => p.product.id === productId,
    );
    if (!streamProduct) return;
    await streamsService.updateProduct(streamId, streamProduct.id, {
      status: "passed",
    });
    await fetchStreamProducts();
  };

  const handleEndAuctionEarly = async (auctionId: string) => {
    try {
      if (!liveAuction || liveAuction.id !== auctionId) return;

      if (liveAuction.bidCount > 0) {
        return;
      }

      await auctionsService.cancel(auctionId);
      await refetchAuction();
      await fetchStreamProducts();
    } catch (error: any) {
      console.error("Error ending auction early:", error);
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

  return (
    <View style={styles.container}>
      <StreamVideoLayer
        streamClient={streamClient}
        streamCall={streamCall}
        isLive={isLive}
        isPreparingLive={isPreparingLive}
        isCameraOff={isCameraOff}
        cameraPermissionGranted={!!cameraPermission?.granted}
        cameraFacing={cameraFacing}
        onStartStream={handleStartStream}
        onEndStream={handleEndStream}
      />

      {activeAuction && (
        <AuctionOverlay
          currentBid={activeAuction.currentBid}
          bidCount={activeAuction.bidCount}
          endsAt={activeAuction.endsAt}
          productTitle={activeAuction.product.title}
          topBidder={activeAuction.topBidder}
        />
      )}

      <StreamTopBar
        isLive={isLive}
        duration={duration}
        viewerCount={viewerCount}
        onEndStream={handleEndStream}
      />

      {!showControls && (
        <StreamSideControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={() => toggleMute(streamCall)}
          onToggleCamera={() => toggleCamera(streamCall)}
          onSwitchCamera={() => switchCamera(streamCall)}
        />
      )}

      <StreamBottomBar
        streamId={streamId}
        isLive={isLive}
        isJoining={isPreparingLive}
        viewers={[]} // TODO : Fetch real viewers profiles
        onShowControls={() => setShowControls(true)}
        onStartStream={handleStartStream}
        onEndStream={handleEndStream}
      />

      {/* Full Controls Panel */}
      {/* TODO : fix the add product page axios 400 error when creating or add product and fix the controls ui.*/}
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
          pinnedProduct={
            streamProducts.find((p) => p.status === "active")?.product || null
          }
          onStartAuction={handleStartAuction}
          onPinProduct={handlePinProduct}
          onMarkAsSold={handleMarkAsSold}
          onMarkAsPassed={handleMarkAsPassed}
          onExtendAuction={() => {}}
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
