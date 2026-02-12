import { eq, isNull } from 'drizzle-orm';
import { db, categories, Category } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';
import crypto from 'crypto';

export class CategoriesRepository {
  async findAll(): Promise<AppResult<Category[]>> {
    try {
      const result = await db.query.categories.findMany({
        with: { subcategories: true },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch categories'));
    }
  }

  async findTopLevel(): Promise<AppResult<Category[]>> {
    try {
      const result = await db.query.categories.findMany({
        where: isNull(categories.parentId),
        with: { subcategories: true },
      });
      return success(result);
    } catch (error) {
      return failure(
        new ValidationError('Failed to fetch top-level categories'),
      );
    }
  }

  async findById(id: string): Promise<AppResult<Category | null>> {
    try {
      const result = await db.query.categories.findFirst({
        where: eq(categories.id, id),
        with: { subcategories: true, parent: true },
      });
      return success(result || null);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch category'));
    }
  }

  async create(
    name: string,
    parentId?: string | null,
  ): Promise<AppResult<Category>> {
    try {
      // Generate slug from name
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        crypto.randomUUID().slice(0, 8);

      const [result] = await db
        .insert(categories)
        .values({
          name,
          slug,
          parentId: parentId || null,
        })
        .returning();

      return success(result);
    } catch (error) {
      console.error('Failed to create category:', error);
      return failure(new ValidationError('Failed to create category'));
    }
  }
}
