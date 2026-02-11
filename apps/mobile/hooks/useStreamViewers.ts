import { useState, useEffect, useCallback } from "react";
import { streamsService } from "../lib/api/services/streams";

export interface ViewerProfile {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  joinedAt: Date;
}

interface UseStreamViewersReturn {
  viewers: ViewerProfile[];
  viewerCount: number;
  isLoading: boolean;
  error: string | null;
  refreshViewers: () => Promise<void>;
}

export function useStreamViewers(streamId: string): UseStreamViewersReturn {
  const [viewers, setViewers] = useState<ViewerProfile[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViewers = useCallback(async () => {
    if (!streamId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, fetch basic viewer count from stream stats
      // In production, this would fetch actual viewer profiles from a real-time service
      const streamStats = await streamsService.getStreamStats(streamId).catch(() => null);
      
      if (streamStats?.viewerCount) {
        setViewerCount(streamStats.viewerCount);
        
        // Generate mock viewer profiles based on count
        // In production, replace with actual viewer data from WebSocket/Realtime
        const mockViewers: ViewerProfile[] = Array.from(
          { length: Math.min(streamStats.viewerCount, 10) },
          (_, i) => ({
            id: `viewer_${i}`,
            username: `viewer_${Math.floor(Math.random() * 10000)}`,
            joinedAt: new Date(Date.now() - Math.random() * 3600000),
          })
        );
        
        setViewers(mockViewers);
      } else {
        setViewerCount(0);
        setViewers([]);
      }
    } catch (err: any) {
      console.error("Error fetching viewers:", err);
      setError("Failed to fetch viewers");
      setViewerCount(0);
      setViewers([]);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    fetchViewers();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchViewers, 10000);
    
    return () => clearInterval(interval);
  }, [fetchViewers]);

  return {
    viewers,
    viewerCount,
    isLoading,
    error,
    refreshViewers: fetchViewers,
  };
}
