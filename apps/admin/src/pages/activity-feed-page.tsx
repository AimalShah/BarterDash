import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Shield,
  ShoppingCart,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-client';
import { env } from '@/lib/env';
import type { ActivityEvent } from '@/features/activity/types';

const EVENT_ICONS: Record<string, React.ElementType> = {
  user_signup: UserPlus,
  new_order: ShoppingCart,
  dispute_filed: AlertCircle,
  report_submitted: FileText,
  refund_requested: AlertCircle,
  seller_application: Shield,
  stream_started: Users,
  escrow_held: Shield,
  order_delivered: CheckCircle,
  user_suspended: Shield,
  application_approved: CheckCircle,
  report_resolved: CheckCircle,
};

const EVENT_COLORS: Record<string, string> = {
  user_signup: 'bg-emerald-500/10 text-emerald-600',
  new_order: 'bg-blue-500/10 text-blue-600',
  dispute_filed: 'bg-red-500/10 text-red-600',
  report_submitted: 'bg-amber-500/10 text-amber-600',
  refund_requested: 'bg-orange-500/10 text-orange-600',
  seller_application: 'bg-purple-500/10 text-purple-600',
  stream_started: 'bg-cyan-500/10 text-cyan-600',
  escrow_held: 'bg-indigo-500/10 text-indigo-600',
  order_delivered: 'bg-emerald-500/10 text-emerald-600',
  user_suspended: 'bg-red-500/10 text-red-600',
  application_approved: 'bg-emerald-500/10 text-emerald-600',
  report_resolved: 'bg-emerald-500/10 text-emerald-600',
};

export function ActivityFeedPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fetch recent events on load
  const historyQuery = useQuery({
    queryKey: ['activity-history'],
    queryFn: async () => {
      const response = await fetch(`${env.apiUrl}/health/activity?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch activity history');
      const data = await response.json();
      return data.data as ActivityEvent[];
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setEvents(historyQuery.data);
    }
  }, [historyQuery.data]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `${env.apiUrl.replace('http', 'ws').replace('/api/v1', '')}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      // Subscribe to activity channel
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'activity' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'activity' && message.event) {
          setEvents((prev) => [message.event, ...prev].slice(0, 100));
        } else if (message.type === 'history' && Array.isArray(message.events)) {
          setEvents((prev) => [...message.events, ...prev].slice(0, 100));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = () => {
      setConnectionError('WebSocket connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const getEventIcon = (type: string) => {
    const Icon = EVENT_ICONS[type] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time Activity Feed</CardTitle>
              <CardDescription>Live updates on platform activity</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'success' : 'danger'}>
                {isConnected ? 'Live' : 'Disconnected'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => historyQuery.refetch()}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
          {connectionError && (
            <p className="mt-2 text-sm text-danger">{connectionError}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {historyQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : historyQuery.isError ? (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {getApiErrorMessage(historyQuery.error)}
              </p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border border-border/80 p-3"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      EVENT_COLORS[event.type] || 'bg-secondary'
                    }`}
                  >
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{event.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.actorName && (
                      <p className="text-xs text-muted-foreground">
                        By: {event.actorName}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
