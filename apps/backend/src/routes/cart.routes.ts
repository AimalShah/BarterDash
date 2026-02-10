import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { CartService } from '../services/cart.service';

const router = Router();
const cartService = new CartService();

// Get user's cart
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cartService.getCart(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Add item to cart
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const result = await cartService.addItem(req.user!.id, productId, quantity);
    if (result.isErr()) throw result.error;
    res.status(201).json({ success: true, data: result.value });
  }),
);

// Update item quantity
router.put(
  '/:cartItemId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cartItemId = req.params.cartItemId as string;
    const { quantity } = req.body;
    const result = await cartService.updateQuantity(
      req.user!.id,
      cartItemId,
      quantity,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Remove item from cart
router.delete(
  '/:cartItemId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cartItemId = req.params.cartItemId as string;
    const result = await cartService.removeItem(req.user!.id, cartItemId);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Clear entire cart
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cartService.clearCart(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Get cart item count
router.get(
  '/count',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cartService.getItemCount(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Validate cart
router.get(
  '/validate',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cartService.validateCart(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Calculate cart total
router.get(
  '/total',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await cartService.calculateCartTotal(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

// Create order from cart
router.post(
  '/checkout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shippingAddress } = req.body;
    const result = await cartService.createOrderFromCart(
      req.user!.id,
      shippingAddress,
    );
    if (result.isErr()) throw result.error;
    res.status(201).json({ success: true, data: result.value });
  }),
);

export default router;
