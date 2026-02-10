import { z } from 'zod';

/**
 * Review validation schemas
 */

export const createReviewSchema = z.object({
  body: z.object({
    sellerId: z.string().uuid(),
    orderId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1).max(1000),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
