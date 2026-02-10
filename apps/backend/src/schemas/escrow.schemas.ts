import { z } from 'zod';

/**
 * Escrow Schemas - Zod validation for escrow endpoints
 */

// Create escrow payment for an order
export const createEscrowSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export type CreateEscrowInput = z.infer<typeof createEscrowSchema>['body'];

// Capture payment to escrow
export const captureEscrowSchema = z.object({
  params: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  }),
});

// Release escrow to seller
export const releaseEscrowSchema = z.object({
  params: z.object({
    escrowId: z.string().uuid('Invalid escrow ID'),
  }),
  body: z.object({
    reason: z.enum([
      'delivery_confirmed',
      'auto_release',
      'dispute_resolved',
      'admin_override',
    ]),
  }),
});

export type ReleaseEscrowInput = z.infer<typeof releaseEscrowSchema>['body'];

// Refund escrow to buyer
export const refundEscrowSchema = z.object({
  params: z.object({
    escrowId: z.string().uuid('Invalid escrow ID'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Refund reason is required').max(500),
  }),
});

export type RefundEscrowInput = z.infer<typeof refundEscrowSchema>['body'];

// Get escrow by ID
export const getEscrowSchema = z.object({
  params: z.object({
    escrowId: z.string().uuid('Invalid escrow ID'),
  }),
});

// Get escrow by order ID
export const getEscrowByOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});
