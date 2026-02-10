import {
  db,
  products,
  analyticsEvents,
  follows,
  sellerDetails,
  profiles,
} from '../db';
import { eq, and, ne, gte, desc } from 'drizzle-orm';
import { AppResult, success, failure, ValidationError } from '../utils/result';

export class RecommendationService {
  async getForYouFeed(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<AppResult<any[]>> {
    try {
      const user = await this.getUserProfile(userId);

      const candidates = await db
        .select()
        .from(products)
        .where(
          and(eq(products.status, 'active'), ne(products.sellerId, userId)),
        )
        .limit(100);

      const scoredProducts = await Promise.all(
        candidates.map(async (product) => ({
          ...product,
          score: await this.calculateScore(product, user),
        })),
      );

      scoredProducts.sort((a, b) => b.score - a.score);
      const diversified = this.diversifyResults(scoredProducts);
      const results = diversified.slice(offset, offset + limit);

      await this.trackRecommendations(
        userId,
        results.map((p) => p.id),
      );

      return success(results);
    } catch (error) {
      console.error('Recommendation failed:', error);
      return this.getTrendingProducts(limit, offset);
    }
  }

  private async calculateScore(product: any, user: any): Promise<number> {
    const interestScore = this.calculateInterestScore(product, user);
    const engagementScore = await this.calculateEngagementScore(product, user);
    const socialScore = await this.calculateSocialScore(product, user);
    const recencyScore = this.calculateRecencyScore(product);

    return (
      interestScore * 0.4 +
      engagementScore * 0.3 +
      socialScore * 0.2 +
      recencyScore * 0.1
    );
  }

  private calculateInterestScore(product: any, user: any): number {
    if (!user.interests || user.interests.length === 0) return 0.2;
    if (user.interests.includes(product.categoryId)) return 0.4;

    const related = this.getRelatedCategories(product.categoryId);
    return user.interests.some((id: string) => related.includes(id)) ? 0.2 : 0;
  }

  private async calculateEngagementScore(
    product: any,
    user: any,
  ): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const views = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, user.id),
          eq(analyticsEvents.eventType, 'product_view'),
          gte(analyticsEvents.createdAt, thirtyDaysAgo),
        ),
      )
      .limit(50);

    const similarCount = views.filter((v) => {
      const meta = v.metadata as any;
      return (
        meta?.categoryId === product.categoryId ||
        meta?.sellerId === product.sellerId
      );
    }).length;

    return Math.min((similarCount / 10) * 0.3, 0.3);
  }

  private async calculateSocialScore(product: any, user: any): Promise<number> {
    const following = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, user.id),
          eq(follows.followingId, product.sellerId),
        ),
      )
      .limit(1);

    if (following.length > 0) return 0.2;

    const seller = await db
      .select()
      .from(sellerDetails)
      .where(eq(sellerDetails.userId, product.sellerId))
      .limit(1);

    return seller[0]?.rating && parseFloat(seller[0].rating.toString()) >= 4.5
      ? 0.1
      : 0;
  }

  private calculateRecencyScore(product: any): number {
    const hoursSince =
      (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0, 0.05 * (1 - hoursSince / (30 * 24)));
    const popularity = product.viewCount > 100 ? 0.05 : 0;
    return recency + popularity;
  }

  private diversifyResults(products: any[]): any[] {
    const counts = new Map<string, number>();
    const result: any[] = [];

    for (const p of products) {
      const count = counts.get(p.sellerId) || 0;
      if (count < 2) {
        result.push(p);
        counts.set(p.sellerId, count + 1);
      }
    }
    return result;
  }

  private async getUserProfile(userId: string): Promise<any> {
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });
    return user || { id: userId, interests: [] };
  }

  async getTrendingProducts(
    limit: number,
    offset: number,
  ): Promise<AppResult<any[]>> {
    try {
      const results = await db
        .select()
        .from(products)
        .where(eq(products.status, 'active'))
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset);
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch trending'));
    }
  }

  private getRelatedCategories(categoryId: string): string[] {
    const map: Record<string, string[]> = {
      electronics: ['phones', 'computers', 'gaming'],
      fashion: ['shoes', 'accessories', 'jewelry'],
      collectibles: ['vintage', 'art', 'antiques'],
    };
    return map[categoryId] || [];
  }

  private async trackRecommendations(
    userId: string,
    productIds: string[],
  ): Promise<void> {
    try {
      await db.insert(analyticsEvents).values({
        userId,
        eventType: 'recommendations_shown',
        metadata: { productIds },
      });
    } catch (e) {
      console.error('Track failed:', e);
    }
  }

  async trackClick(
    userId: string,
    productId: string,
  ): Promise<AppResult<boolean>> {
    try {
      await db.insert(analyticsEvents).values({
        userId,
        eventType: 'recommendation_click',
        metadata: { productId },
      });
      return success(true);
    } catch (error) {
      return failure(new ValidationError('Failed to track'));
    }
  }
}

export const recommendationService = new RecommendationService();
