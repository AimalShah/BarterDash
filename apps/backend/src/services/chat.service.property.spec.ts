/**
 * Property-Based Test: Chat History and Synchronization
 * Feature: streaming-realtime-fixes, Property 7: Chat History and Synchronization
 * 
 * **Validates: Requirements 4.3, 4.4, 9.2**
 * 
 * This test validates that for any user joining an active stream, the Chat_Service 
 * should provide recent message history, and after network restoration, should 
 * synchronize any missed messages maintaining chronological order.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { ChatService } from './chat.service';
import { success } from '../utils/result';

// Type definitions for mocks
interface MockStreamSession {
  id: string;
  sellerId: string;
  state: string;
}

interface MockChatMessage {
  sessionId: string;
  userId: string;
  content: string;
  messageType: 'user_message' | 'system_message' | 'auction_update';
}

// Mock dependencies
jest.mock('../repositories/chat-messages.repository');
jest.mock('../repositories/stream-sessions.repository');
jest.mock('../utils/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      send: jest.fn().mockImplementation(async () => undefined),
    })),
  },
}));

describe('Property 7: Chat History and Synchronization', () => {
  let chatService: ChatService;

  // Test data generators
  const validUuidArb = fc.constantFrom(
    '123e4567-e89b-12d3-a456-426614174000',
    '987fcdeb-51a2-43f7-90bd-5a987c536444',
    '456e7890-e89b-12d3-a456-426614174111'
  );

  const messageContentArb = fc.string({ minLength: 1, maxLength: 100 });
  const messageTypeArb = fc.constantFrom('user_message', 'system_message', 'auction_update') as fc.Arbitrary<'user_message' | 'system_message' | 'auction_update'>;

  const chatMessageArb = fc.record({
    sessionId: validUuidArb,
    userId: validUuidArb,
    content: messageContentArb,
    messageType: messageTypeArb
  }) as fc.Arbitrary<MockChatMessage>;

  const streamSessionArb = fc.record({
    id: validUuidArb,
    sellerId: validUuidArb,
    state: fc.constantFrom('active', 'paused')
  }) as fc.Arbitrary<MockStreamSession>;

  beforeEach(() => {
    jest.clearAllMocks();
    chatService = new ChatService();
  });

  /**
   * Property 7.1: Recent Message History on Join
   * **Validates: Requirements 4.3, 9.2**
   */
  it('should provide recent message history when users join active streams', async () => {
    await fc.assert(
      fc.asyncProperty(
        streamSessionArb,
        fc.array(chatMessageArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 10, max: 50 }),
        async (session, existingMessages, historyLimit) => {
          // Mock the repositories with proper typing
          const mockChatRepository = (chatService as any).chatRepository;
          const mockStreamRepository = (chatService as any).streamRepository;
          
          (mockStreamRepository.findById as jest.MockedFunction<any>).mockImplementation(
            async () => success(session),
          );
          (mockStreamRepository.getActiveViewers as jest.MockedFunction<any>).mockImplementation(
            async () => success([]),
          );

          // Create a chronologically ordered set of existing messages
          const persistedMessages: any[] = [];

          // Mock message persistence to create historical messages
          existingMessages.forEach((message, index) => {
            const timestamp = new Date(Date.now() - (existingMessages.length - index) * 60000); // 1 minute apart
            const persistedMessage = {
              id: `msg-${String(index + 1).padStart(3, '0')}`,
              streamId: session.id,
              sessionId: session.id,
              userId: message.userId,
              message: message.content,
              messageType: message.messageType || 'user_message',
              isDeleted: false,
              deletedBy: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              metadata: {},
              user: {
                id: message.userId,
                username: `user-${message.userId.substring(0, 8)}`,
                fullName: `User ${message.userId.substring(0, 8)}`,
                avatarUrl: null
              }
            };
            persistedMessages.push(persistedMessage);
          });

          // Mock getMessageHistory to return recent messages with proper limit
          (mockChatRepository.getMessageHistory as jest.MockedFunction<any>).mockImplementation(
            async (sessionId: string, options: any = {}) => {
            const { limit = 50 } = options;
            const sessionMessages = persistedMessages
              .filter(msg => msg.sessionId === sessionId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
              .slice(0, limit);
            return success(sessionMessages);
          });

          // Mock getRecentMessages to use the same logic
          (mockChatRepository.getRecentMessages as jest.MockedFunction<any>).mockImplementation(
            async (sessionId: string, limit: number = 50) => {
            const sessionMessages = persistedMessages
              .filter(msg => msg.sessionId === sessionId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
              .slice(0, limit);
            return success(sessionMessages);
          });

          // Act: User joins stream and requests message history
          const historyResult = await chatService.getMessageHistory({
            sessionId: session.id,
            limit: historyLimit
          });

          // Act: User requests recent messages (simulating join)
          const recentResult = await chatService.getRecentMessages(session.id, historyLimit);

          // Assert: Both operations should succeed
          expect(historyResult.isOk()).toBe(true);
          expect(recentResult.isOk()).toBe(true);

          if (historyResult.isOk() && recentResult.isOk()) {
            const historyMessages = historyResult.value;
            const recentMessages = recentResult.value;

            // Assert: Should return messages up to the specified limit
            const expectedCount = Math.min(historyLimit, existingMessages.length);
            expect(historyMessages.length).toBe(expectedCount);
            expect(recentMessages.length).toBe(expectedCount);

            // Assert: Messages should be in reverse chronological order (most recent first)
            for (let i = 1; i < historyMessages.length; i++) {
              const prevTime = new Date(historyMessages[i - 1].createdAt).getTime();
              const currTime = new Date(historyMessages[i].createdAt).getTime();
              expect(prevTime).toBeGreaterThanOrEqual(currTime);
            }

            // Assert: Recent messages should match history messages
            expect(recentMessages).toEqual(historyMessages);

            // Assert: All returned messages should belong to the correct session
            historyMessages.forEach(message => {
              expect(message.sessionId).toBe(session.id);
              expect(message.isDeleted).toBe(false);
            });
          }
        }
      ),
      { numRuns: 15, timeout: 10000 }
    );
  });

  /**
   * Property 7.2: Message Synchronization After Network Restoration
   * **Validates: Requirements 4.4**
   */
  it('should synchronize missed messages after network restoration maintaining chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        streamSessionArb,
        fc.array(chatMessageArb, { minLength: 3, maxLength: 8 }),
        fc.array(chatMessageArb, { minLength: 2, maxLength: 5 }),
        async (session, initialMessages, missedMessages) => {
          // Mock the repositories with proper typing
          const mockChatRepository = (chatService as any).chatRepository;
          const mockStreamRepository = (chatService as any).streamRepository;
          
          (mockStreamRepository.findById as jest.MockedFunction<any>).mockImplementation(
            async () => success(session),
          );

          const allMessages: any[] = [];
          let messageCounter = 0;

          // Create initial messages (before network disconnection)
          const initialPersistedMessages = initialMessages.map((message, index) => {
            const timestamp = new Date(Date.now() - (initialMessages.length - index) * 60000);
            messageCounter++;
            return {
              id: `msg-${String(messageCounter).padStart(3, '0')}`,
              streamId: session.id,
              sessionId: session.id,
              userId: message.userId,
              message: message.content,
              messageType: message.messageType || 'user_message',
              isDeleted: false,
              deletedBy: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              metadata: {},
              user: {
                id: message.userId,
                username: `user-${message.userId.substring(0, 8)}`,
                fullName: `User ${message.userId.substring(0, 8)}`,
                avatarUrl: null
              }
            };
          });

          // Create missed messages (during network disconnection)
          const missedPersistedMessages = missedMessages.map((message, index) => {
            const timestamp = new Date(Date.now() + (index + 1) * 30000); // 30 seconds apart, after initial messages
            messageCounter++;
            return {
              id: `msg-${String(messageCounter).padStart(3, '0')}`,
              streamId: session.id,
              sessionId: session.id,
              userId: message.userId,
              message: message.content,
              messageType: message.messageType || 'user_message',
              isDeleted: false,
              deletedBy: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              metadata: {},
              user: {
                id: message.userId,
                username: `user-${message.userId.substring(0, 8)}`,
                fullName: `User ${message.userId.substring(0, 8)}`,
                avatarUrl: null
              }
            };
          });

          allMessages.push(...initialPersistedMessages, ...missedPersistedMessages);

          // Get the last message ID before disconnection (last initial message)
          const lastKnownMessageId = initialPersistedMessages[initialPersistedMessages.length - 1]?.id;

          // Mock syncMessages to return messages after the last known message
          (mockChatRepository.syncMessages as jest.MockedFunction<any>).mockImplementation(
            async (sessionId: string, lastMessageId: string) => {
            const lastMessageTime = allMessages.find(msg => msg.id === lastMessageId)?.createdAt;
            if (!lastMessageTime) {
              return success([]);
            }

            const syncedMessages = allMessages
              .filter(msg => 
                msg.sessionId === sessionId && 
                msg.createdAt.getTime() > lastMessageTime.getTime()
              )
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Most recent first

            return success(syncedMessages);
          });

          // Act: Synchronize messages after network restoration
          if (lastKnownMessageId) {
            const syncResult = await chatService.syncMessages(session.id, lastKnownMessageId);

            // Assert: Sync should succeed
            expect(syncResult.isOk()).toBe(true);

            if (syncResult.isOk()) {
              const syncedMessages = syncResult.value;

              // Assert: Should return only the missed messages
              expect(syncedMessages.length).toBe(missedMessages.length);

              // Assert: Messages should be in reverse chronological order (most recent first)
              for (let i = 1; i < syncedMessages.length; i++) {
                const prevTime = new Date(syncedMessages[i - 1].createdAt).getTime();
                const currTime = new Date(syncedMessages[i].createdAt).getTime();
                expect(prevTime).toBeGreaterThanOrEqual(currTime);
              }

              // Assert: All synced messages should be newer than the last known message
              const lastKnownTime = initialPersistedMessages[initialPersistedMessages.length - 1].createdAt.getTime();
              syncedMessages.forEach(message => {
                expect(new Date(message.createdAt).getTime()).toBeGreaterThan(lastKnownTime);
                expect(message.sessionId).toBe(session.id);
              });

              // Assert: Synced messages should match the missed messages content
              const syncedContents = syncedMessages.map(msg => msg.message).sort();
              const expectedContents = missedMessages.map(msg => msg.content).sort();
              expect(syncedContents).toEqual(expectedContents);
            }
          }
        }
      ),
      { numRuns: 15, timeout: 10000 }
    );
  });

  /**
   * Property 7.3: Chronological Order Preservation During Sync
   * **Validates: Requirements 4.4, 9.2**
   */
  it('should maintain chronological order when combining history and synced messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        streamSessionArb,
        fc.array(chatMessageArb, { minLength: 3, maxLength: 6 }),
        fc.array(chatMessageArb, { minLength: 2, maxLength: 4 }),
        async (session, historyMessages, newMessages) => {
          // Mock the repositories with proper typing
          const mockChatRepository = (chatService as any).chatRepository;
          const mockStreamRepository = (chatService as any).streamRepository;
          
          (mockStreamRepository.findById as jest.MockedFunction<any>).mockImplementation(
            async () => success(session),
          );

          const allMessages: any[] = [];
          let messageCounter = 0;

          // Create historical messages
          const historicalMessages = historyMessages.map((message, index) => {
            const timestamp = new Date(Date.now() - (historyMessages.length - index) * 120000); // 2 minutes apart
            messageCounter++;
            return {
              id: `hist-${String(messageCounter).padStart(3, '0')}`,
              streamId: session.id,
              sessionId: session.id,
              userId: message.userId,
              message: message.content,
              messageType: message.messageType || 'user_message',
              isDeleted: false,
              deletedBy: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              metadata: {},
              user: {
                id: message.userId,
                username: `user-${message.userId.substring(0, 8)}`,
                fullName: `User ${message.userId.substring(0, 8)}`,
                avatarUrl: null
              }
            };
          });

          // Create new messages (after history)
          const newPersistedMessages = newMessages.map((message, index) => {
            const timestamp = new Date(Date.now() + (index + 1) * 60000); // 1 minute apart, after history
            messageCounter++;
            return {
              id: `new-${String(messageCounter).padStart(3, '0')}`,
              streamId: session.id,
              sessionId: session.id,
              userId: message.userId,
              message: message.content,
              messageType: message.messageType || 'user_message',
              isDeleted: false,
              deletedBy: null,
              createdAt: timestamp,
              updatedAt: timestamp,
              metadata: {},
              user: {
                id: message.userId,
                username: `user-${message.userId.substring(0, 8)}`,
                fullName: `User ${message.userId.substring(0, 8)}`,
                avatarUrl: null
              }
            };
          });

          allMessages.push(...historicalMessages, ...newPersistedMessages);

          // Mock getMessageHistory to return all messages in reverse chronological order
          (mockChatRepository.getMessageHistory as jest.MockedFunction<any>).mockImplementation(
            async (sessionId: string, options: any = {}) => {
            const { limit = 100 } = options;
            const sessionMessages = allMessages
              .filter(msg => msg.sessionId === sessionId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Most recent first
              .slice(0, limit);
            return success(sessionMessages);
          });

          // Act: Get complete message history
          const historyResult = await chatService.getMessageHistory({
            sessionId: session.id,
            limit: 100
          });

          // Assert: History retrieval should succeed
          expect(historyResult.isOk()).toBe(true);

          if (historyResult.isOk()) {
            const retrievedMessages = historyResult.value;

            // Assert: Should return all messages
            expect(retrievedMessages.length).toBe(historyMessages.length + newMessages.length);

            // Assert: Messages should be in reverse chronological order (most recent first)
            for (let i = 1; i < retrievedMessages.length; i++) {
              const prevTime = new Date(retrievedMessages[i - 1].createdAt).getTime();
              const currTime = new Date(retrievedMessages[i].createdAt).getTime();
              expect(prevTime).toBeGreaterThanOrEqual(currTime);
            }

            // Assert: All messages should belong to the correct session
            retrievedMessages.forEach(message => {
              expect(message.sessionId).toBe(session.id);
              expect(message.isDeleted).toBe(false);
            });

            // Assert: Historical messages should appear after new messages (due to reverse chronological order)
            const newMessageIds = retrievedMessages.slice(0, newMessages.length).map(msg => msg.id);
            const historyMessageIds = retrievedMessages.slice(newMessages.length).map(msg => msg.id);

            newMessageIds.forEach(id => expect(id).toMatch(/^new-/));
            historyMessageIds.forEach(id => expect(id).toMatch(/^hist-/));
          }
        }
      ),
      { numRuns: 12, timeout: 10000 }
    );
  });
});
