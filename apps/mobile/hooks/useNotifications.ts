import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { notificationsService, Notification } from '../lib/api/services/notifications';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
  registerPushToken: () => Promise<void>;
  error: string | null;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushTokenRegistered, setPushTokenRegistered] = useState(false);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const [notifs, count] = await Promise.all([
        notificationsService.getNotifications(50, 0),
        notificationsService.getUnreadCount(),
      ]);
      
      console.log('📬 Fetched notifications:', notifs.length, 'unread:', count);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error: any) {
      console.error('❌ Failed to fetch notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Register push token
  const registerPushToken = useCallback(async () => {
    if (!userId || pushTokenRegistered) return;
    
    try {
      if (!Device.isDevice) {
        console.log('📱 Push notifications require a physical device');
        return;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('🚫 Push notification permissions not granted');
        return;
      }

      // Get push token - wrapped in try-catch for Firebase initialization errors
      let token: string;
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (pushError: any) {
        // Firebase not initialized - this is expected in development
        if (pushError.message?.includes('FirebaseApp is not initialized')) {
          console.log('ℹ️ Firebase not initialized. Push notifications disabled. This is normal in development.');
          return;
        }
        throw pushError;
      }
      
      // Register with backend
      const platform = Platform.OS as 'ios' | 'android';
      await notificationsService.registerPushToken(token, platform);
      
      setPushTokenRegistered(true);
      console.log('✅ Push token registered:', token);
    } catch (error) {
      console.error('❌ Failed to register push token:', error);
      // Don't throw - app can still work without push notifications
    }
  }, [userId, pushTokenRegistered]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Setting up notifications for user:', userId);

    // Initial fetch
    fetchNotifications();
    
    // Register push token
    registerPushToken();

    // Subscribe to new notifications via Supabase Realtime
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 New notification received:', payload.new);
          const newNotification = payload.new as Notification;
          
          // Add to list and update unread count
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.isRead) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📝 Notification updated:', payload.new);
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          
          // Recalculate unread count
          if (payload.old.isRead && !updated.isRead) {
            setUnreadCount(prev => prev + 1);
          } else if (!payload.old.isRead && updated.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up notification subscription');
      supabase.removeChannel(subscription);
    };
  }, [userId, fetchNotifications, registerPushToken]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationsService.markAllAsRead();
      
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      
      // Optimistic update
      const notif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
    registerPushToken,
  };
}
