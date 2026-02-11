import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Sliders, ShoppingBag, Gift } from "lucide-react-native";
import { COLORS } from "../../constants/colors";
import InstagramLiveChat from "./InstagramLiveChat";

interface StreamBottomBarProps {
  streamId: string;
  isLive: boolean;
  isJoining: boolean;
  viewers: any[];
  onShowControls: () => void;
  onStartStream: () => void;
  onEndStream: () => void;
}

const styles = StyleSheet.create({
  bottomSection: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  chatContainer: {
    height: 140,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  actionBtn: {
    alignItems: "center",
    minWidth: 60,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  actionBtnText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  goLiveButton: {
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
    ...COLORS.shadowMedium,
  },
  goLiveText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default function StreamBottomBar({
  streamId,
  isLive,
  isJoining,
  viewers,
  onShowControls,
  onStartStream,
  onEndStream,
}: StreamBottomBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 12 }]}>
      {/* Chat Feed */}
      <View style={styles.chatContainer}>
        <InstagramLiveChat
          streamId={streamId}
          showInput={isLive}
          viewers={viewers}
        />
      </View>

      {/* Seller Toolbar */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onShowControls}>
          <View style={styles.iconCircle}>
            <Sliders size={20} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.actionBtnText}>MANAGE</Text>
        </TouchableOpacity>

        {!isLive ? (
          <TouchableOpacity
            style={[styles.goLiveButton, isJoining && { opacity: 0.6 }]}
            onPress={onStartStream}
            disabled={isJoining}
            testID="seller-go-live-button"
          >
            <Text style={styles.goLiveText}>
              {isJoining ? "CONNECTING..." : "START STREAM"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.goLiveButton, { backgroundColor: COLORS.overlayStrong }]}
            onPress={onEndStream}
            testID="seller-stop-stream-button"
          >
            <Text style={styles.goLiveText}>STOP STREAM</Text>
          </TouchableOpacity>
        )}

        {!isLive ? (
          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.iconCircle}>
              <Gift size={20} color={COLORS.textPrimary} />
            </View>
            <Text style={styles.actionBtnText}>GIFT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/seller/sales")}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryGold }]}>
              <ShoppingBag size={20} color={COLORS.luxuryBlack} />
            </View>
            <Text style={[styles.actionBtnText, { color: COLORS.primaryGold }]}>SALES</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
