import { StreamSessionsRepository } from '../repositories/stream-sessions.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  InternalError,
} from '../utils/result';
import type {
  StreamSession,
  NewStreamSession,
  StreamViewer,
} from '../db/schema';
import { randomUUID } from 'crypto';

/**
 * Stream Service
 * Business logic for streaming sessions and viewer tracking
 * Implements Requirements 3.1, 3.2, 10.1, 10.2, 10.3, 10.4
 */

export interface StreamSessionWithDetails extends StreamSession {
  seller?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  auction?: any;
  viewers?: StreamViewer[];
}

export interface StartStreamInput {
  sellerId: string;
  auctionId?: string;
  metadata?: Record<string, any>;
}

export interface JoinStreamInput {
  sessionId: string;
  userId: string;
}

export class StreamService {
  private repository: StreamSessionsRepository;

  constructor() {
    this.repository = new StreamSessionsRepository();
  }

  /**
   * Start a new stream session
   * Requirement 10.1: Initialize all required resources and notify participants
   */
  async startStream(input: StartStreamInput): Promise<
    AppResult<{
      session: StreamSessionWithDetails;
    }>
  > {
    try {
      // Check if seller already has an active stream
      const activeSessionsResult = await this.repository.findActiveBySeller(
        input.sellerId,
      );
      if (activeSessionsResult.isErr()) {
        return failure(activeSessionsResult.error);
      }

      if (activeSessionsResult.value.length > 0) {
        // Instead of failing, we should cleanup any stale sessions
        // This handles cases where the app crashed or wasn't closed properly
        console.warn(
          `[StreamService] Found ${activeSessionsResult.value.length} active sessions for seller ${input.sellerId}. Ending them to start new session.`,
        );

        for (const session of activeSessionsResult.value) {
          // End the stale session
          await this.repository.update(session.id, {
            state: 'ended',
            endedAt: new Date(),
            viewerCount: 0,
            metadata: {
              ...((session.metadata as Record<string, any>) || {}),
              endedAt: new Date().toISOString(),
              endedReason: 'force_started_new_session_by_seller',
            },
          });

          // No token revocation needed for Stream-based streaming
        }
      }

      // Generate unique channel ID
      const channelId = this.generateChannelId();

      // Create stream session
      const sessionData: NewStreamSession = {
        sellerId: input.sellerId,
        auctionId: input.auctionId || null,
        channelId,
        state: 'initializing',
        createdAt: new Date(),
        viewerCount: 0,
        metadata: {
          ...input.metadata,
          createdAt: new Date().toISOString(),
        },
      };

      const createResult = await this.repository.create(sessionData);
      if (createResult.isErr()) {
        return failure(createResult.error);
      }

      const session = createResult.value;

      // Update session to active state
      const updateResult = await this.repository.update(session.id, {
        state: 'active',
        startedAt: new Date(),
      });

      if (updateResult.isErr()) {
        return failure(updateResult.error);
      }

      // Get session with details
      const sessionResult = await this.repository.findById(session.id);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      return success({
        session: sessionResult.value as StreamSessionWithDetails,
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      return failure(new InternalError('Failed to start stream session'));
    }
  }

  /**
   * Pause an active stream session
   * Requirement 10.2: Maintain session state while stopping video transmission
   */
  async pauseStream(
    sessionId: string,
    sellerId: string,
  ): Promise<AppResult<StreamSession>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Verify ownership
      if (session.sellerId !== sellerId) {
        return failure(
          new ForbiddenError('You do not own this stream session'),
        );
      }

      // Can only pause active streams
      if (session.state !== 'active') {
        return failure(new ValidationError('Stream session is not active'));
      }

      // Update to paused state
      const updateResult = await this.repository.update(sessionId, {
        state: 'paused',
        metadata: {
          ...((session.metadata as Record<string, any>) || {}),
          pausedAt: new Date().toISOString(),
        },
      });

      return updateResult;
    } catch (error) {
      console.error('Error pausing stream:', error);
      return failure(new InternalError('Failed to pause stream session'));
    }
  }

  /**
   * Resume a paused stream session
   * Requirement 10.3: Restore video transmission and reconnect viewers
   */
  async resumeStream(
    sessionId: string,
    sellerId: string,
  ): Promise<AppResult<StreamSession>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Verify ownership
      if (session.sellerId !== sellerId) {
        return failure(
          new ForbiddenError('You do not own this stream session'),
        );
      }

      // Can only resume paused streams
      if (session.state !== 'paused') {
        return failure(new ValidationError('Stream session is not paused'));
      }

      // Update to active state
      const updateResult = await this.repository.update(sessionId, {
        state: 'active',
        metadata: {
          ...((session.metadata as Record<string, any>) || {}),
          resumedAt: new Date().toISOString(),
        },
      });

