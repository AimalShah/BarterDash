import { eq } from 'drizzle-orm';
import { db, orders, Order } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

export class OrdersRepository {
  async findById(id: string): Promise<AppResult<Order | null>> {
    try {
      const result = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          buyer: true,
          seller: true,
          product: true,
          stream: true,
        },
      });
      return success(result || null);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch order'));
    }
  }

  async findByBuyer(buyerId: string): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.orders.findMany({
        where: eq(orders.buyerId, buyerId),
        with: {
          seller: true,
          product: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch orders'));
    }
  }

  async findBySeller(sellerId: string): Promise<AppResult<any[]>> {
    try {
      const result = await db.query.orders.findMany({
        where: eq(orders.sellerId, sellerId),
        with: {
          buyer: true,
          product: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch sales'));
    }
  }

  async create(data: any): Promise<AppResult<Order>> {
    try {
      const [newOrder] = await db.insert(orders).values(data).returning();
      return success(newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      return failure(new ValidationError('Failed to create order'));
    }
  }

  async update(id: string, data: Partial<Order>): Promise<AppResult<Order>> {
    try {
      const [updated] = await db
        .update(orders)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) {
        return success(null as any); // Or failure Not Found
      }
      return success(updated);
    } catch (error) {
      console.error('Error updating order:', error);
      return failure(new ValidationError('Failed to update order'));
    }
  }
}
