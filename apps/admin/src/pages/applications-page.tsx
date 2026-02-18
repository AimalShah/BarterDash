import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  approveApplication,
  fetchIdentityStatus,
  listAdminApplications,
  mockApproveApplication,
  rejectApplication,
} from '@/features/applications/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDateTime, toLabel } from '@/lib/format';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';
import type { SellerIdentityStatus } from '@/types/admin';

const PAGE_SIZE = 10;
const APPLICATION_FILTERS = [
  'all',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'more_info_needed',
] as const;

export function ApplicationsPage() {
  const applicationId = useAdminWorkspaceStore((state) => state.applicationId);
  const setApplicationId = useAdminWorkspaceStore((state) => state.setApplicationId);
  const pushActivity = useAdminWorkspaceStore((state) => state.pushActivity);

  const [identityStatus, setIdentityStatus] = useState<SellerIdentityStatus | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<(typeof APPLICATION_FILTERS)[number]>('all');

  const listQuery = useQuery({
    queryKey: ['admin-applications', page, statusFilter],
    queryFn: () =>
      listAdminApplications({
        page,
        limit: PAGE_SIZE,
        statuses: statusFilter === 'all' ? undefined : [statusFilter],
      }),
    placeholderData: (previous) => previous,
  });

  const lookupMutation = useMutation({
    mutationFn: fetchIdentityStatus,
    onSuccess: (data) => {
      setIdentityStatus(data);
      setFeedback({ type: 'success', text: 'Identity status loaded' });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      setIdentityStatus(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: (message) => {
      setFeedback({ type: 'success', text: message });
      listQuery.refetch();
      pushActivity({
        area: 'applications',
        action: 'approve',
        targetId: applicationId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'applications',
        action: 'approve',
        targetId: applicationId,
        outcome: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectApplication,
    onSuccess: (message) => {
      setFeedback({ type: 'success', text: message });
      listQuery.refetch();
      pushActivity({
        area: 'applications',
        action: 'reject',
        targetId: applicationId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'applications',
        action: 'reject',
        targetId: applicationId,
        outcome: 'error',
      });
    },
  });

  const mockApproveMutation = useMutation({
    mutationFn: mockApproveApplication,
    onSuccess: (message) => {
      setFeedback({ type: 'success', text: message });
      listQuery.refetch();
      pushActivity({
        area: 'applications',
        action: 'mock approve',
        targetId: applicationId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'applications',
        action: 'mock approve',
        targetId: applicationId,
        outcome: 'error',
      });
    },
  });

  const hasApplicationId = applicationId.trim().length > 0;
  const isMutating =
    lookupMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    mockApproveMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Application Queue</CardTitle>
          <CardDescription>
            Live, paginated application list for admin review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="app-status-filter">Status</Label>
            <select
              id="app-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as (typeof APPLICATION_FILTERS)[number]);
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {APPLICATION_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {toLabel(status)}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
              Refresh
            </Button>
          </div>

          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading applications...</p>
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
                      <th className="px-3 py-2">Application</th>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Status</th>
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
                            {item.user?.username || item.userId.slice(0, 8)}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="neutral">{toLabel(item.status)}</Badge>
                          </td>
                          <td className="px-3 py-2">{formatDateTime(item.updatedAt)}</td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setApplicationId(item.id)}
                            >
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                          No applications found for this filter.
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seller Application Review</CardTitle>
            <CardDescription>
              Inspect verification status and run approve/reject actions.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="application-id">Application ID</Label>
              <Input
                id="application-id"
                placeholder="UUID"
                value={applicationId}
                onChange={(event) => setApplicationId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Optional notes attached to review outcome"
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Input
                id="rejection-reason"
                placeholder="Required for reject action"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
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
                disabled={!hasApplicationId || isMutating}
                onClick={() => lookupMutation.mutate(applicationId)}
              >
                Load identity status
              </Button>
              <Button
                disabled={!hasApplicationId || isMutating}
                onClick={() =>
                  approveMutation.mutate({
                    applicationId,
                    adminNotes,
                  })
                }
              >
                Approve
              </Button>
              <Button
                variant="danger"
                disabled={!hasApplicationId || !rejectionReason.trim() || isMutating}
                onClick={() =>
                  rejectMutation.mutate({
                    applicationId,
                    rejectionReason,
                    adminNotes,
                  })
                }
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                disabled={!hasApplicationId || isMutating}
                onClick={() => mockApproveMutation.mutate(applicationId)}
              >
                Mock approve (testing)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identity Snapshot</CardTitle>
            <CardDescription>
              Loaded from `/sellers/applications/:id/identity`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!identityStatus ? (
              <p className="text-sm text-muted-foreground">
                No application selected yet. Load an application ID to inspect identity data.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">
                    Status: {toLabel(String(identityStatus.applicationStatus || 'unknown'))}
                  </Badge>
                  <Badge variant="default">
                    Verified: {identityStatus.identityVerified ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                  <p>
                    <span className="font-semibold">User ID:</span>{' '}
                    {String(identityStatus.userId || 'N/A')}
                  </p>
                  <p>
                    <span className="font-semibold">Seller details ID:</span>{' '}
                    {String(identityStatus.sellerDetailsId || 'N/A')}
                  </p>
                </div>

                <details className="rounded-xl border border-border/80 bg-background/60 p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Raw payload
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                    {JSON.stringify(identityStatus, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
