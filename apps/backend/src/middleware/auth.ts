import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/result';
import { supabase } from '../utils/supabase';
import { UsersRepository } from '../repositories/users.repository';
import { UserRole } from '../db/schema';

/**
 * JWT Payload type
 */
interface SupabaseJwtPayload {
  sub?: string;
  id?: string;
  userId?: string;
  role?: string;
  email?: string;
  aud?: string;
  exp?: string;
  iat?: number;
  iss?: string;

  app_metadata?: {
    provider?: string;
    providers?: string[];
  };

  user_metadata?: Record<string, any>;
  session_id?: string;
}

/**
 * Extended Request type with user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
    metadata?: Record<string, any>;
  };
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid Session');
    }

    // Fetch profile to get application roles
    const usersRepo = new UsersRepository();
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

    req.user = {
      id: user.id,
      role: appRole,
      email: user.email,
      metadata: user.user_metadata,
    };

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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        const usersRepo = new UsersRepository();
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

        req.user = {
          id: user.id,
          role: appRole,
          email: user.email,
        };
      }
    } catch {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};
