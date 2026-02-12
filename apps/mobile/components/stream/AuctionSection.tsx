import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
} from "react-native";
import { COLORS } from "../../constants/colors";
import {
  formatBidAmount,
  getQuickBidOptions,
  getMinimumBidIncrement,
} from "../../lib/bidding/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;
const SWIPE_DISTANCE = 120;

interface Auction {
  id: string;
  currentBid?: number;
  startingBid?: number;
  endsAt: string | Date;
  status?: string;
  title?: string;
  shippingCost?: number;
  mode?: "normal" | "sudden_death";
}

interface AuctionSectionProps {
  auction: Auction | null;
  currentBid: number;
  minimumBid: number;
  bidIncrement: number;
  isPlacingBid: boolean;
  canBid: boolean;
  cannotBidReason: string | null;
  timerExtended?: boolean;
  newEndsAt?: string | null;
  onPlaceBid: () => Promise<boolean>;
  onPlaceCustomBid: (amount: number) => Promise<boolean>;
  onPlaceMaxBid: (amount: number) => Promise<boolean>;
}

function AuctionTimerCompact({ endsAt }: { endsAt: Date }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      setIsUrgent(diff <= 10 && diff > 0);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display =
    timeLeft > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : "Ended";

  return (
    <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
      <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
        {display}
      </Text>
    </View>
  );
}

