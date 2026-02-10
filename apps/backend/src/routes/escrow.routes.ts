import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { validate } from '../middleware/validate';
import {
  createEscrowSchema,
  releaseEscrowSchema,
  refundEscrowSchema,
  getEscrowSchema,
  getEscrowByOrderSchema,
} from '../schemas/escrow.schemas';
import { EscrowService } from '../services/escrow.service';

const router = Router();
const escrowService = new EscrowService();

/**
 * POST /escrow/create
 * Create an escrow payment for an order
 * Protected - requires JWT (buyer)
 */
router.post(
  '/create',
  authenticate,
  validate(createEscrowSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.body;

    const result = await escrowService.createEscrowPayment(orderId, userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(201).json({
      success: true,
      message: 'Escrow payment created',
      data: result.value,
    });
  }),
);

/**
 * POST /escrow/release/:escrowId
 * Release escrow funds to seller
 * Protected - requires JWT (admin or system)
 */
router.post(
  '/release/:escrowId',
  authenticate,
  validate(releaseEscrowSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const escrowId = req.params.escrowId as string;
    const { reason } = req.body;

    const result = await escrowService.releaseToSeller(escrowId, reason);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Escrow released to seller',
      data: {
        escrowId: result.value.escrow.id,
        transferId: result.value.transfer.id,
        sellerAmount: result.value.escrow.sellerAmount,
      },
    });
  }),
);

/**
 * POST /escrow/refund/:escrowId
 * Refund escrow to buyer
 * Protected - requires JWT (admin or system)
 */
router.post(
  '/refund/:escrowId',
  authenticate,
  validate(refundEscrowSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const escrowId = req.params.escrowId as string;
    const { reason } = req.body;

    const result = await escrowService.refundToBuyer(escrowId, reason);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Escrow refunded to buyer',
      data: {
        escrowId: result.value.escrow.id,
        refundId: result.value.refund.id,
        amount: result.value.escrow.amount,
      },
    });
  }),
);

/**
 * GET /escrow/:escrowId
 * Get escrow details by ID
 * Protected - requires JWT
 */
router.get(
  '/:escrowId',
  authenticate,
  validate(getEscrowSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const escrowId = req.params.escrowId as string;
    const userId = req.user!.id;

    const result = await escrowService.getEscrow(escrowId);

    if (result.isErr()) {
      throw result.error;
    }

    // Verify user is buyer or seller
    const escrow = result.value;
    if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: escrow,
    });
  }),
);

/**
 * GET /escrow/order/:orderId
 * Get escrow by order ID
 * Protected - requires JWT
 */
router.get(
  '/order/:orderId',
  authenticate,
  validate(getEscrowByOrderSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const userId = req.user!.id;

    const result = await escrowService.getEscrowByOrder(orderId);

    if (result.isErr()) {
      throw result.error;
    }

    // Verify user is buyer or seller
    const escrow = result.value;
    if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: escrow,
    });
  }),
);

export default router;
