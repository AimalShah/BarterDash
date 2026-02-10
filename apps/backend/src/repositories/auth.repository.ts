import { eq } from 'drizzle-orm';
import { db, profiles, NewProfile, Profile } from '../db';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ConflictError,
} from '../utils/result';

/**
 * Auth Repository
 * Database operations for authentication
 * Converted from TypeORM AuthRepository
 */
export class AuthRepository {
  /**
   * Get profile by ID
   */
  async getProfile(userId: string): Promise<AppResult<Profile | null>> {
    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      });

      return success(profile || null);
    } catch (error) {
      return failure(new NotFoundError('Profile'));
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(
    username: string,
  ): Promise<AppResult<Profile | null>> {
    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.username, username),
      });

      return success(profile || null);
    } catch (error) {
      return failure(new NotFoundError('Profile'));
    }
  }

  /**
   * Create new profile
   */
  async createProfile(data: NewProfile): Promise<AppResult<Profile>> {
    try {
      // Check if username already exists
      const existing = await db.query.profiles.findFirst({
        where: eq(profiles.username, data.username),
      });

      if (existing) {
        return failure(new ConflictError('Username already taken'));
      }

      const [profile] = await db
        .insert(profiles)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            username: data.username,
            fullName: data.fullName ?? null,
            avatarUrl: data.avatarUrl ?? null,
            updatedAt: new Date(),
          },
        })
        .returning();

      return success(profile);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return failure(new ConflictError('Username already taken'));
      }
      return failure(new ConflictError('Failed to create profile'));
    }
  }

  /**
   * Update profile
   */
  async updateProfile(
    userId: string,
    data: Partial<NewProfile>,
  ): Promise<AppResult<Profile>> {
    try {
      const [updated] = await db
        .update(profiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Profile', userId));
      }

      return success(updated);
    } catch (error) {
      return failure(new NotFoundError('Profile', userId));
    }
  }

  /**
   * Delete profile
   */
  async deleteProfile(userId: string): Promise<AppResult<boolean>> {
    try {
      await db.delete(profiles).where(eq(profiles.id, userId));
      return success(true);
    } catch (error) {
      return failure(new NotFoundError('Profile', userId));
    }
  }
}
