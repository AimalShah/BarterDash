import { AppResult, success, failure, ValidationError } from '../utils/result';
import { db } from '../db';
import { orders, shippingLabels } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Shipping Service
 * Handles shipping label generation, rate fetching, and address validation.
 * Currently uses a Mock Provider structure.
 */

export interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  service: string; // e.g., 'Priority Mail'
  cost: number;
}

export class ShippingService {
  /**
   * Generate a shipping label for an order
   */
  async generateLabel(
    orderId: string,
    userId: string,
  ): Promise<AppResult<ShippingLabel>> {
    try {
      // 1. Fetch Order
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          product: true,
        },
      });

      if (!order) {
        return failure(new ValidationError('Order not found'));
      }

      if (order.sellerId !== userId) {
        return failure(
          new ValidationError('Unauthorized: Only seller can generate label'),
        );
      }

      if (!order.shippingAddress) {
        return failure(
          new ValidationError('Shipping address missing for this order'),
        );
      }

      // Check if label already exists
      const existingLabel = await db.query.shippingLabels.findFirst({
        where: eq(shippingLabels.orderId, orderId),
      });

      if (existingLabel && existingLabel.labelUrl) {
        // Return existing label if found
        return success({
          trackingNumber: existingLabel.trackingNumber || '',
          labelUrl: existingLabel.labelUrl,
          carrier: existingLabel.carrier,
          service: existingLabel.serviceLevel || 'Standard',
          cost: Number(existingLabel.cost),
        });
      }

      // 2. (Mock) Call External Provider (EasyPost/Shippo)
      const mockLabel = await this.mockGenerateLabelProvider(order);

      // 3. Save to Shipping Labels Table
      await db.insert(shippingLabels).values({
        orderId: orderId,
        sellerId: userId,
        carrier: mockLabel.carrier,
        serviceLevel: mockLabel.service,
        trackingNumber: mockLabel.trackingNumber,
        labelUrl: mockLabel.labelUrl,
        cost: mockLabel.cost.toString(),
        status: 'created',
        purchasedAt: new Date(),
      });

      // 4. Update Order record with tracking info and status
      await db
        .update(orders)
        .set({
          trackingNumber: mockLabel.trackingNumber,
          carrier: mockLabel.carrier,
          status: 'shipped', // Auto-update status to shipped
          shippedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return success(mockLabel);
    } catch (error: any) {
      console.error('Shipping Label Generation Error:', error);
      return failure(error);
    }
  }

  /**
   * Mock Provider Implementation
   */
  private async mockGenerateLabelProvider(_order: any): Promise<ShippingLabel> {
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate fake tracking number
    const carrier = 'USPS';
    const trackingNumber = `940010000000000000${Math.floor(1000 + Math.random() * 9000)}`;

    // Simulate a reliable label URL
    const labelUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;

    return {
      trackingNumber,
      labelUrl,
      carrier,
      service: 'Priority Mail',
      cost: 7.5, // Mock cost
    };
  }
}

export const shippingService = new ShippingService();
