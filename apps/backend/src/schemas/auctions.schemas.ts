import { z } from 'zod';

/**
 * Auctions validation schemas
 */

// Create Auction Schema (for pre-bidding/standalone auctions)
export const createAuctionSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
    starting_bid: z.number().positive().or(z.string().transform(Number)),
    reserve_price: z
      .number()
      .positive()
      .or(z.string().transform(Number))
      .optional(),
    minimum_bid_increment: z
      .number()
      .positive()
      .or(z.string().transform(Number))
      .default(1),
    duration_minutes: z.number().int().positive().max(10080).default(1440), // Max 7 days, default 24h
    scheduled_start: z.string().datetime().optional(), // For pre-bidding, when auction starts
    mode: z.enum(['normal', 'sudden_death']).default('normal'),
    max_timer_extensions: z.number().int().positive().default(10),
  }),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>['body'];

// Start Auction on Stream Product Schema
export const startStreamAuctionSchema = z.object({
  body: z.object({
    stream_id: z.string().uuid(),
    product_id: z.string().uuid(),
    starting_bid: z.number().positive().or(z.string().transform(Number)),
    reserve_price: z
      .number()
      .positive()
      .or(z.string().transform(Number))
      .optional(),
    minimum_bid_increment: z
      .number()
      .positive()
      .or(z.string().transform(Number))
      .default(1),
    duration_minutes: z.number().int().positive().max(60).default(5), // Live auctions are shorter
    mode: z.enum(['normal', 'sudden_death']).default('normal'),
    max_timer_extensions: z.number().int().positive().default(10),
  }),
});

export type StartStreamAuctionInput = z.infer<
  typeof startStreamAuctionSchema
>['body'];

// Go Live Schema
export const goLiveSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    duration_minutes: z.number().int().positive().max(1440).default(60), // Max 24 hours
  }),
});

export type GoLiveInput = z.infer<typeof goLiveSchema>;

// Query Filters Schema
export const auctionFiltersSchema = z.object({
  query: z.object({
    status: z
      .enum(['draft', 'scheduled', 'live', 'ended', 'cancelled'])
      .optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
  }),
});

export type AuctionFilters = z.infer<typeof auctionFiltersSchema>['query'];

// UUID Param Schema
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