export default function AuctionSection({
  auction,
  currentBid,
  minimumBid,
  bidIncrement,
  isPlacingBid,
  canBid,
  cannotBidReason,
  timerExtended,
  newEndsAt,
  onPlaceBid,
  onPlaceCustomBid,
  onPlaceMaxBid,
}: AuctionSectionProps) {
  const [showCustomBid, setShowCustomBid] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [isMaxBid, setIsMaxBid] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const safeCurrentBid = Number(
    currentBid ?? auction?.currentBid ?? auction?.startingBid ?? 0,
  );

  const safeMinimumBid = Number(minimumBid ?? 0);
  const safeBidIncrement = Number(bidIncrement ?? 0);

  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSwiping = useRef(false);
  const hasTriggeredBid = useRef(false);

  const endsAtToUse = newEndsAt
    ? new Date(newEndsAt)
    : auction?.endsAt
      ? new Date(auction.endsAt)
      : null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canBid && !isPlacingBid,
      onMoveShouldSetPanResponder: () => canBid && !isPlacingBid,
      onPanResponderGrant: () => {
        isSwiping.current = true;
        hasTriggeredBid.current = false;
        setShowPreview(true);
        setPreviewAmount(minimumBid);
        Animated.parallel([
          Animated.timing(swipeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.05,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) return;

        const progress = Math.min(gestureState.dx / SWIPE_DISTANCE, 1);
        swipeAnim.setValue(gestureState.dx);

        const increments = Math.floor(gestureState.dx / 40);
        const previewValue = minimumBid + increments * bidIncrement;
        setPreviewAmount(previewValue);

        if (gestureState.dx > SWIPE_THRESHOLD && !hasTriggeredBid.current) {
          hasTriggeredBid.current = true;
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderRelease: async (_, gestureState) => {
        isSwiping.current = false;
        setShowPreview(false);

        if (gestureState.dx > SWIPE_THRESHOLD && canBid && !isPlacingBid) {
          await onPlaceBid();
        }

        Animated.parallel([
          Animated.spring(swipeAnim, {
            toValue: 0,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        isSwiping.current = false;
        setShowPreview(false);
        Animated.parallel([
          Animated.spring(swipeAnim, {
            toValue: 0,
            friction: 7,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }),
  ).current;

  useEffect(() => {
    if (!canBid || isPlacingBid) {
      panResponder.panHandlers = {};
    }
  }, [canBid, isPlacingBid, panResponder]);

  const isEnded =
    auction?.status === "ended" ||
    auction?.status === "cancelled" ||
    (auction?.endsAt && new Date(auction.endsAt) <= new Date());

  const quickOptions = auction
    ? getQuickBidOptions(safeCurrentBid, safeBidIncrement)
    : [];

  const handleCustomBid = useCallback(async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;

    let success = false;
    if (isMaxBid) {
      success = await onPlaceMaxBid(amount);
    } else {
      success = await onPlaceCustomBid(amount);
    }

    if (success) {
      setShowCustomBid(false);
      setCustomAmount("");
      setIsMaxBid(false);
    }
  }, [customAmount, isMaxBid, onPlaceCustomBid, onPlaceMaxBid]);

  const handleQuickBid = useCallback(
    async (increment: number) => {
      const amount = currentBid + increment;
      await onPlaceCustomBid(amount);
    },
    [currentBid, onPlaceCustomBid],
  );

  const handleTapBid = useCallback(async () => {
    if (isSwiping.current) return;
    await onPlaceBid();
  }, [onPlaceBid]);

  const handleOpenCustom = useCallback(() => {
    setCustomAmount(minimumBid.toString());
    setShowCustomBid(true);
  }, [minimumBid]);

  if (!auction || !auction.id) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyBanner}>
          <Text style={styles.emptyText}>No live auction right now</Text>
        </View>
      </View>
    );
  }

  if (isEnded) {
    return (
      <View style={styles.container}>
        <View style={styles.endedBanner}>
          <Text style={styles.endedText}>Auction Ended</Text>
          <Text style={styles.endedSubtext}>
            Winning bid: {formatBidAmount(currentBid)}
          </Text>
        </View>
      </View>
    );
  }

  const displayBid = safeCurrentBid;
  //    currentBid || auction.currentBid || auction.startingBid || 0;
  const isSuddenDeath = auction.mode === "sudden_death";

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.priceSection}>
            <Text style={styles.currentBidLabel}>Current Bid</Text>
            <Text style={styles.currentBidAmount}>
              {formatBidAmount(displayBid)}
            </Text>
            <Text style={styles.minimumBidText}>
              Min: {formatBidAmount(minimumBid)} (+
              {formatBidAmount(bidIncrement).replace("$", "")})
            </Text>
          </View>
          {endsAtToUse && <AuctionTimerCompact endsAt={endsAtToUse} />}
        </View>

        {auction.title && (
          <Text style={styles.itemTitle} numberOfLines={1}>
            {auction.title}
          </Text>
        )}

        <View style={styles.infoFooter}>
          {auction.shippingCost !== undefined && (
            <Text style={styles.shippingText}>
              Shipping: {formatBidAmount(auction.shippingCost)}
            </Text>
          )}
          {isSuddenDeath && (
            <View style={styles.suddenDeathBadge}>
              <Text style={styles.suddenDeathText}>SUDDEN DEATH</Text>
            </View>
          )}
        </View>

        {timerExtended && !isSuddenDeath && (
          <View style={styles.timerExtendedBanner}>
            <Text style={styles.timerExtendedText}>
              ⏱ Timer extended! +10 seconds
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bidButtonWrapper}>
        <Animated.View
          style={[
            styles.bidButtonContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
          {...(canBid && !isPlacingBid ? panResponder.panHandlers : {})}
        >
          <TouchableOpacity
            style={[
              styles.mainBidButton,
              (!canBid || isPlacingBid) && styles.mainBidButtonDisabled,
            ]}
            onPress={handleTapBid}
            disabled={!canBid || isPlacingBid}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.swipeIndicator,
                {
                  transform: [
                    {
                      translateX: swipeAnim.interpolate({
                        inputRange: [0, SWIPE_DISTANCE],
                        outputRange: [-20, 60],
                      }),
                    },
                  ],
                  opacity: swipeAnim.interpolate({
                    inputRange: [0, SWIPE_THRESHOLD],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            >
              <Text style={styles.swipeArrow}>→</Text>
            </Animated.View>

            <View style={styles.bidButtonContent}>
              {isPlacingBid ? (
                <Text style={styles.bidButtonText}>BIDDING...</Text>
              ) : showPreview && previewAmount ? (
                <Text style={styles.bidButtonTextPreview}>
                  {formatBidAmount(previewAmount)}
                </Text>
              ) : (
                <>
                  <Text style={styles.bidButtonText}>
                    BID {formatBidAmount(minimumBid)}
                  </Text>
                  <Text style={styles.swipeHint}>Swipe → or Tap</Text>
                </>
              )}
            </View>

            <Animated.View
              style={[
                styles.swipeOverlay,
                {
                  opacity: swipeAnim.interpolate({
                    inputRange: [0, SWIPE_THRESHOLD],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {!canBid && cannotBidReason && (
        <Text style={styles.cannotBidText}>{cannotBidReason}</Text>
      )}

      <View style={styles.quickBidsContainer}>
        {quickOptions.map((increment) => (
          <TouchableOpacity
            key={increment}
            style={[
              styles.quickBidButton,
              (!canBid || isPlacingBid) && styles.quickBidButtonDisabled,
            ]}
            onPress={() => handleQuickBid(increment)}
            disabled={!canBid || isPlacingBid}
          >
            <Text style={styles.quickBidText}>
              +{formatBidAmount(increment)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.customBidButton}
        onPress={handleOpenCustom}
        disabled={!canBid || isPlacingBid}
      >
        <Text style={styles.customBidText}>Custom Bid / Max Bid</Text>
      </TouchableOpacity>

      <Modal
        visible={showCustomBid}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomBid(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isMaxBid ? "Set Max Bid" : "Enter Custom Bid"}
            </Text>

            <Text style={styles.modalSubtitle}>
              Current: {formatBidAmount(displayBid)} | Min:{" "}
              {formatBidAmount(minimumBid)}
            </Text>

            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
            />

            <View style={styles.quickAmountButtons}>
              {[
                minimumBid,
                minimumBid + bidIncrement,
                minimumBid + bidIncrement * 2,
              ].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickAmountButton}
                  onPress={() => setCustomAmount(amt.toString())}
                >
                  <Text style={styles.quickAmountText}>
                    {formatBidAmount(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.maxBidToggle}
              onPress={() => setIsMaxBid(!isMaxBid)}
            >
              <View
                style={[styles.checkbox, isMaxBid && styles.checkboxChecked]}
              >
                {isMaxBid && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.maxBidInfo}>
                <Text style={styles.maxBidLabel}>Max Bid</Text>
                <Text style={styles.maxBidDescription}>
                  Auto-bid up to this amount when outbid
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCustomBid(false);
                  setCustomAmount("");
                  setIsMaxBid(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!customAmount || parseFloat(customAmount) < minimumBid) &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleCustomBid}
                disabled={
                  !customAmount || parseFloat(customAmount) < minimumBid
                }
              >
                <Text style={styles.confirmButtonText}>
                  {isMaxBid ? "Set Max Bid" : "Place Bid"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  infoCard: {
    backgroundColor: COLORS.overlayStrong,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceSection: {
    flex: 1,
  },
  currentBidLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentBidAmount: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 4,
  },
  minimumBidText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: "600",
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  infoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  shippingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  suddenDeathBadge: {
    backgroundColor: COLORS.errorRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suddenDeathText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timerExtendedBanner: {
    backgroundColor: "rgba(234, 179, 8, 0.2)",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryGold,
  },
  timerExtendedText: {
    color: COLORS.primaryGold,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  timerContainer: {
    backgroundColor: COLORS.overlayMedium,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  timerUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: COLORS.errorRed,
  },
  timerText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerTextUrgent: {
    color: COLORS.errorRed,
  },
  bidButtonWrapper: {
    alignItems: "center",
    marginBottom: 12,
  },
  bidButtonContainer: {
    width: "100%",
  },
  mainBidButton: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primaryGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  mainBidButtonDisabled: {
    backgroundColor: COLORS.overlayMedium,
    shadowOpacity: 0,
    elevation: 0,
  },
  swipeIndicator: {
    position: "absolute",
    left: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  bidButtonContent: {
    alignItems: "center",
    zIndex: 1,
  },
  bidButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bidButtonTextPreview: {
    color: COLORS.luxuryBlack,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  swipeHint: {
    color: COLORS.luxuryBlack,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    opacity: 0.8,
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
  },
  cannotBidText: {
    color: COLORS.errorRed,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  quickBidsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  quickBidButton: {
    backgroundColor: COLORS.overlayMedium,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    flex: 1,
    alignItems: "center",
  },
  quickBidButtonDisabled: {
    opacity: 0.5,
  },
  quickBidText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  customBidButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  customBidText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyBanner: {
    backgroundColor: COLORS.overlayStrong,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  endedBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.errorRed,
  },
  endedText: {
    color: COLORS.errorRed,
    fontSize: 18,
    fontWeight: "800",
  },
  endedSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.luxuryBlack,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  amountInput: {
    backgroundColor: COLORS.overlayStrong,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    marginBottom: 16,
  },
  quickAmountButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: COLORS.overlayMedium,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  quickAmountText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  maxBidToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.overlayMedium,
    borderRadius: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryGold,
    borderColor: COLORS.primaryGold,
  },
  checkmark: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: "800",
  },
  maxBidInfo: {
    flex: 1,
  },
  maxBidLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  maxBidDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGold,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.overlayMedium,
  },
  confirmButtonText: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: "800",
  },
});
