import { db } from '../db';
import { streamSessions, streamViewers } from '../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  InternalError,
} from '../utils/result';
import type {
  StreamSession,
  NewStreamSession,
  StreamViewer,
} from '../db/schema';

/**
 * Stream Sessions Repository
 * Data access layer for stream sessions, viewers, and related operations
 */
export class StreamSessionsRepository {
  /**
   * Create a new stream session
   */
  async create(data: NewStreamSession): Promise<AppResult<StreamSession>> {
    try {
      const [session] = await db
        .insert(streamSessions)
        .values(data)
        .returning();

      return success(session);
    } catch (error) {
      console.error('Error creating stream session:', error);
      return failure(new InternalError('Failed to create stream session'));
    }
  }

  /**
   * Find stream session by ID with related data
   */
  async findById(id: string): Promise<AppResult<StreamSession | null>> {
    try {
      const session = await db.query.streamSessions.findFirst({
        where: eq(streamSessions.id, id),
        with: {
          seller: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          auction: true,
          viewers: {
            with: {
              user: {
                columns: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
            where: eq(streamViewers.isActive, true),
          },
        },
      });

      return success(session || null);
    } catch (error) {
      console.error('Error finding stream session:', error);
      return failure(new InternalError('Failed to find stream session'));
    }
  }

  /**
   * Find stream session by channel ID
   */
  async findByChannelId(
    channelId: string,
  ): Promise<AppResult<StreamSession | null>> {
    try {
      const session = await db.query.streamSessions.findFirst({
        where: eq(streamSessions.channelId, channelId),
        with: {
          seller: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          auction: true,
        },
      });

      return success(session || null);
    } catch (error) {
      console.error('Error finding stream session by channel:', error);
      return failure(new InternalError('Failed to find stream session'));
    }
  }

  /**
   * Find active sessions for a seller
   */
  async findActiveBySeller(
    sellerId: string,
  ): Promise<AppResult<StreamSession[]>> {
    try {
      const sessions = await db.query.streamSessions.findMany({
        where: and(
          eq(streamSessions.sellerId, sellerId),
          eq(streamSessions.state, 'active'),
        ),
        with: {
          auction: true,
        },
        orderBy: [desc(streamSessions.createdAt)],
      });

      return success(sessions);
    } catch (error) {
      console.error('Error finding active sessions:', error);
      return failure(new InternalError('Failed to find active sessions'));
    }
  }

  /**
   * Update stream session
   */
  async update(
    id: string,
    data: Partial<NewStreamSession>,
  ): Promise<AppResult<StreamSession>> {
    try {
      const [session] = await db
        .update(streamSessions)
        .set({
          ...data,
          // Always update metadata timestamp when updating
          metadata: data.metadata
            ? {
                ...data.metadata,
                updatedAt: new Date().toISOString(),
              }
            : undefined,
        })
        .where(eq(streamSessions.id, id))
        .returning();

      if (!session) {
        return failure(new NotFoundError('Stream session', id));
      }

      return success(session);
    } catch (error) {
      console.error('Error updating stream session:', error);
      return failure(new InternalError('Failed to update stream session'));
    }
  }

  /**
   * Add viewer to stream session
   */
  async addViewer(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<StreamViewer>> {
    try {
      // First check if viewer already exists
      const existingViewer = await db.query.streamViewers.findFirst({
        where: and(
          eq(streamViewers.sessionId, sessionId),
          eq(streamViewers.userId, userId),
        ),
      });

      if (existingViewer) {
        // Reactivate if inactive
        if (!existingViewer.isActive) {
          const [viewer] = await db
            .update(streamViewers)
            .set({
              isActive: true,
              joinedAt: new Date(),
              leftAt: null,
            })
            .where(eq(streamViewers.id, existingViewer.id))
            .returning();

          return success(viewer);
        }
        return success(existingViewer);
      }

      // Create new viewer record
      const [viewer] = await db
        .insert(streamViewers)
        .values({
          sessionId,
          userId,
          joinedAt: new Date(),
          isActive: true,
        })
        .returning();

      return success(viewer);
    } catch (error) {
      console.error('Error adding viewer:', error);
      return failure(new InternalError('Failed to add viewer'));
    }
  }

  /**
   * Remove viewer from stream session
   */
  async removeViewer(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<void>> {
    try {
      await db
        .update(streamViewers)
        .set({
          isActive: false,
          leftAt: new Date(),
        })
        .where(
          and(
            eq(streamViewers.sessionId, sessionId),
            eq(streamViewers.userId, userId),
          ),
        );

      return success(undefined);
    } catch (error) {
      console.error('Error removing viewer:', error);
      return failure(new InternalError('Failed to remove viewer'));
    }
  }

  /**
   * Get active viewer count for session
   */
  async getViewerCount(sessionId: string): Promise<AppResult<number>> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(streamViewers)
        .where(
          and(
            eq(streamViewers.sessionId, sessionId),
            eq(streamViewers.isActive, true),
          ),
        );

      return success(result.count);
    } catch (error) {
      console.error('Error getting viewer count:', error);
      return failure(new InternalError('Failed to get viewer count'));
    }
  }

  /**
   * Get active viewers for session
   */
  async getActiveViewers(
    sessionId: string,
  ): Promise<AppResult<StreamViewer[]>> {
    try {
      const viewers = await db.query.streamViewers.findMany({
        where: and(
          eq(streamViewers.sessionId, sessionId),
          eq(streamViewers.isActive, true),
        ),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [desc(streamViewers.joinedAt)],
      });

      return success(viewers);
    } catch (error) {
      console.error('Error getting active viewers:', error);
      return failure(new InternalError('Failed to get active viewers'));
    }
  }

  /**
   * Check if user is viewing session
   */
  async isUserViewing(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<boolean>> {
    try {
      const viewer = await db.query.streamViewers.findFirst({
        where: and(
          eq(streamViewers.sessionId, sessionId),
          eq(streamViewers.userId, userId),
          eq(streamViewers.isActive, true),
        ),
      });

      return success(!!viewer);
    } catch (error) {
      console.error('Error checking if user is viewing:', error);
      return failure(new InternalError('Failed to check viewer status'));
    }
  }

  /**
   * Clean up inactive sessions (for maintenance)
   */
  async cleanupInactiveSessions(
    olderThanHours: number = 24,
  ): Promise<AppResult<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      const result = await db
        .update(streamSessions)
        .set({ state: 'ended', endedAt: new Date() })
        .where(
          and(
            eq(streamSessions.state, 'initializing'),
            // Use a raw SQL comparison for the timestamp
          ),
        )
        .returning();

      return success(result.length);
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
      return failure(new InternalError('Failed to cleanup inactive sessions'));
    }
  }
}
