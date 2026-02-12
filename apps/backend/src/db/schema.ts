import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
  integer,
  json,
  pgEnum,
  uniqueIndex,
  index,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Drizzle ORM Schema Definitions
 * Complete Whatnot Clone Schema
 */

// ============================================
// ENUMS
// ============================================
export const userRoleEnum = pgEnum('user_role', ['USER', 'SELLER', 'ADMIN']);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const streamStatusEnum = pgEnum('stream_status', [
  'scheduled',
  'live',
  'ended',
  'cancelled',
]);

export const conditionEnum = pgEnum('product_condition', [
  'new',
  'like_new',
  'good',
  'fair',
  'poor',
]);

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'sold',
  'cancelled',
]);

export const streamProductStatusEnum = pgEnum('stream_product_status', [
  'upcoming',
  'active',
  'sold',
  'passed',
]);

export const auctionStatusEnum = pgEnum('auction_status', [
  'pending',
  'active',
  'ended',
  'cancelled',
]);

export const auctionModeEnum = pgEnum('auction_mode', [
  'normal',
  'sudden_death',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const orderTypeEnum = pgEnum('order_type', ['auction', 'buy_now']);

export const sellerApplicationStatusEnum = pgEnum('seller_application_status', [
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'more_info_needed',
]);

export const businessTypeEnum = pgEnum('business_type', [
  'individual',
  'business',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'id_front',
  'id_back',
  'business_license',
  'tax_form',
  'bank_statement',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'verified',
  'failed',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
]);

export const reportTypeEnum = pgEnum('report_type', [
  'user',
  'stream',
  'product',
  'chat_message',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending',
  'processing',
  'paid',
  'failed',
]);

export const accountStatusEnum = pgEnum('account_status', [
  'active',
  'suspended',
  'banned',
  'under_review',
]);

export const refundStatusEnum = pgEnum('refund_status', [
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed',
]);

export const escrowStatusEnum = pgEnum('escrow_status', [
  'pending', // Payment intent created, not yet captured
  'held', // Funds captured and held in escrow
  'releasing', // Release to seller in progress
  'released', // Funds transferred to seller
  'refunding', // Refund in progress
  'refunded', // Funds returned to buyer
  'disputed', // Under dispute
  'cancelled', // Escrow cancelled before capture
]);

export const directMessageTypeEnum = pgEnum('direct_message_type', [
  'text',
  'image',
  'product_link',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'push',
  'email',
  'sms',
]);

export const streamSessionStateEnum = pgEnum('stream_session_state', [
  'initializing',
  'active',
  'paused',
  'ended',
  'error',
]);

export const chatMessageTypeEnum = pgEnum('chat_message_type', [
  'user_message',
  'system_message',
  'auction_update',
]);

// ============================================
// PROFILES TABLE
// ============================================
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // References auth.users
    username: varchar('username', { length: 255 }).unique().notNull(),
    fullName: varchar('full_name', { length: 255 }),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    phone: varchar('phone', { length: 50 }),
    isSeller: boolean('is_seller').default(false).notNull(),
    isAdmin: boolean('is_admin').default(false).notNull(),
    sellerTier: varchar('seller_tier', { length: 50 }), // 'basic', 'verified', 'power'
    // Onboarding columns
    onboarded: boolean('onboarded').default(false).notNull(),
    onboardingStep: varchar('onboarding_step', { length: 50 })
      .default('profile')
      .notNull(), // 'profile', 'interests', 'notifications', 'completed'
    onboardingCompletedAt: timestamp('onboarding_completed_at'),
    interests: json('interests').$type<string[]>(), // Array of category IDs
    notificationPreferences: json('notification_preferences')
      .$type<{
        streamAlerts: boolean;
        bidAlerts: boolean;
        emailNotifications: boolean;
      }>()
      .default({
        streamAlerts: true,
        bidAlerts: true,
        emailNotifications: true,
      }),
    emailVerified: boolean('email_verified').default(false).notNull(),
    accountStatus: accountStatusEnum('account_status')
      .default('active')
      .notNull(),
    lastLoginAt: timestamp('last_login_at'),
    tutorialCompleted: boolean('tutorial_completed').default(false).notNull(),
    // Age verification
    dateOfBirth: timestamp('date_of_birth'),
    ageVerified: boolean('age_verified').default(false).notNull(),
    guardianConsent: boolean('guardian_consent').default(false),
    guardianConsentDocument: text('guardian_consent_document'),
    // Stripe integration
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex('profiles_username_idx').on(table.username),
    onboardedIdx: index('profiles_onboarded_idx').on(table.onboarded),
    onboardingStepIdx: index('profiles_onboarding_step_idx').on(
      table.onboardingStep,
    ),
  }),
);

// ============================================
// USER INTERESTS TABLE
// ============================================
export const userInterests = pgTable(
  'user_interests',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: uniqueIndex('user_interests_pk').on(table.userId, table.categoryId),
  }),
);

