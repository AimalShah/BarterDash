# BarterDash Mobile App Refactoring - Master Todo List

> **Instructions**: This is a living document. Check off tasks as you complete them. Add new tasks as needed. Each task should be specific and actionable.

---

## Phase 1: Foundation & Setup 

### 1.1 Theme & Configuration
- [x] Install react-native-reusables CLI and dependencies
- [x] Configure `tailwind.config.js` with custom color palette:
  - [x] Primary Blue: #6391F2
  - [x] Soft Blue: #B2CBEC
  - [x] Blue-Lavender: #9CA9DE
  - [x] Main Background: #F2F1F8
  - [x] Card Background: #FFFFFF
  - [x] Light Grey: #9C9AA6
  - [x] Primary Text: #22232D
  - [x] Secondary Dark: #2F354E
  - [x] Warm Highlight: #F2D468
  - [x] Soft Gold: #E7D7A2
  - [x] Muted Blue-Grey: #768CAB
- [x] Create `theme.ts` with color constants and navigation theme
- [x] Update `global.css` with CSS variables
- [x] Remove dark mode (light mode only)
- [x] Update `components.json` for react-native-reusables

### 1.2 Core UI Components
Create all components in `/components/ui/` - each must be under 280 lines:

- [x] **Button Component** (`components/ui/button.tsx`)
  - [x] Variants: primary, secondary, outline, ghost
  - [x] Sizes: sm, md, lg
  - [x] States: default, disabled, loading
  - [x] Props: onPress, children, variant, size, disabled, loading, className
  
- [x] **Input Component** (`components/ui/input.tsx`)
  - [x] Label support
  - [x] Error state with message
  - [x] Secure text entry option
  - [x] Keyboard types
  - [x] Props: label, placeholder, value, onChangeText, error, secureTextEntry, keyboardType, className
  
- [x] **Text Component** (`components/ui/text.tsx`)
  - [x] Variants: h1, h2, h3, body, caption, label
  - [x] Colors: primary, secondary, muted
  - [x] Weights: normal, medium, semibold, bold
  - [x] Props: variant, color, weight, children, className
  
- [x] **Card Component** (`components/ui/card.tsx`)
  - [x] Variants: default, elevated, outline
  - [x] Props: variant, children, className
  
- [x] **Badge Component** (`components/ui/badge.tsx`)
  - [x] Variants: default, primary, secondary, success, warning, error
  - [x] Props: variant, children, className
  
- [x] **Avatar Component** (`components/ui/avatar.tsx`)
  - [x] Sizes: sm, md, lg, xl
  - [x] Fallback to initials
  - [x] Props: src, fallback, size, className
  
- [x] **Skeleton Component** (`components/ui/skeleton.tsx`)
  - [x] For loading states
  - [x] Props: width, height, className
  
- [x] **Error Boundary Component** (`components/ui/error-boundary.tsx`)
  - [x] Catch and display errors gracefully
  
- [x] Create `components/ui/index.ts` exports file

### 1.3 TanStack Query Setup
- [x] Configure QueryClient in root layout
- [x] Set up query keys structure
- [x] Configure default options (staleTime, cacheTime)
- [ ] Add React Query DevTools (dev only)

### 1.4 API Hooks Refactoring
Replace all useEffect data fetching with TanStack Query hooks:

- [x] **useAuth hook** (`hooks/useAuth.ts`)
  - [x] login mutation
  - [x] register mutation
  - [x] logout mutation
  - [x] password reset mutation
  
- [x] **useUser hook** (`hooks/useUser.ts`)
  - [x] getCurrentUser query
  - [x] updateProfile mutation
  - [x] uploadAvatar mutation
  
- [x] **useStreams hook** (`hooks/useStreams.ts`)
  - [x] getStreams query
  - [x] getStreamById query
  - [x] createStream mutation
  - [x] updateStream mutation
  - [x] deleteStream mutation
  
