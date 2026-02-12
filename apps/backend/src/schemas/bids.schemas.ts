import { z } from 'zod';

/**
 * Bids validation schemas
 */

export const createBidSchema = z.object({
  body: z.object({
    auction_id: z.string().uuid(),
    amount: z.number().positive(),
    is_max_bid: z.boolean().optional(),
  }),
});

export type CreateBidInput = z.infer<typeof createBidSchema>['body'];

export const createMaxBidSchema = z.object({
  body: z.object({
    auction_id: z.string().uuid(),
    max_amount: z.number().positive(),
  }),
});

export type CreateMaxBidInput = z.infer<typeof createMaxBidSchema>['body'];

export const auctionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