// ============================================
// SELLER APPLICATIONS TABLE
// ============================================
export const sellerApplications = pgTable('seller_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: sellerApplicationStatusEnum().default('draft').notNull(),
  businessType: businessTypeEnum(),
  businessName: varchar('business_name', { length: 255 }),
  taxId: varchar('tax_id', { length: 100 }),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewerId: uuid('reviewer_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// VERIFICATION DOCUMENTS TABLE
// ============================================
export const verificationDocuments = pgTable('verification_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => sellerApplications.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum().notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }),
  verificationStatus: verificationStatusEnum().default('pending').notNull(),
  verificationData: json('verification_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// SELLER DETAILS TABLE
// ============================================
export const sellerDetails = pgTable('seller_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  // Stripe Connect
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  stripeAccountStatus: varchar('stripe_account_status', { length: 50 }), // 'pending', 'active', 'restricted'
  stripePayoutsEnabled: boolean('stripe_payouts_enabled')
    .default(false)
    .notNull(),
  stripeChargesEnabled: boolean('stripe_charges_enabled')
    .default(false)
    .notNull(),
  stripeOnboardingComplete: boolean('stripe_onboarding_complete')
    .default(false)
    .notNull(),
  // Verification
  bankAccountVerified: boolean('bank_account_verified')
    .default(false)
    .notNull(),
  identityVerified: boolean('identity_verified').default(false).notNull(),
  trustScore: integer('trust_score').default(100).notNull(),
  // Sales stats
  totalSales: decimal('total_sales', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 })
    .default('8.00') // 8% platform fee
    .notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0').notNull(),
  totalReviews: integer('total_reviews').default(0).notNull(),
  // Payouts
  payoutSchedule: varchar('payout_schedule', { length: 20 })
    .default('weekly')
    .notNull(),
  nextPayoutDate: timestamp('next_payout_date'),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// CATEGORIES TABLE
// ============================================
// @ts-ignore
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  iconUrl: text('icon_url'),
  parentId: uuid('parent_id').references(
    (): AnyPgColumn => (categories as any).id,
    {
      onDelete: 'cascade',
    },
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// STREAMS TABLE
// ============================================
export const streams = pgTable(
  'streams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    thumbnailUrl: text('thumbnail_url'),
    status: streamStatusEnum().default('scheduled').notNull(),
    scheduledStart: timestamp('scheduled_start'),
    actualStart: timestamp('actual_start'),
    actualEnd: timestamp('actual_end'),
    viewerCount: integer('viewer_count').default(0).notNull(),
    peakViewers: integer('peak_viewers').default(0).notNull(),
    totalSales: decimal('total_sales', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    streamUrl: text('stream_url'),
    streamKey: text('stream_key'),
    agoraChannelName: text('agora_channel_name'),
    recordingUrl: text('recording_url'),
    peakViewerCount: integer('peak_viewer_count').default(0).notNull(),
    totalViewTime: integer('total_view_time').default(0).notNull(),
    chatEnabled: boolean('chat_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sellerIdx: index('streams_seller_idx').on(table.sellerId),
    statusIdx: index('streams_status_idx').on(table.status),
  }),
);

// ============================================
// STREAM SUBSCRIPTIONS TABLE (for "Notify Me" feature)
// ============================================
export const streamSubscriptions = pgTable(
  'stream_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    streamId: uuid('stream_id')
      .notNull()
      .references(() => streams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    notified: boolean('notified').default(false).notNull(),
  },
  (table) => ({
    streamUserIdx: uniqueIndex('stream_subscriptions_unique_idx').on(
      table.streamId,
      table.userId,
    ),
    streamIdx: index('stream_subscriptions_stream_idx').on(table.streamId),
    userIdx: index('stream_subscriptions_user_idx').on(table.userId),
  }),
);

// ============================================
// PRODUCTS TABLE
// ============================================
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    condition: conditionEnum(),
    startingBid: decimal('starting_bid', { precision: 12, scale: 2 }),
    buyNowPrice: decimal('buy_now_price', { precision: 12, scale: 2 }),
    reservePrice: decimal('reserve_price', { precision: 12, scale: 2 }),
    quantity: integer('quantity').default(1).notNull(),
    soldQuantity: integer('sold_quantity').default(0).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    images: json('images').$type<string[]>().default([]),
    status: productStatusEnum().default('draft').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sellerIdx: index('products_seller_idx').on(table.sellerId),
    statusIdx: index('products_status_idx').on(table.status),
  }),
);

// ============================================
// STREAM PRODUCTS TABLE
// ============================================
export const streamProducts = pgTable(
  'stream_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    streamId: uuid('stream_id')
      .notNull()
      .references(() => streams.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order'),
    status: streamProductStatusEnum().default('upcoming').notNull(),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueStreamProduct: uniqueIndex('stream_products_unique_idx').on(
      table.streamId,
      table.productId,
    ),
  }),
);

// ============================================
// AUCTIONS TABLE
// ============================================
export const auctions = pgTable(
  'auctions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    streamId: uuid('stream_id').references(() => streams.id, {
      onDelete: 'set null',
    }),
    startingBid: decimal('starting_bid', { precision: 12, scale: 2 }).notNull(),
    currentBid: decimal('current_bid', { precision: 12, scale: 2 }),
    currentBidderId: uuid('current_bidder_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    reservePrice: decimal('reserve_price', { precision: 12, scale: 2 }),
    bidCount: integer('bid_count').default(0).notNull(),
    status: auctionStatusEnum().default('pending').notNull(),
    minimumBidIncrement: decimal('minimum_bid_increment', {
      precision: 12,
      scale: 2,
    })
      .default('1.00')
      .notNull(),
    reserveMet: boolean('reserve_met').default(false).notNull(),
    winnerNotified: boolean('winner_notified').default(false).notNull(),
    mode: auctionModeEnum().default('normal').notNull(),
    timerExtensions: integer('timer_extensions').default(0).notNull(),
    maxTimerExtensions: integer('max_timer_extensions').default(10).notNull(),
    originalEndsAt: timestamp('original_ends_at'),
    startedAt: timestamp('started_at'),
    endsAt: timestamp('ends_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('auctions_product_idx').on(table.productId),
    statusIdx: index('auctions_status_idx').on(table.status),
    endsAtIdx: index('auctions_ends_at_idx').on(table.endsAt),
  }),
);

