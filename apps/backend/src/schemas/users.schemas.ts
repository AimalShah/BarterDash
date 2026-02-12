import { z } from 'zod';

/**
 * User validation schemas
 */

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    fullName: z.string().min(1).max(255).optional(),
    full_name: z.string().min(1).max(255).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    avatar_url: z.string().url().nullable().optional(),
    bio: z.string().max(500).optional(),
    onboarding_step: z
      .enum([
        'profile',
        'interests',
        'age_verification',
        'notifications',
        'completed',
      ])
      .optional(),
    onboardingStep: z
      .enum([
        'profile',
        'interests',
        'age_verification',
        'notifications',
        'completed',
      ])
      .optional(),
    onboarded: z.boolean().optional(),
    interests: z.array(z.string()).optional(),
    notification_preferences: z
      .object({
        streamAlerts: z.boolean().optional(),
        bidAlerts: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const ageVerificationSchema = z.object({
  body: z.object({
    dateOfBirth: z.string().datetime(),
    guardianConsent: z.boolean().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
