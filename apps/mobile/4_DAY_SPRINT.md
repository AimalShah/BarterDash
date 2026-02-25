# BarterDash Mobile - 4-Day Fix Sprint

> **Goal**: Fix critical architecture issues, migrate to TanStack Query, convert StyleSheet to Tailwind, and clean up codebase.

---

## Day 1: Critical Architecture Issues

| # | Task | Files | Status |
|---|------|-------|--------|
| 1.1 | Fix failing test: Add Jest module alias for `@/lib/supabase` | `jest.config.js` or `package.json` | [ ] |
| 1.2 | Split `AuctionSection.tsx` (1000 lines) into 4 components | `components/stream/AuctionSection.tsx` | [ ] |
| 1.3 | Split `checkout/cart.tsx` (887 lines) into 3 components | `app/checkout/cart.tsx` | [ ] |
| 1.4 | Split `seller/onboarding/index.tsx` (807 lines) into smaller components | `app/seller/onboarding/index.tsx` | [ ] |
| 1.5 | Remove 140+ unused files listed in `UNUSED_FILES.md` | Various | [ ] |

### Files to Delete (from UNUSED_FILES.md):
- [ ] `theme.ts` (root)
- [ ] `constants/config.ts`
- [ ] `design/stitch_home_feed/` folder (~60 files)
- [ ] All unused components in `components/home/`
- [ ] All unused components in `components/profile/`
- [ ] All unused components in `components/user/`
- [ ] All unused components in `components/notifications/`
- [ ] All unused components in `components/stream/`
- [ ] All unused components in `components/seller/`
- [ ] All unused components in `components/payment/`

---

## Day 2: Data Fetching Migration (useEffect → TanStack Query)

| # | Task | File | Line | Status |
|---|------|------|------|--------|
| 2.1 | Migrate `loadProfile()` to useQuery | `app/user/[id].tsx` | 26 | [ ] |
| 2.2 | Migrate `fetchAuctionDetails()` to useQuery | `app/auction/[id].tsx` | 22 | [ ] |
| 2.3 | Migrate cart fetch to useCart hook | `app/(tabs)/cart.tsx` | 17 | [ ] |
| 2.4 | Migrate `fetchCartTotal()` to useCart hook | `app/(tabs)/checkout.tsx` | 71 | [ ] |
| 2.5 | Migrate `fetchBids()` to useBids hook | `app/(tabs)/my-bids.tsx` | 50 | [ ] |
| 2.6 | Migrate profile fetch to useUser hook | `app/(tabs)/profile.tsx` | 31 | [ ] |
| 2.7 | Migrate earnings fetch to useDashboard hook | `app/seller/earnings.tsx` | 50 | [ ] |
| 2.8 | Migrate inventory fetch to useProducts hook | `app/seller/inventory.tsx` | 19 | [ ] |
| 2.9 | Migrate `fetchStreams()` to useStreams hook | `app/seller/streams.tsx` | 63 | [ ] |
| 2.10 | Migrate notifications fetch to useNotifications hook | `app/notifications.tsx` | 44 | [ ] |
| 2.11 | Migrate stream edit fetch | `app/seller/stream/edit/[id].tsx` | 75 | [ ] |
| 2.12 | Migrate sales fetch | `app/seller/sales.tsx` | 18 | [ ] |
| 2.13 | Migrate products fetch for add-product | `app/seller/add-product.tsx` | 24 | [ ] |
| 2.14 | Migrate order fetch | `app/seller/order/[id].tsx` | 41 | [ ] |
| 2.15 | Migrate Stripe status fetch | `app/seller/stripe-setup.tsx` | 37 | [ ] |
| 2.16 | Migrate checkout fetch | `app/checkout/[orderId].tsx` | 74 | [ ] |
| 2.17 | Migrate auctions fetch | `app/seller/auctions.tsx` | 26 | [ ] |

---

## Day 3: StyleSheet → Tailwind Migration

| # | Task | File | Lines of Styles | Status |
|---|------|------|-----------------|--------|
| 3.1 | Convert StyleSheet to Tailwind | `app/(tabs)/index.tsx` | 213 | [ ] |
| 3.2 | Convert StyleSheet to Tailwind | `app/checkout/cart.tsx` | ~100 | [ ] |
| 3.3 | Convert StyleSheet to Tailwind | `app/auction/[id].tsx` | ~80 | [ ] |
| 3.4 | Convert StyleSheet to Tailwind | `components/stream/ViewerStreamViewStream.tsx` | ~60 | [ ] |
| 3.5 | Convert StyleSheet to Tailwind | `components/stream/InstagramLiveChat.tsx` | ~50 | [ ] |
| 3.6 | Convert StyleSheet to Tailwind | `components/notifications/NotificationBell.tsx` | ~40 | [ ] |
| 3.7 | Convert StyleSheet to Tailwind | `components/stream/AuctionTimer.tsx` | ~30 | [ ] |
| 3.8 | Convert StyleSheet to Tailwind | `components/ui/EmptyState.tsx` | ~20 | [ ] |

### Replace Inline Styles:
| # | File | Approx Count | Status |
|---|------|--------------|--------|
| 3.9 | `components/payment/PaymentMethodValidation.tsx` | ~30 | [ ] |
| 3.10 | `app/(onboarding)/success.tsx` | ~15 | [ ] |
| 3.11 | `components/stream/SellerStreamControls.tsx` | ~10 | [ ] |
| 3.12 | `components/notifications/StreamNotificationToast.tsx` | ~8 | [ ] |
| 3.13 | `app/checkout/cart.tsx` | ~5 | [ ] |

