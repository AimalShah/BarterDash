import { z } from 'zod';

/**
 * Seller validation schemas
 */

export const registerSellerSchema = z.object({
  body: z.object({
    business_name: z.string().min(3).max(255),
    description: z.string().max(1000).optional(),
  }),
});

export type RegisterSellerInput = z.infer<typeof registerSellerSchema>['body'];
