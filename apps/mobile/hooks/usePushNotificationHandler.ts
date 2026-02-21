import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '../context/ToastContext';

/**
 * Configure how notifications are handled when the app is in the foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook to handle push notification responses and setup
 * This should be used at the root of the app
 */
export function usePushNotificationHandler() {
  const router = useRouter();
  const { showToast } = useToast();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      setupAndroidNotificationChannel();
    }

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📨 Notification received in foreground:', notification);
        
        const { title, body } = notification.request.content;
        
        // Show toast for foreground notifications
        if (body) {
          showToast(body, 'info');
        }
      }
    );

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        
        const { data } = response.notification.request.content;
        
        // Handle navigation based on notification data
        if (data) {
          handleNotificationNavigation(data, router);
        }
      }
    );

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('🚀 App opened from notification:', response);
        const { data } = response.notification.request.content;
        if (data) {
          handleNotificationNavigation(data, router);
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router, showToast]);
}

/**
 * Set up Android notification channel
 */
async function setupAndroidNotificationChannel() {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });

  // Additional channels for different notification types
  await Notifications.setNotificationChannelAsync('auctions', {
    name: 'Auctions',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD700',
  });

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00FF00',
  });

  await Notifications.setNotificationChannelAsync('streams', {
    name: 'Live Streams',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF0000',
  });

  console.log('✅ Android notification channels set up');
}

/**
 * Handle navigation based on notification data
 */
function handleNotificationNavigation(data: any, router: any) {
  console.log('Handling notification navigation:', data);

  switch (data.type) {
    case 'stream_live':
      if (data.streamId) {
        router.push(`/stream/${data.streamId}`);
      }
      break;
    
    case 'auction_won':
    case 'auction_ended':
      if (data.orderId) {
        router.push(`/checkout/${data.orderId}`);
      } else if (data.auctionId) {
        router.push(`/auction/${data.auctionId}`);
      }
      break;
    
    case 'bid_placed':
    case 'outbid':
      if (data.auctionId) {
        router.push(`/auction/${data.auctionId}`);
      }
      break;
    
    case 'new_message':
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else if (data.userId) {
        router.push(`/messages/${data.userId}`);
      }
      break;
    
    case 'order_update':
    case 'payment_received':
      if (data.orderId) {
        router.push(`/checkout/${data.orderId}`);
      }
      break;
    
    case 'seller_approved':
      router.push('/seller/dashboard');
      break;
    
    case 'follower_activity':
      if (data.userId) {
        router.push(`/user/${data.userId}`);
      }
      break;
    
    default:
      console.log('Unknown notification type:', data.type);
  }
}

export default usePushNotificationHandler;
