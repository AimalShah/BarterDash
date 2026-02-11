import React from "react";
import {
  StatusBar,
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { useDashboard } from "../../hooks/useDashboard";

import DashboardHeader from "../../components/seller/dashboard/DashboardHeader";
import QuickActions from "../../components/seller/dashboard/QuickActions";
import VerificationCard from "../../components/seller/dashboard/VerificationCard";
import StreamSummary from "../../components/seller/dashboard/StreamSummary";
import StatsGrid from "../../components/seller/dashboard/StatsGrid";
import ProductsSection from "../../components/seller/dashboard/ProductsSection";
import PendingOrders from "../../components/seller/dashboard/PendingOrders";

export default function SellerDashboard() {
  const {
    username,
    products,
    streams,
    stats,
    sellerStatus,
    loading,
    refreshing,
    refresh,
  } = useDashboard();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.primaryGold}
          />
        }
      >
        <DashboardHeader username={username} sellerStatus={sellerStatus} />

        <View style={styles.content}>
          <QuickActions />
          <VerificationCard sellerStatus={sellerStatus} />
          <StreamSummary streams={streams} />
          <StatsGrid stats={stats} />
          <ProductsSection products={products} />
          <PendingOrders count={stats.pendingOrders} />
        </View>
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.luxuryBlack,
  },
  loadingText: {
    color: COLORS.primaryGold,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 24,
  },
});