// ============================================
// BIDS TABLE
// ============================================
export const bids = pgTable(
  'bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    bidderId: uuid('bidder_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    isWinning: boolean('is_winning').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    auctionIdx: index('bids_auction_idx').on(table.auctionId),
    createdAtIdx: index('bids_created_at_idx').on(table.createdAt),
  }),
);

// ============================================
// REFUNDS TABLE
// ============================================
export const refunds = pgTable(
  'refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    requestedBy: uuid('requested_by').references(() => profiles.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason').notNull(),
    status: refundStatusEnum('status').default('pending').notNull(),
    stripeRefundId: varchar('stripe_refund_id', { length: 255 }),
    adminNotes: text('admin_notes'),
    approvedBy: uuid('approved_by').references(() => profiles.id),
    approvedAt: timestamp('approved_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index('refunds_order_idx').on(table.orderId),
    statusIdx: index('refunds_status_idx').on(table.status),
  }),
);

// ============================================
// NOTIFICATION PREFERENCES TABLE
// ============================================
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    notificationType: varchar('notification_type', { length: 100 }).notNull(),
    pushEnabled: boolean('push_enabled').default(true).notNull(),
    emailEnabled: boolean('email_enabled').default(true).notNull(),
    smsEnabled: boolean('sms_enabled').default(false).notNull(),
  },
  (table) => ({
    pk: uniqueIndex('notification_preferences_pk').on(
      table.userId,
      table.notificationType,
    ),
  }),
);

// ============================================
// ORDERS TABLE
// ============================================
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    streamId: uuid('stream_id').references(() => streams.id, {
      onDelete: 'set null',
    }),
    orderType: orderTypeEnum().notNull(),
    itemPrice: decimal('item_price', { precision: 12, scale: 2 }).notNull(),
    shippingCost: decimal('shipping_cost', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    tax: decimal('tax', { precision: 12, scale: 2 }).default('0').notNull(),
    platformFee: decimal('platform_fee', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    platformFeeAmount: decimal('platform_fee_amount', {
      precision: 12,
      scale: 2,
    }),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    status: orderStatusEnum().default('pending').notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    trackingNumber: varchar('tracking_number', { length: 255 }),
    carrier: varchar('carrier', { length: 100 }),
    estimatedDelivery: timestamp('estimated_delivery'),
    shippingAddress: json('shipping_address').$type<{
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>(),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    buyerIdx: index('orders_buyer_idx').on(table.buyerId),
    sellerIdx: index('orders_seller_idx').on(table.sellerId),
    statusIdx: index('orders_status_idx').on(table.status),
  }),
);

// ============================================
// ORDER ITEMS TABLE
// ============================================
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').default(1).notNull(),
  priceAtPurchase: decimal('price_at_purchase', {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// CART ITEMS TABLE
// ============================================
export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserProduct: uniqueIndex('cart_items_unique_idx').on(
      table.userId,
      table.productId,
    ),
    userCartIdx: index('cart_items_user_idx').on(table.userId),
    expiryCartIdx: index('cart_items_expiry_idx').on(table.expiresAt),
  }),
);

