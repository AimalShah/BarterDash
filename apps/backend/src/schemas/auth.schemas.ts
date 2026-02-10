import { z } from 'zod';

/**
 * Auth validation schemas
 * Replaces NestJS DTOs
 */

// Sync Profile Schema
export const syncProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ),
    full_name: z.string().min(1).max(255).optional(),
    avatar_url: z.string().url().optional(),
  }),
});

export type SyncProfileInput = z.infer<typeof syncProfileSchema>['body'];

// Login Schema (if implementing local auth)
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];

// Register Schema (if implementing local auth)
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/),
    full_name: z.string().min(1).max(255).optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];

// Reset Password Schema (used after clicking email link)
export const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
  }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
