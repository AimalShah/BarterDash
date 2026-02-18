import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { listAdminActivity } from '@/features/auth/activity-api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDateTime, toLabel } from '@/lib/format';

const PAGE_SIZE = 15;
const AREA_FILTERS = ['all', 'applications', 'reports', 'refunds'] as const;

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState<(typeof AREA_FILTERS)[number]>('all');

  const query = useQuery({
    queryKey: ['admin-activity', page, areaFilter],
    queryFn: () =>
      listAdminActivity({
        page,
        limit: PAGE_SIZE,
        areas: areaFilter === 'all' ? undefined : [areaFilter],
      }),
    placeholderData: (previous) => previous,
  });

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Admin Activity Log</CardTitle>
        <CardDescription>
          Backend timeline of admin actions across applications, reports, and refunds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="activity-area-filter">Area</Label>
          <select
            id="activity-area-filter"
            value={areaFilter}
            onChange={(event) => {
              setPage(1);
              setAreaFilter(event.target.value as (typeof AREA_FILTERS)[number]);
            }}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {AREA_FILTERS.map((item) => (
              <option key={item} value={item}>
                {toLabel(item)}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Refresh
          </Button>
        </div>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        ) : query.isError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {getApiErrorMessage(query.error)}
          </p>
        ) : (
          <>
            <div className="overflow-auto rounded-xl border border-border/80">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Area</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.items.length ? (
                    query.data.items.map((item) => (
                      <tr key={item.id} className="border-t border-border/70">
                        <td className="px-3 py-2">{formatDateTime(item.at)}</td>
                        <td className="px-3 py-2">
                          <Badge variant="neutral">{toLabel(item.area)}</Badge>
                        </td>
                        <td className="px-3 py-2">{toLabel(item.action)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{item.targetId}</td>
                        <td className="px-3 py-2">{item.actorUsername || item.actorId || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                        No activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Page {query.data?.pagination.page || 1} of {query.data?.pagination.totalPages || 1}{' '}
                ({query.data?.pagination.total || 0} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(query.data?.pagination.page || 1) <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!query.data?.pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
