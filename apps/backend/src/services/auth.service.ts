import { AuthRepository } from '../repositories/auth.repository';
import {
  AppResult,
  success,
  failure,
  ConflictError,
  ValidationError,
} from '../utils/result';
import { Profile } from '../db/schema';
import { supabase } from '../utils/supabase';
import { config } from '../config';

/**
 * Auth Service
 * Business logic for authentication
 * Converted from NestJS AuthService
 */
export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  /**
   * Sync user profile after Supabase Auth
   */
  async syncProfile(
    userId: string,
    data: {
      username: string;
      full_name?: string;
      avatar_url?: string;
    },
  ): Promise<AppResult<Profile>> {
    // Check if profile already exists
    const existingResult = await this.repository.getProfile(userId);

    if (existingResult.isOk() && existingResult.value) {
      return success(existingResult.value);
    }

    // Check if username is taken
    const usernameResult = await this.repository.getProfileByUsername(
      data.username,
    );
    if (usernameResult.isOk() && usernameResult.value) {
      return failure(new ConflictError('Username already taken'));
    }

    // Create new profile
    const createResult = await this.repository.createProfile({
      id: userId,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
    });

    return createResult;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<AppResult<Profile | null>> {
    const result = await this.repository.getProfile(userId);

    if (result.isErr()) {
      return failure(result.error);
    }

    if (!result.value) {
      let email: string | undefined;
      let fullName: string | undefined;
      let avatarUrl: string | undefined;

      try {
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(userId);

        email = user?.email;
        fullName = (user?.user_metadata as any)?.full_name;
        avatarUrl = (user?.user_metadata as any)?.avatar_url;
      } catch (e) {
        // ignore
      }

      const baseUsername = (
        email?.split('@')[0] || `user_${userId.slice(0, 8)}`
      )
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const candidates: string[] = [
        baseUsername,
        `${baseUsername}_${Math.floor(Math.random() * 10000)}`,
        `${baseUsername}_${Math.floor(Math.random() * 100000)}`,
      ].filter((v) => v.length >= 3);

      for (const candidate of candidates) {
        const usernameResult =
          await this.repository.getProfileByUsername(candidate);
        if (usernameResult.isOk() && usernameResult.value) {
          continue;
        }

        const createResult = await this.repository.createProfile({
          id: userId,
          username: candidate,
          fullName,
          avatarUrl,
        });

        if (createResult.isOk()) {
          return success(createResult.value);
        }
      }

      return failure(new ValidationError('Profile not found'));
    }

    const profile = result.value;

    if (!profile.emailVerified) {
      try {
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(userId);

        if (user?.email_confirmed_at) {
          await this.repository.update(userId, { emailVerified: true });
          profile.emailVerified = true;
        }
      } catch (e) {
        // ignore
      }
    }

    return success(profile);
  }

  /**
   * Logout (placeholder - token invalidation would go here if using blacklist)
   */
  async logout(): Promise<AppResult<{ message: string }>> {
    return success({ message: 'Logged out successfully' });
  }

  /**
   * Send password reset email via Supabase
   */
  async forgotPassword(email: string): Promise<AppResult<{ message: string }>> {
    try {
      const redirectUrl =
        config.nodeEnv === 'production'
          ? 'barterdash://reset-password'
          : 'barterdash://reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        // Don't reveal if email exists or not for security
        return success({
          message:
            'If an account exists with this email, you will receive a password reset link.',
        });
      }

      return success({
        message:
          'If an account exists with this email, you will receive a password reset link.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return failure(
        new ValidationError('Failed to send password reset email'),
      );
    }
  }

  /**
   * Update password (used after user clicks reset link and has valid session)
   */
  async resetPassword(
    newPassword: string,
    accessToken: string,
  ): Promise<AppResult<{ message: string }>> {
    try {
      // First, set the session using the access token from the reset link
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for password reset
      });

      if (sessionError) {
        return failure(new ValidationError('Invalid or expired reset token'));
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return failure(
          new ValidationError(error.message || 'Failed to reset password'),
        );
      }

      return success({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return failure(new ValidationError('Failed to reset password'));
    }
  }
}
