import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import {
  CameraView,
} from "expo-camera";
import {
  StreamVideo,
  StreamCall,
  HostLivestream,
} from "@stream-io/video-react-native-sdk";
import { VideoOff } from "lucide-react-native";
import { COLORS } from "../../constants/colors";

interface StreamVideoLayerProps {
  streamClient: any;
  streamCall: any;
  isLive: boolean;
  isPreparingLive: boolean;
  isCameraOff: boolean;
  cameraPermissionGranted: boolean;
  cameraFacing: "front" | "back";
  onStartStream: () => void;
  onEndStream: () => void;
}

const styles = StyleSheet.create({
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  cameraOff: {
    backgroundColor: COLORS.luxuryBlackLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 12,
  },
});

export default function StreamVideoLayer({
  streamClient,
  streamCall,
  isLive,
  isPreparingLive,
  isCameraOff,
  cameraPermissionGranted,
  cameraFacing,
  onStartStream,
  onEndStream,
}: StreamVideoLayerProps) {
  const showExpoPreview = cameraPermissionGranted && !isCameraOff && !isLive && !isPreparingLive;

  return (
    <View style={styles.videoContainer}>
      {streamClient && streamCall ? (
        <StreamVideo client={streamClient}>
          <StreamCall call={streamCall}>
            <HostLivestream
              onStartStreamHandler={onStartStream}
              onEndStreamHandler={onEndStream}
              HostLivestreamTopView={null}
              HostLivestreamControls={null}
            />
          </StreamCall>
        </StreamVideo>
      ) : showExpoPreview ? (
        <CameraView style={styles.video} facing={cameraFacing} />
      ) : (
        <View style={[styles.video, styles.cameraOff]}>
          <VideoOff size={48} color={COLORS.textMuted} />
          <Text style={styles.cameraOffText}>CAMERA OFF</Text>
        </View>
      )}
    </View>
  );
}
