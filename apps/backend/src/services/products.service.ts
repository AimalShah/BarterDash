import { ProductsRepository } from '../repositories/products.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ForbiddenError,
} from '../utils/result';
import { Product, NewProduct } from '../db/schema';

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
}
