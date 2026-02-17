import { z } from 'zod';

export const addCartItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.coerce.number().int().positive().default(1),
  }),
});

export const cartItemParamSchema = z.object({
  params: z.object({
    cartItemId: z.string().uuid('Invalid cart item ID'),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    cartItemId: z.string().uuid('Invalid cart item ID'),
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(0),
  }),
});

export const checkoutCartSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      name: z.string().min(1),
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(2),
    }),
  }),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
export type CheckoutCartInput = z.infer<typeof checkoutCartSchema>['body'];
