import { OrdersRepository } from '../repositories/orders.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ForbiddenError,
} from '../utils/result';

export class OrdersService {
  private repository: OrdersRepository;

  constructor() {
    this.repository = new OrdersRepository();
  }

  async getOrder(userId: string, orderId: string): Promise<AppResult<any>> {
    const result = await this.repository.findById(orderId);
    if (result.isErr()) return failure(result.error);
    if (!result.value) return failure(new NotFoundError('Order', orderId));

    if (result.value.buyerId !== userId && result.value.sellerId !== userId) {
      return failure(
        new ForbiddenError('You do not have access to this order'),
      );
    }

    return success(result.value);
  }

  async getMyOrders(userId: string): Promise<AppResult<any[]>> {
    return await this.repository.findByBuyer(userId);
  }

  async getMySales(userId: string): Promise<AppResult<any[]>> {
    return await this.repository.findBySeller(userId);
  }

  async createOrder(data: any): Promise<AppResult<any>> {
    return await this.repository.create(data);
  }

  async updateOrder(
    userId: string,
    orderId: string,
    data: Partial<any>,
  ): Promise<AppResult<any>> {
    const orderResult = await this.repository.findById(orderId);
    if (orderResult.isErr()) return failure(orderResult.error);
    if (!orderResult.value) return failure(new NotFoundError('Order', orderId));

    const order = orderResult.value;

    // Only the buyer can update their own order details (like shipping address)
    if (order.buyerId !== userId) {
      return failure(
        new ForbiddenError('Only the buyer can update this order'),
      );
    }

    // Only allow updating pending orders
    if (order.status !== 'pending') {
      return failure(
        new ForbiddenError('Cannot update order that is not pending'),
      );
    }

    return await this.repository.update(orderId, data);
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: string,
  ): Promise<AppResult<any>> {
    const orderResult = await this.repository.findById(orderId);
    if (orderResult.isErr()) return failure(orderResult.error);
    if (!orderResult.value) return failure(new NotFoundError('Order', orderId));

    const order = orderResult.value;

    // Only the seller can update order status
    if (order.sellerId !== userId) {
      return failure(
        new ForbiddenError('Only the seller can update the order status'),
      );
    }

    return await this.repository.update(orderId, { status: status as any });
  }
}