      return updateResult;
    } catch (error) {
      console.error('Error resuming stream:', error);
      return failure(new InternalError('Failed to resume stream session'));
    }
  }

  /**
   * End a stream session
   * Requirement 10.4: Clean up all resources and update participant status
   */
  async endStream(
    sessionId: string,
    sellerId: string,
  ): Promise<AppResult<StreamSession>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Verify ownership
      if (session.sellerId !== sellerId) {
        return failure(
          new ForbiddenError('You do not own this stream session'),
        );
      }

      // Can only end active or paused streams
      if (!['active', 'paused'].includes(session.state)) {
        return failure(
          new ValidationError('Stream session is not active or paused'),
        );
      }

      // Deactivate all viewers
      const viewersResult = await this.repository.getActiveViewers(sessionId);
      if (viewersResult.isOk()) {
        for (const viewer of viewersResult.value) {
          await this.repository.removeViewer(sessionId, viewer.userId);
        }
      }

      // Update session to ended state
      const updateResult = await this.repository.update(sessionId, {
        state: 'ended',
        endedAt: new Date(),
        viewerCount: 0,
        metadata: {
          ...((session.metadata as Record<string, any>) || {}),
          endedAt: new Date().toISOString(),
        },
      });

      return updateResult;
    } catch (error) {
      console.error('Error ending stream:', error);
      return failure(new InternalError('Failed to end stream session'));
    }
  }

  /**
   * Get stream state
   * Requirement 3.4: Return current Stream_State accurately
   */
  async getStreamState(
    sessionId: string,
  ): Promise<AppResult<StreamSessionWithDetails>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      return success(session as StreamSessionWithDetails);
    } catch (error) {
      console.error('Error getting stream state:', error);
      return failure(new InternalError('Failed to get stream state'));
    }
  }

  /**
   * Update stream state
   * Requirement 3.1, 3.2: Update Stream_State and notify subscribers
   */
  async updateStreamState(
    sessionId: string,
    state: 'initializing' | 'active' | 'paused' | 'ended' | 'error',
    sellerId?: string,
  ): Promise<AppResult<StreamSession>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Verify ownership if sellerId provided
      if (sellerId && session.sellerId !== sellerId) {
        return failure(
          new ForbiddenError('You do not own this stream session'),
        );
      }

      const updateData: Partial<NewStreamSession> = {
        state,
        metadata: {
          ...((session.metadata as Record<string, any>) || {}),
          stateUpdatedAt: new Date().toISOString(),
        },
      };

      // Set timestamps based on state
      if (state === 'active' && !session.startedAt) {
        updateData.startedAt = new Date();
      } else if (state === 'ended' && !session.endedAt) {
        updateData.endedAt = new Date();
      }

      return await this.repository.update(sessionId, updateData);
    } catch (error) {
      console.error('Error updating stream state:', error);
      return failure(new InternalError('Failed to update stream state'));
    }
  }

  /**
   * Add viewer to stream
   */
  async addViewer(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<StreamViewer>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Can only join active streams
      if (session.state !== 'active') {
        return failure(new ValidationError('Stream session is not active'));
      }

      // Add viewer
      const viewerResult = await this.repository.addViewer(sessionId, userId);
      if (viewerResult.isErr()) {
        return failure(viewerResult.error);
      }

      return success(viewerResult.value);
    } catch (error) {
      console.error('Error adding viewer:', error);
      return failure(new InternalError('Failed to add viewer'));
    }
  }

  /**
   * Remove viewer from stream
   */
  async removeViewer(
    sessionId: string,
    userId: string,
  ): Promise<AppResult<void>> {
    try {
      // Remove viewer
      const removeResult = await this.repository.removeViewer(
        sessionId,
        userId,
      );
      if (removeResult.isErr()) {
        return failure(removeResult.error);
      }

      return success(undefined);
    } catch (error) {
      console.error('Error removing viewer:', error);
      return failure(new InternalError('Failed to remove viewer'));
    }
  }

  /**
   * Get viewer count for stream
   */
  async getViewerCount(sessionId: string): Promise<AppResult<number>> {
    return await this.repository.getViewerCount(sessionId);
  }

  /**
   * Get active viewers for stream
   */
  async getActiveViewers(
    sessionId: string,
  ): Promise<AppResult<StreamViewer[]>> {
    return await this.repository.getActiveViewers(sessionId);
  }

  /**
   * Handle session timeout
   * Requirement 10.5: Automatically end inactive sessions and notify users
   */
  async handleSessionTimeout(sessionId: string): Promise<AppResult<void>> {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      // Only timeout active or paused sessions
      if (!['active', 'paused'].includes(session.state)) {
        return success(undefined);
      }

      // End the session
      const endResult = await this.endStream(sessionId, session.sellerId);
      if (endResult.isErr()) {
        return failure(endResult.error);
      }

      return success(undefined);
    } catch (error) {
      console.error('Error handling session timeout:', error);
      return failure(new InternalError('Failed to handle session timeout'));
    }
  }

  /**
   * Generate unique channel ID for stream sessions
   */
  private generateChannelId(): string {
    // Generate a unique channel ID using UUID and timestamp
    const timestamp = Date.now().toString(36);
    const uuid = randomUUID().replace(/-/g, '').substring(0, 8);
    return `stream_${timestamp}_${uuid}`;
  }

  /**
   * Get stream statistics for monitoring
   */
  async getStreamStats(sessionId: string): Promise<
    AppResult<{
      session: StreamSessionWithDetails;
      viewerCount: number;
    }>
  > {
    try {
      const sessionResult = await this.repository.findById(sessionId);
      if (sessionResult.isErr()) {
        return failure(sessionResult.error);
      }

      const session = sessionResult.value;
      if (!session) {
        return failure(new NotFoundError('Stream session', sessionId));
      }

      const viewerCountResult = await this.repository.getViewerCount(sessionId);
      if (viewerCountResult.isErr()) {
        return failure(viewerCountResult.error);
      }

      return success({
        session: session as StreamSessionWithDetails,
        viewerCount: viewerCountResult.value,
      });
    } catch (error) {
      console.error('Error getting stream stats:', error);
      return failure(new InternalError('Failed to get stream statistics'));
    }
  }
}
