import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { bidsService } from "../../lib/api/services/bids";
import { ArrowLeft, Trophy, Clock, XCircle } from "lucide-react-native";
import { format } from "date-fns";
import { COLORS } from "../../constants/colors";

interface MyBid {
  id: string;
  amount: number;
  auctionId: string;
  auction?: {
    id: string;
    title: string;
    product?: {
      title: string;
      images?: string[];
    };
    status: string;
    currentPrice: number;
    endTime: string;
  };
  status: string;
  createdAt: string;
}

export default function MyBidsScreen() {
  const router = useRouter();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBids = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await bidsService.getMyBids();
      setBids(data);
    } catch (error) {
      console.error("Error fetching bids:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const getBidStatus = (bid: Bid) => {
    if (bid.auction?.status === "ended") {
      if (bid.status === "winning") {
        return { text: "WON", color: COLORS.successGreen, icon: Trophy };
      } else {
        return { text: "LOST", color: COLORS.errorRed, icon: XCircle };
      }
    }
    if (bid.auction?.status === "cancelled") {
      return { text: "CANCELLED", color: COLORS.textMuted, icon: XCircle };
    }
    return { text: "ACTIVE", color: COLORS.primaryGold, icon: Clock };
  };

  const renderBidItem = ({ item }: { item: Bid }) => {
    const status = getBidStatus(item);
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/stream/${item.auctionId}`)}
        style={{
          backgroundColor: COLORS.cardBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: COLORS.darkBorder,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: COLORS.textPrimary,
                marginBottom: 4,
              }}
            >
              {item.auction?.product?.title || item.auction?.title || "Unknown Item"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                marginBottom: 8,
              }}
            >
              {format(new Date(item.createdAt), "MMM d, h:mm a")}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: status.color,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <StatusIcon size={12} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: COLORS.textPrimary,
              }}
            >
              {status.text}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.darkBorder,
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 }}>
              Your Bid
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primaryGold }}>
              ${item.amount.toFixed(2)}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 }}>
              Current Price
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textPrimary }}>
              ${(item.auction?.currentPrice || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primaryGold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.darkBorder,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.textPrimary }}>
          My Bids
        </Text>
      </View>

      <FlatList
        data={bids}
        renderItem={renderBidItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBids(true)}
            tintColor={COLORS.primaryGold}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginBottom: 8 }}>
              No bids yet
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: "center" }}>
              Start bidding on auctions to see them here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
