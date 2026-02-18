import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/result';
import { supabase } from '../utils/supabase';
import { UsersRepository } from '../repositories/users.repository';
import { UserRole } from '../db/schema';
import { TokenBlacklist } from '../utils/token-blacklist';

/**
 * Extended Request type with user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
    emailConfirmedAt?: string | null;
    metadata?: Record<string, any>;
  };
}

const AUTH_USER_TIMEOUT_MS = 10_000;
const BLACKLIST_CHECK_TIMEOUT_MS = 1_500;
const AUTH_CACHE_TTL_MS = 60_000;
const usersRepo = new UsersRepository();
const authCache = new Map<
  string,
  {
    expiresAt: number;
    user: NonNullable<AuthRequest['user']>;
  }
>();

function getCachedAuth(token: string): NonNullable<AuthRequest['user']> | null {
  const entry = authCache.get(token);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    authCache.delete(token);
    return null;
  }

  return entry.user;
}

function setCachedAuth(token: string, user: NonNullable<AuthRequest['user']>): void {
  authCache.set(token, {
    user,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new UnauthorizedError(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function withSoftTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<{ timedOut: false; value: T } | { timedOut: true }> {
  let timer: NodeJS.Timeout | null = null;
  try {
    const value = await Promise.race([
      promise.then((resolved) => ({ timedOut: false as const, value: resolved })),
      new Promise<{ timedOut: true }>((resolve) => {
        timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
      }),
    ]);

    return value;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * JWT Authentication Middleware
 * Replaces NestJS JwtAuthGuard
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const blacklistCheck = await withSoftTimeout(
      TokenBlacklist.isBlacklisted(token),
      BLACKLIST_CHECK_TIMEOUT_MS,
    );
    const isBlacklisted = !blacklistCheck.timedOut && blacklistCheck.value;
    if (blacklistCheck.timedOut) {
      console.warn(
        `Token blacklist lookup timed out after ${BLACKLIST_CHECK_TIMEOUT_MS}ms; continuing request`,
      );
    }

    if (isBlacklisted) {
      authCache.delete(token);
      throw new UnauthorizedError('Token has been revoked');
    }

    const cachedUser = getCachedAuth(token);
    if (cachedUser) {
      req.user = cachedUser;
      next();
      return;
    }

    const {
      data: { user },
      error,
    } = await withTimeout(
      supabase.auth.getUser(token),
      AUTH_USER_TIMEOUT_MS,
      'Authentication service timeout. Please retry.',
    );

    if (error || !user) {
      throw new UnauthorizedError('Invalid Session');
    }

    // Fetch profile to get application roles
    const profileResult = await usersRepo.findById(user.id);

    let appRole: UserRole = 'USER';
    if (profileResult.isOk() && profileResult.value) {
      const profile = profileResult.value;
      if (profile.isAdmin) {
        appRole = 'ADMIN';
      } else if (profile.isSeller) {
        appRole = 'SELLER';
      }
    }

    const authUser: NonNullable<AuthRequest['user']> = {
      id: user.id,
      role: appRole,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at || null,
      metadata: user.user_metadata,
    };
    setCachedAuth(token, authUser);
    req.user = authUser;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work with or without auth
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);

    const cachedUser = getCachedAuth(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    try {
      const {
        data: { user },
      } = await withTimeout(
        supabase.auth.getUser(token),
        AUTH_USER_TIMEOUT_MS,
        'Authentication service timeout. Please retry.',
      );

      if (user) {
        const profileResult = await usersRepo.findById(user.id);

        let appRole: UserRole = 'USER';
        if (profileResult.isOk() && profileResult.value) {
          const profile = profileResult.value;
          if (profile.isAdmin) {
            appRole = 'ADMIN';
          } else if (profile.isSeller) {
            appRole = 'SELLER';
          }
        }

        const authUser: NonNullable<AuthRequest['user']> = {
          id: user.id,
          role: appRole,
          email: user.email,
          emailConfirmedAt: user.email_confirmed_at || null,
        };
        setCachedAuth(token, authUser);
        req.user = authUser;
      }
    } catch {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};