// ============================================
// CHAT MESSAGES TABLE
// ============================================
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    streamId: uuid('stream_id')
      .notNull()
      .references(() => streams.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => streamSessions.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    messageType: chatMessageTypeEnum('message_type')
      .default('user_message')
      .notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedBy: uuid('deleted_by').references(() => profiles.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    metadata: json('metadata').default({}),
  },
  (table) => ({
    streamIdx: index('chat_messages_stream_idx').on(
      table.streamId,
      table.createdAt,
    ),
    sessionIdx: index('chat_messages_session_idx').on(
      table.sessionId,
      table.createdAt,
    ),
    typeIdx: index('chat_messages_type_idx').on(table.messageType),
  }),
);

// ============================================
// STREAM SESSIONS TABLE
// ============================================
export const streamSessions = pgTable(
  'stream_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    auctionId: uuid('auction_id').references(() => auctions.id, {
      onDelete: 'set null',
    }),
    channelId: varchar('channel_id', { length: 255 }).notNull().unique(),
    state: streamSessionStateEnum('state').default('initializing').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
    viewerCount: integer('viewer_count').default(0).notNull(),
    metadata: json('metadata').default({}),
  },
  (table) => ({
    sellerIdx: index('stream_sessions_seller_idx').on(table.sellerId),
    stateIdx: index('stream_sessions_state_idx').on(table.state),
    createdAtIdx: index('stream_sessions_created_at_idx').on(table.createdAt),
  }),
);

// ============================================
// STREAM VIEWERS TABLE
// ============================================
export const streamViewers = pgTable(
  'stream_viewers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => streamSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    uniqueSessionUser: uniqueIndex('stream_viewers_unique_idx').on(
      table.sessionId,
      table.userId,
    ),
    sessionIdx: index('stream_viewers_session_idx').on(table.sessionId),
    userIdx: index('stream_viewers_user_idx').on(table.userId),
    activeIdx: index('stream_viewers_active_idx').on(
      table.sessionId,
      table.isActive,
    ),
  }),
);

// ============================================
// AGORA TOKENS TABLE
// ============================================
export const agoraTokens = pgTable(
  'agora_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => streamSessions.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    uid: integer('uid').notNull(),
    privileges: json('privileges')
      .$type<{
        canPublish: boolean;
        canSubscribe: boolean;
        canAdmin: boolean;
      }>()
      .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    userSessionIdx: index('agora_tokens_user_session_idx').on(
      table.userId,
      table.sessionId,
    ),
    channelIdx: index('agora_tokens_channel_idx').on(table.channelId),
    expiresIdx: index('agora_tokens_expires_idx').on(table.expiresAt),
    activeIdx: index('agora_tokens_active_idx').on(table.isActive),
  }),
);

// ============================================
// STREAM BANS TABLE
// ============================================
export const streamBans = pgTable(
  'stream_bans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    streamId: uuid('stream_id')
      .notNull()
      .references(() => streams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    bannedBy: uuid('banned_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    isPermanent: boolean('is_permanent').default(false).notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueStreamUser: uniqueIndex('stream_bans_unique_idx').on(
      table.streamId,
      table.userId,
    ),
  }),
);

// ============================================
// NOTIFICATIONS TABLE
// ============================================
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }),
    message: text('message').notNull(),
    data: json('data').$type<Record<string, any>>().default({}),
    isRead: boolean('is_read').default(false).notNull(),
    channel: notificationChannelEnum('channel').default('push').notNull(),
    deliveredAt: timestamp('delivered_at'),
    clickedAt: timestamp('clicked_at'),
    actionUrl: text('action_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId, table.createdAt),
  }),
);

// ============================================
// REVIEWS TABLE
// ============================================
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    sellerResponse: text('seller_response'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sellerIdx: index('reviews_seller_idx').on(table.sellerId),
  }),
);

// ============================================
// FOLLOWS TABLE
// ============================================
export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: uniqueIndex('follows_pk').on(table.followerId, table.followingId),
  }),
);

// ============================================
// REPORTS TABLE
// ============================================
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    reportedUserId: uuid('reported_user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    reportedProductId: uuid('reported_product_id').references(
      () => products.id,
      {
        onDelete: 'cascade',
      },
    ),
    reportedStreamId: uuid('reported_stream_id').references(() => streams.id, {
      onDelete: 'cascade',
    }),
    reportType: varchar('report_type', { length: 100 }).notNull(),
    description: text('description').notNull(),
    status: reportStatusEnum().default('pending').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id),
    reviewNotes: text('review_notes'),
    actionTaken: varchar('action_taken', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => ({
    statusIdx: index('reports_status_idx').on(table.status),
    reportedUserIdx: index('reports_reported_user_idx').on(
      table.reportedUserId,
    ),
  }),
);

