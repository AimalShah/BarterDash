/**
 * Stream Notification Service
 *
 * Handles all stream-related notifications including:
 * - Stream live notifications to followers
 * - Auction start/end notifications
 * - Bid notifications
 * - Auction ending warnings
 */

import { supabase } from '../supabase';

export enum NotificationType {
  STREAM_LIVE = 'stream_live',
  AUCTION_START = 'auction_start',
  AUCTION_END = 'auction_end',
  NEW_BID = 'new_bid',
  AUCTION_ENDING_SOON = 'auction_ending_soon',
  AUCTION_WON = 'auction_won',
  PRODUCT_SOLD = 'product_sold',
  NEW_FOLLOWER = 'new_follower',
}

export interface StreamNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  streamId?: string;
  auctionId?: string;
  productId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  read: boolean;
}

class StreamNotificationService {
  private static instance: StreamNotificationService;

  static getInstance(): StreamNotificationService {
    if (!StreamNotificationService.instance) {
      StreamNotificationService.instance = new StreamNotificationService();
    }
    return StreamNotificationService.instance;
  }

  /**
   * Notify followers when a stream goes live
   */
  async notifyStreamLive(streamId: string, sellerId: string, sellerName: string, streamTitle: string): Promise<void> {
    try {
      // Get all followers of the seller
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', sellerId);

      if (!followers || followers.length === 0) return;

      // Create notifications for each follower
      const notifications = followers.map(follower => ({
        user_id: follower.follower_id,
        type: NotificationType.STREAM_LIVE,
        title: `${sellerName} is live!`,
        message: streamTitle,
        stream_id: streamId,
        metadata: {
          sellerId,
          sellerName,
          streamTitle,
        },
      }));

      // Insert notifications
      await supabase.from('notifications').insert(notifications);

      console.log(`✅ Notified ${followers.length} followers about live stream`);
    } catch (error) {
      console.error('❌ Error notifying followers:', error);
    }
  }

  /**
   * Notify all stream viewers when an auction starts
   */
  async notifyAuctionStart(
    streamId: string,
    auctionId: string,
    productTitle: string,
    startingBid: number
  ): Promise<void> {
    try {
      // Get all viewers in the stream
      const { data: viewers } = await supabase
        .from('stream_viewers')
        .select('user_id')
        .eq('stream_id', streamId)
        .eq('is_active', true);

      if (!viewers || viewers.length === 0) return;

      const notifications = viewers.map(viewer => ({
        user_id: viewer.user_id,
        type: NotificationType.AUCTION_START,
        title: 'Auction Started!',
        message: `${productTitle} - Starting bid: $${startingBid}`,
        stream_id: streamId,
        auction_id: auctionId,
        metadata: {
          productTitle,
          startingBid,
        },
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`✅ Notified ${viewers.length} viewers about auction start`);
    } catch (error) {
      console.error('❌ Error notifying auction start:', error);
    }
  }

  /**
   * Notify seller and other bidders about a new bid
   */
  async notifyNewBid(
    auctionId: string,
    bidAmount: number,
    bidderId: string,
    bidderName: string,
    sellerId: string,
    streamId?: string
  ): Promise<void> {
    try {
      // Get all users who have bid on this auction (to notify them they're outbid)
      const { data: previousBidders } = await supabase
        .from('bids')
        .select('bidder_id')
        .eq('auction_id', auctionId)
        .neq('bidder_id', bidderId)
        .order('created_at', { ascending: false });

      const uniqueBidders = [...new Set(previousBidders?.map(b => b.bidder_id) || [])];

      // Notify seller
      await supabase.from('notifications').insert({
        user_id: sellerId,
        type: NotificationType.NEW_BID,
        title: 'New Bid Received!',
        message: `${bidderName} bid $${bidAmount}`,
        stream_id: streamId,
        auction_id: auctionId,
        metadata: {
          bidAmount,
          bidderName,
        },
      });

      // Notify other bidders they're outbid
      if (uniqueBidders.length > 0) {
        const outbidNotifications = uniqueBidders.map(userId => ({
          user_id: userId,
          type: NotificationType.NEW_BID,
          title: "You've been outbid!",
          message: `New bid: $${bidAmount}`,
          stream_id: streamId,
          auction_id: auctionId,
          metadata: {
            bidAmount,
          },
        }));

        await supabase.from('notifications').insert(outbidNotifications);
      }

      console.log(`✅ Notified seller and ${uniqueBidders.length} bidders about new bid`);
    } catch (error) {
      console.error('❌ Error notifying new bid:', error);
    }
  }

  /**
   * Notify bidders when auction is ending soon (30 seconds remaining)
   */
  async notifyAuctionEndingSoon(
    auctionId: string,
    streamId: string,
    secondsRemaining: number
  ): Promise<void> {
    try {
      // Get all bidders in the auction
      const { data: bidders } = await supabase
        .from('bids')
        .select('bidder_id')
        .eq('auction_id', auctionId);

      const uniqueBidders = [...new Set(bidders?.map(b => b.bidder_id) || [])];

      if (uniqueBidders.length === 0) return;

      const notifications = uniqueBidders.map(userId => ({
        user_id: userId,
        type: NotificationType.AUCTION_ENDING_SOON,
        title: 'Auction Ending Soon!',
        message: `${secondsRemaining} seconds remaining`,
        stream_id: streamId,
        auction_id: auctionId,
        metadata: {
          secondsRemaining,
        },
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`✅ Notified ${uniqueBidders.length} bidders about auction ending soon`);
    } catch (error) {
      console.error('❌ Error notifying auction ending:', error);
    }
  }

  /**
   * Notify winner when they win an auction
   */
  async notifyAuctionWon(
    auctionId: string,
    winnerId: string,
    productTitle: string,
    winningBid: number
  ): Promise<void> {
    try {
      await supabase.from('notifications').insert({
        user_id: winnerId,
        type: NotificationType.AUCTION_WON,
        title: 'You Won! 🎉',
        message: `${productTitle} for $${winningBid}`,
        auction_id: auctionId,
        metadata: {
          productTitle,
          winningBid,
        },
      });

      console.log(`✅ Notified winner about auction win`);
    } catch (error) {
      console.error('❌ Error notifying auction winner:', error);
    }
  }

  /**
   * Notify all viewers when a product is marked as sold
   */
  async notifyProductSold(
    streamId: string,
    productTitle: string,
    soldFor: number,
    buyerName?: string
  ): Promise<void> {
    try {
      // Get all viewers in the stream
      const { data: viewers } = await supabase
        .from('stream_viewers')
        .select('user_id')
        .eq('stream_id', streamId)
        .eq('is_active', true);

      if (!viewers || viewers.length === 0) return;

      const notifications = viewers.map(viewer => ({
        user_id: viewer.user_id,
        type: NotificationType.PRODUCT_SOLD,
        title: 'SOLD!',
        message: `${productTitle} ${buyerName ? `to ${buyerName}` : ''} for $${soldFor}`,
        stream_id: streamId,
        metadata: {
          productTitle,
          soldFor,
          buyerName,
        },
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`✅ Notified ${viewers.length} viewers about product sold`);
    } catch (error) {
      console.error('❌ Error notifying product sold:', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      return count || 0;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
}

export const streamNotificationService = StreamNotificationService.getInstance();
export default streamNotificationService;
