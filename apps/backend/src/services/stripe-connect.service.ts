import Stripe from 'stripe';
import { stripe } from '../utils/stripe';
import { db } from '../db';
import { sellerDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';

/**
 * Stripe Connect Service
 * Handles seller onboarding to Stripe Connect for escrow payouts
 */
export class StripeConnectService {
  /**
   * Create a Stripe Connect Express account for a seller
   */
  async createConnectAccount(
    userId: string,
    email: string,
  ): Promise<AppResult<{ accountId: string; onboardingUrl: string }>> {
    try {
      // Check if seller already has a Connect account
      const existingSeller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (existingSeller?.stripeAccountId) {
        // Return existing account with refresh link
        const accountLink = await this.getOnboardingLink(userId);
        if (accountLink.isErr()) {
          return failure(accountLink.error);
        }
        return success({
          accountId: existingSeller.stripeAccountId,
          onboardingUrl: accountLink.value.url,
        });
      }

      // Create new Express Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: userId,
        },
      });

      // Update or create seller details
      if (existingSeller) {
        await db
          .update(sellerDetails)
          .set({
            stripeAccountId: account.id,
            stripeAccountStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(sellerDetails.userId, userId));
      } else {
        await db.insert(sellerDetails).values({
          userId: userId,
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
        });
      }

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL || 'barterdash://seller'}/stripe/refresh`,
        return_url: `${process.env.FRONTEND_URL || 'barterdash://seller'}/stripe/complete`,
        type: 'account_onboarding',
      });

      return success({
        accountId: account.id,
        onboardingUrl: accountLink.url,
      });
    } catch (error) {
      console.error('Stripe Connect account creation error:', error);
      return failure(
        new ValidationError(
          error instanceof Error
            ? error.message
            : 'Failed to create Connect account',
        ),
      );
    }
  }

  /**
   * Get a new onboarding link for an existing Connect account
   */
  async getOnboardingLink(userId: string): Promise<AppResult<{ url: string }>> {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (!seller?.stripeAccountId) {
        return failure(new NotFoundError('Stripe Connect account', userId));
      }

      const accountLink = await stripe.accountLinks.create({
        account: seller.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL || 'barterdash://seller'}/stripe/refresh`,
        return_url: `${process.env.FRONTEND_URL || 'barterdash://seller'}/stripe/complete`,
        type: 'account_onboarding',
      });

      return success({ url: accountLink.url });
    } catch (error) {
      console.error('Stripe onboarding link error:', error);
      return failure(
        new ValidationError(
          error instanceof Error
            ? error.message
            : 'Failed to get onboarding link',
        ),
      );
    }
  }

  /**
   * Get the Express dashboard link for a connected account
   */
  async getDashboardLink(userId: string): Promise<AppResult<{ url: string }>> {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (!seller?.stripeAccountId) {
        return failure(new NotFoundError('Stripe Connect account', userId));
      }

      const loginLink = await stripe.accounts.createLoginLink(
        seller.stripeAccountId,
      );

      return success({ url: loginLink.url });
    } catch (error) {
      console.error('Stripe dashboard link error:', error);
      return failure(
        new ValidationError(
          error instanceof Error
            ? error.message
            : 'Failed to get dashboard link',
        ),
      );
    }
  }

  /**
   * Get the current status of a Connect account
   */
  async getAccountStatus(userId: string): Promise<
    AppResult<{
      isConnected: boolean;
      payoutsEnabled: boolean;
      chargesEnabled: boolean;
      onboardingComplete: boolean;
      accountId: string | null;
    }>
  > {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (!seller?.stripeAccountId) {
        return success({
          isConnected: false,
          payoutsEnabled: false,
          chargesEnabled: false,
          onboardingComplete: false,
          accountId: null,
        });
      }

      // Fetch latest status from Stripe
      const account = await stripe.accounts.retrieve(seller.stripeAccountId);

      // Update local database
      await db
        .update(sellerDetails)
        .set({
          stripePayoutsEnabled: account.payouts_enabled || false,
          stripeChargesEnabled: account.charges_enabled || false,
          stripeOnboardingComplete: account.details_submitted || false,
          stripeAccountStatus: account.details_submitted ? 'active' : 'pending',
          updatedAt: new Date(),
        })
        .where(eq(sellerDetails.userId, userId));

      return success({
        isConnected: true,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        onboardingComplete: account.details_submitted || false,
        accountId: seller.stripeAccountId,
      });
    } catch (error) {
      console.error('Stripe account status error:', error);
      return failure(
        new ValidationError(
          error instanceof Error
            ? error.message
            : 'Failed to get account status',
        ),
      );
    }
  }

  /**
   * Handle account.updated webhook event
   */
  async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const userId = account.metadata?.userId;

    if (!userId) {
      console.warn(
        'Account updated webhook received without userId in metadata',
      );
      return;
    }

    await db
      .update(sellerDetails)
      .set({
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeChargesEnabled: account.charges_enabled || false,
        stripeOnboardingComplete: account.details_submitted || false,
        stripeAccountStatus: account.details_submitted ? 'active' : 'pending',
        updatedAt: new Date(),
      })
      .where(eq(sellerDetails.userId, userId));

    console.log(`Updated Connect account status for user ${userId}`);
  }
}
