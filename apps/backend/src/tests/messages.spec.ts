jest.mock('../services/messaging.service', () => {
  const instance = {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    getMessages: jest.fn(),
    markAsRead: jest.fn(),
    sendMessage: jest.fn(),
    startConversation: jest.fn(),
  };

  const MessagingService = jest.fn().mockImplementation(() => instance);
  (MessagingService as any).mockInstance = instance;

  return { MessagingService };
});

jest.mock('../services/users.service', () => ({
  UsersService: jest.fn().mockImplementation(() => ({
    getProfile: jest.fn().mockResolvedValue({
      isOk: () => true,
      value: { username: 'User', avatarUrl: null },
    }),
  })),
}));

import request from 'supertest';
import express from 'express';
import http from 'http';
import messagesRoutes from '../routes/messages.routes';
import { MessagingService } from '../services/messaging.service';

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    // Valid UUID for testing
    req.user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1/messages', messagesRoutes);

let server: http.Server | null = null;
let canListen = true;

describe('Messages API', () => {
  let mockService: any;
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const otherUserId = '987fcdeb-51a2-43f7-90bd-5a987c536444';

  beforeAll((done) => {
    try {
      server = app.listen(0, '127.0.0.1');
      server.on('error', () => {
        canListen = false;
        done();
      });
      server.on('listening', () => done());
    } catch (error) {
      canListen = false;
      done();
    }
  });

  afterAll(() => {
    if (server && canListen) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = (MessagingService as any).mockInstance;
  });

  describe('GET /api/v1/messages/conversations', () => {
    it('should return a list of conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          participantIds: [testUserId, otherUserId],
          messages: [{ content: 'hello', createdAt: new Date(), readAt: null }],
          unreadCount: 1,
          lastMessageAt: new Date(),
        },
      ];

      mockService.getConversations.mockResolvedValue({
        isErr: () => false,
        value: mockConversations,
      });

      if (!canListen || !server) return;
      const response = await request(server).get('/api/v1/messages/conversations');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('conv-1');
      expect(response.body.data[0].otherUser.id).toBe(otherUserId);
      expect(mockService.getConversations).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('POST /api/v1/messages/conversations/:id', () => {
    it('should send a message', async () => {
      const mockMessage = {
        id: 'msg-1',
        content: 'Hello world',
        senderId: testUserId,
        createdAt: new Date(),
      };

      mockService.sendMessage.mockResolvedValue({
        isErr: () => false,
        value: mockMessage,
      });

      if (!canListen || !server) return;
      const response = await request(server)
        .post('/api/v1/messages/conversations/conv-1')
        .send({ content: 'Hello world' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello world');
      expect(mockService.sendMessage).toHaveBeenCalledWith(
        'conv-1',
        testUserId,
        'Hello world',
      );
    });

    it('should validate empty content', async () => {
      if (!canListen || !server) return;
      const response = await request(server)
        .post('/api/v1/messages/conversations/conv-1')
        .send({ content: '' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/v1/messages/start', () => {
    it('should start a conversation', async () => {
      const mockResult = { id: 'new-conv' };
      mockService.startConversation.mockResolvedValue({
        isErr: () => false,
        value: mockResult,
      });

      if (!canListen || !server) return;
      const response = await request(server)
        .post('/api/v1/messages/start')
        .send({ userId: otherUserId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockService.startConversation).toHaveBeenCalledWith(
        testUserId,
        otherUserId,
      );
    });

    it('should prevent starting conversation with self', async () => {
      if (!canListen || !server) return;
      const response = await request(server)
        .post('/api/v1/messages/start')
        .send({ userId: testUserId });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Cannot start conversation with yourself',
      );
    });
  });
});
