import { RefundsRepository } from '../repositories/refunds.repository';
import { AppResult, failure, ValidationError, NotFoundError } from '../utils/result';
import { db, orders } from '../db';
import { eq } from 'drizzle-orm';

export class RefundsService {
  private repository: RefundsRepository;

  constructor() {
    this.repository = new RefundsRepository();
  }

  async requestRefund(
    userId: string,
    data: { orderId: string; reason: string; amount: number },
  ): Promise<AppResult<any>> {
    // Validate order belongs to user
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order || order.buyerId !== userId) {
      return failure(new ValidationError('Order not found or access denied'));
    }

    return await this.repository.create({
      orderId: data.orderId,
      requestedBy: userId,
      amount: data.amount.toString(),
      reason: data.reason,
    } as any);
  }

  async getRefund(refundId: string): Promise<AppResult<any>> {
    const result = await this.repository.findById(refundId);
    if (result.isErr()) return failure(result.error);
    if (!result.value) return failure(new NotFoundError('Refund', refundId));
    return result;
  }

  async getOrderRefunds(orderId: string): Promise<AppResult<any[]>> {
    return await this.repository.getByOrderId(orderId);
  }

  async processRefund(
    adminId: string,
    refundId: string,
    status: 'approved' | 'rejected',
    notes: string,
  ): Promise<AppResult<any>> {
    // This would typically involve Stripe refund logic if approved
    const result = await this.repository.updateStatus(refundId, {
      status: status === 'approved' ? 'processing' : 'rejected',
      adminNotes: notes,
      approvedBy: adminId,
    });

    if (result.isOk() && status === 'approved') {
      // Placeholder: Call Stripe API here
      // On success, update status to 'completed'
    }

    return result;
  }
}
