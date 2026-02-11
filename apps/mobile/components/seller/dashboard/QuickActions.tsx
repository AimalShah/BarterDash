import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Plus, Video, Gavel } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/colors";

const QuickActionButton = ({ icon, label, onPress, highlight = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, highlight && styles.highlight]}
    activeOpacity={0.8}
  >
    {highlight ? (
      <LinearGradient
        colors={[COLORS.primaryGold, COLORS.secondaryGold]}
        style={styles.gradient}
      >
        {icon}
      </LinearGradient>
    ) : (
      <View style={styles.iconContainer}>{icon}</View>
    )}
    <Text style={[styles.label, highlight && styles.labelHighlight]}>{label}</Text>
  </TouchableOpacity>
);

export default function QuickActions() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QUICK ACTIONS</Text>
      <View style={styles.row}>
        <QuickActionButton
          icon={<Plus size={24} color={COLORS.luxuryBlack} />}
          label="Add Product"
          onPress={() => router.push("/seller/add-product")}
          highlight
        />
        <QuickActionButton
          icon={<Video size={24} color={COLORS.textPrimary} />}
          label="Go Live"
          onPress={() => router.push("/seller/create-stream")}
        />
        <QuickActionButton
          icon={<Gavel size={24} color={COLORS.textPrimary} />}
          label="New Auction"
          onPress={() => router.push("/seller/create-auction")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  highlight: {
    transform: [{ scale: 1.02 }],
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.luxuryBlackLight,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  labelHighlight: {
    color: COLORS.primaryGold,
  },
});
