import { eq } from 'drizzle-orm';
import { db, profiles, Profile, NewProfile } from '../db';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/result';

/**
 * Users Repository
 * Data access layer for users
 */
export class UsersRepository {
  /**
   * Find profile by ID
   */
  async findById(id: string): Promise<AppResult<Profile | null>> {
    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, id),
      });
      return success(profile || null);
    } catch (error) {
      return failure(new NotFoundError('Profile'));
    }
  }

  /**
   * Update profile
   */
  async update(
    id: string,
    data: Partial<NewProfile>,
  ): Promise<AppResult<Profile>> {
    try {
      const [updated] = await db
        .update(profiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, id))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Profile', id));
      }

      return success(updated);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return failure(new ConflictError('Username already taken'));
      }
      return failure(new ValidationError('Failed to update profile'));
    }
  }
}
