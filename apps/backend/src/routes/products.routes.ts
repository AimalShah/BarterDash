import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error-handler';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/products.schemas';
import { ProductsService } from '../services/products.service';

const router = Router();
const productsService = new ProductsService();

// Get all products with optional filters
router.get(
  '/',
  asyncHandler(async (req, res: Response) => {
    const result = await productsService.getAllProducts(req.query as any);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/seller/:sellerId',
  asyncHandler(async (req, res: Response) => {
    const result = await productsService.getSellerProducts(
      req.params.sellerId as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/my-products',
  authenticate,
  requireRoles('SELLER'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productsService.getSellerProducts(req.user!.id);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res: Response) => {
    const result = await productsService.getProduct(req.params.id as string);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.post(
  '/:id/buy',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productsService.buyNow(
      req.user!.id,
      req.params.id as string,
    );
    if (result.isErr()) throw result.error;
    res.status(201).json({ success: true, data: result.value });
  }),
);

router.post(
  '/',
  authenticate,
  requireRoles('SELLER'),
  validate(createProductSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productsService.createProduct(req.user!.id, req.body);
    if (result.isErr()) throw result.error;
    res.status(201).json({ success: true, data: result.value });
  }),
);

router.patch(
  '/:id',
  authenticate,
  requireRoles('SELLER'),
  validate(updateProductSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productsService.updateProduct(
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.delete(
  '/:id',
  authenticate,
  requireRoles('SELLER'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await productsService.deleteProduct(
      req.user!.id,
      req.params.id as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, message: 'Product deleted' });
  }),
);

export default router;
