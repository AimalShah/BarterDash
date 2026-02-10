import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CategoriesService } from '../services/categories.service';
import { z } from 'zod';

const router = Router();
const categoriesService = new CategoriesService();

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(255),
    parentId: z.string().uuid().optional().nullable(),
  }),
});

router.get(
  '/',
  asyncHandler(async (_req, res: Response) => {
    const result = await categoriesService.getAllCategories();
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/top-level',
  asyncHandler(async (_req, res: Response) => {
    const result = await categoriesService.getTopLevelCategories();
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res: Response) => {
    const result = await categoriesService.getCategory(req.params.id as string);
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: result.value });
  }),
);

router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  asyncHandler(async (req, res: Response) => {
    const { name, parentId } = req.body;
    const result = await categoriesService.createCategory(name, parentId);
    if (result.isErr()) throw result.error;
    res.status(201).json({ success: true, data: result.value });
  }),
);

export default router;
