import { eq } from 'drizzle-orm';
import { db, payments, Payment, NewPayment } from '../db';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

/**
 * Payments Repository
 * Data access layer for payments
 */
export class PaymentsRepository {
  /**
   * Create a new payment record
   */
  async create(data: NewPayment): Promise<AppResult<Payment>> {
    try {
      const [newPayment] = await db
        .insert(payments)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return success(newPayment);
    } catch (error) {
      return failure(new ValidationError('Failed to create payment record'));
    }
  }

  /**
   * Find payment by Stripe ID
   */
  async findByStripeId(stripeId: string): Promise<AppResult<Payment | null>> {
    try {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.stripePaymentId, stripeId),
      });
      return success(payment || null);
    } catch (error) {
      return failure(new NotFoundError('Payment'));
    }
  }
}
