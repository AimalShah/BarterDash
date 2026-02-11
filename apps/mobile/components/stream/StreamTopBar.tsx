import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Eye } from "lucide-react-native";
import { COLORS } from "../../constants/colors";

interface StreamTopBarProps {
  isLive: boolean;
  duration: number;
  viewerCount: number;
  onEndStream: () => void;
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  endButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  liveInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlayStrong,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  liveBadge: {
    backgroundColor: COLORS.liveIndicator,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },
  duration: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 40,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.overlayStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  viewerText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
});

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ":" : ""}${m < 10 && h > 0 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function StreamTopBar({
  isLive,
  duration,
  viewerCount,
  onEndStream,
}: StreamTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topLeft}>
        <TouchableOpacity onPress={onEndStream} style={styles.endButton}>
          <X size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.liveInfo}>
          {isLive ? (
            <>
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.duration}>{formatDuration(duration)}</Text>
            </>
          ) : (
            <View style={styles.previewBadge}>
              <Text style={styles.previewText}>PREVIEW</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightHeader}>
        <View style={styles.viewerCount}>
          <Eye size={14} color={COLORS.textPrimary} />
          <Text style={styles.viewerText}>{viewerCount}</Text>
        </View>
      </View>
    </View>
  );
}
