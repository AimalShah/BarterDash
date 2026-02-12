import { notificationsService, Notification } from '../api/services/notifications';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Notifications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'bid',
    title: 'New Bid',
    message: 'Someone placed a bid on your auction',
    data: { auctionId: 'auction-1' },
    isRead: false,
    actionUrl: '/auctions/auction-1',
    createdAt: '2024-01-01T00:00:00Z',
  };

  describe('getNotifications', () => {
    it('should fetch notifications with default limit', async () => {
      const mockNotifications = [mockNotification];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockNotifications },
      });

      const result = await notificationsService.getNotifications();

      expect(result).toEqual(mockNotifications);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications?limit=50&offset=0');
    });

    it('should fetch notifications with custom limit and offset', async () => {
      const mockNotifications = [mockNotification];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockNotifications },
      });

      await notificationsService.getNotifications(20, 10);

      expect(apiClient.get).toHaveBeenCalledWith('/notifications?limit=20&offset=10');
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread notification count', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: { count: 5 } },
      });

      const result = await notificationsService.getUnreadCount();

      expect(result).toBe(5);
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValue({});

      await notificationsService.markAsRead('notif-1');

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/notif-1/read');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValue({});

      await notificationsService.markAllAsRead();

      expect(apiClient.patch).toHaveBeenCalledWith('/notifications/read-all');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await notificationsService.deleteNotification('notif-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/notif-1');
    });
  });

  describe('registerPushToken', () => {
    it('should register push token for iOS', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await notificationsService.registerPushToken('token-123', 'ios');

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/push-token', {
        token: 'token-123',
        platform: 'ios',
      });
    });

    it('should register push token for Android', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await notificationsService.registerPushToken('token-456', 'android');

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/push-token', {
        token: 'token-456',
        platform: 'android',
      });
    });

    it('should register push token for web', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await notificationsService.registerPushToken('token-789', 'web');

      expect(apiClient.post).toHaveBeenCalledWith('/notifications/push-token', {
        token: 'token-789',
        platform: 'web',
      });
    });
  });

  describe('unregisterPushToken', () => {
    it('should unregister push token', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await notificationsService.unregisterPushToken('token-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/push-token', {
        data: { token: 'token-123' },
      });
    });
  });
});