- [x] **useProducts hook** (`hooks/useProducts.ts`)
  - [x] getProducts query
  - [x] getProductById query
  - [x] getProductsByCategory query
  - [x] createProduct mutation
  - [x] updateProduct mutation
  - [x] deleteProduct mutation
  
- [x] **useCategories hook** (`hooks/useCategories.ts`)
  - [x] getCategories query
  - [x] Cache categories (rarely change)
  
- [x] **useCart hook** (`hooks/useCart.ts`)
  - [x] getCart query
  - [x] addToCart mutation
  - [x] removeFromCart mutation
  - [x] updateQuantity mutation
  - [x] clearCart mutation
  
- [ ] **useOrders hook** (`hooks/useOrders.ts`)
  - [ ] getOrders query
  - [ ] getOrderById query
  - [ ] createOrder mutation
  - [ ] cancelOrder mutation
  
- [x] **useAuctions hook** (`hooks/useAuctions.ts`)
  - [x] getAuctions query
  - [x] getAuctionById query
  - [x] createAuction mutation
  - [x] endAuction mutation
  
- [x] **useBids hook** (`hooks/useBids.ts`)
  - [x] getBids query
  - [x] placeBid mutation
  - [x] getMyBids query
  
- [ ] **useSeller hook** (`hooks/useSeller.ts`)
  - [ ] getSellerProfile query
  - [ ] updateSellerProfile mutation
  - [ ] applyAsSeller mutation
  
- [x] **useMessages hook** (`hooks/useMessages.ts`)
  - [x] getConversations query
  - [x] getMessages query
  - [x] sendMessage mutation
  - [x] markAsRead mutation
  
- [ ] **useNotifications hook** (`hooks/useNotifications.ts`)
  - [ ] getNotifications query
  - [ ] markAsRead mutation
  - [ ] deleteNotification mutation
  
- [x] Update `hooks/index.ts` exports

### 1.5 Stability Follow-Ups (After This Pass)
- [ ] Resolve remaining TypeScript errors in legacy checkout and seller flows (`app/(tabs)/checkout.tsx`, `app/checkout/cart.tsx`, `app/seller/**`)
- [x] Refactor `app/(auth)/verify-email.tsx` and `app/(auth)/update-password.tsx` to new UI components + architecture style rules
- [x] Replace all `@gluestack-ui/themed` imports in `app/**` and `components/**` with `@/components/ui/reusables`
- [x] Route `@/components/ui/reusables` primitives through built-in `components/ui/*` components (`button`, `text`, `badge`) instead of standalone gluestack wrappers
- [ ] Continue migration away from remaining inline style patterns to architecture-compliant Tailwind-first components

### 1.6 Architecture Compliance Backlog
- [ ] Split all files over 280 lines into smaller component modules (currently 51 files exceed limit; largest offenders: `components/stream/AuctionSection.tsx`, `app/checkout/cart.tsx`, `app/seller/onboarding/index.tsx`)

---

## Phase 2: Auth Flow

