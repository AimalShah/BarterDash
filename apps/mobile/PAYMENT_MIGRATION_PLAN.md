# Payment Migration Plan: Stripe → Apple Pay & Google Pay

## Executive Summary

This document outlines a complete migration strategy for transitioning from Stripe-based payments to native Apple Pay and Google Pay implementations. This is a significant architectural change that affects buyer payments, seller payouts, escrow systems, and the entire payment infrastructure.

**Migration Complexity**: High  
**Estimated Timeline**: 6-8 weeks  
**Risk Level**: High (requires complete payment processor replacement)

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Critical Questions & Decisions](#2-critical-questions--decisions)
3. [Architecture Options](#3-architecture-options)
4. [Detailed Migration Plan](#4-detailed-migration-plan)
5. [Technical Implementation](#5-technical-implementation)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Plan](#7-deployment-plan)
8. [Risk Assessment](#8-risk-assessment)
9. [Rollback Plan](#9-rollback-plan)
10. [Post-Migration Tasks](#10-post-migration-tasks)

---

## 1. Current Architecture Analysis

### 1.1 Technology Stack

**Backend (barterdash-backend)**
- Node.js + Express + TypeScript
- Stripe SDK for payment processing
- Drizzle ORM with PostgreSQL
- Supabase for real-time updates
- Current Stripe version: ^20.2.0

**Mobile (barterdash-mobile)**
- React Native + Expo
- @stripe/stripe-react-native ^0.58.0
- Custom payment UI components

**Database Schema**
```sql
-- Current payment-related tables
- payment_methods (Stripe-specific fields)
- orders (stripe_payment_intent_id)
- profiles (stripe_customer_id)
- escrow_payments (Stripe integration)
```

### 1.2 Current Payment Flows

1. **Card Payments**: Stripe PaymentIntents with client-side confirmation
2. **Checkout Sessions**: Stripe-hosted checkout for web
3. **Saved Payment Methods**: Stored as Stripe PaymentMethod objects
4. **Escrow**: Stripe manual capture + custom escrow logic
5. **Seller Payouts**: Stripe Connect Express accounts
6. **Webhooks**: 15+ webhook event types handled

### 1.3 Key Features to Preserve

- [ ] Buyer payment processing
- [ ] Payment method management
- [ ] Escrow/hold functionality
- [ ] Seller onboarding & payouts
- [ ] Refund processing
- [ ] Dispute handling
- [ ] Transaction reporting
- [ ] Real-time payment status updates

---

## 2. Critical Questions & Decisions

### 2.1 Primary Payment Processor Selection

**❓ Question 1**: Which payment processor will replace Stripe for buyer payments?

**Option A: Direct Apple Pay / Google Pay**
- Funds deposited directly to your merchant bank account
- Full control over payment flow
- Requires merchant account setup with acquiring bank
- Higher compliance burden (PCI DSS)
- Best for: Large transaction volumes, full control needed

**Option B: Braintree (PayPal)**
- Native Apple Pay & Google Pay support
- Drop-in UI components available
- Built-in fraud protection
- Seller payout capabilities via PayPal
- Best for: Mid-size, want PayPal ecosystem

**Option C: Adyen**
- Enterprise-grade solution
- Unified API for all payment methods
- Advanced fraud detection
- Global coverage
- Best for: International expansion, enterprise needs

**Option D: Square**
- Simple integration
- Supports both wallets natively
- Seller onboarding tools
- Good for SMB sellers
- Best for: Simple migration, US-focused

**Option E: Hybrid (Keep Stripe for Sellers)**
- Buyers pay via Apple/Google Pay → Your account
- Sellers paid via existing Stripe Connect
- Minimal seller migration
- Best for: Reducing migration risk

**❓ Question 2**: How will sellers receive payouts?

| Approach | Pros | Cons |
|----------|------|------|
| **New Provider** | Unified system | Massive migration effort |
| **Keep Stripe Connect** | Minimal seller disruption | Two payment systems to maintain |
| **PayPal Payouts** | Fast transfers | Not all sellers have PayPal |
| **ACH Transfers** | Direct to bank | Slower, more compliance |

**❓ Question 3**: What happens to the escrow system?

Current escrow uses Stripe's manual capture:
1. Authorize payment (hold funds)
2. Create escrow record
3. Capture payment when delivery confirmed
4. Transfer to seller via Stripe Connect

**Options:**
- **Rebuild with new provider**: Full control, complex implementation
- **Keep Stripe for escrow**: Use new provider only for initial payment, move funds to Stripe
- **Self-managed escrow**: Hold funds in your account, pay out manually

**❓ Question 4**: Geographic scope and requirements?

| Region | Apple Pay | Google Pay | Notes |
|--------|-----------|------------|-------|
| United States | ✅ | ✅ | Full support |
| Canada | ✅ | ✅ | Full support |
| UK/EU | ✅ | ✅ | SCA compliance required |
| Australia | ✅ | ✅ | Full support |
| Asia-Pacific | ⚠️ | ⚠️ | Varies by country |

**Critical considerations:**
- Currency support
- Regulatory requirements (PSD2 in EU)
- Local payment method preferences
- Tax implications

**❓ Question 5**: Fallback payment strategy?

What happens if:
- User doesn't have Apple Pay/Google Pay set up?
- Device doesn't support native wallets?
- Wallet payment fails?

**Options:**
1. **Wallet-only**: Force users to set up native wallets
2. **Stripe backup**: Keep Stripe as secondary option
3. **PayPal backup**: Offer PayPal as alternative
4. **Manual transfer**: Bank transfer instructions

**❓ Question 6**: Saved payment methods strategy?

With native wallets, you lose:
- Stored card numbers
- One-click checkout with saved cards
- Card-on-file for subscriptions

**Options:**
1. **No saved methods**: Users pay fresh each time (simplest)
2. **Wallet-only**: Rely on device's saved cards in wallet
3. **Provider vault**: Use new processor's tokenization (if available)
4. **Hybrid**: Keep Stripe tokens for subscriptions only

**❓ Question 7**: Refund and dispute handling?

Current process:
- Refunds processed via Stripe API
- Disputes managed in Stripe Dashboard
- Automatic webhook notifications

**New process needed for:**
- Refund API integration
- Dispute notification system
- Evidence submission workflow
- Chargeback handling

**❓ Question 8**: Compliance and legal requirements?

- **PCI DSS**: Still required for any payment processing
- **PCI SAQ A**: May still apply depending on implementation
- **Tax reporting**: 1099-K forms, VAT requirements
- **Data retention**: Payment data storage policies
- **Privacy**: GDPR/CCPA compliance for payment data

---

## 3. Architecture Options

### 3.1 Option A: Full Replacement (Highest Risk)

```
┌─────────────────────────────────────────────────────────┐
│  BUYER APP (iOS/Android)                                │
│  ├── Apple Pay (PassKit)                                │
│  └── Google Pay (Google Pay API)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND                                                │
│  ├── New Payment Processor (Braintree/Adyen/Square)     │
│  ├── New Escrow System                                  │
│  └── New Payout System                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SELLER PAYOUTS                                         │
│  └── New Provider Connect/Onboarding                    │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Clean, unified architecture
- Single provider relationship
- Consistent reporting

**Cons:**
- Massive migration effort
- High risk
- All sellers must re-onboard
- Potential payment disruption

**Timeline**: 8-12 weeks  
**Risk Level**: Very High

### 3.2 Option B: Hybrid Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│  BUYER APP (iOS/Android)                                │
│  ├── Apple Pay (PassKit)                                │
│  └── Google Pay (Google Pay API)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND                                                │
│  ├── New Payment Gateway                                │
│  │   └── Processes Apple/Google Pay                     │
│  ├── Escrow Coordination                                │
│  │   └── Tracks payments across systems                 │
│  └── Stripe Integration (Seller side only)              │
│      └── Existing Connect accounts                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SELLER PAYOUTS                                         │
│  └── Stripe Connect (NO CHANGE)                         │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Minimal seller disruption
- Lower risk
- Can migrate incrementally
- Apple approves (no Stripe in buyer flow)

**Cons:**
- More complex architecture
- Two payment systems to maintain
- Funds transfer between systems needed

**Timeline**: 6-8 weeks  
**Risk Level**: Medium

### 3.3 Option C: Stripe with Native Wallets (Not Apple Compliant)

**Note**: This option uses Stripe's native wallet support but routes through Stripe.

```
┌─────────────────────────────────────────────────────────┐
│  BUYER APP                                              │
│  ├── Apple Pay Button                                   │
│  └── Google Pay Button                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STRIPE (Wallet payments)                               │
└─────────────────────────────────────────────────────────┘
```

**⚠️ WARNING**: Apple typically rejects apps that use Stripe for Apple Pay because:
- They want direct PassKit integration
- Stripe takes a cut of transactions
- Less native user experience

**Not recommended** for App Store approval.

---

## 4. Detailed Migration Plan

Based on **Option B (Hybrid Architecture)** as the recommended approach:

### 4.1 Phase 1: Infrastructure Setup (Week 1)

**4.1.1 Payment Provider Selection & Setup**

**Tasks:**
- [ ] Evaluate Braintree vs Adyen vs Square
- [ ] Create merchant accounts
- [ ] Complete business verification
- [ ] Obtain API credentials
- [ ] Configure webhooks/endpoints
- [ ] Set up sandbox environments

**Decision Matrix:**

| Criteria | Braintree | Adyen | Square |
|----------|-----------|-------|--------|
| Apple Pay support | ✅ Native | ✅ Native | ✅ Native |
| Google Pay support | ✅ Native | ✅ Native | ✅ Native |
| Seller payouts | ✅ PayPal | ⚠️ Complex | ✅ Square |
| Escrow support | ⚠️ Manual | ✅ Advanced | ⚠️ Manual |
| API ease | ✅ Easy | ⚠️ Complex | ✅ Easy |
| Pricing | 2.9% + $0.30 | Custom | 2.9% + $0.30 |
| International | ⚠️ Limited | ✅ Excellent | ⚠️ Limited |

**4.1.2 Database Schema Updates**

Create migration: `20260208000000_wallet_payment_migration.sql`

```sql
-- ============================================
-- WALLET PAYMENT MIGRATION
-- ============================================

-- 1. Add wallet payment support to existing tables
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS wallet_payment_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS wallet_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS wallet_payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS funds_transfer_status VARCHAR(50) DEFAULT 'pending';

-- 2. Create wallet payments tracking table
CREATE TABLE IF NOT EXISTS wallet_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Wallet details
    wallet_type VARCHAR(50) NOT NULL, -- 'apple_pay', 'google_pay'
    provider VARCHAR(50) NOT NULL, -- 'braintree', 'adyen', 'square'
    provider_transaction_id VARCHAR(255) NOT NULL,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- 'authorized', 'captured', 'failed', 'refunded'
    
    -- Escrow tracking
    escrow_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'held', 'released', 'refunded'
    escrow_released_at TIMESTAMP WITH TIME ZONE,
    
    -- Device information
    device_info JSONB DEFAULT '{}',
    
    -- Stripe transfer tracking (for hybrid approach)
    stripe_transfer_id VARCHAR(255),
    stripe_transfer_status VARCHAR(50) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create indexes for performance
CREATE INDEX wallet_payments_user_idx ON wallet_payments(user_id);
CREATE INDEX wallet_payments_order_idx ON wallet_payments(order_id);
CREATE INDEX wallet_payments_status_idx ON wallet_payments(status);
CREATE INDEX wallet_payments_provider_idx ON wallet_payments(provider);
CREATE INDEX wallet_payments_escrow_idx ON wallet_payments(escrow_status);

-- 4. Enable RLS
ALTER TABLE wallet_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet payments" ON wallet_payments
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_wallet_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_payments_timestamp
    BEFORE UPDATE ON wallet_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_payments_timestamp();

-- 6. Create escrow events tracking table
CREATE TABLE IF NOT EXISTS escrow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    wallet_payment_id UUID REFERENCES wallet_payments(id),
    event_type VARCHAR(50) NOT NULL, -- 'created', 'funded', 'released', 'disputed'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX escrow_events_order_idx ON escrow_events(order_id);
CREATE INDEX escrow_events_payment_idx ON escrow_events(wallet_payment_id);
```

**4.1.3 Environment Configuration**

Update `.env` files:

```bash
# ============================================
# NEW WALLET PAYMENT CONFIGURATION
# ============================================

# Payment Provider Selection
PAYMENT_PROVIDER=braintree  # or 'adyen', 'square'

# Apple Pay Configuration
APPLE_PAY_MERCHANT_ID=merchant.com.yourcompany.barterdash
APPLE_PAY_MERCHANT_CERTIFICATE_PATH=/path/to/cert.pem
APPLE_PAY_MERCHANT_KEY_PATH=/path/to/key.pem
APPLE_PAY_DISPLAY_NAME=BarterDash

# Google Pay Configuration
GOOGLE_PAY_MERCHANT_ID=your-google-merchant-id
GOOGLE_PAY_MERCHANT_NAME=BarterDash
GOOGLE_PAY_ENVIRONMENT=PRODUCTION  # or 'TEST'

# Braintree Configuration (if selected)
BRAINTREE_MERCHANT_ID=your-merchant-id
BRAINTREE_PUBLIC_KEY=your-public-key
BRAINTREE_PRIVATE_KEY=your-private-key
BRAINTREE_ENVIRONMENT=sandbox  # or 'production'

# Adyen Configuration (if selected)
ADYEN_API_KEY=your-api-key
ADYEN_MERCHANT_ACCOUNT=your-merchant-account
ADYEN_CLIENT_KEY=your-client-key
ADYEN_ENVIRONMENT=test  # or 'live'

# Square Configuration (if selected)
SQUARE_APPLICATION_ID=your-app-id
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_ENVIRONMENT=sandbox  # or 'production'

# Hybrid Configuration (funds transfer to Stripe)
ENABLE_HYBRID_MODE=true
STRIPE_CONNECT_ACCOUNT_ID=your-platform-account-id
AUTO_TRANSFER_TO_STRIPE=false  # Enable after testing
TRANSFER_SCHEDULE=manual  # or 'daily', 'weekly'
```

### 4.2 Phase 2: Backend Implementation (Week 2-3)

**4.2.1 New Service: Wallet Payment Service**

Create `src/services/wallet-payments.service.ts`:

```typescript
/**
 * Wallet Payments Service
 * Handles Apple Pay and Google Pay transactions
 * Integrates with external payment provider (Braintree/Adyen/Square)
 */

import { db, orders, walletPayments, escrowEvents } from '../db';
import { eq } from 'drizzle-orm';
import { 
  AppResult, 
  success, 
  failure, 
  PaymentError,
  ValidationError,
  NotFoundError 
} from '../utils/result';
import { paymentLogger } from '../utils/payment-logger';
import { config } from '../config';

// Provider-specific imports
import braintree from 'braintree';

export interface CreateWalletPaymentInput {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  walletType: 'apple_pay' | 'google_pay';
  paymentToken: string; // Encrypted payment token from device
  deviceInfo?: {
    deviceType: string;
    osVersion: string;
    appVersion: string;
  };
}

export interface WalletPaymentResult {
  paymentId: string;
  providerTransactionId: string;
  status: 'authorized' | 'captured' | 'failed';
  amount: number;
  currency: string;
}

export class WalletPaymentsService {
  private provider: any; // Braintree/Adyen/Square client

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (config.paymentProvider) {
      case 'braintree':
        this.provider = new braintree.BraintreeGateway({
          environment: config.braintreeEnvironment === 'production' 
            ? braintree.Environment.Production 
            : braintree.Environment.Sandbox,
          merchantId: config.braintreeMerchantId!,
          publicKey: config.braintreePublicKey!,
          privateKey: config.braintreePrivateKey!,
        });
        break;
      // Add Adyen and Square cases
      default:
        throw new Error(`Unsupported payment provider: ${config.paymentProvider}`);
    }
  }

  /**
   * Create and authorize a wallet payment
   * Step 1: Validate order
   * Step 2: Create payment with provider
   * Step 3: Store payment record
   * Step 4: Create escrow hold
   */
  async createPayment(
    input: CreateWalletPaymentInput
  ): Promise<AppResult<WalletPaymentResult>> {
    const context = {
      orderId: input.orderId,
      userId: input.userId,
      walletType: input.walletType,
      operation: 'create_wallet_payment'
    };

    try {
      paymentLogger.info({ ...context, operation: 'wallet_payment_started' });

      // 1. Validate order
      const orderValidation = await this.validateOrder(input.orderId, input.userId);
      if (orderValidation.isErr()) {
        return failure(orderValidation.error);
      }
      const order = orderValidation.value;

      // 2. Process payment with provider
      const providerResult = await this.processWithProvider(input);
      if (providerResult.isErr()) {
        return failure(providerResult.error);
      }

      // 3. Store wallet payment record
      const [paymentRecord] = await db.insert(walletPayments).values({
        orderId: input.orderId,
        userId: input.userId,
        walletType: input.walletType,
        provider: config.paymentProvider!,
        providerTransactionId: providerResult.value.transactionId,
        amount: input.amount.toString(),
        currency: input.currency,
        status: 'authorized',
        deviceInfo: input.deviceInfo || {},
        escrowStatus: 'pending',
        authorizedAt: new Date(),
      }).returning();

      // 4. Update order
      await db.update(orders)
        .set({
          status: 'payment_authorized',
          walletPaymentProvider: config.paymentProvider,
          walletTransactionId: providerResult.value.transactionId,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      // 5. Create escrow event
      await db.insert(escrowEvents).values({
        orderId: input.orderId,
        walletPaymentId: paymentRecord.id,
        eventType: 'created',
        metadata: {
          amount: input.amount,
          currency: input.currency,
          walletType: input.walletType,
        },
      });

      paymentLogger.info({
        ...context,
        operation: 'wallet_payment_authorized',
        paymentId: paymentRecord.id,
        providerTransactionId: providerResult.value.transactionId,
      });

      return success({
        paymentId: paymentRecord.id,
        providerTransactionId: providerResult.value.transactionId,
        status: 'authorized',
        amount: input.amount,
        currency: input.currency,
      });

    } catch (error) {
      paymentLogger.error({
        ...context,
        operation: 'wallet_payment_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return failure(new PaymentError('Failed to process wallet payment'));
    }
  }

  /**
   * Capture authorized payment and move to escrow
   */
  async captureToEscrow(paymentId: string): Promise<AppResult<void>> {
    // Implementation for capturing authorized payment
    // This creates the actual hold on funds
  }

  /**
   * Release escrow funds to seller
   */
  async releaseEscrow(
    paymentId: string, 
    sellerStripeAccountId: string
  ): Promise<AppResult<void>> {
    // Implementation for releasing funds
    // In hybrid mode: Transfer from wallet provider to Stripe, then to seller
  }

  /**
   * Process refund
   */
  async refundPayment(
    paymentId: string, 
    amount?: number
  ): Promise<AppResult<void>> {
    // Implementation for refunds
  }

  /**
   * Validate order exists and belongs to user
   */
  private async validateOrder(
    orderId: string, 
    userId: string
  ): Promise<AppResult<any>> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return failure(new NotFoundError('Order', orderId));
    }

    if (order.buyerId !== userId) {
      return failure(new ValidationError('Order does not belong to user'));
    }

    if (order.status !== 'pending') {
      return failure(new ValidationError('Order is not in pending status'));
    }

    return success(order);
  }

  /**
   * Process payment with selected provider
   */
  private async processWithProvider(
    input: CreateWalletPaymentInput
  ): Promise<AppResult<{ transactionId: string }>> {
    switch (config.paymentProvider) {
      case 'braintree':
        return this.processBraintreePayment(input);
      case 'adyen':
        return this.processAdyenPayment(input);
      case 'square':
        return this.processSquarePayment(input);
      default:
        return failure(new PaymentError('Payment provider not configured'));
    }
  }

  /**
   * Braintree-specific payment processing
   */
  private async processBraintreePayment(
    input: CreateWalletPaymentInput
  ): Promise<AppResult<{ transactionId: string }>> {
    try {
      const saleRequest = {
        amount: input.amount.toString(),
        paymentMethodNonce: input.paymentToken,
        options: {
          submitForSettlement: false, // Don't settle yet (escrow)
        },
        customFields: {
          orderId: input.orderId,
          userId: input.userId,
        },
      };

      const result = await this.provider.transaction.sale(saleRequest);

      if (!result.success) {
        return failure(new PaymentError(result.message));
      }

      return success({ transactionId: result.transaction.id });
    } catch (error) {
      return failure(new PaymentError('Braintree payment processing failed'));
    }
  }

  // Add Adyen and Square implementations...
}
```

**4.2.2 New Routes: Wallet Payment Routes**

Create `src/routes/wallet-payments.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { WalletPaymentsService } from '../services/wallet-payments.service';

const router = Router();
const walletService = new WalletPaymentsService();

/**
 * POST /payments/wallet/create
 * Create a new wallet payment (Apple Pay or Google Pay)
 */
router.post('/wallet/create', authenticate, async (req, res) => {
  const result = await walletService.createPayment({
    orderId: req.body.orderId,
    userId: req.user!.id,
    amount: req.body.amount,
    currency: req.body.currency,
    walletType: req.body.walletType,
    paymentToken: req.body.paymentToken,
    deviceInfo: req.body.deviceInfo,
  });

  if (result.isErr()) {
    throw result.error;
  }

  res.status(201).json({
    success: true,
    data: result.value,
  });
});

/**
 * POST /payments/wallet/capture
 * Capture authorized payment to escrow
 */
router.post('/wallet/capture', authenticate, async (req, res) => {
  // Implementation
});

/**
 * POST /payments/wallet/release
 * Release escrow funds to seller
 */
router.post('/wallet/release', authenticate, async (req, res) => {
  // Implementation
});

/**
 * POST /payments/wallet/refund
 * Refund a wallet payment
 */
router.post('/wallet/refund', authenticate, async (req, res) => {
  // Implementation
});

/**
 * GET /payments/wallet/status/:paymentId
 * Get wallet payment status
 */
router.get('/wallet/status/:paymentId', authenticate, async (req, res) => {
  // Implementation
});

export default router;
```

**4.2.3 Escrow Integration**

Update escrow service to work with wallet payments:

Create `src/services/wallet-escrow.service.ts`:

```typescript
/**
 * Wallet Escrow Service
 * Manages escrow lifecycle for wallet payments
 * Handles fund transfers between wallet provider and Stripe
 */

export class WalletEscrowService {
  /**
   * Create escrow hold on wallet payment
   */
  async createEscrowHold(paymentId: string): Promise<AppResult<void>> {
    // Implementation
  }

  /**
   * Release funds to seller
   * In hybrid mode:
   * 1. Capture from Braintree/Adyen
   * 2. Transfer to Stripe
   * 3. Transfer to seller's Connect account
   */
  async releaseToSeller(
    paymentId: string, 
    sellerId: string
  ): Promise<AppResult<void>> {
    // Implementation
  }

  /**
   * Handle dispute
   */
  async handleDispute(paymentId: string): Promise<AppResult<void>> {
    // Implementation
  }
}
```

### 4.3 Phase 3: Mobile Implementation (Week 3-4)

**4.3.1 iOS Configuration**

Update `ios/BarterDash/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.yourcompany.barterdash</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>barterdash</string>
    </array>
  </dict>
</array>

<key>NSAppleMusicUsageDescription</key>
<string>This app requires Apple Pay to process payments securely.</string>

<key>PKPaymentMerchantIdentifier</key>
<string>merchant.com.yourcompany.barterdash</string>

<key>PKPaymentSupportedNetworks</key>
<array>
  <string>Visa</string>
  <string>MasterCard</string>
  <string>Amex</string>
  <string>Discover</string>
</array>
```

**4.3.2 Android Configuration**

Update `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-wallet:19.2.0'
    implementation 'com.braintreepayments.api:google-payment:4.0.0'
}
```

**4.3.3 New Mobile Components**

**Apple Pay Button Component**:

Create `components/payment/ApplePayButton.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { PKPaymentRequest, PKPaymentAuthorizationViewController } from 'react-native-passkit';
import { paymentsService } from '../../lib/api/services/payments';
import { Button } from '../ui/Button';

interface ApplePayButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  orderId,
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkApplePayAvailability();
  }, []);

  const checkApplePayAvailability = async () => {
    if (Platform.OS !== 'ios') return;
    
    try {
      const available = await PKPaymentRequest.canMakePayments();
      setIsAvailable(available);
    } catch (error) {
      console.error('Apple Pay availability check failed:', error);
    }
  };

  const handleApplePay = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Apple Pay Not Available',
        'Please set up Apple Pay in your device settings.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment request
      const paymentRequest = new PKPaymentRequest({
        merchantIdentifier: 'merchant.com.yourcompany.barterdash',
        supportedNetworks: ['Visa', 'MasterCard', 'Amex', 'Discover'],
        merchantCapabilities: ['3DS', 'debit', 'credit'],
        countryCode: 'US',
        currencyCode: currency.toUpperCase(),
        paymentSummaryItems: [
          {
            label: 'BarterDash Order',
            amount: amount.toFixed(2),
          },
        ],
      });

      // Present payment authorization
      const paymentResult = await PKPaymentAuthorizationViewController.present(
        paymentRequest
      );

      if (paymentResult.status === 'success') {
        // Send payment token to backend
        const result = await paymentsService.createWalletPayment({
          orderId,
          amount,
          currency,
          walletType: 'apple_pay',
          paymentToken: paymentResult.paymentData,
          deviceInfo: {
            deviceType: 'iOS',
            osVersion: Platform.Version.toString(),
            appVersion: '1.0.0',
          },
        });

        onSuccess(result);
      } else {
        onError({ message: 'Payment was cancelled or failed' });
      }
    } catch (error) {
      console.error('Apple Pay error:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAvailable) return null;

  return (
    <Button
      label={isProcessing ? 'Processing...' : `Pay with Apple Pay`}
      onPress={handleApplePay}
      loading={isProcessing}
      variant="primary"
      style={{
        backgroundColor: '#000000',
        // Apple Pay button styling
      }}
    />
  );
};
```

**Google Pay Button Component**:

Create `components/payment/GooglePayButton.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { GooglePay } from 'react-native-google-pay';
import { paymentsService } from '../../lib/api/services/payments';
import { Button } from '../ui/Button';

interface GooglePayButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  orderId,
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkGooglePayAvailability();
  }, []);

  const checkGooglePayAvailability = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const allowed = await GooglePay.setEnvironment(GooglePay.Environment.TEST);
      const available = await GooglePay.isReadyToPay({
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
          },
        }],
      });
      setIsAvailable(available);
    } catch (error) {
      console.error('Google Pay availability check failed:', error);
    }
  };

  const handleGooglePay = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Google Pay Not Available',
        'Please set up Google Pay in your device settings.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: {
          merchantId: 'your-google-merchant-id',
          merchantName: 'BarterDash',
        },
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'braintree', // or 'adyen', 'square'
              gatewayMerchantId: 'your-gateway-merchant-id',
            },
          },
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toFixed(2),
          currencyCode: currency.toUpperCase(),
          countryCode: 'US',
        },
      };

      const paymentData = await GooglePay.requestPayment(paymentDataRequest);

      // Send payment token to backend
      const result = await paymentsService.createWalletPayment({
        orderId,
        amount,
        currency,
        walletType: 'google_pay',
        paymentToken: paymentData.paymentMethodData.tokenizationData.token,
        deviceInfo: {
          deviceType: 'Android',
          osVersion: Platform.Version.toString(),
          appVersion: '1.0.0',
        },
      });

      onSuccess(result);
    } catch (error) {
      console.error('Google Pay error:', error);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAvailable) return null;

  return (
    <Button
      label={isProcessing ? 'Processing...' : `Pay with Google Pay`}
      onPress={handleGooglePay}
      loading={isProcessing}
      variant="primary"
      style={{
        backgroundColor: '#000000',
        // Google Pay button styling
      }}
    />
  );
};
```

**Unified Wallet Payment Component**:

Create `components/payment/WalletPayment.tsx`:

```typescript
import React from 'react';
import { View, Platform } from 'react-native';
import { ApplePayButton } from './ApplePayButton';
import { GooglePayButton } from './GooglePayButton';

