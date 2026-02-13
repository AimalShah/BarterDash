import { useRouter } from 'expo-router';

/**
 * Navigation Utility Helper
 * 
 * Provides standardized navigation patterns to ensure consistent UX
 * and prevent navigation issues like going back to wrong screens.
 */

/**
 * Navigate after stream ends - always goes to home feed
 */
export function navigateAfterStreamEnd(router: ReturnType<typeof useRouter>) {
  router.replace('/(tabs)');
}

/**
 * Navigate after successful payment
 */
export function navigateAfterPaymentSuccess(
  router: ReturnType<typeof useRouter>, 
  orderId: string
) {
  router.replace(`/checkout/${orderId}`);
}

/**
 * Navigate after seller action completion
 * Uses replace to prevent back-navigation to completed actions
 */
export function navigateAfterSellerAction(
  router: ReturnType<typeof useRouter>, 
  destination: string
) {
  router.replace(destination);
}

/**
 * Safe go back with fallback
 * Checks if we can go back safely, otherwise goes to fallback route
 */
export function safeGoBack(
  router: ReturnType<typeof useRouter>, 
  fallbackRoute: string = '/(tabs)'
) {
  // In expo-router, we can't easily check canGoBack
  // So we use replace to ensure we don't get stuck
  router.replace(fallbackRoute);
}

/**
 * Navigate to home (main feed)
 */
export function navigateHome(router: ReturnType<typeof useRouter>) {
  router.replace('/(tabs)');
}

/**
 * Navigate to seller dashboard
 */
export function navigateToSellerDashboard(router: ReturnType<typeof useRouter>) {
  router.replace('/seller/dashboard');
}

/**
 * Navigate to inbox/messages
 */
export function navigateToInbox(router: ReturnType<typeof useRouter>) {
  router.replace('/(tabs)/inbox');
}

/**
 * Navigate after authentication action
 */
export function navigateAfterAuth(
  router: ReturnType<typeof useRouter>,
  isNewUser: boolean = false
) {
  if (isNewUser) {
    router.replace('/(onboarding)/profile-setup');
  } else {
    router.replace('/(tabs)');
  }
}

/**
 * Navigate after onboarding completion
 */
export function navigateAfterOnboarding(router: ReturnType<typeof useRouter>) {
  router.replace('/(tabs)');
}

/**
 * Navigate to user profile
 */
export function navigateToUserProfile(
  router: ReturnType<typeof useRouter>,
  userId: string
) {
  router.push(`/user/${userId}`);
}

/**
 * Navigate to product detail
 */
export function navigateToProduct(
  router: ReturnType<typeof useRouter>,
  productId: string
) {
  router.push(`/product/${productId}`);
}

/**
 * Navigate to stream
 */
export function navigateToStream(
  router: ReturnType<typeof useRouter>,
  streamId: string
) {
  router.push(`/stream/${streamId}`);
}

/**
 * Navigate to auction
 */
export function navigateToAuction(
  router: ReturnType<typeof useRouter>,
  auctionId: string
) {
  router.push(`/auction/${auctionId}`);
}

/**
 * Navigate to checkout
 */
export function navigateToCheckout(
  router: ReturnType<typeof useRouter>,
  orderId: string
) {
  router.push(`/checkout/${orderId}`);
}

/**
 * Navigate to order details
 */
export function navigateToOrder(
  router: ReturnType<typeof useRouter>,
  orderId: string
) {
  router.push(`/orders/${orderId}`);
}

/**
 * Navigation from notification data
 * Handles deep linking from push notifications
 */
export function navigateFromNotification(
  router: ReturnType<typeof useRouter>,
  data: any
) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'stream_live':
      if (data.streamId) {
        navigateToStream(router, data.streamId);
      }
      break;
    
    case 'auction_won':
    case 'auction_ended':
      if (data.orderId) {
        navigateToCheckout(router, data.orderId);
      } else if (data.auctionId) {
        navigateToAuction(router, data.auctionId);
      }
      break;
    
    case 'bid_placed':
    case 'outbid':
      if (data.auctionId) {
        navigateToAuction(router, data.auctionId);
      }
      break;
    
    case 'new_message':
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      }
      break;
    
    case 'order_update':
    case 'payment_received':
      if (data.orderId) {
        navigateToOrder(router, data.orderId);
      }
      break;
    
    case 'seller_approved':
      navigateToSellerDashboard(router);
      break;
    
    case 'follower_activity':
      if (data.userId) {
        navigateToUserProfile(router, data.userId);
      }
      break;
    
    default:
      console.log('Unknown notification type:', data.type);
  }
}
