import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Database,
  HardDrive,
  Server,
  XCircle,
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
import { getHealthMetrics, getServiceStatus } from '@/features/health/api';

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const config = {
    healthy: { variant: 'success' as const, icon: CheckCircle, text: 'Healthy' },
    degraded: { variant: 'warning' as const, icon: AlertTriangle, text: 'Degraded' },
    unhealthy: { variant: 'danger' as const, icon: XCircle, text: 'Unhealthy' },
  };

  const { variant, icon: Icon, text } = config[status];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {text}
    </Badge>
  );
}

function ServiceCard({
  title,
  status,
  icon: Icon,
  children,
}: {
  title: string;
  status: 'up' | 'down' | 'slow' | 'overloaded';
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const statusColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    slow: 'text-amber-600',
    overloaded: 'text-orange-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <span className={`text-xs font-medium uppercase ${statusColors[status]}`}>{status}</span>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SystemHealthPage() {
  const statusQuery = useQuery({
    queryKey: ['system-status'],
    queryFn: getServiceStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const metricsQuery = useQuery({
    queryKey: ['health-metrics'],
    queryFn: getHealthMetrics,
    refetchInterval: 30000,
  });

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>Real-time monitoring of system components and performance.</CardDescription>
            </div>
            {statusQuery.data && <StatusBadge status={statusQuery.data.status} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              statusQuery.refetch();
              metricsQuery.refetch();
            }}>
              Refresh
            </Button>
            <span className="text-xs text-muted-foreground">
              Last checked: {statusQuery.data?.lastChecked ? new Date(statusQuery.data.lastChecked).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          {statusQuery.data?.issues && statusQuery.data.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              {statusQuery.data.issues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {issue}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {metricsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading metrics...</p>
      ) : metricsQuery.isError ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {getApiErrorMessage(metricsQuery.error)}
        </p>
      ) : metrics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              title="Database"
              status={statusQuery.data?.services.database || 'down'}
              icon={Database}
            >
              <div className="space-y-1 text-sm">
                <p>Response: {metrics.database.responseTime}ms</p>
                <p className={metrics.database.connected ? 'text-emerald-600' : 'text-red-600'}>
                  {metrics.database.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </ServiceCard>

            <ServiceCard
              title="Redis"
              status={statusQuery.data?.services.redis || 'down'}
              icon={Server}
            >
              <div className="space-y-1 text-sm">
                <p>Response: {metrics.redis.responseTime}ms</p>
                <p>Queue Depth: {metrics.redis.queueDepth}</p>
                <p className={metrics.redis.connected ? 'text-emerald-600' : 'text-red-600'}>
                  {metrics.redis.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </ServiceCard>

            <ServiceCard
              title="API"
              status={statusQuery.data?.services.api || 'down'}
              icon={Activity}
            >
              <div className="space-y-1 text-sm">
                <p>Req/min: {metrics.api.requestsPerMinute}</p>
                <p>Avg Response: {metrics.api.averageResponseTime}ms</p>
                <p className={metrics.api.errorRate > 5 ? 'text-red-600' : 'text-emerald-600'}>
                  Error Rate: {metrics.api.errorRate}%
                </p>
              </div>
            </ServiceCard>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Memory</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>Used: {metrics.memory.used} MB</p>
                  <p>Total: {metrics.memory.total} MB</p>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full ${
                        metrics.memory.percentage > 90
                          ? 'bg-red-500'
                          : metrics.memory.percentage > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${metrics.memory.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{metrics.memory.percentage}% used</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>External Services</CardTitle>
              <CardDescription>Status of third-party integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(metrics.externalServices).map(([name, isConnected]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border/80 p-3"
                  >
                    <span className="text-sm font-medium capitalize">{name}</span>
                    <Badge variant={isConnected ? 'success' : 'danger'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span>{Math.floor(metrics.uptime / 3600)}h {Math.floor((metrics.uptime % 3600) / 60)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPU Load (1m/5m/15m)</span>
                <span>{metrics.cpu.loadAvg.map((n) => n.toFixed(2)).join(' / ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(metrics.timestamp).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