### Add React.memo to Heavy Components:
| # | Component | File | Status |
|---|-----------|------|--------|
| 3.14 | `AuctionSection` (after split) | `components/stream/AuctionSection.tsx` | [ ] |
| 3.15 | `SellerStreamControls` | `components/stream/SellerStreamControls.tsx` | [ ] |
| 3.16 | `EnhancedCheckout` | `components/payment/EnhancedCheckout.tsx` | [ ] |
| 3.17 | `NotificationBell` | `components/notifications/NotificationBell.tsx` | [ ] |
| 3.18 | `StreamCard` (home) | `components/home/StreamCard.tsx` | [ ] |

---

## Day 4: Error Handling, Performance & Cleanup

### Error Handling:
| # | Task | File | Line | Status |
|---|------|------|------|--------|
| 4.1 | Add error logging to silent catch | `app/user/[id].tsx` | 40-42, 52, 74 | [ ] |
| 4.2 | Add error logging to silent catch | `app/notifications.tsx` | 46 | [ ] |
| 4.3 | Add error logging to silent catch | `app/seller/earnings.tsx` | 57-58 | [ ] |
| 4.4 | Add error logging to silent catch | `app/(tabs)/profile.tsx` | 43 | [ ] |
| 4.5 | Add error logging to silent catch | `components/home/ForYouSection.tsx` | 21 | [ ] |
| 4.6 | Add retry UI for error state | `app/auction/[id].tsx` | - | [ ] |
| 4.7 | Add user feedback for errors | `app/seller/auctions.tsx` | - | [ ] |

### Remove Debug Logs:
| # | File | Line | Status |
|---|------|------|--------|
| 4.8 | `app/(tabs)/index.tsx` | 55 | [ ] |
| 4.9 | `components/stream/AuctionOverlay.tsx` | 140 | [ ] |
| 4.10 | `components/stream/StreamCard.tsx` | 66, 81 | [ ] |
| 4.11 | `components/guards/AuthGuard.tsx` | 58 | [ ] |
| 4.12 | `hooks/useNotifications.ts` | Various | [ ] |
| 4.13 | `lib/connection/ConnectionManager.ts` | Various | [ ] |

### Performance Optimizations:
| # | Task | Files | Status |
|---|------|-------|--------|
| 4.14 | Add `getItemLayout` to FlatLists | List screens | [ ] |
| 4.15 | Add `initialNumToRender` to FlatLists | List screens | [ ] |
| 4.16 | Add `maxToRenderPerBatch` to FlatLists | List screens | [ ] |
| 4.17 | Wrap handlers in `useCallback` | Various | [ ] |
| 4.18 | Fix useEffect dependency in `useBidding.ts` | Line 134 | [ ] |
| 4.19 | Add proper cleanup to effects | `ViewerStreamViewStream.tsx` | [ ] |

### Final Tasks:
| # | Task | Status |
|---|------|--------|
| 4.20 | Add React Query DevTools (dev only) | [ ] |
| 4.21 | Run full test suite and verify all pass | [ ] |
| 4.22 | Run TypeScript check (`npx tsc --noEmit`) | [ ] |
| 4.23 | Manual test auth flow end-to-end | [ ] |
| 4.24 | Manual test cart and checkout | [ ] |

---

## Quick Wins (Do Anytime)

- [ ] Create `useOrders` hook (missing)
- [ ] Create `useSeller` hook (missing)
- [ ] Add password strength indicator to register screen
- [ ] Add social login buttons to login screen
- [ ] Update `components.json` for react-native-reusables

---

## Files Exceeding 280 Lines (Split Priority)

| File | Lines | Priority |
|------|-------|----------|
| `components/stream/AuctionSection.tsx` | 1000 | P0 |
| `app/checkout/cart.tsx` | 887 | P0 |
| `app/seller/onboarding/index.tsx` | 807 | P0 |
| `app/auction/[id].tsx` | 720 | P1 |
| `components/stream/SellerStreamControls.tsx` | 699 | P1 |
| `app/(tabs)/checkout.tsx` | 603 | P1 |
| `components/payment/EnhancedCheckout.tsx` | 590 | P1 |
| `components/stream/ViewerStreamViewStream.tsx` | 547 | P2 |
| `app/checkout/[orderId].tsx` | 544 | P2 |
| `components/payment/PaymentMethodValidation.tsx` | 543 | P2 |
| `app/seller/stream/[id].tsx` | 476 | P2 |
| `components/stream/SellerStreamViewStream.tsx` | 445 | P2 |
| `app/(tabs)/index.tsx` | 437 | P2 |
| `constants/theme.ts` | 427 | P2 |
| `components/payment/PaymentStatusTracker.tsx` | 416 | P2 |
| `components/ExploreView.tsx` | 410 | P2 |
| `app/product/[id].tsx` | 407 | P2 |
| `app/seller/add-product.tsx` | 399 | P2 |
| `app/seller/order/[id].tsx` | 397 | P2 |

---

## Progress Tracking

**Total Tasks**: ~45
**Completed**: 0
**Remaining**: ~45

### Daily Progress
- [ ] Day 1: Critical Architecture (5 tasks)
- [ ] Day 2: TanStack Query Migration (17 tasks)
- [ ] Day 3: StyleSheet to Tailwind (18 tasks)
- [ ] Day 4: Error Handling & Cleanup (24 tasks)

---

## Commands to Run

```bash
# TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

**Created**: February 25, 2026
**Status**: Not Started
**Target Completion**: 4 Days
