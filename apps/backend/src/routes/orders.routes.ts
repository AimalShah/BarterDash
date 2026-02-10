import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { OrdersService } from '../services/orders.service';

const router = Router();
const ordersService = new OrdersService();

router.get(
  '/my-orders',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ordersService.getMyOrders(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/my-sales',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ordersService.getMySales(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ordersService.getOrder(
      req.user!.id,
      req.params.id as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body;
    const result = await ordersService.updateOrderStatus(
      req.user!.id,
      req.params.id as string,
      status,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.post(
  '/:id/label',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingService } = await import('../services/shipping.service');
    const result = await shippingService.generateLabel(
      req.params.id as string,
      req.user!.id,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

export default router;
