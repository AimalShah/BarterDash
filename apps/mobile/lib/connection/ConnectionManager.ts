import { AppState, AppStateStatus, NetInfoState } from '@react-native-community/netinfo';
import * as Network from 'expo-network';

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error' 
  | 'offline';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface ConnectionManagerOptions {
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  connectionTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  enableAutoReconnect?: boolean;
  onStateChange?: (state: ConnectionState) => void;
  onQualityChange?: (quality: ConnectionQuality) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

export interface ConnectionStats {
  state: ConnectionState;
  quality: ConnectionQuality;
  reconnectAttempt: number;
  lastConnectedAt?: Date;
  lastError?: Error;
  isNetworkAvailable: boolean;
  latencyMs?: number;
}

/**
 * Connection Manager with automatic reconnection
 * Implements Requirements 7.1, 7.2, 7.5 from streaming-realtime-fixes
 */
export class ConnectionManager {
  private state: ConnectionState = 'disconnected';
  private quality: ConnectionQuality = 'unknown';
  private reconnectAttempt: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimeoutTimer: NodeJS.Timeout | null = null;
  private lastConnectedAt?: Date;
  private lastError?: Error;
  private isNetworkAvailable: boolean = true;
  private isAppActive: boolean = true;
  private connectFn: () => Promise<void>;
  private disconnectFn: () => Promise<void>;
  private pingFn?: () => Promise<number>;
  private options: Required<ConnectionManagerOptions>;
  private abortController: AbortController | null = null;

  constructor(
    connectFn: () => Promise<void>,
    disconnectFn: () => Promise<void>,
    options: ConnectionManagerOptions = {}
  ) {
    this.connectFn = connectFn;
    this.disconnectFn = disconnectFn;
    this.pingFn = options.pingFn;
    
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      baseReconnectDelayMs: options.baseReconnectDelayMs ?? 1000,
      maxReconnectDelayMs: options.maxReconnectDelayMs ?? 30000,
      connectionTimeoutMs: options.connectionTimeoutMs ?? 10000,
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
      enableAutoReconnect: options.enableAutoReconnect ?? true,
      onStateChange: options.onStateChange ?? (() => {}),
      onQualityChange: options.onQualityChange ?? (() => {}),
      onError: options.onError ?? (() => {}),
      onReconnect: options.onReconnect ?? (() => {}),
    };

    this.setupAppStateListener();
    this.setupNetworkListener();
  }

  /**
   * Get current connection stats
   */
  getStats(): ConnectionStats {
    return {
      state: this.state,
      quality: this.quality,
      reconnectAttempt: this.reconnectAttempt,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      isNetworkAvailable: this.isNetworkAvailable,
    };
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Connect to the stream
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.log('[ConnectionManager] Already connected or connecting');
      return;
    }

    if (!this.isNetworkAvailable) {
      this.setState('offline');
      throw new Error('Network unavailable');
    }

    this.setState('connecting');
    this.abortController = new AbortController();

    // Set connection timeout
    this.connectionTimeoutTimer = setTimeout(() => {
      if (this.state === 'connecting') {
        this.handleError(new Error('Connection timeout'));
      }
    }, this.options.connectionTimeoutMs);

    try {
      await this.connectFn();
      this.clearConnectionTimeout();
      this.setState('connected');
      this.lastConnectedAt = new Date();
      this.reconnectAttempt = 0;
      this.lastError = undefined;
      this.startHeartbeat();
    } catch (error) {
      this.clearConnectionTimeout();
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the stream
   */
  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.clearHeartbeat();
    this.clearConnectionTimeout();
    this.abortController?.abort();
    
    if (this.state === 'disconnected') {
      return;
    }

    try {
      await this.disconnectFn();
    } catch (error) {
      console.error('[ConnectionManager] Error during disconnect:', error);
    } finally {
      this.setState('disconnected');
    }
  }

  /**
   * Reconnect manually
   */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }

  /**
   * Retry connection with exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (!this.options.enableAutoReconnect) {
      return;
    }

    if (this.reconnectAttempt >= this.options.maxReconnectAttempts) {
      this.setState('error');
      this.options.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    if (!this.isNetworkAvailable || !this.isAppActive) {
      console.log('[ConnectionManager] Skipping reconnect - network or app inactive');
      return;
    }

    this.reconnectAttempt++;
    this.setState('reconnecting');
    this.options.onReconnect?.(this.reconnectAttempt);

    // Calculate delay with exponential backoff and jitter
    const delay = this.calculateReconnectDelay();
    console.log(`[ConnectionManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // Connection failed, will retry
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Calculate reconnect delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    const exponentialDelay = this.options.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.options.maxReconnectDelayMs);
  }

  /**
   * Handle connection error
   */
  private handleError(error: Error): void {
    console.error('[ConnectionManager] Connection error:', error);
    this.lastError = error;
    this.options.onError?.(error);
    this.setState('error');
    this.attemptReconnect();
  }

  /**
   * Start heartbeat to monitor connection quality
   */
  private startHeartbeat(): void {
    if (!this.pingFn) return;

    this.heartbeatTimer = setInterval(async () => {
      if (this.state !== 'connected') return;

      try {
        const latency = await this.pingFn();
        this.updateQuality(latency);
      } catch (error) {
        console.warn('[ConnectionManager] Heartbeat failed:', error);
        this.handleError(new Error('Heartbeat failed'));
      }
    }, this.options.heartbeatIntervalMs);
  }

  /**
   * Update connection quality based on latency
   */
  private updateQuality(latencyMs: number): void {
    let newQuality: ConnectionQuality;

    if (latencyMs < 100) {
      newQuality = 'excellent';
    } else if (latencyMs < 300) {
      newQuality = 'good';
    } else if (latencyMs < 600) {
      newQuality = 'fair';
    } else {
      newQuality = 'poor';
    }

    if (newQuality !== this.quality) {
      this.quality = newQuality;
      this.options.onQualityChange?.(newQuality);
      console.log(`[ConnectionManager] Quality changed to: ${newQuality} (${latencyMs}ms)`);
    }
  }

  /**
   * Set connection state and notify listeners
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      console.log(`[ConnectionManager] State: ${this.state} -> ${newState}`);
      this.state = newState;
      this.options.onStateChange?.(newState);
    }
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    // Note: In React Native, use AppState from 'react-native'
    // For Expo, we can use AppState from 'expo-app-state' or similar
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const isActive = nextAppState === 'active';
      this.isAppActive = isActive;

      if (isActive && this.state === 'offline' && this.isNetworkAvailable) {
        console.log('[ConnectionManager] App became active, attempting reconnect');
        this.attemptReconnect();
      } else if (!isActive && this.state === 'connected') {
        console.log('[ConnectionManager] App became inactive');
        // Optionally disconnect when app goes to background
      }
    };

    // Subscribe to app state changes
    // This would be imported from 'react-native' in actual usage
    // AppState.addEventListener('change', handleAppStateChange);
  }

  /**
   * Setup network state listener
   */
  private setupNetworkListener(): void {
    const handleNetworkChange = (state: NetInfoState) => {
      const isConnected = state.isConnected ?? true;
      this.isNetworkAvailable = isConnected;

      if (isConnected) {
        if (this.state === 'offline' || this.state === 'error') {
          console.log('[ConnectionManager] Network restored, attempting reconnect');
          this.attemptReconnect();
        }
      } else {
        console.log('[ConnectionManager] Network lost');
        this.setState('offline');
        this.clearReconnectTimer();
      }
    };

    // Subscribe to network changes
    // This would use @react-native-community/netinfo in actual usage
    // NetInfo.addEventListener(handleNetworkChange);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear heartbeat timer
   */
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeoutTimer) {
      clearTimeout(this.connectionTimeoutTimer);
      this.connectionTimeoutTimer = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    // Remove event listeners
    // AppState.removeEventListener('change', ...);
    // NetInfo.removeEventListener(...);
  }
}

export default ConnectionManager;
