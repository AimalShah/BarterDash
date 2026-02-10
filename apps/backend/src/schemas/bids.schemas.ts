import { z } from 'zod';

/**
 * Bids validation schemas
 */

export const createBidSchema = z.object({
  body: z.object({
    auction_id: z.string().uuid(),
    amount: z.number().positive(),
  }),
});

export type CreateBidInput = z.infer<typeof createBidSchema>['body'];

export const auctionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
