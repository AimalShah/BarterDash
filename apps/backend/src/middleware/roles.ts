import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError, UnauthorizedError } from '../utils/result';
import { UserRole } from '../db/schema';

/**
 * Role-based authorization middleware
 * Replaces NestJS RolesGuard
 */
export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is the resource owner or has admin privileges
 */
export const requireOwnerOrAdmin = (
  getUserIdFn: (req: AuthRequest) => string,
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceUserId = getUserIdFn(req);
      const isOwner = req.user.id === resourceUserId;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError(
          'You do not have permission to access this resource',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
