import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { streamsService, Stream } from '../lib/api/services/streams';

export function useStream(streamId: string | undefined) {
    const [stream, setStream] = useState<Stream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStream = useCallback(async () => {
        if (!streamId) return;
        
        try {
            setLoading(true);
            setError(null);
            const data = await streamsService.findById(streamId);
            setStream(data);
        } catch (err) {
            console.error('Error fetching stream:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch stream'));
        } finally {
            setLoading(false);
        }
    }, [streamId]);

    useEffect(() => {
        if (!streamId) {
            setStream(null);
            setLoading(false);
            return;
        }

        fetchStream();

        // Subscribe to stream updates via Supabase Realtime
        const channel = supabase.channel(`stream_status_${streamId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'streams',
                filter: `id=eq.${streamId}`
            }, (payload) => {
                setStream(prev => prev ? { ...prev, ...payload.new } : payload.new as Stream);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, fetchStream]);

    const refetch = useCallback(() => {
        fetchStream();
    }, [fetchStream]);

    return { stream, loading, error, refetch };
}
