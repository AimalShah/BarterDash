import Stripe from 'stripe';
import { config } from '../config';

/**
 * Stripe client setup
 */
export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16' as any,
});

export const stripeWebhookSecret = config.stripeWebhookSecret;
