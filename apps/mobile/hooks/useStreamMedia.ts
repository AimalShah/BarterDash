import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import {
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { StreamVideoClient } from "@stream-io/video-react-native-sdk";
import { streamsService } from "../lib/api/services/streams";
import { useAuthStore } from "../store/authStore";

export function useStreamMedia() {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const setCallAudioEnabled = async (callInstance: any, enabled: boolean) => {
    if (!callInstance) return;
    try {
      if (callInstance.microphone?.enable && callInstance.microphone?.disable) {
        if (enabled) {
          await callInstance.microphone.enable();
        } else {
          await callInstance.microphone.disable();
        }
        return;
      }
      if (typeof callInstance.setLocalAudioEnabled === "function") {
        await callInstance.setLocalAudioEnabled(enabled);
      }
    } catch (error) {
      console.warn("Failed to toggle microphone:", error);
    }
  };

  const setCallVideoEnabled = async (callInstance: any, enabled: boolean) => {
    if (!callInstance) return;
    try {
      if (callInstance.camera?.enable && callInstance.camera?.disable) {
        if (enabled) {
          await callInstance.camera.enable();
        } else {
          await callInstance.camera.disable();
        }
        return;
      }
      if (typeof callInstance.setLocalVideoEnabled === "function") {
        await callInstance.setLocalVideoEnabled(enabled);
      }
    } catch (error) {
      console.warn("Failed to toggle camera:", error);
    }
  };

  const toggleMute = async (streamCall: any) => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    await setCallAudioEnabled(streamCall, !nextMuted);
  };

  const toggleCamera = async (streamCall: any) => {
    const nextOff = !isCameraOff;
    setIsCameraOff(nextOff);
    await setCallVideoEnabled(streamCall, !nextOff);
  };

  const switchCamera = async (streamCall: any) => {
    try {
      if (streamCall?.camera?.flip) {
        await streamCall.camera.flip();
      } else if (streamCall?.switchCamera) {
        await streamCall.switchCamera();
      }
    } catch (error) {
      console.warn("Failed to switch camera:", error);
    } finally {
      setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
    }
  };

  const ensurePermissions = async () => {
    let cameraGranted = !!cameraPermission?.granted;
    if (!cameraGranted) {
      const permission = await requestCameraPermission();
      cameraGranted = permission.granted;
    }

    let micGranted = !!microphonePermission?.granted;
    if (!micGranted) {
      const permission = await requestMicrophonePermission();
      micGranted = permission.granted;
    }

    if (!cameraGranted || !micGranted) {
      Alert.alert("Permissions Required", "Camera and microphone permissions are needed to stream.");
    }

    return cameraGranted && micGranted;
  };

  return {
    isMuted,
    isCameraOff,
    cameraFacing,
    cameraPermission,
    microphonePermission,
    toggleMute,
    toggleCamera,
    switchCamera,
    ensurePermissions,
    setCallAudioEnabled,
    setCallVideoEnabled,
  };
}

export function useStreamConnection(streamId: string) {
  const { profile } = useAuthStore();
  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [streamCall, setStreamCall] = useState<any>(null);
  const streamClientRef = useRef<StreamVideoClient | null>(null);
  const streamCallRef = useRef<any>(null);
  const hasLeftCallRef = useRef(false);
  const hasDisconnectedRef = useRef(false);

  useEffect(() => {
    streamClientRef.current = streamClient;
  }, [streamClient]);

  useEffect(() => {
    streamCallRef.current = streamCall;
  }, [streamCall]);

  useEffect(() => {
    if (!profile?.id) return;
    const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Missing Stream API key');
      return;
    }

    const user = {
      id: profile.id,
      name: profile.username || profile.full_name || profile.fullName || 'Host',
    };

    const tokenProvider = async () => {
      const { token } = await streamsService.getHostToken(streamId);
      return token;
    };

    const client = StreamVideoClient.getOrCreateInstance({
      apiKey,
      user,
      tokenProvider,
    });

    setStreamClient(client);

    return () => {
      const activeCall = streamCallRef.current;
      if (activeCall && !hasLeftCallRef.current) {
        hasLeftCallRef.current = true;
        activeCall.leave?.().catch?.((error: any) => {
          console.warn("Failed to leave call during cleanup:", error);
        });
      }
      const activeClient = streamClientRef.current;
      if (activeClient && !hasDisconnectedRef.current) {
        hasDisconnectedRef.current = true;
        activeClient.disconnectUser?.().catch?.((error: any) => {
          console.warn("Failed to disconnect Stream client during cleanup:", error);
        });
      }
    };
  }, [profile?.id, profile?.username, profile?.full_name, profile?.fullName, streamId]);

  const joinStream = async () => {
    if (!streamClient) {
      throw new Error('Streaming client not ready');
    }

    const callInstance = streamClient.call('livestream', streamId);
    await callInstance.join({ create: true });
    
    if (callInstance.microphone?.enable) {
      await callInstance.microphone.enable();
    }
    if (callInstance.camera?.enable) {
      await callInstance.camera.enable();
    }
    
    setStreamCall(callInstance);

    if (typeof callInstance.goLive === 'function') {
      await callInstance.goLive();
    }

    return callInstance;
  };

  const leaveStream = async () => {
    const callToEnd = streamCallRef.current || streamCall;
    streamCallRef.current = null;
    setStreamCall(null);
    
    if (callToEnd && !hasLeftCallRef.current) {
      hasLeftCallRef.current = true;
      const hasConnectedUser = !!(streamClient as any)?.user?.id;
      if (hasConnectedUser && typeof callToEnd.endCall === "function") {
        await callToEnd.endCall();
      }
      await callToEnd.leave?.();
    }
    
    if (streamClient && !hasDisconnectedRef.current) {
      hasDisconnectedRef.current = true;
      await streamClient.disconnectUser?.();
    }
  };

  return {
    streamClient,
    streamCall,
    joinStream,
    leaveStream,
    streamClientRef,
    streamCallRef,
    hasLeftCallRef,
    hasDisconnectedRef,
  };
}

export function useStreamTimer() {
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return {
    duration,
    startTimer,
    stopTimer,
    resetTimer,
  };
}
