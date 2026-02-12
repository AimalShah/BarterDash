# Purchase Flow Issues - Bug Report

## Status Update (2026-02-12)

- `SECURE CHECKOUT` now uses in-app Stripe Payment Sheet (`apps/mobile/app/(tabs)/checkout.tsx`) instead of browser checkout session.
- Escrow checkout retry path fixed for pending escrows to avoid blocking retries (`apps/backend/src/services/escrow.service.ts`).
- Escrow webhook handling now captures manual intents on `payment_intent.amount_capturable_updated` (`apps/backend/src/services/payments.service.ts`).
- Error messages in secure checkout now surface backend validation details for easier debugging (`apps/mobile/app/checkout/[orderId].tsx`).

## Executive Summary

The purchase flow in the BarterDash mobile application has several critical issues that prevent users from completing transactions. These issues affect both the checkout process and product purchasing functionality across marketplace and auction products.

**Severity**: Critical - Blocks purchases

---

## Issue 1: Critical Bug - Missing Checkout Payment Handler

### Description
The checkout screen attempts to call a non-existent function `handlePayWithEscrow()` when the user clicks the Pay button, causing the checkout process to fail.

### File Location
`apps/mobile/app/checkout/[orderId].tsx`

### Line Reference
- **Line 494**: Button onPress calls non-existent function
- **Line 168**: Actual working function exists with different name

### Current Code (Broken)
```tsx
<Button
  size="xl"
  bg={COLORS.primaryGold}
  onPress={handlePayWithEscrow}  // FUNCTION DOES NOT EXIST
  isDisabled={processing}
>
```

### Existing Working Function
```tsx
const handleCompletePayment = async () => {
  // Working payment implementation
  // 1. Update order with shipping address
  // 2. Create escrow payment
  // 3. Initialize Payment Sheet
  // 4. Present Payment Sheet
  // 5. Handle success/error
};
```

### Impact
- **Buy Now for auctions**: Broken
- **Cart checkout**: Potentially affected if routing through this screen
- **User experience**: Pay button does nothing when clicked

### Root Cause
Function naming mismatch - developer created `handleCompletePayment()` but referenced `handlePayWithEscrow()` in the UI.

### Priority
**CRITICAL** - Blocks all purchase completion

---

## Issue 2: Missing "Add to Bag" Handler

### Description
The Product Detail screen has an "Add to Bag" button for marketplace products, but the onPress handler is empty, preventing users from adding products to their cart.

### File Location
`apps/mobile/app/product/[id].tsx`

### Line Reference
Lines 227-237

### Current Code (Broken)
```tsx
<Button
  onPress={() => { }}  // EMPTY HANDLER
  flex={2}
  h={56}
  bg={COLORS.primaryGold}
  rounded="$sm"
>
  <ButtonText color={COLORS.luxuryBlack} fontWeight="$black" textTransform="uppercase">
    Add to Bag
  </ButtonText>
</Button>
```

### Expected Behavior
When clicked, should call the cart service to add the product to the user's cart:
```tsx
const handleAddToBag = async () => {
  try {
    await cartService.addItem(product.id);
    Alert.alert('Success', 'Product added to bag');
  } catch (error) {
    Alert.alert('Error', 'Failed to add product to bag');
  }
};
```

### Impact
- **Marketplace products**: Cannot be added to cart
- **Cart system**: Backend exists but unreachable from product detail
- **User experience**: Button appears functional but does nothing

### Priority
**HIGH** - Blocks cart-based purchases

---

## Issue 3: Missing "Buy Now" Button for Marketplace Products

### Description
Marketplace products lack a direct "Buy Now" button for immediate purchase. Users can only add items to a cart but cannot purchase a single product immediately.

### File Location
`apps/mobile/app/product/[id].tsx`

### Line Reference
Lines 206-239 (Bottom Action Bar)

### Current Behavior
```tsx
{isOwner ? (
  <Button onPress={() => { }}>Edit Listing</Button>
) : (
  <Button onPress={() => { }}>Add to Bag</Button>
)}
```

### Missing Functionality
- No "Buy Now" button alongside "Add to Bag"
- No way to create a direct order from product page
- Users must go through cart flow for single purchases

### Expected Behavior
```tsx
{isOwner ? (
  <Button onPress={() => { }}>Edit Listing</Button>
) : (
  <HStack space="md" flex={2}>
    <Button variant="outline" onPress={handleAddToBag}>Add to Bag</Button>
    <Button bg={COLORS.primaryGold} onPress={handleBuyNow}>Buy Now</Button>
  </HStack>
)}
```

### Impact
- **Purchase options**: Limited to cart-based flow only
- **User experience**: Extra steps required for single purchases
- **Conversion**: Users may abandon cart for impulse purchases

### Priority
**MEDIUM** - Reduces purchase convenience

---

## Issue 4: Missing Backend Direct Buy Endpoint

### Description
The backend lacks an API endpoint to create an order directly from a product without going through the cart flow.

