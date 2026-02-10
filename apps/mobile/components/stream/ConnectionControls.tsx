import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionState, ConnectionQuality } from '../../lib/connection/ConnectionManager';
import { COLORS } from '../../constants/colors';

interface ConnectionControlsProps {
  connectionState: ConnectionState;
  connectionQuality: ConnectionQuality;
  reconnectAttempt: number;
  lastError: Error | null;
  isStreamPaused: boolean;
  onRetry: () => void;
  onPauseResume: () => void;
  onDisconnect: () => void;
}

export function ConnectionControls({
  connectionState,
  connectionQuality,
  reconnectAttempt,
  lastError,
  isStreamPaused,
  onRetry,
  onPauseResume,
  onDisconnect,
}: ConnectionControlsProps) {
  const getStateIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Ionicons name="wifi" size={20} color="#4CAF50" />;
      case 'connecting':
      case 'reconnecting':
        return <ActivityIndicator size="small" color={COLORS.primaryGold} />;
      case 'error':
        return <Ionicons name="warning" size={20} color="#FF5252" />;
      case 'offline':
        return <Ionicons name="cloud-offline" size={20} color="#FF9800" />;
      default:
        return <Ionicons name="wifi-outline" size={20} color={COLORS.textMuted} />;
    }
  };

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FFC107';
      case 'poor':
        return '#FF9800';
      default:
        return COLORS.textMuted;
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${reconnectAttempt})...`;
      case 'error':
        return 'Connection Error';
      case 'offline':
        return 'Offline';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const showRetryButton = connectionState === 'error' || connectionState === 'offline';
  const showPauseButton = connectionState === 'connected';

  return (
    <View style={styles.container}>
      {/* Connection Status Bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)']}
        style={styles.statusBar}
      >
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>{getStateIcon()}</View>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {connectionState === 'connected' && (
            <View
              style={[
                styles.qualityIndicator,
                { backgroundColor: getQualityColor() },
              ]}
            >
              <Text style={styles.qualityText}>
                {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {lastError && (
          <Text style={styles.errorText} numberOfLines={2}>
            {lastError.message}
          </Text>
        )}
      </LinearGradient>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        {showRetryButton && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={18} color={COLORS.luxuryBlack} />
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        )}

        {showPauseButton && (
          <TouchableOpacity
            style={[styles.controlButton, isStreamPaused && styles.controlButtonActive]}
            onPress={onPauseResume}
          >
            <Ionicons
              name={isStreamPaused ? 'play' : 'pause'}
              size={18}
              color={isStreamPaused ? COLORS.primaryGold : COLORS.textPrimary}
            />
            <Text
              style={[
                styles.controlText,
                isStreamPaused && styles.controlTextActive,
              ]}
            >
              {isStreamPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        )}

        {(showRetryButton || showPauseButton) && (
          <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
            <Ionicons name="close-circle" size={18} color="#FF5252" />
            <Text style={styles.disconnectText}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 16,
    zIndex: 35,
  },
  statusBar: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  qualityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    color: COLORS.luxuryBlack,
    fontSize: 10,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  retryText: {
    color: COLORS.luxuryBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  controlButtonActive: {
    borderColor: COLORS.primaryGold,
    backgroundColor: 'rgba(244,197,66,0.1)',
  },
  controlText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  controlTextActive: {
    color: COLORS.primaryGold,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,82,82,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.4)',
    gap: 6,
  },
  disconnectText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ConnectionControls;