// ============================================
// PAYMENT METHODS TABLE
// ============================================
export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    stripePaymentMethodId: varchar('stripe_payment_method_id', { length: 255 })
      .notNull()
      .unique(),
    type: varchar('type', { length: 50 }).notNull(), // 'card', 'bank_account'
    fingerprint: varchar('fingerprint', { length: 255 }).notNull(),
    last4: varchar('last4', { length: 4 }).notNull(),
    brand: varchar('brand', { length: 50 }), // 'visa', 'mastercard', etc.
    expiryMonth: integer('expiry_month'),
    expiryYear: integer('expiry_year'),
    isDefault: boolean('is_default').default(false).notNull(),
    metadata: json('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('payment_methods_user_idx').on(table.userId),
    defaultIdx: index('payment_methods_default_idx').on(
      table.userId,
      table.isDefault,
    ),
  }),
);

// ============================================
// PAYMENTS TABLE
// ============================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  userId: uuid('user_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }).unique(),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('usd').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, succeeded, failed, refunded
  paymentMethod: varchar('payment_method', { length: 50 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// PAYOUTS TABLE
// ============================================
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: payoutStatusEnum().default('pending').notNull(),
  stripePayoutId: varchar('stripe_payout_id', { length: 255 }),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  failureReason: text('failure_reason'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// ESCROW TRANSACTIONS TABLE
// ============================================
export const escrowTransactions = pgTable(
  'escrow_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    // Amounts
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    platformFee: decimal('platform_fee', { precision: 12, scale: 2 }).notNull(),
    sellerAmount: decimal('seller_amount', {
      precision: 12,
      scale: 2,
    }).notNull(),
    currency: varchar('currency', { length: 3 }).default('usd').notNull(),
    // Status
    status: escrowStatusEnum('status').default('pending').notNull(),
    // Stripe IDs
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeTransferId: varchar('stripe_transfer_id', { length: 255 }),
    stripeRefundId: varchar('stripe_refund_id', { length: 255 }),
    // Timestamps
    heldAt: timestamp('held_at'),
    releasedAt: timestamp('released_at'),
    refundedAt: timestamp('refunded_at'),
    releaseScheduledAt: timestamp('release_scheduled_at'), // Auto-release date
    // Metadata
    releaseReason: varchar('release_reason', { length: 100 }), // 'delivery_confirmed', 'auto_release', 'dispute_resolved'
    refundReason: text('refund_reason'),
    disputeId: varchar('dispute_id', { length: 255 }),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index('escrow_order_idx').on(table.orderId),
    buyerIdx: index('escrow_buyer_idx').on(table.buyerId),
    sellerIdx: index('escrow_seller_idx').on(table.sellerId),
    statusIdx: index('escrow_status_idx').on(table.status),
  }),
);

// ============================================
// SHIPPING LABELS TABLE
// ============================================
export const shippingLabels = pgTable('shipping_labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  carrier: varchar('carrier', { length: 50 }).notNull(), // 'usps', 'ups', 'fedex'
  serviceLevel: varchar('service_level', { length: 50 }), // 'priority', 'express', 'ground'
  trackingNumber: varchar('tracking_number', { length: 255 }),
  labelUrl: text('label_url'),
  rateId: varchar('rate_id', { length: 255 }), // Shippo/EasyPost rate ID
  shipmentId: varchar('shipment_id', { length: 255 }), // Shippo/EasyPost shipment ID
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  insuranceAmount: decimal('insurance_amount', { precision: 10, scale: 2 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  weightOz: integer('weight_oz'),
  dimensions: json('dimensions').$type<{
    length: number;
    width: number;
    height: number;
  }>(),
  status: varchar('status', { length: 50 }).default('created').notNull(), // created, purchased, refunded
  purchasedAt: timestamp('purchased_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// OFFERS TABLE (Make Offer Feature)
// ============================================
export const offerStatusEnum = pgEnum('offer_status', [
  'pending',
  'accepted',
  'rejected',
  'countered',
  'expired',
  'withdrawn',
]);

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  originalPrice: decimal('original_price', {
    precision: 12,
    scale: 2,
  }).notNull(),
  offerPrice: decimal('offer_price', { precision: 12, scale: 2 }).notNull(),
  counterPrice: decimal('counter_price', { precision: 12, scale: 2 }),
  message: text('message'), // Buyer's message
  sellerResponse: text('seller_response'),
  status: offerStatusEnum().default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  respondedAt: timestamp('responded_at'),
  orderId: uuid('order_id').references(() => orders.id), // If accepted and order created
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// ORDER BUNDLES TABLE (Multi-item shipping)
// ============================================
export const orderBundles = pgTable('order_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  orderIds: uuid('order_ids').array().notNull(), // Array of order IDs in bundle
  bundleDiscount: decimal('bundle_discount', {
    precision: 10,
    scale: 2,
  }).default('0'),
  combinedShippingCost: decimal('combined_shipping_cost', {
    precision: 10,
    scale: 2,
  }),
  shippingLabelId: uuid('shipping_label_id').references(
    () => shippingLabels.id,
  ),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// SURPRISE SETS TABLE (Mystery Boxes)
// ============================================
export const surpriseSetStatusEnum = pgEnum('surprise_set_status', [
  'draft',
  'active',
  'sold_out',
  'ended',
]);

export const surpriseSets = pgTable('surprise_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  streamId: uuid('stream_id').references(() => streams.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }), // Estimated total value
  categoryId: uuid('category_id').references(() => categories.id),
  totalAvailable: integer('total_available').notNull(),
  totalSold: integer('total_sold').default(0).notNull(),
  itemsDescription: text('items_description'), // General description of possible items
  revealType: varchar('reveal_type', { length: 50 }).default('live').notNull(), // 'live', 'unboxing', 'mystery'
  images: json('images').$type<string[]>().default([]),
  status: surpriseSetStatusEnum().default('draft').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// SELLER PAYOUT HOLDS TABLE (New Seller Holds)
// ============================================
export const payoutHolds = pgTable('payout_holds', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  holdReason: varchar('hold_reason', { length: 100 }).notNull(), // 'new_seller', 'dispute', 'high_risk'
  holdUntil: timestamp('hold_until').notNull(),
  releasedAt: timestamp('released_at'),
  releasedBy: uuid('released_by').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// CATEGORY REQUIREMENTS TABLE (Category-Specific Approvals)
// ============================================
export const categoryRequirements = pgTable('category_requirements', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  requirementType: varchar('requirement_type', { length: 50 }).notNull(), // 'approval', 'min_sales', 'rating'
  minSalesRequired: integer('min_sales_required'),
  minRatingRequired: decimal('min_rating_required', { precision: 3, scale: 2 }),
  requiresDocumentation: boolean('requires_documentation').default(false),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sellerCategoryApprovals = pgTable(
  'seller_category_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('pending').notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at'),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id),
    notes: text('notes'),
  },
  (table) => ({
    uniqueSellerCategory: uniqueIndex('seller_category_approval_unique').on(
      table.sellerId,
      table.categoryId,
    ),
  }),
);

// ============================================
// PUSH TOKENS TABLE
// ============================================
export const pushTokens = pgTable(
  'push_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    platform: varchar('platform', { length: 20 }).notNull(), // 'ios', 'android', 'web'
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserToken: uniqueIndex('push_tokens_unique_idx').on(
      table.userId,
      table.token,
    ),
  }),
);

// ============================================
// SAVED STREAMS TABLE
// ============================================
export const savedStreams = pgTable(
  'saved_streams',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    streamId: uuid('stream_id')
      .notNull()
      .references(() => streams.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: uniqueIndex('saved_streams_pk').on(table.userId, table.streamId),
  }),
);

// ============================================
// CONVERSATIONS TABLE
// ============================================
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    participantIds: uuid('participant_ids').array().notNull(),
    lastMessageId: uuid('last_message_id'),
    lastMessageAt: timestamp('last_message_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    participantIdsIdx: index('conversations_participants_idx').on(
      table.participantIds,
    ),
  }),
);

