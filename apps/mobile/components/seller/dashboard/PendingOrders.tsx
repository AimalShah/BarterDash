import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ShoppingBag, ChevronRight } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";

interface PendingOrdersProps {
  count: number;
}

export default function PendingOrders({ count }: PendingOrdersProps) {
  if (count === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/seller/sales")}
        activeOpacity={0.85}
      >
        <View style={styles.iconContainer}>
          <ShoppingBag size={20} color={COLORS.luxuryBlack} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>
            {count} Pending Order{count > 1 ? "s" : ""}
          </Text>
          <Text style={styles.subtitle}>Tap to view and fulfill</Text>
        </View>
        <ChevronRight size={24} color={COLORS.luxuryBlack} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryGold,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.luxuryBlack}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    color: COLORS.luxuryBlack,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: `${COLORS.luxuryBlack}CC`,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
});
