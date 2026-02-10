import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { streamsService } from '../lib/api/services/streams';

interface UseRealtimeViewerCountReturn {
  viewerCount: number;
  peakViewerCount: number;
  loading: boolean;
}

export function useRealtimeViewerCount(
  streamId: string | undefined,
  isLive: boolean
): UseRealtimeViewerCountReturn {
  const [viewerCount, setViewerCount] = useState(0);
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Join stream when it becomes live
  useEffect(() => {
    if (!streamId || !isLive || hasJoined) return;

    const joinStream = async () => {
      try {
        setLoading(true);
        const result = await streamsService.join(streamId);
        setViewerCount(result.viewerCount);
        setHasJoined(true);
      } catch (error) {
        console.error('Failed to join stream:', error);
      } finally {
        setLoading(false);
      }
    };

    joinStream();

    // Leave stream on cleanup
    return () => {
      if (hasJoined) {
        streamsService.leave(streamId).catch((error) => {
          console.error('Failed to leave stream:', error);
        });
      }
    };
  }, [streamId, isLive, hasJoined]);

  // Subscribe to viewer count changes via Supabase Realtime
  useEffect(() => {
    if (!streamId) return;

    const subscription = supabase
      .channel(`stream_viewers:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          const newData = payload.new as { viewerCount?: number; peakViewerCount?: number };
          
          if (newData.viewerCount !== undefined) {
            setViewerCount(newData.viewerCount);
          }
          if (newData.peakViewerCount !== undefined) {
            setPeakViewerCount(newData.peakViewerCount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [streamId]);

  return {
    viewerCount,
    peakViewerCount,
    loading,
  };
}
