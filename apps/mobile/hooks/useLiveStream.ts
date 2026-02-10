import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { streamsService } from '../lib/api/services/streams';
import { useAuthStore } from '../store/authStore';

export type StreamStatus = 'idle' | 'initializing' | 'live' | 'paused' | 'ended' | 'error';

export interface StreamMessage {
  id: string;
  body: string;
  senderName: string;
  senderId?: string;
  timestamp: number;
  type: 'chat' | 'system';
}

export interface UseLiveStreamReturn {
  streamStatus: StreamStatus;
  viewerCount: number;
  messages: StreamMessage[];
  error: string | null;
  isLoading: boolean;
  joinStream: () => Promise<void>;
  leaveStream: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  refreshViewerCount: () => Promise<void>;
}

interface UseLiveStreamOptions {
  autoJoin?: boolean;
  subscribeToViewerCount?: boolean;
}

export function useLiveStream(
  streamId: string,
  options: UseLiveStreamOptions = {},
): UseLiveStreamReturn {
  const { autoJoin = true, subscribeToViewerCount = true } = options;
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const { profile } = useAuthStore();

  // Join stream and increment viewer count
  const joinStream = useCallback(async () => {
    try {
      if (hasJoined || !streamId) return;

      setIsLoading(true);
      setError(null);

      // Call backend to join and get viewer count
      const result = await streamsService.join(streamId);
      setViewerCount(result.viewerCount);
      setHasJoined(true);
      setStreamStatus('live');

      console.log('✅ Joined stream:', streamId, 'Viewers:', result.viewerCount);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to join stream';
      const errorCode = err?.response?.data?.code;

      if (errorCode === 'VALIDATION_ERROR' && errorMessage === 'Stream is not live') {
        console.warn('⚠️ Stream not live yet:', streamId);
        setStreamStatus('idle');
        return;
      }

      console.error('❌ Failed to join stream:', err);
      setError(errorMessage);
      setStreamStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [streamId, hasJoined]);

  // Leave stream and decrement viewer count
  const leaveStream = useCallback(async () => {
    try {
      if (!hasJoined || !streamId) return;

      // Call backend to leave
      const result = await streamsService.leave(streamId);
      setViewerCount(result.viewerCount);
      setHasJoined(false);
      setStreamStatus('ended');

      // Unsubscribe from Supabase
      supabase.removeChannel(supabase.channel(`stream-viewers:${streamId}`));

      console.log('✅ Left stream:', streamId);
    } catch (err: any) {
      console.error('❌ Failed to leave stream:', err);
    }
  }, [streamId, hasJoined]);

  // Send chat message
  const sendMessage = useCallback(async (text: string) => {
    try {
      if (!streamId || !text.trim()) return;

      const message: StreamMessage = {
        id: `${Date.now()}-${Math.random()}`,
        body: text.trim(),
        senderName: profile?.full_name || profile?.fullName || profile?.username || 'Anonymous',
        senderId: profile?.id,
        timestamp: Date.now(),
        type: 'chat',
      };

      // Add to local messages immediately for instant feedback
      setMessages(prev => [...prev, message]);

      // Send via Supabase or your backend
      // This would typically be sent to a chat service
      console.log('💬 Message sent:', message);
    } catch (err: any) {
      console.error('❌ Failed to send message:', err);
      setError(err.message || 'Failed to send message');
    }
  }, [streamId, profile?.id, profile?.full_name, profile?.fullName, profile?.username]);

  // Refresh viewer count manually
  const refreshViewerCount = useCallback(async () => {
    try {
      if (!streamId) return;
      
      const stream = await streamsService.findById(streamId);
      setViewerCount(stream.viewerCount || 0);
    } catch (err: any) {
      console.error('❌ Failed to refresh viewer count:', err);
    }
  }, [streamId]);

  // Subscribe to viewer count updates
  useEffect(() => {
    if (!streamId || !subscribeToViewerCount) return;

    const subscription = supabase
      .channel(`stream-viewers:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          const newViewerCount = payload.new?.viewer_count || payload.new?.viewerCount || 0;
          setViewerCount(newViewerCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [streamId, subscribeToViewerCount]);

  // Auto-join on mount for viewers
  useEffect(() => {
    if (streamId && autoJoin && !hasJoined) {
      joinStream();
    }

    return () => {
      // Cleanup on unmount
      if (hasJoined) {
        leaveStream();
      }
    };
  }, [streamId, autoJoin, joinStream, leaveStream, hasJoined]);

  return {
    streamStatus,
    viewerCount,
    messages,
    error,
    isLoading,
    joinStream,
    leaveStream,
    sendMessage,
    refreshViewerCount,
  };
}
