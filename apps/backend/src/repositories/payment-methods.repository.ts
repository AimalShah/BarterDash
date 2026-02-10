import { eq, and, desc } from 'drizzle-orm';
import { db, paymentMethods, PaymentMethod, NewPaymentMethod } from '../db';
import { AppResult, success, failure, NotFoundError, InternalError } from '../utils/result';

/**
 * Payment Methods Repository
 * Data access layer for payment methods
 */
export class PaymentMethodsRepository {
  /**
   * Create a new payment method
   */
  async create(data: NewPaymentMethod): Promise<AppResult<PaymentMethod>> {
    try {
      const [paymentMethod] = await db
        .insert(paymentMethods)
        .values(data)
        .returning();

      return success(paymentMethod);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to create payment method'
        )
      );
    }
  }

  /**
   * Get all payment methods for a user
   */
  async findByUserId(userId: string): Promise<AppResult<PaymentMethod[]>> {
    try {
      const userPaymentMethods = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId))
        .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

      return success(userPaymentMethods);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to fetch payment methods'
        )
      );
    }
  }

  /**
   * Get a specific payment method by ID and user ID
   */
  async findByIdAndUserId(
    id: string,
    userId: string
  ): Promise<AppResult<PaymentMethod>> {
    try {
      const paymentMethod = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, id),
            eq(paymentMethods.userId, userId)
          )
        )
        .limit(1);

      if (paymentMethod.length === 0) {
        return failure(new NotFoundError('Payment method', id));
      }

      return success(paymentMethod[0]);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to fetch payment method'
        )
      );
    }
  }

  /**
   * Get payment method by Stripe payment method ID
   */
  async findByStripeId(stripePaymentMethodId: string): Promise<AppResult<PaymentMethod>> {
    try {
      const paymentMethod = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.stripePaymentMethodId, stripePaymentMethodId))
        .limit(1);

      if (paymentMethod.length === 0) {
        return failure(new NotFoundError('Payment method', stripePaymentMethodId));
      }

      return success(paymentMethod[0]);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to fetch payment method by Stripe ID'
        )
      );
    }
  }

  /**
   * Get user's default payment method
   */
  async findDefaultByUserId(userId: string): Promise<AppResult<PaymentMethod | null>> {
    try {
      const defaultPaymentMethod = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.userId, userId),
            eq(paymentMethods.isDefault, true)
          )
        )
        .limit(1);

      return success(defaultPaymentMethod[0] || null);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to fetch default payment method'
        )
      );
    }
  }

  /**
   * Update a payment method
   */
  async update(
    id: string,
    userId: string,
    data: Partial<PaymentMethod>
  ): Promise<AppResult<PaymentMethod>> {
    try {
      const [updatedPaymentMethod] = await db
        .update(paymentMethods)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(paymentMethods.id, id),
            eq(paymentMethods.userId, userId)
          )
        )
        .returning();

      if (!updatedPaymentMethod) {
        return failure(new NotFoundError('Payment method', id));
      }

      return success(updatedPaymentMethod);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to update payment method'
        )
      );
    }
  }

  /**
   * Set a payment method as default (and unset others)
   */
  async setAsDefault(
    id: string,
    userId: string
  ): Promise<AppResult<PaymentMethod>> {
    try {
      // The database trigger will handle unsetting other defaults
      const [updatedPaymentMethod] = await db
        .update(paymentMethods)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(paymentMethods.id, id),
            eq(paymentMethods.userId, userId)
          )
        )
        .returning();

      if (!updatedPaymentMethod) {
        return failure(new NotFoundError('Payment method', id));
      }

      return success(updatedPaymentMethod);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to set default payment method'
        )
      );
    }
  }

  /**
   * Delete a payment method
   */
  async delete(id: string, userId: string): Promise<AppResult<void>> {
    try {
      const result = await db
        .delete(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, id),
            eq(paymentMethods.userId, userId)
          )
        )
        .returning();

      if (result.length === 0) {
        return failure(new NotFoundError('Payment method', id));
      }

      return success(undefined);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to delete payment method'
        )
      );
    }
  }

  /**
   * Count payment methods for a user
   */
  async countByUserId(userId: string): Promise<AppResult<number>> {
    try {
      const result = await db
        .select({ count: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId));

      return success(result.length);
    } catch (error) {
      return failure(
        new InternalError(
          error instanceof Error ? error.message : 'Failed to count payment methods'
        )
      );
    }
  }
}