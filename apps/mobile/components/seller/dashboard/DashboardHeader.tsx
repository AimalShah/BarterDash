import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";

interface DashboardHeaderProps {
  username: string;
  sellerStatus: any;
}

export default function DashboardHeader({ username, sellerStatus }: DashboardHeaderProps) {
  const application = sellerStatus?.application;
  const applicationStatus = application?.status as string | undefined;
  const statusLabel = applicationStatus ? applicationStatus.replace(/_/g, " ") : "not started";

  const badgeColor = (() => {
    if (applicationStatus === "approved") return COLORS.successGreen;
    if (applicationStatus === "rejected") return COLORS.errorRed;
    if (applicationStatus === "in_review") return COLORS.warningAmber;
    return COLORS.primaryGold;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.greeting}>Hi, {username}</Text>
          <Text style={styles.subtitle}>Seller Dashboard</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{statusLabel.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.luxuryBlack,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.luxuryBlack,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
