import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listAdminActivity } from '@/features/auth/activity-api';
import { formatDateTime, toLabel } from '@/lib/format';
import { useAuthStore } from '@/store/auth-store';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';

export function OverviewPage() {
  const profile = useAuthStore((state) => state.profile);
  const recentActivity = useAdminWorkspaceStore((state) => state.recentActivity);
  const clearActivity = useAdminWorkspaceStore((state) => state.clearActivity);
  const backendActivityQuery = useQuery({
    queryKey: ['overview-admin-activity'],
    queryFn: () => listAdminActivity({ page: 1, limit: 6 }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Current account</CardDescription>
            <CardTitle>{profile?.username || profile?.email || 'Admin'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{profile?.role || 'ADMIN'}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Recent actions</CardDescription>
            <CardTitle>{backendActivityQuery.data?.pagination.total || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">From backend admin activity feed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Claims & Disputes</CardDescription>
            <CardTitle>Escrow resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Handle disputed escrows and resolve with release or refund.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>User operations</CardDescription>
            <CardTitle>Access & moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage user roles, account status, and moderation actions.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>Jump into your review workstreams.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/analytics">View analytics</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/applications">Review applications</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/disputes">Resolve disputes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/reports">Moderate reports</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/refunds">Process refunds</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/users">Manage users</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/activity">View activity log</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest backend activity entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {backendActivityQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading activity...</p>
            ) : backendActivityQuery.data?.items.length ? (
              backendActivityQuery.data.items.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success">{toLabel(entry.area)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {toLabel(entry.action)}
                  </p>
                  <p className="text-xs text-muted-foreground">Target ID: {entry.targetId}</p>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No actions yet. Process moderation workflows to populate this feed.
              </p>
            ) : (
              recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={entry.outcome === 'success' ? 'success' : 'danger'}>
                      {entry.outcome}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {toLabel(entry.area)}: {entry.action}
                  </p>
                  <p className="text-xs text-muted-foreground">Target ID: {entry.targetId}</p>
                </div>
              ))
            )}

            {recentActivity.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearActivity}>
                Clear activity log
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