### 2.1 Auth Layout
- [x] Refactor `app/(auth)/_layout.tsx`
  - [x] Simple layout without tabs
  - [x] Consistent background color (#F2F1F8)
  - [x] Keep under 280 lines (split if needed)

### 2.2 Landing Screen
- [x] Refactor `app/(auth)/landing.tsx`
  - [x] Welcome message with brand colors
  - [x] Logo/illustration
  - [x] Login button (primary)
  - [x] Register button (outline)
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new Button, Text components

### 2.3 Login Screen
- [x] Refactor `app/(auth)/login.tsx`
  - [x] Email input with validation
  - [x] Password input with visibility toggle
  - [x] Login button with loading state
  - [x] "Forgot password?" link
  - [x] "Don't have an account? Register" link
  - [x] Error handling with toast/alert
  - [ ] Social login buttons (if applicable)
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new Input, Button, Text components
  - [x] Use useAuth hook

### 2.4 Register Screen
- [x] Refactor `app/(auth)/register.tsx`
  - [x] Email input
  - [ ] Password input with strength indicator
  - [x] Confirm password input
  - [x] Full name input
  - [x] Terms & conditions checkbox
  - [x] Register button with loading state
  - [x] "Already have an account? Login" link
  - [x] Error handling
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new components
  - [x] Use useAuth hook

### 2.5 Forgot Password Screen
- [x] Refactor `app/(auth)/forgot-password.tsx`
  - [x] Email input
  - [x] Submit button
  - [x] Success state
  - [x] Back to login link
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new components
  - [x] Use useAuth hook

### 2.6 Verify Email Screen
- [x] Refactor `app/(auth)/verify-email.tsx`
  - [x] OTP/Verification code input
  - [x] Resend code functionality
  - [x] Verify button
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new components
  - [x] Use useAuth hook

### 2.7 Update Password Screen
- [x] Refactor `app/(auth)/update-password.tsx`
  - [x] New password input
  - [x] Confirm password input
  - [x] Update button
  - [x] Success redirect
  - [x] Keep under 280 lines
  - [x] Remove old styling
  - [x] Use new components
  - [x] Use useAuth hook

---

## Phase 3: Main Tab Screens

### 3.1 Tab Layout
- [x] Refactor `app/(tabs)/_layout.tsx`
  - [x] Custom bottom tab bar with brand colors
  - [x] Icons for each tab
  - [x] Active tab highlighting (#6391F2)
  - [x] Keep under 280 lines

### 3.2 Home Screen
- [x] Refactor `app/(tabs)/index.tsx`
  - [x] Split into components:
    - [x] `components/home/HeroBanner.tsx` - Gradient hero with brand colors
    - [x] `components/home/CategoryFilter.tsx` - Horizontal category list
    - [x] `components/home/StreamCard.tsx` - Individual stream card
    - [x] `components/home/ProductCard.tsx` - Individual product card
    - [x] `components/home/StreamGrid.tsx` - Grid of streams
    - [x] `components/home/ProductGrid.tsx` - Grid of products
  - [x] Tab switcher: Shows / Products
  - [x] Pull-to-refresh
  - [x] Empty states
  - [x] Loading skeletons
  - [x] Keep main file under 280 lines
  - [x] Remove old styling
  - [x] Use TanStack Query for data
  - [x] Use new components

### 3.3 Categories Screen
- [ ] Refactor `app/(tabs)/categories.tsx`
  - [ ] Grid of category cards
  - [ ] Category images/icons
  - [ ] Subcategory support
  - [ ] Search within categories
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query
  - [ ] Use new components

### 3.4 Cart Screen
- [ ] Refactor `app/(tabs)/cart.tsx`
  - [ ] Split into components:
    - [ ] `components/cart/CartItem.tsx` - Individual cart item
    - [ ] `components/cart/CartSummary.tsx` - Price breakdown
    - [ ] `components/cart/EmptyCart.tsx` - Empty state
  - [ ] Quantity controls (+/-)
  - [ ] Remove item functionality
  - [ ] Price calculations
  - [ ] Checkout button
  - [ ] Keep main file under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query
  - [ ] Use new components

### 3.5 Profile Screen
- [ ] Refactor `app/(tabs)/profile.tsx`
  - [ ] User avatar and info
  - [ ] Stats (followers, following, orders)
  - [ ] Menu items:
    - [ ] My Orders
    - [ ] My Bids
    - [ ] Saved Items
    - [ ] Become a Seller
    - [ ] Settings
    - [ ] Help & Support
    - [ ] Logout
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use new components

### 3.6 Sell Tab
- [ ] Refactor `app/(tabs)/sell.tsx`
  - [ ] Redirect to seller dashboard if seller
  - [ ] Show "Become a Seller" CTA if not
  - [ ] Keep under 280 lines

### 3.7 Search Screen
- [ ] Refactor `app/(tabs)/search.tsx`
  - [ ] Search input
  - [ ] Recent searches
  - [ ] Search results (products/streams)
  - [ ] Filters
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 3.8 Inbox Screen
- [ ] Refactor `app/(tabs)/inbox.tsx`
  - [ ] Messages tab
  - [ ] Notifications tab
  - [ ] List of conversations
  - [ ] Unread indicators
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 3.9 My Bids Screen
- [ ] Refactor `app/(tabs)/my-bids.tsx`
  - [ ] Active bids
  - [ ] Won auctions
  - [ ] Lost auctions
  - [ ] Bid history
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 3.10 Checkout Screen
- [ ] Refactor `app/(tabs)/checkout.tsx`
  - [ ] Split into components:
    - [ ] `components/checkout/ShippingForm.tsx`
    - [ ] `components/checkout/PaymentForm.tsx`
    - [ ] `components/checkout/OrderSummary.tsx`
  - [ ] Shipping address
  - [ ] Payment method
  - [ ] Order items
  - [ ] Price breakdown
  - [ ] Place order button
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

---

## Phase 4: Product & Commerce

### 4.1 Product Detail Screen
- [ ] Refactor `app/product/[id].tsx`
  - [ ] Split into components:
    - [ ] `components/product/ImageGallery.tsx` - Product images
    - [ ] `components/product/ProductInfo.tsx` - Title, price, description
    - [ ] `components/product/SellerCard.tsx` - Seller info
    - [ ] `components/product/ActionButtons.tsx` - Add to cart, Buy now
    - [ ] `components/product/Reviews.tsx` - Product reviews
    - [ ] `components/product/RelatedProducts.tsx` - Similar items
  - [ ] Image zoom/pinch
  - [ ] Size/color selection (if applicable)
  - [ ] Quantity selector
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query
  - [ ] Use new components

### 4.2 Auction Detail Screen
- [ ] Refactor `app/auction/[id].tsx`
  - [ ] Product info
  - [ ] Current bid display
  - [ ] Bid history
  - [ ] Countdown timer
  - [ ] Place bid input
  - [ ] Auto-bid functionality
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 4.3 Order Checkout Screen
- [ ] Refactor `app/checkout/[orderId].tsx`
  - [ ] Order details
  - [ ] Shipping address
  - [ ] Payment processing
  - [ ] Escrow information
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 4.4 Cart Checkout Screen
- [ ] Refactor `app/checkout/cart.tsx`
  - [ ] Cart items
  - [ ] Shipping selection
  - [ ] Payment
  - [ ] Order confirmation
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

---

## Phase 5: Streaming

### 5.1 Stream Viewer Screen
- [ ] Refactor `app/stream/[id].tsx`
  - [ ] Split into components:
    - [ ] `components/stream/VideoPlayer.tsx` - Video stream
    - [ ] `components/stream/ChatOverlay.tsx` - Live chat
    - [ ] `components/stream/ProductShowcase.tsx` - Featured products
    - [ ] `components/stream/AuctionPanel.tsx` - Auction controls
    - [ ] `components/stream/ViewerCount.tsx` - Live viewer count
  - [ ] Full-screen video
  - [ ] Chat input
  - [ ] Product cards overlay
  - [ ] Bid button (if auction)
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query
  - [ ] Use new components

### 5.2 Stream Components
- [ ] Refactor all stream components in `components/stream/`
- [ ] Ensure each is under 280 lines
- [ ] Update to use new theme
- [ ] Update to use TanStack Query where applicable

---

## Phase 6: Seller Dashboard

### 6.1 Seller Layout
- [ ] Refactor `app/seller/_layout.tsx`
  - [ ] Seller navigation drawer/tabs
  - [ ] Keep under 280 lines

### 6.2 Seller Dashboard
- [ ] Refactor `app/seller/dashboard.tsx`
  - [ ] Stats cards (sales, orders, views)
  - [ ] Recent orders
  - [ ] Active streams
  - [ ] Quick actions
  - [ ] Keep under 280 lines
  - [ ] Remove old styling
  - [ ] Use TanStack Query

### 6.3 Seller Registration
- [ ] Refactor `app/seller/register.tsx`
  - [ ] Business information form
  - [ ] Document upload
  - [ ] Review step
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 6.4 Seller Onboarding
- [ ] Refactor `app/seller/onboarding/index.tsx`
  - [ ] Multi-step onboarding flow
  - [ ] Progress indicator
  - [ ] Keep under 280 lines

### 6.5 Inventory Management
- [ ] Refactor `app/seller/inventory.tsx`
  - [ ] Product list
  - [ ] Search/filter
  - [ ] Add/Edit/Delete actions
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 6.6 Orders Management
- [ ] Refactor `app/seller/orders.tsx`
  - [ ] Orders list
  - [ ] Filter by status
  - [ ] Order details
  - [ ] Keep under 280 lines

### 6.7 Order Detail
- [ ] Refactor `app/seller/order/[id].tsx`
  - [ ] Order information
  - [ ] Customer details
  - [ ] Shipping info
  - [ ] Actions (ship, refund, etc.)
  - [ ] Keep under 280 lines

### 6.8 Earnings/Sales
- [ ] Refactor `app/seller/earnings.tsx`
  - [ ] Revenue charts
  - [ ] Payout history
  - [ ] Balance display
  - [ ] Keep under 280 lines

### 6.9 Streams Management
- [ ] Refactor `app/seller/streams.tsx`
  - [ ] List of streams
  - [ ] Create/Edit/Delete
  - [ ] Stream analytics
  - [ ] Keep under 280 lines

### 6.10 Auctions Management
- [ ] Refactor `app/seller/auctions.tsx`
  - [ ] List of auctions
  - [ ] Create/Edit/End auctions
  - [ ] Bid history
  - [ ] Keep under 280 lines

### 6.11 Create Stream
- [ ] Refactor `app/seller/create-stream.tsx`
  - [ ] Stream details form
  - [ ] Product selection
  - [ ] Schedule settings
  - [ ] Keep under 280 lines

### 6.12 Create Auction
- [ ] Refactor `app/seller/create-auction.tsx`
  - [ ] Product selection
  - [ ] Starting bid
  - [ ] Reserve price
  - [ ] Duration
  - [ ] Keep under 280 lines

### 6.13 Go Live
- [ ] Refactor `app/seller/go-live.tsx`
  - [ ] Camera preview
  - [ ] Stream settings
  - [ ] Go live button
  - [ ] Keep under 280 lines

### 6.14 Add Product
- [ ] Refactor `app/seller/add-product.tsx`
  - [ ] Product details form
  - [ ] Image upload
  - [ ] Category selection
  - [ ] Pricing
  - [ ] Inventory
  - [ ] Keep under 280 lines

### 6.15 Stripe Setup
- [ ] Refactor `app/seller/stripe-setup.tsx`
  - [ ] Stripe Connect onboarding
  - [ ] Payout settings
  - [ ] Keep under 280 lines

### 6.16 Sales History
- [ ] Refactor `app/seller/sales.tsx`
  - [ ] Sales list
  - [ ] Filter/search
  - [ ] Export functionality
  - [ ] Keep under 280 lines

### 6.17 Stream Management
- [ ] Refactor `app/seller/stream/[id].tsx`
  - [ ] Stream details
  - [ ] Products in stream
  - [ ] Analytics
  - [ ] Keep under 280 lines

### 6.18 Edit Stream
- [ ] Refactor `app/seller/stream/edit/[id].tsx`
  - [ ] Edit stream details
  - [ ] Add/remove products
  - [ ] Keep under 280 lines

### 6.19 Add Product to Stream
- [ ] Refactor `app/seller/stream/add-product/[id].tsx`
  - [ ] Product selection
  - [ ] Featured product toggle
  - [ ] Keep under 280 lines

---

## Phase 7: Social & Messaging

### 7.1 User Profile
- [ ] Refactor `app/user/[id].tsx`
  - [ ] Public profile view
  - [ ] User's products/streams
  - [ ] Follow/Unfollow button
  - [ ] Message button
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 7.2 Messages
- [ ] Refactor `app/messages/_layout.tsx`
  - [ ] Messages layout

- [ ] Refactor `app/messages/[id].tsx`
  - [ ] Conversation view
  - [ ] Message bubbles
  - [ ] Input field
  - [ ] Image attachments
  - [ ] Keep under 280 lines

- [ ] Refactor `app/messages/new.tsx`
  - [ ] User search
  - [ ] New message form
  - [ ] Keep under 280 lines

### 7.3 Social Features
- [ ] Refactor `app/social/_layout.tsx`
  - [ ] Social layout

- [ ] Refactor `app/social/followers/[id].tsx`
  - [ ] Followers list
  - [ ] Follow/Unfollow actions
  - [ ] Keep under 280 lines

- [ ] Refactor `app/social/following/[id].tsx`
  - [ ] Following list
  - [ ] Unfollow actions
  - [ ] Keep under 280 lines

---

## Phase 8: Onboarding

### 8.1 Onboarding Layout
- [ ] Refactor `app/(onboarding)/_layout.tsx`
  - [ ] Progress indicator
  - [ ] Keep under 280 lines

### 8.2 Profile Setup
- [ ] Refactor `app/(onboarding)/profile-setup.tsx`
  - [ ] Avatar upload
  - [ ] Username
  - [ ] Bio
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 8.3 Age Verification
- [ ] Refactor `app/(onboarding)/age-verification.tsx`
  - [ ] Date of birth input
  - [ ] Age validation
  - [ ] Guardian consent (if under 18)
  - [ ] Keep under 280 lines

### 8.4 Interests
- [ ] Refactor `app/(onboarding)/interests.tsx`
  - [ ] Category selection
  - [ ] Interest tags
  - [ ] Keep under 280 lines

### 8.5 Notifications
- [ ] Refactor `app/(onboarding)/notifications.tsx`
  - [ ] Notification preferences
  - [ ] Push notification permissions
  - [ ] Keep under 280 lines

### 8.6 Success
- [ ] Refactor `app/(onboarding)/success.tsx`
  - [ ] Success animation
  - [ ] Get started button
  - [ ] Keep under 280 lines

---

## Phase 9: Settings & Misc

### 9.1 Settings
- [ ] Refactor `app/settings/index.tsx`
  - [ ] Account settings
  - [ ] Notification settings
  - [ ] Privacy settings
  - [ ] Payment methods
  - [ ] Shipping addresses
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 9.2 Change Password
- [ ] Refactor `app/settings/change-password.tsx`
  - [ ] Current password
  - [ ] New password
  - [ ] Confirm password
  - [ ] Keep under 280 lines

### 9.3 Privacy Settings
- [ ] Refactor `app/settings/privacy.tsx`
  - [ ] Privacy options
  - [ ] Blocked users
  - [ ] Data export
  - [ ] Delete account
  - [ ] Keep under 280 lines

### 9.4 Notifications Center
- [ ] Refactor `app/notifications.tsx`
  - [ ] Notifications list
  - [ ] Mark all as read
  - [ ] Delete notifications
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

### 9.5 Help & Support
- [ ] Refactor `app/help-support.tsx`
  - [ ] FAQ section
  - [ ] Contact support
  - [ ] Report a problem
  - [ ] Keep under 280 lines
  - [ ] Remove old styling

---

## Phase 10: Root & Layout

### 10.1 Root Layout
- [ ] Refactor `app/_layout.tsx`
  - [ ] Theme provider
  - [ ] Query client provider
  - [ ] Auth provider
  - [ ] Navigation setup
  - [ ] Keep under 280 lines

### 10.2 Constants
- [ ] Update `constants/colors.ts`
  - [ ] Remove old colors
  - [ ] Add new color constants

### 10.3 Store Updates
- [ ] Refactor `stores/authStore.ts`
  - [ ] Update to use new patterns
  - [ ] Keep under 280 lines

- [ ] Refactor `stores/cartStore.ts`
  - [ ] Update to use new patterns
  - [ ] Keep under 280 lines

- [ ] Refactor `stores/streamStore.ts`
  - [ ] Update to use new patterns
  - [ ] Keep under 280 lines

### 10.4 Utility Updates
- [ ] Review and update utilities in `lib/utils/`
- [ ] Ensure all are under 280 lines
- [ ] Update to use new theme colors

---

## Phase 11: Testing & Cleanup

### 11.1 Remove Old Code
- [ ] Delete old component files not in use
- [ ] Remove unused imports
- [ ] Delete commented code
- [ ] Clean up console.logs

### 11.2 Testing
- [ ] Test auth flow end-to-end
- [ ] Test product browsing
- [ ] Test cart and checkout
- [ ] Test streaming
- [ ] Test seller features
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Fix any bugs found

### 11.3 Performance
- [ ] Check bundle size
- [ ] Optimize images
- [ ] Verify no unnecessary re-renders
- [ ] Test on low-end devices

### 11.4 Final Verification
- [ ] All files under 280 lines
- [ ] No StyleSheet usage
- [ ] No inline styles
- [ ] TanStack Query used for all data fetching
- [ ] TypeScript compiles without errors
- [ ] App builds successfully
- [ ] All screens render correctly

---

## Additional Tasks (Add as Needed)

### Bug Fixes
- [ ] Fix bug: ___________
- [ ] Fix bug: ___________

### Features
- [ ] Add feature: ___________
- [ ] Add feature: ___________

### Improvements
- [ ] Improve: ___________
- [ ] Improve: ___________

---

## Progress Tracking

**Total Tasks**: 350+
**Completed**: 0
**Remaining**: 350+

### Phase Progress
- [ ] Phase 1: Foundation (0%)
- [ ] Phase 2: Auth Flow (0%)
- [ ] Phase 3: Main Tabs (0%)
- [ ] Phase 4: Product & Commerce (0%)
- [ ] Phase 5: Streaming (0%)
- [ ] Phase 6: Seller Dashboard (0%)
- [ ] Phase 7: Social & Messaging (0%)
- [ ] Phase 8: Onboarding (0%)
- [ ] Phase 9: Settings & Misc (0%)
- [ ] Phase 10: Root & Layout (0%)
- [ ] Phase 11: Testing & Cleanup (0%)

### Weekly Goals
- **Week 1**: Complete Phase 1 (Foundation + Auth setup)
- **Week 2**: Complete Phase 2-3 (Auth + Main Tabs)
- **Week 3**: Complete Phase 4-6 (Product + Streaming + Seller)
- **Week 4**: Complete Phase 7-10 (Social + Onboarding + Settings + Root)
- **Week 5**: Complete Phase 11 (Testing + Cleanup)

### Notes
_Add notes, blockers, or observations here as you work through the tasks._

---

## Important Rules for AI Assistants

When working on this project, ALWAYS follow these rules:

1. **NEVER change the color scheme** - Use the exact colors from Phase 1.1
2. **NEVER exceed 280 lines per file** - Split into components if needed
3. **ALWAYS use TanStack Query** for data fetching, not useEffect
4. **NEVER use StyleSheet or inline styles** - Use Tailwind classes only
5. **ALWAYS use TypeScript** with proper types
6. **NEVER remove or modify** the structure without explicit permission
7. **ALWAYS follow** the component patterns from Phase 1.2
8. **NEVER add** new dependencies without approval
9. **ALWAYS maintain** existing functionality when refactoring
10. **ALWAYS test** your changes before submitting

## File Modification Rules

When modifying files:
1. Read the existing file first
2. Understand its purpose and structure
3. Make minimal, targeted changes
4. Ensure TypeScript compiles without errors
5. Verify the file is under 280 lines after changes
6. Test on both iOS and Android if possible

---

**Last Updated**: _[Date]_  
**Status**: _[In Progress / On Track / Delayed]_  
**Next Milestone**: _[Next major deliverable]_

**Current Phase**: Phase 1 - Foundation & Setup  
**Current Task**: Setup TanStack Query configuration
