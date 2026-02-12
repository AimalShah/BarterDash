import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { auctionsService } from '../lib/api/services/auctions';

export interface NormalizedAuction {
  id: string;
  streamId: string;
  productId: string;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  minimumBidIncrement: number;
  endsAt: string | Date;
  status: string;
  currentBidderId?: string;
  product?: any;
  currentBidder?: any;
  mode?: 'normal' | 'sudden_death';
}

export interface UseStreamAuctionsReturn {
  activeAuction: NormalizedAuction | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshAuction: (auctionId: string) => Promise<void>;
}

function normalizeAuction(raw: any): NormalizedAuction | null {
  if (!raw) {
    console.log('[useStreamAuctions] normalizeAuction called with null/undefined');
    return null;
  }
  
  // Handle both snake_case and camelCase
  const id = raw.id;
  const streamId = raw.streamId ?? raw.stream_id;
  const productId = raw.productId ?? raw.product_id;
  const startingBid = Number(raw.startingBid ?? raw.starting_bid ?? 0);
  const currentBidValue = raw.currentBid ?? raw.current_bid;
  const bidCount = Number(raw.bidCount ?? raw.bid_count ?? 0);
  const minimumBidIncrement = Number(raw.minimumBidIncrement ?? raw.minimum_bid_increment ?? 1);
  const endsAt = raw.endsAt ?? raw.ends_at;
  const status = raw.status;
  const currentBidderId = raw.currentBidderId ?? raw.current_bidder_id;
  
  // Ensure ID is a valid string
  if (!id || typeof id !== 'string') {
    console.error('[useStreamAuctions] Invalid auction ID:', id, 'Raw:', raw);
    return null;
  }
  
  console.log('[useStreamAuctions] Normalizing auction:', { 
    id, 
    status, 
    streamId, 
    productId,
    startingBid,
    currentBid: currentBidValue,
    endsAt 
  });
  
  const normalized: NormalizedAuction = {
    id,
    streamId,
    productId,
    startingBid,
    currentBid: currentBidValue !== null && currentBidValue !== undefined ? Number(currentBidValue) : startingBid,
    bidCount,
    minimumBidIncrement,
    endsAt,
    status,
    currentBidderId,
    product: raw.product,
    currentBidder: raw.currentBidder,
    mode: raw.mode || 'normal',
  };
  
  console.log('[useStreamAuctions] Normalized result:', normalized);
  return normalized;
}

export function useStreamAuctions(streamId: string): UseStreamAuctionsReturn {
  const [activeAuction, setActiveAuction] = useState<NormalizedAuction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeAuctionRef = useRef<NormalizedAuction | null>(null);
  
  useEffect(() => {
    activeAuctionRef.current = activeAuction;
  }, [activeAuction]);

  const fetchActiveAuction = useCallback(async (options?: { silent?: boolean }) => {
    if (!streamId) {
      console.log('[useStreamAuctions] No streamId provided');
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      console.log('[useStreamAuctions] Fetching auctions for stream:', streamId);
      const auctions = await auctionsService.findByStream(streamId);
      console.log('[useStreamAuctions] Fetched auctions:', auctions?.length || 0, 'auctions:', auctions);
      
      // Find auction that is active/live and hasn't ended
      const now = new Date();
      const active = (auctions || []).find((auction: any) => {
        const isActiveStatus = ['active', 'live'].includes(auction.status);
        const hasNotEnded = auction.endsAt ? new Date(auction.endsAt) > now : true;
        console.log('[useStreamAuctions] Checking auction:', auction.id, 'status:', auction.status, 'isActive:', isActiveStatus, 'hasNotEnded:', hasNotEnded, 'endsAt:', auction.endsAt);
        return isActiveStatus && hasNotEnded;
      });
      
      if (!active) {
        console.log('[useStreamAuctions] No active auction found');
        setActiveAuction(null);
      } else {
        console.log('[useStreamAuctions] Found active auction:', active.id);
        const normalized = normalizeAuction(active);
        console.log('[useStreamAuctions] Normalized auction:', normalized);
        setActiveAuction(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch active auction:', err);
      setError('Failed to load auction information');
      setActiveAuction(null);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [streamId]);

  const refreshAuction = useCallback(async (auctionId: string) => {
    try {
      const auction = await auctionsService.findById(auctionId);
      const normalized = normalizeAuction(auction);
      setActiveAuction(normalized);
    } catch (err) {
      console.error('Failed to refresh auction:', err);
    }
  }, []);

  useEffect(() => {
    if (!streamId) return;
    
    fetchActiveAuction();

    const pollInterval = setInterval(() => {
      fetchActiveAuction({ silent: true });
    }, 5000);

    const channel = supabase
      .channel(`stream-auctions:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const raw = payload.new as any || payload.old as any;
          if (!raw?.id) return;
          
          const status = raw.status;
          const endsAt = raw.ends_at;
          const now = new Date();
          const hasEnded = endsAt ? new Date(endsAt) <= now : false;
          
          console.log('[useStreamAuctions] Realtime update:', { id: raw.id, status, hasEnded });
          
          const normalized = normalizeAuction(raw);
          const current = activeAuctionRef.current;

          // Remove auction if ended, cancelled, or past end time
          if (['ended', 'cancelled'].includes(status) || hasEnded) {
            console.log('[useStreamAuctions] Auction ended/cancelled, removing:', raw.id);
            if (current?.id === raw.id) {
              setActiveAuction(null);
            }
            return;
          }

          // Only show active/live auctions that haven't ended
          if (['active', 'live'].includes(status) && !hasEnded) {
            if (!current || current.id !== raw.id || !current.product) {
              await refreshAuction(raw.id);
              return;
            }
          }

          if (current?.id === raw.id) {
            setActiveAuction((prev: any) =>
              prev
                ? {
                    ...prev,
                    ...normalized,
                    product: prev.product ?? normalized?.product,
                    currentBidder: prev.currentBidder ?? normalized?.currentBidder,
                  }
                : normalized
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [streamId, fetchActiveAuction, refreshAuction]);

  return {
    activeAuction,
    isLoading,
    error,
    refetch: fetchActiveAuction,
    refreshAuction,
  };
}
