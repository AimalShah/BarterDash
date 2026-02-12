# BarterDash Deliverable Checklist

## Snapshot (2026-02-12)
Frontend and backend are largely implemented. Critical purchase flow bugs have been fixed. This checklist marks what is done vs not done and calls out known incomplete areas with file references.

## Frontend (barterdash-mobile)
- [x] Auth screens and Supabase auth store (`barterdash-mobile/app/(auth)`, `barterdash-mobile/store/authStore.ts`)
- [x] Onboarding flow and guard (`barterdash-mobile/app/(onboarding)`, `barterdash-mobile/components/guards/OnboardingGuard.tsx`)
- [x] Home feed with stream list and realtime refresh (`barterdash-mobile/app/(tabs)/index.tsx`)
- [x] Search and category filters (`barterdash-mobile/app/(tabs)/search.tsx`, `barterdash-mobile/lib/api/services/categories.ts`)
- [x] Cart and checkout flow with Stripe Payment Sheet (`barterdash-mobile/app/(tabs)/cart.tsx`, `barterdash-mobile/app/(tabs)/checkout.tsx`, `barterdash-mobile/app/checkout/cart.tsx`, `barterdash-mobile/lib/api/services/cart.ts`, `barterdash-mobile/lib/api/services/payments.ts`)
- [x] Seller dashboard, streams, auctions, inventory screens (`barterdash-mobile/app/seller`)
- [x] Stream viewer and seller experiences (`barterdash-mobile/app/stream/[id].tsx`, `barterdash-mobile/components/stream`)
- [x] Messaging screens and API wiring (`barterdash-mobile/app/messages`, `barterdash-mobile/lib/api/services/messages.ts`)
- [x] Notifications screens and API wiring (`barterdash-mobile/app/notifications.tsx`, `barterdash-mobile/lib/api/services/notifications.ts`)
- [x] Social followers/following screens (`barterdash-mobile/app/social`)
- [x] Add to Bag handler (`barterdash-mobile/app/product/[id].tsx`)
- [x] Buy Now button for marketplace products (`barterdash-mobile/app/product/[id].tsx`)
- [x] Auction buyout UI (`barterdash-mobile/app/product/[id].tsx`)

- [ ] Stream edit image upload to storage is TODO (`barterdash-mobile/app/seller/stream/edit/[id].tsx`)
- [ ] Payment method manager falls back to mock data and uses stub auth flow (`barterdash-mobile/components/payment/PaymentMethodManager.tsx`)
- [x] Payment sheet endpoint aligned with backend (`barterdash-mobile/lib/api/services/payments.ts`, `barterdash-backend/src/routes/payments.routes.ts`)
- [ ] Realtime payment status updates not implemented (`barterdash-mobile/hooks/usePaymentProcessing.ts`)
- [ ] Seller order label shows dummy PDF (backend mock label) (`barterdash-mobile/app/seller/order/[id].tsx`)
- [ ] Demo-only payment screen should be removed for production (`barterdash-mobile/app/payment-demo.tsx`)

## Backend (barterdash-backend)
- [x] Core API routing and health check (`barterdash-backend/src/routes/index.ts`)
- [x] Auth sync, me, forgot/reset password (`barterdash-backend/src/routes/auth.routes.ts`)
- [x] Users, sellers, seller applications, Stripe connect (`barterdash-backend/src/routes/users.routes.ts`, `barterdash-backend/src/routes/sellers.routes.ts`, `barterdash-backend/src/routes/seller-applications.routes.ts`, `barterdash-backend/src/routes/stripe-connect.routes.ts`)
- [x] Categories, products, auctions, bids (`barterdash-backend/src/routes/categories.routes.ts`, `barterdash-backend/src/routes/products.routes.ts`, `barterdash-backend/src/routes/auctions.routes.ts`, `barterdash-backend/src/routes/bids.routes.ts`)
- [x] Streams and stream products (`barterdash-backend/src/routes/streams.routes.ts`)
- [x] Orders, cart, payments, escrow (`barterdash-backend/src/routes/orders.routes.ts`, `barterdash-backend/src/routes/cart.routes.ts`, `barterdash-backend/src/routes/payments.routes.ts`, `barterdash-backend/src/routes/escrow.routes.ts`)
- [x] Messaging, notifications, reviews, feed, analytics (`barterdash-backend/src/routes/messages.routes.ts`, `barterdash-backend/src/routes/notifications.routes.ts`, `barterdash-backend/src/routes/reviews.routes.ts`, `barterdash-backend/src/routes/feed.routes.ts`, `barterdash-backend/src/routes/analytics.routes.ts`)
- [x] Social features (`barterdash-backend/src/routes/social.routes.ts`)
- [x] Direct buy endpoint POST /products/:id/buy (`barterdash-backend/src/routes/products.routes.ts`)
- [x] Stream cancel endpoint DELETE /streams/:id (`barterdash-backend/src/routes/streams.routes.ts`)
- [x] Auction extension endpoint POST /auctions/:id/extend (`barterdash-backend/src/routes/auctions.routes.ts`)
- [x] Reports API routes (`barterdash-backend/src/routes/reports.routes.ts`)
- [x] Refunds API routes (`barterdash-backend/src/routes/refunds.routes.ts`)
- [x] Watchlist API routes (`barterdash-backend/src/routes/watchlist.routes.ts`)

- [ ] Auth logout is a placeholder (no token invalidation) (`barterdash-backend/src/routes/auth.routes.ts`, `barterdash-backend/src/services/auth.service.ts`)
- [ ] Shipping label generation uses a mock provider (`barterdash-backend/src/services/shipping.service.ts`)
- [ ] Backend README files still mark users/bids/payments/sellers as TODO (docs outdated) (`barterdash-backend/README.md`, `barterdash-backend/README-EXPRESS.md`)

## Cleanup
- [x] Removed generated artifacts and caches: `barterdash-backend/dist`, `barterdash-backend/tsconfig.build.tsbuildinfo`, `barterdash-backend/verification_output.txt`, `barterdash-backend/verification_output_2.txt`, `barterdash-backend/node_modules`, `barterdash-mobile/node_modules`