interface WalletPaymentProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}

export const WalletPayment: React.FC<WalletPaymentProps> = (props) => {
  return (
    <View style={{ gap: 12 }}>
      {Platform.OS === 'ios' && (
        <ApplePayButton {...props} />
      )}
      {Platform.OS === 'android' && (
        <GooglePayButton {...props} />
      )}
    </View>
  );
};
```

**Update EnhancedCheckout Component**:

Modify `components/payment/EnhancedCheckout.tsx` to include wallet payments:

```typescript
// Add imports
import { WalletPayment } from './WalletPayment';

// Inside component, add wallet payment section before card options
const renderWalletPaymentSection = () => {
  if (processingState.isProcessing) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <Card>
        <CardHeader>
          <CardTitle style={{ color: COLORS.textPrimary, fontSize: 16 }}>
            Pay with Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WalletPayment
            orderId={orderSummary.orderId}
            amount={orderSummary.total}
            currency={orderSummary.currency}
            onSuccess={handleWalletPaymentSuccess}
            onError={handleWalletPaymentError}
          />
        </CardContent>
      </Card>

      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginVertical: 20 
      }}>
        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.darkBorder }} />
        <Text style={{ 
          color: COLORS.textSecondary, 
          marginHorizontal: 10,
          fontSize: 12 
        }}>
          OR
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: COLORS.darkBorder }} />
      </View>
    </View>
  );
};

