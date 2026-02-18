import { Router } from 'express';
import authRoutes from './auth.routes';
import auctionsRoutes from './auctions.routes';
import usersRoutes from './users.routes';
import sellersRoutes from './sellers.routes';
import sellerApplicationsRoutes from './seller-applications.routes';
import bidsRoutes from './bids.routes';
import paymentsRoutes from './payments.routes';
import streamRoutes from './streams.routes';
import categoryRoutes from './categories.routes';
import productRoutes from './products.routes';
import socialRoutes from './social.routes';
import orderRoutes from './orders.routes';
import cartRoutes from './cart.routes';
import messagesRoutes from './messages.routes';
import notificationsRoutes from './notifications.routes';
import reviewsRoutes from './reviews.routes';
import feedRoutes from './feed.routes';
import analyticsRoutes from './analytics.routes';
import escrowRoutes from './escrow.routes';
import stripeConnectRoutes from './stripe-connect.routes';
import reportsRoutes from './reports.routes';
import refundsRoutes from './refunds.routes';
import watchlistRoutes from './watchlist.routes';
import devRoutes from './dev.routes';
import webhooksRoutes from './webhooks.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import { config } from '../config';

const router = Router();

/**
 * Main API router
 * Aggregates all route modules
 */

// Health routes (includes both public and admin endpoints)
router.use('/health', healthRoutes);

// Mount feature routes
router.use('/auth', authRoutes);
router.use('/auctions', auctionsRoutes);
router.use('/users', usersRoutes);
router.use('/sellers', sellersRoutes);
router.use('/sellers', sellerApplicationsRoutes);
router.use('/sellers/stripe', stripeConnectRoutes);
router.use('/bids', bidsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/escrow', escrowRoutes);
router.use('/stream', streamRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/social', socialRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/feed', feedRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportsRoutes);
router.use('/refunds', refundsRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhooksRoutes);

if (config.nodeEnv === 'development') {
  router.use('/dev', devRoutes);
}

export default router;
