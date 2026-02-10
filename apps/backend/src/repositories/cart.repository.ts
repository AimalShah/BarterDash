import { eq, and, sql } from 'drizzle-orm';
import { db, cartItems, CartItem } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

export class CartRepository {
  async findByUserId(userId: string): Promise<AppResult<CartItem[]>> {
    try {
      const result = await db.query.cartItems.findMany({
        where: eq(cartItems.userId, userId),
        with: {
          product: {
            with: {
              category: true,
            },
          },
        },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch cart items'));
    }
  }

  async findByUserIdWithProducts(
    userId: string,
  ): Promise<AppResult<(CartItem & { product: any })[]>> {
    try {
      const result = await db.query.cartItems.findMany({
        where: eq(cartItems.userId, userId),
        with: {
          product: {
            with: {
              category: true,
            },
          },
        },
      });
      return success(result);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch cart items'));
    }
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<AppResult<CartItem>> {
    try {
      // Check if item already exists in cart
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId),
        ),
      });

      if (existingItem) {
        // Update quantity
        const updatedItem = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return success(updatedItem[0]);
      } else {
        // Add new item
        const [newItem] = await db
          .insert(cartItems)
          .values({
            userId,
            productId,
            quantity,
            addedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h expiry
            createdAt: new Date(),
          })
          .returning();

        return success(newItem);
      }
    } catch (error) {
      return failure(new ValidationError('Failed to add item to cart'));
    }
  }

  async updateQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<AppResult<CartItem>> {
    try {
      if (quantity <= 0) {
        await this.removeItem(userId, cartItemId);
        return success({} as CartItem);
      }

      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity })
        .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
        .returning();

      return success(updatedItem);
    } catch (error) {
      return failure(new ValidationError('Failed to update cart item'));
    }
  }

  async removeItem(
    userId: string,
    cartItemId: string,
  ): Promise<AppResult<boolean>> {
    try {
      const result = await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)))
        .returning();

      return success(result.length > 0);
    } catch (error) {
      return failure(new ValidationError('Failed to remove item from cart'));
    }
  }

  async clearCart(userId: string): Promise<AppResult<boolean>> {
    try {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to clear cart'));
    }
  }

  async getItemCount(userId: string): Promise<AppResult<number>> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(cartItems)
        .where(eq(cartItems.userId, userId));

      return success(Number(result[0]?.count) || 0);
    } catch (error) {
      return failure(new ValidationError('Failed to get cart item count'));
    }
  }

  async validateCartItems(
    userId: string,
  ): Promise<AppResult<{ validItems: CartItem[]; invalidItems: CartItem[] }>> {
    try {
      const cartItemsResult = await this.findByUserIdWithProducts(userId);
      if (cartItemsResult.isErr()) return failure(cartItemsResult.error);

      const validItems: CartItem[] = [];
      const invalidItems: CartItem[] = [];

      for (const cartItem of cartItemsResult.value) {
        const product = cartItem.product;

        // Check if product exists and is available
        if (!product || product.status !== 'active') {
          invalidItems.push(cartItem);
          continue;
        }

        // Check if quantity is available
        if (cartItem.quantity > product.quantity - product.soldQuantity) {
          invalidItems.push(cartItem);
          continue;
        }

        validItems.push(cartItem);
      }

      return success({ validItems, invalidItems });
    } catch {
      return failure(new ValidationError('Failed to validate cart items'));
    }
  }
}
