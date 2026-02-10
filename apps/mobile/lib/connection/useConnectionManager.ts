import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ConnectionManager, ConnectionState, ConnectionQuality, ConnectionStats } from './ConnectionManager';

export interface UseConnectionManagerOptions {
  streamId: string;
  connectFn: () => Promise<void>;
  disconnectFn: () => Promise<void>;
  pingFn?: () => Promise<number>;
  autoConnect?: boolean;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

export interface UseConnectionManagerReturn {
  connectionState: ConnectionState;
  connectionQuality: ConnectionQuality;
  connectionStats: ConnectionStats;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  lastError: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
}

/**
 * React Hook for Connection Manager
 * Provides connection state management with automatic reconnection
 */
export function useConnectionManager(
  options: UseConnectionManagerOptions
): UseConnectionManagerReturn {
  const { streamId, connectFn, disconnectFn, pingFn, autoConnect = true } = options;
  
  const managerRef = useRef<ConnectionManager | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('unknown');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Initialize connection manager
  useEffect(() => {
    managerRef.current = new ConnectionManager(connectFn, disconnectFn, {
      enableAutoReconnect: true,
      maxReconnectAttempts: 10,
      baseReconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      connectionTimeoutMs: 10000,
      heartbeatIntervalMs: 30000,
      pingFn,
      onStateChange: (state) => {
        setConnectionState(state);
        options.onStateChange?.(state);
      },
      onQualityChange: (quality) => {
        setConnectionQuality(quality);
      },
      onReconnect: (attempt) => {
        setReconnectAttempt(attempt);
      },
      onError: (error) => {
        setLastError(error);
        options.onError?.(error);
      },
    });

    if (autoConnect) {
      managerRef.current.connect().catch(() => {
        // Initial connection will be retried automatically
      });
    }

    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [streamId]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && managerRef.current) {
        const stats = managerRef.current.getStats();
        if (stats.state === 'offline' || stats.state === 'error') {
          managerRef.current.connect().catch(() => {
            // Will retry automatically
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && managerRef.current) {
        const stats = managerRef.current.getStats();
        if (stats.state === 'offline') {
          managerRef.current.connect().catch(() => {
            // Will retry automatically
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(async () => {
    await managerRef.current?.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await managerRef.current?.disconnect();
  }, []);

  const reconnect = useCallback(async () => {
    await managerRef.current?.reconnect();
  }, []);

  const connectionStats: ConnectionStats = {
    state: connectionState,
    quality: connectionQuality,
    reconnectAttempt,
    lastError: lastError || undefined,
    isNetworkAvailable: true, // Will be updated by network listener
  };

  return {
    connectionState,
    connectionQuality,
    connectionStats,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isReconnecting: connectionState === 'reconnecting',
    reconnectAttempt,
    lastError,
    connect,
    disconnect,
    reconnect,
  };
}

export default useConnectionManager;
