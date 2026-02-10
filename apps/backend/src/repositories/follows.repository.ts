import { eq, and } from 'drizzle-orm';
import { db, follows } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

export class FollowsRepository {
  async follow(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    try {
      await db
        .insert(follows)
        .values({ followerId, followingId })
        .onConflictDoNothing();
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to follow user'));
    }
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    try {
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId),
          ),
        );
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to unfollow user'));
    }
  }

  async getFollowers(userId: string): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.follows.findMany({
        where: eq(follows.followingId, userId),
        with: { follower: true },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch followers'));
    }
  }

  async getFollowing(userId: string): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.follows.findMany({
        where: eq(follows.followerId, userId),
        with: { following: true },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch following'));
    }
  }

  async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    try {
      const result = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
        ),
      });
      return success(!!result);
    } catch (error) {
      return failure(new ValidationError('Failed to check follow status'));
    }
  }

  async getStats(
    userId: string,
  ): Promise<AppResult<{ followersCount: number; followingCount: number }>> {
    try {
      const followers = await db.query.follows.findMany({
        where: eq(follows.followingId, userId),
      });

      const following = await db.query.follows.findMany({
        where: eq(follows.followerId, userId),
      });

      return success({
        followersCount: followers.length,
        followingCount: following.length,
      });
    } catch (error) {
      return failure(new ValidationError('Failed to get stats'));
    }
  }
}
