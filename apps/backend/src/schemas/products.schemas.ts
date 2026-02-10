import { z } from 'zod';

const productBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  starting_bid: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .optional(),
  buy_now_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .optional(),
  reserve_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .optional(),
  quantity: z.number().int().positive().optional().default(1),
  shipping_cost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
    .optional()
    .default('0.00'),
  images: z.array(z.string().url()).optional().default([]),
});

export const createProductSchema = z.object({
  body: productBodySchema,
});

export const updateProductSchema = z.object({
  body: productBodySchema.partial(),
});

export const productStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'sold', 'cancelled']),
});
