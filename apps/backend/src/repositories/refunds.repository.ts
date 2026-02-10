import { eq, desc } from 'drizzle-orm';
import { db, refunds, Refund, NewRefund } from '../db';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

export class RefundsRepository {
  /**
   * Create a refund request
   */
  async create(data: NewRefund): Promise<AppResult<Refund>> {
    try {
      const [newRefund] = await db
        .insert(refunds)
        .values({
          ...data,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return success(newRefund);
    } catch (error) {
      console.error('RefundsRepository.create', error);
      return failure(new ValidationError('Failed to create refund request'));
    }
  }

  /**
   * Find refund by ID
   */
  async findById(id: string): Promise<AppResult<Refund | null>> {
    try {
      const result = await db.query.refunds.findFirst({
        where: eq(refunds.id, id),
        with: {
          order: true,
          requestedBy: true,
        },
      });
      return success(result || null);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch refund'));
    }
  }

  /**
   * Get refunds for an order
   */
  async getByOrderId(orderId: string): Promise<AppResult<Refund[]>> {
    try {
      const results = await db.query.refunds.findMany({
        where: eq(refunds.orderId, orderId),
        orderBy: [desc(refunds.createdAt)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch order refunds'));
    }
  }

  /**
   * Update refund status
   */
  async updateStatus(
    id: string,
    data: {
      status: 'approved' | 'rejected' | 'processing' | 'completed';
      adminNotes?: string;
      approvedBy?: string;
      stripeRefundId?: string;
    },
  ): Promise<AppResult<Refund>> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (data.status === 'approved') {
        updateData.approvedAt = new Date();
      } else if (data.status === 'completed') {
        updateData.completedAt = new Date();
      }

      const [updated] = await db
        .update(refunds)
        .set(updateData)
        .where(eq(refunds.id, id))
        .returning();

      if (!updated) return failure(new NotFoundError('Refund not found'));

      return success(updated);
    } catch (error) {
      return failure(new ValidationError('Failed to update refund status'));
    }
  }
}
