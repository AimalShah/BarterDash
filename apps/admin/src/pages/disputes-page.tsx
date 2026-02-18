import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  listAdminDisputes,
  resolveAdminDispute,
} from '@/features/disputes/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDateTime, toLabel } from '@/lib/format';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';

const PAGE_SIZE = 10;
const DISPUTE_FILTERS = [
  'all',
  'disputed',
  'held',
  'refunding',
  'released',
  'refunded',
] as const;

export function DisputesPage() {
  const pushActivity = useAdminWorkspaceStore((state) => state.pushActivity);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<(typeof DISPUTE_FILTERS)[number]>('all');
  const [selectedEscrowId, setSelectedEscrowId] = useState('');
  const [resolution, setResolution] = useState<'release' | 'refund'>('release');
  const [reason, setReason] = useState('dispute_resolved');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-disputes', page, statusFilter],
    queryFn: () =>
      listAdminDisputes({
        page,
        limit: PAGE_SIZE,
        statuses: statusFilter === 'all' ? undefined : [statusFilter],
      }),
    placeholderData: (previous) => previous,
  });

  const resolveMutation = useMutation({
    mutationFn: resolveAdminDispute,
    onSuccess: (data) => {
      setFeedback({
        type: 'success',
        text: `Dispute ${data.escrowId} resolved via ${data.resolution}`,
      });
      listQuery.refetch();
      pushActivity({
        area: 'disputes',
        action: data.resolution,
        targetId: data.escrowId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'disputes',
        action: resolution,
        targetId: selectedEscrowId,
        outcome: 'error',
      });
    },
  });

  const isBusy = listQuery.isFetching || resolveMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Claims & Disputes</CardTitle>
          <CardDescription>
            Review escrow disputes and resolve with release or refund actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="dispute-filter">Status</Label>
            <select
              id="dispute-filter"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as (typeof DISPUTE_FILTERS)[number]);
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {DISPUTE_FILTERS.map((item) => (
                <option key={item} value={item}>
                  {toLabel(item)}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
              Refresh
            </Button>
          </div>

          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading disputes...</p>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {getApiErrorMessage(listQuery.error)}
            </p>
          ) : (
            <>
              <div className="overflow-auto rounded-xl border border-border/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Escrow</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Dispute ID</th>
                      <th className="px-3 py-2">Updated</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listQuery.data?.items.length ? (
                      listQuery.data.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/70">
                          <td className="px-3 py-2 font-mono text-xs">{item.id}</td>
                          <td className="px-3 py-2">
                            <Badge variant="warning">{toLabel(item.status)}</Badge>
                          </td>
                          <td className="px-3 py-2">{formatCurrency(item.amount)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{item.disputeId || 'N/A'}</td>
                          <td className="px-3 py-2">{formatDateTime(item.updatedAt)}</td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEscrowId(item.id)}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                          No disputes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Page {listQuery.data?.pagination.page || 1} of{' '}
                  {listQuery.data?.pagination.totalPages || 1} ({listQuery.data?.pagination.total || 0}{' '}
                  total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(listQuery.data?.pagination.page || 1) <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!listQuery.data?.pagination.hasNextPage}
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

      <Card>
        <CardHeader>
          <CardTitle>Resolve Dispute</CardTitle>
          <CardDescription>
            Choose a selected escrow dispute and decide release or refund.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="escrow-id">Escrow ID</Label>
              <Input
                id="escrow-id"
                placeholder="UUID"
                value={selectedEscrowId}
                onChange={(event) => setSelectedEscrowId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <select
                id="resolution"
                value={resolution}
                onChange={(event) =>
                  setResolution(event.target.value as 'release' | 'refund')
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="release">Release to seller</option>
                <option value="refund">Refund to buyer</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-reason">Reason</Label>
            <Input
              id="resolution-reason"
              placeholder="Reason for decision"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          {feedback ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border border-danger/30 bg-danger/10 text-danger'
              }`}
            >
              {feedback.text}
            </p>
          ) : null}

          <Button
            disabled={!selectedEscrowId || !reason.trim() || isBusy}
            onClick={() =>
              resolveMutation.mutate({
                escrowId: selectedEscrowId,
                resolution,
                reason,
              })
            }
          >
            Resolve Dispute
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
