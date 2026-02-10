import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ChatService } from './chat.service';
import { ChatMessagesRepository } from '../repositories/chat-messages.repository';
import { StreamSessionsRepository } from '../repositories/stream-sessions.repository';
import { success, failure, NotFoundError } from '../utils/result';

// Mock the repositories
jest.mock('../repositories/chat-messages.repository');
jest.mock('../repositories/stream-sessions.repository');
jest.mock('../utils/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      send: jest.fn(() => Promise.resolve({ status: 'ok' })),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback: any) => {
        // Simulate successful subscription
        setTimeout(() => callback('SUBSCRIBED'), 10);
        return Promise.resolve();
      }),
      unsubscribe: jest.fn(() => Promise.resolve()),
    })),
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockChatRepository: jest.Mocked<ChatMessagesRepository>;
  let mockStreamRepository: jest.Mocked<StreamSessionsRepository>;

  const mockSession = {
    id: 'session-1',
    sellerId: 'seller-1',
    auctionId: 'auction-1',
    channelId: 'channel-1',
    state: 'active' as const,
    createdAt: new Date(),
    startedAt: new Date(),
    endedAt: null,
    viewerCount: 2,
    metadata: {},
  };

  const mockMessage = {
    id: 'message-1',
    streamId: 'stream-1',
    sessionId: 'session-1',
    userId: 'user-1',
    message: 'Hello world',
    messageType: 'user_message' as const,
    isDeleted: false,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
    user: {
      id: 'user-1',
      username: 'testuser',
      fullName: 'Test User',
      avatarUrl: null,
    },
  };

  const mockViewer = {
    id: 'viewer-1',
    sessionId: 'session-1',
    userId: 'user-1',
    joinedAt: new Date(),
    leftAt: null,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocked instances
    mockChatRepository = {
      sendMessage: jest.fn(),
      getMessageHistory: jest.fn(),
      getRecentMessages: jest.fn(),
      syncMessages: jest.fn(),
      markMessagesAsRead: jest.fn(),
      resolveMessageConflicts: jest.fn(),
      deleteMessage: jest.fn(),
      getMessageById: jest.fn(),
      getMessageCount: jest.fn(),
      batchInsertMessages: jest.fn(),
    } as any;

    mockStreamRepository = {
      findById: jest.fn(),
      getActiveViewers: jest.fn(),
    } as any;

    // Create service instance
    chatService = new ChatService();
    
    // Replace the repositories with mocks
    (chatService as any).chatRepository = mockChatRepository;
    (chatService as any).streamRepository = mockStreamRepository;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));
      mockChatRepository.sendMessage.mockResolvedValue(success(mockMessage));

      // Act
      const result = await chatService.sendMessage({
        sessionId: 'session-1',
        userId: 'user-1',
        content: 'Hello world',
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(mockChatRepository.sendMessage).toHaveBeenCalledWith(
          'session-1',
          'user-1',
          'Hello world',
          'user_message',
          undefined
        );
      }
    });

    it('should reject empty messages', async () => {
      // Act
      const result = await chatService.sendMessage({
        sessionId: 'session-1',
        userId: 'user-1',
        content: '   ',
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Message content cannot be empty');
      }
    });

    it('should reject messages that are too long', async () => {
      // Act
      const result = await chatService.sendMessage({
        sessionId: 'session-1',
        userId: 'user-1',
        content: 'a'.repeat(1001),
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Message content too long');
      }
    });

    it('should verify session access before sending', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(failure(new NotFoundError('Stream session', 'invalid-session')));

      // Act
      const result = await chatService.sendMessage({
        sessionId: 'invalid-session',
        userId: 'user-1',
        content: 'Hello world',
      });

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockChatRepository.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('getMessageHistory', () => {
    it('should get message history with default pagination', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockChatRepository.getMessageHistory.mockResolvedValue(success([mockMessage]));

      // Act
      const result = await chatService.getMessageHistory({
        sessionId: 'session-1',
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([mockMessage]);
        expect(mockChatRepository.getMessageHistory).toHaveBeenCalledWith('session-1', {
          limit: 50,
          offset: 0,
          beforeId: undefined,
          afterId: undefined,
        });
      }
    });

    it('should get message history with custom pagination', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockChatRepository.getMessageHistory.mockResolvedValue(success([mockMessage]));

      // Act
      const result = await chatService.getMessageHistory({
        sessionId: 'session-1',
        limit: 20,
        offset: 10,
        beforeId: 'message-before',
      });

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockChatRepository.getMessageHistory).toHaveBeenCalledWith('session-1', {
        limit: 20,
        offset: 10,
        beforeId: 'message-before',
        afterId: undefined,
      });
    });

    it('should fail if session does not exist', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(null));

      // Act
      const result = await chatService.getMessageHistory({
        sessionId: 'invalid-session',
      });

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockChatRepository.getMessageHistory).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToChat', () => {
    it('should create a subscription for valid user and session', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));

      // Act
      const result = await chatService.subscribeToChat('session-1', 'user-1');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sessionId).toBe('session-1');
        expect(result.value.userId).toBe('user-1');
        expect(result.value.channel).toBe('chat:session-1');
        expect(result.value.isActive).toBe(true);
      }
    });

    it('should return existing subscription if already subscribed', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));

      // Act - Subscribe twice
      const result1 = await chatService.subscribeToChat('session-1', 'user-1');
      const result2 = await chatService.subscribeToChat('session-1', 'user-1');

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.id).toBe(result2.value.id);
      }
    });

    it('should fail if user does not have access to session', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success({ ...mockSession, state: 'ended' }));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([]));

      // Act
      const result = await chatService.subscribeToChat('session-1', 'unauthorized-user');

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  describe('syncMessages', () => {
    it('should sync messages after network restoration', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockChatRepository.syncMessages.mockResolvedValue(success([mockMessage]));

      // Act
      const result = await chatService.syncMessages('session-1', 'last-message-id');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([mockMessage]);
        expect(mockChatRepository.syncMessages).toHaveBeenCalledWith('session-1', 'last-message-id');
      }
    });

    it('should fail if session does not exist', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(null));

      // Act
      const result = await chatService.syncMessages('invalid-session', 'last-message-id');

      // Assert
      expect(result.isErr()).toBe(true);
      expect(mockChatRepository.syncMessages).not.toHaveBeenCalled();
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read for authorized user', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));
      mockChatRepository.markMessagesAsRead.mockResolvedValue(success(undefined));

      // Act
      const result = await chatService.markMessagesAsRead(
        'session-1',
        'user-1',
        ['message-1', 'message-2']
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockChatRepository.markMessagesAsRead).toHaveBeenCalledWith(
        'session-1',
        'user-1',
        ['message-1', 'message-2']
      );
    });
  });

  describe('resolveMessageConflicts', () => {
    it('should resolve message conflicts using timestamp ordering', async () => {
      // Arrange
      const conflictingMessages = [
        { id: 'message-2', timestamp: new Date('2024-01-01T12:01:00Z') },
        { id: 'message-1', timestamp: new Date('2024-01-01T12:00:00Z') },
      ];
      
      mockChatRepository.resolveMessageConflicts.mockResolvedValue(success([mockMessage]));

      // Act
      const result = await chatService.resolveMessageConflicts('session-1', conflictingMessages);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockChatRepository.resolveMessageConflicts).toHaveBeenCalledWith(
        'session-1',
        conflictingMessages
      );
    });
  });

  describe('sendSystemMessage', () => {
    it('should send system message', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([]));
      mockChatRepository.sendMessage.mockResolvedValue(success({ ...mockMessage, messageType: 'system_message' }));

      // Act
      const result = await chatService.sendSystemMessage(
        'session-1',
        'User joined the stream',
        'system_message'
      );

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockChatRepository.sendMessage).toHaveBeenCalledWith(
        'session-1',
        'system',
        'User joined the stream',
        'system_message',
        undefined
      );
    });
  });

  describe('getChatStats', () => {
    it('should return chat statistics', async () => {
      // Arrange
      mockChatRepository.getMessageCount.mockResolvedValue(success(42));
      mockChatRepository.getMessageHistory.mockResolvedValue(success([{ ...mockMessage, createdAt: new Date() }]));

      // Act
      const result = await chatService.getChatStats('session-1');

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.messageCount).toBe(42);
        expect(result.value.activeSubscriptions).toBe(0);
        expect(typeof result.value.recentActivity).toBe('boolean');
      }
    });
  });

  describe('handleConnectionError', () => {
    it('should retry connection with exponential backoff', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));

      // First create a subscription
      await chatService.subscribeToChat('session-1', 'user-1');

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Act
      const result = await chatService.handleConnectionError('session-1', 'user-1', error, 0);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should fail after max retries', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));

      // First create a subscription
      await chatService.subscribeToChat('session-1', 'user-1');

      // Act - call with max retries already reached
      const result = await chatService.handleConnectionError('session-1', 'user-1', error, 3);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Connection failed after 3 attempts');
      }
    });
  });

  describe('unsubscribeFromChat', () => {
    it('should unsubscribe from chat successfully', async () => {
      // Arrange
      mockStreamRepository.findById.mockResolvedValue(success(mockSession));
      mockStreamRepository.getActiveViewers.mockResolvedValue(success([mockViewer]));

      // First subscribe
      const subscribeResult = await chatService.subscribeToChat('session-1', 'user-1');
      expect(subscribeResult.isOk()).toBe(true);

      // Act - Unsubscribe
      if (subscribeResult.isOk()) {
        const result = await chatService.unsubscribeFromChat(subscribeResult.value.id);
        // Assert
        expect(result.isOk()).toBe(true);
      }
    });

    it('should handle unsubscribing from non-existent subscription', async () => {
      // Act
      const result = await chatService.unsubscribeFromChat('non-existent-subscription');

      // Assert
      expect(result.isOk()).toBe(true); // Should not fail
    });
  });
});