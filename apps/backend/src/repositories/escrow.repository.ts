import { eq, and, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  escrowTransactions,
  orders,
  profiles,
  sellerDetails,
} from '../db/schema';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type EscrowTransaction = InferSelectModel<typeof escrowTransactions>;
export type NewEscrowTransaction = InferInsertModel<typeof escrowTransactions>;

/**
 * Escrow Repository - Database operations for escrow transactions
 */
export class EscrowRepository {
  /**
   * Create new escrow transaction
   */
  async create(data: NewEscrowTransaction): Promise<EscrowTransaction> {
    const [escrow] = await db
      .insert(escrowTransactions)
      .values(data)
      .returning();
    return escrow;
  }

  /**
   * Get escrow by ID
   */
  async findById(id: string): Promise<EscrowTransaction | null> {
    const result = await db.query.escrowTransactions.findFirst({
      where: eq(escrowTransactions.id, id),
    });
    return result || null;
  }

  /**
   * Get escrow by order ID
   */
  async findByOrderId(orderId: string): Promise<EscrowTransaction | null> {
    const result = await db.query.escrowTransactions.findFirst({
      where: eq(escrowTransactions.orderId, orderId),
    });
    return result || null;
  }

  /**
   * Get escrow by payment intent ID
   */
  async findByPaymentIntentId(
    paymentIntentId: string,
  ): Promise<EscrowTransaction | null> {
    const result = await db.query.escrowTransactions.findFirst({
      where: eq(escrowTransactions.stripePaymentIntentId, paymentIntentId),
    });
    return result || null;
  }

  /**
   * Update escrow transaction
   */
  async update(
    id: string,
    data: Partial<NewEscrowTransaction>,
  ): Promise<EscrowTransaction> {
    const [escrow] = await db
      .update(escrowTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(escrowTransactions.id, id))
      .returning();
    return escrow;
  }

  /**
   * Get escrows pending auto-release (release_scheduled_at has passed)
   */
  async findPendingAutoRelease(): Promise<EscrowTransaction[]> {
    return db.query.escrowTransactions.findMany({
      where: and(
        eq(escrowTransactions.status, 'held'),
        lte(escrowTransactions.releaseScheduledAt, new Date()),
      ),
    });
  }

  /**
   * Get escrows by seller ID
   */
  async findBySellerId(sellerId: string): Promise<EscrowTransaction[]> {
    return db.query.escrowTransactions.findMany({
      where: eq(escrowTransactions.sellerId, sellerId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  /**
   * Get escrows by buyer ID
   */
  async findByBuyerId(buyerId: string): Promise<EscrowTransaction[]> {
    return db.query.escrowTransactions.findMany({
      where: eq(escrowTransactions.buyerId, buyerId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  /**
   * Get seller details by user ID
   */
  async getSellerDetails(userId: string) {
    return db.query.sellerDetails.findFirst({
      where: eq(sellerDetails.userId, userId),
    });
  }

  /**
   * Get order with seller details
   */
  async getOrderWithSeller(orderId: string) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        product: true,
      },
    });

    if (!order) return null;

    const seller = await this.getSellerDetails(order.sellerId);

    return { order, seller };
  }
}
