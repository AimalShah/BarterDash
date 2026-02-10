import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Stream, streamsService } from '../lib/api/services/streams';

interface NewStreamAlert {
  stream: Stream;
  visible: boolean;
}

interface UseRealtimeFeedReturn {
  streams: Stream[];
  newStreamAlert: NewStreamAlert | null;
  loading: boolean;
  refresh: () => Promise<void>;
  dismissNewStreamAlert: () => void;
}

export function useRealtimeFeed(
  initialStatus: 'live' | 'scheduled' | 'ended' | 'all' = 'live'
): UseRealtimeFeedReturn {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [newStreamAlert, setNewStreamAlert] = useState<NewStreamAlert | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial streams
  const fetchStreams = useCallback(async () => {
    try {
      setLoading(true);
      const result = await streamsService.findAll({ 
        status: initialStatus,
        limit: 50,
      });
      setStreams(result);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  }, [initialStatus]);

  // Subscribe to new streams going live
  useEffect(() => {
    // Initial fetch
    fetchStreams();

    // Subscribe to new streams
    const subscription = supabase
      .channel('public:streams')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'streams',
        },
        (payload) => {
          const newStream = payload.new as Stream;
          
          // Only show alert for live streams
          if (newStream.status === 'live') {
            setNewStreamAlert({
              stream: newStream,
              visible: true,
            });
            
            // Add to list if viewing live streams
            if (initialStatus === 'live' || initialStatus === 'all') {
              setStreams(prev => [newStream, ...prev]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
        },
        (payload) => {
          const updatedStream = payload.new as Stream;
          const oldStream = payload.old as Stream;
          
          // Update stream in list
          setStreams(prev =>
            prev.map(s => (s.id === updatedStream.id ? updatedStream : s))
          );
          
          // Show alert if stream just went live
          if (oldStream.status !== 'live' && updatedStream.status === 'live') {
            setNewStreamAlert({
              stream: updatedStream,
              visible: true,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchStreams, initialStatus]);

  // Dismiss the new stream alert
  const dismissNewStreamAlert = useCallback(() => {
    setNewStreamAlert(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  return {
    streams,
    newStreamAlert,
    loading,
    refresh: fetchStreams,
    dismissNewStreamAlert,
  };
}
