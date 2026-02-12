import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { bidsService } from '../lib/api/services/bids';
import { useAuthStore } from '../store/authStore';
import {
  getMinimumBidIncrement,
  formatBidAmount,
} from '../lib/bidding/utils';

export interface BidState {
  currentBid: number;
  minimumBid: number;
  bidIncrement: number;
  isPlacingBid: boolean;
  lastBidError: string | null;
  timerExtended: boolean;
  newEndsAt: string | null;
}

export interface UseBiddingReturn extends BidState {
  placeBid: () => Promise<boolean>;
  placeCustomBid: (amount: number) => Promise<boolean>;
  placeMaxBid: (maxAmount: number) => Promise<boolean>;
  dismissError: () => void;
  canBid: boolean;
  cannotBidReason: string | null;
  refreshBidState: () => void;
}

export interface NormalizedAuction {
  id: string;
  currentBid?: number;
  startingBid?: number;
  minimumBidIncrement?: number;
  endsAt?: string | Date;
  status?: string;
  mode?: 'normal' | 'sudden_death';
}

export function useBidding(
  activeAuction: NormalizedAuction | null,
  onBidPlaced?: (result: { amount: number; timerExtended: boolean }) => void
): UseBiddingReturn {
  const { profile, user } = useAuthStore();
  const userId = profile?.id || user?.id;

  const [currentBid, setCurrentBid] = useState<number>(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [lastBidError, setLastBidError] = useState<string | null>(null);
  const [timerExtended, setTimerExtended] = useState(false);
  const [newEndsAt, setNewEndsAt] = useState<string | null>(null);

  const auctionRef = useRef(activeAuction);
  const placingBidRef = useRef(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    auctionRef.current = activeAuction;
  }, [activeAuction]);

  useEffect(() => {
    placingBidRef.current = isPlacingBid;
  }, [isPlacingBid]);

  useEffect(() => {
    if (activeAuction) {
      const bid = activeAuction.currentBid ?? activeAuction.startingBid ?? 0;
      setCurrentBid(bid);
      setTimerExtended(false);
      setNewEndsAt(null);
    }
  }, [activeAuction?.id, activeAuction?.currentBid, activeAuction?.startingBid]);

  useEffect(() => {
    if (!activeAuction?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
          if (amount > currentBid) {
            setCurrentBid(amount);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${activeAuction.id}`,
        },
        (payload) => {
          const newCurrentBid = Number(payload.new?.current_bid ?? 0);
          const newEndsAtValue = payload.new?.ends_at as string | undefined;
          const timerExtensions = payload.new?.timer_extensions as number | undefined;
          
          if (newCurrentBid > currentBid) {
            setCurrentBid(newCurrentBid);
          }
          
          if (timerExtensions && timerExtensions > 0) {
            setTimerExtended(true);
            if (newEndsAtValue) {
              setNewEndsAt(newEndsAtValue);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeAuction?.id, currentBid]);

  const auctionIncrement = Number(activeAuction?.minimumBidIncrement ?? 0);
  const computedIncrement = getMinimumBidIncrement(currentBid);
  const bidIncrement = auctionIncrement > 0 ? auctionIncrement : computedIncrement;
  const minimumBid = currentBid + bidIncrement;

  const canBid = Boolean(activeAuction?.id && userId && profile);
  const cannotBidReason = !activeAuction?.id
    ? 'No active auction'
    : !userId
    ? 'Please sign in to bid'
    : !profile
    ? 'Please complete your profile'
    : null;

  const executeBid = useCallback(
    async (amount: number, isMaxBid: boolean = false): Promise<boolean> => {
      const auction = auctionRef.current;

      if (!auction?.id) {
        setLastBidError('No active auction');
        return false;
      }

      if (!userId) {
        setLastBidError('Please sign in to bid');
        Alert.alert('Sign In Required', 'Please sign in to place a bid.');
        return false;
      }

      if (!profile) {
        setLastBidError('Profile required');
        Alert.alert('Profile Required', 'Please complete your profile setup before bidding.');
        return false;
      }

      if (placingBidRef.current) {
        return false;
      }

      if (amount <= 0) {
        const errorMessage = 'Bid must be greater than $0';
        setLastBidError(errorMessage);
        Alert.alert('Bid Failed', errorMessage);
        return false;
      }

      const minimumBidValue = currentBid + bidIncrement;
      if (amount < minimumBidValue) {
        const errorMessage = `Bid must be at least ${formatBidAmount(minimumBidValue)}`;
        setLastBidError(errorMessage);
        Alert.alert('Bid Failed', errorMessage);
        return false;
      }

      try {
        setIsPlacingBid(true);
        setLastBidError(null);

        const payload = {
          auction_id: auction.id,
          amount,
          is_max_bid: isMaxBid,
        };

        const result = await bidsService.placeBid(payload);

        setCurrentBid(amount);

        if (result.timer_extended) {
          setTimerExtended(true);
          if (result.new_ends_at) {
            setNewEndsAt(result.new_ends_at);
          }
        }

        onBidPlaced?.({
          amount,
          timerExtended: result.timer_extended || false,
        });

        return true;
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Failed to place bid';
        const statusCode = error?.response?.status;

        let errorMessage = message;

        if (statusCode === 400) {
          if (message.toLowerCase().includes('minimum')) {
            errorMessage = 'Bid too low - someone else bid higher';
          } else if (message.toLowerCase().includes('ended')) {
            errorMessage = 'Auction has ended';
          } else if (message.toLowerCase().includes('not active')) {
            errorMessage = 'Auction is not active';
          }
        } else if (statusCode === 404) {
          errorMessage = 'Auction not found - may have ended';
        } else if (statusCode === 401) {
          errorMessage = 'Session expired - please sign in again';
        }

        setLastBidError(errorMessage);
        Alert.alert('Bid Failed', errorMessage);

        return false;
      } finally {
        setIsPlacingBid(false);
      }
    },
    [currentBid, bidIncrement, userId, profile, onBidPlaced]
  );

  const placeBid = useCallback(async (): Promise<boolean> => {
    return await executeBid(minimumBid, false);
  }, [executeBid, minimumBid]);

  const placeCustomBid = useCallback(
    async (amount: number): Promise<boolean> => {
      return await executeBid(amount, false);
    },
    [executeBid]
  );

  const placeMaxBid = useCallback(
    async (maxAmount: number): Promise<boolean> => {
      if (maxAmount < minimumBid) {
        const errorMsg = `Max bid must be at least ${formatBidAmount(minimumBid)}`;
        setLastBidError(errorMsg);
        Alert.alert('Invalid Max Bid', errorMsg);
        return false;
      }

      return await executeBid(maxAmount, true);
    },
    [executeBid, minimumBid]
  );

  const dismissError = useCallback(() => {
    setLastBidError(null);
  }, []);

  const refreshBidState = useCallback(() => {
    if (activeAuction) {
      const bid = activeAuction.currentBid ?? activeAuction.startingBid ?? 0;
      setCurrentBid(bid);
      setTimerExtended(false);
      setNewEndsAt(null);
      setLastBidError(null);
    }
  }, [activeAuction]);

  return {
    currentBid,
    minimumBid,
    bidIncrement,
    isPlacingBid,
    lastBidError,
    timerExtended,
    newEndsAt,
    placeBid,
    placeCustomBid,
    placeMaxBid,
    dismissError,
    canBid,
    cannotBidReason,
    refreshBidState,
  };
}