// Add handlers
const handleWalletPaymentSuccess = (result: any) => {
  updateStatus({ 
    stage: 'succeeded', 
    message: 'Wallet payment successful!' 
  });
  completeProcessing(true);
  onSuccess({
    paymentIntentId: result.providerTransactionId,
    status: 'succeeded',
  });
};

const handleWalletPaymentError = (error: any) => {
  updateStatus({
    stage: 'failed',
    message: error.message || 'Wallet payment failed',
    error: {
      code: 'wallet_payment_failed',
      message: error.message,
      type: 'api_error',
    },
  });
};

// Update render to include wallet section
// Add {renderWalletPaymentSection()} before payment method selection
```

### 4.4 Phase 4: Testing (Week 5)

**4.4.1 Backend Testing**

Create test file: `src/services/wallet-payments.service.spec.ts`

```typescript
describe('WalletPaymentsService', () => {
  describe('createPayment', () => {
    it('should create Apple Pay payment successfully', async () => {
      // Test implementation
    });

    it('should create Google Pay payment successfully', async () => {
      // Test implementation
    });

    it('should handle invalid order', async () => {
      // Test implementation
    });

    it('should handle provider errors', async () => {
      // Test implementation
    });
  });

  describe('captureToEscrow', () => {
    it('should capture authorized payment', async () => {
      // Test implementation
    });
  });

  describe('releaseEscrow', () => {
    it('should release funds to seller', async () => {
      // Test implementation
    });
  });
});
```

**4.4.2 Mobile Testing**

Create test file: `components/payment/__tests__/WalletPayment.test.tsx`

```typescript
describe('WalletPayment', () => {
  it('should render Apple Pay button on iOS', () => {
    // Test implementation
  });

  it('should render Google Pay button on Android', () => {
    // Test implementation
  });

  it('should handle successful payment', async () => {
    // Test implementation
  });

  it('should handle payment failure', async () => {
    // Test implementation
  });
});
```

**4.4.3 Integration Testing Checklist**

**iOS Testing:**
- [ ] Apple Pay button appears on supported devices
- [ ] Payment sheet displays correctly
- [ ] Touch ID / Face ID authentication works
- [ ] Payment succeeds with test cards
- [ ] Payment fails gracefully with insufficient funds
- [ ] Cancel button works correctly
- [ ] Double-charge prevention works
- [ ] Background app behavior during payment
- [ ] Network failure handling

**Android Testing:**
- [ ] Google Pay button appears on supported devices
- [ ] Payment sheet displays correctly
- [ ] Fingerprint/PIN authentication works
- [ ] Payment succeeds with test cards
- [ ] Payment fails gracefully with insufficient funds
- [ ] Cancel button works correctly
- [ ] Double-charge prevention works
- [ ] Background app behavior during payment
- [ ] Network failure handling

**Backend Testing:**
- [ ] Payment authorization succeeds
- [ ] Escrow hold is created
- [ ] Funds transfer to Stripe works
- [ ] Seller payout works
- [ ] Refund processing works
- [ ] Webhook handling works
- [ ] Error handling works
- [ ] Idempotency keys work
- [ ] Duplicate payment prevention works

**End-to-End Testing:**
- [ ] Complete purchase flow with Apple Pay
- [ ] Complete purchase flow with Google Pay
- [ ] Escrow release flow
- [ ] Refund flow
- [ ] Dispute handling flow

### 4.5 Phase 5: Deployment (Week 6)

**4.5.1 Pre-Deployment Checklist**

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Support team trained

**4.5.2 Deployment Steps**

**Step 1: Database Migration**
```bash
# Run migration on production database
npm run db:migrate
```

**Step 2: Backend Deployment**
```bash
# Deploy backend with new wallet payment service
# Ensure environment variables are set
# Deploy to staging first
# Deploy to production
```

**Step 3: Mobile App Submission**

**iOS:**
- Build release version
- Create App Store Connect record
- Upload build
- Submit for review (mention Apple Pay integration)
- Wait for approval

**Android:**
- Build release version
- Upload to Google Play Console
- Submit for review
- Wait for approval

**Step 4: Gradual Rollout**

**Week 6:** 10% rollout
- Monitor error rates
- Monitor conversion rates
- Collect user feedback
- Check for unexpected issues

**Week 7:** 50% rollout
- Compare metrics with Stripe
- Address any issues
- Optimize based on feedback

**Week 8:** 100% rollout
- Full deployment
- Monitor closely for 48 hours
- Celebrate success!

**4.5.3 Monitoring & Alerting**

Set up monitoring for:
- Payment success rate (target: >95%)
- Average payment completion time (target: <10 seconds)
- Error rates by payment type
- Escrow release success rate
- Refund processing time
- Customer support tickets

**Alert Thresholds:**
- Payment success rate drops below 90%
- Error rate exceeds 5%
- Escrow release failures
- Unusual refund patterns

---

## 5. Technical Implementation

### 5.1 File Structure

```
barterdash-backend/
├── src/
│   ├── services/
│   │   ├── wallet-payments.service.ts       # NEW
│   │   ├── wallet-escrow.service.ts         # NEW
│   │   └── payments.service.ts              # MODIFY
│   ├── routes/
│   │   ├── wallet-payments.routes.ts        # NEW
│   │   └── payments.routes.ts               # MODIFY
│   ├── schemas/
│   │   └── wallet-payments.schemas.ts       # NEW
│   └── config/
│       └── index.ts                         # MODIFY
├── supabase/
│   └── migrations/
│       └── 20260208000000_wallet_payment_migration.sql  # NEW

