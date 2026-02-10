import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { bidsService } from '../lib/api/services/bids';
import { Bid } from '../types';

interface AuctionData {
  currentBid: number;
  currentBidderId?: string;
  bidCount: number;
  status: string;
}

interface UseRealtimeBidsReturn {
  bids: Bid[];
  currentBid: number;
  bidCount: number;
  loading: boolean;
  placingBid: boolean;
  placeBid: (amount: number) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useRealtimeBids(
  auctionId: string | undefined,
  userId: string | undefined
): UseRealtimeBidsReturn {
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidCount, setBidCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  // Fetch initial bids
  const fetchBids = useCallback(async () => {
    if (!auctionId) return;
    
    try {
      setLoading(true);
      const result = await bidsService.getAuctionBids(auctionId);
      setBids(result);
      
      if (result.length > 0) {
        const highestBid = result[0]; // Assuming sorted by amount desc
        setCurrentBid(highestBid.amount);
        setBidCount(result.length);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Subscribe to bid updates
  useEffect(() => {
    if (!auctionId) return;

    // Initial fetch
    fetchBids();

    // Subscribe to new bids
    const bidsSubscription = supabase
      .channel(`bids:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          const newBid = payload.new as Bid;
          
          setBids(prev => [newBid, ...prev]);
          setCurrentBid(newBid.amount);
          setBidCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Subscribe to auction updates (current bid changes)
    const auctionSubscription = supabase
      .channel(`auction:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const auction = payload.new as AuctionData;
          
          if (auction.currentBid !== undefined) {
            setCurrentBid(auction.currentBid);
          }
          if (auction.bidCount !== undefined) {
            setBidCount(auction.bidCount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bidsSubscription);
      supabase.removeChannel(auctionSubscription);
    };
  }, [auctionId, fetchBids]);

  // Place bid - quick success/fail (no optimistic UI)
  const placeBid = useCallback(async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!auctionId || !userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setPlacingBid(true);
      
      // Direct API call - no optimistic update
      await bidsService.placeBid({
        auctionId,
        amount,
      });
      
      // Success - realtime will update the UI
      return { success: true };
    } catch (error: any) {
      console.error('Failed to place bid:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to place bid' 
      };
    } finally {
      setPlacingBid(false);
    }
  }, [auctionId, userId]);

  return {
    bids,
    currentBid,
    bidCount,
    loading,
    placingBid,
    placeBid,
    refresh: fetchBids,
  };
}
