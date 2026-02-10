# 🎯 BarterDash Backend Completion Plan

Based on your progress report, here's a strategic roadmap to reach 100% core backend completion.

---

## 🚦 Phase 1: Foundation & Security (Week 1)
**Goal**: Lock down auth and data access before building new features

### 1.1 Profile Auto-Creation (Day 1-2)
```sql
-- Create Supabase trigger for Google/social sign-ins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 Row Level Security (Day 2-3)
Create migration: `src/migrations/xxx-add-rls-policies.ts`

**Critical policies**:
- Users can only read/update their own profile
- Users can only see their own bids
- Sellers can only edit their own auctions
- Everyone can read live auctions

```sql
-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Bid policies
CREATE POLICY "Users can view own bids"
  ON bids FOR SELECT
  USING (auth.uid() = bidder_id);

CREATE POLICY "Sellers can view bids on their auctions"
  ON bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auctions
      WHERE auctions.id = bids.auction_id
      AND auctions.seller_id = auth.uid()
    )
  );

-- Auction policies
CREATE POLICY "Everyone can view live auctions"
  ON auctions FOR SELECT
  USING (status = 'live');

CREATE POLICY "Sellers can manage own auctions"
  ON auctions FOR ALL
  USING (auth.uid() = seller_id);
```

### 1.3 Auth Enhancements (Day 3-4)
Add to `auth.controller.ts`:
- Password reset flow (`/forgot-password`, `/reset-password`)
- Email verification reminder
- Social login endpoints (Google, Apple OAuth)

```typescript
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.sendPasswordResetEmail(dto.email);
}

@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}

@Get('google')
async googleLogin() {
  // Redirect to Google OAuth
}

@Get('google/callback')
async googleCallback(@Query('code') code: string) {
  return this.authService.handleGoogleCallback(code);
}
```

---

## 📦 Phase 2: File Storage (Week 1-2)
**Goal**: Handle image uploads properly

### 2.1 Supabase Storage Setup (Day 5)
- Create `auction-images` bucket in Supabase dashboard
- Set bucket policies (public read, authenticated write)
- Configure allowed MIME types (JPEG, PNG, WebP)

```sql
-- Storage policies
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'auction-images');

CREATE POLICY "Anyone can view auction images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'auction-images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'auction-images' AND auth.uid()::text = owner);
```

### 2.2 Upload Service (Day 5-6)
Create `src/modules/storage/storage.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private supabase;
  private bucketName = 'auction-images';

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_SERVICE_KEY')
    );
  }

  async uploadAuctionImage(
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    // 1. Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // 2. Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    // 3. Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // 4. Return public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async deleteAuctionImage(url: string): Promise<void> {
    // Extract path from URL
    const path = url.split(`${this.bucketName}/`)[1];

    if (!path) {
      throw new BadRequestException('Invalid image URL');
    }

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  async deleteMultipleImages(urls: string[]): Promise<void> {
    const paths = urls.map(url => url.split(`${this.bucketName}/`)[1]);
    
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove(paths);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }
}
```

### 2.3 Upload Endpoint (Day 6)
Add to `auctions.controller.ts`:

```typescript
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UploadedFiles } from '@nestjs/common';

@Post('upload-image')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('image'))
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: any
) {
  const url = await this.storageService.uploadAuctionImage(user.id, file);
  return { url };
}

@Post('upload-images')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
async uploadImages(
  @UploadedFiles() files: Express.Multer.File[],
  @CurrentUser() user: any
) {
  const urls = await Promise.all(
    files.map(file => this.storageService.uploadAuctionImage(user.id, file))
  );
  return { urls };
}

