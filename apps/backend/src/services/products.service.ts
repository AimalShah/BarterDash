import { ProductsRepository } from '../repositories/products.repository';
import { db, products, orders } from '../db';
import { and, eq, sql } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/result';
import { Product, NewProduct } from '../db/schema';
import { randomUUID } from 'crypto';

export class ProductsService {
  private repository: ProductsRepository;

  constructor() {
    this.repository = new ProductsRepository();
  }

  async getProduct(id: string): Promise<AppResult<Product>> {
    const result = await this.repository.findById(id);
    if (result.isErr()) return failure(result.error);
    if (!result.value) return failure(new NotFoundError('Product', id));
    return success(result.value);
  }

  async createProduct(userId: string, data: any): Promise<AppResult<Product>> {
    const productData: NewProduct = {
      ...data,
      sellerId: userId,
    };
    return await this.repository.create(productData);
  }

  async updateProduct(
    userId: string,
    productId: string,
    data: any,
  ): Promise<AppResult<Product>> {
    const existing = await this.repository.findById(productId);
    if (existing.isErr()) return failure(existing.error);
    if (!existing.value)
      return failure(new NotFoundError('Product', productId));

    if (existing.value.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this product'));
    }

    return await this.repository.update(productId, data);
  }

  async deleteProduct(
    userId: string,
    productId: string,
  ): Promise<AppResult<boolean>> {
    const existing = await this.repository.findById(productId);
    if (existing.isErr()) return failure(existing.error);
    if (!existing.value)
      return failure(new NotFoundError('Product', productId));

    if (existing.value.sellerId !== userId) {
      return failure(new ForbiddenError('You do not own this product'));
    }

    return await this.repository.delete(productId);
  }

  async getSellerProducts(sellerId: string): Promise<AppResult<Product[]>> {
    return await this.repository.findBySeller(sellerId);
  }

  async getAllProducts(filters?: {
    status?: string;
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AppResult<Product[]>> {
    return await this.repository.findAll(filters);
  }

  async buyNow(
    buyerId: string,
    productId: string,
  ): Promise<AppResult<{ order: any }>> {
    const productResult = await this.repository.findById(productId);
    if (productResult.isErr()) return failure(productResult.error);
    if (!productResult.value)
      return failure(new NotFoundError('Product', productId));

    const product = productResult.value;

    if (product.sellerId === buyerId) {
      return failure(new ForbiddenError('You cannot buy your own product'));
    }

    if (product.status !== 'active') {
      return failure(
        new ValidationError('Product is not available for purchase'),
      );
    }

    const availableStock =
      product.quantity !== null
        ? product.quantity - (product.soldQuantity || 0)
        : 0;

    if (availableStock < 1) {
      return failure(new ValidationError('Product is out of stock'));
    }

    const orderNumber = `ORD-${randomUUID().substring(0, 8).toUpperCase()}`;
    const price = product.buyNowPrice || product.startingBid || '0';
    const shippingCost = product.shippingCost || '5.99';
    const tax = (parseFloat(price) * 0.08).toFixed(2);
    const total = (
      parseFloat(price) +
      parseFloat(shippingCost) +
      parseFloat(tax)
    ).toFixed(2);

    try {
      const order = await db.transaction(async (tx) => {
        const [reservedProduct] = await tx
          .update(products)
          .set({
            soldQuantity: sql`${products.soldQuantity} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, productId),
              eq(products.status, 'active'),
              sql`${products.quantity} - ${products.soldQuantity} >= 1`,
            ),
          )
          .returning();

        if (!reservedProduct) {
          return null;
        }

        const [newOrder] = await tx
          .insert(orders)
          .values({
            orderNumber,
            buyerId,
            sellerId: product.sellerId,
            productId: product.id,
            orderType: 'buy_now',
            status: 'pending',
            itemPrice: price,
            shippingCost,
            tax,
            total,
          })
          .returning();

        if (reservedProduct.soldQuantity >= reservedProduct.quantity) {
          await tx
            .update(products)
            .set({
              status: 'sold',
              updatedAt: new Date(),
            })
            .where(eq(products.id, productId));
        }

        return newOrder;
      });

      if (!order) {
        return failure(new ValidationError('Product is out of stock'));
      }

      return success({ order });
    } catch (error) {
      return failure(new ValidationError('Failed to create buy now order'));
    }
  }
}
