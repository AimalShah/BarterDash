import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { validate } from '../middleware/validate';
import { MessagingService } from '../services/messaging.service';
import { UsersService } from '../services/users.service';
import { z } from 'zod';

const router = Router();
const messagesService = new MessagingService();
const usersService = new UsersService();

// Validation schemas
const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
});

const startConversationSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
  }),
});

/**
 * GET /messages/conversations
 * Get all conversations for the current user
 */
router.get(
  '/conversations',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messagesService.getConversations(req.user!.id);
    if (result.isErr()) throw result.error;

    // Get unique user IDs from conversations
    const otherUserIds = result.value
      .map((conv: any) =>
        conv.participantIds.find((id: string) => id !== req.user!.id),
      )
      .filter(Boolean);

    // Fetch profiles for all other users
    const userProfiles: Record<string, any> = {};
    await Promise.all(
      otherUserIds.map(async (userId: string) => {
        try {
          const userResult = await usersService.getProfile(userId);
          if (userResult.isOk()) {
            userProfiles[userId] = userResult.value;
          }
        } catch (e) {
          console.log('Failed to fetch user profile for', userId);
        }
      }),
    );

    // Transform to frontend-friendly format
    const conversations = result.value.map((conv: any) => {
      const otherUserId = conv.participantIds.find(
        (id: string) => id !== req.user!.id,
      );
      const userProfile = userProfiles[otherUserId];

      return {
        id: conv.id,
        otherUser: {
          id: otherUserId,
          username: userProfile?.username || 'User',
          avatarUrl: userProfile?.avatar_url || userProfile?.avatarUrl || null,
        },
        lastMessage: conv.messages?.[0]
          ? {
            content: conv.messages[0].content,
            createdAt: conv.messages[0].createdAt,
            readAt: conv.messages[0].readAt,
          }
          : null,
        unreadCount: conv.unreadCount || 0,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    res.json({ success: true, data: conversations });
  }),
);

/**
 * GET /messages/conversations/:id
 * Get messages in a specific conversation
 */
router.get(
  '/conversations/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const limitStr = req.query.limit;
    const offsetStr = req.query.offset;
    const limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 50;
    const offset = typeof offsetStr === 'string' ? parseInt(offsetStr, 10) : 0;

    // Verify user is part of conversation
    const convResult = await messagesService.getConversation(id);
    if (convResult.isErr()) throw convResult.error;

    const conv = convResult.value;
    if (!conv.participantIds.includes(req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not authorized' });
      return;
    }

    // Mark messages as read
    await messagesService.markAsRead(id, req.user!.id);

    // Get messages
    const result = await messagesService.getMessages(id, limit, offset);
    if (result.isErr()) throw result.error;

    // Get unique sender IDs
    const senderIds = [...new Set(result.value.map((m: any) => m.senderId))];

    // Fetch sender profiles
    const senderProfiles: Record<string, any> = {};
    await Promise.all(
      senderIds.map(async (senderId: string) => {
        try {
          const userResult = await usersService.getProfile(senderId);
          if (userResult.isOk()) {
            senderProfiles[senderId] = userResult.value;
          }
        } catch (e) {
          console.log('Failed to fetch sender profile for', senderId);
        }
      }),
    );

    // Enrich messages with sender info
    const enrichedMessages = result.value.map((msg: any) => {
      const sender = senderProfiles[msg.senderId];
      return {
        ...msg,
        sender: {
          id: msg.senderId,
          username: sender?.username || 'User',
          avatarUrl: sender?.avatar_url || sender?.avatarUrl || null,
        },
      };
    });

    res.json({ success: true, data: enrichedMessages });
  }),
);

/**
 * PATCH /messages/conversations/:id/read
 * Mark all messages in a conversation as read
 */
router.patch(
  '/conversations/:id/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    const result = await messagesService.markAsRead(id, req.user!.id);
    if (result.isErr()) throw result.error;

    res.json({ success: true, message: 'Messages marked as read' });
  }),
);

/**
 * POST /messages/conversations/:id
 * Send a message in a conversation
 */
router.post(
  '/conversations/:id',
  authenticate,
  validate(sendMessageSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { content } = req.body;

    const result = await messagesService.sendMessage(id, req.user!.id, content);
    if (result.isErr()) throw result.error;

    res.status(201).json({ success: true, data: result.value });
  }),
);

/**
 * POST /messages/start
 * Start a new conversation with a user
 */
router.post(
  '/start',
  authenticate,
  validate(startConversationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;

    if (userId === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot start conversation with yourself',
      });
      return;
    }

    const result = await messagesService.startConversation(
      req.user!.id,
      userId,
    );
    if (result.isErr()) throw result.error;

    res.status(201).json({ success: true, data: result.value });
  }),
);

/**
 * GET /messages/unread-count
 * Get total unread messages count for the current user
 */
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messagesService.getUnreadCount(req.user!.id);
    if (result.isErr()) throw result.error;

    res.json({ success: true, data: result.value });
  }),
);

export default router;
