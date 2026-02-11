import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mic, MicOff, Video as VideoIcon, VideoOff, RefreshCw } from "lucide-react-native";
import { COLORS } from "../../constants/colors";

interface StreamSideControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
}

const styles = StyleSheet.create({
  rightControls: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    zIndex: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.overlayStrong,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  controlButtonActive: {
    borderColor: COLORS.liveIndicator,
    backgroundColor: "rgba(220, 38, 36, 0.4)",
  },
});

export default function StreamSideControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
}: StreamSideControlsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.rightControls, { top: insets.top + 100 }]}>
      <TouchableOpacity
        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
        onPress={onToggleMute}
        testID="seller-mic-toggle"
      >
        {isMuted ? (
          <MicOff size={20} color={COLORS.textPrimary} />
        ) : (
          <Mic size={20} color={COLORS.textPrimary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
        onPress={onToggleCamera}
        testID="seller-camera-toggle"
      >
        {isCameraOff ? (
          <VideoOff size={20} color={COLORS.textPrimary} />
        ) : (
          <VideoIcon size={20} color={COLORS.textPrimary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onSwitchCamera}>
        <RefreshCw size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
