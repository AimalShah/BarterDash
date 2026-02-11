import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

interface BidAlertProps {
  show: boolean;
  currentBid: number;
}

export default function BidAlert({ show, currentBid }: BidAlertProps) {
  if (!show) return null;

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
}

const styles = StyleSheet.create({
  bidAlertContainer: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  bidAlertContent: {
    backgroundColor: COLORS.primaryGold,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: COLORS.luxuryBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bidAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bidAlertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.luxuryBlack,
    justifyContent: "center",
    alignItems: "center",
  },
  fireEmoji: {
    fontSize: 14,
  },
  bidAlertLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.luxuryBlack,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bidAlertText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.luxuryBlack,
  },
  bidAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.luxuryBlack,
  },
});
