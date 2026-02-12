import { ConnectionManager, ConnectionState, ConnectionQuality } from '../ConnectionManager';

describe('ConnectionManager', () => {
  let manager: ConnectionManager;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;

  beforeEach(() => {
    mockConnect = jest.fn().mockResolvedValue(undefined);
    mockDisconnect = jest.fn().mockResolvedValue(undefined);
    
    manager = new ConnectionManager(mockConnect, mockDisconnect, {
      enableAutoReconnect: false,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Connection Lifecycle', () => {
    it('should initialize in disconnected state', () => {
      expect(manager.isConnected()).toBe(false);
      const stats = manager.getStats();
      expect(stats.state).toBe('disconnected');
    });

    it('should connect successfully', async () => {
      await manager.connect();
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(manager.isConnected()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      
      await manager.disconnect();
      
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(manager.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      await manager.connect();
      await manager.connect();
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Stats', () => {
    it('should return connection stats', async () => {
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('quality');
      expect(stats).toHaveProperty('reconnectAttempt');
      expect(stats.state).toBe('disconnected');
    });

    it('should track last connected time', async () => {
      await manager.connect();
      
      const stats = manager.getStats();
      expect(stats.lastConnectedAt).toBeDefined();
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

  describe('Connection Quality', () => {
    it('should have unknown quality when disconnected', () => {
      const stats = manager.getStats();
      expect(stats.quality).toBe('unknown');
    });
  });

  describe('State Transitions', () => {
    it('should only have valid states', () => {
      const validStates: ConnectionState[] = [
        'disconnected',
        'connecting',
        'connected',
        'reconnecting',
        'error',
        'offline',
      ];

      const stats = manager.getStats();
      expect(validStates).toContain(stats.state);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect on destroy', async () => {
      await manager.connect();
      
      manager.destroy();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
