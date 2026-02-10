import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * Converted from NestJS LoggerMiddleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { method, originalUrl, headers, body } = req;
  const startTime = Date.now();

  console.log(`📨 Incoming Request: ${method} ${originalUrl}`);

  // Log headers (redact sensitive ones)
  const filteredHeaders = { ...headers };
  if (filteredHeaders.authorization) {
    filteredHeaders.authorization = 'Bearer [REDACTED]';
  }
  if (filteredHeaders.cookie) {
    filteredHeaders.cookie = '[REDACTED]';
  }

  console.log(`   Headers:`, JSON.stringify(filteredHeaders, null, 2));

  // Log body for non-GET requests
  if (method !== 'GET' && body && Object.keys(body).length > 0) {
    const sanitizedBody = { ...body };
    // Redact sensitive fields
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    if (sanitizedBody.secret) sanitizedBody.secret = '[REDACTED]';

    console.log(`   Body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor =
      res.statusCode >= 500 ? '🔴' : res.statusCode >= 400 ? '🟡' : '🟢';

    console.log(
      `${statusColor} ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
};

/**
 * Simple logger for production (less verbose)
 */
export const productionLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
};
