import { z } from 'zod';

/**
 * Payments validation schemas
 */

export const createPaymentIntentSchema = z.object({
  body: z.object({
    auction_id: z.string().uuid(),
    order_id: z.string().uuid().optional(),
    amount: z.number().positive(),
  }),
});

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
  }),
});

export const savePaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
    setAsDefault: z.boolean().optional().default(false),
  }),
});

export const setDefaultPaymentMethodSchema = z.object({
  params: z.object({
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  }),
});

export const deletePaymentMethodSchema = z.object({
  params: z.object({
    paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  }),
});

export const createPaymentIntentWithMethodSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().default('usd'),
    paymentMethodId: z.string().optional(),
    setupFutureUsage: z.enum(['on_session', 'off_session']).optional(),
  }),
});

export const createPaymentSheetSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().default('usd'),
    customerId: z.string().optional(),
    setupFutureUsage: z.enum(['on_session', 'off_session']).optional(),
    automaticPaymentMethods: z.boolean().default(true),
  }),
});

export const createSetupIntentSchema = z.object({
  body: z.object({
    setAsDefault: z.boolean().optional().default(true),
  }),
});

export const confirmPaymentIntentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
    paymentMethodId: z.string().optional(),
    returnUrl: z.string().url().optional(),
  }),
});

export type CreatePaymentIntentInput = z.infer<
  typeof createPaymentIntentSchema
>['body'];
export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>['body'];
export type SavePaymentMethodInput = z.infer<
  typeof savePaymentMethodSchema
>['body'];
export type SetDefaultPaymentMethodInput = z.infer<
  typeof setDefaultPaymentMethodSchema
>['params'];
export type DeletePaymentMethodInput = z.infer<
  typeof deletePaymentMethodSchema
>['params'];
export type CreatePaymentIntentWithMethodInput = z.infer<
  typeof createPaymentIntentWithMethodSchema
>['body'];
export type CreatePaymentSheetInput = z.infer<
  typeof createPaymentSheetSchema
>['body'];
export type CreateSetupIntentInput = z.infer<
  typeof createSetupIntentSchema
>['body'];
export type ConfirmPaymentIntentInput = z.infer<
  typeof confirmPaymentIntentSchema
>['body'];