// ============================================
// MESSAGES TABLE
// ============================================
export const directMessages = pgTable(
  'direct_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    messageType: directMessageTypeEnum('message_type')
      .default('text')
      .notNull(),
    attachmentUrl: text('attachment_url'),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index('direct_messages_conversation_idx').on(
      table.conversationId,
      table.createdAt,
    ),
    senderIdx: index('direct_messages_sender_idx').on(table.senderId),
    unreadIdx: index('direct_messages_unread_idx')
      .on(table.conversationId)
      .where(sql`${table.readAt} IS NULL`),
  }),
);

// ============================================
// AUTO BIDS TABLE
// ============================================
export const autoBids = pgTable(
  'auto_bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    maxAmount: decimal('max_amount', { precision: 12, scale: 2 }).notNull(),
    currentProxyBid: decimal('current_proxy_bid', { precision: 12, scale: 2 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueAutoBid: uniqueIndex('auto_bids_unique_idx').on(
      table.auctionId,
      table.userId,
    ),
    activeAuctionIdx: index('auto_bids_auction_active_idx')
      .on(table.auctionId)
      .where(sql`${table.isActive} = true`),
  }),
);

// ============================================
// BLOCKED USERS TABLE
// ============================================
export const blockedUsers = pgTable(
  'blocked_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueBlock: uniqueIndex('unique_block_idx').on(
      table.userId,
      table.blockedId,
    ),
  }),
);

