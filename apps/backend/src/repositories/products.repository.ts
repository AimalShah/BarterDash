import { eq, ilike, and, desc } from 'drizzle-orm';
import { db, products, Product, NewProduct } from '../db';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
} from '../utils/result';

export class ProductsRepository {
  async findById(id: string): Promise<AppResult<Product | null>> {
    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, id),
        with: {
          seller: true,
          category: true,
        },
      });
      return success(product || null);
    } catch (error) {
      return failure(new NotFoundError('Product'));
    }
  }

  async create(data: NewProduct): Promise<AppResult<Product>> {
    try {
      const [newProduct] = await db.insert(products).values(data).returning();
      return success(newProduct);
    } catch (error) {
      return failure(new ValidationError('Failed to create product'));
    }
  }

  async update(
    id: string,
    data: Partial<NewProduct>,
  ): Promise<AppResult<Product>> {
    try {
      const [updated] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Product', id));
      }

      return success(updated);
    } catch (error) {
      return failure(new ValidationError('Failed to update product'));
    }
  }

  async delete(id: string): Promise<AppResult<boolean>> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to delete product'));
    }
  }

  async findBySeller(sellerId: string): Promise<AppResult<Product[]>> {
    try {
      const result = await db.query.products.findMany({
        where: eq(products.sellerId, sellerId),
        with: { category: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch seller products'));
    }
  }

  async findAll(filters?: {
    status?: string;
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AppResult<Product[]>> {
    try {
      const conditions = [];

      // Only show active products by default
      if (filters?.status) {
        conditions.push(eq(products.status, filters.status as any));
      } else {
        conditions.push(eq(products.status, 'active'));
      }

      if (filters?.category_id) {
        conditions.push(eq(products.categoryId, filters.category_id));
      }

      if (filters?.search) {
        conditions.push(ilike(products.title, `%${filters.search}%`));
      }

      const result = await db.query.products.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { seller: true, category: true },
        orderBy: [desc(products.createdAt)],
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
      });

      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch products'));
    }
  }
}
