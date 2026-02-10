/**
 * useStreamNotifications Hook
 *
 * Provides real-time notifications via Supabase subscriptions
 * Tracks: stream status changes, new bids, auction state changes
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StreamNotification, NotificationType } from '../lib/notifications/streamNotifications';

export function useStreamNotifications(streamId?: string, userId?: string) {
  const [notifications, setNotifications] = useState<StreamNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<StreamNotification | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const mapped = data.map(n => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        streamId: n.stream_id,
        auctionId: n.auction_id,
        productId: n.product_id,
        metadata: n.metadata,
        timestamp: new Date(n.created_at),
        read: n.read,
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    }
  }, [userId]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification: StreamNotification = {
            id: payload.new.id,
            type: payload.new.type as NotificationType,
            title: payload.new.title,
            message: payload.new.message,
            streamId: payload.new.stream_id,
            auctionId: payload.new.auction_id,
            productId: payload.new.product_id,
            metadata: payload.new.metadata,
            timestamp: new Date(payload.new.created_at),
            read: payload.new.read,
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLatestNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, fetchNotifications]);

  // Subscribe to stream-specific events (for in-stream notifications)
  useEffect(() => {
    if (!streamId) return;

    const subscription = supabase
      .channel(`stream_events_${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          // Handle new bid
          console.log('New bid:', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          // Handle auction update
          console.log('Auction updated:', payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [streamId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  const dismissLatest = useCallback(() => {
    setLatestNotification(null);
  }, []);

  return {
    notifications,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    dismissLatest,
    refetch: fetchNotifications,
  };
}

export default useStreamNotifications;
