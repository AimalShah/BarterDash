import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchRefund,
  fetchRefundsByOrder,
  listAdminRefunds,
  processRefund,
} from '@/features/refunds/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDateTime, toLabel } from '@/lib/format';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';
import type { RefundRecord } from '@/types/admin';

const PAGE_SIZE = 10;
const REFUND_FILTERS = ['all', 'pending', 'processing', 'approved', 'rejected', 'completed'] as const;

export function RefundsPage() {
  const refundId = useAdminWorkspaceStore((state) => state.refundId);
  const orderId = useAdminWorkspaceStore((state) => state.orderId);
  const setRefundId = useAdminWorkspaceStore((state) => state.setRefundId);
  const setOrderId = useAdminWorkspaceStore((state) => state.setOrderId);
  const pushActivity = useAdminWorkspaceStore((state) => state.pushActivity);

  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [refund, setRefund] = useState<RefundRecord | null>(null);
  const [orderRefunds, setOrderRefunds] = useState<RefundRecord[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<(typeof REFUND_FILTERS)[number]>('all');

  const listQuery = useQuery({
    queryKey: ['admin-refunds', page, statusFilter],
    queryFn: () =>
      listAdminRefunds({
        page,
        limit: PAGE_SIZE,
        statuses: statusFilter === 'all' ? undefined : [statusFilter],
      }),
    placeholderData: (previous) => previous,
  });

  const loadRefundMutation = useMutation({
    mutationFn: fetchRefund,
    onSuccess: (data) => {
      setRefund(data);
      setFeedback({ type: 'success', text: 'Refund loaded' });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      setRefund(null);
    },
  });

  const loadOrderRefundsMutation = useMutation({
    mutationFn: fetchRefundsByOrder,
    onSuccess: (data) => {
      setOrderRefunds(data);
      setFeedback({ type: 'success', text: `Loaded ${data.length} order refund record(s)` });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      setOrderRefunds([]);
    },
  });

  const processMutation = useMutation({
    mutationFn: processRefund,
    onSuccess: (message) => {
      setFeedback({ type: 'success', text: message });
      listQuery.refetch();
      pushActivity({
        area: 'refunds',
        action: `set ${status}`,
        targetId: refundId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'refunds',
        action: `set ${status}`,
        targetId: refundId,
        outcome: 'error',
      });
    },
  });

  const hasRefundId = refundId.trim().length > 0;
  const hasOrderId = orderId.trim().length > 0;
  const isBusy =
    listQuery.isFetching ||
    loadRefundMutation.isPending ||
    loadOrderRefundsMutation.isPending ||
    processMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Refund Queue</CardTitle>
          <CardDescription>
            Paginated admin refund list from `/refunds`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="refund-status-filter">Status</Label>
            <select
              id="refund-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as (typeof REFUND_FILTERS)[number]);
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {REFUND_FILTERS.map((item) => (
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
            <p className="text-sm text-muted-foreground">Loading refunds...</p>
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
                      <th className="px-3 py-2">Refund</th>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Updated</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listQuery.data?.items.length ? (
                      listQuery.data.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/70">
                          <td className="px-3 py-2 font-mono text-xs">{item.id}</td>
                          <td className="px-3 py-2 font-mono text-xs">{String(item.orderId || 'N/A')}</td>
                          <td className="px-3 py-2">
                            <Badge variant="neutral">{toLabel(String(item.status || 'pending'))}</Badge>
                          </td>
                          <td className="px-3 py-2">{formatCurrency(item.amount)}</td>
                          <td className="px-3 py-2">{formatDateTime(item.updatedAt)}</td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRefundId(item.id);
                                loadRefundMutation.mutate(item.id);
                              }}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                          No refunds found.
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

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Refund Processing</CardTitle>
            <CardDescription>
              Fetch by refund/order ID and apply approve or reject decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-id">Refund ID</Label>
              <Input
                id="refund-id"
                placeholder="UUID"
                value={refundId}
                onChange={(event) => setRefundId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-id">Order ID</Label>
              <Input
                id="order-id"
                placeholder="UUID"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-status">Decision</Label>
              <select
                id="refund-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'approved' | 'rejected')}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-notes">Notes</Label>
              <Textarea
                id="refund-notes"
                placeholder="Decision notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {feedback ? (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  feedback.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    : 'border border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {feedback.text}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                disabled={!hasRefundId || isBusy}
                onClick={() => loadRefundMutation.mutate(refundId)}
              >
                Load refund
              </Button>
              <Button
                variant="outline"
                disabled={!hasOrderId || isBusy}
                onClick={() => loadOrderRefundsMutation.mutate(orderId)}
              >
                Load order refunds
              </Button>
              <Button
                className="sm:col-span-2"
                disabled={!hasRefundId || isBusy}
                onClick={() =>
                  processMutation.mutate({
                    refundId,
                    status,
                    notes,
                  })
                }
              >
                Process refund
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refund Data</CardTitle>
            <CardDescription>Current fetched details and order-level history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {refund ? (
              <div className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="warning">{toLabel(String(refund.status || 'requested'))}</Badge>
                  <Badge variant="neutral">Amount: {formatCurrency(refund.amount)}</Badge>
                </div>
                <p className="text-muted-foreground">Reason: {String(refund.reason || 'N/A')}</p>
                <p className="text-muted-foreground">Updated: {formatDateTime(refund.updatedAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No individual refund loaded.</p>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Order refund records</h3>
              {orderRefunds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No order refunds loaded.</p>
              ) : (
                orderRefunds.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{entry.id}</Badge>
                      <Badge variant="warning">{toLabel(String(entry.status || 'unknown'))}</Badge>
                      <Badge variant="default">{formatCurrency(entry.amount)}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