// ============================================
// USER WATCHLIST TABLE
// ============================================
export const userWatchlist = pgTable(
  'user_watchlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    streamId: uuid('stream_id').references(() => streams.id, {
      onDelete: 'cascade',
    }),
    productId: uuid('product_id').references(() => products.id, {
      onDelete: 'cascade',
    }),
    addedAt: timestamp('added_at').defaultNow().notNull(),
    notificationEnabled: boolean('notification_enabled')
      .default(true)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userItemIdx: index('user_item_idx').on(table.userId),
    userProductIdx: index('watchlist_user_product_idx').on(
      table.userId,
      table.productId,
    ),
    userStreamIdx: index('watchlist_user_stream_idx').on(
      table.userId,
      table.streamId,
    ),
  }),
);

// ============================================
// ANALYTICS EVENTS TABLE
// ============================================
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    sessionId: uuid('session_id'),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    metadata: json('metadata'),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userTimeIdx: index('analytics_user_time_idx').on(
      table.userId,
      table.createdAt,
    ),
    eventTypeIdx: index('analytics_event_type_idx').on(
      table.eventType,
      table.createdAt,
    ),
    sessionIdx: index('analytics_session_idx').on(table.sessionId),
  }),
);

// ============================================
// RELATIONS
// ============================================

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  sellerDetails: one(sellerDetails, {
    fields: [profiles.id],
    references: [sellerDetails.userId],
  }),
  sellerApplication: one(sellerApplications, {
    fields: [profiles.id],
    references: [sellerApplications.userId],
  }),
  streams: many(streams),
  products: many(products),
  bids: many(bids),
  orders: many(orders),
  reviews: many(reviews),
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
  cartItems: many(cartItems),
}));

export const sellerDetailsRelations = relations(sellerDetails, ({ one }) => ({
  profile: one(profiles, {
    fields: [sellerDetails.userId],
    references: [profiles.id],
  }),
}));

export const sellerApplicationsRelations = relations(
  sellerApplications,
  ({ one, many }) => ({
    user: one(profiles, {
      fields: [sellerApplications.userId],
      references: [profiles.id],
    }),
    documents: many(verificationDocuments),
  }),
);

