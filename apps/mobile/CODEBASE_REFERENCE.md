# BarterDash Mobile App - Comprehensive Export Documentation

This document provides a complete reference of all functions, hooks, types, interfaces, components, and exports in the mobile app located at `/home/aimal-shah/code/BarterDash/apps/mobile`.

---

## Table of Contents
1. [App Routes](#app-routes)
2. [Hooks](#hooks)
3. [Types & Interfaces](#types--interfaces)
4. [Components](#components)
5. [API Services](#api-services)
6. [Stores (Zustand)](#stores-zustand)
7. [Context Providers](#context-providers)
8. [Constants](#constants)
9. [Utilities](#utilities)

---

## App Routes

All route files in `app/` directory.

### Auth Routes (`app/(auth)/`)

| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/(auth)/login.tsx` | Login page |
| `/register` | `app/(auth)/register.tsx` | Registration page |
| `/landing` | `app/(auth)/landing.tsx` | Landing page |
| `/forgot-password` | `app/(auth)/forgot-password.tsx` | Forgot password page |
| `/update-password` | `app/(auth)/update-password.tsx` | Update password page |
| `/verify-email` | `app/(auth)/verify-email.tsx` | Email verification page |

### Onboarding Routes (`app/(onboarding)/`)

| Route | File | Description |
|-------|------|-------------|
| `/onboarding` | `app/(onboarding)/_layout.tsx` | Onboarding layout |
| `/onboarding/age-verification` | `app/(onboarding)/age-verification.tsx` | Age verification |
| `/onboarding/interests` | `app/(onboarding)/interests.tsx` | Interests selection |
| `/onboarding/profile-setup` | `app/(onboarding)/profile-setup.tsx` | Profile setup |
| `/onboarding/notifications` | `app/(onboarding)/notifications.tsx` | Notification permissions |
| `/onboarding/success` | `app/(onboarding)/success.tsx` | Onboarding success |

### Tab Routes (`app/(tabs)/`)

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/(tabs)/index.tsx` | Home/Feed tab |
| `/categories` | `app/(tabs)/categories.tsx` | Categories tab |
| `/search` | `app/(tabs)/search.tsx` | Search tab |
| `/inbox` | `app/(tabs)/inbox.tsx` | Messages tab |
| `/cart` | `app/(tabs)/cart.tsx` | Cart tab |
| `/checkout` | `app/(tabs)/checkout.tsx` | Checkout tab |
| `/profile` | `app/(tabs)/profile.tsx` | Profile tab |
| `/my-bids` | `app/(tabs)/my-bids.tsx` | My bids tab |
| `/sell` | `app/(tabs)/sell.tsx` | Sell tab (redirects to seller) |

### Seller Routes (`app/seller/`)

| Route | File | Description |
|-------|------|-------------|
| `/seller` | `app/seller/_layout.tsx` | Seller layout |
| `/seller/dashboard` | `app/seller/dashboard.tsx` | Seller dashboard |
| `/seller/onboarding` | `app/seller/onboarding/index.tsx` | Seller onboarding |
| `/seller/register` | `app/seller/register.tsx` | Seller registration |
| `/seller/earnings` | `app/seller/earnings.tsx` | Earnings page |
| `/seller/sales` | `app/seller/sales.tsx` | Sales page |
| `/seller/inventory` | `app/seller/inventory.tsx` | Inventory page |
| `/seller/add-product` | `app/seller/add-product.tsx` | Add product page |
| `/seller/create-auction` | `app/seller/create-auction.tsx` | Create auction |
| `/seller/create-stream` | `app/seller/create-stream.tsx` | Create stream |
| `/seller/streams` | `app/seller/streams.tsx` | Streams list |
| `/seller/stream/[id]` | `app/seller/stream/[id].tsx` | Stream detail |
| `/seller/stream/edit/[id]` | `app/seller/stream/edit/[id].tsx` | Edit stream |
| `/seller/stream/add-product/[id]` | `app/seller/stream/add-product/[id].tsx` | Add product to stream |
| `/seller/go-live` | `app/seller/go-live.tsx` | Go live page |
| `/seller/orders` | `app/seller/orders.tsx` | Orders list |
| `/seller/order/[id]` | `app/seller/order/[id].tsx` | Order detail |
| `/seller/auctions` | `app/seller/auctions.tsx` | Auctions list |
| `/seller/stripe-setup` | `app/seller/stripe-setup.tsx` | Stripe setup |

### Product & Auction Routes

| Route | File | Description |
|-------|------|-------------|
| `/product/[id]` | `app/product/[id].tsx` | Product detail |
| `/auction/[id]` | `app/auction/[id].tsx` | Auction detail |
| `/products` | `app/products.tsx` | Products list |

### Stream Routes

| Route | File | Description |
|-------|------|-------------|
| `/stream/[id]` | `app/stream/[id].tsx` | Stream viewer |

### User Routes

| Route | File | Description |
|-------|------|-------------|
| `/user/[id]` | `app/user/[id].tsx` | User profile |

### Social Routes (`app/social/`)

| Route | File | Description |
|-------|------|-------------|
| `/social/followers/[id]` | `app/social/followers/[id].tsx` | Followers list |
| `/social/following/[id]` | `app/social/following/[id].tsx` | Following list |

### Messages Routes (`app/messages/`)

| Route | File | Description |
|-------|------|-------------|
| `/messages` | `app/messages/_layout.tsx` | Messages layout |
| `/messages/[id]` | `app/messages/[id].tsx` | Conversation detail |
| `/messages/new` | `app/messages/new.tsx` | New message |

### Checkout Routes (`app/checkout/`)

| Route | File | Description |
|-------|------|-------------|
| `/checkout/cart` | `app/checkout/cart.tsx` | Cart checkout |
| `/checkout/[orderId]` | `app/checkout/[orderId].tsx` | Order checkout |

### Settings Routes (`app/settings/`)

| Route | File | Description |
|-------|------|-------------|
| `/settings` | `app/settings/index.tsx` | Settings page |
| `/settings/change-password` | `app/settings/change-password.tsx` | Change password |
| `/settings/privacy` | `app/settings/privacy.tsx` | Privacy settings |

### Other Routes

| Route | File | Description |
|-------|------|-------------|
| `/notifications` | `app/notifications.tsx` | Notifications page |
| `/help-support` | `app/help-support.tsx` | Help & support |
| `/menu` | `app/menu.tsx` | Menu page |

---

## Hooks

Custom React hooks for state management and business logic.

### Authentication Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useAuth` | `hooks/useAuth.ts` | Main authentication hook providing login, register, logout, password reset, and verification functions |
| `useAuthGuard` | `hooks/useAuthGuard.ts` | Auth guard hook for route protection with seller/admin checks |
| `useSellerGuard` | `hooks/useAuthGuard.ts` | Specific guard for seller-only routes |
| `useAdminGuard` | `hooks/useAuthGuard.ts` | Specific guard for admin-only routes |
| `usePublicRouteGuard` | `hooks/useAuthGuard.ts` | Guard for redirecting authenticated users away from auth pages |

### User Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useUser` | `hooks/useUser.ts` | Main user hook with profile management |
| `useCurrentUser` | `hooks/useUser.ts` | Fetches current authenticated user |
| `useUpdateProfile` | `hooks/useUser.ts` | Mutation hook for updating user profile |
| `useUploadAvatar` | `hooks/useUser.ts` | Mutation hook for uploading user avatar |
| `useUserQuery` | `hooks/useUser.ts` | Alias for useCurrentUser |
| `useUpdateProfileMutation` | `hooks/useUser.ts` | Alias for useUpdateProfile |
| `useUploadAvatarMutation` | `hooks/useUser.ts` | Alias for useUploadAvatar |
| `useProfileSetup` | `hooks/useProfileSetup.ts` | Profile setup form with validation and image upload |

### Product Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useProducts` | `hooks/useProducts.ts` | Query hook for fetching products with filters |
| `useProductById` | `hooks/useProducts.ts` | Query hook for fetching single product by ID |
| `usesProductsByCategory` | `hooks/useProducts.ts` | Query hook for filtering products by category |
| `useCreateProduct` | `hooks/useProducts.ts` | Mutation hook for creating new product |
| `useUpdateProduct` | `hooks/useProducts.ts` | Mutation hook for updating product |
| `useDeleteProduct` | `hooks/useProducts.ts` | Mutation hook for deleting product |

### Auction & Bidding Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useAuctions` | `hooks/useAuctions.ts` | Query hook for fetching auctions |
| `useAuctionById` | `hooks/useAuctions.ts` | Query hook for fetching single auction |
| `useCreateAuction` | `hooks/useAuctions.ts` | Mutation hook for creating auction |
| `useEndAuction` | `hooks/useAuctions.ts` | Mutation hook for ending/canceling auction |
| `useAuction` | `hooks/useAuction.ts` | Simple auction fetching hook |
| `useBids` | `hooks/useBids.ts` | Query hook for fetching bids for an auction |
| `useMyBids` | `hooks/useBids.ts` | Query hook for fetching current user's bids |
| `usePlaceBid` | `hooks/useBids.ts` | Mutation hook for placing a bid |
| `useBidding` | `hooks/useBidding.ts` | Comprehensive bidding hook with real-time updates, timer handling |

### Cart & Checkout Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useCart` | `hooks/useCart.ts` | Main cart hook with all cart operations |
| `useCartQuery` | `hooks/useCart.ts` | Query hook for fetching cart items |
| `useAddToCartMutation` | `hooks/useCart.ts` | Mutation hook for adding item to cart |
| `useRemoveFromCartMutation` | `hooks/useCart.ts` | Mutation hook for removing item from cart |
| `useUpdateQuantityMutation` | `hooks/useCart.ts` | Mutation hook for updating cart item quantity |
| `useClearCartMutation` | `hooks/useCart.ts` | Mutation hook for clearing cart |
| `useCheckout` | `hooks/useCheckout.ts` | Checkout process hook with payment handling |

### Stream & Live Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useStreams` | `hooks/useStreams.ts` | Query hook for fetching streams |
| `useStreamById` | `hooks/useStreams.ts` | Query hook for fetching single stream |
| `useCreateStream` | `hooks/useStreams.ts` | Mutation hook for creating stream |
| `useUpdateStream` | `hooks/useStreams.ts` | Mutation hook for updating stream |
| `useDeleteStream` | `hooks/useStreams.ts` | Mutation hook for deleting/canceling stream |
| `useStream` | `hooks/useStream.ts` | Stream fetching hook with real-time updates |
| `useLiveStream` | `hooks/useLiveStream.ts` | Live stream viewer hook with chat and viewer count |
| `useStreamForm` | `hooks/useStreamForm.ts` | Form hook for creating/editing streams |
| `useStreamViewers` | `hooks/useStreamViewers.ts` | Query hook for fetching stream viewers |
| `useRealtimeFeed` | `hooks/useRealtimeFeed.ts` | Real-time feed of live streams |
| `useRealtimeViewerCount` | `hooks/useRealtimeViewerCount.ts` | Real-time viewer count updates |
| `useStreamNotifications` | `hooks/useStreamNotifications.ts` | Stream-specific notifications |
| `useStreamMedia` | `hooks/useStreamMedia.ts` | Stream media handling hook |
| `useProductSelection` | `hooks/useProductSelection.ts` | Product selection for streams |
| `useDeepLinkHandler` | `hooks/useDeepLinkHandler.ts` | Deep link handling |
| `usePushNotificationHandler` | `hooks/usePushNotificationHandler.ts` | Push notification handling |

### Message Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useConversations` | `hooks/useMessages.ts` | Query hook for fetching conversations |
| `useConversationMessages` | `hooks/useMessages.ts` | Query hook for fetching messages in a conversation |
| `useSendMessage` | `hooks/useMessages.ts` | Mutation hook for sending a message |
| `useMarkMessagesRead` | `hooks/useMessages.ts` | Mutation hook for marking messages as read |
| `useChat` | `hooks/useChat.ts` | Real-time chat hook for stream chat |
| `useUnreadMessages` | `hooks/useUnreadMessages.ts` | Hook for unread message count |

### Payment Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `usePaymentMethods` | `hooks/usePaymentMethods.ts` | Payment method management hook |
| `usePaymentProcessing` | `hooks/usePaymentProcessing.ts` | Payment processing state management |
| `usePaymentStatusUpdates` | `hooks/usePaymentProcessing.ts` | Real-time payment status updates |
| `usePaymentCancellation` | `hooks/usePaymentCancellation.ts` | Payment cancellation handling |

### Seller Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useDashboard` | `hooks/useDashboard.ts` | Seller dashboard data hook |
| `useSellerApplication` | `hooks/useSellerApplication.ts` | Seller application form hook |
| `useSellerProfile` | `hooks/useSellerProfile.ts` | Seller profile with follow functionality |

### Category & Other Hooks

| Name | File Path | Description |
|------|-----------|-------------|
| `useCategories` | `hooks/useCategories.ts` | Query hook for fetching categories |
| `useNotifications` | `hooks/useNotifications.ts` | Notifications hook with push token registration |
| `useResponsiveLayout` | `hooks/useResponsiveLayout.ts` | Responsive layout utilities hook |

### Hook Utility Functions

| Name | File Path | Signature | Description |
|------|-----------|-----------|-------------|
| `getHorizontalPadding` | `hooks/useResponsiveLayout.ts` | `(screenWidth: number) => number` | Get responsive horizontal padding |
| `getResponsiveFontSize` | `hooks/useResponsiveLayout.ts` | `(baseSize: number, screenWidth: number, minScale?: number, maxScale?: number) => number` | Scale font size based on screen width |
| `getGridColumns` | `hooks/useResponsiveLayout.ts` | `(screenWidth: number, options?: GridOptions) => number` | Calculate grid columns |
| `getGridItemWidth` | `hooks/useResponsiveLayout.ts` | `(params: GridItemParams) => number` | Calculate grid item width |
| `formatProcessingDuration` | `hooks/usePaymentProcessing.ts` | `(startTime: number \| null) => string` | Format payment duration |
| `isRetryableError` | `hooks/usePaymentProcessing.ts` | `(error: PaymentStatus['error']) => boolean` | Check if payment error is retryable |
| `getErrorMessage` | `hooks/usePaymentProcessing.ts` | `(error: PaymentStatus['error']) => string` | Get user-friendly error message |

---

## Types & Interfaces

Core TypeScript types and interfaces located at `types/index.ts`.

### User Types

| Type | Description |
|------|-------------|
| `User` | User profile with id, email, username, role, seller status, onboarding state |
| `AuthResponse` | Authentication response with access token and user data |
| `RegisterPayload` | Registration input (email, password, username, fullName) |
| `LoginPayload` | Login input (email, password) |
| `UpdateProfilePayload` | Profile update input (username, full_name, avatar_url, bio, etc.) |

### Seller Types

| Type | Description |
|------|-------------|
| `Seller` | Seller profile with business info and verification status |
| `SellerApplicationStatus` | Status: "draft" \| "submitted" \| "in_review" \| "approved" \| "rejected" \| "more_info_needed" |
| `VerificationDocumentType` | Document types: "id_front" \| "id_back" \| "business_license" \| "tax_form" \| "bank_statement" |
| `SellerApplication` | Complete seller application with documents |
| `SellerVerificationSession` | Stripe verification session data |
| `SellerDashboard` | Dashboard stats (total_auctions, active_auctions, revenue, rating) |

### Product & Auction Types

| Type | Description |
|------|-------------|
| `Product` | Product with id, title, price, condition, images, category |
| `CreateProductPayload` | Input for creating a product |
| `Auction` | Auction with current price, bid increment, status |
| `AuctionStatus` | Status: "draft" \| "live" \| "ended" \| "cancelled" \| "scheduled" |
| `CreateAuctionPayload` | Input for creating an auction |
| `Bid` | Bid with auction_id, bidder_id, amount |
| `CreateBidPayload` | Input for placing a bid |

### Cart & Order Types

| Type | Description |
|------|-------------|
| `CartItem` | Cart item with product reference and quantity |
| `CartTotal` | Cart totals (subtotal, shipping, tax, total) |
| `ShippingAddress` | Address fields (name, line1, line2, city, state, postalCode, country) |
| `Order` | Order with status, payment info, shipping details |
| `PaymentIntent` | Stripe payment intent |

### Social & API Types

| Type | Description |
|------|-------------|
| `SocialStats` | Follower/following counts |
| `Category` | Product category with subcategories |
| `ApiResponse<T>` | Standard API response wrapper |
| `ApiError` | API error structure |
| `StreamSession` | Stream for explore view |
| `DataExportResponse` | Data export response |

---

## Components

### Design System Components (`components/design/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `StitchPage` | `components/design/stitch.tsx` | Main page wrapper with safe area and scroll |
| `StitchHeader` | `components/design/stitch.tsx` | Header with title, subtitle, back button |
| `StitchSearchBar` | `components/design/stitch.tsx` | Search bar with filter button |
| `StitchSectionTitle` | `components/design/stitch.tsx` | Section title with action |
| `StitchPrimaryButton` | `components/design/stitch.tsx` | Primary action button |
| `StitchSecondaryButton` | `components/design/stitch.tsx` | Secondary action button |
| `StitchChip` | `components/design/stitch.tsx` | Toggle chip button |
| `StitchCard` | `components/design/stitch.tsx` | Card container |
| `StitchStat` | `components/design/stitch.tsx` | Statistics card |
| `StitchEmpty` | `components/design/stitch.tsx` | Empty state display |

### Stream Components

| Component | File Path | Description |
|-----------|-----------|-------------|
| `StreamCard` | `components/stream/StreamCard.tsx` | Card displaying stream preview |
| `StreamTopBar` | `components/stream/StreamTopBar.tsx` | Top bar with stream info |
| `StreamBottomBar` | `components/stream/StreamBottomBar.tsx` | Bottom bar with actions |
| `StreamSideControls` | `components/stream/StreamSideControls.tsx` | Side panel controls |
| `StreamVideoLayer` | `components/stream/StreamVideoLayer.tsx` | Video playback layer |
| `ChatBox` | `components/stream/ChatBox.tsx` | Stream chat interface |
| `AuctionCard` | `components/stream/AuctionCard.tsx` | Auction item card |
| `AuctionSection` | `components/stream/AuctionSection.tsx` | Section for auctions |
| `AuctionTimer` | `components/stream/AuctionTimer.tsx` | Countdown timer for auctions |
| `AuctionOverlay` | `components/stream/AuctionOverlay.tsx` | Overlay for auction info |
| `BidAlert` | `components/stream/BidAlert.tsx` | Alert for new bids |
| `ProductCard` | `components/stream/ProductCard.tsx` | Product in stream |
| `ProductFeedCard` | `components/stream/ProductFeedCard.tsx` | Feed product card |
| `ConnectionControls` | `components/stream/ConnectionControls.tsx` | Stream connection controls |
| `ConnectionOverlay` | `components/stream/ConnectionOverlay.tsx` | Connection status overlay |
| `ReactionSystem` | `components/stream/ReactionSystem.tsx` | Stream reactions |
| `InstagramLiveChat` | `components/stream/InstagramLiveChat.tsx` | Instagram-style chat |
| `SellerStreamViewStream` | `components/stream/SellerStreamViewStream.tsx` | Seller stream view |
| `SellerStreamControls` | `components/stream/SellerStreamControls.tsx` | Seller stream controls |
| `ViewerStreamViewStream` | `components/stream/ViewerStreamViewStream.tsx` | Viewer stream view |
| `ViewerStreamViewStreamWeb` | `components/stream/ViewerStreamViewStream.web.tsx` | Web variant of viewer stream |
| `SellerStreamViewStreamWeb` | `components/stream/SellerStreamViewStream.web.tsx` | Web variant of seller stream |

### Stream Profile Components (`components/stream/profile/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `SellerProfileHeader` | `components/stream/profile/SellerProfileHeader.tsx` | Seller profile header |
| `SellerStats` | `components/stream/profile/SellerStats.tsx` | Seller statistics |
| `SellerProductsGrid` | `components/stream/profile/SellerProductsGrid.tsx` | Seller products grid |
| `SellerActionButtons` | `components/stream/profile/SellerActionButtons.tsx` | Seller action buttons |

### Seller Dashboard Components (`components/seller/dashboard/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `DashboardMetrics` | `components/seller/dashboard/DashboardMetrics.tsx` | Dashboard metrics display |
| `DashboardStatus` | `components/seller/dashboard/DashboardStatus.tsx` | Seller status indicator |
| `DashboardSettings` | `components/seller/dashboard/DashboardSettings.tsx` | Dashboard settings |
| `DashboardHeader` | `components/seller/dashboard/DashboardHeader.tsx` | Dashboard header |
| `ActiveAuctionPanel` | `components/seller/dashboard/ActiveAuctionPanel.tsx` | Active auction panel |
| `ViewerEngagement` | `components/seller/dashboard/ViewerEngagement.tsx` | Viewer engagement stats |
| `InventoryQueue` | `components/seller/dashboard/InventoryQueue.tsx` | Product inventory queue |
| `LiveAlerts` | `components/seller/dashboard/LiveAlerts.tsx` | Live stream alerts |
| `PendingOrders` | `components/seller/dashboard/PendingOrders.tsx` | Pending orders display |
| `PostStreamManagement` | `components/seller/dashboard/PostStreamManagement.tsx` | Post-stream management |
| `ProductsSection` | `components/seller/dashboard/ProductsSection.tsx` | Products section |
| `StatsGrid` | `components/seller/dashboard/StatsGrid.tsx` | Statistics grid |
| `StreamSummary` | `components/seller/dashboard/StreamSummary.tsx` | Stream summary |
| `StreamControls` | `components/seller/dashboard/StreamControls.tsx` | Stream control buttons |
| `VerificationCard` | `components/seller/dashboard/VerificationCard.tsx` | Verification status card |
| `QuickActions` | `components/seller/dashboard/QuickActions.tsx` | Seller quick actions |

### Seller Application Components (`components/seller/application/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `BusinessInfoStep` | `components/seller/application/BusinessInfoStep.tsx` | Business info form step |
| `DocumentUploadStep` | `components/seller/application/DocumentUploadStep.tsx` | Document upload step |
| `ReviewStep` | `components/seller/application/ReviewStep.tsx` | Application review step |
| `StepIndicator` | `components/seller/application/StepIndicator.tsx` | Application step indicator |

### Seller Components (`components/seller/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `ProductSelector` | `components/seller/ProductSelector.tsx` | Product selection component |
| `StreamForm` | `components/seller/StreamForm.tsx` | Stream creation form |
| `ThumbnailUpload` | `components/seller/ThumbnailUpload.tsx` | Thumbnail upload |
| `CategoryPicker` | `components/seller/CategoryPicker.tsx` | Category selection |
| `CategoryDrawer` | `components/seller/CategoryDrawer.tsx` | Category drawer |
| `UpgradeToSeller` | `components/seller/UpgradeToSeller.tsx` | Upgrade prompt |

### Payment Components (`components/payment/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `EnhancedCheckout` | `components/payment/EnhancedCheckout.tsx` | Enhanced checkout flow |
| `PaymentMethodCard` | `components/payment/PaymentMethodCard.tsx` | Payment method card |
| `PaymentMethodManager` | `components/payment/PaymentMethodManager.tsx` | Payment method management |
| `PaymentMethodValidation` | `components/payment/PaymentMethodValidation.tsx` | Payment validation |
| `PaymentStatusTracker` | `components/payment/PaymentStatusTracker.tsx` | Payment status display |
| `AddPaymentMethodButton` | `components/payment/AddPaymentMethodButton.tsx` | Add payment method button |

### Profile Components (`components/profile/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `ProfileHeader` | `components/profile/ProfileHeader.tsx` | User profile header |
| `ProfileStats` | `components/profile/ProfileStats.tsx` | Profile statistics |
| `ProfileMenuItems` | `components/profile/ProfileMenuItems.tsx` | Profile menu items |
| `QuickActions` | `components/profile/QuickActions.tsx` | Quick action buttons |
| `ReviewsTab` | `components/profile/ReviewsTab.tsx` | User reviews tab |
| `ShopTab` | `components/profile/ShopTab.tsx` | User shop tab |
| `SellerDashboardCTA` | `components/profile/SellerDashboardCTA.tsx` | Seller dashboard call-to-action |

### User Components (`components/user/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `UserHeader` | `components/user/UserHeader.tsx` | User profile header |
| `UserStats` | `components/user/UserStats.tsx` | User statistics |
| `UserActionButtons` | `components/user/UserActionButtons.tsx` | User action buttons |
| `UserSectionItem` | `components/user/UserSectionItem.tsx` | User section item |

### Onboarding Components (`components/onboarding/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `OnboardingProgress` | `components/onboarding/OnboardingProgress.tsx` | Onboarding progress bar |
| `ProfileForm` | `components/onboarding/ProfileForm.tsx` | Profile setup form |
| `AvatarUpload` | `components/onboarding/AvatarUpload.tsx` | Avatar upload component |

### Guard Components (`components/guards/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `AuthGuard` | `components/guards/AuthGuard.tsx` | Route guard for authentication |
| `OnboardingGuard` | `components/guards/OnboardingGuard.tsx` | Route guard for onboarding |
| `SellerGuard` | `components/guards/SellerGuard.tsx` | Route guard for seller routes |

### Auth Components (`components/auth/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `SellerOnly` | `components/auth/SellerOnly.tsx` | Seller-only content wrapper |

### Home Components (`components/home/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `ForYouSection` | `components/home/ForYouSection.tsx` | For You feed section |
| `UpcomingStreamsSection` | `components/home/UpcomingStreamsSection.tsx` | Upcoming streams section |
| `HomeLoadingState` | `components/home/HomeLoadingState.tsx` | Loading state for home |
| `LiveStreamsSection` | `components/home/LiveStreamsSection.tsx` | Live streams section |
| `ErrorStateView` | `components/home/ErrorStateView.tsx` | Error state display |
| `ProductGrid` | `components/home/ProductGrid.tsx` | Product grid display |
| `StreamGrid` | `components/home/StreamGrid.tsx` | Stream grid display |
| `ProductCard` | `components/home/ProductCard.tsx` | Product card for home |
| `StreamCard` | `components/home/StreamCard.tsx` | Stream card for home |
| `HeroBanner` | `components/home/HeroBanner.tsx` | Hero banner |
| `CategoryFilter` | `components/home/CategoryFilter.tsx` | Category filter chips |
| `HomeHeader` | `components/home/HomeHeader.tsx` | Home page header |

### Notifications Components (`components/notifications/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `StreamNotificationToast` | `components/notifications/StreamNotificationToast.tsx` | Stream notification toast |
| `NotificationBell` | `components/notifications/NotificationBell.tsx` | Notification bell icon |

### UI Components (`components/ui/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `Button` | `components/ui/button.tsx` | Reusable button |
| `Input` | `components/ui/input.tsx` | Text input |
| `Avatar` | `components/ui/avatar.tsx` | User avatar |
| `Card` | `components/ui/card.tsx` | Card container |
| `Text` | `components/ui/text.tsx` | Text component |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading skeleton |
| `Header` | `components/ui/Header.tsx` | Screen header |
| `EmptyState` | `components/ui/EmptyState.tsx` | Empty state display |
| `LoadingSpinner` | `components/ui/LoadingSpinner.tsx` | Loading spinner |
| `ErrorBoundary` | `components/ui/error-boundary.tsx` | Error boundary |
| `BetaBadge` | `components/ui/BetaBadge.tsx` | Beta feature badge |

### Root Components (`components/`)

| Component | File Path | Description |
|-----------|-----------|-------------|
| `PaymentNotice` | `components/ui/PaymentNotice.tsx` | Payment notice |
| `EscrowStatusCard` | `components/EscrowStatusCard.tsx` | Escrow status card |
| `ExploreView` | `components/ExploreView.tsx` | Explore/feed view |

---

## API Services

API service modules located in `lib/api/services/`.

### Core Services

| Service | File Path | Functions |
|---------|-----------|-----------|
| `apiClient` | `lib/api/client.ts` | Axios instance with interceptors |
| `queryKeys` | `lib/api/queryKeys.ts` | React Query cache keys |

### Auth Service

| Function | Description |
|----------|-------------|
| `forgotPassword` | Send password reset email |
| `resetPassword` | Reset password with token |
| `syncProfile` | Sync user profile |
| `getProfile` | Get user profile |

### Users Service

| Function | Description |
|----------|-------------|
| `syncProfile` | Sync user profile |
| `getMe` | Get current user |
| `getProfile` | Get user profile by ID |
| `updateProfile` | Update user profile |
| `verifyAge` | Verify user age |
| `exportData` | Export user data |

### Products Service

| Function | Description |
|----------|-------------|
| `findAll` | Get all products |
| `findById` | Get product by ID |
| `create` | Create new product |
| `update` | Update product |
| `delete` | Delete product |
| `getSellerProducts` | Get seller's products |
| `getMyProducts` | Get current user's products |
| `buyNow` | Buy product immediately |

### Cart Service

| Function | Description |
|----------|-------------|
| `getCart` | Get cart items |
| `addItem` | Add item to cart |
| `updateQuantity` | Update item quantity |
| `removeItem` | Remove item from cart |
| `clearCart` | Clear cart |
| `getItemCount` | Get cart item count |
| `validateCart` | Validate cart items |
| `calculateTotal` | Calculate cart total |
| `checkout` | Process checkout |

### Orders Service

| Function | Description |
|----------|-------------|
| `getMyOrders` | Get current user's orders |
| `getMySales` | Get seller's sales |
| `getOrder` | Get order by ID |
| `updateStatus` | Update order status |
| `generateLabel` | Generate shipping label |
| `updateOrder` | Update order details |

### Auctions Service

| Function | Description |
|----------|-------------|
| `create` | Create auction |
| `startStreamAuction` | Start stream auction |
| `findAll` | Get all auctions |
| `findByStream` | Get auctions by stream |
| `findById` | Get auction by ID |
| `cancel` | Cancel auction |
| `extend` | Extend auction time |

### Bids Service

| Function | Description |
|----------|-------------|
| `placeBid` | Place a bid |
| `placeMaxBid` | Place maximum bid |
| `getAuctionBids` | Get bids for auction |
| `getMyBids` | Get current user's bids |
| `getMyMaxBids` | Get user's max bids |
| `cancelMaxBid` | Cancel max bid |

### Streams Service

| Function | Description |
|----------|-------------|
| `create` | Create stream |
| `findAll` | Get all streams |
| `findById` | Get stream by ID |
| `start` | Start stream |
| `getHostToken` | Get host RTMP token |
| `getViewerToken` | Get viewer token |
| `end` | End stream |
| `cancel` | Cancel stream |
| `getMyStreams` | Get current user's streams |
| `subscribe` | Subscribe to stream |
| `update` | Update stream |
| `getProducts` | Get stream products |
| `addProduct` | Add product to stream |
| `removeProduct` | Remove product from stream |
| `updateProduct` | Update stream product |
| `markProductActive` | Mark product as active |
| `markProductSold` | Mark product as sold |
| `join` | Join stream |
| `leave` | Leave stream |
| `getStreamStats` | Get stream statistics |

### Messages Service

| Function | Description |
|----------|-------------|
| (various) | Message and conversation operations |

### Categories Service

| Function | Description |
|----------|-------------|
| (various) | Category operations |

### Notifications Service

| Function | Description |
|----------|-------------|
| (various) | Notification operations |

### Payments Service

| Function | Description |
|----------|-------------|
| (various) | Payment operations |

### Sellers Service

| Function | Description |
|----------|-------------|
| (various) | Seller operations |

### Social Service

| Function | Description |
|----------|-------------|
| (various) | Follow/unfollow operations |

### Escrow Service

| Function | Description |
|----------|-------------|
| (various) | Escrow operations |

### Reviews Service

| Function | Description |
|----------|-------------|
| (various) | Review operations |

### Analytics Service

| Function | Description |
|----------|-------------|
| (various) | Analytics operations |

### Stripe Connect Service

| Function | Description |
|----------|-------------|
| (various) | Stripe Connect operations |

---

## Stores (Zustand)

State management stores.

### Auth Store

**File:** `store/authStore.ts`

| State/Action | Type | Description |
|--------------|------|-------------|
| `session` | `Session \| null` | Current user session |
| `user` | `SupabaseUser \| null` | Current user |
| `profile` | `User \| null` | User profile |
| `loading` | `boolean` | Loading state |
| `initialized` | `boolean` | Store initialized |
| `isFetchingProfile` | `boolean` | Profile fetch in progress |
| `lastProfileFetch` | `number` | Last profile fetch timestamp |
| `signIn` | `(email, password) => Promise<void>` | Sign in action |
| `signUp` | `(email, password, userData) => Promise<void>` | Sign up action |
| `signOut` | `() => Promise<void>` | Sign out action |
| `setSession` | `(session) => void` | Set session |
| `fetchProfile` | `(force?) => Promise<void>` | Fetch user profile |
| `initialize` | `() => Promise<void>` | Initialize store |
| `setOnboarded` | `(status) => void` | Set onboarded status |
| `setSellerStatus` | `(isSeller) => void` | Set seller status |
| `subscribeToProfile` | `() => void` | Subscribe to profile changes |
| `isSeller` | `() => boolean` | Check if user is seller |
| `isAdmin` | `() => boolean` | Check if user is admin |
| `isOnboarded` | `() => boolean` | Check if user is onboarded |
| `canAccessSellerFeatures` | `() => boolean` | Check seller feature access |

### Cart Store

**File:** `store/cartStore.ts`

| State/Action | Type | Description |
|--------------|------|-------------|
| `itemCount` | `number` | Cart item count |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `fetchCartCount` | `() => Promise<void>` | Fetch cart count |
| `incrementCount` | `() => void` | Increment count |
| `decrementCount` | `() => void` | Decrement count |
| `setCount` | `(count) => void` | Set count |

### Stream Store

**File:** `store/streamStore.ts`

| State/Action | Type | Description |
|--------------|------|-------------|
| `isLive` | `boolean` | Stream live status |
| `viewerCount` | `number` | Current viewer count |
| `activeProduct` | `Product \| null` | Active product |
| `messages` | `any[]` | Stream messages |
| `setIsLive` | `(status) => void` | Set live status |
| `setViewerCount` | `(count) => void` | Set viewer count |
| `setActiveProduct` | `(product) => void` | Set active product |
| `addMessage` | `(message) => void` | Add message |
| `reset` | `() => void` | Reset store |

---

## Context Providers

React context providers.

### Toast Context

**File:** `context/ToastContext.tsx`

| Provider/Hook | Type | Description |
|--------------|------|-------------|
| `ToastProvider` | `React.FC<{children: React.ReactNode}>` | Toast notification provider |
| `useToast` | `() => ToastContextValue` | Hook to access toast functions |

**Toast Context Value:**
```typescript
interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}
```

**Toast Types:** `'success' | 'error' | 'warning' | 'info'`

---

## Constants

### Colors

**File:** `constants/colors.ts`

| Export | Value | Description |
|--------|-------|-------------|
| `primaryBlue` | `#6391F2` | Primary blue |
| `softBlue` | `#B2CBEC` | Soft blue |
| `blueLavender` | `#9CA9DE` | Blue lavender |
| `mainBackground` | `#F2F1F8` | Main background |
| `cardWhite` | `#FFFFFF` | Card white |
| `lightGrey` | `#9C9AA6` | Light grey |
| `primaryText` | `#22232D` | Primary text |
| `secondaryDark` | `#2F354E` | Secondary dark |
| `successGreen` | `#22c55e` | Success green |
| `errorRed` | `#EF4444` | Error red |
| `warningAmber` | `#F59E0B` | Warning amber |
| `COLORS` | `object` | All colors as object |

### Theme

**File:** `constants/theme.ts`

| Export | Description |
|--------|-------------|
| `theme` | Complete theme object with colors, gradients, spacing, borderRadius, typography, shadows |
| `typography` | Typography configuration (fontFamily, weights, sizes) |
| `gluestackTokens` | Gluestack UI design tokens |
| `getButtonStyle` | Get button styles by variant |
| `getCardStyle` | Get card styles |
| `getInputStyle` | Get input styles |

### Config

**File:** `constants/config.ts`

| Export | Description |
|--------|-------------|
| `API_BASE_URL` | API base URL based on platform |

---

## Utilities

### Core Utilities

**File:** `lib/utils.ts`

| Function | Signature | Description |
|----------|-----------|-------------|
| `cn` | `(...inputs: ClassValue[]) => string` | Merge tailwind classes (clsx + tailwind-merge) |

### Supabase Client

**File:** `lib/supabase.ts`

| Export | Description |
|--------|-------------|
| `supabase` | Supabase client instance |

### Bidding Utils

**File:** `lib/bidding/utils.ts`

| Function | Description |
|----------|-------------|
| `getMinimumBidIncrement` | Calculate minimum bid increment |
| `formatBidAmount` | Format bid amount for display |

### Image Utils

**File:** `lib/utils/imageUtils.ts`

| Function | Description |
|----------|-------------|
| (various) | Image processing utilities |

### Connection Manager

**File:** `lib/connection/ConnectionManager.ts`

| Class/Method | Description |
|--------------|-------------|
| `ConnectionManager` | WebRTC connection manager class |
| `connect` | Connect to stream |
| `disconnect` | Disconnect from stream |
| `getConnectionState` | Get current connection state |

---

## Summary

The BarterDash mobile app is organized with the following structure:

- **40+ Custom React Hooks** covering authentication, products, auctions, bidding, cart, checkout, streams, messaging, payments, and seller features
- **30+ TypeScript Types/Interfaces** for users, sellers, products, auctions, bids, cart, orders, payments
- **70+ React Components** for streams, profiles, seller dashboard, payments, UI
- **10+ API Services** for all backend operations
- **3 Zustand Stores** for auth, cart, and stream state
- **1 Context Provider** for toast notifications
- **3 Constant Files** for colors, theme, and config
- **60+ App Routes** covering auth, onboarding, tabs, seller, products, streams, messages, checkout, and settings

---

*Generated on: February 24, 2026*