### Current Backend Endpoints
- `POST /cart` - Add item to cart
- `POST /cart/checkout` - Create order from cart items
- `GET /products/:id` - Get product details
- `POST /products` - Create product (seller only)

### Missing Endpoint
`POST /products/:id/buy` - Direct purchase endpoint

### Expected Functionality
```typescript
// Mobile call
const handleBuyNow = async () => {
  const order = await productsService.buyNow(product.id, shippingAddress);
  router.push(`/checkout/${order.id}`);
};

// Backend handler
router.post(
  '/:id/buy',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ordersService.createDirectOrder(
      req.user!.id,
      req.params.id,
      req.body.shippingAddress
    );
    res.status(201).json({ success: true, data: result.value });
  })
);
```

### Impact
- **Direct purchases**: Not possible without cart
- **Checkout flow**: Must go through cart even for single items
- **API completeness**: Gap in purchase flow endpoints

### Priority
**MEDIUM** - Backend enhancement needed for frontend feature

---

## Issue 5: Auction "Buy Now" Not Implemented in UI

### Description
Auction products can have a `buyout_price` field, but the UI doesn't display a "Buy Now" button for instant purchase at that price.

### File Location
`apps/mobile/app/product/[id].tsx`

### Line Reference
Lines 134-149, 227-237

### Current Code
```tsx
<Text color={COLORS.primaryGold} size="4xl" fontWeight="$black">
  ${product.price || (product as any).current_price || '0.00'}
</Text>
<Text color={COLORS.textMuted} size="sm" fontWeight="$bold" textTransform="uppercase">
  {(product as any).status === 'live' ? 'Current bid' : 'Listing Price'}
</Text>

// Button always shows:
<ButtonText>
  {(product as any).status === 'live' ? 'Place Bid' : 'Add to Bag'}
</ButtonText>
```

### Missing Logic
```tsx
{auction.buyout_price && (
  <Button bg={COLORS.successGreen} onPress={handleBuyNowNow}>
    Buy Now - ${auction.buyout_price}
  </Button>
)}
```

### Backend Support
- Database schema supports `buyout_price` (confirmed in schema.ts)
- Frontend type definition includes `buyout_price` (line 182)
- **Missing**: UI integration and API endpoint

### Impact
- **Auction users**: Cannot use "Buy Now" feature even when available
- **Seller intent**: May set buyout price expecting this functionality
- **User expectations**: Standard e-commerce behavior not met

### Priority
**MEDIUM** - Feature gap in auction flow

---

## System Overview

### Working Components
| Component | Status | Notes |
|-----------|--------|-------|
| Cart Backend | ✅ Working | `POST /cart`, `DELETE /cart`, `GET /cart` |
| Cart Calculate | ✅ Working | `GET /cart/total` |
| Cart Checkout | ✅ Working | `POST /cart/checkout` |
| Orders Backend | ✅ Working | `GET /orders/:id`, `PATCH /orders/:id` |
| Escrow Service | ✅ Working | `POST /escrow/create` |
| Stripe Integration | ✅ Working | Payment sheet initialization |

### Broken Components
| Component | Status | Notes |
|-----------|--------|-------|
| Checkout Pay Button | ❌ Broken | Calls non-existent function |
| Add to Bag Button | ❌ Broken | Empty onPress handler |
| Direct Buy Now | ❌ Missing | No endpoint or UI |
| Auction Buy Now | ❌ Missing | No UI integration |

---

## Recommended Fixes

### Immediate (Critical)
1. **Fix checkout function reference**
   - Rename `handleCompletePayment` → `handlePayWithEscrow`
   - OR change button `onPress={handleCompletePayment}`

### High Priority
2. **Implement "Add to Bag" handler**
   - Add `handleAddToBag` function in product detail
   - Call `cartService.addItem(product.id)`
   - Show success/error feedback

### Medium Priority
3. **Add backend direct buy endpoint**
   - Create `POST /products/:id/buy`
   - Validate product availability
   - Create order and return order ID

4. **Add frontend "Buy Now" button**
   - Add button alongside "Add to Bag"
   - Call direct buy endpoint
   - Navigate to checkout

5. **Add auction "Buy Now" support**
   - Check for `buyout_price` on auctions
   - Show "Buy Now" button with price
   - Create order with buyout price

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/mobile/app/checkout/[orderId].tsx` | Fix function reference |
| `apps/mobile/app/product/[id].tsx` | Add handlers and Buy Now button |
| `apps/mobile/lib/api/services/products.ts` | Add buyNow method |
| `apps/backend/src/routes/products.routes.ts` | Add direct buy endpoint |
| `apps/backend/src/services/orders.service.ts` | Add direct order creation |

---

## Testing Checklist

- [ ] Pay button in checkout screen triggers payment
- [ ] "Add to Bag" adds product to cart
- [ ] "Buy Now" creates order and navigates to checkout
- [ ] Auction "Buy Now" charges buyout price
- [ ] Cart items persist after app close
- [ ] Payment flow completes with escrow
- [ ] Order appears in user's order history
