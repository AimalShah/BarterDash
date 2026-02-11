import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AuctionOverlayCompact } from "./AuctionOverlay";
import { COLORS } from "../../constants/colors";

interface Auction {
  id: string;
  currentBid: number;
  startingBid?: number;
  endsAt: string | Date;
  status?: string;
}

interface AuctionSectionProps {
  auction: Auction | null;
  currentBid: number;
  isPlacingBid: boolean;
  auctionError: string | null;
  isLoading: boolean;
  onPlaceBid: (amount: number) => void;
  onRetry: () => void;
}

export default function AuctionSection({
  auction,
  currentBid,
  isPlacingBid,
  auctionError,
  isLoading,
  onPlaceBid,
  onRetry,
}: AuctionSectionProps) {
  // Show error state
  if (auctionError) {
    return (
      <View style={styles.auctionErrorBanner}>
        <Text style={styles.auctionErrorText}>{auctionError}</Text>
        <TouchableOpacity onPress={onRetry} style={styles.auctionRetryButton}>
          <Text style={styles.auctionRetryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.auctionEmptyBanner}>
        <Text style={styles.auctionEmptyText}>Loading auction...</Text>
      </View>
    );
  }

  // Show empty state
  if (!auction || !auction.id) {
    return (
      <View style={styles.auctionEmptyBanner}>
        <Text style={styles.auctionEmptyText}>No live auction right now</Text>
      </View>
    );
  }

  // Show auction with bidding buttons
  const displayBid = currentBid || auction.currentBid || auction.startingBid || 0;

  return (
    <>
      {/* Auction Overlay */}
      <View style={styles.auctionOverlayContainer}>
        <AuctionOverlayCompact
          currentBid={displayBid}
          endsAt={auction.endsAt ? new Date(auction.endsAt) : new Date(Date.now() + 300000)}
        />
      </View>

      {/* Quick Bid Buttons */}
      <View style={styles.quickBidContainer}>
        <TouchableOpacity
          style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
          onPress={() => onPlaceBid(100)}
          disabled={isPlacingBid}
        >
          <Text style={styles.quickBidText}>+$100</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
          onPress={() => onPlaceBid(500)}
          disabled={isPlacingBid}
        >
          <Text style={styles.quickBidText}>+$500</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBidButton, isPlacingBid && styles.quickBidButtonDisabled]}
          onPress={() => onPlaceBid(1000)}
          disabled={isPlacingBid}
        >
          <Text style={styles.quickBidText}>+$1000</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  auctionOverlayContainer: {
    position: "absolute",
    top: "20%",
    left: 16,
    zIndex: 10,
  },
  auctionErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 82, 82, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 82, 82, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  auctionErrorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    fontWeight: "600",
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
    fontWeight: "700",
    textTransform: "uppercase",
  },
  auctionEmptyBanner: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  auctionEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  quickBidContainer: {
    flexDirection: "row",
    justifyContent: "center",
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
    fontWeight: "700",
  },
});