@Delete('delete-image')
@UseGuards(JwtAuthGuard)
async deleteImage(@Body() dto: { url: string }) {
  await this.storageService.deleteAuctionImage(dto.url);
  return { message: 'Image deleted successfully' };
}
```

---

## 💰 Phase 3: Payment Completion (Week 2)
**Goal**: Handle the full payment lifecycle

### 3.1 Stripe Connect Onboarding (Day 7-8)
Create `src/modules/payments/stripe-connect.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConnectService {
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16'
    });
  }

  // Seller onboarding: Create connected accounts
  async createConnectedAccount(userId: string, email: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      metadata: { userId }
    });

    // Save account.id to seller profile
    return account;
  }

  // Generate onboarding link
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink.url;
  }

  // Check verification status
  async getAccountStatus(accountId: string) {
    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    };
  }

  // Create login link for seller dashboard
  async createLoginLink(accountId: string) {
    const loginLink = await this.stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  }
}
```

Add endpoints to `sellers.controller.ts`:

```typescript
@Post('stripe/onboard')
@UseGuards(JwtAuthGuard, SellerGuard)
async startStripeOnboarding(@CurrentUser() user: any) {
  const account = await this.stripeConnectService.createConnectedAccount(
    user.id,
    user.email
  );

  const onboardingUrl = await this.stripeConnectService.createAccountLink(
    account.id,
    `${process.env.FRONTEND_URL}/seller/onboarding/complete`,
    `${process.env.FRONTEND_URL}/seller/onboarding/refresh`
  );

  // Save account.id to seller profile
  await this.sellersService.updateStripeAccount(user.id, account.id);

  return { url: onboardingUrl };
}

@Get('stripe/status')
@UseGuards(JwtAuthGuard, SellerGuard)
async getStripeStatus(@CurrentUser() user: any) {
  const seller = await this.sellersService.findOne(user.id);
  
  if (!seller.stripeAccountId) {
    return { status: 'not_connected' };
  }

  return this.stripeConnectService.getAccountStatus(seller.stripeAccountId);
}

@Get('stripe/dashboard')
@UseGuards(JwtAuthGuard, SellerGuard)
async getStripeDashboard(@CurrentUser() user: any) {
  const seller = await this.sellersService.findOne(user.id);
  const url = await this.stripeConnectService.createLoginLink(seller.stripeAccountId);
  return { url };
}
```

### 3.2 Payout Logic (Day 8-9)
Enhance `src/modules/auctions/processors/auction-end.processor.ts`:

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Processor('auctions')
@Injectable()
export class AuctionEndProcessor {
  private logger = new Logger(AuctionEndProcessor.name);
  private stripe: Stripe;

  constructor(
    private auctionsService: AuctionsService,
    private bidsService: BidsService,
    private sellersService: SellersService,
    private notificationsService: NotificationsService,
    private config: ConfigService
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16'
    });
  }

  @Process('end-auction')
  async handleAuctionEnd(job: Job) {
    const { auctionId } = job.data;
    this.logger.log(`Processing end of auction ${auctionId}`);

    try {
      // 1. Get auction with winning bid
      const auction = await this.auctionsService.findOneWithWinningBid(auctionId);

      if (!auction.winningBid) {
        // No bids - mark as ended
        await this.auctionsService.updateStatus(auctionId, 'ended');
        await this.notificationsService.notifySeller(
          auction.sellerId,
          'Auction ended with no bids',
          auction.id
        );
        return;
      }

      // 2. Get seller's Stripe account
      const seller = await this.sellersService.findOne(auction.sellerId);

      if (!seller.stripeAccountId) {
        throw new Error('Seller has no connected Stripe account');
      }

      // 3. Calculate platform fee (5%)
      const platformFeePercent = 0.05;
      const totalAmount = auction.winningBid.amount;
      const platformFee = Math.round(totalAmount * platformFeePercent);
      const sellerAmount = totalAmount - platformFee;

      // 4. Capture the payment intent
      const paymentIntent = await this.stripe.paymentIntents.capture(
        auction.winningBid.paymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment capture failed');
      }

      // 5. Transfer to seller's connected account
      const transfer = await this.stripe.transfers.create({
        amount: sellerAmount,
        currency: 'usd',
        destination: seller.stripeAccountId,
        transfer_group: `auction_${auctionId}`,
        metadata: {
          auctionId,
          bidderId: auction.winningBid.bidderId
        }
      });

      // 6. Update auction status
      await this.auctionsService.update(auctionId, {
        status: 'completed',
        paymentStatus: 'paid',
        transferId: transfer.id
      });

      // 7. Send notifications
      await Promise.all([
        this.notificationsService.notifyWinner(
          auction.winningBid.bidderId,
          'Congratulations! You won the auction',
          auction.id
        ),
        this.notificationsService.notifySeller(
          auction.sellerId,
          `Auction sold! $${(sellerAmount / 100).toFixed(2)} on the way`,
          auction.id
        )
      ]);

      this.logger.log(`Successfully processed auction ${auctionId} payout`);
    } catch (error) {
      this.logger.error(`Failed to process auction ${auctionId}:`, error);
      
      // Mark auction as failed and notify admin
      await this.auctionsService.updateStatus(auctionId, 'payment_failed');
      throw error; // Bull will retry
    }
  }
}
```

