# BarterDash Full TODO List (0% -> 100%)

## Payment Flow (End-to-End) — Goal: Finish Today

### Phase 0: Preconditions (0% -> 10%)
- [ ] Confirm backend `.env` has Stripe keys, webhook secret, and Supabase keys (`barterdash-backend/.env`)
- [ ] Confirm mobile env has `EXPO_PUBLIC_API_URL` and Stripe publishable key (`barterdash-mobile/.env` or EAS secrets)
- [ ] Confirm database has payments, orders, payment_methods tables and migrations are up-to-date (`barterdash-backend/src/db/schema.ts`)

### Phase 1: Backend Core (10% -> 45%)
- [x] Align payment sheet endpoint naming (`POST /payments/payment-sheet`)
- [x] Verify `payments.service.ts` creates PaymentSheet with Stripe customer + ephemeral key
- [x] Verify `createCheckoutSession` uses valid absolute http(s) redirect URLs
- [ ] Ensure idempotency for create-intent and checkout session
- [ ] Ensure payment status updates are persisted to orders/payments tables
- [ ] Ensure webhook handler verifies signature and handles key events
- [ ] Add or validate test coverage for payments service and webhook parsing

### Phase 2: Mobile Core (45% -> 75%)
- [x] Update mobile endpoint for PaymentSheet (`/payments/payment-sheet`)
- [ ] Remove mock fallback and stub auth in `PaymentMethodManager.tsx`
- [x] Implement add payment method flow (Stripe PaymentSheet or SetupIntent)
- [x] Ensure checkout flow handles success/cancel with Payment Sheet
- [x] Add failure/cancel handling with clear user messaging
- [ ] Ensure retry logic for network errors

### Phase 3: Integration (75% -> 90%)
- [ ] Run Stripe CLI webhook forwarding to local backend
- [ ] Verify PaymentIntent and CheckoutSession flows from mobile
- [ ] Confirm order status transitions on successful payment
- [ ] Confirm payment failure surfaces correct UI errors
- [ ] Confirm duplicate submission prevention works

### Phase 4: Final Polish (90% -> 100%)
- [ ] Add analytics events for payment funnel
- [ ] Add audit logs for payment actions
- [ ] Confirm PII handling and secure logging
- [ ] Update API docs for final endpoints

### Payment Test Checklist (Run After Implementation)
- [ ] Login and open cart
- [ ] Checkout and create order
- [ ] Pay with Stripe test card (4242 4242 4242 4242)
- [ ] Verify success screen and order status updated
- [ ] Verify webhook event received and persisted
- [ ] Try failed payment card (4000 0000 0000 9995)
- [ ] Verify error handling and no duplicate order
- [ ] Try cancel flow and ensure cart/order is consistent

## All Features (0% -> 100%)

### Authentication and Onboarding
- [ ] Sign up, email verify, login, logout
- [ ] Forgot password and reset password
- [ ] Profile setup, interests, onboarding tutorial
- [ ] Role-based routing and seller gating

### User Profile
- [ ] Profile view and edit
- [ ] Avatar upload
- [ ] Seller public profile

### Seller Onboarding and Compliance
- [ ] Seller application create, upload documents, submit
- [ ] Stripe Identity verification
- [ ] Seller approval flow and status tracking

### Streams and Live Video
- [ ] Create, schedule, start, end stream
- [ ] Join as viewer, watch stream
- [ ] Chat in stream
- [ ] Stream subscriptions/notifications

### Auctions and Bidding
- [ ] Create auction
- [ ] Start auction in live stream
- [ ] Place bids and auto-bids
- [ ] End auction and create order
- [ ] Cancel/extend auction rules

### Products and Inventory
- [ ] Create, edit, delete product
- [ ] Upload product images
- [ ] Inventory list and search

### Cart, Orders, and Checkout
- [ ] Add/remove cart items
- [ ] Calculate totals and taxes
- [ ] Create order from cart
- [ ] Buyer order history
- [ ] Seller sales list

### Payments and Escrow
- [x] Payment intent and payment sheet flows
- [ ] Payment method management
- [ ] Escrow hold and release
- [ ] Refunds and disputes

### Shipping and Fulfillment
- [ ] Shipping address validation
- [ ] Shipping label generation
- [ ] Tracking updates and order status changes

### Messaging and Notifications
- [ ] Direct messages and conversations
- [ ] Read receipts and typing indicators
- [ ] Push notifications and in-app notifications

### Social and Discovery
- [ ] Follow/unfollow
- [ ] Recommendations and feed
- [ ] Search filters

### Reviews and Trust
- [ ] Leave review after order
- [ ] Report user/stream/product

### Analytics and Admin
- [ ] Seller analytics dashboard
- [ ] Admin moderation tools
- [ ] System health and logs

### QA, Security, Release
- [ ] End-to-end tests for all flows
- [ ] Performance checks and crash monitoring
- [ ] Security review and rate limiting
- [ ] Production build and release checklist
