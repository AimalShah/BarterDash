import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react-native";
import { COLORS } from "../../../constants/colors";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeAuctions: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

const StatCard = ({ icon, label, value, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
    <View style={styles.header}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </View>
    <Text style={styles.value}>{value}</Text>
  </TouchableOpacity>
);

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OVERVIEW</Text>
      <View style={styles.grid}>
        <StatCard
          icon={<Package size={16} color={COLORS.textPrimary} />}
          label="Products"
          value={stats.totalProducts}
          onPress={() => router.push("/seller/inventory")}
        />
        <StatCard
          icon={<ShoppingBag size={16} color={COLORS.textPrimary} />}
          label="Orders"
          value={stats.totalOrders}
          onPress={() => router.push("/seller/sales")}
        />
        <StatCard
          icon={<DollarSign size={16} color={COLORS.textPrimary} />}
          label="Revenue"
          value={`$${stats.totalRevenue.toFixed(0)}`}
        />
        <StatCard
          icon={<TrendingUp size={16} color={COLORS.textPrimary} />}
          label="Auctions"
          value={stats.activeAuctions}
          onPress={() => router.push("/seller/auctions")}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: COLORS.luxuryBlackLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "900",
  },
});