### 3.3 Refund Handling (Day 9-10)
Add `refund` method to `PaymentsService`:

```typescript
async refundBid(bidId: string, reason: string) {
  const bid = await this.bidsService.findOne(bidId);

  if (!bid.paymentIntentId) {
    throw new BadRequestException('No payment to refund');
  }

  // Issue refund
  const refund = await this.stripe.refunds.create({
    payment_intent: bid.paymentIntentId,
    reason: 'requested_by_customer',
    metadata: { bidId, reason }
  });

  // Update bid status
  await this.bidsService.update(bidId, {
    status: 'refunded',
    refundId: refund.id
  });

  return refund;
}

async refundAllBidsForAuction(auctionId: string, reason: string) {
  const bids = await this.bidsService.findByAuction(auctionId);

  const refundPromises = bids
    .filter(bid => bid.paymentIntentId)
    .map(bid => this.refundBid(bid.id, reason));

  return Promise.all(refundPromises);
}
```

Add endpoint for cancellation:

```typescript
@Post(':id/cancel')
@UseGuards(JwtAuthGuard, SellerGuard)
async cancelAuction(
  @Param('id') id: string,
  @CurrentUser() user: any,
  @Body() dto: { reason: string }
) {
  const auction = await this.auctionsService.findOne(id);

  // Verify ownership
  if (auction.sellerId !== user.id) {
    throw new ForbiddenException();
  }

  // Refund all bids
  await this.paymentsService.refundAllBidsForAuction(id, dto.reason);

  // Update auction status
  await this.auctionsService.updateStatus(id, 'cancelled');

  return { message: 'Auction cancelled and all bids refunded' };
}
```

---

## 🔴 Phase 4: Real-Time Features (Week 2-3)
**Goal**: Live bid updates and auction countdown

### 4.1 Real-Time Documentation (Day 10)
Create `docs/REALTIME.md`:

