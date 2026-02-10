import { ConnectionManager, ConnectionState, ConnectionQuality } from '../ConnectionManager';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockPing: jest.Mock;
  let onStateChange: jest.Mock;
  let onQualityChange: jest.Mock;
  let onError: jest.Mock;
  let onReconnect: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockConnect = jest.fn().mockResolvedValue(undefined);
    mockDisconnect = jest.fn().mockResolvedValue(undefined);
    mockPing = jest.fn().mockResolvedValue(100);
    onStateChange = jest.fn();
    onQualityChange = jest.fn();
    onError = jest.fn();
    onReconnect = jest.fn();

    manager = new ConnectionManager(mockConnect, mockDisconnect, {
      enableAutoReconnect: true,
      maxReconnectAttempts: 5,
      baseReconnectDelayMs: 1000,
      maxReconnectDelayMs: 10000,
      connectionTimeoutMs: 5000,
      heartbeatIntervalMs: 1000,
      pingFn: mockPing,
      onStateChange,
      onQualityChange,
      onError,
      onReconnect,
    });
  });

  afterEach(() => {
    manager.destroy();
    jest.useRealTimers();
  });

  describe('Connection Lifecycle', () => {
    it('should connect successfully', async () => {
      await manager.connect();
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(manager.isConnected()).toBe(true);
      expect(onStateChange).toHaveBeenCalledWith('connecting');
      expect(onStateChange).toHaveBeenCalledWith('connected');
    });

    it('should disconnect successfully', async () => {
      await manager.connect();
      await manager.disconnect();
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(manager.isConnected()).toBe(false);
      expect(onStateChange).toHaveBeenCalledWith('disconnected');
    });

    it('should not connect if already connected', async () => {
      await manager.connect();
      await manager.connect();
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(manager.connect()).rejects.toThrow('Connection failed');
      
      expect(manager.isConnected()).toBe(false);
      expect(onStateChange).toHaveBeenCalledWith('error');
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Automatic Reconnection', () => {
    it('should attempt reconnection on connection failure', async () => {
      mockConnect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      try {
        await manager.connect();
      } catch (e) {
        // Expected to fail first
      }

      // Wait for reconnection attempt
      jest.advanceTimersByTime(1500);
      
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(onReconnect).toHaveBeenCalledWith(1);
    });

    it('should use exponential backoff for reconnection delays', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      try {
        await manager.connect();
      } catch (e) {
        // Expected
      }

      // First retry: ~1000ms
      jest.advanceTimersByTime(1500);
      expect(mockConnect).toHaveBeenCalledTimes(2);

      // Second retry: ~2000ms
      jest.advanceTimersByTime(2500);
      expect(mockConnect).toHaveBeenCalledTimes(3);

      // Third retry: ~4000ms
      jest.advanceTimersByTime(4500);
      expect(mockConnect).toHaveBeenCalledTimes(4);
    });

    it('should stop reconnecting after max attempts', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      try {
        await manager.connect();
      } catch (e) {
        // Expected
      }

      // Advance through all reconnection attempts
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(15000);
      }

      expect(mockConnect.mock.calls.length).toBeLessThanOrEqual(6); // Initial + 5 retries
      expect(onError).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: 'Max reconnection attempts reached' })
      );
    });

    it('should reset reconnection counter on successful connection', async () => {
      mockConnect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      try {
        await manager.connect();
      } catch (e) {
        // Expected
      }

      jest.advanceTimersByTime(1500);
      
      // Should be connected now
      expect(manager.isConnected()).toBe(true);
      
      // Get stats
      const stats = manager.getStats();
      expect(stats.reconnectAttempt).toBe(0);
    });
  });

  describe('Connection Quality', () => {
    it('should detect excellent quality (latency < 100ms)', async () => {
      mockPing.mockResolvedValue(50);
      
      await manager.connect();
      jest.advanceTimersByTime(100);
      
      expect(onQualityChange).toHaveBeenCalledWith('excellent');
    });

    it('should detect good quality (latency 100-300ms)', async () => {
      mockPing.mockResolvedValue(200);
      
      await manager.connect();
      jest.advanceTimersByTime(100);
      
      expect(onQualityChange).toHaveBeenCalledWith('good');
    });

    it('should detect fair quality (latency 300-600ms)', async () => {
      mockPing.mockResolvedValue(450);
      
      await manager.connect();
      jest.advanceTimersByTime(100);
      
      expect(onQualityChange).toHaveBeenCalledWith('fair');
    });

    it('should detect poor quality (latency > 600ms)', async () => {
      mockPing.mockResolvedValue(800);
      
      await manager.connect();
      jest.advanceTimersByTime(100);
      
      expect(onQualityChange).toHaveBeenCalledWith('poor');
    });

    it('should trigger reconnection on heartbeat failure', async () => {
      await manager.connect();
      
      mockPing.mockRejectedValueOnce(new Error('Ping failed'));
      jest.advanceTimersByTime(1000);
      
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Connection Timeout', () => {
    it('should timeout if connection takes too long', async () => {
      mockConnect.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const connectPromise = manager.connect();
      jest.advanceTimersByTime(5000);
      
      await expect(connectPromise).rejects.toThrow('Connection timeout');
    });
  });

  describe('Connection Stats', () => {
    it('should return accurate connection stats', async () => {
      const beforeConnect = manager.getStats();
      expect(beforeConnect.state).toBe('disconnected');
      expect(beforeConnect.quality).toBe('unknown');

      await manager.connect();
      
      const afterConnect = manager.getStats();
      expect(afterConnect.state).toBe('connected');
      expect(afterConnect.lastConnectedAt).toBeDefined();
    });
  });

  describe('Manual Reconnection', () => {
    it('should support manual reconnection', async () => {
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.reconnect();
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockConnect).toHaveBeenCalledTimes(2);
      expect(manager.isConnected()).toBe(true);
    });
  });
});

// Property-based tests
import * as fc from 'fast-check';

describe('ConnectionManager Property Tests', () => {
  it('should always transition through valid states', async () => {
    const validStates: ConnectionState[] = [
      'disconnected',
      'connecting',
      'connected',
      'reconnecting',
      'error',
      'offline',
    ];

    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    const manager = new ConnectionManager(mockConnect, mockDisconnect);

    const stats = manager.getStats();
    expect(validStates).toContain(stats.state);

    manager.destroy();
  });

  it('should never have negative reconnect attempts', () => {
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    const manager = new ConnectionManager(mockConnect, mockDisconnect);

    const stats = manager.getStats();
    expect(stats.reconnectAttempt).toBeGreaterThanOrEqual(0);

    manager.destroy();
  });

  it('should maintain consistent connection state', async () => {
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    const manager = new ConnectionManager(mockConnect, mockDisconnect);

    // Test: connected state should imply isConnected() returns true
    await manager.connect();
    expect(manager.isConnected()).toBe(true);
    expect(manager.getStats().state).toBe('connected');

    // Test: disconnected state should imply isConnected() returns false
    await manager.disconnect();
    expect(manager.isConnected()).toBe(false);
    expect(manager.getStats().state).toBe('disconnected');

    manager.destroy();
  });
});

export {};
