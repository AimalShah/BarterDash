import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { bidsService } from '../lib/api/services/bids';
import { useAuthStore } from '../store/authStore';
import type { NormalizedAuction } from './useStreamAuctions';

export interface UseBiddingReturn {
  currentBid: number;
  isPlacingBid: boolean;
  showBidAlert: boolean;
  placeBid: (amount: number) => Promise<void>;
  placeQuickBid: (increment: number) => Promise<void>;
  dismissBidAlert: () => void;
}

/**
 * Hook to manage bidding for an auction
 * 
 * Features:
 * - Place bids with validation
 * - Real-time bid updates via Supabase
 * - Bid alert notifications
 * - Quick bid buttons (+100, +500, +1000)
 * 
 * @param activeAuction The current active auction
 * @param onBidPlaced Callback when a bid is successfully placed
 * @returns Bidding state and functions
 */
export function useBidding(
  activeAuction: NormalizedAuction | null,
  onBidPlaced?: () => void
): UseBiddingReturn {
  const { profile, user, session } = useAuthStore();
  const userId = profile?.id || user?.id || session?.user?.id;
  
  const [currentBid, setCurrentBid] = useState<number>(() => {
    return activeAuction?.currentBid ?? activeAuction?.startingBid ?? 0;
  });
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showBidAlert, setShowBidAlert] = useState(false);
  
  const bidAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update current bid when auction changes
  useEffect(() => {
    if (activeAuction) {
      const value = activeAuction.currentBid ?? activeAuction.startingBid ?? 0;
      setCurrentBid(value);
    }
  }, [activeAuction?.id, activeAuction?.currentBid]);

  // Subscribe to bid updates
  useEffect(() => {
    if (!activeAuction?.id) return;

    const channel = supabase
      .channel(`auction-bids:${activeAuction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${activeAuction.id}`,
        },
        (payload) => {
          const amount = Number(payload.new?.amount ?? 0);
          
          if (amount > 0) {
            setCurrentBid(amount);
            setShowBidAlert(true);
            
            // Auto-dismiss after 2 seconds
            if (bidAlertTimeoutRef.current) {
              clearTimeout(bidAlertTimeoutRef.current);
            }
            bidAlertTimeoutRef.current = setTimeout(() => {
              setShowBidAlert(false);
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
    };
  }, [activeAuction?.id]);

  /**
   * Place a specific bid amount
   */
  const placeBid = useCallback(async (amount: number) => {
    if (!activeAuction?.id) {
      Alert.alert('No Active Auction', 'There is no live auction right now.');
      return;
    }
    
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to place a bid.');
      return;
    }
    
    if (isPlacingBid) return;

    const minimumIncrement = activeAuction.minimumBidIncrement ?? 1;
    const minimumBid = activeAuction.currentBid + minimumIncrement;
    
    if (amount < minimumBid) {
      Alert.alert(
        'Bid Too Low',
        `Minimum bid is $${minimumBid.toLocaleString()} (current bid + $${minimumIncrement} increment)`
      );
      return;
    }

    try {
      setIsPlacingBid(true);
      
      console.log('[Bidding] Placing bid:', {
        auctionId: activeAuction.id,
        amount,
      });
      
      await bidsService.placeBid({
        auctionId: activeAuction.id,
        amount,
      });
      
      setShowBidAlert(true);
      
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
      bidAlertTimeoutRef.current = setTimeout(() => {
        setShowBidAlert(false);
      }, 2000);
      
      onBidPlaced?.();
      
    } catch (error: any) {
      console.error('[Bidding] Failed to place bid:', error);
      
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to place bid.';
      
      // Show more helpful error message
      if (message.toLowerCase().includes('not found')) {
        Alert.alert(
          'Auction Not Found', 
          'This auction may have ended or been cancelled. Please refresh and try again.'
        );
      } else {
        Alert.alert('Bid Failed', message);
      }
    } finally {
      setIsPlacingBid(false);
    }
  }, [activeAuction, userId, isPlacingBid, onBidPlaced]);

  /**
   * Place a quick bid (current + increment)
   * @param increment Amount to add to current bid
   */
  const placeQuickBid = useCallback(async (increment: number) => {
    console.log('[Bidding] placeQuickBid called:', { 
      increment, 
      activeAuctionId: activeAuction?.id,
      activeAuctionStatus: activeAuction?.status,
      profileId: userId,
      isPlacingBid,
      fullAuction: activeAuction
    });
    
    if (!activeAuction?.id) {
      console.error('[Bidding] No active auction - activeAuction:', activeAuction);
      Alert.alert('No Active Auction', 'There is no live auction right now. Please wait for the seller to start an auction.');
      return;
    }
    
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to place a bid.');
      return;
    }
    
    if (isPlacingBid) {
      console.log('[Bidding] Already placing a bid, skipping');
      return;
    }

    const minimumIncrement = activeAuction.minimumBidIncrement ?? 1;
    const baseBid = activeAuction.currentBid ?? activeAuction.startingBid ?? 0;
    const targetBid = Math.max(baseBid + increment, baseBid + minimumIncrement);

    try {
      setIsPlacingBid(true);
      
      const bidPayload = {
        auction_id: activeAuction.id,
        amount: targetBid,
      };
      
      console.log('[Bidding] Placing bid with payload:', bidPayload);
      
      await bidsService.placeBid(bidPayload);
      
      setShowBidAlert(true);
      
      if (bidAlertTimeoutRef.current) {
        clearTimeout(bidAlertTimeoutRef.current);
      }
      bidAlertTimeoutRef.current = setTimeout(() => {
        setShowBidAlert(false);
      }, 2000);
      
      onBidPlaced?.();
      
    } catch (error: any) {
      console.error('[Bidding] Failed to place bid:', error);
      console.error('[Bidding] Error response:', error?.response?.data);
      console.error('[Bidding] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to place bid.';
      
      // Show more helpful error message
      if (message.toLowerCase().includes('not found')) {
        Alert.alert(
          'Auction Not Found', 
          `Auction ID: ${activeAuction.id}\nThis auction may have ended or been cancelled. Please refresh and try again.`
        );
      } else {
        Alert.alert('Bid Failed', message);
      }
    } finally {
      setIsPlacingBid(false);
    }
  }, [activeAuction, userId, isPlacingBid, onBidPlaced]);

  const dismissBidAlert = useCallback(() => {
    setShowBidAlert(false);
    if (bidAlertTimeoutRef.current) {
      clearTimeout(bidAlertTimeoutRef.current);
    }
  }, []);

  return {
    currentBid,
    isPlacingBid,
    showBidAlert,
    placeBid,
    placeQuickBid,
    dismissBidAlert,
  };
}
