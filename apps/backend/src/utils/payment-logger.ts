/**
 * Payment Logger Utility
 * Provides structured logging for payment operations without exposing sensitive data
 */

interface PaymentLogContext {
  userId?: string;
  orderId?: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  amount?: number;
  currency?: string;
  operation: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

interface PaymentErrorContext extends PaymentLogContext {
  error: {
    type: string;
    code?: string;
    message: string;
    statusCode?: number;
  };
  stripeErrorCode?: string;
  stripeErrorType?: string;
}

class PaymentLogger {
  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return metadata;
    }

    const sensitiveFields = [
      'card_number',
      'card_cvc',
      'card_exp_month',
      'card_exp_year',
      'bank_account',
      'routing_number',
      'account_number',
      'ssn',
      'personal_id_number',
      'client_secret',
    ];

    const sanitized = { ...metadata };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeMetadata(sanitized[key]);
      }
    }

    return sanitized;
  }

  private formatLogEntry(
    level: string,
    context: PaymentLogContext | PaymentErrorContext,
  ): string {
    const timestamp = context.timestamp || new Date();
    const sanitizedMetadata = this.sanitizeMetadata(context.metadata);

    const logEntry = {
      timestamp: timestamp.toISOString(),
      level,
      service: 'payments',
      operation: context.operation,
      userId: context.userId,
      orderId: context.orderId,
      paymentIntentId: context.paymentIntentId,
      paymentMethodId: context.paymentMethodId,
      amount: context.amount,
      currency: context.currency,
      metadata: sanitizedMetadata,
      ...('error' in context && {
        error: context.error,
        stripeErrorCode: context.stripeErrorCode,
        stripeErrorType: context.stripeErrorType,
      }),
    };

    return JSON.stringify(logEntry);
  }

  info(context: PaymentLogContext): void {
    console.log(this.formatLogEntry('INFO', context));
  }

  warn(context: PaymentLogContext): void {
    console.warn(this.formatLogEntry('WARN', context));
  }

  error(context: PaymentErrorContext): void {
    console.error(this.formatLogEntry('ERROR', context));
  }

  debug(context: PaymentLogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLogEntry('DEBUG', context));
    }
  }

  // Convenience methods for common payment operations
  logPaymentIntentCreated(context: Omit<PaymentLogContext, 'operation'>): void {
    this.info({ ...context, operation: 'payment_intent_created' });
  }

  logPaymentIntentConfirmed(
    context: Omit<PaymentLogContext, 'operation'>,
  ): void {
    this.info({ ...context, operation: 'payment_intent_confirmed' });
  }

  logPaymentMethodSaved(context: Omit<PaymentLogContext, 'operation'>): void {
    this.info({ ...context, operation: 'payment_method_saved' });
  }

  logPaymentMethodDeleted(context: Omit<PaymentLogContext, 'operation'>): void {
    this.info({ ...context, operation: 'payment_method_deleted' });
  }

  logWebhookReceived(context: Omit<PaymentLogContext, 'operation'>): void {
    this.info({ ...context, operation: 'webhook_received' });
  }

  logPaymentError(context: Omit<PaymentErrorContext, 'operation'>): void {
    this.error({ ...context, operation: 'payment_error' });
  }

  logStripeError(
    operation: string,
    stripeError: any,
    context?: Partial<PaymentLogContext>,
  ): void {
    this.error({
      ...context,
      operation,
      error: {
        type: 'StripeError',
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
      },
      stripeErrorCode: stripeError.code,
      stripeErrorType: stripeError.type,
    });
  }
}

export const paymentLogger = new PaymentLogger();
