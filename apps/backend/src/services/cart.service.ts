import { CartRepository } from '../repositories/cart.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
} from '../utils/result';
import { db, products, orders, Order } from '../db';
import { eq } from 'drizzle-orm';

export class CartService {
  private repository: CartRepository;
  constructor() {
    this.repository = new CartRepository();
  }

  async getCart(userId: string): Promise<AppResult<any[]>> {
    const result = await this.repository.findByUserId(userId);
    if (result.isErr()) return result;

    // Filter out expired items
    const now = new Date();
    const validItems = result.value.filter(
      (item) => !item.expiresAt || new Date(item.expiresAt) > now,
    );

    return success(validItems);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<AppResult<any>> {
    // Validate product exists and is available
    const productResult = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!productResult) {
      return failure(new NotFoundError('Product', productId));
    }

    if (productResult.status !== 'active') {
      return failure(
        new ValidationError('Product is not available for purchase'),
      );
    }

    if (quantity > productResult.quantity - productResult.soldQuantity) {
      return failure(
        new ValidationError('Requested quantity exceeds available stock'),
      );
    }

    return await this.repository.addItem(userId, productId, quantity);
  }

  async updateQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<AppResult<any>> {
    // Validate the cart item belongs to the user and product is available
    const cartItemResult =
      await this.repository.findByUserIdWithProducts(userId);
    if (cartItemResult.isErr()) return failure(cartItemResult.error);

    const cartItem = cartItemResult.value.find(
      (item) => item.id === cartItemId,
    );
    if (!cartItem) {
      return failure(new NotFoundError('Cart item', cartItemId));
    }

    const product = cartItem.product;
    if (!product || product.status !== 'active') {
      return failure(new ValidationError('Product is not available'));
    }

    if (quantity > product.quantity - product.soldQuantity) {
      return failure(
        new ValidationError('Requested quantity exceeds available stock'),
      );
    }

    return await this.repository.updateQuantity(userId, cartItemId, quantity);
  }

  async removeItem(
    userId: string,
    cartItemId: string,
  ): Promise<AppResult<boolean>> {
    return await this.repository.removeItem(userId, cartItemId);
  }

  async clearCart(userId: string): Promise<AppResult<boolean>> {
    return await this.repository.clearCart(userId);
  }

  async getItemCount(userId: string): Promise<AppResult<number>> {
    return await this.repository.getItemCount(userId);
  }

  async validateCart(
    userId: string,
  ): Promise<AppResult<{ validItems: any[]; invalidItems: any[] }>> {
    return await this.repository.validateCartItems(userId);
  }

  async calculateCartTotal(userId: string): Promise<
    AppResult<{
      subtotal: number;
      shipping: number;
      total: number;
      items: any[];
    }>
  > {
    try {
      const cartItemsResult =
        await this.repository.findByUserIdWithProducts(userId);
      if (cartItemsResult.isErr()) return failure(cartItemsResult.error);

      const validItems: any[] = [];
      let subtotal = 0;
      let shipping = 0;

      for (const cartItem of cartItemsResult.value) {
        // Skip expired items
        if (cartItem.expiresAt && new Date(cartItem.expiresAt) < new Date()) {
          continue;
        }

        const product = cartItem.product;

        if (!product || product.status !== 'active') {
          continue;
        }

        if (cartItem.quantity > product.quantity - product.soldQuantity) {
          continue;
        }

        const itemTotal =
          parseFloat(product.buyNowPrice || '0') * cartItem.quantity;
        subtotal += itemTotal;
        shipping += parseFloat(product.shippingCost || '0');

        validItems.push({
          ...cartItem,
          product,
          itemTotal,
        });
      }

      const total = subtotal + shipping;

      return success({
        subtotal,
        shipping,
        total,
        items: validItems,
      });
    } catch (error) {
      return failure(new ValidationError('Failed to calculate cart total'));
    }
  }

  async createOrderFromCart(
    userId: string,
    shippingAddress: any,
  ): Promise<AppResult<Order>> {
    try {
      // Validate cart and calculate totals
      const validationResult = await this.validateCart(userId);
      if (validationResult.isErr()) return failure(validationResult.error);

      const { validItems } = validationResult.value;

      if (validItems.length === 0) {
        return failure(
          new ValidationError('Cart is empty or contains no valid items'),
        );
      }

      // Calculate totals
      const totalsResult = await this.calculateCartTotal(userId);
      if (totalsResult.isErr()) return failure(totalsResult.error);

      const { subtotal, shipping, total } = totalsResult.value;

      // Create order
      const orderData = {
        orderNumber: `ORD-${Date.now()}`,
        buyerId: userId,
        sellerId: validItems[0].product.sellerId, // For simplicity, assuming single seller
        orderType: 'buy_now' as const,
        itemPrice: subtotal.toString(),
        shippingCost: shipping.toString(),
        tax: '0', // Could be calculated based on shipping address
        platformFee: '0', // Could be calculated as percentage
        total: total.toString(),
        status: 'pending' as const,
        shippingAddress,
      };

      const [order] = await db.insert(orders).values(orderData).returning();

      // Update product quantities
      for (const cartItem of validItems) {
        await db
          .update(products)
          .set({
            soldQuantity: products.soldQuantity + cartItem.quantity,
          })
          .where(eq(products.id, cartItem.productId));
      }

      // Clear cart
      await this.clearCart(userId);

      return success(order);
    } catch (error) {
      return failure(new ValidationError('Failed to create order from cart'));
    }
  }
}
