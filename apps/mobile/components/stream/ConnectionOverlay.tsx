import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/colors";

interface ConnectionOverlayProps {
  isConnecting: boolean;
  isReconnecting: boolean;
  isStreamPaused: boolean;
  reconnectAttempt: number;
  isConnected: boolean;
  streamInfo: any;
  onResume?: () => void;
}

export default function ConnectionOverlay({
  isConnecting,
  isReconnecting,
  isStreamPaused,
  reconnectAttempt,
  isConnected,
  streamInfo,
  onResume,
}: ConnectionOverlayProps) {
  // Show connecting/reconnecting state
  if (isConnecting || isReconnecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primaryGold} />
        <Text style={styles.text}>
          {isReconnecting
            ? `Reconnecting... (Attempt ${reconnectAttempt})`
            : "Connecting to stream..."}
        </Text>
      </View>
    );
  }

  // Show paused state
  if (isStreamPaused) {
    return (
      <View style={styles.container}>
        <Ionicons name="pause-circle" size={64} color={COLORS.textMuted} />
        <Text style={styles.text}>Stream Paused</Text>
        {onResume && (
          <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
            <Text style={styles.resumeText}>Resume</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show disconnected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Ionicons name="wifi-off" size={64} color={COLORS.textMuted} />
        <Text style={styles.text}>Disconnected</Text>
        
        {/* Thumbnail overlay when not connected */}
        {streamInfo?.thumbnail && (
          <View style={styles.thumbnailOverlay}>
            <Image
              source={{ uri: streamInfo.thumbnail }}
              style={styles.thumbnail}
              blurRadius={1}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)", COLORS.luxuryBlack]}
              style={styles.videoOverlay}
            />
            <View style={styles.connectingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primaryGold} />
              <Text style={styles.connectingText}>Connecting...</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return null;
}

import { TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.luxuryBlack,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginTop: 16,
  },
  resumeButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 8,
  },
  resumeText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: "700",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  connectingText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
});
