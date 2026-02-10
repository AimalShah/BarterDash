import { UsersRepository } from '../repositories/users.repository';
import { AppResult, success, failure, NotFoundError } from '../utils/result';
import { Profile } from '../db/schema';
import { UpdateProfileInput } from '../schemas/users.schemas';

/**
 * Users Service
 * Business logic for user profiles
 */
export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  /**
   * Get user profile
   */
  async getProfile(id: string): Promise<AppResult<Profile>> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      return failure(result.error);
    }

    if (!result.value) {
      return failure(new NotFoundError('Profile', id));
    }

    return success(result.value);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    id: string,
    data: UpdateProfileInput,
  ): Promise<AppResult<Profile>> {
    // Normalize field names (frontend sends camelCase, DB uses snake_case)
    const normalizedData: any = {};

    if (data.username) normalizedData.username = data.username;
    if (data.fullName || data.full_name)
      normalizedData.fullName = data.fullName || data.full_name;
    if (data.avatarUrl !== undefined || data.avatar_url !== undefined) {
      normalizedData.avatarUrl = data.avatarUrl ?? data.avatar_url ?? null;
    }
    if (data.bio) normalizedData.bio = data.bio;
    if (data.onboardingStep || data.onboarding_step) {
      normalizedData.onboardingStep =
        data.onboardingStep || data.onboarding_step;
    }
    if (data.onboarded !== undefined) normalizedData.onboarded = data.onboarded;
    if (data.interests) normalizedData.interests = data.interests;

    return await this.repository.update(id, normalizedData);
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(
    id: string,
    interests?: string[],
    notificationPreferences?: any,
  ): Promise<AppResult<Profile>> {
    return await this.repository.update(id, {
      onboarded: true,
      onboardingStep: 'completed',
      onboardingCompletedAt: new Date(),
      interests,
      notificationPreferences,
    });
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(
    id: string,
    step: string,
  ): Promise<AppResult<Profile>> {
    return await this.repository.update(id, {
      onboardingStep: step,
    });
  }
}
