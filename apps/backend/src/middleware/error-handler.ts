import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/result';
import { config } from '../config';

/**
 * Global error handler middleware
 * Replaces NestJS HttpExceptionFilter
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('❌ Server Error:', err);
      if (err.stack) console.error(err.stack);
    } else {
      console.warn(`⚠️  Client Error [${err.statusCode}]:`, err.message);
    }
  } else {
    console.error('❌ Unexpected Error:', err);
    if (err.stack) console.error(err.stack);
  }

  // Format error response
  if (err instanceof AppError) {
    const errorDetails =
      config.nodeEnv === 'development' && err.details
        ? { details: err.details }
        : {};

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: {
        name: err.name,
        message: err.message,
        code: err.code,
        ...errorDetails,
      },
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
    });
  } else {
    // Unexpected errors
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: {
        name: 'InternalError',
        message:
          config.nodeEnv === 'development'
            ? err.message
            : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
    });
  }
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: {
      name: 'NotFoundError',
      message: `Route ${req.method} ${req.url} not found`,
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
