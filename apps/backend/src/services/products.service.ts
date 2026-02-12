import { ProductsRepository } from '../repositories/products.repository';
import { OrdersRepository } from '../repositories/orders.repository';
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
  private ordersRepository: OrdersRepository;

  constructor() {
    this.repository = new ProductsRepository();
    this.ordersRepository = new OrdersRepository();
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

    if (product.quantity !== null && product.quantity < 1) {
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

    const orderResult = await this.ordersRepository.create({
      orderNumber,
      buyerId,
      sellerId: product.sellerId,
      productId: product.id,
      status: 'pending',
      itemPrice: price,
      shippingCost,
      tax,
      total,
    });

    if (orderResult.isErr()) {
      return failure(orderResult.error);
    }

    if (product.quantity !== null) {
      await this.repository.update(productId, {
        quantity: product.quantity - 1,
      });
    }

    return success({ order: orderResult.value });
  }
}