```markdown
# Real-Time Integration Guide

## Frontend Setup

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Initialize Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### 3. Subscribe to Auction Bids
```typescript
const subscribeToAuctionBids = (auctionId: string, onNewBid: (bid: any) => void) => {
  const channel = supabase
    .channel(`auction-${auctionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `auction_id=eq.${auctionId}`
      },
      (payload) => {
        onNewBid(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

### 4. Subscribe to Auction Status Changes
```typescript
const subscribeToAuctionStatus = (auctionId: string, onUpdate: (auction: any) => void) => {
  const channel = supabase
    .channel(`auction-status-${auctionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

### 5. React Component Example
```typescript
import { useEffect, useState } from 'react';

function AuctionPage({ auctionId }) {
  const [currentBid, setCurrentBid] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('live');

  useEffect(() => {
    // Subscribe to new bids
    const unsubscribeBids = subscribeToAuctionBids(auctionId, (bid) => {
      setCurrentBid(bid);
      // Play sound, show animation, etc.
    });

    // Subscribe to status changes
    const unsubscribeStatus = subscribeToAuctionStatus(auctionId, (auction) => {
      setAuctionStatus(auction.status);
      if (auction.status === 'ended') {
        // Show "Auction Ended" modal
      }
    });

    return () => {
      unsubscribeBids();
      unsubscribeStatus();
    };
  }, [auctionId]);

  return (
    <div>
      <h1>Current Bid: ${currentBid?.amount / 100}</h1>
      <p>Status: {auctionStatus}</p>
    </div>
  );
}
```

## Database Triggers for Real-Time

These triggers ensure the `live_auctions` view updates automatically:

```sql
-- Trigger to update live_auctions when bid is placed
CREATE OR REPLACE FUNCTION notify_bid_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('bid_placed', json_build_object(
    'auction_id', NEW.auction_id,
    'amount', NEW.amount,
    'bidder_id', NEW.bidder_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bid_placed
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_bid_update();
```
```

### 4.2 WebSocket Gateway (Day 11-12) - OPTIONAL
If you need custom real-time logic beyond Supabase:

Create `src/modules/realtime/realtime.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  @UseGuards(WsJwtGuard)
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string }
  ) {
    client.join(`auction-${data.auctionId}`);
    this.logger.log(`Client ${client.id} joined auction ${data.auctionId}`);
    return { event: 'joined', auctionId: data.auctionId };
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string }
  ) {
    client.leave(`auction-${data.auctionId}`);
    return { event: 'left', auctionId: data.auctionId };
  }

  // Called from BidsService when new bid is placed
  emitNewBid(auctionId: string, bid: any) {
    this.server.to(`auction-${auctionId}`).emit('newBid', bid);
  }

  // Called from AuctionEndProcessor when auction ends
  emitAuctionEnded(auctionId: string, winner: any) {
    this.server.to(`auction-${auctionId}`).emit('auctionEnded', { winner });
  }
}
```

Integrate with BidsService:

```typescript
@Injectable()
export class BidsService {
  constructor(
    private realtimeGateway: RealtimeGateway // Inject gateway
  ) {}

  async placeBid(dto: PlaceBidDto, userId: string) {
    // ... existing bid logic ...

    // Emit real-time event
    this.realtimeGateway.emitNewBid(dto.auctionId, newBid);

    return newBid;
  }
}
```

---

## 🔍 Phase 5: Search & Discovery (Week 3)
**Goal**: Users can find what they need

### 5.1 Advanced Filtering (Day 13-14)
Create `src/modules/auctions/dto/auction-filters.dto.ts`:

```typescript
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  ENDING_SOON = 'ending_soon',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  NEWEST = 'newest',
  POPULAR = 'popular'
}

export class AuctionFiltersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  search?: string;
}
```

Enhance `auctions.service.ts`:

```typescript
async findAll(filters: AuctionFiltersDto) {
  const qb = this.auctionRepo
    .createQueryBuilder('auction')
    .leftJoinAndSelect('auction.seller', 'seller')
    .where('auction.status = :status', { status: 'live' });

  // Price filters
  if (filters.minPrice !== undefined) {
    qb.andWhere('auction.current_price >= :minPrice', {
      minPrice: filters.minPrice
    });
  }

  if (filters.maxPrice !== undefined) {
    qb.andWhere('auction.current_price <= :maxPrice', {
      maxPrice: filters.maxPrice
    });
  }

  // Category filter
  if (filters.category) {
    qb.andWhere('auction.category = :category', {
      category: filters.category
    });
  }

  // Search filter (if full-text search not implemented yet)
  if (filters.search) {
    qb.andWhere(
      '(auction.title ILIKE :search OR auction.description ILIKE :search)',
      { search: `%${filters.search}%` }
    );
  }

  // Sorting
  switch (filters.sortBy) {
    case SortBy.ENDING_SOON:
      qb.orderBy('auction.end_time', 'ASC');
      break;
    case SortBy.PRICE_LOW:
      qb.orderBy('auction.current_price', 'ASC');
      break;
    case SortBy.PRICE_HIGH:
      qb.orderBy('auction.current_price', 'DESC');
      break;
    case SortBy.POPULAR:
      qb.orderBy('auction.bid_count', 'DESC');
      break;
    case SortBy.NEWEST:
    default:
      qb.orderBy('auction.created_at', 'DESC');
  }

  // Pagination
  qb.skip(filters.offset).take(filters.limit);

  const [auctions, total] = await qb.getManyAndCount();

  return {
    auctions,
    total,
    page: Math.floor(filters.offset / filters.limit) + 1,
    pageSize: filters.limit,
    totalPages: Math.ceil(total / filters.limit)
  };
}
```

Update controller:

```typescript
@Get()
async findAll(@Query() filters: AuctionFiltersDto) {
  return this.auctionsService.findAll(filters);
}
```

### 5.2 Full-Text Search (Day 14-15)
Create migration for full-text search:

```sql
-- Add search vector column
ALTER TABLE auctions 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'C')
) STORED;

-- Create GIN index for fast searching
CREATE INDEX idx_auction_search ON auctions USING GIN(search_vector);

-- Create function to rank search results
CREATE OR REPLACE FUNCTION search_auctions(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    ts_rank(a.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM auctions a
  WHERE a.search_vector @@ plainto_tsquery('english', search_query)
    AND a.status = 'live'
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

Update `auctions.service.ts` to use full-text search:

```typescript
async search(query: string, limit: number = 20, offset: number = 0) {
  // Use the PostgreSQL function for ranked search
  const results = await this.auctionRepo.
