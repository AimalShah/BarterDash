import { Result, err, ok } from 'neverthrow';

/**
 * Custom application errors with Result pattern
 * Using neverthrow library for type-safe error handling
 */

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
    };
  }
}

// Specific error types
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}

// Payment-specific error types
export class PaymentError extends AppError {
  constructor(
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: unknown,
  ) {
    super(message, statusCode, code, details);
    this.name = 'PaymentError';
  }
}

export class CardDeclinedError extends PaymentError {
  constructor(declineCode?: string, message?: string) {
    const errorMessage = message || 'Your card was declined';
    super(errorMessage, 402, 'CARD_DECLINED', { declineCode });
    this.name = 'CardDeclinedError';
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor() {
    super(
      'Insufficient funds on the payment method',
      402,
      'INSUFFICIENT_FUNDS',
    );
    this.name = 'InsufficientFundsError';
  }
}

export class ExpiredCardError extends PaymentError {
  constructor() {
    super('Your card has expired', 402, 'EXPIRED_CARD');
    this.name = 'ExpiredCardError';
  }
}

export class InvalidCardError extends PaymentError {
  constructor(message: string = 'Invalid card details') {
    super(message, 400, 'INVALID_CARD');
    this.name = 'InvalidCardError';
  }
}

export class AuthenticationRequiredError extends PaymentError {
  constructor(nextActionUrl?: string) {
    super(
      'Additional authentication required',
      402,
      'AUTHENTICATION_REQUIRED',
      { nextActionUrl },
    );
    this.name = 'AuthenticationRequiredError';
  }
}

export class PaymentProcessingError extends PaymentError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 402, 'PROCESSING_ERROR');
    this.name = 'PaymentProcessingError';
  }
}

export class StripeConnectionError extends PaymentError {
  constructor(message: string = 'Payment service temporarily unavailable') {
    super(message, 503, 'STRIPE_CONNECTION_ERROR');
    this.name = 'StripeConnectionError';
  }
}

export class WebhookVerificationError extends PaymentError {
  constructor(message: string = 'Webhook signature verification failed') {
    super(message, 400, 'WEBHOOK_VERIFICATION_ERROR');
    this.name = 'WebhookVerificationError';
  }
}

// Type aliases for Result pattern
export type AppResult<T> = Result<T, AppError>;

// Helper functions
export const success = <T>(value: T): AppResult<T> => ok(value);
export const failure = (error: AppError): AppResult<never> => err(error);

/**
 * Async wrapper for Result pattern
 * Wraps async functions to catch errors and return Result
 */
export async function resultify<T>(
  promise: Promise<T>,
): Promise<Result<T, AppError>> {
  try {
    const result = await promise;
    return ok(result);
  } catch (error) {
    if (error instanceof AppError) {
      return err(error);
    }
    return err(
      new InternalError(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    );
  }
}

/**
 * Synchronous wrapper for Result pattern
 */
export function resultifySync<T>(fn: () => T): Result<T, AppError> {
  try {
    return ok(fn());
  } catch (error) {
    if (error instanceof AppError) {
      return err(error);
    }
    return err(
      new InternalError(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    );
  }
}