export const verificationDocumentsRelations = relations(
  verificationDocuments,
  ({ one }) => ({
    application: one(sellerApplications, {
      fields: [verificationDocuments.applicationId],
      references: [sellerApplications.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  streams: many(streams),
  products: many(products),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  seller: one(profiles, {
    fields: [streams.sellerId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [streams.categoryId],
    references: [categories.id],
  }),
  products: many(streamProducts),
  auctions: many(auctions),
  chatMessages: many(chatMessages),
  bans: many(streamBans),
  subscriptions: many(streamSubscriptions),
  sessions: many(streamSessions),
}));

export const streamSubscriptionsRelations = relations(
  streamSubscriptions,
  ({ one }) => ({
    stream: one(streams, {
      fields: [streamSubscriptions.streamId],
      references: [streams.id],
    }),
    user: one(profiles, {
      fields: [streamSubscriptions.userId],
      references: [profiles.id],
    }),
  }),
);

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(profiles, {
    fields: [products.sellerId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  streamProducts: many(streamProducts),
  auctions: many(auctions),
  cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  user: one(profiles, {
    fields: [cartItems.userId],
    references: [profiles.id],
  }),
}));

export const streamProductsRelations = relations(streamProducts, ({ one }) => ({
  stream: one(streams, {
    fields: [streamProducts.streamId],
    references: [streams.id],
  }),
  product: one(products, {
    fields: [streamProducts.productId],
    references: [products.id],
  }),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  product: one(products, {
    fields: [auctions.productId],
    references: [products.id],
  }),
  stream: one(streams, {
    fields: [auctions.streamId],
    references: [streams.id],
  }),
  currentBidder: one(profiles, {
    fields: [auctions.currentBidderId],
    references: [profiles.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  bidder: one(profiles, {
    fields: [bids.bidderId],
    references: [profiles.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(profiles, {
    fields: [orders.buyerId],
    references: [profiles.id],
    relationName: 'buyer',
  }),
  seller: one(profiles, {
    fields: [orders.sellerId],
    references: [profiles.id],
    relationName: 'seller',
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  stream: one(streams, {
    fields: [orders.streamId],
    references: [streams.id],
  }),
  review: one(reviews, {
    fields: [orders.id],
    references: [reviews.orderId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  reviewer: one(profiles, {
    fields: [reviews.reviewerId],
    references: [profiles.id],
  }),
  seller: one(profiles, {
    fields: [reviews.sellerId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: 'follower',
  }),

  following: one(profiles, {
    fields: [follows.followingId],
    references: [profiles.id],
    relationName: 'following',
  }),
}));

export const autoBidsRelations = relations(autoBids, ({ one }) => ({
  auction: one(auctions, {
    fields: [autoBids.auctionId],
    references: [auctions.id],
  }),
  user: one(profiles, {
    fields: [autoBids.userId],
    references: [profiles.id],
  }),
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  user: one(profiles, {
    fields: [blockedUsers.userId],
    references: [profiles.id],
    relationName: 'blocking_user',
  }),
  blocked: one(profiles, {
    fields: [blockedUsers.blockedId],
    references: [profiles.id],
    relationName: 'blocked_user',
  }),
}));

export const userWatchlistRelations = relations(userWatchlist, ({ one }) => ({
  user: one(profiles, {
    fields: [userWatchlist.userId],
    references: [profiles.id],
  }),
  stream: one(streams, {
    fields: [userWatchlist.streamId],
    references: [streams.id],
  }),
  product: one(products, {
    fields: [userWatchlist.productId],
    references: [products.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [directMessages.conversationId],
    references: [conversations.id],
  }),
  sender: one(profiles, {
    fields: [directMessages.senderId],
    references: [profiles.id],
  }),
}));

// ============================================
// NEW STREAMING RELATIONS
// ============================================
export const streamSessionsRelations = relations(
  streamSessions,
  ({ one, many }) => ({
    seller: one(profiles, {
      fields: [streamSessions.sellerId],
      references: [profiles.id],
    }),
    auction: one(auctions, {
      fields: [streamSessions.auctionId],
      references: [auctions.id],
    }),
    viewers: many(streamViewers),
    chatMessages: many(chatMessages),
    agoraTokens: many(agoraTokens),
  }),
);

export const streamViewersRelations = relations(streamViewers, ({ one }) => ({
  session: one(streamSessions, {
    fields: [streamViewers.sessionId],
    references: [streamSessions.id],
  }),
  user: one(profiles, {
    fields: [streamViewers.userId],
    references: [profiles.id],
  }),
}));

export const agoraTokensRelations = relations(agoraTokens, ({ one }) => ({
  user: one(profiles, {
    fields: [agoraTokens.userId],
    references: [profiles.id],
  }),
  session: one(streamSessions, {
    fields: [agoraTokens.sessionId],
    references: [streamSessions.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type SellerDetails = InferSelectModel<typeof sellerDetails>;
export type NewSellerDetails = InferInsertModel<typeof sellerDetails>;
export type SellerApplication = InferSelectModel<typeof sellerApplications>;
export type NewSellerApplication = InferInsertModel<typeof sellerApplications>;
export type VerificationDocument = InferSelectModel<
  typeof verificationDocuments
>;
export type NewVerificationDocument = InferInsertModel<
  typeof verificationDocuments
>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Stream = InferSelectModel<typeof streams>;
export type NewStream = InferInsertModel<typeof streams>;
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
export type StreamProduct = InferSelectModel<typeof streamProducts>;
export type NewStreamProduct = InferInsertModel<typeof streamProducts>;
export type Auction = InferSelectModel<typeof auctions>;
export type NewAuction = InferInsertModel<typeof auctions>;
export type Bid = InferSelectModel<typeof bids>;
export type NewBid = InferInsertModel<typeof bids>;
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type CartItem = InferSelectModel<typeof cartItems>;
export type NewCartItem = InferInsertModel<typeof cartItems>;
export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type NewChatMessage = InferInsertModel<typeof chatMessages>;
export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;
export type Follow = InferSelectModel<typeof follows>;
export type NewFollow = InferInsertModel<typeof follows>;
export type Report = InferSelectModel<typeof reports>;
export type NewReport = InferInsertModel<typeof reports>;
export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
export type PaymentMethod = InferSelectModel<typeof paymentMethods>;
export type NewPaymentMethod = InferInsertModel<typeof paymentMethods>;
export type Payout = InferSelectModel<typeof payouts>;
export type NewPayout = InferInsertModel<typeof payouts>;
export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = InferInsertModel<typeof conversations>;
export type Message = InferSelectModel<typeof directMessages>;
export type NewMessage = InferInsertModel<typeof directMessages>;
export type AutoBid = InferSelectModel<typeof autoBids>;
export type NewAutoBid = InferInsertModel<typeof autoBids>;
export type UserWatchlist = InferSelectModel<typeof userWatchlist>;
export type NewUserWatchlist = InferInsertModel<typeof userWatchlist>;
export type Refund = InferSelectModel<typeof refunds>;
export type NewRefund = InferInsertModel<typeof refunds>;
export type NotificationPreference = InferSelectModel<
  typeof notificationPreferences
>;
export type NewNotificationPreference = InferInsertModel<
  typeof notificationPreferences
>;

// ============================================
// NEW STREAMING TYPE EXPORTS
// ============================================
export type StreamSession = InferSelectModel<typeof streamSessions>;
export type NewStreamSession = InferInsertModel<typeof streamSessions>;
export type StreamViewer = InferSelectModel<typeof streamViewers>;
export type NewStreamViewer = InferInsertModel<typeof streamViewers>;
export type AgoraToken = InferSelectModel<typeof agoraTokens>;
export type NewAgoraToken = InferInsertModel<typeof agoraTokens>;