barterdash-mobile/
├── components/
│   └── payment/
│       ├── ApplePayButton.tsx               # NEW
│       ├── GooglePayButton.tsx              # NEW
│       ├── WalletPayment.tsx                # NEW
│       ├── EnhancedCheckout.tsx             # MODIFY
│       └── index.ts                         # MODIFY
├── lib/
│   └── api/
│       └── services/
│           └── payments.ts                  # MODIFY
└── hooks/
    └── useWalletPayments.ts                 # NEW
```

### 5.2 Dependencies

**Backend Dependencies:**
```json
{
  "dependencies": {
    "braintree": "^3.0.0",
    "adyen-node-api-library": "^12.0.0",
    "square": "^25.0.0"
  }
}
```

**Mobile Dependencies:**
```json
{
  "dependencies": {
    "react-native-passkit": "^1.0.0",
    "react-native-google-pay": "^1.0.0",
    "@stripe/stripe-react-native": "^0.58.0"  // Keep for fallback
  }
}
```

### 5.3 Configuration Files

**app.json** (Expo configuration):
```json
{
  "expo": {
    "ios": {
      "merchantIdentifier": ["merchant.com.yourcompany.barterdash"]
    },
    "android": {
      "permissions": [
        "com.google.android.gms.permission.PAYMENT_BROADCAST"
      ]
    }
  }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Testing

**Backend:**
- Wallet payment service methods
- Escrow integration
- Error handling
- Provider-specific logic

**Mobile:**
- Component rendering
- User interactions
- State management
- API integration

### 6.2 Integration Testing

**Test Scenarios:**
1. Successful Apple Pay purchase
2. Successful Google Pay purchase
3. Failed payment (insufficient funds)
4. Cancelled payment
5. Network timeout
6. Duplicate payment prevention
7. Escrow lifecycle
8. Refund processing

### 6.3 User Acceptance Testing

**Test Group:** 20-50 beta users

**Scenarios:**
- First-time wallet setup
- Repeat purchases
- Different card types
- International transactions
- Edge cases (low battery, poor network, etc.)

### 6.4 Load Testing

**Test Scenarios:**
- 100 concurrent payments
- 1000 payments per minute
- Escrow release under load
- Database performance

---

## 7. Deployment Plan

### 7.1 Deployment Phases

**Phase 1: Infrastructure (Week 1)**
- Database migration
- Environment setup
- Provider configuration

**Phase 2: Backend (Week 2)**
- Deploy new services
- Configure monitoring
- Test webhooks

**Phase 3: Mobile Staging (Week 3)**
- Deploy to TestFlight (iOS)
- Deploy to Internal Testing (Android)
- QA testing

**Phase 4: Production Rollout (Week 4-6)**
- 10% → 50% → 100% rollout
- Monitor metrics
- Address issues

### 7.2 Rollback Plan

**If issues occur:**
1. Immediately disable wallet payments in backend config
2. Redirect to existing Stripe card flow
3. Notify users of temporary issue
4. Fix issues in staging
5. Re-deploy when ready

**Rollback Time:** <5 minutes

---

## 8. Risk Assessment

### 8.1 High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apple/Google reject app | Medium | High | Submit early, follow guidelines exactly |
| Payment failures spike | Low | High | Keep Stripe as fallback, gradual rollout |
| Seller payout issues | Low | High | Test thoroughly, hybrid approach |
| Data migration errors | Low | High | Backup database, test migration |
| Escrow integration fails | Medium | High | Extensive testing, gradual rollout |

### 8.2 Medium-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User confusion | Medium | Medium | Clear UI, onboarding flow |
| Performance issues | Low | Medium | Load testing, monitoring |
| Provider API changes | Low | Medium | Abstraction layer, provider flexibility |
| Compliance issues | Low | Medium | Legal review, compliance audit |

### 8.3 Low-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Minor UI bugs | High | Low | UI testing, quick fixes |
| Documentation gaps | Medium | Low | Documentation review |
| Developer learning curve | Medium | Low | Training, pair programming |

---

## 9. Rollback Plan

### 9.1 Immediate Rollback (< 1 hour)

**Trigger:** Critical payment failures, security breach, app store rejection

**Steps:**
1. Disable wallet payment endpoints
2. Update mobile app config to hide wallet buttons
3. Force app update if needed
4. Notify users
5. Investigate and fix

### 9.2 Short-Term Rollback (< 24 hours)

**Trigger:** High error rates, conversion drop, user complaints

**Steps:**
1. Reduce rollout to 0%
2. Analyze logs and metrics
3. Fix issues in staging
4. Re-test thoroughly
5. Re-deploy

### 9.3 Long-Term Rollback (1-7 days)

**Trigger:** Systemic issues, compliance problems, business decision

**Steps:**
1. Complete rollback to Stripe-only
2. Migrate any pending wallet payments
3. Update documentation
4. Post-mortem analysis
5. Plan alternative approach

---

## 10. Post-Migration Tasks

### 10.1 Immediate (Week 1 after rollout)

- [ ] Monitor payment metrics daily
- [ ] Address user feedback
- [ ] Fix any critical bugs
- [ ] Optimize performance
- [ ] Update documentation

### 10.2 Short-term (Weeks 2-4)

- [ ] A/B test UI variations
- [ ] Optimize conversion funnel
- [ ] Enhance error messaging
- [ ] Add analytics events
- [ ] Train support team

### 10.3 Long-term (Months 2-6)

- [ ] Add more wallet providers (Samsung Pay, etc.)
- [ ] Implement subscription support
- [ ] Add loyalty program integration
- [ ] Optimize for international markets
- [ ] Consider additional payment methods

### 10.4 Deprecation of Stripe Buyer Payments (Optional)

**Timeline:** 3-6 months after successful wallet migration

**Steps:**
1. Monitor wallet adoption rate (target: >90%)
2. Notify users of upcoming changes
3. Gradually remove card payment options
4. Keep Stripe for seller payouts
5. Archive old payment code

---

## Appendix A: Provider Comparison Matrix

| Feature | Braintree | Adyen | Square | Stripe (Current) |
|---------|-----------|-------|--------|------------------|
| **Apple Pay** | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Google Pay** | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Setup Complexity** | Easy | Complex | Easy | Easy |
| **Pricing** | 2.9% + $0.30 | Custom | 2.9% + $0.30 | 2.9% + $0.30 |
| **Seller Payouts** | PayPal | Complex | ✅ | ✅ (Connect) |
| **Escrow Support** | Manual | Advanced | Manual | Manual |
| **International** | Limited | ✅ Excellent | Limited | ✅ Good |
| **Documentation** | ✅ Good | ✅ Good | ✅ Good | ✅ Excellent |
| **API Quality** | ✅ Good | ✅ Good | ✅ Good | ✅ Excellent |
| **Sandbox** | ✅ | ✅ | ✅ | ✅ |

**Recommendation**: **Braintree** for simpler migration with PayPal ecosystem, **Adyen** for enterprise international needs.

---

## Appendix B: Cost Analysis

### Implementation Costs

| Item | Cost | Notes |
|------|------|-------|
| Development Time | $50,000-$80,000 | 6-8 weeks, 2-3 developers |
| Payment Provider Setup | $0-$5,000 | Varies by provider |
| Apple Developer Program | $99/year | Required for Apple Pay |
| Google Play Developer | $25 one-time | Required for Google Pay |
| Testing Devices | $2,000-$5,000 | Physical iOS/Android devices |
| Security Audit | $5,000-$15,000 | Recommended |
| Legal/Compliance Review | $3,000-$10,000 | Contract review, compliance |
| **Total** | **$60,124-$115,124** | One-time + annual |

### Ongoing Costs

| Item | Monthly Cost | Notes |
|------|--------------|-------|
| Payment Processing Fees | 2.9% + $0.30/transaction | Similar to Stripe |
| Infrastructure | $500-$2,000 | Servers, monitoring |
| Support | $1,000-$3,000 | Additional payment support |
| **Total** | **$1,500-$5,000/month** | Plus transaction fees |

### ROI Analysis

**Benefits:**
- Improved conversion rates (estimated 10-20% increase)
- Better user experience
- Reduced fraud (device authentication)
- Apple App Store approval
- Competitive advantage

**Break-even:** ~3-6 months with increased conversion

---

## Appendix C: Compliance Checklist

### PCI DSS Requirements

- [ ] Use provider's tokenization (PCI SAQ A eligible)
- [ ] Never store raw card data
- [ ] Secure API endpoints
- [ ] Regular security audits
- [ ] Incident response plan

### Apple Pay Requirements

- [ ] Valid Apple Developer account
- [ ] HTTPS for all payment endpoints
- [ ] Privacy policy disclosure
- [ ] Terms of service compliance
- [ ] No Stripe branding in Apple Pay flow

### Google Pay Requirements

- [ ] Google Pay API terms acceptance
- [ ] HTTPS for all endpoints
- [ ] Privacy policy disclosure
- [ ] Branding guidelines compliance
- [ ] Test environment passing

### Regional Compliance

- [ ] GDPR (EU) - Data processing agreements
- [ ] CCPA (California) - Privacy disclosures
- [ ] PSD2 (EU) - Strong Customer Authentication
- [ ] Local tax reporting requirements

---

## Appendix D: Support Documentation

### User Documentation Topics

1. How to set up Apple Pay
2. How to set up Google Pay
3. Troubleshooting payment failures
4. Understanding escrow
5. Refund process
6. Dispute resolution

### Support Team Training

1. Wallet payment flow overview
2. Common issues and solutions
3. Escrow troubleshooting
4. When to escalate to engineering
5. Refund processing procedures

---

## Conclusion

This migration is a significant undertaking that requires careful planning, thorough testing, and gradual rollout. The hybrid architecture (Option B) is recommended to minimize risk while achieving the goal of native wallet payments.

**Key Success Factors:**
1. Thorough testing on physical devices
2. Gradual rollout with monitoring
3. Clear rollback plan
4. Excellent user communication
5. Post-launch optimization

**Next Steps:**
1. Answer the critical questions in Section 2
2. Select payment provider
3. Set up sandbox environments
4. Begin Phase 1 implementation

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-08  
**Author**: Development Team  
**Reviewers**: [To be added]
